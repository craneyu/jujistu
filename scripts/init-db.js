const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("正在初始化資料庫...");

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
        // 注意：RegistrationUnit 沒有 isAdmin 欄位。後台登入走 /api/admin/login
        // 的固定帳密（admin / admin123），不經過這張表。
      },
    });

    console.log("✅ 已建立預設報名單位帳戶");
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
