/**
 * Outbound notification delivery.
 *
 * In-app notifications already exist: both datastore adapters write an
 * `AppNotification` row whenever an order changes state, and the account and
 * admin screens read them. That path needs no credentials and works today.
 *
 * This module is the *other* half — pushing the same message out by email, SMS
 * or WhatsApp. Every one of those needs a paid provider account, so nothing here
 * pretends to send anything. `dispatch` reports exactly which channels are
 * configured and returns `skipped` for the rest, and the admin Settings screen
 * surfaces that so the owner can see at a glance what is live (§55, §64).
 *
 * SERVER ONLY — provider keys must never reach the browser.
 */
import type { AppNotification, NotificationTopic, Order, Settings } from '../data/types';
import { formatMoney } from '../format';

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
  const configured = Boolean(provider && process.env.EMAIL_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
  return {
    channel: 'email',
    configured,
    provider,
    requirement: configured ? null : 'Set EMAIL_PROVIDER, EMAIL_API_KEY and EMAIL_FROM.',
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
 *
 * To make a channel live, implement its `send*` function below against the
 * provider's API. The abstraction, the call site and the environment variables
 * already exist — only the HTTP call is missing.
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
    results.push(await send(status, address, notification));
  }

  return results;
}

async function send(
  status: ChannelStatus,
  address: string,
  notification: AppNotification,
): Promise<DispatchResult> {
  try {
    switch (status.channel) {
      case 'email':
        return await sendEmail(address, notification);
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
 * Implement against your transactional email provider (Resend, Postmark, SES).
 * Keep the request server-side; EMAIL_API_KEY is a secret.
 */
async function sendEmail(to: string, notification: AppNotification): Promise<DispatchResult> {
  void to;
  void notification;
  return {
    channel: 'email',
    outcome: 'failed',
    detail: `EMAIL_PROVIDER is set to "${process.env.EMAIL_PROVIDER}" but sendEmail() in src/lib/domain/notifications.ts has no implementation for it yet.`,
  };
}

/** Implement against an Indian transactional SMS provider (MSG91, Gupshup, Kaleyra). */
async function sendSms(to: string, notification: AppNotification): Promise<DispatchResult> {
  void to;
  void notification;
  return {
    channel: 'sms',
    outcome: 'failed',
    detail: `SMS_PROVIDER is set to "${process.env.SMS_PROVIDER}" but sendSms() in src/lib/domain/notifications.ts has no implementation for it yet.`,
  };
}

/** Implement against the WhatsApp Cloud API using an approved template. */
async function sendWhatsApp(to: string, notification: AppNotification): Promise<DispatchResult> {
  void to;
  void notification;
  return {
    channel: 'whatsapp',
    outcome: 'failed',
    detail: 'WhatsApp credentials are present but sendWhatsApp() in src/lib/domain/notifications.ts has no implementation yet.',
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
  // Only offer a phone number if the business has actually given us one.
  lines.push(settings.supportPhone ? `Questions? ${settings.supportPhone}` : `Questions? ${settings.supportEmail}`);
  return lines.join('\n');
}

/**
 * The prefilled WhatsApp support link (§56).
 *
 * Returns null when no business number is configured. That is not a failure — the
 * seed leaves it blank on purpose, and the floating button hides itself rather
 * than linking to a number nobody answers (§24). Set WHATSAPP_NUMBER, or the
 * number in admin Settings, to turn it on.
 */
export function whatsappSupportUrl(settings: Settings, context?: string): string | null {
  const number = settings.whatsappNumber.replace(/\D/g, '');
  if (number.length < 10) return null;
  const message = context ? `${settings.whatsappMessage}\n\n${context}` : settings.whatsappMessage;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
