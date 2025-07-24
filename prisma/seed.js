import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;

  const hashedPassword1 = await bcrypt.hash("123456", saltRounds);
  const hashedPassword2 = await bcrypt.hash("123456", saltRounds);

  const master1 = await prisma.master.upsert({
    where: { email: "kedar@gmail.com" },
    update: {},
    create: {
      name: "Kedar",
      email: "kedar@gmail.com",
      password: hashedPassword1,
    },
  });

  const master2 = await prisma.master.upsert({
    where: { email: "gajanan@gmail.com" },
    update: {},
    create: {
      name: "Gajanan",
      email: "gajanan@gmail.com",
      password: hashedPassword2,
    },
  });

  console.log("Seeded Masters:", [master1, master2]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
