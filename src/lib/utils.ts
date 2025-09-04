import { differenceInYears } from 'date-fns';

export function calculateAge(birthDate: Date, referenceDate: Date = new Date('2025-10-26')): number {
  return differenceInYears(referenceDate, birthDate);
}

export function determineAgeGroup(birthDate: Date): string {
  const age = calculateAge(birthDate);
  
  if (age < 12) return 'child';        // 未滿12歲
  if (age >= 12 && age <= 14) return 'junior';  // 12-14歲
  if (age >= 15 && age <= 17) return 'youth';   // 15-17歲
  if (age >= 18 && age <= 34) return 'adult';   // 18-34歲
  return 'master';  // 35歲以上
}

export function determineMasterCategory(birthDate: Date): string | null {
  const age = calculateAge(birthDate);
  
  if (age < 35) return null;
  if (age >= 35 && age <= 39) return 'M1';
  if (age >= 40 && age <= 44) return 'M2';
  if (age >= 45) return 'M3';
  return null;
}

export function getWeightClass(weight: number, eventType: string, ageGroup: string, gender: string): string {
  // This is a simplified version - in production, you'd query the EventCategory table
  // to get the exact weight class based on the parameters
  
  if (ageGroup === 'adult' || ageGroup === 'master') {
    if (gender === 'M') {
      if (weight <= 56) return '-56';
      if (weight <= 62) return '-62';
      if (weight <= 69) return '-69';
      if (weight <= 77) return '-77';
      if (weight <= 85) return '-85';
      if (weight <= 94) return '-94';
      return '+94';
    } else {
      if (weight <= 49) return '-49';
      if (weight <= 55) return '-55';
      if (weight <= 62) return '-62';
      if (weight <= 70) return '-70';
      return '+70';
    }
  } else if (ageGroup === 'youth') {
    // Youth weight classes
    if (gender === 'M') {
      if (weight <= 50) return '-50';
      if (weight <= 55) return '-55';
      if (weight <= 60) return '-60';
      if (weight <= 66) return '-66';
      if (weight <= 73) return '-73';
      if (weight <= 81) return '-81';
      return '+81';
    } else {
      if (weight <= 44) return '-44';
      if (weight <= 48) return '-48';
      if (weight <= 52) return '-52';
      if (weight <= 57) return '-57';
      if (weight <= 63) return '-63';
      return '+63';
    }
  } else if (ageGroup === 'junior') {
    // Junior weight classes
    if (gender === 'M') {
      if (weight <= 46) return '-46';
      if (weight <= 50) return '-50';
      if (weight <= 55) return '-55';
      if (weight <= 60) return '-60';
      if (weight <= 66) return '-66';
      if (weight <= 73) return '-73';
      return '+73';
    } else {
      if (weight <= 40) return '-40';
      if (weight <= 44) return '-44';
      if (weight <= 48) return '-48';
      if (weight <= 52) return '-52';
      if (weight <= 57) return '-57';
      if (weight <= 63) return '-63';
      return '+63';
    }
  } else if (ageGroup === 'child') {
    // Child weight classes
    if (gender === 'M') {
      if (weight <= 30) return '-30';
      if (weight <= 34) return '-34';
      if (weight <= 38) return '-38';
      if (weight <= 42) return '-42';
      if (weight <= 46) return '-46';
      if (weight <= 50) return '-50';
      return '+50';
    } else {
      if (weight <= 28) return '-28';
      if (weight <= 32) return '-32';
      if (weight <= 36) return '-36';
      if (weight <= 40) return '-40';
      if (weight <= 44) return '-44';
      if (weight <= 48) return '-48';
      return '+48';
    }
  }
  
  // Default
  return 'all';
}

export function calculateRegistrationFee(registrations: any[]): number {
  let totalFee = 0;
  const processedTeams = new Set<string>();
  
  for (const registration of registrations) {
    const eventType = registration.eventType;
    const ageGroup = registration.athlete.ageGroup;
    
    if (eventType === 'duo' || eventType === 'show') {
      // For duo events, calculate per team (1200 NT$ per team)
      if (registration.teamPartnerId && registration.genderDivision) {
        // Create a unique team identifier including event type, gender division, and team members
        const teamMembers = [registration.athleteId, registration.teamPartnerId].sort();
        const teamId = `${eventType}-${registration.genderDivision}-${teamMembers.join('-')}`;
        
        if (!processedTeams.has(teamId)) {
          totalFee += 1200; // 1200 NT$ per team
          processedTeams.add(teamId);
        }
      } else {
        // Single person in duo event or missing gender division, charge half fee
        totalFee += 600; // Half of team fee
      }
    } else {
      // Regular events: Age-based pricing
      // Youth and below (child, junior, youth): 800 NT$
      // Adult and Master: 1200 NT$
      if (ageGroup === 'child' || ageGroup === 'junior' || ageGroup === 'youth') {
        totalFee += 800;
      } else {
        totalFee += 1200; // adult, master
      }
    }
  }
  
  return totalFee;
}

export function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString('zh-TW')}`;
}

export function validateTaiwanPhone(phone: string): boolean {
  const phoneRegex = /^09\d{8}$/;
  return phoneRegex.test(phone.replace(/[^0-9]/g, ''));
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}