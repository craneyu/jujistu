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

    const units = await prisma.registrationUnit.findMany({
      include: {
        athletes: {
          select: {
            id: true,
            name: true,
            gender: true,
            belt: true
          }
        },
        _count: {
          select: {
            athletes: true
          }
        },
        payments: {
          select: {
            id: true,
            totalAmount: true,
            paymentStatus: true,
            createdAt: true,
            updatedAt: true
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(units);

  } catch (error) {
    console.error('Get units error:', error);
    return NextResponse.json(
      { error: '無法載入單位資料' },
      { status: 500 }
    );
  }
}