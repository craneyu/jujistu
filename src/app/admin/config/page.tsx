'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Settings, Calendar, Trophy, ArrowLeft, CreditCard, Upload, X, Image, Mail } from 'lucide-react';

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
    headerBanner: '',
    supervisorUnit: '',
    organizerUnit: '',
    coOrganizerUnit: '',
    sponsorUnit: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    bankName: '',
    bankAccount: '',
    bankAccountName: '',
    transferAmount: '',
    transferNotes: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPassword: '',
    smtpFromName: '',
    smtpFromEmail: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
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
          headerBanner: data.headerBanner || '',
          supervisorUnit: data.supervisorUnit || '',
          organizerUnit: data.organizerUnit || '',
          coOrganizerUnit: data.coOrganizerUnit || '',
          sponsorUnit: data.sponsorUnit || '',
          contactName: data.contactName || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          bankName: data.bankName || '',
          bankAccount: data.bankAccount || '',
          bankAccountName: data.bankAccountName || '',
          transferAmount: data.transferAmount || '',
          transferNotes: data.transferNotes || '',
          smtpHost: data.smtpHost || '',
          smtpPort: data.smtpPort || '',
          smtpUser: data.smtpUser || '',
          smtpPassword: data.smtpPassword || '',
          smtpFromName: data.smtpFromName || '',
          smtpFromEmail: data.smtpFromEmail || ''
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
      headerBanner: '頁首橫幅圖片',
      supervisorUnit: '指導單位',
      organizerUnit: '主辦單位',
      coOrganizerUnit: '協辦單位',
      sponsorUnit: '贊助單位',
      contactName: '聯絡人姓名',
      contactEmail: '聯絡人電子信箱',
      contactPhone: '聯絡人電話',
      bankName: '銀行名稱',
      bankAccount: '銀行帳號',
      bankAccountName: '戶名',
      transferAmount: '報名費用',
      transferNotes: '匯款備註',
      smtpHost: 'SMTP 伺服器',
      smtpPort: 'SMTP 連接埠',
      smtpUser: 'SMTP 使用者名稱',
      smtpPassword: 'SMTP 密碼',
      smtpFromName: '寄件人名稱',
      smtpFromEmail: '寄件人信箱'
    };
    return descriptions[key] || '';
  };

  const handleInputChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const uploadFile = async (file: File) => {
    // 檢查檔案類型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('請上傳 JPG、PNG 或 GIF 格式的圖片');
      return;
    }

    // 檢查檔案大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('檔案大小不能超過 5MB');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('banner', file);

      const response = await fetch('/api/upload/banner', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        handleInputChange('headerBanner', data.fileUrl);
        alert('圖片上傳成功！');
      } else {
        const errorData = await response.json();
        alert(`上傳失敗：${errorData.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('上傳失敗，請重試');
    } finally {
      setUploading(false);
    }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleBannerRemove = () => {
    handleInputChange('headerBanner', '');
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

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8 pt-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('basic')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'basic'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Trophy className="w-4 h-4 inline mr-2" />
                基本資訊
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'schedule'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                時間設定
              </button>
              <button
                onClick={() => setActiveTab('organization')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'organization'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                主辦單位
              </button>
              <button
                onClick={() => setActiveTab('banner')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'banner'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Image className="w-4 h-4 inline mr-2" />
                橫幅設定
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payment'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-4 h-4 inline mr-2" />
                匯款設定
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'email'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Mail className="w-4 h-4 inline mr-2" />
                郵件設定
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">基本資訊</h3>
                  <p className="text-gray-600">設定賽會的基本資訊和聯絡人資料。</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2">賽會名稱</label>
                    <input
                      type="text"
                      value={config.competitionName}
                      onChange={(e) => handleInputChange('competitionName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="例：2024年全國柔術錦標賽"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2">賽會地點</label>
                    <input
                      type="text"
                      value={config.competitionLocation}
                      onChange={(e) => handleInputChange('competitionLocation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="例：台北市大安運動中心"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2">聯絡人姓名</label>
                    <input
                      type="text"
                      value={config.contactName}
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="例：張主任"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">聯絡人電子信箱</label>
                    <input
                      type="email"
                      value={config.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="competition@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">聯絡人電話</label>
                    <input
                      type="tel"
                      value={config.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="02-1234-5678"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">時間設定</h3>
                  <p className="text-gray-600">設定賽會和報名的時間安排。</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />賽會開始日期
                    </label>
                    <input
                      type="date"
                      value={config.competitionStartDate}
                      onChange={(e) => handleInputChange('competitionStartDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />賽會結束日期
                    </label>
                    <input
                      type="date"
                      value={config.competitionEndDate}
                      onChange={(e) => handleInputChange('competitionEndDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />報名開始日期
                    </label>
                    <input
                      type="date"
                      value={config.registrationStartDate}
                      onChange={(e) => handleInputChange('registrationStartDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">報名開始時間</label>
                    <input
                      type="time"
                      value={config.registrationStartTime}
                      onChange={(e) => handleInputChange('registrationStartTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />報名截止日期
                    </label>
                    <input
                      type="date"
                      value={config.registrationDeadline}
                      onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">報名截止時間</label>
                    <input
                      type="time"
                      value={config.registrationDeadlineTime}
                      onChange={(e) => handleInputChange('registrationDeadlineTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Organization Tab */}
            {activeTab === 'organization' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">主辦單位資訊</h3>
                  <p className="text-gray-600">設定指導、主辦、協辦和贊助單位。</p>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">指導單位</label>
                    <input
                      type="text"
                      value={config.supervisorUnit}
                      onChange={(e) => handleInputChange('supervisorUnit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="例：體育署"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">主辦單位</label>
                    <input
                      type="text"
                      value={config.organizerUnit}
                      onChange={(e) => handleInputChange('organizerUnit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="例：台灣柔術總會"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">協辦單位</label>
                    <input
                      type="text"
                      value={config.coOrganizerUnit}
                      onChange={(e) => handleInputChange('coOrganizerUnit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="例：台北市柔術協會"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">贊助單位</label>
                    <input
                      type="text"
                      value={config.sponsorUnit}
                      onChange={(e) => handleInputChange('sponsorUnit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="例：XXX企業有限公司"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Banner Tab */}
            {activeTab === 'banner' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">橫幅設定</h3>
                  <p className="text-gray-600">上傳和管理網站頁首橫幅圖片。</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
                    <Image className="mr-1 h-4 w-4" />頁首橫幅圖片
                  </label>
                  <div className="space-y-4">
                    {config.headerBanner ? (
                      <div className="relative">
                        <img 
                          src={config.headerBanner} 
                          alt="Header Banner" 
                          className="w-full h-48 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={handleBannerRemove}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-md"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 cursor-pointer ${
                          dragOver 
                            ? 'border-blue-500 bg-blue-50' 
                            : uploading 
                              ? 'border-gray-300 bg-gray-50' 
                              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => {
                          if (!uploading) {
                            const fileInput = document.getElementById('bannerFileInput') as HTMLInputElement;
                            fileInput?.click();
                          }
                        }}
                      >
                        {uploading ? (
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-sm text-blue-600 font-medium">上傳中...</p>
                          </div>
                        ) : dragOver ? (
                          <div className="flex flex-col items-center">
                            <Upload className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                            <p className="text-lg text-blue-600 font-medium mb-2">放開以上傳圖片</p>
                            <p className="text-sm text-blue-400">支援 JPG、PNG、GIF 格式，檔案大小限制 5MB</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-lg text-gray-600 font-medium mb-2">拖曳圖片到此處或點擊選擇</p>
                            <p className="text-sm text-gray-400">支援 JPG、PNG、GIF 格式，檔案大小限制 5MB</p>
                          </div>
                        )}
                      </div>
                    )}
                    <input
                      id="bannerFileInput"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={handleBannerUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Tab */}
            {activeTab === 'payment' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">匯款設定</h3>
                  <p className="text-gray-600">設定報名費用匯款帳戶資訊。</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">銀行名稱</label>
                    <input
                      type="text"
                      value={config.bankName}
                      onChange={(e) => handleInputChange('bankName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="例：台灣銀行"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">銀行帳號</label>
                    <input
                      type="text"
                      value={config.bankAccount}
                      onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="例：123-456-789012"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2">戶名</label>
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
            )}

            {/* Email Tab */}
            {activeTab === 'email' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">SMTP 郵件設定</h3>
                  <p className="text-gray-600">設定郵件伺服器資訊，用於發送註冊確認信和忘記密碼信件。</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">SMTP 伺服器</label>
                    <input
                      type="text"
                      value={config.smtpHost}
                      onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="例：smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">SMTP 連接埠</label>
                    <input
                      type="number"
                      value={config.smtpPort}
                      onChange={(e) => handleInputChange('smtpPort', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="587"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">SMTP 使用者名稱</label>
                    <input
                      type="text"
                      value={config.smtpUser}
                      onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">SMTP 密碼</label>
                    <input
                      type="password"
                      value={config.smtpPassword}
                      onChange={(e) => handleInputChange('smtpPassword', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="應用程式密碼"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">寄件人名稱</label>
                    <input
                      type="text"
                      value={config.smtpFromName}
                      onChange={(e) => handleInputChange('smtpFromName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="柔術賽事系統"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">寄件人信箱</label>
                    <input
                      type="email"
                      value={config.smtpFromEmail}
                      onChange={(e) => handleInputChange('smtpFromEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                      placeholder="noreply@competition.com"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 儲存按鈕 */}
          <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end">
              <button
                onClick={saveConfig}
                disabled={saving}
                className="flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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