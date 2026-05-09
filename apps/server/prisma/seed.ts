import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Categories
  const drinks = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: '饮品', sortOrder: 10 },
  });
  const noodles = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: '面食', sortOrder: 20 },
  });
  const sides = await prisma.category.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: '小吃', sortOrder: 30 },
  });

  // Menu items
  const items = [
    { id: 1, categoryId: drinks.id, name: '可乐', price: 600, sortOrder: 10, description: '冰镇可乐 330ml' },
    { id: 2, categoryId: drinks.id, name: '柠檬水', price: 800, sortOrder: 20, description: '鲜榨柠檬水' },
    { id: 3, categoryId: noodles.id, name: '牛肉面', price: 2800, sortOrder: 10, description: '招牌牛肉面' },
    { id: 4, categoryId: noodles.id, name: '阳春面', price: 1500, sortOrder: 20, description: '清汤阳春面' },
    { id: 5, categoryId: sides.id, name: '卤蛋', price: 300, sortOrder: 10, description: '香卤鸡蛋一颗' },
    { id: 6, categoryId: sides.id, name: '小笼包', price: 1800, sortOrder: 20, description: '现蒸小笼包 6 只' },
  ];

  for (const item of items) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }

  console.log(`Seeded ${items.length} menu items across 3 categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
