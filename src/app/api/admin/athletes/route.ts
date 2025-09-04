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

    const athletes = await prisma.athlete.findMany({
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
        },
        registrations: {
          select: {
            id: true,
            eventType: true,
            weightClass: true,
            genderDivision: true
          }
        },
        _count: {
          select: {
            registrations: true
          }
        }
      },
      orderBy: [
        {
          unit: {
            name: 'asc'
          }
        },
        {
          name: 'asc'
        }
      ]
    });

    return NextResponse.json(athletes);

  } catch (error) {
    console.error('Get athletes error:', error);
    return NextResponse.json(
      { error: '無法載入選手資料' },
      { status: 500 }
    );
  }
}