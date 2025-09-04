import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('開始建立預設競賽項目...')

  // Clear existing data
  await prisma.eventCategory.deleteMany();
  await prisma.eventType.deleteMany();

  // 建立項目類型
  const eventTypes = [
    {
      key: 'fighting',
      name: '對打',
      description: '傳統柔術對打項目',
      requiresTeam: false
    },
    {
      key: 'newaza',
      name: '寢技',
      description: '地面技術競賽',
      requiresTeam: false
    },
    {
      key: 'fullcontact',
      name: '格鬥',
      description: '全接觸格鬥項目',
      requiresTeam: false
    },
    {
      key: 'duo_traditional',
      name: '傳統演武',
      description: '傳統套路雙人演武',
      requiresTeam: true
    },
    {
      key: 'duo_creative',
      name: '創意演武',
      description: '創意套路雙人演武',
      requiresTeam: true
    },
    {
      key: 'nogi',
      name: '無道袍',
      description: '不穿道袍的競技項目',
      requiresTeam: false
    }
  ];

  const createdEventTypes: { [key: string]: string } = {};
  
  for (const eventType of eventTypes) {
    const created = await prisma.eventType.create({
      data: eventType
    });
    createdEventTypes[eventType.key] = created.id;
    console.log(`✓ 建立項目類型: ${eventType.name}`);
  }

  // 定義各項目的組別與量級
  const categories = [
    // 對打 - 成人組男子
    { eventKey: 'fighting', ageGroup: 'adult', gender: 'M', weightClass: '-56', minWeight: 0, maxWeight: 56, description: '成人男子 -56公斤級' },
    { eventKey: 'fighting', ageGroup: 'adult', gender: 'M', weightClass: '-62', minWeight: 56.01, maxWeight: 62, description: '成人男子 -62公斤級' },
    { eventKey: 'fighting', ageGroup: 'adult', gender: 'M', weightClass: '-69', minWeight: 62.01, maxWeight: 69, description: '成人男子 -69公斤級' },
    { eventKey: 'fighting', ageGroup: 'adult', gender: 'M', weightClass: '-77', minWeight: 69.01, maxWeight: 77, description: '成人男子 -77公斤級' },
    { eventKey: 'fighting', ageGroup: 'adult', gender: 'M', weightClass: '-85', minWeight: 77.01, maxWeight: 85, description: '成人男子 -85公斤級' },
    { eventKey: 'fighting', ageGroup: 'adult', gender: 'M', weightClass: '-94', minWeight: 85.01, maxWeight: 94, description: '成人男子 -94公斤級' },
    { eventKey: 'fighting', ageGroup: 'adult', gender: 'M', weightClass: '+94', minWeight: 94.01, maxWeight: null, description: '成人男子 +94公斤級' },

    // 對打 - 成人組女子
    { eventKey: 'fighting', ageGroup: 'adult', gender: 'F', weightClass: '-49', minWeight: 0, maxWeight: 49, description: '成人女子 -49公斤級' },
    { eventKey: 'fighting', ageGroup: 'adult', gender: 'F', weightClass: '-55', minWeight: 49.01, maxWeight: 55, description: '成人女子 -55公斤級' },
    { eventKey: 'fighting', ageGroup: 'adult', gender: 'F', weightClass: '-62', minWeight: 55.01, maxWeight: 62, description: '成人女子 -62公斤級' },
    { eventKey: 'fighting', ageGroup: 'adult', gender: 'F', weightClass: '-70', minWeight: 62.01, maxWeight: 70, description: '成人女子 -70公斤級' },
    { eventKey: 'fighting', ageGroup: 'adult', gender: 'F', weightClass: '+70', minWeight: 70.01, maxWeight: null, description: '成人女子 +70公斤級' },

    // 寢技 - 成人組 (使用相同量級)
    { eventKey: 'newaza', ageGroup: 'adult', gender: 'M', weightClass: '-56', minWeight: 0, maxWeight: 56, description: '成人男子 -56公斤級' },
    { eventKey: 'newaza', ageGroup: 'adult', gender: 'M', weightClass: '-62', minWeight: 56.01, maxWeight: 62, description: '成人男子 -62公斤級' },
    { eventKey: 'newaza', ageGroup: 'adult', gender: 'M', weightClass: '-69', minWeight: 62.01, maxWeight: 69, description: '成人男子 -69公斤級' },
    { eventKey: 'newaza', ageGroup: 'adult', gender: 'M', weightClass: '-77', minWeight: 69.01, maxWeight: 77, description: '成人男子 -77公斤級' },
    { eventKey: 'newaza', ageGroup: 'adult', gender: 'M', weightClass: '-85', minWeight: 77.01, maxWeight: 85, description: '成人男子 -85公斤級' },
    { eventKey: 'newaza', ageGroup: 'adult', gender: 'M', weightClass: '-94', minWeight: 85.01, maxWeight: 94, description: '成人男子 -94公斤級' },
    { eventKey: 'newaza', ageGroup: 'adult', gender: 'M', weightClass: '+94', minWeight: 94.01, maxWeight: null, description: '成人男子 +94公斤級' },

    { eventKey: 'newaza', ageGroup: 'adult', gender: 'F', weightClass: '-49', minWeight: 0, maxWeight: 49, description: '成人女子 -49公斤級' },
    { eventKey: 'newaza', ageGroup: 'adult', gender: 'F', weightClass: '-55', minWeight: 49.01, maxWeight: 55, description: '成人女子 -55公斤級' },
    { eventKey: 'newaza', ageGroup: 'adult', gender: 'F', weightClass: '-62', minWeight: 55.01, maxWeight: 62, description: '成人女子 -62公斤級' },
    { eventKey: 'newaza', ageGroup: 'adult', gender: 'F', weightClass: '-70', minWeight: 62.01, maxWeight: 70, description: '成人女子 -70公斤級' },
    { eventKey: 'newaza', ageGroup: 'adult', gender: 'F', weightClass: '+70', minWeight: 70.01, maxWeight: null, description: '成人女子 +70公斤級' },

    // 寢技 - 兒童組
    { eventKey: 'newaza', ageGroup: 'child', gender: 'M', weightClass: '-26', minWeight: 0, maxWeight: 26, description: '兒童男子 -26公斤級' },
    { eventKey: 'newaza', ageGroup: 'child', gender: 'M', weightClass: '-30', minWeight: 26.01, maxWeight: 30, description: '兒童男子 -30公斤級' },
    { eventKey: 'newaza', ageGroup: 'child', gender: 'M', weightClass: '-34', minWeight: 30.01, maxWeight: 34, description: '兒童男子 -34公斤級' },
    { eventKey: 'newaza', ageGroup: 'child', gender: 'M', weightClass: '+34', minWeight: 34.01, maxWeight: null, description: '兒童男子 +34公斤級' },
    
    { eventKey: 'newaza', ageGroup: 'child', gender: 'F', weightClass: '-26', minWeight: 0, maxWeight: 26, description: '兒童女子 -26公斤級' },
    { eventKey: 'newaza', ageGroup: 'child', gender: 'F', weightClass: '-30', minWeight: 26.01, maxWeight: 30, description: '兒童女子 -30公斤級' },
    { eventKey: 'newaza', ageGroup: 'child', gender: 'F', weightClass: '-34', minWeight: 30.01, maxWeight: 34, description: '兒童女子 -34公斤級' },
    { eventKey: 'newaza', ageGroup: 'child', gender: 'F', weightClass: '+34', minWeight: 34.01, maxWeight: null, description: '兒童女子 +34公斤級' },

    // 格鬥 - 僅成人組和大師組 (簡化量級)
    { eventKey: 'fullcontact', ageGroup: 'adult', gender: 'M', weightClass: 'light', minWeight: 0, maxWeight: 70, description: '成人男子輕量級 (70kg以下)' },
    { eventKey: 'fullcontact', ageGroup: 'adult', gender: 'M', weightClass: 'heavy', minWeight: 70.01, maxWeight: null, description: '成人男子重量級 (70.1kg以上)' },
    { eventKey: 'fullcontact', ageGroup: 'adult', gender: 'F', weightClass: 'all', minWeight: 0, maxWeight: null, description: '成人女子組 (不分量級)' },
    
    { eventKey: 'fullcontact', ageGroup: 'master', gender: 'M', weightClass: 'all', minWeight: 0, maxWeight: null, description: '大師男子組 (不分量級)' },
    { eventKey: 'fullcontact', ageGroup: 'master', gender: 'F', weightClass: 'all', minWeight: 0, maxWeight: null, description: '大師女子組 (不分量級)' },

    // 無道袍 - 僅成人組
    { eventKey: 'nogi', ageGroup: 'adult', gender: 'M', weightClass: 'light', minWeight: 0, maxWeight: 75, description: '成人男子輕量級 (75kg以下)' },
    { eventKey: 'nogi', ageGroup: 'adult', gender: 'M', weightClass: 'heavy', minWeight: 75.01, maxWeight: null, description: '成人男子重量級 (75.1kg以上)' },
    { eventKey: 'nogi', ageGroup: 'adult', gender: 'F', weightClass: 'all', minWeight: 0, maxWeight: null, description: '成人女子組 (不分量級)' },

    // 演武項目 - 12歲以上 (不分量級，按性別組合)
    { eventKey: 'duo_traditional', ageGroup: 'adult', gender: 'M', weightClass: 'men', minWeight: null, maxWeight: null, description: '成人男子組 (兩位男性)' },
    { eventKey: 'duo_traditional', ageGroup: 'adult', gender: 'F', weightClass: 'women', minWeight: null, maxWeight: null, description: '成人女子組 (兩位女性)' },
    { eventKey: 'duo_traditional', ageGroup: 'adult', gender: 'mixed', weightClass: 'mixed', minWeight: null, maxWeight: null, description: '成人混合組 (一男一女)' },
    
    { eventKey: 'duo_creative', ageGroup: 'adult', gender: 'M', weightClass: 'men', minWeight: null, maxWeight: null, description: '成人男子組 (兩位男性)' },
    { eventKey: 'duo_creative', ageGroup: 'adult', gender: 'F', weightClass: 'women', minWeight: null, maxWeight: null, description: '成人女子組 (兩位女性)' },
    { eventKey: 'duo_creative', ageGroup: 'adult', gender: 'mixed', weightClass: 'mixed', minWeight: null, maxWeight: null, description: '成人混合組 (一男一女)' }
  ];

  // 為每個分類建立紀錄
  let createdCount = 0;
  for (const category of categories) {
    const eventTypeId = createdEventTypes[category.eventKey];
    
    if (eventTypeId) {
      await prisma.eventCategory.create({
        data: {
          eventTypeId: eventTypeId,
          ageGroup: category.ageGroup,
          gender: category.gender,
          weightClass: category.weightClass,
          minWeight: category.minWeight,
          maxWeight: category.maxWeight,
          description: category.description
        }
      });
      createdCount++;
    }
  }
  
  console.log(`✓ 建立了 ${createdCount} 個項目分組`)
  console.log('種子資料建立完成！');
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