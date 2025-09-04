import { useState, useEffect } from 'react';

interface CompetitionConfig {
  competitionName: string;
  competitionStartDate: string;
  competitionEndDate: string;
  competitionLocation: string;
  registrationStartDate: string;
  registrationStartTime: string;
  registrationDeadline: string;
  registrationDeadlineTime: string;
  contactEmail: string;
  contactPhone: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  transferAmount: string;
  transferNotes: string;
}

const defaultConfig: CompetitionConfig = {
  competitionName: '柔術錦標賽',
  competitionStartDate: '',
  competitionEndDate: '',
  competitionLocation: '',
  registrationStartDate: '',
  registrationStartTime: '',
  registrationDeadline: '',
  registrationDeadlineTime: '',
  contactEmail: '',
  contactPhone: '',
  bankName: '',
  bankAccount: '',
  bankAccountName: '',
  transferAmount: '',
  transferNotes: ''
};

export const useCompetitionConfig = () => {
  const [config, setConfig] = useState<CompetitionConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        console.error('Failed to fetch config:', error);
        // Keep default config if fetch fails
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfig();
  }, []);

  return { config, loading };
};