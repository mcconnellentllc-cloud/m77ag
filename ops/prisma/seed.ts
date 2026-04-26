import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed entities
  const entities = [
    { slug: "m77ag", name: "M77 AG", color: "#16a34a", icon: "Tractor", description: "Farm & ranch, custom farming" },
    { slug: "cattle", name: "McConnell Cattle", color: "#92400e", icon: "Beef", description: "Cattle operations" },
    { slug: "pioneer", name: "Pioneer Seeds", color: "#f59e0b", icon: "Wheat", description: "Pioneer/Corteva seed sales" },
    { slug: "togoag", name: "ToGoAG", color: "#ec4899", icon: "Store", description: "Retail business" },
    { slug: "acreprofit", name: "AcreProfit", color: "#8b5cf6", icon: "FlaskConical", description: "Chemical sales" },
    { slug: "cocorn", name: "Colorado Corn / CCGA", color: "#eab308", icon: "Sprout", description: "Board & association work" },
    { slug: "hunting", name: "Hunting", color: "#78716c", icon: "Target", description: "Commercial hunting operations" },
    { slug: "mcconnellent", name: "McConnell Enterprises", color: "#3b82f6", icon: "Building2", description: "Holding company, bills" },
    { slug: "personal", name: "Personal / Family", color: "#06b6d4", icon: "Users", description: "Kyle & Brandi personal" },
    { slug: "flamesoffury", name: "Flames of Fury", color: "#ef4444", icon: "Flame", description: "Book project" },
  ];

  for (const entity of entities) {
    await prisma.entity.upsert({
      where: { slug: entity.slug },
      update: entity,
      create: entity,
    });
  }
  console.log(`Seeded ${entities.length} entities`);

  // Seed users — Kyle and Brandi only
  const passwordHash = await bcrypt.hash("changeme123", 12);

  const users = [
    { email: "kyle@togoag.com", name: "Kyle McConnell", passwordHash },
    { email: "brandi@togoag.com", name: "Brandi McConnell", passwordHash },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name },
      create: user,
    });
  }
  console.log(`Seeded ${users.length} users`);

  // Seed email account definitions (tokens will be added via OAuth flows)
  const kyleUser = await prisma.user.findUnique({ where: { email: "kyle@togoag.com" } });
  if (!kyleUser) throw new Error("Kyle user not found");

  const entityMap: Record<string, string> = {};
  for (const e of entities) {
    const found = await prisma.entity.findUnique({ where: { slug: e.slug } });
    if (found) entityMap[e.slug] = found.id;
  }

  const emailAccounts = [
    // Gmail accounts
    { provider: "gmail", emailAddress: "kyle.d.mcconnell@gmail.com", displayName: "Kyle Personal Gmail", entityId: entityMap["personal"] },
    { provider: "gmail", emailAddress: "m77angus@gmail.com", displayName: "M77 AG Gmail", entityId: entityMap["m77ag"] },
    { provider: "gmail", emailAddress: "mcconnellentllc@gmail.com", displayName: "McConnell Enterprises Gmail", entityId: entityMap["mcconnellent"] },
    // Microsoft 365 accounts
    { provider: "outlook", emailAddress: "kyle@togoag.com", displayName: "Kyle ToGoAG", entityId: entityMap["togoag"] },
    { provider: "outlook", emailAddress: "office@m77ag.com", displayName: "M77 AG Office", entityId: entityMap["m77ag"], isSharedMailbox: true },
    { provider: "outlook", emailAddress: "hunting@m77ag.com", displayName: "Hunting", entityId: entityMap["hunting"], isSharedMailbox: true },
    { provider: "outlook", emailAddress: "info@youraginfo.com", displayName: "Pioneer Info", entityId: entityMap["pioneer"], isSharedMailbox: true },
    { provider: "outlook", emailAddress: "contact@acreprofit.com", displayName: "AcreProfit", entityId: entityMap["acreprofit"], isSharedMailbox: true },
    { provider: "outlook", emailAddress: "office@cologrowers.com", displayName: "Colorado Corn", entityId: entityMap["cocorn"], isSharedMailbox: true },
    { provider: "outlook", emailAddress: "fire@flamesoffury.com", displayName: "Flames of Fury", entityId: entityMap["flamesoffury"], isSharedMailbox: true },
  ];

  for (const account of emailAccounts) {
    await prisma.emailAccount.upsert({
      where: { emailAddress: account.emailAddress },
      update: {
        displayName: account.displayName,
        entityId: account.entityId,
      },
      create: {
        userId: kyleUser.id,
        provider: account.provider,
        emailAddress: account.emailAddress,
        displayName: account.displayName,
        entityId: account.entityId || null,
        isSharedMailbox: account.isSharedMailbox || false,
        syncEnabled: false, // Disabled until OAuth tokens are set up
      },
    });
  }
  console.log(`Seeded ${emailAccounts.length} email accounts`);

  console.log("Seed complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
