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
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    const configs = await prisma.systemConfig.findMany({
      orderBy: {
        key: 'asc'
      }
    });

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(configMap);

  } catch (error) {
    console.error('Get system config error:', error);
    return NextResponse.json(
      { error: '無法載入系統設定' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    const { key, value, description } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }

    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: {
        value,
        description,
        updatedAt: new Date()
      },
      create: {
        key,
        value,
        description
      }
    });

    return NextResponse.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('Update system config error:', error);
    return NextResponse.json(
      { error: '更新系統設定失敗' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    const configs = await request.json();

    if (!Array.isArray(configs)) {
      return NextResponse.json(
        { error: '參數格式錯誤' },
        { status: 400 }
      );
    }

    const results = [];

    for (const { key, value, description } of configs) {
      if (!key || value === undefined) continue;
      
      const config = await prisma.systemConfig.upsert({
        where: { key },
        update: {
          value,
          description,
          updatedAt: new Date()
        },
        create: {
          key,
          value,
          description
        }
      });
      
      results.push(config);
    }

    return NextResponse.json({
      success: true,
      configs: results
    });

  } catch (error) {
    console.error('Batch update system config error:', error);
    return NextResponse.json(
      { error: '批量更新系統設定失敗' },
      { status: 500 }
    );
  }
}