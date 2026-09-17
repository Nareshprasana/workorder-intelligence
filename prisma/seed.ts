import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database (simplified reset)...");
  // Clean existing data in dependency order - reset all dev data
  await prisma.notification.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.incident.deleteMany();
  // Keep SOP/Property/Client tables but clear them (not required for product) - Asset removed
  try { await prisma.property.deleteMany(); } catch {}
  try { await prisma.client.deleteMany(); } catch {}
  try { await prisma.sOP.deleteMany(); } catch {}
  await prisma.worker.deleteMany();
  try { await prisma.resident.deleteMany(); } catch {}

  // Residents
  const residents = await Promise.all([
    prisma.resident.create({ data: { name: "Ravi Kumar", apartment: "B-401", building: "Block B", email: "ravi.kumar@example.com", phone: "9876543210", status: "ACTIVE" } }),
    prisma.resident.create({ data: { name: "Priya Sharma", apartment: "A-203", building: "Block A", email: "priya.sharma@example.com", phone: "9876543211", status: "ACTIVE" } }),
    prisma.resident.create({ data: { name: "Arun Kumar", apartment: "A-105", building: "Block A", email: "arun.kumar@example.com", phone: "9876543212", status: "ACTIVE" } }),
    prisma.resident.create({ data: { name: "Meera Singh", apartment: "C-302", building: "Block C", email: "meera.singh@example.com", phone: "9876543213", status: "ACTIVE" } }),
  ]);
  console.log(`✓ Created ${residents.length} residents`);

  // Workers
  const workers = await Promise.all([
    prisma.worker.create({ data: { name: "Ravi Technician", skills: "HVAC, Electrical", location: "Block B", status: "AVAILABLE" } }),
    prisma.worker.create({ data: { name: "Arun Technician", skills: "Plumbing", location: "Block A", status: "AVAILABLE" } }),
    prisma.worker.create({ data: { name: "Suresh Technician", skills: "Electrical", location: "Block B", status: "AVAILABLE" } }),
    prisma.worker.create({ data: { name: "Manoj Technician", skills: "General Maintenance", location: "Block A", status: "AVAILABLE" } }),
  ]);
  console.log(`✓ Created ${workers.length} workers`);

  console.log(`✓ No demo complaints created (clean slate)`);
  console.log("✅ Database seeded successfully! Resident → Complaint → AI → Worker flow ready.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
