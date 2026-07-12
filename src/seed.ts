import { connectDatabase, disconnectDatabase } from './config/db';
import { User, Category, MenuItem, Table, Role, VegType, SpiceLevel } from './models';
import { hashPassword } from './utils/password';
import { env } from './config/env';

/**
 * Idempotent demo seed:
 *   - one OWNER user (credentials from SEED_OWNER_EMAIL / SEED_OWNER_PASSWORD)
 *   - a couple of tables, categories, and menu items so the app is demoable.
 *
 * The seed password is a clearly-marked placeholder from env — NOT a real secret.
 * Change SEED_OWNER_PASSWORD (or the created user's password) before any real use.
 */
async function seed(): Promise<void> {
  await connectDatabase();
  // eslint-disable-next-line no-console
  console.log('[seed] connected, seeding...');

  // --- Owner ---------------------------------------------------------------
  const ownerEmail = env.SEED_OWNER_EMAIL.toLowerCase();
  let owner = await User.findOne({ email: ownerEmail });
  if (!owner) {
    owner = await User.create({
      email: ownerEmail,
      passwordHash: await hashPassword(env.SEED_OWNER_PASSWORD),
      firstName: 'Cafe',
      lastName: 'Owner',
      role: Role.OWNER,
      emailVerified: true,
      isActive: true,
    });
    // eslint-disable-next-line no-console
    console.log(`[seed] created OWNER: ${ownerEmail}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[seed] OWNER already exists: ${ownerEmail}`);
  }

  // --- Tables --------------------------------------------------------------
  for (const number of [1, 2, 3]) {
    await Table.updateOne(
      { number },
      { $setOnInsert: { number, name: `Table ${number}`, capacity: 4, isActive: true } },
      { upsert: true },
    );
  }
  // eslint-disable-next-line no-console
  console.log('[seed] tables ready (1-3)');

  // --- Categories + menu items --------------------------------------------
  const beverages = await Category.findOneAndUpdate(
    { slug: 'beverages' },
    { $setOnInsert: { name: 'Beverages', slug: 'beverages', sortOrder: 1, isActive: true } },
    { upsert: true, new: true },
  );
  const snacks = await Category.findOneAndUpdate(
    { slug: 'snacks' },
    { $setOnInsert: { name: 'Snacks', slug: 'snacks', sortOrder: 2, isActive: true } },
    { upsert: true, new: true },
  );

  const items = [
    {
      category: beverages!._id,
      name: 'Masala Chai',
      description: 'Spiced Indian milk tea',
      price: 40,
      vegType: VegType.VEG,
      spiceLevel: SpiceLevel.MILD,
      variants: [
        { name: 'Regular', priceAdjustment: 0, sortOrder: 0 },
        { name: 'Large', priceAdjustment: 15, sortOrder: 1 },
      ],
      addOns: [{ name: 'Extra shot', price: 10, sortOrder: 0 }],
      isBestseller: true,
    },
    {
      category: beverages!._id,
      name: 'Cold Coffee',
      description: 'Chilled blended coffee',
      price: 120,
      vegType: VegType.VEG,
      spiceLevel: SpiceLevel.NONE,
    },
    {
      category: snacks!._id,
      name: 'Veg Sandwich',
      description: 'Grilled sandwich with fresh veggies',
      price: 90,
      vegType: VegType.VEG,
      spiceLevel: SpiceLevel.MILD,
      isRecommended: true,
    },
  ];

  for (const item of items) {
    const existing = await MenuItem.findOne({ name: item.name, category: item.category });
    if (!existing) {
      await MenuItem.create(item);
      // eslint-disable-next-line no-console
      console.log(`[seed] created menu item: ${item.name}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log('[seed] done.');
  await disconnectDatabase();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[seed] failed:', err);
    process.exit(1);
  });
