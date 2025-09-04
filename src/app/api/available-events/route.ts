import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const athleteId = searchParams.get('athleteId');
    
    if (!athleteId) {
      return NextResponse.json(
        { error: '缺少選手ID' },
        { status: 400 }
      );
    }
    
    // 取得選手資料
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId }
    });
    
    if (!athlete) {
      return NextResponse.json(
        { error: '選手不存在' },
        { status: 404 }
      );
    }
    
    // 取得所有啟用的項目類型和分類
    const eventTypes = await prisma.eventType.findMany({
      where: { enabled: true },
      include: {
        categories: {
          where: { 
            enabled: true,
            ageGroup: athlete.ageGroup,
            // 根據選手性別篩選
            OR: [
              { gender: athlete.gender },
              { gender: 'mixed' } // 混合組別任何性別都可參加
            ]
          },
          orderBy: [
            { gender: 'asc' },
            { weightClass: 'asc' }
          ]
        }
      },
      orderBy: { name: 'asc' }
    });
    
    // 過濾掉沒有可用分類的項目類型
    const availableEventTypes = eventTypes.filter(eventType => eventType.categories.length > 0);
    
    // 針對每個項目類型，根據選手體重篩選適合的分類
    const filteredEventTypes = availableEventTypes.map(eventType => ({
      ...eventType,
      categories: eventType.categories.filter(category => {
        // 如果沒有體重限制，則可參加
        if (category.minWeight === null && category.maxWeight === null) {
          return true;
        }
        
        // 檢查選手體重是否符合此分類
        const athleteWeight = athlete.weight;
        const meetsMinWeight = category.minWeight === null || athleteWeight >= category.minWeight;
        const meetsMaxWeight = category.maxWeight === null || athleteWeight <= category.maxWeight;
        
        return meetsMinWeight && meetsMaxWeight;
      })
    })).filter(eventType => eventType.categories.length > 0);
    
    // 取得選手已報名的項目
    const registrations = await prisma.registration.findMany({
      where: { 
        athleteId,
        status: { not: 'cancelled' }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        eventTypes: filteredEventTypes,
        registrations,
        athlete: {
          id: athlete.id,
          name: athlete.name,
          gender: athlete.gender,
          weight: athlete.weight,
          ageGroup: athlete.ageGroup
        }
      }
    });
    
  } catch (error) {
    console.error('取得可報名項目失敗:', error);
    return NextResponse.json(
      { error: '無法取得可報名項目' },
      { status: 500 }
    );
  }
}