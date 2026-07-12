import { Feedback, Order } from '../../models';
import type { IFeedback } from '../../models';
import { AppError } from '../../common/AppError';
import type { CreateFeedbackInput, ListFeedbackInput } from './feedback.validation';

export const feedbackService = {
  async create(input: CreateFeedbackInput): Promise<IFeedback> {
    const order = await Order.findById(input.orderId).select('_id');
    if (!order) {
      throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    const existing = await Feedback.findOne({ order: input.orderId }).select('_id');
    if (existing) {
      throw AppError.conflict('Feedback already submitted for this order', 'FEEDBACK_EXISTS');
    }

    return Feedback.create({
      order: input.orderId,
      rating: input.rating,
      comment: input.comment,
    });
  },

  async list(filter: ListFeedbackInput): Promise<IFeedback[]> {
    const query: Record<string, unknown> = {};
    if (filter.rating !== undefined) {
      query.rating = filter.rating;
    }
    if (filter.from || filter.to) {
      const createdAt: Record<string, Date> = {};
      if (filter.from) createdAt.$gte = filter.from;
      if (filter.to) createdAt.$lte = filter.to;
      query.createdAt = createdAt;
    }
    return Feedback.find(query).sort({ createdAt: -1 });
  },
};
