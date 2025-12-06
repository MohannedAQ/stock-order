import { db } from "./db";
import { inventoryItems, categories, managerCredentials } from "@shared/schema";
import bcrypt from "bcrypt";

const DEFAULT_ITEMS = [
  { name: "Tomatoes", unit: "kg", category: "Produce" },
  { name: "Onions", unit: "kg", category: "Produce" },
  { name: "Milk (Whole)", unit: "bottles", category: "Dairy" },
  { name: "Eggs", unit: "trays", category: "Dairy" },
  { name: "Chicken Breast", unit: "kg", category: "Meat" },
  { name: "Olive Oil", unit: "liters", category: "Pantry" },
];

const DEFAULT_CATEGORIES = [
  "Produce",
  "Dairy",
  "Meat",
  "Pantry",
  "Beverages",
  "Cleaning",
  "Other",
];

async function seed() {
  try {
    console.log("🌱 Starting database seed...");

    // Seed categories first
    console.log("📁 Seeding categories...");
    for (const categoryName of DEFAULT_CATEGORIES) {
      await db.insert(categories).values({ name: categoryName }).onConflictDoNothing();
    }
    console.log(`✅ Seeded ${DEFAULT_CATEGORIES.length} categories`);

    // Seed inventory items
    console.log("📦 Seeding inventory items...");
    for (const item of DEFAULT_ITEMS) {
      await db.insert(inventoryItems).values(item).onConflictDoNothing();
    }
    console.log(`✅ Seeded ${DEFAULT_ITEMS.length} inventory items`);

    // Seed manager credentials (default: admin/admin)
    console.log("🔐 Seeding manager credentials...");
    const hashedPassword = await bcrypt.hash("admin", 10);
    await db
      .insert(managerCredentials)
      .values({ username: "admin", password: hashedPassword })
      .onConflictDoNothing();
    console.log("✅ Seeded manager credentials (username: admin, password: admin)");

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
