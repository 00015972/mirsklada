/**
 * Prisma Seed Script
 * Populates development database with sample data
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-company" },
    update: {},
    create: {
      name: "Demo Fish & Meat Co.",
      slug: "demo-company",
      subscriptionTier: "pro",
      status: "active",
    },
  });
  console.log(`✅ Created tenant: ${tenant.name}`);

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      name: "Demo Admin",
    },
  });
  console.log(`✅ Created user: ${user.email}`);

  // Link user to tenant as admin
  await prisma.tenantMember.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: user.id,
      role: "admin",
      status: "active",
    },
  });
  console.log(`✅ Linked user to tenant as admin`);

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: "cat-fish" },
      update: {},
      create: {
        id: "cat-fish",
        tenantId: tenant.id,
        name: "Fish",
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { id: "cat-meat" },
      update: {},
      create: {
        id: "cat-meat",
        tenantId: tenant.id,
        name: "Meat",
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { id: "cat-cheese" },
      update: {},
      create: {
        id: "cat-cheese",
        tenantId: tenant.id,
        name: "Cheese & Dairy",
        sortOrder: 3,
      },
    }),
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  // Create products
  const products = await Promise.all([
    // Fish
    prisma.product.upsert({
      where: { id: "prod-salmon" },
      update: {},
      create: {
        id: "prod-salmon",
        tenantId: tenant.id,
        categoryId: "cat-fish",
        name: "Salmon (Fresh)",
        description: "Fresh Atlantic salmon, perfect for sushi and grilling",
        unit: "kg",
        basePricePerKg: new Prisma.Decimal(180000),
        currentStockKg: new Prisma.Decimal(50.5),
        minStockKg: new Prisma.Decimal(10),
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-tilapia" },
      update: {},
      create: {
        id: "prod-tilapia",
        tenantId: tenant.id,
        categoryId: "cat-fish",
        name: "Tilapia (Frozen)",
        description: "Frozen tilapia fillets",
        unit: "kg",
        basePricePerKg: new Prisma.Decimal(65000),
        currentStockKg: new Prisma.Decimal(120),
        minStockKg: new Prisma.Decimal(20),
      },
    }),
    // Meat
    prisma.product.upsert({
      where: { id: "prod-beef" },
      update: {},
      create: {
        id: "prod-beef",
        tenantId: tenant.id,
        categoryId: "cat-meat",
        name: "Beef Tenderloin",
        description: "Premium beef tenderloin",
        unit: "kg",
        basePricePerKg: new Prisma.Decimal(150000),
        currentStockKg: new Prisma.Decimal(35.75),
        minStockKg: new Prisma.Decimal(15),
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-chicken" },
      update: {},
      create: {
        id: "prod-chicken",
        tenantId: tenant.id,
        categoryId: "cat-meat",
        name: "Chicken Breast",
        description: "Boneless skinless chicken breast",
        unit: "kg",
        basePricePerKg: new Prisma.Decimal(48000),
        currentStockKg: new Prisma.Decimal(200),
        minStockKg: new Prisma.Decimal(50),
      },
    }),
    // Cheese
    prisma.product.upsert({
      where: { id: "prod-mozzarella" },
      update: {},
      create: {
        id: "prod-mozzarella",
        tenantId: tenant.id,
        categoryId: "cat-cheese",
        name: "Mozzarella",
        description: "Fresh mozzarella for pizza",
        unit: "kg",
        basePricePerKg: new Prisma.Decimal(95000),
        currentStockKg: new Prisma.Decimal(80),
        minStockKg: new Prisma.Decimal(25),
      },
    }),
  ]);
  console.log(`✅ Created ${products.length} products`);

  // Create price matrix for VIP clients
  const vipMatrix = await prisma.priceMatrix.upsert({
    where: { id: "pm-vip" },
    update: {},
    create: {
      id: "pm-vip",
      tenantId: tenant.id,
      name: "VIP Clients",
      description: "10% discount on all products",
    },
  });

  // Add VIP prices (10% discount)
  await Promise.all(
    products.map((product) =>
      prisma.priceMatrixItem.upsert({
        where: {
          priceMatrixId_productId: {
            priceMatrixId: vipMatrix.id,
            productId: product.id,
          },
        },
        update: {},
        create: {
          priceMatrixId: vipMatrix.id,
          productId: product.id,
          customPriceKg: product.basePricePerKg.mul(0.9),
        },
      }),
    ),
  );
  console.log(`✅ Created VIP price matrix with discounts`);

  // Create demo clients
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { id: "client-pizzeria" },
      update: {},
      create: {
        id: "client-pizzeria",
        tenantId: tenant.id,
        name: "Mario's Pizzeria",
        contactPerson: "Mario Rossi",
        phone: "+998901234567",
        address: "Tashkent, Mirzo Ulugbek district, Buyuk Ipak Yoli 15",
        priceMatrixId: vipMatrix.id,
        notes: "VIP client - bulk orders every week",
      },
    }),
    prisma.client.upsert({
      where: { id: "client-restaurant" },
      update: {},
      create: {
        id: "client-restaurant",
        tenantId: tenant.id,
        name: "Silk Road Restaurant",
        contactPerson: "Akbar Karimov",
        phone: "+998907654321",
        address: "Tashkent, Yunusabad district, Amir Temur 42",
        notes: "Orders twice a month",
      },
    }),
    prisma.client.upsert({
      where: { id: "client-hotel" },
      update: {},
      create: {
        id: "client-hotel",
        tenantId: tenant.id,
        name: "Grand Hotel Tashkent",
        contactPerson: "Dilshod Umarov",
        phone: "+998911112233",
        address: "Tashkent, Mirabad district, Navoi 1",
        priceMatrixId: vipMatrix.id,
        notes: "Daily fresh deliveries required",
      },
    }),
  ]);
  console.log(`✅ Created ${clients.length} clients`);

  // Create a sample order
  const order = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      clientId: "client-pizzeria",
      orderNumber: "ORD-2026-0001",
      status: "delivered",
      totalAmount: new Prisma.Decimal(1215000), // Will be calculated from items
      notes: "Please deliver before 10 AM",
      deliveryDate: new Date("2026-01-20"),
      createdBy: user.id,
      deliveredAt: new Date("2026-01-20T09:30:00Z"),
      items: {
        create: [
          {
            productId: "prod-mozzarella",
            productName: "Mozzarella",
            quantityKg: new Prisma.Decimal(10),
            pricePerKg: new Prisma.Decimal(85500), // VIP price
            lineTotal: new Prisma.Decimal(855000),
          },
          {
            productId: "prod-chicken",
            productName: "Chicken Breast",
            quantityKg: new Prisma.Decimal(7.5),
            pricePerKg: new Prisma.Decimal(48000),
            lineTotal: new Prisma.Decimal(360000),
          },
        ],
      },
    },
  });
  console.log(`✅ Created sample order: ${order.orderNumber}`);

  // Create debt ledger entry for the order
  await prisma.debtLedger.create({
    data: {
      tenantId: tenant.id,
      clientId: "client-pizzeria",
      type: "DEBIT",
      amount: new Prisma.Decimal(1215000),
      orderId: order.id,
      description: `Order ${order.orderNumber}`,
    },
  });

  // Create a partial payment
  const payment = await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      clientId: "client-pizzeria",
      amount: new Prisma.Decimal(1000000),
      method: "transfer",
      reference: "TXN-2026-01-20-001",
      notes: "Partial payment via bank transfer",
      receivedBy: user.id,
    },
  });

  // Create credit entry for payment
  await prisma.debtLedger.create({
    data: {
      tenantId: tenant.id,
      clientId: "client-pizzeria",
      type: "CREDIT",
      amount: new Prisma.Decimal(1000000),
      paymentId: payment.id,
      description: "Payment received",
    },
  });

  // Update client debt balance
  await prisma.client.update({
    where: { id: "client-pizzeria" },
    data: {
      debtBalance: new Prisma.Decimal(215000), // 1,215,000 - 1,000,000
    },
  });
  console.log(`✅ Created payment and debt ledger entries`);

  // Create stock movements for the order
  await prisma.stockMovement.createMany({
    data: [
      {
        tenantId: tenant.id,
        productId: "prod-mozzarella",
        type: "OUT",
        quantityKg: new Prisma.Decimal(10),
        referenceType: "order",
        referenceId: order.id,
        createdBy: user.id,
      },
      {
        tenantId: tenant.id,
        productId: "prod-chicken",
        type: "OUT",
        quantityKg: new Prisma.Decimal(7.5),
        referenceType: "order",
        referenceId: order.id,
        createdBy: user.id,
      },
    ],
  });
  console.log(`✅ Created stock movements`);

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   - 1 Tenant: ${tenant.name}`);
  console.log(`   - 1 User: ${user.email}`);
  console.log(`   - ${categories.length} Categories`);
  console.log(`   - ${products.length} Products`);
  console.log(`   - 1 Price Matrix with VIP discounts`);
  console.log(`   - ${clients.length} Clients`);
  console.log(`   - 1 Sample Order with items`);
  console.log(`   - Payment and debt tracking entries`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
