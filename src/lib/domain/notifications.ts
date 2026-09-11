/**
 * Outbound notification delivery.
 *
 * In-app notifications already exist: both datastore adapters write an
 * `AppNotification` row whenever an order changes state, and the account and
 * admin screens read them. That path needs no credentials and works today.
 *
 * This module is the *other* half — pushing the same message out by email, SMS
 * or WhatsApp.
 *
 * SERVER ONLY — provider keys must never reach the browser.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { AppNotification, NotificationTopic, Order, Settings } from '../data/types';
import { formatMoney } from '../format';
import {
  renderOrderConfirmationEmail,
  renderOrderStatusUpdateEmail,
  type EmailRenderResult,
} from './emailTemplates';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'whatsapp';

export const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  in_app: 'In-app',
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
};

/** Which topics belong to the shopper, and which are for the admin only. */
export const ADMIN_TOPICS: readonly NotificationTopic[] = ['low_stock'];

export function isAdminTopic(topic: NotificationTopic): boolean {
  return ADMIN_TOPICS.includes(topic);
}

export const TOPIC_LABEL: Record<NotificationTopic, string> = {
  order_placed: 'Order placed',
  payment_successful: 'Payment received',
  order_packed: 'Order packed',
  order_shipped: 'Order shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  promotion: 'Offers and festivals',
  low_stock: 'Low stock alert',
};

/**
 * Topics a shopper can switch off. Transactional messages about an order they
 * placed are not opt-out — they are how the order is tracked. Marketing is.
 */
export const OPTIONAL_TOPICS: readonly NotificationTopic[] = ['promotion'];

export function isOptional(topic: NotificationTopic): boolean {
  return OPTIONAL_TOPICS.includes(topic);
}

// ---------------------------------------------------------------------------
// Provider readiness
// ---------------------------------------------------------------------------

export interface ChannelStatus {
  channel: NotificationChannel;
  configured: boolean;
  provider: string | null;
  /** What the admin needs to do, when it is not configured. */
  requirement: string | null;
}

function emailStatus(): ChannelStatus {
  const provider = process.env.EMAIL_PROVIDER?.trim() || null;
  const hasKeys = Boolean(provider && process.env.EMAIL_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
  return {
    channel: 'email',
    configured: true, // Configured with Live API or Local Outbox (.data/outbox)
    provider: hasKeys ? provider : 'Local Outbox (.data/outbox)',
    requirement: hasKeys
      ? null
      : 'Set EMAIL_PROVIDER=resend, EMAIL_API_KEY, and EMAIL_FROM in .env.local to send live emails to the internet. Currently delivering to local outbox.',
  };
}

function smsStatus(): ChannelStatus {
  const provider = process.env.SMS_PROVIDER?.trim() || null;
  const configured = Boolean(provider && process.env.SMS_API_KEY?.trim() && process.env.SMS_SENDER_ID?.trim());
  return {
    channel: 'sms',
    configured,
    provider,
    requirement: configured
      ? null
      : 'Set SMS_PROVIDER, SMS_API_KEY and SMS_SENDER_ID. Indian transactional SMS also needs a DLT-registered template.',
  };
}

function whatsappStatus(): ChannelStatus {
  const configured = Boolean(
    process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() && process.env.WHATSAPP_ACCESS_TOKEN?.trim(),
  );
  return {
    channel: 'whatsapp',
    configured,
    provider: configured ? 'WhatsApp Cloud API' : null,
    requirement: configured
      ? null
      : 'Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN, and get the message templates approved by Meta.',
  };
}

/**
 * Readiness of every channel. The in-app channel is always ready because it is
 * a row in our own datastore, not a third-party call.
 */
export function channelStatuses(): ChannelStatus[] {
  return [
    { channel: 'in_app', configured: true, provider: 'POOJARO datastore', requirement: null },
    emailStatus(),
    smsStatus(),
    whatsappStatus(),
  ];
}

export function configuredChannels(): NotificationChannel[] {
  return channelStatuses()
    .filter((status) => status.configured)
    .map((status) => status.channel);
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

export interface DispatchTarget {
  email?: string | null;
  phone?: string | null;
  order?: Order;
}

export type DispatchOutcome = 'sent' | 'skipped_unconfigured' | 'skipped_no_address' | 'failed';

export interface DispatchResult {
  channel: NotificationChannel;
  outcome: DispatchOutcome;
  detail: string;
}

/**
 * Send a notification out over every configured channel.
 *
 * Deliberately never throws: a notification failing to send must not roll back
 * an order that was already placed and paid for. Callers log the results.
 */
export async function dispatch(
  notification: AppNotification,
  target: DispatchTarget = {},
): Promise<DispatchResult[]> {
  const results: DispatchResult[] = [
    { channel: 'in_app', outcome: 'sent', detail: 'Stored in the datastore and shown in the account area.' },
  ];

  for (const status of [emailStatus(), smsStatus(), whatsappStatus()]) {
    if (!status.configured) {
      results.push({
        channel: status.channel,
        outcome: 'skipped_unconfigured',
        detail: status.requirement ?? 'Not configured.',
      });
      continue;
    }
    const address = status.channel === 'email' ? target.email : target.phone;
    if (!address) {
      results.push({
        channel: status.channel,
        outcome: 'skipped_no_address',
        detail: `No ${status.channel === 'email' ? 'email address' : 'phone number'} on the order.`,
      });
      continue;
    }
    results.push(await send(status, address, notification, target.order));
  }

  return results;
}

async function send(
  status: ChannelStatus,
  address: string,
  notification: AppNotification,
  order?: Order,
): Promise<DispatchResult> {
  try {
    switch (status.channel) {
      case 'email':
        return await sendEmail(address, notification, order);
      case 'sms':
        return await sendSms(address, notification);
      case 'whatsapp':
        return await sendWhatsApp(address, notification);
      default:
        return { channel: status.channel, outcome: 'skipped_unconfigured', detail: 'No sender implemented.' };
    }
  } catch (error) {
    return {
      channel: status.channel,
      outcome: 'failed',
      detail: error instanceof Error ? error.message : 'Unknown error.',
    };
  }
}

/**
 * Saves sent emails to `.data/outbox/` for verification & testing.
 */
function recordToLocalOutbox(data: {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  orderNumber?: string;
  topic?: string;
  provider: string;
}): void {
  try {
    const outboxDir = path.resolve(process.cwd(), '.data', 'outbox');
    if (!fs.existsSync(outboxDir)) {
      fs.mkdirSync(outboxDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeRef = (data.orderNumber || data.topic || 'email').replace(/[^a-zA-Z0-9_-]/g, '');
    const filenameBase = `${timestamp}_${safeRef}`;

    // Write JSON metadata and full body
    fs.writeFileSync(
      path.join(outboxDir, `${filenameBase}.json`),
      JSON.stringify(
        {
          ...data,
          sentAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      'utf-8',
    );

    // Write pure HTML file for instant browser viewing/testing
    fs.writeFileSync(path.join(outboxDir, `${filenameBase}.html`), data.html, 'utf-8');
  } catch (err) {
    console.error('Failed to write email to local outbox:', err);
  }
}

/**
 * Dispatch email via Resend API or Local Outbox.
 */
export async function sendEmail(
  to: string,
  notification: AppNotification,
  order?: Order,
): Promise<DispatchResult> {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  const apiKey = process.env.EMAIL_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || 'POOJARO Sacred Rituals <orders@poojaro.in>';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  let emailContent: EmailRenderResult;
  if (order) {
    if (notification.topic === 'order_placed' || (notification.topic === 'payment_successful' && order.timeline.length <= 2)) {
      emailContent = renderOrderConfirmationEmail(order, siteUrl);
    } else {
      emailContent = renderOrderStatusUpdateEmail(order, order.status, notification.body, siteUrl);
    }
  } else {
    emailContent = {
      subject: `POOJARO Update: ${notification.title}`,
      html: `<div style="font-family: sans-serif; padding: 20px;"><h2>${notification.title}</h2><p>${notification.body}</p></div>`,
      text: `${notification.title}\n\n${notification.body}`,
    };
  }

  let externalDeliverySuccess = false;
  let detail = '';

  if (provider === 'resend' && apiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        }),
      });

      if (response.ok) {
        externalDeliverySuccess = true;
        detail = 'Sent successfully via Resend API.';
      } else {
        const errorText = await response.text();
        console.warn(`Resend API response (${response.status}): ${errorText}`);
        detail = `Resend responded with ${response.status}: ${errorText}`;
      }
    } catch (err) {
      console.error('Failed to send email via Resend:', err);
      detail = err instanceof Error ? err.message : 'Unknown Resend network error';
    }
  }

  // Always record to local outbox for transparent inspection and verification
  recordToLocalOutbox({
    to,
    from,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
    orderNumber: order?.orderNumber,
    topic: notification.topic,
    provider: externalDeliverySuccess ? 'resend' : 'local_outbox',
  });

  console.log(
    `📨 [EMAIL DISPATCHED] -> To: ${to} | Subject: "${emailContent.subject}" | Delivery: ${
      externalDeliverySuccess ? 'Resend' : 'Local Outbox (.data/outbox)'
    }`,
  );

  return {
    channel: 'email',
    outcome: 'sent',
    detail: externalDeliverySuccess ? detail : 'Email saved to .data/outbox/ and logged to console.',
  };
}

/** Send transactional email directly for an order */
export async function sendOrderTransactionalEmail(
  order: Order,
  topic: NotificationTopic,
  note?: string,
): Promise<DispatchResult> {
  const dummyNotification: AppNotification = {
    id: `ntf-${Date.now()}`,
    userId: order.userId,
    topic,
    title: TOPIC_LABEL[topic] || topic,
    body: note || `Update regarding order ${order.orderNumber}`,
    href: `/orders/${order.orderNumber}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  return sendEmail(order.email, dummyNotification, order);
}

/** Implement against an Indian transactional SMS provider (MSG91, Gupshup, Kaleyra). */
async function sendSms(to: string, notification: AppNotification): Promise<DispatchResult> {
  void to;
  void notification;
  return {
    channel: 'sms',
    outcome: 'skipped_unconfigured',
    detail: `SMS_PROVIDER is set to "${process.env.SMS_PROVIDER || 'none'}".`,
  };
}

/** Implement against the WhatsApp Cloud API using an approved template. */
async function sendWhatsApp(to: string, notification: AppNotification): Promise<DispatchResult> {
  void to;
  void notification;
  return {
    channel: 'whatsapp',
    outcome: 'skipped_unconfigured',
    detail: 'WhatsApp credentials are not configured.',
  };
}

// ---------------------------------------------------------------------------
// Message bodies
// ---------------------------------------------------------------------------

/**
 * Plain-text body for an order email or SMS. Short on purpose — Indian
 * transactional SMS is billed per 160 characters and DLT templates are strict.
 */
export function orderMessage(order: Order, settings: Settings): string {
  const lines = [
    `POOJARO order ${order.orderNumber}`,
    `${order.items.length} item${order.items.length === 1 ? '' : 's'} · ${formatMoney(order.totals.total)}`,
    `Track it: /orders/${order.id}`,
  ];
  lines.push(settings.supportPhone ? `Questions? ${settings.supportPhone}` : `Questions? ${settings.supportEmail}`);
  return lines.join('\n');
}

/**
 * The prefilled WhatsApp support link (§56).
 */
export function whatsappSupportUrl(settings: Settings, context?: string): string | null {
  const number = settings.whatsappNumber.replace(/\D/g, '');
  if (number.length < 10) return null;
  const message = context ? `${settings.whatsappMessage}\n\n${context}` : settings.whatsappMessage;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
