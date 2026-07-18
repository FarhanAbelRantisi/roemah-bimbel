import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@roemahbimbel.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@roemahbimbel.com",
      password: hashed,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin created: admin@roemahbimbel.com / admin123");
}

main().finally(() => prisma.$disconnect());