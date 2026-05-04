import { db } from "./index.js";
import { tenants, users, menuCategories, menuItems, restaurantTables, admins } from "./schema/index.js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // ── Super Admin ────────────────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  await db
    .insert(admins)
    .values({
      name:         "Platform Admin",
      email:        "admin@restaurantos.com",
      passwordHash: adminPasswordHash,
      role:         "super_admin",
    })
    .onConflictDoNothing();

  console.log("Super admin: admin@restaurantos.com / admin123");

  // ── Demo Restaurant ─────────────────────────────────────────────────────────
  // Use onConflictDoNothing so re-running seed never crashes
  const [tenantRow] = await db
    .insert(tenants)
    .values({
      name:      "Spice Garden Restaurant",
      slug:      "spice-garden",
      address:   "42 MG Road, Bengaluru, Karnataka 560001",
      phone:     "+91-9876543210",
      email:     "info@spicegarden.com",
      gstNumber: "29ABCDE1234F1Z5",
    })
    .onConflictDoNothing()
    .returning();

  // If tenant already existed, fetch it
  const tenant = tenantRow ?? (await db.query.tenants.findFirst({ where: eq(tenants.slug, "spice-garden") }))!;
  console.log("Tenant:", tenant.name);

  const passwordHash = await bcrypt.hash("password123", 12);

  await db
    .insert(users)
    .values([
      { tenantId: tenant.id, name: "Raj Kumar",    email: "owner@spicegarden.com",   passwordHash, role: "owner",   phone: "+91-9876543210" },
      { tenantId: tenant.id, name: "Priya Sharma", email: "manager@spicegarden.com", passwordHash, role: "manager" },
      { tenantId: tenant.id, name: "Arun Cashier", email: "cashier@spicegarden.com", passwordHash, role: "cashier" },
      { tenantId: tenant.id, name: "Ravi Kitchen", email: "kitchen@spicegarden.com", passwordHash, role: "kitchen" },
    ])
    .onConflictDoNothing();

  console.log("Staff users seeded (skipped any duplicates)");

  // ── Menu ───────────────────────────────────────────────────────────────────
  // Only insert categories if none exist for this tenant
  const existingCats = await db.query.menuCategories.findMany({ where: eq(menuCategories.tenantId, tenant.id) });

  if (existingCats.length === 0) {
    const [starters, mains, breads, beverages, desserts] = await db
      .insert(menuCategories)
      .values([
        { tenantId: tenant.id, name: "Starters",    sortOrder: 1 },
        { tenantId: tenant.id, name: "Main Course", sortOrder: 2 },
        { tenantId: tenant.id, name: "Breads",      sortOrder: 3 },
        { tenantId: tenant.id, name: "Beverages",   sortOrder: 4 },
        { tenantId: tenant.id, name: "Desserts",    sortOrder: 5 },
      ])
      .returning();

    await db.insert(menuItems).values([
      { tenantId: tenant.id, categoryId: starters.id,  name: "Paneer Tikka",         price: "280.00", foodType: "veg",     gstRate: "5", description: "Grilled cottage cheese with spices" },
      { tenantId: tenant.id, categoryId: starters.id,  name: "Chicken Tikka",        price: "320.00", foodType: "non_veg", gstRate: "5", description: "Tender chicken marinated in yogurt" },
      { tenantId: tenant.id, categoryId: starters.id,  name: "Veg Samosa (2 pcs)",  price: "80.00",  foodType: "veg",     gstRate: "5" },
      { tenantId: tenant.id, categoryId: starters.id,  name: "Fish Amritsari",       price: "350.00", foodType: "non_veg", gstRate: "5" },
      { tenantId: tenant.id, categoryId: starters.id,  name: "Hara Bhara Kabab",     price: "220.00", foodType: "veg",     gstRate: "5" },
      { tenantId: tenant.id, categoryId: mains.id,     name: "Dal Makhani",           price: "240.00", foodType: "veg",     gstRate: "5", description: "Slow-cooked black lentils" },
      { tenantId: tenant.id, categoryId: mains.id,     name: "Paneer Butter Masala",  price: "280.00", foodType: "veg",     gstRate: "5" },
      { tenantId: tenant.id, categoryId: mains.id,     name: "Chicken Biryani",       price: "380.00", foodType: "non_veg", gstRate: "5", description: "Aromatic basmati with tender chicken" },
      { tenantId: tenant.id, categoryId: mains.id,     name: "Mutton Rogan Josh",     price: "420.00", foodType: "non_veg", gstRate: "5" },
      { tenantId: tenant.id, categoryId: mains.id,     name: "Veg Biryani",           price: "260.00", foodType: "veg",     gstRate: "5" },
      { tenantId: tenant.id, categoryId: mains.id,     name: "Palak Paneer",          price: "260.00", foodType: "veg",     gstRate: "5" },
      { tenantId: tenant.id, categoryId: mains.id,     name: "Butter Chicken",        price: "360.00", foodType: "non_veg", gstRate: "5" },
      { tenantId: tenant.id, categoryId: breads.id,    name: "Butter Naan",           price: "50.00",  foodType: "veg",     gstRate: "5" },
      { tenantId: tenant.id, categoryId: breads.id,    name: "Garlic Naan",           price: "60.00",  foodType: "veg",     gstRate: "5" },
      { tenantId: tenant.id, categoryId: breads.id,    name: "Tandoori Roti",         price: "35.00",  foodType: "veg",     gstRate: "5" },
      { tenantId: tenant.id, categoryId: breads.id,    name: "Paratha",               price: "55.00",  foodType: "veg",     gstRate: "5" },
      { tenantId: tenant.id, categoryId: beverages.id, name: "Mango Lassi",           price: "120.00", foodType: "veg",     gstRate: "5" },
      { tenantId: tenant.id, categoryId: beverages.id, name: "Masala Chai",           price: "60.00",  foodType: "veg",     gstRate: "5" },
      { tenantId: tenant.id, categoryId: beverages.id, name: "Fresh Lime Soda",       price: "80.00",  foodType: "veg",     gstRate: "5" },
      { tenantId: tenant.id, categoryId: desserts.id,  name: "Gulab Jamun (2 pcs)",  price: "120.00", foodType: "veg",     gstRate: "5" },
      { tenantId: tenant.id, categoryId: desserts.id,  name: "Kulfi",                 price: "140.00", foodType: "veg",     gstRate: "5" },
    ]);

    console.log("Menu seeded");
  } else {
    console.log("Menu already exists — skipped");
  }

  // ── Tables ─────────────────────────────────────────────────────────────────
  const existingTables = await db.query.restaurantTables.findMany({ where: eq(restaurantTables.tenantId, tenant.id) });

  if (existingTables.length === 0) {
    await db.insert(restaurantTables).values(
      ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"].map((name, i) => ({
        tenantId: tenant.id,
        name,
        capacity: i < 4 ? 4 : i < 6 ? 6 : 8,
      })),
    );
    console.log("Tables seeded");
  } else {
    console.log("Tables already exist — skipped");
  }

  console.log("\nSeed complete!");
  console.log("─────────────────────────────────────────");
  console.log("Web app login    : owner@spicegarden.com / password123");
  console.log("                   manager@spicegarden.com / password123");
  console.log("                   cashier@spicegarden.com / password123");
  console.log("Admin panel login: admin@restaurantos.com / admin123");
  console.log("─────────────────────────────────────────");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
