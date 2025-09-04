'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Trophy, Users, UserPlus, DollarSign, FileCheck, LogOut } from 'lucide-react';
import UnitRegistration from '@/components/UnitRegistration';
import AthleteRegistration from '@/components/AthleteRegistration';
import EventRegistration from '@/components/EventRegistration';
import PaymentSection from '@/components/PaymentSection';
import UnitProfile from '@/components/UnitProfile';

interface UnitInfo {
  id: string;
  name: string;
  address?: string;
  contactName: string;
  phone: string;
  email: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('unit');
  const [currentUnitId, setCurrentUnitId] = useState<string | null>(null);
  const [currentUnit, setCurrentUnit] = useState<UnitInfo | null>(null);

  // Load session and active tab from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('unitSession');
    const savedTab = localStorage.getItem('activeTab');
    
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8" />
                <h1 className="text-3xl font-bold">2025年全國柔術錦標賽 報名系統</h1>
              </div>
              <p className="mt-2 text-blue-100">比賽日期：2025年10月26日</p>
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

      <main className="container mx-auto p-6">
        {/* 進度提示 */}
        {!currentUnitId && (
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
            // 只有在有單位ID或選擇單位註冊頁時才允許切換
            if (value === 'unit' || currentUnitId) {
              setActiveTab(value);
            }
          }} className="w-full">
            <TabsList className="flex border-b bg-gray-50">
              <TabsTrigger 
                value="unit" 
                className="flex-1 px-6 py-4 text-center text-gray-700 font-medium hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-all"
              >
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-5 w-5" />
                  <span className="font-semibold">1. 單位註冊</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="athlete" 
                disabled={!currentUnitId}
                className={`flex-1 px-6 py-4 text-center font-medium transition-all ${
                  !currentUnitId 
                    ? 'text-gray-500 cursor-not-allowed bg-gray-200 opacity-60' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  <span className="font-semibold">2. 選手註冊</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="event" 
                disabled={!currentUnitId}
                className={`flex-1 px-6 py-4 text-center font-medium transition-all ${
                  !currentUnitId 
                    ? 'text-gray-500 cursor-not-allowed bg-gray-200 opacity-60' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="h-5 w-5" />
                  <span className="font-semibold">3. 項目報名</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="payment" 
                disabled={!currentUnitId}
                className={`flex-1 px-6 py-4 text-center font-medium transition-all ${
                  !currentUnitId 
                    ? 'text-gray-500 cursor-not-allowed bg-gray-200 opacity-60' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <span className="font-semibold">4. 繳費</span>
                </div>
              </TabsTrigger>
            </TabsList>

            <div className="p-8">
              <TabsContent value="unit">
                <UnitRegistration 
                  onUnitRegistered={(unitId, unitInfo) => {
                    setCurrentUnitId(unitId);
                    setCurrentUnit(unitInfo);
                    setActiveTab('athlete');
                  }}
                />
              </TabsContent>

              <TabsContent value="athlete">
                <AthleteRegistration 
                  unitId={currentUnitId}
                  onAthleteRegistered={() => setActiveTab('event')}
                />
              </TabsContent>

              <TabsContent value="event">
                <EventRegistration 
                  unitId={currentUnitId}
                  onEventsRegistered={() => setActiveTab('payment')}
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

      <footer className="bg-gray-800 text-white p-6 mt-12">
        <div className="container mx-auto text-center">
          <p>&copy; 2025 全國柔術錦標賽. All rights reserved.</p>
          <p className="mt-2 text-gray-300 font-medium">技術支援：jujitsu@example.com</p>
        </div>
      </footer>
    </div>
  );
}