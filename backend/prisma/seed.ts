import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  // 1. Create or reuse a demo restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'demo-restaurant' },
    update: {},
    create: {
      name: 'Demo Restaurant',
      slug: 'demo-restaurant',
      description: 'Sample QR dine-in restaurant for local dev.',
    },
  });

  // 2. Create two tables with QR tokens
  const table11 = await prisma.table.upsert({
    where: { qrToken: 'table-11-token' },
    update: {},
    create: {
      restaurantId: restaurant.id,
      name: 'Table 11',
      area: 'Indoor',
      qrToken: 'table-11-token',
      capacity: 4,
    },
  });

  const table12 = await prisma.table.upsert({
    where: { qrToken: 'table-12-token' },
    update: {},
    create: {
      restaurantId: restaurant.id,
      name: 'Table 12',
      area: 'Indoor',
      qrToken: 'table-12-token',
      capacity: 4,
    },
  });

  console.log('Tables created:', table11.name, table12.name);

  // 3. Create categories
  const starters = await prisma.menuCategory.upsert({
    where: { slug: 'starters-demo' },
    update: {},
    create: {
      restaurantId: restaurant.id,
      name: 'Starters',
      slug: 'starters-demo',
      displayOrder: 1,
      isActive: true,
    },
  });

  const mains = await prisma.menuCategory.upsert({
    where: { slug: 'mains-demo' },
    update: {},
    create: {
      restaurantId: restaurant.id,
      name: 'Main Course',
      slug: 'mains-demo',
      displayOrder: 2,
      isActive: true,
    },
  });

  console.log('Categories created:', starters.name, mains.name);

  // 4. Create menu items with variations and addons
  await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: starters.id,
      name: 'Paneer Tikka',
      description: 'Marinated cottage cheese cubes grilled to perfection.',
      basePrice: 250,
      isVeg: true,
      spiceLevel: 2,
      imageUrl: null,
      tags: ['chef_special'],
      isActive: true,
      variations: {
        create: [
          { name: 'Half', priceDelta: 0 },
          { name: 'Full', priceDelta: 120 },
        ],
      },
      addons: {
        create: [
          { name: 'Extra Cheese', priceDelta: 40, maxQuantity: 3 },
          { name: 'Mint Chutney', priceDelta: 10, maxQuantity: 2 },
        ],
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: mains.id,
      name: 'Butter Chicken',
      description: 'Classic North Indian curry with tender chicken in a creamy tomato gravy.',
      basePrice: 320,
      isVeg: false,
      spiceLevel: 1,
      imageUrl: null,
      tags: ['signature'],
      isActive: true,
      variations: {
        create: [
          { name: 'Regular', priceDelta: 0 },
          { name: 'Large', priceDelta: 80 },
        ],
      },
      addons: {
        create: [
          { name: 'Extra Gravy', priceDelta: 60, maxQuantity: 2 },
          { name: 'Butter Naan', priceDelta: 40, maxQuantity: 4 },
        ],
      },
    },
  });

  console.log('Sample menu items created for', restaurant.name);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✅ Seed completed');
  })
  .catch(async (e) => {
    console.error('❌ Seed failed', e);
    await prisma.$disconnect();
    process.exit(1);
  });