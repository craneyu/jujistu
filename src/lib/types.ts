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

export const EVENT_TYPES = {
  fighting: '對打',
  newaza: '寢技',
  fullcontact: '格鬥',
  duo_traditional: '傳統演武',
  duo_creative: '創意演武',
  nogi: '無道袍'
} as const;

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