import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'competitionName',
            'competitionStartDate', 
            'competitionEndDate',
            'competitionLocation',
            'headerBanner',
            'supervisorUnit',
            'organizerUnit',
            'coOrganizerUnit',
            'sponsorUnit',
            'registrationStartDate',
            'registrationStartTime',
            'registrationDeadline',
            'registrationDeadlineTime',
            'contactName',
            'contactEmail',
            'contactPhone',
            'bankName',
            'bankAccount',
            'bankAccountName',
            'transferAmount',
            'transferNotes'
          ]
        }
      }
    });

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    // Provide default values if not set
    const result = {
      competitionName: configMap.competitionName || '2025年全國柔術錦標賽',
      competitionStartDate: configMap.competitionStartDate || '2025-10-26',
      competitionEndDate: configMap.competitionEndDate || '2025-10-26',
      competitionLocation: configMap.competitionLocation || '',
      headerBanner: configMap.headerBanner || '',
      supervisorUnit: configMap.supervisorUnit || '',
      organizerUnit: configMap.organizerUnit || '',
      coOrganizerUnit: configMap.coOrganizerUnit || '',
      sponsorUnit: configMap.sponsorUnit || '',
      registrationStartDate: configMap.registrationStartDate || '',
      registrationStartTime: configMap.registrationStartTime || '',
      registrationDeadline: configMap.registrationDeadline || '',
      registrationDeadlineTime: configMap.registrationDeadlineTime || '',
      contactName: configMap.contactName || '',
      contactEmail: configMap.contactEmail || '',
      contactPhone: configMap.contactPhone || '',
      bankName: configMap.bankName || '',
      bankAccount: configMap.bankAccount || '',
      bankAccountName: configMap.bankAccountName || '',
      transferAmount: configMap.transferAmount || '',
      transferNotes: configMap.transferNotes || ''
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Get public config error:', error);
    // Return default values even if there's an error
    return NextResponse.json({
      competitionName: '2025年全國柔術錦標賽',
      competitionStartDate: '2025-10-26',
      competitionEndDate: '2025-10-26',
      competitionLocation: '',
      headerBanner: '',
      supervisorUnit: '',
      organizerUnit: '',
      coOrganizerUnit: '',
      sponsorUnit: '',
      registrationStartDate: '',
      registrationStartTime: '',
      registrationDeadline: '',
      registrationDeadlineTime: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      bankName: '',
      bankAccount: '',
      bankAccountName: '',
      transferAmount: '',
      transferNotes: ''
    });
  }
}