'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Settings, Calendar, Trophy, ArrowLeft, CreditCard } from 'lucide-react';

export default function CompetitionConfigPage() {
  const [config, setConfig] = useState({
    competitionName: '',
    competitionStartDate: '',
    competitionEndDate: '',
    registrationStartDate: '',
    registrationStartTime: '',
    registrationDeadline: '',
    registrationDeadlineTime: '',
    competitionLocation: '',
    contactEmail: '',
    contactPhone: '',
    bankName: '',
    bankAccount: '',
    bankAccountName: '',
    transferAmount: '',
    transferNotes: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchConfig();
  }, [router]);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/config', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConfig({
          competitionName: data.competitionName || '',
          competitionStartDate: data.competitionStartDate || '',
          competitionEndDate: data.competitionEndDate || '',
          registrationStartDate: data.registrationStartDate || '',
          registrationStartTime: data.registrationStartTime || '',
          registrationDeadline: data.registrationDeadline || '',
          registrationDeadlineTime: data.registrationDeadlineTime || '',
          competitionLocation: data.competitionLocation || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          bankName: data.bankName || '',
          bankAccount: data.bankAccount || '',
          bankAccountName: data.bankAccountName || '',
          transferAmount: data.transferAmount || '',
          transferNotes: data.transferNotes || ''
        });
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      
      const configArray = Object.entries(config).map(([key, value]) => ({
        key,
        value,
        description: getConfigDescription(key)
      }));

      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(configArray),
      });

      if (response.ok) {
        alert('設定儲存成功！');
      } else {
        throw new Error('儲存失敗');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('儲存設定失敗，請再試一次。');
    } finally {
      setSaving(false);
    }
  };

  const getConfigDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      competitionName: '賽會名稱',
      competitionStartDate: '賽會開始日期',
      competitionEndDate: '賽會結束日期',
      registrationStartDate: '報名開始日期',
      registrationStartTime: '報名開始時間',
      registrationDeadline: '報名截止日期',
      registrationDeadlineTime: '報名截止時間',
      competitionLocation: '賽會地點',
      contactEmail: '聯絡人電子信箱',
      contactPhone: '聯絡人電話',
      bankName: '銀行名稱',
      bankAccount: '銀行帳號',
      bankAccountName: '戶名',
      transferAmount: '報名費用',
      transferNotes: '匯款備註'
    };
    return descriptions[key] || '';
  };

  const handleInputChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Settings className="mr-3" />
                  賽會設定
                </h1>
                <p className="text-gray-600">管理賽會基本資訊和時間設定</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
              <Trophy className="mr-2" />
              賽會資訊
            </h2>
            <p className="text-gray-600">設定賽會的基本資訊，這些資訊將顯示在報名系統中。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 賽會名稱 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                賽會名稱
              </label>
              <input
                type="text"
                value={config.competitionName}
                onChange={(e) => handleInputChange('competitionName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                placeholder="例：2024年全國柔術錦標賽"
              />
            </div>

            {/* 賽會地點 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                賽會地點
              </label>
              <input
                type="text"
                value={config.competitionLocation}
                onChange={(e) => handleInputChange('competitionLocation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                placeholder="例：台北市大安運動中心"
              />
            </div>

            {/* 賽會開始日期 */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                賽會開始日期
              </label>
              <input
                type="date"
                value={config.competitionStartDate}
                onChange={(e) => handleInputChange('competitionStartDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
              />
            </div>

            {/* 賽會結束日期 */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                賽會結束日期
              </label>
              <input
                type="date"
                value={config.competitionEndDate}
                onChange={(e) => handleInputChange('competitionEndDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
              />
            </div>

            {/* 報名開始日期 */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                報名開始日期
              </label>
              <input
                type="date"
                value={config.registrationStartDate}
                onChange={(e) => handleInputChange('registrationStartDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
              />
            </div>

            {/* 報名開始時間 */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                報名開始時間
              </label>
              <input
                type="time"
                value={config.registrationStartTime}
                onChange={(e) => handleInputChange('registrationStartTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
              />
            </div>

            {/* 報名截止日期 */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                報名截止日期
              </label>
              <input
                type="date"
                value={config.registrationDeadline}
                onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
              />
            </div>

            {/* 報名截止時間 */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                報名截止時間
              </label>
              <input
                type="time"
                value={config.registrationDeadlineTime}
                onChange={(e) => handleInputChange('registrationDeadlineTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
              />
            </div>

            {/* 聯絡人電子信箱 */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                聯絡人電子信箱
              </label>
              <input
                type="email"
                value={config.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                placeholder="competition@example.com"
              />
            </div>

            {/* 聯絡人電話 */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                聯絡人電話
              </label>
              <input
                type="tel"
                value={config.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                placeholder="02-1234-5678"
              />
            </div>
          </div>

          {/* 匯款資訊設定 */}
          <div className="mb-8 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
              <CreditCard className="mr-2" />
              匯款資訊設定
            </h2>
            <p className="text-gray-600 mb-6">設定報名費用匯款帳戶資訊，這些資訊將顯示在繳費頁面。</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 銀行名稱 */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  銀行名稱
                </label>
                <input
                  type="text"
                  value={config.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                  placeholder="例：台灣銀行"
                />
              </div>

              {/* 銀行帳號 */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  銀行帳號
                </label>
                <input
                  type="text"
                  value={config.bankAccount}
                  onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                  placeholder="例：123-456-789012"
                />
              </div>

              {/* 戶名 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  戶名
                </label>
                <input
                  type="text"
                  value={config.bankAccountName}
                  onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                  placeholder="例：中華民國柔術協會"
                />
              </div>
            </div>
          </div>

          {/* 儲存按鈕 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={saveConfig}
                disabled={saving}
                className="flex items-center px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? '儲存中...' : '儲存設定'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}