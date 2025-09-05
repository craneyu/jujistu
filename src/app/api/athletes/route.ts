import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { determineAgeGroup, determineMasterCategory } from '@/lib/utils';

const athleteSchema = z.object({
  unitId: z.string(),
  name: z.string().min(1, '姓名必填'),
  nationalId: z.string().regex(/^[A-Z][12]\d{8}$/, '請輸入正確的身份證字號格式'),
  gender: z.enum(['M', 'F']),
  birthDate: z.string().transform(str => new Date(str)),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  emergencyContactName: z.string().min(1, '緊急聯絡人姓名必填'),
  emergencyContactPhone: z.string().min(1, '緊急聯絡人電話必填'),
  emergencyContactRelation: z.string().min(1, '與緊急聯絡人之關係必填'),
  belt: z.enum(['white', 'blue', 'purple', 'brown', 'black']),
  weight: z.number().positive('體重必須大於0'),
  coachName: z.string().min(1, '教練姓名必填'),
  coachCertificate: z.string().optional(),
  photo: z.string().optional(),
  consentForm: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = athleteSchema.parse(body);
    
    // Calculate age group and master category
    const ageGroup = determineAgeGroup(validatedData.birthDate);
    const masterCategory = await determineMasterCategory(validatedData.birthDate);
    
    // Create athlete
    const athlete = await prisma.athlete.create({
      data: {
        ...validatedData,
        ageGroup,
        masterCategory
      }
    });
    
    return NextResponse.json({
      success: true,
      data: athlete
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Athlete registration error:', error);
    return NextResponse.json(
      { error: '選手註冊失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const unitId = searchParams.get('unitId');
    
    if (!unitId) {
      return NextResponse.json(
        { error: '缺少單位ID' },
        { status: 400 }
      );
    }
    
    const athletes = await prisma.athlete.findMany({
      where: { unitId },
      include: {
        registrations: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      data: athletes
    });
    
  } catch (error) {
    console.error('Fetch athletes error:', error);
    return NextResponse.json(
      { error: '無法取得選手資料' },
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
        { error: '缺少選手ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = athleteSchema.parse(body);
    
    // Calculate age group and master category
    const ageGroup = determineAgeGroup(validatedData.birthDate);
    const masterCategory = await determineMasterCategory(validatedData.birthDate);
    
    // Update athlete
    const athlete = await prisma.athlete.update({
      where: { id },
      data: {
        ...validatedData,
        ageGroup,
        masterCategory
      }
    });
    
    return NextResponse.json({
      success: true,
      data: athlete
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Athlete update error:', error);
    return NextResponse.json(
      { error: '選手更新失敗，請稍後再試' },
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
        { error: '缺少選手ID' },
        { status: 400 }
      );
    }
    
    // Delete related registrations first
    await prisma.registration.deleteMany({
      where: { athleteId: id }
    });
    
    // Delete athlete
    await prisma.athlete.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: '選手已成功刪除'
    });
    
  } catch (error) {
    console.error('Athlete deletion error:', error);
    return NextResponse.json(
      { error: '選手刪除失敗，請稍後再試' },
      { status: 500 }
    );
  }
}