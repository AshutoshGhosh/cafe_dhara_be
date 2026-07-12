import { Category, MenuItem } from '../../models';
import type { IMenuItem } from '../../models/MenuItem.model';
import { AppError } from '../../common/AppError';
import type {
  CreateMenuItemInput,
  UpdateMenuItemInput,
  ListItemsQuery,
} from './menu.validation';

async function assertCategoryExists(categoryId: string): Promise<void> {
  const exists = await Category.findOne({ _id: categoryId, deletedAt: null }).select('_id');
  if (!exists) throw AppError.badRequest('Category does not exist', 'INVALID_CATEGORY');
}

export const menuService = {
  /**
   * Public customer menu: active categories, each with their available,
   * non-deleted items nested. Unavailable variants/add-ons are stripped.
   */
  async publicMenu(): Promise<Array<Record<string, unknown>>> {
    const categories = await Category.find({ deletedAt: null, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    const items = await MenuItem.find({ deletedAt: null, isAvailable: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    const byCategory = new Map<string, Array<Record<string, unknown>>>();
    for (const item of items) {
      const key = String(item.category);
      const list = byCategory.get(key) ?? [];
      // Only surface available variants/add-ons to customers.
      list.push({
        ...item,
        variants: (item.variants ?? []).filter((v) => v.isAvailable),
        addOns: (item.addOns ?? []).filter((a) => a.isAvailable),
      });
      byCategory.set(key, list);
    }

    return categories.map((category) => ({
      ...category,
      items: byCategory.get(String(category._id)) ?? [],
    }));
  },

  /** Public single-item read (available, non-deleted only). */
  async publicItem(id: string): Promise<IMenuItem> {
    const item = await MenuItem.findOne({ _id: id, deletedAt: null, isAvailable: true });
    if (!item) throw AppError.notFound('Menu item not found', 'MENU_ITEM_NOT_FOUND');
    return item;
  },

  /** Admin list (includes unavailable, excludes soft-deleted). */
  async listItems(query: ListItemsQuery): Promise<IMenuItem[]> {
    const filter: Record<string, unknown> = { deletedAt: null };
    if (query.category) filter.category = query.category;
    if (query.available !== undefined) filter.isAvailable = query.available;
    return MenuItem.find(filter).sort({ sortOrder: 1, name: 1 }).exec();
  },

  async getById(id: string): Promise<IMenuItem> {
    const item = await MenuItem.findOne({ _id: id, deletedAt: null });
    if (!item) throw AppError.notFound('Menu item not found', 'MENU_ITEM_NOT_FOUND');
    return item;
  },

  async create(input: CreateMenuItemInput): Promise<IMenuItem> {
    await assertCategoryExists(input.category);
    return MenuItem.create(input);
  },

  async update(id: string, input: UpdateMenuItemInput): Promise<IMenuItem> {
    const item = await MenuItem.findOne({ _id: id, deletedAt: null });
    if (!item) throw AppError.notFound('Menu item not found', 'MENU_ITEM_NOT_FOUND');

    if (input.category !== undefined) {
      await assertCategoryExists(input.category);
    }
    // Guard: discountPrice must not exceed the (possibly updated) price.
    const nextPrice = input.price ?? item.price;
    if (input.discountPrice != null && input.discountPrice > nextPrice) {
      throw AppError.badRequest('discountPrice cannot exceed price', 'INVALID_DISCOUNT');
    }

    Object.assign(item, input);
    await item.save();
    return item;
  },

  async setAvailability(id: string, isAvailable: boolean): Promise<IMenuItem> {
    const item = await MenuItem.findOne({ _id: id, deletedAt: null });
    if (!item) throw AppError.notFound('Menu item not found', 'MENU_ITEM_NOT_FOUND');
    item.isAvailable = isAvailable;
    await item.save();
    return item;
  },

  async remove(id: string): Promise<void> {
    const item = await MenuItem.findOne({ _id: id, deletedAt: null });
    if (!item) throw AppError.notFound('Menu item not found', 'MENU_ITEM_NOT_FOUND');
    item.deletedAt = new Date();
    item.isAvailable = false;
    await item.save();
  },
};
