import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getWeightClass } from '@/lib/utils';

const registrationSchema = z.object({
  athleteId: z.string(),
  eventType: z.enum(['fighting', 'newaza', 'fullcontact', 'duo_traditional', 'duo_creative', 'nogi']),
  eventDetail: z.string().optional(),
  teamPartnerId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registrationSchema.parse(body);
    
    // Get athlete details to determine weight class
    const athlete = await prisma.athlete.findUnique({
      where: { id: validatedData.athleteId }
    });
    
    if (!athlete) {
      return NextResponse.json(
        { error: '找不到選手資料' },
        { status: 404 }
      );
    }
    
    // Determine weight class
    const weightClass = (validatedData.eventType === 'duo_traditional' || validatedData.eventType === 'duo_creative')
      ? 'all' 
      : getWeightClass(athlete.weight, validatedData.eventType, athlete.ageGroup, athlete.gender);
    
    // Determine gender division for duo events
    let genderDivision: string | null = null;
    if ((validatedData.eventType === 'duo_traditional' || validatedData.eventType === 'duo_creative') 
        && validatedData.teamPartnerId) {
      const partner = await prisma.athlete.findUnique({
        where: { id: validatedData.teamPartnerId }
      });
      
      if (partner) {
        if (athlete.gender === 'M' && partner.gender === 'M') {
          genderDivision = 'men';
        } else if (athlete.gender === 'F' && partner.gender === 'F') {
          genderDivision = 'women';
        } else {
          genderDivision = 'mixed';
        }
      }
    }
    
    // Check for duplicate registration
    const existing = await prisma.registration.findFirst({
      where: {
        athleteId: validatedData.athleteId,
        eventType: validatedData.eventType,
        eventDetail: validatedData.eventDetail
      }
    });
    
    if (existing) {
      return NextResponse.json(
        { error: '已經報名過此項目' },
        { status: 400 }
      );
    }
    
    // Create registration
    const registration = await prisma.registration.create({
      data: {
        athleteId: validatedData.athleteId,
        eventType: validatedData.eventType,
        eventDetail: validatedData.eventDetail,
        teamPartnerId: validatedData.teamPartnerId,
        weightClass,
        genderDivision
      }
    });
    
    return NextResponse.json({
      success: true,
      data: registration
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
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