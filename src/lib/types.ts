export interface RegistrationUnit {
  id: string;
  name: string;
  address?: string;
  contactName: string;
  phone: string;
  email: string;
}

export interface Athlete {
  id: string;
  unitId: string;
  name: string;
  nationalId: string;
  gender: 'M' | 'F';
  birthDate: Date;
  phone?: string;
  email?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  ageGroup: 'adult' | 'youth' | 'junior' | 'child' | 'master';
  masterCategory?: 'M1' | 'M2' | 'M3';
  belt: 'white' | 'blue' | 'purple' | 'brown' | 'black';
  weight: number;
  coachName: string;
  coachCertificate?: string;
  photo?: string;
  consentForm?: string;
  registrationStatus: 'pending' | 'confirmed' | 'cancelled';
}

export interface Registration {
  id: string;
  athleteId: string;
  eventType: 'fighting' | 'newaza' | 'fullcontact' | 'duo_traditional' | 'duo_creative' | 'nogi';
  eventDetail?: string;
  weightClass: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  teamPartnerId?: string; // 用於演武項目的隊友ID
}

export interface Payment {
  id: string;
  unitId: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'confirmed';
  bankName?: string;
  accountLastFive?: string;
  transferDate?: Date;
  transferAmount?: number;
  proofImage?: string;
  notes?: string;
}

/**
 * 競賽項目類型。
 *
 * key 必須與資料庫 EventType.key 完全一致（見 scripts/seed-events.js），
 * 因為 Registration.eventType 存的就是該 key，前端顯示與後端計費都以它比對。
 * 過去這裡誤用 duo / show，與資料庫的 duo_traditional / duo_creative 對不上，
 * 導致演武項目顯示不出名稱，且費用計算的「以隊計費」分支永遠不會執行。
 */
export const EVENT_TYPES = {
  fighting: '對打',
  newaza: '寢技',
  fullcontact: '格鬥',
  duo_traditional: '傳統演武',
  duo_creative: '創意演武',
  nogi: '無道袍'
} as const;

/** 需要兩人組隊的項目；費用以「隊」計算而非以人計算。 */
export const TEAM_EVENT_TYPES = ['duo_traditional', 'duo_creative'] as const;

/** 判斷是否為雙人項目。請一律使用此函式，不要在各處硬編碼 key 比對。 */
export function isTeamEventType(eventType: string): boolean {
  return (TEAM_EVENT_TYPES as readonly string[]).includes(eventType);
}

export const AGE_GROUPS = {
  adult: '成人組',
  youth: '青年組',
  junior: '青少年組',
  child: '兒童組',
  master: '大師組'
} as const;

export const BELT_LEVELS = {
  white: '白帶',
  blue: '藍帶',
  purple: '紫帶',
  brown: '棕帶',
  black: '黑帶'
} as const;

export const MASTER_CATEGORIES = {
  M1: 'M1 (35-39歲)',
  M2: 'M2 (40-44歲)',
  M3: 'M3 (45歲以上)'
} as const;