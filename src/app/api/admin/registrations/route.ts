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

    const registrations = await prisma.registration.findMany({
      include: {
        athlete: {
          select: {
            id: true,
            name: true,
            gender: true,
            birthDate: true,
            weight: true,
            belt: true,
            nationalId: true,
            emergencyContactName: true,
            emergencyContactPhone: true,
            emergencyContactRelation: true,
            coachName: true,
            ageGroup: true,
            unit: {
              select: {
                name: true,
                contactName: true,
                email: true,
                phone: true
              }
            }
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(registrations);

  } catch (error) {
    console.error('Get registrations error:', error);
    return NextResponse.json(
      { error: '無法載入報名資料' },
      { status: 500 }
    );
  }
}