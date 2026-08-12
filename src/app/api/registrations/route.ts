import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getWeightClass } from '@/lib/utils';

const registrationSchema = z.object({
  athleteId: z.string(),
  eventCategoryId: z.string(),
  teamPartnerId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registrationSchema.parse(body);
    
    // Get athlete details
    const athlete = await prisma.athlete.findUnique({
      where: { id: validatedData.athleteId }
    });
    
    if (!athlete) {
      return NextResponse.json(
        { error: '找不到選手資料' },
        { status: 404 }
      );
    }
    
    // Get event category details
    const eventCategory = await prisma.eventCategory.findUnique({
      where: { id: validatedData.eventCategoryId },
      include: {
        eventType: true
      }
    });
    
    if (!eventCategory) {
      return NextResponse.json(
        { error: '找不到項目分類' },
        { status: 404 }
      );
    }
    
    // Check if category is enabled
    if (!eventCategory.enabled || !eventCategory.eventType.enabled) {
      return NextResponse.json(
        { error: '此項目分類目前不開放報名' },
        { status: 400 }
      );
    }
    
    // Validate athlete meets category requirements
    if (eventCategory.ageGroup !== athlete.ageGroup) {
      return NextResponse.json(
        { error: '選手年齡組別不符合此項目要求' },
        { status: 400 }
      );
    }
    
    // Check gender requirements
    if (eventCategory.gender !== 'mixed' && eventCategory.gender !== athlete.gender) {
      return NextResponse.json(
        { error: '選手性別不符合此項目要求' },
        { status: 400 }
      );
    }
    
    // Check weight requirements
    const athleteWeight = athlete.weight;
    if (eventCategory.minWeight !== null && athleteWeight < eventCategory.minWeight) {
      return NextResponse.json(
        { error: `選手體重(${athleteWeight}kg)低於最低要求(${eventCategory.minWeight}kg)` },
        { status: 400 }
      );
    }
    if (eventCategory.maxWeight !== null && athleteWeight > eventCategory.maxWeight) {
      return NextResponse.json(
        { error: `選手體重(${athleteWeight}kg)超過最高限制(${eventCategory.maxWeight}kg)` },
        { status: 400 }
      );
    }
    
    // For team events, validate partner
    if (eventCategory.eventType.requiresTeam) {
      if (!validatedData.teamPartnerId) {
        return NextResponse.json(
          { error: '此項目需要選擇隊友' },
          { status: 400 }
        );
      }
      
      // Validate partner exists and meets same requirements
      const partner = await prisma.athlete.findUnique({
        where: { id: validatedData.teamPartnerId }
      });
      
      if (!partner) {
        return NextResponse.json(
          { error: '找不到隊友資料' },
          { status: 404 }
        );
      }
      
      // 隊友是否已與「其他人」組了同一個項目。
      // 這裡不能單純檢查隊友有無報名紀錄——雙人報名是一次建立兩筆互為隊友的
      // 資料，若只看有無紀錄，會把同一組的另一半誤判為衝突。
      const partnerRegistration = await prisma.registration.findFirst({
        where: {
          athleteId: validatedData.teamPartnerId,
          eventType: eventCategory.eventType.key,
          eventDetail: eventCategory.id,
          NOT: { teamPartnerId: validatedData.athleteId }
        }
      });
      
      if (partnerRegistration) {
        return NextResponse.json(
          { error: '隊友已經報名過此項目' },
          { status: 400 }
        );
      }
    }
    
    // Check for duplicate registration
    const existing = await prisma.registration.findFirst({
      where: {
        athleteId: validatedData.athleteId,
        eventType: eventCategory.eventType.key,
        eventDetail: eventCategory.id
      }
    });
    
    if (existing) {
      return NextResponse.json(
        { error: '已經報名過此項目' },
        { status: 400 }
      );
    }
    
    // 建立報名資料。
    //
    // 雙人項目一次建立兩筆互為隊友的紀錄，並包在同一個交易裡：
    // 費用計算（calculateRegistrationFee）是以「兩筆互相指向對方的紀錄」
    // 判定為一隊並收一次費用，只寫入一筆會被當成單人參賽而少收一半。
    const base = {
      eventType: eventCategory.eventType.key,
      eventDetail: eventCategory.id,
      weightClass: eventCategory.weightClass,
      genderDivision: eventCategory.gender,
    };

    const registration = eventCategory.eventType.requiresTeam
      ? (
          await prisma.$transaction([
            prisma.registration.create({
              data: {
                ...base,
                athleteId: validatedData.athleteId,
                teamPartnerId: validatedData.teamPartnerId,
              },
            }),
            prisma.registration.create({
              data: {
                ...base,
                athleteId: validatedData.teamPartnerId!,
                teamPartnerId: validatedData.athleteId,
              },
            }),
          ])
        )[0]
      : await prisma.registration.create({
          data: {
            ...base,
            athleteId: validatedData.athleteId,
            teamPartnerId: validatedData.teamPartnerId,
          },
        });
    
    return NextResponse.json({
      success: true,
      data: registration
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '報名失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const athleteId = searchParams.get('athleteId');
    const unitId = searchParams.get('unitId');
    
    let registrations;
    
    if (athleteId) {
      registrations = await prisma.registration.findMany({
        where: { athleteId },
        include: {
          athlete: true
        }
      });
    } else if (unitId) {
      registrations = await prisma.registration.findMany({
        where: {
          athlete: {
            unitId
          }
        },
        include: {
          athlete: true
        }
      });
    } else {
      return NextResponse.json(
        { error: '缺少查詢參數' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: registrations
    });
    
  } catch (error) {
    console.error('Fetch registrations error:', error);
    return NextResponse.json(
      { error: '無法取得報名資料' },
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
        { error: '缺少報名ID' },
        { status: 400 }
      );
    }
    
    await prisma.registration.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: '已取消報名'
    });
    
  } catch (error) {
    console.error('Delete registration error:', error);
    return NextResponse.json(
      { error: '無法取消報名' },
      { status: 500 }
    );
  }
}