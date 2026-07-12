import { Offer } from '../../models';
import type { IOffer } from '../../models';
import { OfferType } from '../../models/enums';
import { AppError } from '../../common/AppError';
import type { CreateOfferInput, UpdateOfferInput } from './offers.validation';

/**
 * Compute the discount for a given offer + subtotal. PERCENTAGE applies `value`%
 * (capped by maxDiscount when set); FLAT subtracts `value`. The discount is never
 * larger than the subtotal.
 */
function computeDiscount(offer: IOffer, subtotal: number): number {
  let discount = 0;
  if (offer.type === OfferType.PERCENTAGE) {
    discount = (subtotal * offer.value) / 100;
    if (offer.maxDiscount != null) {
      discount = Math.min(discount, offer.maxDiscount);
    }
  } else if (offer.type === OfferType.FLAT) {
    discount = offer.value;
  }
  discount = Math.min(discount, subtotal);
  return Math.round(discount * 100) / 100;
}

export const offersService = {
  async create(input: CreateOfferInput): Promise<IOffer> {
    const existing = await Offer.findOne({
      couponCode: input.couponCode,
      deletedAt: null,
    });
    if (existing) {
      throw AppError.conflict('Coupon code already in use', 'OFFER_CODE_TAKEN');
    }
    return Offer.create(input);
  },

  async list(filter: { isActive?: boolean }): Promise<IOffer[]> {
    const query: Record<string, unknown> = { deletedAt: null };
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }
    return Offer.find(query).sort({ createdAt: -1 });
  },

  async getById(id: string): Promise<IOffer> {
    const offer = await Offer.findOne({ _id: id, deletedAt: null });
    if (!offer) {
      throw AppError.notFound('Offer not found', 'OFFER_NOT_FOUND');
    }
    return offer;
  },

  async update(id: string, input: UpdateOfferInput): Promise<IOffer> {
    const offer = await this.getById(id);

    if (input.couponCode && input.couponCode !== offer.couponCode) {
      const clash = await Offer.findOne({
        couponCode: input.couponCode,
        deletedAt: null,
        _id: { $ne: offer._id },
      });
      if (clash) {
        throw AppError.conflict('Coupon code already in use', 'OFFER_CODE_TAKEN');
      }
    }

    const startsAt = input.startsAt ?? offer.startsAt;
    const endsAt = input.endsAt ?? offer.endsAt;
    if (endsAt <= startsAt) {
      throw AppError.badRequest('endsAt must be after startsAt', 'OFFER_INVALID_WINDOW');
    }

    Object.assign(offer, input);
    await offer.save();
    return offer;
  },

  async remove(id: string): Promise<void> {
    const offer = await this.getById(id);
    offer.deletedAt = new Date();
    offer.isActive = false;
    await offer.save();
  },

  /**
   * Validate a coupon code against a subtotal. Checks the offer is active, not
   * soft-deleted, within its date window, under any usage limit, and that the
   * subtotal meets the minimum. Returns the resolved discount + final amount.
   */
  async validate(code: string, subtotal: number): Promise<{
    offerId: string;
    code: string;
    type: OfferType;
    discount: number;
    finalAmount: number;
  }> {
    const now = new Date();
    const offer = await Offer.findOne({
      couponCode: code,
      deletedAt: null,
      isActive: true,
    });

    if (!offer) {
      throw AppError.notFound('Invalid or inactive coupon code', 'OFFER_INVALID');
    }
    if (offer.startsAt > now || offer.endsAt < now) {
      throw AppError.badRequest('Coupon is not active right now', 'OFFER_NOT_IN_WINDOW');
    }
    if (offer.usageLimit != null && offer.usageCount >= offer.usageLimit) {
      throw AppError.badRequest('Coupon usage limit reached', 'OFFER_USAGE_EXCEEDED');
    }
    if (offer.minOrderValue != null && subtotal < offer.minOrderValue) {
      throw AppError.badRequest(
        `A minimum order of ${offer.minOrderValue} is required for this coupon`,
        'OFFER_MIN_ORDER',
      );
    }

    const discount = computeDiscount(offer, subtotal);
    const finalAmount = Math.round((subtotal - discount) * 100) / 100;

    return {
      offerId: String(offer._id),
      code: offer.couponCode as string,
      type: offer.type,
      discount,
      finalAmount,
    };
  },
};
