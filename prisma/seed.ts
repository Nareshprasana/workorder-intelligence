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
  // Keep Asset/SOP/Property/Client tables but clear them (not required for product)
  try { await prisma.asset.deleteMany(); } catch {}
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

  // Minimal complaints - mix of statuses to demonstrate workflow, but keep simple
  // We'll create one READY complaint with work order to show live data, and one NEW
  const ravi = residents.find(r => r.name === "Ravi Kumar");
  const priya = residents.find(r => r.name === "Priya Sharma");

  // Create a complaint that will be NEW -> will be analyzed on demand (not pre-analyzed to keep AI live)
  await prisma.incident.create({
    data: {
      description: "AC is not cooling in room 401",
      location: "Block B, Room 401",
      residentId: ravi.id,
      reporterName: ravi.name,
      reporterEmail: ravi.email,
      reporterPhone: ravi.phone,
      status: "NEW",
    },
  });

  await prisma.incident.create({
    data: {
      description: "Water leakage in bathroom, Block A Room 203",
      location: "Block A, Room 203",
      residentId: priya.id,
      reporterName: priya.name,
      reporterEmail: priya.email,
      reporterPhone: priya.phone,
      status: "NEW",
    },
  });

  console.log(`✓ Created 2 demo complaints (NEW)`);
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
