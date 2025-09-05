import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const masterAgeConfigSchema = z.object({
  m1MinAge: z.number().min(18, 'M1最小年齡必須大於18'),
  m1MaxAge: z.number().min(19, 'M1最大年齡必須大於19'),
  m2MinAge: z.number().min(18, 'M2最小年齡必須大於18'),  
  m2MaxAge: z.number().min(19, 'M2最大年齡必須大於19'),
  m3MinAge: z.number().min(18, 'M3最小年齡必須大於18'),
});

// 預設年齡範圍
const defaultAgeRanges = {
  m1MinAge: 35,
  m1MaxAge: 39,
  m2MinAge: 40,
  m2MaxAge: 44,
  m3MinAge: 45,
};

export async function GET() {
  try {
    // 從資料庫讀取所有大師組年齡設定
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['m1_min_age', 'm1_max_age', 'm2_min_age', 'm2_max_age', 'm3_min_age']
        }
      }
    });

    // 建立設定物件
    const ageRanges = { ...defaultAgeRanges };
    
    configs.forEach(config => {
      switch (config.key) {
        case 'm1_min_age':
          ageRanges.m1MinAge = parseInt(config.value);
          break;
        case 'm1_max_age':
          ageRanges.m1MaxAge = parseInt(config.value);
          break;
        case 'm2_min_age':
          ageRanges.m2MinAge = parseInt(config.value);
          break;
        case 'm2_max_age':
          ageRanges.m2MaxAge = parseInt(config.value);
          break;
        case 'm3_min_age':
          ageRanges.m3MinAge = parseInt(config.value);
          break;
      }
    });

    return NextResponse.json({
      success: true,
      data: ageRanges
    });
    
  } catch (error) {
    console.error('取得大師組年齡設定失敗:', error);
    return NextResponse.json(
      { error: '無法取得大師組年齡設定' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('更新大師組年齡設定收到資料:', body);
    
    const validatedData = masterAgeConfigSchema.parse(body);
    console.log('驗證後的年齡設定:', validatedData);
    
    // 驗證邏輯：M1 < M2 < M3，且年齡範圍不重疊
    if (validatedData.m1MaxAge >= validatedData.m2MinAge) {
      return NextResponse.json(
        { error: 'M1最大年齡必須小於M2最小年齡' },
        { status: 400 }
      );
    }
    
    if (validatedData.m2MaxAge >= validatedData.m3MinAge) {
      return NextResponse.json(
        { error: 'M2最大年齡必須小於M3最小年齡' },
        { status: 400 }
      );
    }
    
    // 更新資料庫設定
    const configUpdates = [
      { key: 'm1_min_age', value: validatedData.m1MinAge.toString(), description: 'M1組最小年齡' },
      { key: 'm1_max_age', value: validatedData.m1MaxAge.toString(), description: 'M1組最大年齡' },
      { key: 'm2_min_age', value: validatedData.m2MinAge.toString(), description: 'M2組最小年齡' },
      { key: 'm2_max_age', value: validatedData.m2MaxAge.toString(), description: 'M2組最大年齡' },
      { key: 'm3_min_age', value: validatedData.m3MinAge.toString(), description: 'M3組最小年齡' },
    ];
    
    // 使用事務更新所有設定
    await prisma.$transaction(
      configUpdates.map(config => 
        prisma.systemConfig.upsert({
          where: { key: config.key },
          update: { 
            value: config.value,
            description: config.description,
            updatedAt: new Date()
          },
          create: {
            key: config.key,
            value: config.value,
            description: config.description
          }
        })
      )
    );
    
    return NextResponse.json({
      success: true,
      data: validatedData,
      message: '大師組年齡設定已更新'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('驗證錯誤:', error.errors);
      return NextResponse.json(
        { error: `驗證錯誤: ${error.errors[0].message}` },
        { status: 400 }
      );
    }
    
    console.error('更新大師組年齡設定失敗:', error);
    return NextResponse.json(
      { error: `更新失敗: ${error instanceof Error ? error.message : '未知錯誤'}` },
      { status: 500 }
    );
  }
}