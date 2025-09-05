const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("正在初始化 SQLite 資料庫...");

  // 檢查是否已有管理員帳戶
  const adminExists = await prisma.registrationUnit.findFirst({
    where: {
      email: "admin@jujitsu.com",
    },
  });

  if (!adminExists) {
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await prisma.registrationUnit.create({
      data: {
        name: "系統管理員",
        contactName: "管理員",
        phone: "0900000000",
        email: "admin@jujitsu.com",
        password: hashedPassword,
        isAdmin: true,
      },
    });

    console.log("✅ 已建立預設管理員帳戶");
    console.log("帳號: admin@jujitsu.com");
    console.log("密碼: admin123");
  } else {
    console.log("✅ 管理員帳戶已存在");
  }

  console.log("✅ 資料庫初始化完成");
}

main()
  .catch((e) => {
    console.error("❌ 資料庫初始化失敗:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
