'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Search,
  Filter,
  User,
  Building2,
  Trophy,
  Calendar,
  Weight,
  Ruler,
  Medal,
  Users,
  Phone,
  UserCheck,
  AlertCircle,
  FileText,
  Image,
  Eye,
  ExternalLink,
  Trash2
} from 'lucide-react';

interface Athlete {
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
  photo?: string;
  coachCertificate?: string;
  consentForm?: string;
  createdAt: string;
  unit: {
    id: string;
    name: string;
    contactName: string;
    email: string;
    phone: string;
    address?: string;
  };
  registrations: {
    id: string;
    eventType: string;
    weightClass: string;
    genderDivision?: string;
  }[];
  _count: {
    registrations: number;
  };
}

export default function AthletesManagement() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [beltFilter, setBeltFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const router = useRouter();

  // Get unique units for filter
  const uniqueUnits = Array.from(
    new Set(athletes.map(athlete => athlete.unit.name))
  ).sort();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchAthletes();
  }, [router]);

  const fetchAthletes = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/athletes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAthletes(data);
      }
    } catch (error) {
      console.error('Failed to fetch athletes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = 
      athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.coachName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGender = genderFilter === 'all' || athlete.gender === genderFilter;
    const matchesBelt = beltFilter === 'all' || athlete.belt === beltFilter;
    const matchesUnit = unitFilter === 'all' || athlete.unit.name === unitFilter;
    
    return matchesSearch && matchesGender && matchesBelt && matchesUnit;
  });

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

  const getBeltColor = (belt: string) => {
    switch (belt) {
      case 'white': return 'bg-gray-100 text-gray-700';
      case 'blue': return 'bg-blue-100 text-blue-700';
      case 'purple': return 'bg-purple-100 text-purple-700';
      case 'brown': return 'bg-orange-100 text-orange-700';
      case 'black': return 'bg-gray-800 text-white';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleDeleteFile = async (athleteId: string, filename: string, fileType: string) => {
    if (!confirm('確定要刪除此檔案嗎？此操作無法撤銷。')) {
      return;
    }

    setDeletingFile(`${athleteId}-${fileType}`);
    
    try {
      const response = await fetch(`/api/delete-file?filename=${filename}&athleteId=${athleteId}&type=${fileType}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '刪除檔案失敗');
      }
      
      // 重新載入選手資料
      fetchAthletes();
      
      // 如果正在查看這個選手，更新詳情
      if (selectedAthlete?.id === athleteId) {
        const updatedAthlete = { ...selectedAthlete };
        (updatedAthlete as any)[fileType] = null;
        setSelectedAthlete(updatedAthlete);
      }
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingFile(null);
    }
  };

  const getEventTypeText = (eventType: string) => {
    switch (eventType) {
      case 'fighting': return '對打組';
      case 'newaza': return '寢技組'; 
      case 'fullcontact': return '格鬥組';
      case 'duo_traditional': return '雙人傳統演武';
      case 'duo_creative': return '雙人創意演武';
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

  const getAge = (birthDate: string) => {
    return new Date().getFullYear() - new Date(birthDate).getFullYear();
  };

  // 計算正確的量級或分組
  const getDisplayCategory = (registration: any, athlete: any) => {
    const isDuoEvent = registration.eventType === 'duo_creative' || registration.eventType === 'duo_traditional';
    
    if (isDuoEvent) {
      // 演武項目：顯示性別分組
      if (registration.genderDivision === 'men') return '男子組';
      if (registration.genderDivision === 'women') return '女子組';
      return '男女混合組';
    } else {
      // 其他項目：計算量級
      return calculateWeightClass(athlete.weight, registration.eventType, athlete.ageGroup, athlete.gender);
    }
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
        if (weight <= 28) return '-28';
        if (weight <= 30) return '-30';
        if (weight <= 32) return '-32';
        if (weight <= 34) return '-34';
        if (weight <= 36) return '-36';
        if (weight <= 38) return '-38';
        return '+38';
      }
    }
    
    return 'all';
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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">選手管理</h1>
                <p className="text-gray-600">管理所有註冊選手資訊</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              總計 {filteredAthletes.length} 名選手
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">所有性別</option>
                  <option value="M">男性</option>
                  <option value="F">女性</option>
                </select>
              </div>

              <select
                value={beltFilter}
                onChange={(e) => setBeltFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有段帶</option>
                <option value="white">白帶</option>
                <option value="blue">藍帶</option>
                <option value="purple">紫帶</option>
                <option value="brown">棕帶</option>
                <option value="black">黑帶</option>
              </select>

              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有單位</option>
                {uniqueUnits.map(unitName => (
                  <option key={unitName} value={unitName}>{unitName}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-1 xl:flex-initial xl:min-w-64">
              <Search className="h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="搜尋選手姓名、單位或教練..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 xl:w-64 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Athletes Table */}
        <div className="flex gap-6">
          {/* Main Table */}
          <div className={`transition-all ${selectedAthlete ? 'w-2/3' : 'w-full'}`}>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                        選手姓名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                        所屬單位
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                        報名項目數量
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                        註冊日期
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAthletes.map((athlete) => (
                      <tr 
                        key={athlete.id} 
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedAthlete?.id === athlete.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {athlete.photo ? (
                              <img 
                                src={`/uploads/${athlete.photo}`} 
                                alt={athlete.name}
                                className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-blue-100"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full mr-3 bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{athlete.name}</div>
                              <div className="text-sm text-gray-600">
                                {athlete.gender === 'M' ? '男性' : '女性'} · {getAge(athlete.birthDate)} 歲
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{athlete.unit.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {athlete._count.registrations} 項
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(athlete.createdAt).toLocaleDateString('zh-TW')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedAthlete(selectedAthlete?.id === athlete.id ? null : athlete)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            {selectedAthlete?.id === athlete.id ? '關閉詳情' : '查看詳情'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Athlete Detail Sidebar */}
          {selectedAthlete && (
            <div className="w-1/3">
              <div className="bg-white rounded-lg shadow-sm border sticky top-4">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">選手詳情</h3>
                    <button
                      onClick={() => setSelectedAthlete(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <AlertCircle className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Athlete Photo */}
                    <div className="text-center">
                      {selectedAthlete.photo ? (
                        <img 
                          src={`/uploads/${selectedAthlete.photo}`} 
                          alt={selectedAthlete.name}
                          className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-blue-100"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full mx-auto bg-gray-200 flex items-center justify-center">
                          <User className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <h4 className="mt-3 font-bold text-gray-900">{selectedAthlete.name}</h4>
                    </div>

                    {/* Basic Info */}
                    <div>
                      <div className="flex items-center gap-2 text-gray-900 font-medium mb-3">
                        <User className="h-4 w-4" />
                        基本資訊
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                        <div><span className="font-semibold text-gray-800">性別:</span> <span className="text-gray-900 font-medium">{selectedAthlete.gender === 'M' ? '男性' : '女性'}</span></div>
                        <div><span className="font-semibold text-gray-800">年齡:</span> <span className="text-gray-900 font-medium">{getAge(selectedAthlete.birthDate)} 歲</span></div>
                        <div><span className="font-semibold text-gray-800">體重:</span> <span className="text-gray-900 font-medium">{selectedAthlete.weight} kg</span></div>
                        <div><span className="font-semibold text-gray-800">段帶:</span> <span className="text-gray-900 font-medium">{getBeltText(selectedAthlete.belt)}</span></div>
                        <div><span className="font-semibold text-gray-800">教練:</span> <span className="text-gray-900 font-medium">{selectedAthlete.coachName}</span></div>
                      </div>
                    </div>

                    {/* Registrations */}
                    {selectedAthlete.registrations.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-gray-900 font-medium mb-3">
                          <Trophy className="h-4 w-4" />
                          報名項目 ({selectedAthlete.registrations.length})
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                          <div className="space-y-2">
                            {selectedAthlete.registrations.map((reg) => (
                              <div key={reg.id} className="bg-white rounded border p-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900 text-sm">
                                    {getEventTypeText(reg.eventType)}
                                  </span>
                                  <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                                    {getDisplayCategory(reg, selectedAthlete)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Unit Info */}
                    <div>
                      <div className="flex items-center gap-2 text-gray-900 font-medium mb-3">
                        <Building2 className="h-4 w-4" />
                        所屬單位
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                        <div><span className="font-semibold text-gray-800">單位:</span> <span className="text-gray-900 font-medium">{selectedAthlete.unit.name}</span></div>
                        <div><span className="font-semibold text-gray-800">聯絡人:</span> <span className="text-gray-900 font-medium">{selectedAthlete.unit.contactName}</span></div>
                        <div><span className="font-semibold text-gray-800">電話:</span> <span className="text-gray-900 font-medium">{selectedAthlete.unit.phone}</span></div>
                        <div><span className="font-semibold text-gray-800">Email:</span> <span className="text-gray-900 font-medium break-all">{selectedAthlete.unit.email}</span></div>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <div className="flex items-center gap-2 text-gray-900 font-medium mb-3">
                        <Phone className="h-4 w-4" />
                        緊急聯絡人
                      </div>
                      <div className="bg-red-50 rounded-lg p-4 space-y-2 text-sm">
                        <div><span className="font-semibold text-gray-800">姓名:</span> <span className="text-gray-900 font-medium">{selectedAthlete.emergencyContactName}</span></div>
                        <div><span className="font-semibold text-gray-800">電話:</span> <span className="text-gray-900 font-medium">{selectedAthlete.emergencyContactPhone}</span></div>
                        <div><span className="font-semibold text-gray-800">關係:</span> <span className="text-gray-900 font-medium">{selectedAthlete.emergencyContactRelation}</span></div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div>
                      <div className="flex items-center gap-2 text-gray-900 font-medium mb-3">
                        <FileText className="h-4 w-4" />
                        上傳文件
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {/* Athlete Photo */}
                        <div className="flex items-center justify-between p-3 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <Image className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">選手大頭照</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedAthlete.photo ? (
                              <>
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">已上傳</span>
                                <button
                                  onClick={() => window.open(`/uploads/${selectedAthlete.photo}`, '_blank')}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  title="查看照片"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFile(selectedAthlete.id, selectedAthlete.photo!, 'photo')}
                                  disabled={deletingFile === `${selectedAthlete.id}-photo`}
                                  className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                  title="刪除照片"
                                >
                                  {deletingFile === `${selectedAthlete.id}-photo` ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">未上傳</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Coach Certificate */}
                        <div className="flex items-center justify-between p-3 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-gray-900">教練證</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedAthlete.coachCertificate ? (
                              <>
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">已上傳</span>
                                <button
                                  onClick={() => window.open(`/uploads/${selectedAthlete.coachCertificate}`, '_blank')}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  title="查看教練證"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFile(selectedAthlete.id, selectedAthlete.coachCertificate!, 'coachCertificate')}
                                  disabled={deletingFile === `${selectedAthlete.id}-coachCertificate`}
                                  className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                  title="刪除教練證"
                                >
                                  {deletingFile === `${selectedAthlete.id}-coachCertificate` ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">未上傳</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Consent Form */}
                        <div className="flex items-center justify-between p-3 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-900">個人資料授權同意書</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedAthlete.consentForm ? (
                              <>
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">已上傳</span>
                                <button
                                  onClick={() => window.open(`/uploads/${selectedAthlete.consentForm}`, '_blank')}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  title="查看同意書"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFile(selectedAthlete.id, selectedAthlete.consentForm!, 'consentForm')}
                                  disabled={deletingFile === `${selectedAthlete.id}-consentForm`}
                                  className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                  title="刪除同意書"
                                >
                                  {deletingFile === `${selectedAthlete.id}-consentForm` ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">未上傳</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {filteredAthletes.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500">沒有找到符合條件的選手記錄</div>
          </div>
        )}
      </div>
    </div>
  );
}