import { calculateAge } from './utils';

/**
 * 需要讀取資料庫（SystemConfig）的工具函式放在這裡。
 *
 * 這些函式會經由 ageConfig 相依到 Prisma Client。放在 utils.ts 裡會讓
 * 引用 utils 的 client component 把 Prisma 一併打進瀏覽器 bundle，
 * 在 Netlify build 時會出現 `Module not found: Can't resolve 'fs'`。
 * client 端請改用 utils.ts 的 determineMasterCategorySync。
 */
export async function determineMasterCategory(birthDate: Date): Promise<string | null> {
  const age = calculateAge(birthDate);

  // 動態載入年齡配置
  const { getAgeRanges } = await import('./ageConfig');
  const ageRanges = await getAgeRanges();

  if (age < ageRanges.m1MinAge) return null;
  if (age >= ageRanges.m1MinAge && age <= ageRanges.m1MaxAge) return 'M1';
  if (age >= ageRanges.m2MinAge && age <= ageRanges.m2MaxAge) return 'M2';
  if (age >= ageRanges.m3MinAge) return 'M3';
  return null;
}
