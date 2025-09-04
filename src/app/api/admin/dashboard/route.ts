import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { calculateRegistrationFee } from '@/lib/utils';

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

    // 統計報名單位數量
    const totalUnits = await prisma.registrationUnit.count();

    // 統計註冊選手數量
    const totalAthletes = await prisma.athlete.count();

    // 統計報名項目數量
    const totalRegistrations = await prisma.registration.count();

    // 統計繳費狀態
    const pendingPayments = await prisma.payment.count({
      where: { paymentStatus: 'paid' } // 已提交但待確認
    });

    const confirmedPayments = await prisma.payment.count({
      where: { paymentStatus: 'confirmed' } // 已確認
    });

    // 計算總收入（已確認的繳費）
    const confirmedPaymentRecords = await prisma.payment.findMany({
      where: { paymentStatus: 'confirmed' },
      select: { totalAmount: true }
    });

    const totalRevenue = confirmedPaymentRecords.reduce((sum, payment) => sum + payment.totalAmount, 0);

    return NextResponse.json({
      totalUnits,
      totalAthletes,
      totalRegistrations,
      totalRevenue,
      pendingPayments,
      confirmedPayments
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: '無法載入儀表板資料' },
      { status: 500 }
    );
  }
}