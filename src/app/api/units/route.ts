import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  id: z.string(),
  address: z.string().optional(),
  contactName: z.string().min(1, '聯絡人必填'),
  phone: z.string().regex(/^09\d{8}$/, '請輸入正確的手機號碼')
});

// GET unit profile
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const unitId = searchParams.get('id');
    
    if (!unitId) {
      return NextResponse.json(
        { error: '缺少單位ID' },
        { status: 400 }
      );
    }
    
    const unit = await prisma.registrationUnit.findUnique({
      where: { id: unitId },
      select: {
        id: true,
        name: true,
        address: true,
        contactName: true,
        phone: true,
        email: true
      }
    });
    
    if (!unit) {
      return NextResponse.json(
        { error: '找不到單位' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: unit
    });
    
  } catch (error) {
    console.error('Get unit error:', error);
    return NextResponse.json(
      { error: '無法取得單位資料' },
      { status: 500 }
    );
  }
}

// UPDATE unit profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = updateSchema.parse(body);
    const { id, ...updateData } = validatedData;
    
    // Update unit (exclude name and email which are not editable)
    const unit = await prisma.registrationUnit.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        address: true,
        contactName: true,
        phone: true,
        email: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: unit
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Update unit error:', error);
    return NextResponse.json(
      { error: '更新失敗，請稍後再試' },
      { status: 500 }
    );
  }
}