'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Trophy,
  Users,
  ChevronRight,
  ArrowUp
} from 'lucide-react';

interface Registration {
  id: string;
  eventType: string;
  eventDetail?: string;
  weightClass: string;
  teamPartnerId?: string;
  genderDivision?: string;
  createdAt: string;
  athlete: {
    id: string;
    name: string;
    gender: string;
    birthDate: string;
    weight: number;
    belt: string;
    nationalId: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelation: string;
    coachName: string;
    ageGroup: string;
    unit: {
      name: string;
      contactName: string;
      email: string;
      phone: string;
    };
  };
}

interface EventSummary {
  eventType: string;
  eventDetail?: string;
  count: number;
  registrations: Registration[];
}

export default function RegistrationsManagement() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchRegistrations();
  }, [router]);

  const fetchRegistrations = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/registrations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRegistrations(data);
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  // 根據項目類型分組報名資料
  const getEventSummaries = (): EventSummary[] => {
    const eventMap = new Map<string, Registration[]>();
    
    registrations.forEach(registration => {
      const key = `${registration.eventType}-${registration.eventDetail || ''}`;
      if (!eventMap.has(key)) {
        eventMap.set(key, []);
      }
      eventMap.get(key)!.push(registration);
    });

    return Array.from(eventMap.entries()).map(([key, regs]) => ({
      eventType: regs[0].eventType,
      eventDetail: regs[0].eventDetail,
      count: regs.length,
      registrations: regs
    }));
  };

  const getEventTypeText = (eventType: string, eventDetail?: string) => {
    switch (eventType) {
      case 'fighting': return '對打組';
      case 'newaza': return '寢技組'; 
      case 'fullcontact': return '格鬥組';
      case 'duo': return '雙人傳統演武';
      case 'show': return '雙人創意演武';
      case 'nogi': return '無道袍組';
      default: return eventType;
    }
  };

  const getAgeGroupText = (ageGroup: string) => {
    switch (ageGroup) {
      case 'child': return '兒童組';
      case 'youth': return '青年組';
      case 'junior': return '少年組';
      case 'adult': return '成人組';
      case 'master': return '大師組';
      default: return ageGroup;
    }
  };

  const getBeltText = (belt: string) => {
    switch (belt) {
      case 'white': return '白帶';
      case 'blue': return '藍帶';
      case 'purple': return '紫帶';
      case 'brown': return '棕帶';
      case 'black': return '黑帶';
      default: return belt;
    }
  };

  const getAge = (birthDate: string) => {
    return new Date().getFullYear() - new Date(birthDate).getFullYear();
  };

  // 計算正確的量級
  const calculateWeightClass = (weight: number, eventType: string, ageGroup: string, gender: string): string => {
    // 成人組和大師組
    if (ageGroup === 'adult' || ageGroup === 'master') {
      if (gender === 'M') {
        if (weight <= 56) return '-56';
        if (weight <= 62) return '-62';
        if (weight <= 69) return '-69';
        if (weight <= 77) return '-77';
        if (weight <= 85) return '-85';
        if (weight <= 94) return '-94';
        if (weight <= 105) return '-105';
        return '+105';
      } else {
        if (weight <= 49) return '-49';
        if (weight <= 55) return '-55';
        if (weight <= 62) return '-62';
        if (weight <= 70) return '-70';
        if (weight <= 79) return '-79';
        return '+79';
      }
    }
    
    // 青年組
    if (ageGroup === 'youth') {
      if (gender === 'M') {
        if (weight <= 56) return '-56';
        if (weight <= 62) return '-62';
        if (weight <= 69) return '-69';
        if (weight <= 77) return '-77';
        if (weight <= 85) return '-85';
        return '+85';
      } else {
        if (weight <= 49) return '-49';
        if (weight <= 55) return '-55';
        if (weight <= 62) return '-62';
        if (weight <= 70) return '-70';
        return '+70';
      }
    }
    
    // 少年組
    if (ageGroup === 'junior') {
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
    }
    
    // 兒童組
    if (ageGroup === 'child') {
      if (gender === 'M') {
        if (weight <= 28) return '-28';
        if (weight <= 31) return '-31';
        if (weight <= 34) return '-34';
        if (weight <= 37) return '-37';
        if (weight <= 40) return '-40';
        if (weight <= 44) return '-44';
        return '+44';
      } else {
        if (weight <= 26) return '-26';
        if (weight <= 29) return '-29';
        if (weight <= 32) return '-32';
        if (weight <= 35) return '-35';
        if (weight <= 38) return '-38';
        if (weight <= 42) return '-42';
        return '+42';
      }
    }
    
    return 'all';
  };

  // 根據年齡組分組，然後再按量級分組（使用實際計算的量級）
  const groupAthletesByAgeGroupAndWeight = (registrations: Registration[]) => {
    const isDuoEvent = registrations.length > 0 && 
      (registrations[0].eventType === 'show' || registrations[0].eventType === 'duo');
    
    if (isDuoEvent) {
      return groupDuoEventsByAgeGroup(registrations);
    }
    
    const ageGroups = new Map<string, Map<string, Registration[]>>();
    
    registrations.forEach(reg => {
      const ageGroup = reg.athlete.ageGroup;
      // 使用實際體重計算正確的量級，而不是使用原本可能不正確的 weightClass
      const actualWeightClass = calculateWeightClass(
        reg.athlete.weight,
        reg.eventType,
        reg.athlete.ageGroup,
        reg.athlete.gender
      );
      
      if (!ageGroups.has(ageGroup)) {
        ageGroups.set(ageGroup, new Map());
      }
      
      const weightGroups = ageGroups.get(ageGroup)!;
      if (!weightGroups.has(actualWeightClass)) {
        weightGroups.set(actualWeightClass, []);
      }
      
      weightGroups.get(actualWeightClass)!.push(reg);
    });

    // 排序年齡組
    const ageOrder = ['child', 'youth', 'junior', 'adult', 'master'];
    const result: Array<[string, Array<[string, Registration[]]>]> = [];
    
    Array.from(ageGroups.entries())
      .sort(([a], [b]) => ageOrder.indexOf(a) - ageOrder.indexOf(b))
      .forEach(([ageGroup, weightGroups]) => {
        // 按量級排序（數字優先，然後字母）
        const sortedWeightGroups = Array.from(weightGroups.entries())
          .sort(([a], [b]) => {
            // 提取數字部分進行比較
            const getWeightValue = (wc: string) => {
              if (wc === 'all') return 999;
              const match = wc.match(/[-+]?(\d+)/);
              return match ? parseInt(match[1]) : 999;
            };
            return getWeightValue(a) - getWeightValue(b);
          });
        result.push([ageGroup, sortedWeightGroups]);
      });
    
    return result;
  };

  // 雙人項目專用分組邏輯
  const groupDuoEventsByAgeGroup = (registrations: Registration[]) => {
    const ageGroups = new Map<string, Map<string, Registration[]>>();
    const processedTeams = new Set<string>();
    
    registrations.forEach(reg => {
      // 如果已經處理過這個隊伍，跳過
      if (reg.teamPartnerId && processedTeams.has(`${Math.min(reg.athlete.id, reg.teamPartnerId)}-${Math.max(reg.athlete.id, reg.teamPartnerId)}`)) {
        return;
      }
      
      const ageGroup = reg.athlete.ageGroup;
      
      if (!ageGroups.has(ageGroup)) {
        ageGroups.set(ageGroup, new Map());
      }
      
      const weightGroups = ageGroups.get(ageGroup)!;
      let categoryKey = '';
      
      if (reg.teamPartnerId) {
        // 雙人項目：根據性別分組
        categoryKey = reg.genderDivision === 'men' ? '男子組' : 
                      reg.genderDivision === 'women' ? '女子組' : '男女混合組';
        
        // 找到隊友
        const partner = registrations.find(r => r.athlete.id === reg.teamPartnerId);
        if (partner) {
          if (!weightGroups.has(categoryKey)) {
            weightGroups.set(categoryKey, []);
          }
          // 將兩個隊友都加入同一組
          weightGroups.get(categoryKey)!.push(reg, partner);
          processedTeams.add(`${Math.min(reg.athlete.id, reg.teamPartnerId)}-${Math.max(reg.athlete.id, reg.teamPartnerId)}`);
        }
      } else {
        // 個人項目（如果有的話）
        categoryKey = '個人組';
        if (!weightGroups.has(categoryKey)) {
          weightGroups.set(categoryKey, []);
        }
        weightGroups.get(categoryKey)!.push(reg);
      }
    });

    // 排序年齡組
    const ageOrder = ['child', 'youth', 'junior', 'adult', 'master'];
    const result: Array<[string, Array<[string, Registration[]]>]> = [];
    
    Array.from(ageGroups.entries())
      .sort(([a], [b]) => ageOrder.indexOf(a) - ageOrder.indexOf(b))
      .forEach(([ageGroup, weightGroups]) => {
        // 按組別排序
        const sortedWeightGroups = Array.from(weightGroups.entries())
          .sort(([a], [b]) => {
            const order = ['男子組', '女子組', '男女混合組', '個人組'];
            return order.indexOf(a) - order.indexOf(b);
          });
        result.push([ageGroup, sortedWeightGroups]);
      });
    
    return result;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const eventSummaries = getEventSummaries();
  const selectedEventData = selectedEvent ? 
    eventSummaries.find(e => `${e.eventType}-${e.eventDetail || ''}` === selectedEvent) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (selectedEvent) {
                    setSelectedEvent(null);
                  } else {
                    router.push('/admin/dashboard');
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedEvent ? '報名選手清單' : '報名管理'}
                </h1>
                <p className="text-gray-600">
                  {selectedEvent 
                    ? `${getEventTypeText(selectedEventData!.eventType, selectedEventData!.eventDetail)} - 共 ${selectedEventData!.count} 名選手`
                    : '選擇項目查看報名選手'
                  }
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              總計 {registrations.length} 項報名
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {!selectedEvent ? (
          /* Events List */
          <div className="grid gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">所有報名項目</h2>
              <div className="text-sm text-gray-600 mb-4">點選項目查看該項目的報名選手清單</div>
            </div>

            {eventSummaries.map((event) => {
              const eventKey = `${event.eventType}-${event.eventDetail || ''}`;
              return (
                <div 
                  key={eventKey}
                  onClick={() => setSelectedEvent(eventKey)}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Trophy className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {getEventTypeText(event.eventType, event.eventDetail)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {(() => {
                            const isDuoEvent = event.eventType === 'show' || event.eventType === 'duo';
                            if (isDuoEvent) {
                              const teamCount = Math.ceil(event.count / 2);
                              return `${teamCount} 組報名`;
                            } else {
                              return `${event.count} 名選手報名`;
                            }
                          })()} 
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-full">
                        {(() => {
                          const isDuoEvent = event.eventType === 'show' || event.eventType === 'duo';
                          if (isDuoEvent) {
                            const teamCount = Math.ceil(event.count / 2);
                            return `${teamCount} 組`;
                          } else {
                            return `${event.count} 人`;
                          }
                        })()} 
                      </span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}

            {eventSummaries.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500">目前沒有任何報名記錄</div>
              </div>
            )}
          </div>
        ) : (
          /* Selected Event Athletes Table */
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {getEventTypeText(selectedEventData!.eventType, selectedEventData!.eventDetail)}
                </h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <ArrowUp className="h-4 w-4" />
                  返回項目列表
                </button>
              </div>
            </div>

            {/* Athletes grouped by age group and weight class */}
            {groupAthletesByAgeGroupAndWeight(selectedEventData!.registrations).map(([ageGroup, weightGroups], ageGroupIndex) => {
              let athleteCounter = ageGroupIndex * 1000; // 為每個年齡組設置不同的起始編號
              const isDuoEvent = selectedEventData!.registrations.length > 0 && 
                (selectedEventData!.registrations[0].eventType === 'show' || selectedEventData!.registrations[0].eventType === 'duo');
              
              return (
                <div key={ageGroup} className="space-y-4">
                  {/* Age Group Header - 演武項目不顯示年齡組標題 */}
                  {!isDuoEvent && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h2 className="text-xl font-bold text-blue-900">
                        {getAgeGroupText(ageGroup)}
                        <span className="ml-2 text-sm text-blue-700">
                          ({weightGroups.reduce((total, [, registrations]) => total + registrations.length, 0)} 人)
                        </span>
                      </h2>
                    </div>
                  )}

                  {/* Weight Classes for this Age Group */}
                  {weightGroups.map(([weightClass, registrations]) => {
                    const startNumber = athleteCounter + 1;
                    athleteCounter += registrations.length;
                    
                    return (
                      <div key={`${ageGroup}-${weightClass}`} className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b">
                          <h3 className="font-semibold text-gray-900">
                            {(() => {
                              const isDuoEvent = registrations.length > 0 && 
                                (registrations[0].eventType === 'show' || registrations[0].eventType === 'duo');
                              return isDuoEvent ? weightClass : `${weightClass} 級`;
                            })()} 
                            <span className="ml-2 text-sm text-gray-600">
                              ({(() => {
                                const isDuoEvent = registrations.length > 0 && 
                                  (registrations[0].eventType === 'show' || registrations[0].eventType === 'duo');
                                if (isDuoEvent) {
                                  // 雙人項目：計算組別數（人數除以2）
                                  const teamCount = Math.ceil(registrations.length / 2);
                                  return `${teamCount} 組`;
                                } else {
                                  // 個人項目：顯示人數
                                  return `${registrations.length} 人`;
                                }
                              })()})
                            </span>
                          </h3>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                  編號
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                  選手姓名
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                  性別
                                </th>
                                {!(registrations.length > 0 && 
                                  (registrations[0].eventType === 'show' || registrations[0].eventType === 'duo')) && (
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                    段帶
                                  </th>
                                )}
                                {!(registrations.length > 0 && 
                                  (registrations[0].eventType === 'show' || registrations[0].eventType === 'duo')) && (
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                    體重
                                  </th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                  所屬單位
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(() => {
                                const isDuoEvent = registrations.length > 0 && 
                                  (registrations[0].eventType === 'show' || registrations[0].eventType === 'duo');
                                
                                if (isDuoEvent) {
                                  // 雙人項目：每兩個隊友顯示在同一行
                                  const teamRows: JSX.Element[] = [];
                                  const processedIds = new Set<string>();
                                  let teamNumber = 1;
                                  
                                  registrations.forEach((registration, index) => {
                                    if (processedIds.has(registration.id)) return;
                                    
                                    const partner = registration.teamPartnerId ? 
                                      registrations.find(r => r.athlete.id === registration.teamPartnerId) : null;
                                    
                                    if (partner && !processedIds.has(partner.id)) {
                                      // 有隊友的情況
                                      teamRows.push(
                                        <tr key={`team-${registration.id}-${partner.id}`} className="hover:bg-gray-50">
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {String(teamNumber).padStart(3, '0')}
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                              <div className="font-medium text-gray-900">{registration.athlete.name}</div>
                                              <div className="font-medium text-gray-900">{partner.athlete.name}</div>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                                registration.athlete.gender === 'M' 
                                                  ? 'text-blue-700 bg-blue-100' 
                                                  : 'text-pink-700 bg-pink-100'
                                              }`}>
                                                {registration.athlete.gender === 'M' ? '男' : '女'}
                                              </span>
                                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                                partner.athlete.gender === 'M' 
                                                  ? 'text-blue-700 bg-blue-100' 
                                                  : 'text-pink-700 bg-pink-100'
                                              }`}>
                                                {partner.athlete.gender === 'M' ? '男' : '女'}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="space-y-1">
                                              <div className="font-medium">{registration.athlete.unit.name}</div>
                                              <div className="font-medium">{partner.athlete.unit.name}</div>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                      processedIds.add(registration.id);
                                      processedIds.add(partner.id);
                                      teamNumber++;
                                    } else if (!registration.teamPartnerId) {
                                      // 沒有隊友的個人項目
                                      teamRows.push(
                                        <tr key={registration.id} className="hover:bg-gray-50">
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {String(teamNumber).padStart(3, '0')}
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{registration.athlete.name}</div>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                              registration.athlete.gender === 'M' 
                                                ? 'text-blue-700 bg-blue-100' 
                                                : 'text-pink-700 bg-pink-100'
                                            }`}>
                                              {registration.athlete.gender === 'M' ? '男' : '女'}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="font-medium">{registration.athlete.unit.name}</div>
                                          </td>
                                        </tr>
                                      );
                                      processedIds.add(registration.id);
                                      teamNumber++;
                                    }
                                  });
                                  
                                  return teamRows;
                                } else {
                                  // 個人項目：原有的邏輯
                                  return registrations.map((registration, index) => (
                                    <tr key={registration.id} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {String(startNumber + index).padStart(3, '0')}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{registration.athlete.name}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          registration.athlete.gender === 'M' 
                                            ? 'text-blue-700 bg-blue-100' 
                                            : 'text-pink-700 bg-pink-100'
                                        }`}>
                                          {registration.athlete.gender === 'M' ? '男' : '女'}
                                        </span>
                                      </td>
                                      {!(registrations.length > 0 && 
                                        (registrations[0].eventType === 'show' || registrations[0].eventType === 'duo')) && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                                            {getBeltText(registration.athlete.belt)}
                                          </span>
                                        </td>
                                      )}
                                      {!(registrations.length > 0 && 
                                        (registrations[0].eventType === 'show' || registrations[0].eventType === 'duo')) && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                          {registration.athlete.weight} kg
                                        </td>
                                      )}
                                      <td className="px-6 py-4 text-sm text-gray-900">
                                        <div className="font-medium">{registration.athlete.unit.name}</div>
                                      </td>
                                    </tr>
                                  ));
                                }
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}