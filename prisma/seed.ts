import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data in dependency order
  await prisma.notification.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.property.deleteMany();
  await prisma.client.deleteMany();
  await prisma.sOP.deleteMany();
  await prisma.worker.deleteMany();

  const workers = await Promise.all([
    prisma.worker.create({
      data: {
        name: "Ravi Kumar",
        skills: "HVAC, Electrical",
        location: "Block B",
        status: "AVAILABLE",
      },
    }),
    prisma.worker.create({
      data: {
        name: "Arun Kumar",
        skills: "Plumbing",
        location: "Block A",
        status: "AVAILABLE",
      },
    }),
    prisma.worker.create({
      data: {
        name: "Kumar Raj",
        skills: "HVAC",
        location: "Block C",
        status: "BUSY",
      },
    }),
    prisma.worker.create({
      data: {
        name: "Suresh",
        skills: "Electrical",
        location: "Block B",
        status: "AVAILABLE",
      },
    }),
    prisma.worker.create({
      data: {
        name: "Manoj",
        skills: "General Maintenance",
        location: "Block A",
        status: "AVAILABLE",
      },
    }),
  ]);

  console.log(`✓ Created ${workers.length} workers`);

  // Create Clients
  const divyaSree = await prisma.client.create({
    data: {
      name: "DivyaSree Facilities",
      email: "facilities@divyasree.com",
      phone: "9876543210",
      companyName: "DivyaSree Group",
      status: "ACTIVE",
    },
  });

  const sunrise = await prisma.client.create({
    data: {
      name: "Sunrise Estates",
      email: "contact@sunrise-estates.com",
      phone: "9876500001",
      companyName: "Sunrise Group",
      status: "ACTIVE",
    },
  });

  const inactiveClient = await prisma.client.create({
    data: {
      name: "Inactive Properties Ltd",
      email: "inactive@example.com",
      phone: "9999999999",
      companyName: "Inactive Ltd",
      status: "INACTIVE",
    },
  });

  console.log(`✓ Created 3 clients`);

  // Create Properties
  const blockA = await prisma.property.create({
    data: {
      name: "DivyaSree Block A",
      propertyCode: "PROP-BLOCK-A-001",
      address: "DivyaSree Campus, Block A, Bangalore - 560001",
      clientId: divyaSree.id,
    },
  });

  const blockB = await prisma.property.create({
    data: {
      name: "DivyaSree Block B",
      propertyCode: "PROP-BLOCK-B-001",
      address: "DivyaSree Campus, Block B, Bangalore - 560001",
      clientId: divyaSree.id,
    },
  });

  const blockC = await prisma.property.create({
    data: {
      name: "DivyaSree Block C",
      propertyCode: "PROP-BLOCK-C-001",
      address: "DivyaSree Campus, Block C, Bangalore - 560001",
      clientId: divyaSree.id,
    },
  });

  const sunriseTower = await prisma.property.create({
    data: {
      name: "Sunrise Tower 1",
      propertyCode: "PROP-SUNRISE-001",
      address: "Sunrise Estate, Tower 1, Bangalore - 560002",
      clientId: sunrise.id,
    },
  });

  const inactiveProp = await prisma.property.create({
    data: {
      name: "Inactive Property",
      propertyCode: "PROP-INACTIVE-001",
      address: "Inactive Address",
      clientId: inactiveClient.id,
    },
  });

  console.log(`✓ Created 5 properties`);

  const assets = await Promise.all([
    prisma.asset.create({
      data: {
        assetCode: "AC-B4-401",
        name: "Split AC - Room 401",
        category: "HVAC",
        location: "Block B / Floor 4 / Room 401",
        description: "1.5 ton split air conditioner",
        propertyId: blockB.id,
      },
    }),
    prisma.asset.create({
      data: {
        assetCode: "AC-B4-402",
        name: "Split AC - Room 402",
        category: "HVAC",
        location: "Block B / Floor 4 / Room 402",
        description: "1.5 ton split air conditioner",
        propertyId: blockB.id,
      },
    }),
    prisma.asset.create({
      data: {
        assetCode: "AC-B4-403",
        name: "Split AC - Room 403",
        category: "HVAC",
        location: "Block B / Floor 4 / Room 403",
        description: "2 ton split air conditioner",
        propertyId: blockB.id,
      },
    }),
    prisma.asset.create({
      data: {
        assetCode: "LIFT-A-01",
        name: "Passenger Lift A1",
        category: "LIFT",
        location: "Block A / Main Lobby",
        description: "Passenger elevator",
        propertyId: blockA.id,
      },
    }),
    prisma.asset.create({
      data: {
        assetCode: "LIFT-A-02",
        name: "Passenger Lift A2",
        category: "LIFT",
        location: "Block A / Main Lobby",
        description: "Passenger elevator",
        propertyId: blockA.id,
      },
    }),
    prisma.asset.create({
      data: {
        assetCode: "PUMP-A-01",
        name: "Water Pump A1",
        category: "PLUMBING",
        location: "Block A / Basement",
        description: "Main water supply pump",
        propertyId: blockA.id,
      },
    }),
    prisma.asset.create({
      data: {
        assetCode: "GEN-A-01",
        name: "Backup Generator",
        category: "ELECTRICAL",
        location: "Block A / Utility Area",
        description: "250 KVA backup generator",
        propertyId: blockA.id,
      },
    }),
    prisma.asset.create({
      data: {
        assetCode: "AC-C2-201",
        name: "Split AC - Room 201",
        category: "HVAC",
        location: "Block C / Floor 2 / Room 201",
        description: "1.5 ton split air conditioner",
        propertyId: blockC.id,
      },
    }),
    prisma.asset.create({
      data: {
        assetCode: "PUMP-B-01",
        name: "Water Pump B1",
        category: "PLUMBING",
        location: "Block B / Basement",
        description: "Water circulation pump",
        propertyId: blockB.id,
      },
    }),
    prisma.asset.create({
      data: {
        assetCode: "DB-B4-01",
        name: "Electrical Distribution Board",
        category: "ELECTRICAL",
        location: "Block B / Floor 4",
        description: "Main electrical distribution panel",
        propertyId: blockB.id,
      },
    }),
  ]);

  console.log(`✓ Created ${assets.length} assets`);

  const sops = await Promise.all([
    prisma.sOP.create({
      data: {
        title: "HVAC - Cooling Failure",
        category: "HVAC",
        content:
          "Check air filter, evaporator coil, thermostat, refrigerant performance and compressor. Do not assume refrigerant leakage without inspection.",
      },
    }),
    prisma.sOP.create({
      data: {
        title: "HVAC - Water Leakage",
        category: "HVAC",
        content:
          "Inspect condensate drain, drain tray, indoor coil and pipe connections. Isolate the affected area if water may damage electrical equipment.",
      },
    }),
    prisma.sOP.create({
      data: {
        title: "Electrical - Power Failure",
        category: "ELECTRICAL",
        content:
          "Check whether the affected circuit is isolated. Inspect breaker status and electrical panel. Do not access exposed electrical components without appropriate safety procedures.",
      },
    }),
    prisma.sOP.create({
      data: {
        title: "Plumbing - Water Leakage",
        category: "PLUMBING",
        content:
          "Identify the source, isolate the water supply when required, protect nearby equipment and inspect pipes, valves and drainage.",
      },
    }),
    prisma.sOP.create({
      data: {
        title: "Lift - Abnormal Noise",
        category: "LIFT",
        content:
          "Remove the lift from normal service if safety is uncertain. Notify the lift maintenance team and inspect according to the approved maintenance procedure.",
      },
    }),
  ]);

  console.log(`✓ Created ${sops.length} SOPs`);

  const ac402 = assets.find((a) => a.assetCode === "AC-B4-402");
  const ac401 = assets.find((a) => a.assetCode === "AC-B4-401");
  const liftA1 = assets.find((a) => a.assetCode === "LIFT-A-01");
  const pumpA1 = assets.find((a) => a.assetCode === "PUMP-A-01");
  const dbB4 = assets.find((a) => a.assetCode === "DB-B4-01");

  const incidents = [
    {
      description: "AC in room 402 is not cooling",
      category: "HVAC",
      location: "Block B / Floor 4 / Room 402",
      assetId: ac402.id,
      clientId: divyaSree.id,
      propertyId: blockB.id,
      reporterName: "Facility Manager",
      reporterEmail: "manager@divyasree.com",
      issue: "Cooling failure",
      severity: "MEDIUM",
      confidence: 0.95,
      status: "COMPLETED",
      aiAnalysis: "Cooling failure identified.",
      recommendedAction: "Inspect filter and evaporator coil.",
    },
    {
      description: "AC in room 402 stopped cooling last month",
      category: "HVAC",
      location: "Block B / Floor 4 / Room 402",
      assetId: ac402.id,
      clientId: divyaSree.id,
      propertyId: blockB.id,
      reporterName: "Facility Manager",
      issue: "Cooling failure",
      severity: "MEDIUM",
      confidence: 0.94,
      status: "COMPLETED",
      aiAnalysis: "Previous HVAC cooling incident.",
      recommendedAction: "Filter cleaning and cooling system inspection.",
    },
    {
      description: "AC in room 401 making noise",
      category: "HVAC",
      location: "Block B / Floor 4 / Room 401",
      assetId: ac401.id,
      clientId: divyaSree.id,
      propertyId: blockB.id,
      reporterName: "Tenant - Room 401",
      issue: "Unusual noise",
      severity: "LOW",
      confidence: 0.91,
      status: "COMPLETED",
      aiAnalysis: "Possible mechanical issue.",
      recommendedAction: "Inspect indoor blower and fan assembly.",
    },
    {
      description: "Lift A1 making abnormal noise",
      category: "LIFT",
      location: "Block A / Main Lobby",
      assetId: liftA1.id,
      clientId: divyaSree.id,
      propertyId: blockA.id,
      reporterName: "Security",
      issue: "Abnormal noise",
      severity: "HIGH",
      confidence: 0.93,
      status: "COMPLETED",
      aiAnalysis: "Potential lift mechanical issue.",
      recommendedAction: "Inspect according to lift maintenance procedure.",
    },
    {
      description: "Low water pressure in Block A",
      category: "PLUMBING",
      location: "Block A / Basement",
      assetId: pumpA1.id,
      clientId: divyaSree.id,
      propertyId: blockA.id,
      reporterName: "Maintenance Staff",
      issue: "Low water pressure",
      severity: "MEDIUM",
      confidence: 0.88,
      status: "COMPLETED",
      aiAnalysis: "Possible pump or supply issue.",
      recommendedAction: "Inspect water pump and supply pressure.",
    },
    {
      description: "Electrical breaker tripped in Block B",
      category: "ELECTRICAL",
      location: "Block B / Floor 4",
      assetId: dbB4.id,
      clientId: divyaSree.id,
      propertyId: blockB.id,
      reporterName: "Electrician",
      issue: "Power interruption",
      severity: "HIGH",
      confidence: 0.92,
      status: "COMPLETED",
      aiAnalysis: "Electrical circuit interruption.",
      recommendedAction: "Inspect breaker and affected circuit.",
    },
  ];

  for (const incident of incidents) {
    await prisma.incident.create({
      data: incident,
    });
  }

  console.log(`✓ Created ${incidents.length} historical incidents`);
  console.log("✅ Database seeded successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
