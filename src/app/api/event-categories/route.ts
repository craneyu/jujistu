import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const eventCategorySchema = z.object({
  eventTypeId: z.string().min(1, '項目類型ID必填'),
  ageGroup: z.enum(['adult', 'youth', 'junior', 'child', 'master'], {
    errorMap: () => ({ message: '年齡組別必須是: adult, youth, junior, child, master 其中之一' })
  }),
  gender: z.enum(['M', 'F', 'mixed'], {
    errorMap: () => ({ message: '性別必須是: M, F, mixed 其中之一' })
  }),
  weightClass: z.string().min(1, '量級代碼必填'),
  minWeight: z.number().nullable().optional(),
  maxWeight: z.number().nullable().optional(),
  description: z.string().min(1, '級別描述必填'),
  enabled: z.boolean().default(true)
});

const eventCategoryUpdateSchema = eventCategorySchema.partial();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventTypeId = searchParams.get('eventTypeId');
    const enabled = searchParams.get('enabled');
    const ageGroup = searchParams.get('ageGroup');
    const gender = searchParams.get('gender');
    
    const where: any = {};
    
    if (eventTypeId) where.eventTypeId = eventTypeId;
    if (enabled !== null) where.enabled = enabled === 'true';
    if (ageGroup) where.ageGroup = ageGroup;
    if (gender) where.gender = gender;
    
    const categories = await prisma.eventCategory.findMany({
      where,
      include: {
        eventType: true
      },
      orderBy: [
        { eventType: { name: 'asc' } },
        { ageGroup: 'asc' },
        { gender: 'asc' },
        { weightClass: 'asc' }
      ]
    });
    
    return NextResponse.json({
      success: true,
      data: categories
    });
    
  } catch (error) {
    console.error('取得項目分類失敗:', error);
    return NextResponse.json(
      { error: '無法取得項目分類' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('建立項目分類收到資料:', body);
    
    const validatedData = eventCategorySchema.parse(body);
    console.log('驗證後的項目分類資料:', validatedData);
    
    // 檢查項目類型是否存在
    const eventType = await prisma.eventType.findUnique({
      where: { id: validatedData.eventTypeId }
    });
    
    if (!eventType) {
      return NextResponse.json(
        { error: '項目類型不存在' },
        { status: 400 }
      );
    }
    
    // 檢查相同組合是否已存在
    const existing = await prisma.eventCategory.findUnique({
      where: {
        eventTypeId_ageGroup_gender_weightClass: {
          eventTypeId: validatedData.eventTypeId,
          ageGroup: validatedData.ageGroup,
          gender: validatedData.gender,
          weightClass: validatedData.weightClass
        }
      }
    });
    
    if (existing) {
      return NextResponse.json(
        { error: '此組合的項目分類已存在' },
        { status: 400 }
      );
    }
    
    const category = await prisma.eventCategory.create({
      data: validatedData,
      include: {
        eventType: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: category
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('驗證錯誤:', error.errors);
      return NextResponse.json(
        { error: `驗證錯誤: ${error.errors[0].message}` },
        { status: 400 }
      );
    }
    
    console.error('建立項目分類失敗:', error);
    return NextResponse.json(
      { error: `建立項目分類失敗: ${error instanceof Error ? error.message : '未知錯誤'}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少項目分類ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const validatedData = eventCategoryUpdateSchema.parse(body);
    
    const category = await prisma.eventCategory.update({
      where: { id },
      data: validatedData,
      include: {
        eventType: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: category
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: `驗證錯誤: ${error.errors[0].message}` },
        { status: 400 }
      );
    }
    
    console.error('更新項目分類失敗:', error);
    return NextResponse.json(
      { error: '更新項目分類失敗' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少項目分類ID' },
        { status: 400 }
      );
    }
    
    // 檢查是否有報名記錄使用此分類
    // 這裡可以根據需要添加檢查邏輯
    
    await prisma.eventCategory.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: '項目分類已刪除'
    });
    
  } catch (error) {
    console.error('刪除項目分類失敗:', error);
    return NextResponse.json(
      { error: '刪除項目分類失敗' },
      { status: 500 }
    );
  }
}