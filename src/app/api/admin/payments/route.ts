import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

function verifyAdmin(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key') as any;
    return decoded.role === 'admin' ? decoded : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // 驗證管理者身份
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    const payments = await prisma.payment.findMany({
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            contactName: true,
            email: true,
            phone: true,
            address: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(payments);

  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: '無法載入繳費資料' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    const { paymentId, paymentStatus, confirmedBy, notes } = await request.json();

    if (!paymentId || !paymentStatus) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }

    const updateData: any = {
      paymentStatus,
      updatedAt: new Date()
    };

    if (paymentStatus === 'confirmed') {
      updateData.confirmedAt = new Date();
      updateData.confirmedBy = confirmedBy || admin.email;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            contactName: true,
            email: true,
            phone: true,
            address: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      payment: updatedPayment
    });

  } catch (error) {
    console.error('Payment update error:', error);
    return NextResponse.json(
      { error: '更新繳費狀態失敗' },
      { status: 500 }
    );
  }
}