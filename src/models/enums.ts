/**
 * Enums translated from the reference Prisma schema.
 * NOTE: PlatformRole is intentionally DROPPED — this is a single cafe with no
 * platform/super-admin tier. OWNER is the top-level admin.
 */

export const Role = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  WAITER: 'WAITER',
  CASHIER: 'CASHIER',
  KITCHEN: 'KITCHEN',
  STAFF: 'STAFF',
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export const ROLE_VALUES = Object.values(Role);

export const OrderStatus = {
  PLACED: 'PLACED',
  ACCEPTED: 'ACCEPTED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  SERVED: 'SERVED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
export const ORDER_STATUS_VALUES = Object.values(OrderStatus);

export const VegType = {
  VEG: 'VEG',
  NON_VEG: 'NON_VEG',
  EGG: 'EGG',
  VEGAN: 'VEGAN',
} as const;
export type VegType = (typeof VegType)[keyof typeof VegType];
export const VEG_TYPE_VALUES = Object.values(VegType);

export const SpiceLevel = {
  NONE: 'NONE',
  MILD: 'MILD',
  MEDIUM: 'MEDIUM',
  HOT: 'HOT',
  EXTRA_HOT: 'EXTRA_HOT',
} as const;
export type SpiceLevel = (typeof SpiceLevel)[keyof typeof SpiceLevel];
export const SPICE_LEVEL_VALUES = Object.values(SpiceLevel);

export const OfferType = {
  PERCENTAGE: 'PERCENTAGE',
  FLAT: 'FLAT',
  BOGO: 'BOGO',
} as const;
export type OfferType = (typeof OfferType)[keyof typeof OfferType];
export const OFFER_TYPE_VALUES = Object.values(OfferType);

export const OfferScope = {
  CART: 'CART',
  CATEGORY: 'CATEGORY',
  ITEM: 'ITEM',
} as const;
export type OfferScope = (typeof OfferScope)[keyof typeof OfferScope];
export const OFFER_SCOPE_VALUES = Object.values(OfferScope);

export const PaymentMode = {
  CASH: 'CASH',
  CARD: 'CARD',
  UPI: 'UPI',
  OTHER: 'OTHER',
} as const;
export type PaymentMode = (typeof PaymentMode)[keyof typeof PaymentMode];
export const PAYMENT_MODE_VALUES = Object.values(PaymentMode);
