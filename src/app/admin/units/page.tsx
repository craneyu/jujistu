'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Search,
  Building2,
  Users,
  Trophy,
  DollarSign,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface Unit {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
  createdAt: string;
  athletes: {
    id: string;
    name: string;
    gender: string;
    belt: string;
  }[];
  payments: {
    id: string;
    totalAmount: number;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
  }[];
  _count: {
    athletes: number;
  };
}

export default function UnitsManagement() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchUnits();
  }, [router]);

  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/units', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnits(data);
      }
    } catch (error) {
      console.error('Failed to fetch units:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = units.filter(unit => 
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'paid':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待繳費';
      case 'paid':
        return '待確認';
      case 'confirmed':
        return '已確認';
      default:
        return '未知';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-gray-600 bg-gray-100';
      case 'paid':
        return 'text-yellow-700 bg-yellow-100';
      case 'confirmed':
        return 'text-green-700 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
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
                <h1 className="text-2xl font-bold text-gray-900">單位管理</h1>
                <p className="text-gray-600">管理所有報名單位資訊</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              總計 {filteredUnits.length} 個單位
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="搜尋單位名稱、聯絡人或Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Units Grid */}
        <div className="grid gap-6">
          {filteredUnits.map((unit) => (
            <div key={unit.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-xl">{unit.name}</h3>
                      <p className="text-sm text-gray-600">
                        註冊時間: {new Date(unit.createdAt).toLocaleDateString('zh-TW')}
                      </p>
                    </div>
                  </div>

                  {/* Payment Status */}
                  {unit.payments && unit.payments.length > 0 && (
                    <div className="flex items-center gap-2">
                      {getPaymentStatusIcon(unit.payments[0].paymentStatus)}
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(unit.payments[0].paymentStatus)}`}>
                        {getPaymentStatusText(unit.payments[0].paymentStatus)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Contact Information */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                      <User className="h-4 w-4" />
                      聯絡資訊
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">聯絡人:</span>
                        <span className="text-gray-900">{unit.contactName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">電話:</span>
                        <span className="text-gray-900">{unit.phone}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Email:</span>
                        <span className="text-gray-900 break-all">{unit.email}</span>
                      </div>

                      {unit.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <span className="text-sm font-medium text-gray-700">地址:</span>
                            <p className="text-gray-900">{unit.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                      <Trophy className="h-4 w-4" />
                      統計資訊
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-700">註冊選手:</span>
                        </div>
                        <span className="font-semibold text-blue-600">{unit._count.athletes}</span>
                      </div>
                      

                      {unit.payments && unit.payments.length > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-gray-700">報名費用:</span>
                          </div>
                          <span className="font-semibold text-green-600">
                            NT$ {unit.payments[0].totalAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Athletes List */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                      <Users className="h-4 w-4" />
                      註冊選手 ({unit.athletes.length})
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                      {unit.athletes.length > 0 ? (
                        <div className="space-y-2">
                          {unit.athletes.map((athlete) => (
                            <div key={athlete.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div>
                                <span className="font-medium text-gray-900">{athlete.name}</span>
                                <span className="ml-2 text-sm text-gray-600">
                                  ({athlete.gender === 'M' ? '男' : '女'})
                                </span>
                              </div>
                              <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                                {athlete.belt === 'white' ? '白帶' :
                                 athlete.belt === 'blue' ? '藍帶' :
                                 athlete.belt === 'purple' ? '紫帶' :
                                 athlete.belt === 'brown' ? '棕帶' :
                                 athlete.belt === 'black' ? '黑帶' : athlete.belt}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          尚無註冊選手
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                {unit.payments && unit.payments.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-2 text-gray-900 font-medium mb-3">
                      <DollarSign className="h-4 w-4" />
                      繳費資訊
                    </div>
                    
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">建立時間:</span>
                          <p className="text-gray-900">{new Date(unit.payments[0].createdAt).toLocaleDateString('zh-TW')}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">最後更新:</span>
                          <p className="text-gray-900">{new Date(unit.payments[0].updatedAt).toLocaleDateString('zh-TW')}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">繳費狀態:</span>
                          <div className="flex items-center gap-1 mt-1">
                            {getPaymentStatusIcon(unit.payments[0].paymentStatus)}
                            <span>{getPaymentStatusText(unit.payments[0].paymentStatus)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredUnits.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500">沒有找到符合條件的單位記錄</div>
          </div>
        )}
      </div>
    </div>
  );
}