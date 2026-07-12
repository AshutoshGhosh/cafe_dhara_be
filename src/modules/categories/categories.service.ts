import { Category } from '../../models';
import type { ICategory } from '../../models/Category.model';
import { AppError } from '../../common/AppError';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  ReorderInput,
} from './categories.validation';

/** Turn an arbitrary string into a URL-safe slug. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}

/** Find a slug not yet used by any category (excluding `excludeId`). */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || 'category';
  let candidate = root;
  let n = 1;
  // Loop until we find a free slug. Bounded by number of collisions.
  while (true) {
    const clash = await Category.findOne({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).select('_id');
    if (!clash) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}

export const categoriesService = {
  /** Public/admin list. Public callers get only active, non-deleted. */
  async list(opts: { includeInactive?: boolean } = {}): Promise<ICategory[]> {
    const filter: Record<string, unknown> = { deletedAt: null };
    if (!opts.includeInactive) filter.isActive = true;
    return Category.find(filter).sort({ sortOrder: 1, name: 1 }).exec();
  },

  async getById(id: string, includeInactive = false): Promise<ICategory> {
    const filter: Record<string, unknown> = { _id: id, deletedAt: null };
    if (!includeInactive) filter.isActive = true;
    const category = await Category.findOne(filter);
    if (!category) throw AppError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
    return category;
  },

  async create(input: CreateCategoryInput): Promise<ICategory> {
    const slug = await uniqueSlug(input.slug ?? input.name);
    return Category.create({
      name: input.name,
      slug,
      description: input.description,
      image: input.image,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    });
  },

  async update(id: string, input: UpdateCategoryInput): Promise<ICategory> {
    const category = await Category.findOne({ _id: id, deletedAt: null });
    if (!category) throw AppError.notFound('Category not found', 'CATEGORY_NOT_FOUND');

    if (input.slug !== undefined) {
      category.slug = await uniqueSlug(input.slug, id);
    }
    if (input.name !== undefined) category.name = input.name;
    if (input.description !== undefined) category.description = input.description;
    if (input.image !== undefined) category.image = input.image;
    if (input.sortOrder !== undefined) category.sortOrder = input.sortOrder;
    if (input.isActive !== undefined) category.isActive = input.isActive;

    await category.save();
    return category;
  },

  /** Soft-delete: set deletedAt, keep the row for history. */
  async remove(id: string): Promise<void> {
    const category = await Category.findOne({ _id: id, deletedAt: null });
    if (!category) throw AppError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
    category.deletedAt = new Date();
    category.isActive = false;
    await category.save();
  },

  async reorder(input: ReorderInput): Promise<ICategory[]> {
    await Category.bulkWrite(
      input.items.map((item) => ({
        updateOne: {
          filter: { _id: item.id, deletedAt: null },
          update: { $set: { sortOrder: item.sortOrder } },
        },
      })),
    );
    return this.list({ includeInactive: true });
  },
};
