import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { calculateRegistrationFee } from '@/lib/utils';

const paymentSchema = z.object({
  unitId: z.string(),
  bankName: z.string().optional(),
  accountLastFive: z.string().optional(),
  transferDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  transferAmount: z.number().optional(),
  proofImage: z.string().optional(),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = paymentSchema.parse(body);
    
    // Calculate total amount based on registrations
    const registrations = await prisma.registration.findMany({
      where: {
        athlete: {
          unitId: validatedData.unitId
        },
        status: 'pending'
      }
    });
    
    const totalAmount = calculateRegistrationFee(registrations);
    
    // Check if payment record exists
    let payment = await prisma.payment.findFirst({
      where: {
        unitId: validatedData.unitId,
        paymentStatus: 'pending'
      }
    });
    
    if (payment) {
      // Update existing payment
      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          ...validatedData,
          totalAmount,
          paymentStatus: validatedData.transferAmount ? 'paid' : 'pending'
        }
      });
    } else {
      // Create new payment record
      payment = await prisma.payment.create({
        data: {
          ...validatedData,
          totalAmount,
          paymentStatus: validatedData.transferAmount ? 'paid' : 'pending'
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: payment
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: '繳費資料處理失敗' },
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
    
    // Get all registrations for the unit
    const registrations = await prisma.registration.findMany({
      where: {
        athlete: {
          unitId
        }
      },
      include: {
        athlete: true
      }
    });
    
    // Calculate total fee
    const totalAmount = calculateRegistrationFee(registrations);
    
    // Get payment record if exists
    const payment = await prisma.payment.findFirst({
      where: { unitId },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        registrations,
        totalAmount,
        payment
      }
    });
    
  } catch (error) {
    console.error('Fetch payment error:', error);
    return NextResponse.json(
      { error: '無法取得繳費資料' },
      { status: 500 }
    );
  }
}