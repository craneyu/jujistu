import { prisma } from './prisma';

export interface AgeRanges {
  m1MinAge: number;
  m1MaxAge: number;
  m2MinAge: number;
  m2MaxAge: number;
  m3MinAge: number;
}

// 預設年齡範圍
const defaultAgeRanges: AgeRanges = {
  m1MinAge: 35,
  m1MaxAge: 39,
  m2MinAge: 40,
  m2MaxAge: 44,
  m3MinAge: 45,
};

// 快取年齡設定
let ageConfigCache: AgeRanges | null = null;
let lastCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘快取

export async function getAgeRanges(): Promise<AgeRanges> {
  const now = Date.now();
  
  // 如果快取仍然有效，直接返回快取
  if (ageConfigCache && (now - lastCacheTime) < CACHE_DURATION) {
    return ageConfigCache;
  }
  
  try {
    // 從資料庫讀取設定
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['m1_min_age', 'm1_max_age', 'm2_min_age', 'm2_max_age', 'm3_min_age']
        }
      }
    });

    // 建立設定物件
    const ageRanges = { ...defaultAgeRanges };
    
    configs.forEach(config => {
      switch (config.key) {
        case 'm1_min_age':
          ageRanges.m1MinAge = parseInt(config.value);
          break;
        case 'm1_max_age':
          ageRanges.m1MaxAge = parseInt(config.value);
          break;
        case 'm2_min_age':
          ageRanges.m2MinAge = parseInt(config.value);
          break;
        case 'm2_max_age':
          ageRanges.m2MaxAge = parseInt(config.value);
          break;
        case 'm3_min_age':
          ageRanges.m3MinAge = parseInt(config.value);
          break;
      }
    });

    // 更新快取
    ageConfigCache = ageRanges;
    lastCacheTime = now;
    
    return ageRanges;
    
  } catch (error) {
    console.error('讀取年齡設定失敗，使用預設值:', error);
    return defaultAgeRanges;
  }
}

// 清除快取（當設定更新時調用）
export function clearAgeConfigCache() {
  ageConfigCache = null;
  lastCacheTime = 0;
}