'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Calendar, Phone, Mail, Weight, Award, Upload, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { determineAgeGroup, determineMasterCategory } from '@/lib/utils';
import { BELT_LEVELS } from '@/lib/types';
import FileUpload from './FileUpload';

const athleteSchema = z.object({
  name: z.string().min(1, '姓名必填'),
  nationalId: z.string().regex(/^[A-Z][12]\d{8}$/, '請輸入正確的身份證字號格式'),
  gender: z.enum(['M', 'F']),
  birthDate: z.string().min(1, '出生日期必填'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  emergencyContactName: z.string().min(1, '緊急聯絡人姓名必填'),
  emergencyContactPhone: z.string().min(1, '緊急聯絡人電話必填'),
  emergencyContactRelation: z.string().min(1, '與緊急聯絡人之關係必填'),
  belt: z.enum(['white', 'blue', 'purple', 'brown', 'black']),
  weight: z.string().transform(val => parseFloat(val)).pipe(z.number().positive('體重必須大於0')),
  coachName: z.string().min(1, '教練姓名必填'),
  coachCertificate: z.string().optional(),
  photo: z.string().optional(),
  consentForm: z.string().optional(),
  consentAgreement: z.boolean().refine(val => val === true, '必須同意選手保證暨個人資料與肖像授權同意書')
});

type AthleteForm = z.infer<typeof athleteSchema>;

interface Props {
  unitId: string | null;
  onAthleteRegistered: () => void;
}

export default function AthleteRegistration({ unitId, onAthleteRegistered }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [editingAthleteId, setEditingAthleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [ageInfo, setAgeInfo] = useState<{ ageGroup: string; masterCategory: string | null } | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{
    photo?: { file: File; filename?: string; url?: string };
    coachCertificate?: { file: File; filename?: string; url?: string };
    consentForm?: { file: File; filename?: string; url?: string };
  }>({});

  const form = useForm<AthleteForm>({
    resolver: zodResolver(athleteSchema),
    defaultValues: {
      gender: 'M',
      belt: 'white',
      consentAgreement: false
    }
  });

  useEffect(() => {
    if (unitId) {
      fetchAthletes();
    }
  }, [unitId]);

  // 如果沒有選手且未顯示表單，自動顯示表單
  useEffect(() => {
    if (athletes.length === 0 && !showForm) {
      setShowForm(true);
    }
  }, [athletes.length, showForm]);

  const fetchAthletes = async () => {
    if (!unitId) return;
    
    try {
      const response = await fetch(`/api/athletes?unitId=${unitId}`);
      const result = await response.json();
      if (result.success) {
        setAthletes(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch athletes:', err);
    }
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const birthDate = new Date(e.target.value);
    const ageGroup = determineAgeGroup(birthDate);
    const masterCategory = determineMasterCategory(birthDate);
    setAgeInfo({ ageGroup, masterCategory });
  };

  const handleAddAthlete = () => {
    setShowForm(true);
    setEditingAthleteId(null);
    form.reset();
    setAgeInfo(null);
    setUploadedFiles({});
  };

  const handleEditAthlete = (athlete: any) => {
    setShowForm(true);
    setEditingAthleteId(athlete.id);
    
    // 填入表單資料
    form.reset({
      name: athlete.name,
      nationalId: athlete.nationalId,
      gender: athlete.gender,
      birthDate: athlete.birthDate.split('T')[0], // 轉換日期格式
      phone: athlete.phone || '',
      email: athlete.email || '',
      emergencyContactName: athlete.emergencyContactName || '',
      emergencyContactPhone: athlete.emergencyContactPhone || '',
      emergencyContactRelation: athlete.emergencyContactRelation || '',
      belt: athlete.belt,
      weight: athlete.weight.toString(),
      coachName: athlete.coachName || '',
      consentAgreement: true // 編輯時默認已同意
    });

    // 設定年齡資訊
    const birthDate = new Date(athlete.birthDate);
    const ageGroup = determineAgeGroup(birthDate);
    const masterCategory = determineMasterCategory(birthDate);
    setAgeInfo({ ageGroup, masterCategory });

    // 滾動到表單區域
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAthlete = async (athleteId: string) => {
    if (!confirm('確定要刪除此選手嗎？此操作無法撤銷。')) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/athletes?id=${athleteId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '刪除失敗');
      }

      // 重新載入選手列表
      fetchAthletes();
      
      // 如果正在編輯被刪除的選手，清除編輯狀態
      if (editingAthleteId === athleteId) {
        setShowForm(false);
        setEditingAthleteId(null);
        form.reset();
        setAgeInfo(null);
        setUploadedFiles({});
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingAthleteId(null);
    form.reset();
    setAgeInfo(null);
    setUploadedFiles({});
  };

  const handleSubmit = async (data: AthleteForm) => {
    if (!unitId) {
      setError('請先註冊單位');
      return;
    }

    // 檢查必要檔案是否已上傳 (新增時) 或編輯時有新上傳的照片或保留原有照片
    const currentAthlete = editingAthleteId ? athletes.find(a => a.id === editingAthleteId) : null;
    const hasPhoto = uploadedFiles.photo || (editingAthleteId && currentAthlete?.photo && uploadedFiles.photo !== null);
    
    if (!hasPhoto) {
      setError('請上傳選手大頭照');
      return;
    }

    if (!uploadedFiles.coachCertificate) {
      setError('請上傳教練證');
      return;
    }

    // 移除紙本同意書的必填檢查，因為現在有線上同意checkbox

    setLoading(true);
    setError(null);
    
    try {
      const isEditing = editingAthleteId !== null;
      const url = isEditing ? `/api/athletes?id=${editingAthleteId}` : '/api/athletes';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          unitId,
          // 照片處理：新上傳的檔案名稱，或刪除標記，或保持原有
          photo: uploadedFiles.photo?.filename || (uploadedFiles.photo === null ? null : undefined),
          coachCertificate: uploadedFiles.coachCertificate?.filename,
          consentForm: uploadedFiles.consentForm?.filename
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || (isEditing ? '選手更新失敗' : '選手註冊失敗'));
      }

      form.reset({
        name: '',
        nationalId: '',
        gender: 'M',
        birthDate: '',
        phone: '',
        email: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
        belt: 'white',
        weight: '',
        coachName: '',
        consentAgreement: false
      });
      setUploadedFiles({});
      setEditingAthleteId(null);
      setAgeInfo(null);
      setShowForm(false);
      fetchAthletes();
      
      if (!isEditing) {
        onAthleteRegistered();
      }
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
        <p className="text-gray-600">請先完成單位註冊</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 選手列表視圖 */}
      {!showForm && athletes.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              已註冊選手 ({athletes.length} 位)
            </h2>
            <button
              onClick={handleAddAthlete}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              註冊選手
            </button>
          </div>
          
          <div className="grid gap-4">
            {athletes.map((athlete, index) => (
              <div key={athlete.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      {/* 選手照片 */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {athlete.photo ? (
                          <img 
                            src={`/uploads/${athlete.photo}`}
                            alt={`${athlete.name}的照片`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="text-lg font-semibold text-gray-900 mb-1">
                          {index + 1}. {athlete.name}
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>{athlete.gender === 'M' ? '男' : '女'}</span>
                          <span>{athlete.weight}kg</span>
                          <span>
                            {athlete.belt === 'white' ? '白帶' :
                             athlete.belt === 'blue' ? '藍帶' :
                             athlete.belt === 'purple' ? '紫帶' :
                             athlete.belt === 'brown' ? '棕帶' : '黑帶'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          出生日期：{new Date(athlete.birthDate).toLocaleDateString('zh-TW')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditAthlete(athlete)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="編輯選手資料"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAthlete(athlete.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="刪除選手"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {athletes.length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={onAthleteRegistered}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                繼續報名項目
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* 表單視圖 */}
      {showForm && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingAthleteId ? '編輯選手資料' : '選手註冊'}
            </h2>
            
            {athletes.length > 0 && (
              <button
                onClick={handleCancelEdit}
                className="text-gray-600 hover:text-gray-800 underline"
              >
                返回選手列表
              </button>
            )}
          </div>
          
          {editingAthleteId && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-yellow-800">
                  正在編輯選手資料，修改完成後請點擊「更新選手資料」
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  姓名 *
                </label>
                <input
                  {...form.register('name')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                  placeholder="請輸入選手姓名"
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  身份證字號 *
                </label>
                <input
                  {...form.register('nationalId')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                  placeholder="請輸入身份證字號 (例：A123456789)"
                  maxLength={10}
                />
                {form.formState.errors.nationalId && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.nationalId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  性別 *
                </label>
                <select
                  {...form.register('gender')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                >
                  <option value="M">男</option>
                  <option value="F">女</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  出生日期 *
                </label>
                <input
                  type="date"
                  {...form.register('birthDate')}
                  onChange={(e) => {
                    form.register('birthDate').onChange(e);
                    handleBirthDateChange(e);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                />
                {form.formState.errors.birthDate && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.birthDate.message}</p>
                )}
                {ageInfo && (
                  <p className="mt-1 text-sm text-gray-900 font-medium">
                    組別：{ageInfo.ageGroup === 'adult' ? '成人組' : 
                          ageInfo.ageGroup === 'youth' ? '青年組' :
                          ageInfo.ageGroup === 'junior' ? '青少年組' :
                          ageInfo.ageGroup === 'child' ? '兒童組' : '大師組'}
                    {ageInfo.masterCategory && ` (${ageInfo.masterCategory})`}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  <Weight className="inline h-4 w-4 mr-1" />
                  體重 (公斤) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...form.register('weight')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                  placeholder="例：65.5"
                />
                {form.formState.errors.weight && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.weight.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  <Phone className="inline h-4 w-4 mr-1" />
                  聯絡電話
                </label>
                <input
                  {...form.register('phone')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                  placeholder="09XXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  電子郵件
                </label>
                <input
                  type="email"
                  {...form.register('email')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  緊急聯絡人姓名 *
                </label>
                <input
                  {...form.register('emergencyContactName')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                  placeholder="請輸入緊急聯絡人姓名"
                />
                {form.formState.errors.emergencyContactName && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.emergencyContactName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  緊急聯絡人電話 *
                </label>
                <input
                  {...form.register('emergencyContactPhone')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                  placeholder="09XXXXXXXX"
                />
                {form.formState.errors.emergencyContactPhone && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.emergencyContactPhone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  與緊急聯絡人之關係 *
                </label>
                <input
                  {...form.register('emergencyContactRelation')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                  placeholder="例：父母、配偶、兄弟姊妹"
                />
                {form.formState.errors.emergencyContactRelation && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.emergencyContactRelation.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  <Award className="inline h-4 w-4 mr-1" />
                  段位 *
                </label>
                <select
                  {...form.register('belt')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                >
                  {Object.entries(BELT_LEVELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  教練姓名 *
                </label>
                <input
                  {...form.register('coachName')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                  placeholder="請輸入教練姓名"
                />
                {form.formState.errors.coachName && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.coachName.message}</p>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">文件上傳</h3>
              
              {/* 檔案上傳狀態提示 */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-800 font-medium mb-2">上傳狀態：</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className={`px-2 py-1 rounded font-medium ${uploadedFiles.photo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    選手大頭照 {uploadedFiles.photo ? '✓' : '✗'}
                  </span>
                  <span className={`px-2 py-1 rounded font-medium ${uploadedFiles.coachCertificate ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    教練證 {uploadedFiles.coachCertificate ? '✓' : '✗'}
                  </span>
                  <span className={`px-2 py-1 rounded font-medium ${uploadedFiles.consentForm ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-800'}`}>
                    個人資料授權同意書 {uploadedFiles.consentForm ? '✓' : '(可選)'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      選手大頭照 *
                    </label>
                    
                    {/* 顯示現有照片縮圖 (編輯時) */}
                    {editingAthleteId && athletes.find(a => a.id === editingAthleteId)?.photo && !uploadedFiles.photo && (
                      <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-700 mb-2">目前上傳的照片：</p>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img 
                              src={`/uploads/${athletes.find(a => a.id === editingAthleteId)?.photo}`}
                              alt="選手照片"
                              className="w-20 h-20 object-cover rounded-lg border"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm('確定要刪除此照片嗎？刪除後需要重新上傳新照片。')) {
                                try {
                                  setLoading(true);
                                  setError(null);
                                  
                                  const currentAthlete = athletes.find(a => a.id === editingAthleteId);
                                  if (currentAthlete?.photo) {
                                    const response = await fetch(`/api/delete-file?filename=${currentAthlete.photo}&athleteId=${editingAthleteId}&type=photo`, {
                                      method: 'DELETE'
                                    });
                                    
                                    const result = await response.json();
                                    
                                    if (!response.ok) {
                                      throw new Error(result.error || '刪除照片失敗');
                                    }
                                    
                                    // 成功刪除後，更新前端狀態並重新載入選手列表
                                    setUploadedFiles(prev => ({ ...prev, photo: null as any }));
                                    fetchAthletes();
                                  }
                                } catch (err: any) {
                                  setError(err.message);
                                } finally {
                                  setLoading(false);
                                }
                              }
                            }}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            disabled={loading}
                          >
                            {loading ? '刪除中...' : '刪除照片'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          如需更換照片，請先刪除現有照片，然後上傳新照片
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* 只有在新增或刪除現有照片後才顯示上傳組件 */}
                  {(!editingAthleteId || !athletes.find(a => a.id === editingAthleteId)?.photo || uploadedFiles.photo === null) && (
                    <FileUpload
                      label={editingAthleteId ? "上傳新的選手大頭照 *" : "選手大頭照 *"}
                      description="請上傳選手大頭照，支援拖曳或拍照上傳 (限制：1個檔案，最大10MB)"
                      accept="image/*"
                      maxSize={10 * 1024 * 1024}
                      allowCamera={true}
                      fileType="photo"
                      onFileSelect={(file, uploadedInfo) => {
                        setUploadedFiles(prev => ({ 
                          ...prev, 
                          photo: { 
                            file, 
                            filename: uploadedInfo?.filename, 
                            url: uploadedInfo?.url 
                          } 
                        }));
                        setError(null);
                      }}
                    />
                  )}
                </div>

                <FileUpload
                  label="教練證 *"
                  description="請上傳教練證明文件 (限制：1個檔案，最大10MB)"
                  accept="image/*,application/pdf"
                  maxSize={10 * 1024 * 1024}
                  allowCamera={true}
                  fileType="coachCertificate"
                  onFileSelect={(file, uploadedInfo) => {
                    setUploadedFiles(prev => ({ 
                      ...prev, 
                      coachCertificate: { 
                        file, 
                        filename: uploadedInfo?.filename, 
                        url: uploadedInfo?.url 
                      } 
                    }));
                    setError(null);
                  }}
                />

                <FileUpload
                  label="選手保證暨個人資料授權同意書 (可選)"
                  description="可額外上傳簽名的紙本同意書 (限制：1個檔案，最大10MB)"
                  accept="image/*,application/pdf"
                  maxSize={10 * 1024 * 1024}
                  allowCamera={true}
                  fileType="consentForm"
                  onFileSelect={(file, uploadedInfo) => {
                    setUploadedFiles(prev => ({ 
                      ...prev, 
                      consentForm: { 
                        file, 
                        filename: uploadedInfo?.filename, 
                        url: uploadedInfo?.url 
                      } 
                    }));
                    setError(null);
                  }}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">同意聲明</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">選手保證暨個人資料與肖像授權同意書</h4>
                  
                  <div className="text-sm text-gray-900 space-y-2 mb-4">
                    <p className="font-semibold">本人保證：</p>
                    <ul className="list-disc list-inside ml-4 space-y-1 font-medium">
                      <li>身體健康，適合參加柔術比賽</li>
                      <li>遵守比賽規則及主辦單位相關規定</li>
                      <li>自行負責比賽期間之人身安全</li>
                      <li>同意主辦單位使用本人肖像於活動宣傳</li>
                      <li>同意個人資料用於比賽相關用途</li>
                    </ul>
                    <p className="mt-3 text-gray-800 font-medium">
                      <strong className="text-red-700">注意：</strong>未滿18歲選手需由監護人代為簽名同意。可選擇性上傳紙本簽名版本。
                    </p>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="consentAgreement"
                      {...form.register('consentAgreement')}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label 
                      htmlFor="consentAgreement" 
                      className="text-sm font-semibold text-gray-900 cursor-pointer"
                    >
                      我已詳細閱讀並完全同意上述「選手保證暨個人資料與肖像授權同意書」之所有條款 *
                    </label>
                  </div>
                  
                  {form.formState.errors.consentAgreement && (
                    <p className="mt-2 text-sm text-red-600">
                      {form.formState.errors.consentAgreement.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (editingAthleteId ? '更新中...' : '註冊中...') : (editingAthleteId ? '更新選手資料' : '註冊選手')}
              </button>
              
              {athletes.length > 0 && (
                <button
                  type="button"
                  onClick={onAthleteRegistered}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  繼續報名項目
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}