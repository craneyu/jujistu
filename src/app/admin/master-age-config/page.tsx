'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Settings, AlertCircle, RefreshCw, Users } from 'lucide-react';

interface AgeRanges {
  m1MinAge: number;
  m1MaxAge: number;
  m2MinAge: number;
  m2MaxAge: number;
  m3MinAge: number;
}

export default function MasterAgeConfigPage() {
  const router = useRouter();
  const [ageRanges, setAgeRanges] = useState<AgeRanges>({
    m1MinAge: 35,
    m1MaxAge: 39,
    m2MinAge: 40,
    m2MaxAge: 44,
    m3MinAge: 45,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recalcStats, setRecalcStats] = useState<any>(null);

  useEffect(() => {
    fetchAgeRanges();
  }, []);

  const fetchAgeRanges = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/master-age-config');
      const result = await response.json();
      
      if (result.success) {
        setAgeRanges(result.data);
      } else {
        setError('載入年齡設定失敗');
      }
    } catch (err) {
      console.error('載入年齡設定失敗:', err);
      setError('載入年齡設定失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/master-age-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ageRanges)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('年齡設定已成功更新');
      } else {
        setError(result.error || '更新失敗');
      }
    } catch (err: any) {
      setError(err.message || '更新失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    setError(null);
    setSuccess(null);
    setRecalcStats(null);
    
    try {
      const response = await fetch('/api/recalculate-master-categories', {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('所有選手的大師組分類已重新計算完成');
        setRecalcStats(result.stats);
      } else {
        setError(result.error || '重新計算失敗');
      }
    } catch (err: any) {
      setError(err.message || '重新計算失敗');
    } finally {
      setRecalculating(false);
    }
  };

  const handleInputChange = (key: keyof AgeRanges, value: number) => {
    setAgeRanges(prev => ({
      ...prev,
      [key]: value
    }));
    setError(null);
    setSuccess(null);
  };

  const validateRanges = () => {
    const errors: string[] = [];
    
    if (ageRanges.m1MinAge >= ageRanges.m1MaxAge) {
      errors.push('M1最小年齡必須小於最大年齡');
    }
    if (ageRanges.m2MinAge >= ageRanges.m2MaxAge) {
      errors.push('M2最小年齡必須小於最大年齡');
    }
    if (ageRanges.m1MaxAge >= ageRanges.m2MinAge) {
      errors.push('M1最大年齡必須小於M2最小年齡');
    }
    if (ageRanges.m2MaxAge >= ageRanges.m3MinAge) {
      errors.push('M2最大年齡必須小於M3最小年齡');
    }
    
    return errors;
  };

  const validationErrors = validateRanges();
  const canSave = validationErrors.length === 0 && !saving;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Settings className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">載入設定中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* 標題列 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="回上一頁"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">大師組年齡設定</h1>
              <p className="text-gray-600 mt-1">設定M1、M2、M3各組的年齡範圍</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? '重新計算中...' : '重新計算分類'}
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? '儲存中...' : '儲存設定'}
            </button>
          </div>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* 成功訊息 */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {success}
          </div>
        )}

        {/* 驗證錯誤 */}
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">請修正以下問題：</span>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 設定表單 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="grid gap-8">
              
              {/* M1組設定 */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">M1組年齡範圍</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">最小年齡</label>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={ageRanges.m1MinAge}
                      onChange={(e) => handleInputChange('m1MinAge', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">最大年齡</label>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={ageRanges.m1MaxAge}
                      onChange={(e) => handleInputChange('m1MaxAge', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-3 text-sm text-blue-700">
                  <span className="font-medium">目前範圍：</span>{ageRanges.m1MinAge}歲 - {ageRanges.m1MaxAge}歲
                </div>
              </div>

              {/* M2組設定 */}
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">M2組年齡範圍</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">最小年齡</label>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={ageRanges.m2MinAge}
                      onChange={(e) => handleInputChange('m2MinAge', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">最大年齡</label>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={ageRanges.m2MaxAge}
                      onChange={(e) => handleInputChange('m2MaxAge', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                <div className="mt-3 text-sm text-green-700">
                  <span className="font-medium">目前範圍：</span>{ageRanges.m2MinAge}歲 - {ageRanges.m2MaxAge}歲
                </div>
              </div>

              {/* M3組設定 */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-4">M3組年齡範圍</h3>
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">最小年齡</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={ageRanges.m3MinAge}
                    onChange={(e) => handleInputChange('m3MinAge', parseInt(e.target.value) || 0)}
                    className="w-full max-w-xs px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <div className="mt-3 text-sm text-purple-700">
                    <span className="font-medium">目前範圍：</span>{ageRanges.m3MinAge}歲以上
                  </div>
                </div>
              </div>
            </div>

            {/* 說明 */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">設定說明：</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 年齡計算基準日：比賽當日（2025年10月26日）</li>
                <li>• M1、M2、M3組的年齡範圍不能重疊</li>
                <li>• 修改設定後，建議點擊「重新計算分類」來更新所有選手的組別</li>
                <li>• 設定會即時生效，影響新註冊的選手分組</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 統計信息 */}
        {recalcStats && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">重新計算統計</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{recalcStats.total}</div>
                <div className="text-xs text-gray-600">總選手數</div>
              </div>
              
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{recalcStats.child}</div>
                <div className="text-xs text-yellow-600">兒童組</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-700">{recalcStats.junior}</div>
                <div className="text-xs text-orange-600">青少年組</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{recalcStats.youth}</div>
                <div className="text-xs text-green-600">青年組</div>
              </div>
              
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{recalcStats.adult}</div>
                <div className="text-xs text-blue-600">成人組</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">{recalcStats.master}</div>
                <div className="text-xs text-purple-600">大師組</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">大師組詳細分佈：</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-700">{recalcStats.m1}</div>
                  <div className="text-xs text-blue-600">M1組 ({ageRanges.m1MinAge}-{ageRanges.m1MaxAge}歲)</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-700">{recalcStats.m2}</div>
                  <div className="text-xs text-green-600">M2組 ({ageRanges.m2MinAge}-{ageRanges.m2MaxAge}歲)</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-700">{recalcStats.m3}</div>
                  <div className="text-xs text-purple-600">M3組 ({ageRanges.m3MinAge}歲以上)</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}