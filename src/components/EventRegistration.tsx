'use client';

import { useState, useEffect } from 'react';
import { Trophy, Check, X, AlertCircle, Users, Lock } from 'lucide-react';
import { EVENT_TYPES, isTeamEventType } from '@/lib/types';

interface Props {
  unitId: string | null;
  onEventsRegistered: () => void;
  disabled?: boolean;
}

interface Athlete {
  id: string;
  name: string;
  gender: string;
  ageGroup: string;
  weight: number;
  registrations: any[];
}

interface EventCategory {
  id: string;
  ageGroup: string;
  gender: string;
  weightClass: string;
  description: string;
}

interface AvailableEventType {
  id: string;
  key: string;
  name: string;
  requiresTeam: boolean;
  categories: EventCategory[];
}

export default function EventRegistration({ unitId, onEventsRegistered, disabled = false }: Props) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Record<string, string[]>>({});
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [currentTeamEvent, setCurrentTeamEvent] = useState<{athleteId: string, eventType: string} | null>(null);
  // 每位選手可報名的項目（含符合其年齡／性別／體重的量級），來自 /api/available-events
  const [availableByAthlete, setAvailableByAthlete] = useState<Record<string, AvailableEventType[]>>({});

  useEffect(() => {
    if (unitId) {
      fetchAthletes();
    }
  }, [unitId]);

  const fetchAthletes = async () => {
    if (!unitId) return;
    
    try {
      const response = await fetch(`/api/athletes?unitId=${unitId}`);
      const result = await response.json();
      if (result.success) {
        setAthletes(result.data);
        
        // Initialize selected events
        const initialEvents: Record<string, string[]> = {};
        result.data.forEach((athlete: Athlete) => {
          initialEvents[athlete.id] = athlete.registrations.map((reg: any) => reg.eventType);
        });
        setSelectedEvents(initialEvents);

        // 可報名項目一律由後端決定：/api/available-events 會依選手的年齡組、
        // 性別與體重篩選出符合的量級，前端不再自行硬編碼判斷條件。
        const entries = await Promise.all(
          result.data.map(async (athlete: Athlete) => {
            try {
              const res = await fetch(`/api/available-events?athleteId=${athlete.id}`);
              const json = await res.json();
              return [athlete.id, json?.data?.eventTypes ?? []] as const;
            } catch {
              return [athlete.id, []] as const;
            }
          })
        );
        setAvailableByAthlete(Object.fromEntries(entries));
      }
    } catch (err) {
      console.error('Failed to fetch athletes:', err);
    }
  };

  /** 該選手可報名的項目（後端已依年齡組／性別／體重篩選） */
  const getAvailableEvents = (athlete: Athlete): AvailableEventType[] =>
    availableByAthlete[athlete.id] ?? [];

  /**
   * 決定雙人項目要落在哪個組別。
   *
   * 組別完全由兩人的性別決定：兩男 men、兩女 women、一男一女 mixed。
   * 因此不需要讓使用者手動選——也避免兩位隊友選到不同組別，
   * 那會讓費用計算把同一組算成兩隊。
   */
  const pickTeamCategory = (
    eventType: AvailableEventType,
    athlete: Athlete,
    partner: Athlete
  ): EventCategory | undefined => {
    const wanted =
      athlete.gender === partner.gender ? athlete.gender : 'mixed';
    return (
      eventType.categories.find((c) => c.gender === wanted) ??
      eventType.categories[0]
    );
  };

  const toggleEvent = (athleteId: string, eventType: string) => {
    setSelectedEvents(prev => ({
      ...prev,
      [athleteId]: prev[athleteId]?.includes(eventType)
        ? prev[athleteId].filter(e => e !== eventType)
        : [...(prev[athleteId] || []), eventType]
    }));
  };

  const handleRegisterEvent = async (athleteId: string, eventType: string) => {
    // 如果是演武項目，需要選擇隊友
    if (isTeamEventType(eventType)) {
      setCurrentTeamEvent({ athleteId, eventType });
      setShowTeamModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 非雙人項目在這個階段只會有一個符合的量級（後端已依體重篩選）
      const available = availableByAthlete[athleteId] ?? [];
      const target = available.find((e) => e.key === eventType);
      const category = target?.categories[0];

      if (!category) {
        throw new Error('找不到符合此選手條件的量級');
      }

      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId,
          eventCategoryId: category.id
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '報名失敗');
      }

      fetchAthletes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamRegistration = async (partnerId: string) => {
    if (!currentTeamEvent) return;

    setLoading(true);
    setError(null);
    
    try {
      const athlete = athletes.find((a) => a.id === currentTeamEvent.athleteId);
      const partner = athletes.find((a) => a.id === partnerId);
      const available = availableByAthlete[currentTeamEvent.athleteId] ?? [];
      const target = available.find((e) => e.key === currentTeamEvent.eventType);

      if (!athlete || !partner || !target) {
        throw new Error('找不到選手或項目資料');
      }

      const category = pickTeamCategory(target, athlete, partner);
      if (!category) {
        throw new Error('找不到符合的組別');
      }

      // 只送一次請求：後端會在同一個交易內為兩位選手各建立一筆互為隊友的紀錄。
      // 先前拆成兩次請求，第二次會被後端的「隊友已報名」檢查擋下，
      // 而且一旦只成功一筆，費用會被當成單人參賽而少收一半。
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: currentTeamEvent.athleteId,
          eventCategoryId: category.id,
          teamPartnerId: partnerId
        })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '組隊報名失敗');
      }

      // 成功後重新載入資料並關閉對話框
      await fetchAthletes();
      setShowTeamModal(false);
      setCurrentTeamEvent(null);
    } catch (err: any) {
      setError(`組隊報名失敗: ${err.message}`);
      // 發生錯誤時不關閉對話框，讓使用者可以重試
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEvent = async (registrationId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/registrations?id=${registrationId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '取消報名失敗');
      }

      fetchAthletes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!unitId) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-800 font-medium">請先完成單位註冊和選手註冊</p>
      </div>
    );
  }

  if (athletes.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-800 font-medium">尚無選手資料，請先註冊選手</p>
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <Lock className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-amber-800 mb-2">項目報名已鎖定</h3>
            <p className="text-amber-700">繳費完成後，項目報名已鎖定，無法進行修改。您仍可查看現有報名資料。</p>
          </div>
        </div>

        {/* 顯示現有報名資料（僅查看） */}
        <div className="space-y-6">
          {athletes.map(athlete => (
            <div key={athlete.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {athlete.name} 
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    ({athlete.gender === 'M' ? '男' : '女'} | {athlete.weight}kg | 
                    {athlete.ageGroup === 'adult' ? '成人組' : 
                     athlete.ageGroup === 'youth' ? '青年組' :
                     athlete.ageGroup === 'junior' ? '青少年組' :
                     athlete.ageGroup === 'child' ? '兒童組' : '大師組'})
                  </span>
                </h3>
              </div>

              {athlete.registrations.length > 0 ? (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium mb-3">
                    已報名 {athlete.registrations.length} 項目：
                  </p>
                  <div className="grid gap-3">
                    {athlete.registrations.map((reg: any) => {
                      const eventName = EVENT_TYPES[reg.eventType as keyof typeof EVENT_TYPES];
                      const isTeamEvent = isTeamEventType(reg.eventType);
                      const teammate = isTeamEvent && reg.teamPartnerId ? 
                        athletes.find(a => a.id === reg.teamPartnerId) : null;
                      
                      return (
                        <div key={reg.id} className="flex items-center bg-white p-3 rounded-lg border">
                          {isTeamEvent ? (
                            <Users className="h-5 w-5 text-blue-600 mr-3" />
                          ) : (
                            <Trophy className="h-5 w-5 text-blue-600 mr-3" />
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{eventName}</div>
                            {teammate && (
                              <div className="text-xs text-gray-600">
                                隊友: {teammate.name}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">此選手尚未報名任何項目</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">項目報名</h2>
        <p className="text-gray-900 font-medium">為每位選手選擇要參加的競賽項目</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {athletes.map(athlete => {
          const availableEvents = getAvailableEvents(athlete);
          
          return (
            <div key={athlete.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {athlete.name} 
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    ({athlete.gender === 'M' ? '男' : '女'} | {athlete.weight}kg | 
                    {athlete.ageGroup === 'adult' ? '成人組' : 
                     athlete.ageGroup === 'youth' ? '青年組' :
                     athlete.ageGroup === 'junior' ? '青少年組' :
                     athlete.ageGroup === 'child' ? '兒童組' : '大師組'})
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {availableEvents.map((eventType) => {
                  const key = eventType.key;
                  // 直接用後端回傳的名稱，不再以 key 反查前端常數——
                  // 兩邊 key 曾經不一致，正是先前演武費用計價出錯的原因。
                  const label = eventType.name;
                  const isRegistered = athlete.registrations.some((reg: any) => reg.eventType === key);
                  const category = eventType.categories[0];

                  return (
                    <div key={key} className="relative">
                      <button
                        onClick={() => {
                          if (!isRegistered) {
                            handleRegisterEvent(athlete.id, key);
                          } else {
                            const registration = athlete.registrations.find((reg: any) => reg.eventType === key);
                            if (registration) {
                              handleCancelEvent(registration.id);
                            }
                          }
                        }}
                        disabled={loading}
                        className={`w-full p-3 rounded-lg border-2 transition-all ${
                          isRegistered
                            ? 'bg-green-50 border-green-500 text-green-700'
                            : 'bg-white border-gray-300 hover:border-blue-500'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isTeamEventType(key) ? (
                          <Users className={`h-5 w-5 mx-auto mb-1 ${
                            isRegistered ? 'text-green-600' : 'text-gray-700'
                          }`} />
                        ) : (
                          <Trophy className={`h-5 w-5 mx-auto mb-1 ${
                            isRegistered ? 'text-green-600' : 'text-gray-700'
                          }`} />
                        )}
                        <div className="text-sm font-medium text-gray-900">{label}</div>
                        {isTeamEventType(key) ? (
                          <div className="text-xs text-gray-600 mt-1">(2人組隊)</div>
                        ) : (
                          category?.description && (
                            <div className="text-xs text-gray-600 mt-1">{category.description}</div>
                          )
                        )}
                        {isRegistered && (
                          <Check className="absolute top-1 right-1 h-4 w-4 text-green-600" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {athlete.registrations.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium mb-2">
                    已報名 {athlete.registrations.length} 項目：
                  </p>
                  <div className="space-y-1">
                    {athlete.registrations.map((reg: any) => {
                      const eventName = EVENT_TYPES[reg.eventType as keyof typeof EVENT_TYPES];
                      const isTeamEvent = isTeamEventType(reg.eventType);
                      const teammate = isTeamEvent && reg.teamPartnerId ? 
                        athletes.find(a => a.id === reg.teamPartnerId) : null;
                      
                      return (
                        <div key={reg.id} className="text-xs text-blue-600">
                          • {eventName}
                          {teammate && (
                            <span className="ml-2 text-gray-600">
                              (隊友: {teammate.name})
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onEventsRegistered}
          className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          繼續至繳費頁面
        </button>
      </div>

      {/* 組隊對話框 */}
      {showTeamModal && currentTeamEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              選擇演武隊友
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              {EVENT_TYPES[currentTeamEvent.eventType as keyof typeof EVENT_TYPES]}需要2人組隊參加，請選擇隊友：
            </p>
            
            {loading && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">正在處理組隊報名...</p>
              </div>
            )}
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {athletes.filter(athlete => 
                athlete.id !== currentTeamEvent.athleteId && 
                athlete.ageGroup !== 'child' &&
                !athlete.registrations.some(reg => reg.eventType === currentTeamEvent.eventType)
              ).map(athlete => (
                <button
                  key={athlete.id}
                  onClick={() => handleTeamRegistration(athlete.id)}
                  disabled={loading}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-sm font-medium text-gray-900">
                    {athlete.name} - {athlete.gender === 'M' ? '男' : '女'} - {athlete.weight}kg
                  </div>
                  <div className="text-xs text-gray-600">
                    {athlete.ageGroup === 'adult' ? '成人組' : 
                     athlete.ageGroup === 'youth' ? '青年組' :
                     athlete.ageGroup === 'junior' ? '青少年組' :
                     athlete.ageGroup === 'child' ? '兒童組' : '大師組'}
                  </div>
                </button>
              ))}
            </div>

            {athletes.filter(athlete => 
              athlete.id !== currentTeamEvent.athleteId && 
              athlete.ageGroup !== 'child' &&
              !athlete.registrations.some(reg => reg.eventType === currentTeamEvent.eventType)
            ).length === 0 && (
              <p className="text-sm text-gray-600 text-center py-4">
                沒有可選擇的隊友。請先註冊更多選手或確認其他選手尚未報名此項目。
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTeamModal(false);
                  setCurrentTeamEvent(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}