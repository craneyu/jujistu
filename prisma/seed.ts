import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.eventCategory.deleteMany();
  
  // 成人組 - 對打 (Fighting) 男子組
  const adultFightingMale = [
    { weightClass: '-56', minWeight: 0, maxWeight: 56.00, description: '-56公斤級' },
    { weightClass: '-62', minWeight: 56.01, maxWeight: 62.00, description: '-62公斤級' },
    { weightClass: '-69', minWeight: 62.01, maxWeight: 69.00, description: '-69公斤級' },
    { weightClass: '-77', minWeight: 69.01, maxWeight: 77.00, description: '-77公斤級' },
    { weightClass: '-85', minWeight: 77.01, maxWeight: 85.00, description: '-85公斤級' },
    { weightClass: '-94', minWeight: 85.01, maxWeight: 94.00, description: '-94公斤級' },
    { weightClass: '+94', minWeight: 94.01, maxWeight: 999, description: '+94公斤級' },
  ];
  
  for (const weight of adultFightingMale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'fighting',
        ageGroup: 'adult',
        gender: 'M',
        ...weight
      }
    });
  }
  
  // 成人組 - 對打 (Fighting) 女子組
  const adultFightingFemale = [
    { weightClass: '-49', minWeight: 0, maxWeight: 49.00, description: '-49公斤級' },
    { weightClass: '-55', minWeight: 49.01, maxWeight: 55.00, description: '-55公斤級' },
    { weightClass: '-62', minWeight: 55.01, maxWeight: 62.00, description: '-62公斤級' },
    { weightClass: '-70', minWeight: 62.01, maxWeight: 70.00, description: '-70公斤級' },
    { weightClass: '+70', minWeight: 70.01, maxWeight: 999, description: '+70公斤級' },
  ];
  
  for (const weight of adultFightingFemale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'fighting',
        ageGroup: 'adult',
        gender: 'F',
        ...weight
      }
    });
  }
  
  // 成人組 - 寢技 (Ne-Waza) 男子組 (與對打相同)
  for (const weight of adultFightingMale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'newaza',
        ageGroup: 'adult',
        gender: 'M',
        ...weight
      }
    });
  }
  
  // 成人組 - 寢技 (Ne-Waza) 女子組 (與對打相同)
  for (const weight of adultFightingFemale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'newaza',
        ageGroup: 'adult',
        gender: 'F',
        ...weight
      }
    });
  }
  
  // 成人組 - 格鬥 (Full Contact) 男子組 (與對打相同)
  for (const weight of adultFightingMale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'fullcontact',
        ageGroup: 'adult',
        gender: 'M',
        ...weight
      }
    });
  }
  
  // 成人組 - 格鬥 (Full Contact) 女子組 (與對打相同)
  for (const weight of adultFightingFemale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'fullcontact',
        ageGroup: 'adult',
        gender: 'F',
        ...weight
      }
    });
  }
  
  // 成人組 - 無道袍 (NO GI) 男子組 (與對打相同)
  for (const weight of adultFightingMale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'nogi',
        ageGroup: 'adult',
        gender: 'M',
        ...weight
      }
    });
  }
  
  // 成人組 - 無道袍 (NO GI) 女子組 (與對打相同)
  for (const weight of adultFightingFemale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'nogi',
        ageGroup: 'adult',
        gender: 'F',
        ...weight
      }
    });
  }
  
  // 青年組 - 對打 (Fighting) 男子組
  const youthFightingMale = [
    { weightClass: '-46', minWeight: 0, maxWeight: 46.00, description: '-46公斤級' },
    { weightClass: '-50', minWeight: 46.01, maxWeight: 50.00, description: '-50公斤級' },
    { weightClass: '-55', minWeight: 50.01, maxWeight: 55.00, description: '-55公斤級' },
    { weightClass: '-60', minWeight: 55.01, maxWeight: 60.00, description: '-60公斤級' },
    { weightClass: '-66', minWeight: 60.01, maxWeight: 66.00, description: '-66公斤級' },
    { weightClass: '-73', minWeight: 66.01, maxWeight: 73.00, description: '-73公斤級' },
    { weightClass: '-81', minWeight: 73.01, maxWeight: 81.00, description: '-81公斤級' },
    { weightClass: '+81', minWeight: 81.01, maxWeight: 999, description: '+81公斤級' },
  ];
  
  for (const weight of youthFightingMale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'fighting',
        ageGroup: 'youth',
        gender: 'M',
        ...weight
      }
    });
  }
  
  // 青年組 - 對打 (Fighting) 女子組
  const youthFightingFemale = [
    { weightClass: '-40', minWeight: 0, maxWeight: 40.00, description: '-40公斤級' },
    { weightClass: '-44', minWeight: 40.01, maxWeight: 44.00, description: '-44公斤級' },
    { weightClass: '-48', minWeight: 44.01, maxWeight: 48.00, description: '-48公斤級' },
    { weightClass: '-52', minWeight: 48.01, maxWeight: 52.00, description: '-52公斤級' },
    { weightClass: '-57', minWeight: 52.01, maxWeight: 57.00, description: '-57公斤級' },
    { weightClass: '-63', minWeight: 57.01, maxWeight: 63.00, description: '-63公斤級' },
    { weightClass: '-70', minWeight: 63.01, maxWeight: 70.00, description: '-70公斤級' },
    { weightClass: '+70', minWeight: 70.01, maxWeight: 999, description: '+70公斤級' },
  ];
  
  for (const weight of youthFightingFemale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'fighting',
        ageGroup: 'youth',
        gender: 'F',
        ...weight
      }
    });
  }
  
  // 青年組 - 寢技 (Ne-Waza) 男子組 (與對打相同)
  for (const weight of youthFightingMale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'newaza',
        ageGroup: 'youth',
        gender: 'M',
        ...weight
      }
    });
  }
  
  // 青年組 - 寢技 (Ne-Waza) 女子組 (與對打相同)
  for (const weight of youthFightingFemale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'newaza',
        ageGroup: 'youth',
        gender: 'F',
        ...weight
      }
    });
  }
  
  // 青少年組 - 對打 (Fighting) 男子組
  const juniorFightingMale = [
    { weightClass: '-30', minWeight: 0, maxWeight: 30.00, description: '-30公斤級' },
    { weightClass: '-34', minWeight: 30.01, maxWeight: 34.00, description: '-34公斤級' },
    { weightClass: '-38', minWeight: 34.01, maxWeight: 38.00, description: '-38公斤級' },
    { weightClass: '-42', minWeight: 38.01, maxWeight: 42.00, description: '-42公斤級' },
    { weightClass: '-46', minWeight: 42.01, maxWeight: 46.00, description: '-46公斤級' },
    { weightClass: '-50', minWeight: 46.01, maxWeight: 50.00, description: '-50公斤級' },
    { weightClass: '-55', minWeight: 50.01, maxWeight: 55.00, description: '-55公斤級' },
    { weightClass: '-60', minWeight: 55.01, maxWeight: 60.00, description: '-60公斤級' },
    { weightClass: '-66', minWeight: 60.01, maxWeight: 66.00, description: '-66公斤級' },
    { weightClass: '+66', minWeight: 66.01, maxWeight: 999, description: '+66公斤級' },
  ];
  
  for (const weight of juniorFightingMale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'fighting',
        ageGroup: 'junior',
        gender: 'M',
        ...weight
      }
    });
  }
  
  // 青少年組 - 對打 (Fighting) 女子組
  const juniorFightingFemale = [
    { weightClass: '-25', minWeight: 0, maxWeight: 25.00, description: '-25公斤級' },
    { weightClass: '-28', minWeight: 25.01, maxWeight: 28.00, description: '-28公斤級' },
    { weightClass: '-32', minWeight: 28.01, maxWeight: 32.00, description: '-32公斤級' },
    { weightClass: '-36', minWeight: 32.01, maxWeight: 36.00, description: '-36公斤級' },
    { weightClass: '-40', minWeight: 36.01, maxWeight: 40.00, description: '-40公斤級' },
    { weightClass: '-44', minWeight: 40.01, maxWeight: 44.00, description: '-44公斤級' },
    { weightClass: '-48', minWeight: 44.01, maxWeight: 48.00, description: '-48公斤級' },
    { weightClass: '-52', minWeight: 48.01, maxWeight: 52.00, description: '-52公斤級' },
    { weightClass: '-57', minWeight: 52.01, maxWeight: 57.00, description: '-57公斤級' },
    { weightClass: '+57', minWeight: 57.01, maxWeight: 999, description: '+57公斤級' },
  ];
  
  for (const weight of juniorFightingFemale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'fighting',
        ageGroup: 'junior',
        gender: 'F',
        ...weight
      }
    });
  }
  
  // 青少年組 - 寢技 (Ne-Waza) 男子組 (與對打相同)
  for (const weight of juniorFightingMale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'newaza',
        ageGroup: 'junior',
        gender: 'M',
        ...weight
      }
    });
  }
  
  // 青少年組 - 寢技 (Ne-Waza) 女子組 (與對打相同)
  for (const weight of juniorFightingFemale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'newaza',
        ageGroup: 'junior',
        gender: 'F',
        ...weight
      }
    });
  }
  
  // 兒童組 - 寢技 (Ne-Waza)
  const childNewaza = [
    { weightClass: '-26', minWeight: 0, maxWeight: 26.00, description: '-26公斤級' },
    { weightClass: '-30', minWeight: 26.01, maxWeight: 30.00, description: '-30公斤級' },
    { weightClass: '-34', minWeight: 30.01, maxWeight: 34.00, description: '-34公斤級' },
    { weightClass: '-38', minWeight: 34.01, maxWeight: 38.00, description: '-38公斤級' },
    { weightClass: '-42', minWeight: 38.01, maxWeight: 42.00, description: '-42公斤級' },
    { weightClass: '-46', minWeight: 42.01, maxWeight: 46.00, description: '-46公斤級' },
    { weightClass: '-50', minWeight: 46.01, maxWeight: 50.00, description: '-50公斤級' },
    { weightClass: '-55', minWeight: 50.01, maxWeight: 55.00, description: '-55公斤級' },
    { weightClass: '+55', minWeight: 55.01, maxWeight: 999, description: '+55公斤級' },
  ];
  
  for (const weight of childNewaza) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'newaza',
        ageGroup: 'child',
        gender: null, // 兒童組不分性別
        ...weight
      }
    });
  }
  
  // 大師組 - 對打 (Fighting) 男子組 (與成人組相同)
  for (const weight of adultFightingMale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'fighting',
        ageGroup: 'master',
        gender: 'M',
        ...weight
      }
    });
  }
  
  // 大師組 - 對打 (Fighting) 女子組 (與成人組相同)
  for (const weight of adultFightingFemale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'fighting',
        ageGroup: 'master',
        gender: 'F',
        ...weight
      }
    });
  }
  
  // 大師組 - 寢技 (Ne-Waza) 男子組 (與成人組相同)
  for (const weight of adultFightingMale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'newaza',
        ageGroup: 'master',
        gender: 'M',
        ...weight
      }
    });
  }
  
  // 大師組 - 寢技 (Ne-Waza) 女子組 (與成人組相同)
  for (const weight of adultFightingFemale) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'newaza',
        ageGroup: 'master',
        gender: 'F',
        ...weight
      }
    });
  }
  
  // 演武組 (Duo) - 不分體重
  const duoCategories = [
    { gender: 'M', description: '雙人演武男子組' },
    { gender: 'F', description: '雙人演武女子組' },
    { gender: 'mixed', description: '雙人演武男女混合組' },
  ];
  
  for (const duo of duoCategories) {
    await prisma.eventCategory.create({
      data: {
        eventType: 'duo',
        ageGroup: 'adult', // 演武組都是成人組(12歲以上)
        gender: duo.gender,
        weightClass: 'all',
        minWeight: null,
        maxWeight: null,
        description: duo.description
      }
    });
  }
  
  // 系統設定
  await prisma.systemConfig.createMany({
    data: [
      { key: 'competition_date', value: '2025-10-26', description: '比賽日期' },
      { key: 'registration_fee_per_event', value: '1000', description: '每項目報名費' },
      { key: 'registration_deadline', value: '2025-10-01', description: '報名截止日期' },
      { key: 'bank_name', value: '第一銀行', description: '匯款銀行' },
      { key: 'bank_account', value: '123-456-789012', description: '匯款帳號' },
      { key: 'competition_name', value: '2025年全國柔術錦標賽', description: '比賽名稱' },
    ]
  });
  
  console.log('Seed data created successfully!');
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