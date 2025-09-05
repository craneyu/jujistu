import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { determineAgeGroup, determineMasterCategory } from '@/lib/utils';
import { clearAgeConfigCache } from '@/lib/ageConfig';

export async function POST() {
  try {
    // 清除年齡設定快取，確保使用最新設定
    clearAgeConfigCache();
    
    // 獲取所有選手
    const athletes = await prisma.athlete.findMany({
      select: {
        id: true,
        birthDate: true,
      }
    });

    console.log(`開始重新計算 ${athletes.length} 位選手的大師組分類`);
    
    // 批量更新選手的年齡組別和大師組分類
    const updates = await Promise.all(
      athletes.map(async (athlete) => {
        const ageGroup = determineAgeGroup(athlete.birthDate);
        const masterCategory = await determineMasterCategory(athlete.birthDate);
        
        return {
          id: athlete.id,
          ageGroup,
          masterCategory
        };
      })
    );
    
    // 使用事務批量更新
    await prisma.$transaction(
      updates.map(update => 
        prisma.athlete.update({
          where: { id: update.id },
          data: {
            ageGroup: update.ageGroup,
            masterCategory: update.masterCategory
          }
        })
      )
    );
    
    // 統計更新結果
    const stats = {
      total: athletes.length,
      child: updates.filter(u => u.ageGroup === 'child').length,
      junior: updates.filter(u => u.ageGroup === 'junior').length,
      youth: updates.filter(u => u.ageGroup === 'youth').length,
      adult: updates.filter(u => u.ageGroup === 'adult').length,
      master: updates.filter(u => u.ageGroup === 'master').length,
      m1: updates.filter(u => u.masterCategory === 'M1').length,
      m2: updates.filter(u => u.masterCategory === 'M2').length,
      m3: updates.filter(u => u.masterCategory === 'M3').length,
    };
    
    console.log('重新計算完成，統計結果:', stats);
    
    return NextResponse.json({
      success: true,
      message: '所有選手的大師組分類已重新計算',
      stats
    });
    
  } catch (error) {
    console.error('重新計算大師組分類失敗:', error);
    return NextResponse.json(
      { error: `重新計算失敗: ${error instanceof Error ? error.message : '未知錯誤'}` },
      { status: 500 }
    );
  }
}