'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Trophy, Users, UserPlus, DollarSign, FileCheck, LogOut } from 'lucide-react';
import UnitRegistration from '@/components/UnitRegistration';
import AthleteRegistration from '@/components/AthleteRegistration';
import EventRegistration from '@/components/EventRegistration';
import PaymentSection from '@/components/PaymentSection';
import UnitProfile from '@/components/UnitProfile';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';

interface UnitInfo {
  id: string;
  name: string;
  address?: string;
  contactName: string;
  phone: string;
  email: string;
}

interface CompetitionConfig {
  competitionName: string;
  competitionStartDate: string;
  competitionEndDate: string;
  competitionLocation: string;
  headerBanner: string;
  supervisorUnit: string;
  organizerUnit: string;
  coOrganizerUnit: string;
  sponsorUnit: string;
  registrationStartDate: string;
  registrationStartTime: string;
  registrationDeadline: string;
  registrationDeadlineTime: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  transferAmount: string;
  transferNotes: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('unit');
  const [currentUnitId, setCurrentUnitId] = useState<string | null>(null);
  const [currentUnit, setCurrentUnit] = useState<UnitInfo | null>(null);
  const { paymentInfo, isRegistrationLocked } = usePaymentStatus(currentUnitId);
  const [config, setConfig] = useState<CompetitionConfig>({
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

  // Load competition config
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
      }
    };
    
    fetchConfig();
  }, []);

  // Load session and active tab from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('unitSession');
    const savedTab = localStorage.getItem('activeTab');
    
    // 檢查是否為Google OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const sessionData = urlParams.get('session');
    
    if (authStatus === 'success' && sessionData) {
      try {
        const session = JSON.parse(decodeURIComponent(sessionData));
        setCurrentUnitId(session.unitId);
        setCurrentUnit(session.unit);
        setActiveTab('athlete');
        // 清除URL參數
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      } catch (error) {
        console.error('Failed to parse Google OAuth session:', error);
      }
    }
    
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setCurrentUnitId(session.unitId);
        setCurrentUnit(session.unit);
        // Restore the saved tab if unit is logged in
        if (savedTab && session.unitId) {
          setActiveTab(savedTab);
        }
      } catch (error) {
        console.error('Failed to parse saved session:', error);
        localStorage.removeItem('unitSession');
        localStorage.removeItem('activeTab');
      }
    }
  }, []);

  // Save session when unit changes
  useEffect(() => {
    if (currentUnitId && currentUnit) {
      localStorage.setItem('unitSession', JSON.stringify({
        unitId: currentUnitId,
        unit: currentUnit
      }));
    }
  }, [currentUnitId, currentUnit]);

  // Save active tab when it changes
  useEffect(() => {
    if (currentUnitId) {
      localStorage.setItem('activeTab', activeTab);
    }
  }, [activeTab, currentUnitId]);

  const handleLogout = () => {
    localStorage.removeItem('unitSession');
    localStorage.removeItem('activeTab');
    setCurrentUnitId(null);
    setCurrentUnit(null);
    setActiveTab('unit');
  };

  // Check if registration is open
  const getRegistrationStatus = () => {
    const now = new Date();
    
    // If no registration dates are set, assume registration is open
    if (!config.registrationStartDate && !config.registrationDeadline) {
      return { status: 'open', message: '' };
    }
    
    // Check if registration has started
    if (config.registrationStartDate) {
      const startDateTime = new Date(`${config.registrationStartDate}T${config.registrationStartTime || '00:00'}`);
      if (now < startDateTime) {
        return { 
          status: 'not_started', 
          message: `報名將於 ${startDateTime.toLocaleDateString('zh-TW')} ${config.registrationStartTime || '00:00'} 開始`
        };
      }
    }
    
    // Check if registration has ended
    if (config.registrationDeadline) {
      const endDateTime = new Date(`${config.registrationDeadline}T${config.registrationDeadlineTime || '23:59'}`);
      if (now > endDateTime) {
        return { 
          status: 'ended', 
          message: `報名已於 ${endDateTime.toLocaleDateString('zh-TW')} ${config.registrationDeadlineTime || '23:59'} 截止`
        };
      }
    }
    
    return { status: 'open', message: '' };
  };

  const registrationStatus = getRegistrationStatus();

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* 橫幅圖片區域 */}
      {config.headerBanner ? (
        <div className="relative w-full">
          {/* Banner圖片 - 手機限制高度，桌面固定224px高度，滿版無空白 */}
          <img 
            src={config.headerBanner} 
            alt="Competition Banner" 
            className="w-full h-auto max-h-40 md:max-h-64 lg:h-56 object-contain bg-white"
          />
          {/* 登出按鈕浮動在右上角 */}
          {currentUnitId && (
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg"
              >
                <LogOut className="h-5 w-5 text-white" />
                <span className="font-medium text-white">登出</span>
              </button>
            </div>
          )}
        </div>
      ) : null}
      
      {/* 只有在沒有橫幅圖片時才顯示原始 header */}
      {!config.headerBanner && (
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 sm:p-6 shadow-lg">
          <div className="container mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Trophy className="h-6 w-6 sm:h-8 sm:w-8 shrink-0" />
                  <h1 className="text-xl sm:text-3xl font-bold">{config.competitionName} 報名系統</h1>
                </div>
                <div className="mt-2 text-blue-100">
                  {config.competitionStartDate && (
                    <p>
                      比賽日期：
                      {config.competitionStartDate === config.competitionEndDate 
                        ? new Date(config.competitionStartDate).toLocaleDateString('zh-TW')
                        : `${new Date(config.competitionStartDate).toLocaleDateString('zh-TW')} - ${new Date(config.competitionEndDate).toLocaleDateString('zh-TW')}`
                      }
                    </p>
                  )}
                  {config.competitionLocation && (
                    <p className="mt-1">比賽地點：{config.competitionLocation}</p>
                  )}
                  {(config.registrationStartDate || config.registrationDeadline) && (
                    <div className="mt-2 text-sm">
                      {config.registrationStartDate && config.registrationDeadline ? (
                        <p>
                          報名期間：
                          {new Date(config.registrationStartDate).toLocaleDateString('zh-TW')} {config.registrationStartTime || '00:00'} - 
                          {new Date(config.registrationDeadline).toLocaleDateString('zh-TW')} {config.registrationDeadlineTime || '23:59'}
                        </p>
                      ) : config.registrationStartDate ? (
                        <p>
                          報名開始：{new Date(config.registrationStartDate).toLocaleDateString('zh-TW')} {config.registrationStartTime || '00:00'}
                        </p>
                      ) : config.registrationDeadline ? (
                        <p>
                          報名截止：{new Date(config.registrationDeadline).toLocaleDateString('zh-TW')} {config.registrationDeadlineTime || '23:59'}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
              {currentUnitId && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-md"
                >
                  <LogOut className="h-5 w-5 text-white" />
                  <span className="font-medium text-white">登出</span>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      <main className="container mx-auto p-4 sm:p-6">
        {/* 報名狀態提示 */}
        {registrationStatus.status !== 'open' && (
          <div className={`mb-6 p-4 border-l-4 rounded-r-lg ${
            registrationStatus.status === 'not_started' 
              ? 'bg-blue-50 border-blue-400' 
              : 'bg-red-50 border-red-400'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className={`h-5 w-5 ${
                  registrationStatus.status === 'not_started' 
                    ? 'text-blue-400' 
                    : 'text-red-400'
                }`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className={`text-sm font-semibold ${
                  registrationStatus.status === 'not_started' 
                    ? 'text-blue-800' 
                    : 'text-red-800'
                }`}>
                  {registrationStatus.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 進度提示 */}
        {!currentUnitId && registrationStatus.status === 'open' && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-yellow-800">
                  請先完成「單位註冊」才能進行其他步驟
                </p>
              </div>
            </div>
          </div>
        )}

        {currentUnitId && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-green-800">
                  單位註冊已完成！現在可以進行選手註冊和其他步驟
                </p>
              </div>
            </div>
          </div>
        )}

        {currentUnitId && currentUnit && (
          <div className="mb-8">
            <UnitProfile 
              unitInfo={currentUnit}
              onUnitUpdated={(updatedInfo) => setCurrentUnit(updatedInfo)}
            />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => {
            // 只有在有單位ID或選擇單位註冊頁時才允許切換，且報名期間開放
            if ((value === 'unit' || currentUnitId) && registrationStatus.status === 'open') {
              setActiveTab(value);
            }
          }} className="w-full">
            <TabsList className="flex border-b bg-gray-50 overflow-x-auto">
              <TabsTrigger 
                value="unit" 
                disabled={registrationStatus.status !== 'open'}
                className={`flex-1 px-2 py-3 sm:px-6 sm:py-4 text-center font-medium transition-all whitespace-nowrap ${
                  registrationStatus.status !== 'open'
                    ? 'text-gray-500 cursor-not-allowed bg-gray-200 opacity-60'
                    : isRegistrationLocked
                      ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-amber-50 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 data-[state=active]:text-amber-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600'
                }`}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="font-semibold text-xs sm:text-base">
                    <span className="sm:hidden">單位</span>
                    <span className="hidden sm:inline">1. 單位註冊</span>
                  </span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="athlete" 
                disabled={!currentUnitId || registrationStatus.status !== 'open'}
                className={`flex-1 px-2 py-3 sm:px-6 sm:py-4 text-center font-medium transition-all whitespace-nowrap ${
                  !currentUnitId || registrationStatus.status !== 'open'
                    ? 'text-gray-500 cursor-not-allowed bg-gray-200 opacity-60' 
                    : isRegistrationLocked
                      ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-amber-50 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 data-[state=active]:text-amber-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600'
                }`}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="font-semibold text-xs sm:text-base">
                    <span className="sm:hidden">選手</span>
                    <span className="hidden sm:inline">2. 選手註冊</span>
                  </span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="event" 
                disabled={!currentUnitId || registrationStatus.status !== 'open'}
                className={`flex-1 px-2 py-3 sm:px-6 sm:py-4 text-center font-medium transition-all whitespace-nowrap ${
                  !currentUnitId || registrationStatus.status !== 'open'
                    ? 'text-gray-500 cursor-not-allowed bg-gray-200 opacity-60' 
                    : isRegistrationLocked
                      ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-amber-50 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 data-[state=active]:text-amber-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600'
                }`}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="font-semibold text-xs sm:text-base">
                    <span className="sm:hidden">項目</span>
                    <span className="hidden sm:inline">3. 項目報名</span>
                  </span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="payment" 
                disabled={!currentUnitId || registrationStatus.status !== 'open'}
                className={`flex-1 px-2 py-3 sm:px-6 sm:py-4 text-center font-medium transition-all whitespace-nowrap ${
                  !currentUnitId || registrationStatus.status !== 'open'
                    ? 'text-gray-500 cursor-not-allowed bg-gray-200 opacity-60' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600'
                }`}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="font-semibold text-xs sm:text-base">4. 繳費</span>
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Payment Status Lock Notice */}
            {isRegistrationLocked && (
              <div className="mx-4 sm:mx-8 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-800">
                    {paymentInfo?.paymentStatus === 'paid' && '匯款資料已提交，待確認中。'}
                    {paymentInfo?.paymentStatus === 'confirmed' && '繳費已確認完成。'}
                    報名資料已鎖定，您仍可查看已註冊的資料，但無法新增或修改。
                  </span>
                </div>
              </div>
            )}

            <div className="p-4 sm:p-8">
              <TabsContent value="unit">
                <UnitRegistration 
                  onUnitRegistered={(unitId, unitInfo) => {
                    setCurrentUnitId(unitId);
                    setCurrentUnit(unitInfo);
                    setActiveTab('athlete');
                  }}
                  disabled={isRegistrationLocked}
                />
              </TabsContent>

              <TabsContent value="athlete">
                <AthleteRegistration 
                  unitId={currentUnitId}
                  onAthleteRegistered={() => setActiveTab('event')}
                  disabled={isRegistrationLocked}
                />
              </TabsContent>

              <TabsContent value="event">
                <EventRegistration 
                  unitId={currentUnitId}
                  onEventsRegistered={() => setActiveTab('payment')}
                  disabled={isRegistrationLocked}
                />
              </TabsContent>

              <TabsContent value="payment">
                <PaymentSection unitId={currentUnitId} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">報名流程說明</h2>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <div className="flex items-center gap-2">
                <span className={`font-bold text-lg ${currentUnitId ? 'text-green-600' : 'text-blue-600'}`}>
                  {currentUnitId ? '✓' : '1.'}
                </span>
                {currentUnitId && <span className="text-green-600 font-bold text-lg">1.</span>}
              </div>
              <span className={`font-medium ${currentUnitId ? 'text-gray-600 line-through' : 'text-gray-800'}`}>
                先註冊報名單位：填寫單位名稱、聯絡人、電話、電子郵件
                {currentUnitId && <span className="text-green-600 font-semibold ml-2">(已完成)</span>}
              </span>
            </li>
            <li className="flex gap-3">
              <span className={`font-bold text-lg ${currentUnitId ? 'text-blue-600' : 'text-gray-400'}`}>2.</span>
              <span className={`font-medium ${currentUnitId ? 'text-gray-800' : 'text-gray-500'}`}>
                註冊選手：填寫選手基本資料、組別、體重、段位等資訊
              </span>
            </li>
            <li className="flex gap-3">
              <span className={`font-bold text-lg ${currentUnitId ? 'text-blue-600' : 'text-gray-400'}`}>3.</span>
              <span className={`font-medium ${currentUnitId ? 'text-gray-800' : 'text-gray-500'}`}>
                項目報名：為每位選手選擇要參加的競賽項目
              </span>
            </li>
            <li className="flex gap-3">
              <span className={`font-bold text-lg ${currentUnitId ? 'text-blue-600' : 'text-gray-400'}`}>4.</span>
              <span className={`font-medium ${currentUnitId ? 'text-gray-800' : 'text-gray-500'}`}>
                繳費：計算報名費用並填寫匯款資料
              </span>
            </li>
            <li className="flex gap-3">
              <span className={`font-bold text-lg ${currentUnitId ? 'text-blue-600' : 'text-gray-400'}`}>5.</span>
              <span className={`font-medium ${currentUnitId ? 'text-gray-800' : 'text-gray-500'}`}>
                確認：系統將寄發確認電子郵件
              </span>
            </li>
          </ol>
          
          {!currentUnitId && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium text-sm">
                💡 提示：所有步驟都必須按順序完成，請先從「單位註冊」開始
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* 單位資訊區塊 */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-600 pb-2">主辦單位</h3>
              {config.supervisorUnit && (
                <div>
                  <span className="text-gray-300 text-sm font-medium">指導單位</span>
                  <p className="text-gray-100 font-bold">{config.supervisorUnit}</p>
                </div>
              )}
              {config.organizerUnit && (
                <div>
                  <span className="text-gray-300 text-sm font-medium">主辦單位</span>
                  <p className="text-gray-100 font-bold">{config.organizerUnit}</p>
                </div>
              )}
              {config.coOrganizerUnit && (
                <div>
                  <span className="text-gray-300 text-sm font-medium">協辦單位</span>
                  <p className="text-gray-100 font-bold">{config.coOrganizerUnit}</p>
                </div>
              )}
              {config.sponsorUnit && (
                <div>
                  <span className="text-gray-300 text-sm font-medium">贊助單位</span>
                  <p className="text-gray-100 font-bold">{config.sponsorUnit}</p>
                </div>
              )}
            </div>

            {/* 賽會資訊區塊 */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-600 pb-2">賽會資訊</h3>
              <div>
                <span className="text-gray-300 text-sm font-medium">賽會名稱</span>
                <p className="text-gray-100 font-bold">{config.competitionName}</p>
              </div>
              {config.competitionLocation && (
                <div>
                  <span className="text-gray-300 text-sm font-medium">比賽地點</span>
                  <p className="text-gray-100 font-bold">{config.competitionLocation}</p>
                </div>
              )}
              {config.competitionStartDate && (
                <div>
                  <span className="text-gray-300 text-sm font-medium">比賽日期</span>
                  <p className="text-gray-100 font-bold">
                    {config.competitionStartDate === config.competitionEndDate 
                      ? new Date(config.competitionStartDate).toLocaleDateString('zh-TW')
                      : `${new Date(config.competitionStartDate).toLocaleDateString('zh-TW')} - ${new Date(config.competitionEndDate).toLocaleDateString('zh-TW')}`
                    }
                  </p>
                </div>
              )}
            </div>

            {/* 聯絡資訊區塊 */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-600 pb-2">聯絡資訊</h3>
              {config.contactName && (
                <div>
                  <span className="text-gray-300 text-sm font-medium">聯絡人</span>
                  <p className="text-gray-100 font-bold">{config.contactName}</p>
                </div>
              )}
              {config.contactEmail && (
                <div>
                  <span className="text-gray-300 text-sm font-medium">聯絡信箱</span>
                  <p className="text-gray-100 font-bold break-words">{config.contactEmail}</p>
                </div>
              )}
              {config.contactPhone && (
                <div>
                  <span className="text-gray-300 text-sm font-medium">聯絡電話</span>
                  <p className="text-gray-100 font-bold">{config.contactPhone}</p>
                </div>
              )}
              {!config.contactName && !config.contactEmail && !config.contactPhone && (
                <div>
                  <span className="text-gray-300 text-sm font-medium">技術支援</span>
                  <p className="text-gray-100 font-bold">jujitsu@example.com</p>
                </div>
              )}
            </div>
          </div>

          {/* 版權資訊 */}
          <div className="border-t border-gray-600 mt-8 pt-6 text-center">
            <p className="text-gray-400 text-sm">
              &copy; 2025 {config.competitionName.replace(/^\d{4}年/, '')}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}