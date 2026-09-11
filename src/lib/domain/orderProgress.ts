/**
 * Amazon-like Automated Order Progression Engine.
 * Automatically advances order statuses over time through realistic fulfillment milestones:
 * Order Placed -> Processing -> Packed (Courier Assigned) -> Shipped (In Transit) -> Out for Delivery -> Delivered.
 */

import type { Order, OrderStatus } from '../data/types';
import { ORDER_STATUS_DETAIL, ORDER_STATUS_LABEL } from './orders';

export interface MilestoneDef {
  status: OrderStatus;
  elapsedSeconds: number;
  label: string;
  note: string;
  courier?: string;
}

/**
 * Progression milestones with elapsed time triggers (in seconds)
 * Designed for responsive live tracking demo (advances within minutes)
 * while also scaling naturally for older orders.
 */
export const AUTO_PROGRESS_MILESTONES: MilestoneDef[] = [
  {
    status: 'payment_confirmed',
    elapsedSeconds: 0,
    label: 'Order Confirmed',
    note: 'Order confirmed and verified. Processing at central temple hub.',
  },
  {
    status: 'processing',
    elapsedSeconds: 45, // 45 sec
    label: 'Fulfillment & Inspection',
    note: 'Puja samagri items verified against ritual checklist and inspected for purity.',
  },
  {
    status: 'packed',
    elapsedSeconds: 150, // 2.5 min
    label: 'Packed & Dispatched',
    note: 'Sacred kit cushioned, sealed in protective packaging, and handed over to courier.',
    courier: 'Delhivery Express',
  },
  {
    status: 'shipped',
    elapsedSeconds: 300, // 5 min
    label: 'In Transit',
    note: 'Departed regional sorting hub. In transit to destination city courier center.',
    courier: 'Delhivery Express',
  },
  {
    status: 'out_for_delivery',
    elapsedSeconds: 500, // 8.3 min
    label: 'Out for Delivery',
    note: 'Package is out with your delivery partner for doorstep delivery today.',
    courier: 'Delhivery Express',
  },
  {
    status: 'delivered',
    elapsedSeconds: 720, // 12 min
    label: 'Delivered',
    note: 'Package delivered at doorstep. May your puja bring auspicious blessings.',
    courier: 'Delhivery Express',
  },
];

const ORDER_PATH: OrderStatus[] = [
  'pending',
  'payment_confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
];

const TERMINAL_STATUSES: OrderStatus[] = ['cancelled', 'returned', 'refunded'];

/**
 * Automatically computes and progresses an order to its current Amazon-style status
 * based on the time elapsed since order placement.
 */
export function autoProgressOrder(order: Order): { changed: boolean; order: Order } {
  if (!order || !order.createdAt) return { changed: false, order };
  if (TERMINAL_STATUSES.includes(order.status)) return { changed: false, order };

  const createdTime = new Date(order.createdAt).getTime();
  if (isNaN(createdTime)) return { changed: false, order };

  const elapsedSeconds = Math.max(0, (Date.now() - createdTime) / 1000);

  // Find the highest milestone the order qualifies for based on elapsed time
  let targetMilestone: MilestoneDef = AUTO_PROGRESS_MILESTONES[0]!;
  for (const milestone of AUTO_PROGRESS_MILESTONES) {
    if (elapsedSeconds >= milestone.elapsedSeconds) {
      targetMilestone = milestone;
    } else {
      break;
    }
  }

  const currentIdx = ORDER_PATH.indexOf(order.status);
  const targetIdx = ORDER_PATH.indexOf(targetMilestone.status);

  // If already at or beyond target milestone, no change needed
  if (currentIdx >= targetIdx) {
    // Ensure courier and tracking number are set if shipped or packed
    let courierAdded = false;
    if ((order.status === 'packed' || order.status === 'shipped' || order.status === 'out_for_delivery' || order.status === 'delivered') && !order.trackingNumber) {
      order.courier = order.courier || 'Delhivery Express';
      order.trackingNumber = `DEL-IN-${order.orderNumber.replace(/[^A-Z0-9]/gi, '')}`;
      courierAdded = true;
    }
    return { changed: courierAdded, order };
  }

  // Walk through each milestone from (currentIdx + 1) to targetIdx
  for (let i = Math.max(1, currentIdx + 1); i <= targetIdx; i++) {
    const stepStatus = ORDER_PATH[i];
    if (!stepStatus) continue;
    const milestoneInfo = AUTO_PROGRESS_MILESTONES.find((m) => m.status === stepStatus);

    if (milestoneInfo) {
      // Calculate realistic milestone timestamp
      const milestoneTime = new Date(createdTime + milestoneInfo.elapsedSeconds * 1000);
      const atIso = (milestoneTime.getTime() <= Date.now() ? milestoneTime : new Date()).toISOString();

      // Check if this status already exists in timeline
      const exists = order.timeline.some((t) => t.status === stepStatus);
      if (!exists) {
        order.timeline.push({
          status: stepStatus,
          at: atIso,
          note: milestoneInfo.note,
        });
      }

      if (milestoneInfo.courier && !order.courier) {
        order.courier = milestoneInfo.courier;
      }
      if (milestoneInfo.courier && !order.trackingNumber) {
        order.trackingNumber = `DEL-IN-${order.orderNumber.replace(/[^A-Z0-9]/gi, '')}`;
      }
    }

    order.status = stepStatus;
  }

  order.updatedAt = new Date().toISOString();
  if (order.status === 'payment_confirmed') {
    order.paymentStatus = 'paid';
  }

  return { changed: true, order };
}
