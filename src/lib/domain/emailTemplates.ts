/**
 * POOJARO Sacred Ritual Goods - Transactional Email Templates
 * Responsive HTML + plain-text email generators for order confirmations and status changes.
 */

import type { Order, OrderStatus } from '../data/types';
import { formatMoney } from '../format';
import { ORDER_STATUS_LABEL } from './orders';

export interface EmailRenderResult {
  subject: string;
  html: string;
  text: string;
}

const BRAND_GOLD = '#B78332';
const BRAND_BROWN = '#3A2118';
const BRAND_BG = '#FAF8F3';
const BRAND_CARD = '#FFFFFF';
const BRAND_BORDER = '#E8E1D5';
const BRAND_MUTED = '#7A6E65';

/** Base layout wrapper for all POOJARO transactional emails */
function emailLayout(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${BRAND_BG}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${BRAND_BROWN}; }
    .container { max-width: 600px; margin: 0 auto; background-color: ${BRAND_CARD}; border: 1px solid ${BRAND_BORDER}; border-radius: 8px; overflow: hidden; }
    .header { background-color: ${BRAND_BROWN}; padding: 28px 24px; text-align: center; }
    .logo { font-size: 26px; font-weight: 700; letter-spacing: 2px; color: #FFFFFF; text-decoration: none; text-transform: uppercase; }
    .tagline { color: #E5C384; font-size: 12px; letter-spacing: 1px; margin-top: 4px; text-transform: uppercase; }
    .body-content { padding: 32px 28px; }
    .badge { display: inline-block; padding: 6px 14px; background-color: #FBF4EA; color: ${BRAND_GOLD}; border: 1px solid #E5C384; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
    .table-items { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 24px; }
    .table-items th { text-align: left; padding: 10px 12px; background-color: #F8F5F0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${BRAND_MUTED}; border-bottom: 1px solid ${BRAND_BORDER}; }
    .table-items td { padding: 14px 12px; border-bottom: 1px solid ${BRAND_BORDER}; font-size: 14px; vertical-align: middle; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: ${BRAND_MUTED}; }
    .totals-total { display: flex; justify-content: space-between; padding: 12px 0 0 0; font-size: 18px; font-weight: 700; color: ${BRAND_BROWN}; border-top: 2px solid ${BRAND_BORDER}; margin-top: 8px; }
    .btn { display: inline-block; background-color: ${BRAND_GOLD}; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 15px; text-align: center; margin: 20px 0; letter-spacing: 0.5px; }
    .card-box { background-color: #FAF8F3; border: 1px solid ${BRAND_BORDER}; border-radius: 6px; padding: 18px; margin: 18px 0; }
    .footer { background-color: #F3EFE9; padding: 24px; text-align: center; font-size: 12px; color: ${BRAND_MUTED}; line-height: 1.6; }
    .footer a { color: ${BRAND_GOLD}; text-decoration: none; }
  </style>
</head>
<body>
  <div style="padding: 24px 12px;">
    <div class="container">
      <div class="header">
        <div class="logo">POOJARO</div>
        <div class="tagline">Purity for Your Sacred Moments</div>
      </div>
      <div class="body-content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: ${BRAND_BROWN};">Need help with your ritual preparations?</p>
        <p style="margin: 0 0 12px 0;">We are here to assist with items, samagri questions, or delivery tracking.</p>
        <p style="margin: 0;">Email: <a href="mailto:support@poojaro.in">support@poojaro.in</a> &nbsp;|&nbsp; WhatsApp: <a href="https://wa.me/919876543210">+91 98765 43210</a></p>
        <p style="margin: 14px 0 0 0; font-size: 11px; color: #9C9188;">© ${new Date().getFullYear()} POOJARO Ritual Essentials. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/** Render Order Confirmation Email */
export function renderOrderConfirmationEmail(order: Order, siteUrl = 'http://localhost:3000'): EmailRenderResult {
  const customerName = order.shippingAddress.fullName || 'Devotee';
  const orderUrl = `${siteUrl}/orders/${order.orderNumber}`;
  const subject = `Order Confirmed: ${order.orderNumber} - POOJARO Sacred Kits`;

  const itemsHtml = order.items.map((item) => `
    <tr>
      <td>
        <strong style="color: ${BRAND_BROWN};">${item.name}</strong>
        ${item.variantLabel ? `<br /><span style="font-size: 12px; color: ${BRAND_MUTED};">Option: ${item.variantLabel}</span>` : ''}
        <br /><span style="font-size: 12px; color: ${BRAND_MUTED};">SKU: ${item.sku}</span>
      </td>
      <td style="text-align: center;">${item.qty}</td>
      <td style="text-align: right; font-weight: 600;">${formatMoney(item.lineTotal)}</td>
    </tr>
  `).join('');

  const html = emailLayout(subject, `
    <div style="text-align: center; margin-bottom: 24px;">
      <div class="badge">Auspicious Order Confirmed</div>
      <h1 style="font-size: 24px; margin: 0 0 8px 0; color: ${BRAND_BROWN};">Namaste, ${customerName}!</h1>
      <p style="font-size: 15px; color: ${BRAND_MUTED}; margin: 0; line-height: 1.5;">
        Thank you for choosing POOJARO for your sacred rituals. Your order <strong>#${order.orderNumber}</strong> has been received and is being carefully prepared.
      </p>
    </div>

    <div class="card-box">
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
        <span><strong>Order Number:</strong> ${order.orderNumber}</span>
        <span><strong>Placed On:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
      <div style="font-size: 13px;">
        <span><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()} (${order.paymentStatus === 'paid' ? 'Paid Online' : 'Cash on Delivery'})</span>
      </div>
    </div>

    <table class="table-items">
      <thead>
        <tr>
          <th>Sacred Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="max-width: 280px; margin-left: auto;">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>${formatMoney(order.totals.subtotal)}</span>
      </div>
      ${order.totals.couponDiscount > 0 ? `
      <div class="totals-row" style="color: #2E7D32;">
        <span>Coupon Discount (${order.totals.couponCode || 'Promo'})</span>
        <span>-${formatMoney(order.totals.couponDiscount)}</span>
      </div>` : ''}
      <div class="totals-row">
        <span>Delivery Fee</span>
        <span>${order.totals.shipping === 0 ? '<strong style="color: #2E7D32;">FREE</strong>' : formatMoney(order.totals.shipping)}</span>
      </div>
      <div class="totals-total">
        <span>Total Paid</span>
        <span style="color: ${BRAND_GOLD};">${formatMoney(order.totals.total)}</span>
      </div>
    </div>

    <div class="card-box" style="margin-top: 28px;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: ${BRAND_MUTED};">Shipping Destination</h3>
      <p style="margin: 0; font-size: 14px; line-height: 1.5;">
        <strong>${order.shippingAddress.fullName}</strong> (${order.shippingAddress.phone})<br />
        ${order.shippingAddress.line1}${order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
        ${order.shippingAddress.landmark ? `Landmark: ${order.shippingAddress.landmark}<br />` : ''}
        ${order.shippingAddress.city}, ${order.shippingAddress.state} - <strong>${order.shippingAddress.pincode}</strong>
      </p>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${orderUrl}" class="btn">Track Order Live on POOJARO</a>
      <p style="font-size: 12px; color: ${BRAND_MUTED}; margin: 8px 0 0 0;">
        Follow live progression steps and courier tracking updates anytime.
      </p>
    </div>
  `);

  const text = `
Namaste ${customerName},

Thank you for your order with POOJARO!
Order Number: ${order.orderNumber}
Total Amount: ${formatMoney(order.totals.total)}
Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})

Items:
${order.items.map(i => `- ${i.name} (x${i.qty}) — ${formatMoney(i.lineTotal)}`).join('\n')}

Delivery Address:
${order.shippingAddress.fullName}
${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}
Phone: ${order.shippingAddress.phone}

Track your order live here:
${orderUrl}

Need assistance? Contact support@poojaro.in or WhatsApp +91 98765 43210.
  `.trim();

  return { subject, html, text };
}

/** Render Order Status Update Email (e.g. Packed, Shipped, Delivered, Cancelled) */
export function renderOrderStatusUpdateEmail(
  order: Order,
  status: OrderStatus,
  note?: string,
  siteUrl = 'http://localhost:3000'
): EmailRenderResult {
  const customerName = order.shippingAddress.fullName || 'Devotee';
  const orderUrl = `${siteUrl}/orders/${order.orderNumber}`;
  const statusLabel = ORDER_STATUS_LABEL[status] || status;
  const subject = `Update on Order ${order.orderNumber}: ${statusLabel}`;

  let statusBadgeColor = BRAND_GOLD;
  let statusHeadline = `Your order is now ${statusLabel}`;
  let statusMessage = note || 'Your order status has been updated.';

  if (status === 'packed') {
    statusBadgeColor = '#3B82F6';
    statusHeadline = 'Your Sacred Kit is Packed & Ready';
    statusMessage = note || 'Every item has been sanctified, carefully cushioned, and sealed in eco-friendly protective packaging.';
  } else if (status === 'shipped') {
    statusBadgeColor = '#8B5CF6';
    statusHeadline = 'Your Order Has Been Dispatched!';
    statusMessage = note || 'Your package has departed our central hub and is currently in transit with our logistics partner.';
  } else if (status === 'out_for_delivery') {
    statusBadgeColor = '#F59E0B';
    statusHeadline = 'Out for Doorstep Delivery Today';
    statusMessage = note || 'Our delivery partner is in your area and will arrive at your doorstep today. Please keep your phone accessible.';
  } else if (status === 'delivered') {
    statusBadgeColor = '#10B981';
    statusHeadline = 'Your Order Has Been Delivered';
    statusMessage = note || 'Your sacred puja package has reached its destination. May your ritual bring spiritual peace and prosperity.';
  } else if (status === 'cancelled') {
    statusBadgeColor = '#EF4444';
    statusHeadline = 'Order Cancelled';
    statusMessage = note || 'Your order has been cancelled as requested. If any payment was made, your refund is being initiated.';
  } else if (status === 'refunded') {
    statusBadgeColor = '#6366F1';
    statusHeadline = 'Refund Processed';
    statusMessage = note || `A refund of ${formatMoney(order.totals.total)} has been credited back to your original payment method.`;
  }

  const html = emailLayout(subject, `
    <div style="text-align: center; margin-bottom: 24px;">
      <div class="badge" style="color: ${statusBadgeColor}; border-color: ${statusBadgeColor};">${statusLabel}</div>
      <h1 style="font-size: 24px; margin: 0 0 8px 0; color: ${BRAND_BROWN};">${statusHeadline}</h1>
      <p style="font-size: 15px; color: ${BRAND_MUTED}; margin: 0; line-height: 1.5;">
        Namaste ${customerName}, here is the latest update for your order <strong>#${order.orderNumber}</strong>.
      </p>
    </div>

    <div class="card-box" style="border-left: 4px solid ${statusBadgeColor};">
      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: ${BRAND_BROWN};">
        ${statusMessage}
      </p>
    </div>

    ${order.courier || order.trackingNumber ? `
    <div class="card-box" style="background-color: #F3EFE9;">
      <h3 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: ${BRAND_MUTED};">Logistics & Tracking</h3>
      <p style="margin: 0; font-size: 14px; line-height: 1.6;">
        ${order.courier ? `<strong>Courier Partner:</strong> ${order.courier}<br />` : ''}
        ${order.trackingNumber ? `<strong>Tracking AWB:</strong> <code style="background: #FFF; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${order.trackingNumber}</code>` : ''}
      </p>
    </div>` : ''}

    <div style="text-align: center; margin-top: 32px;">
      <a href="${orderUrl}" class="btn">View Live Tracking Timeline</a>
    </div>
  `);

  const text = `
Namaste ${customerName},

Update for Order #${order.orderNumber}:
Status: ${statusLabel}
${statusMessage}

${order.courier ? `Courier: ${order.courier}\n` : ''}${order.trackingNumber ? `Tracking Number: ${order.trackingNumber}\n` : ''}
Track live anytime:
${orderUrl}

POOJARO Support: support@poojaro.in
  `.trim();

  return { subject, html, text };
}
