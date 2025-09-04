'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompetitionConfig } from '@/hooks/useCompetitionConfig';
import { 
  Users, 
  Trophy, 
  DollarSign, 
  FileText, 
  LogOut,
  Building2,
  UserCheck,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';

interface DashboardStats {
  totalUnits: number;
  totalAthletes: number;
  totalRegistrations: number;
  totalRevenue: number;
  pendingPayments: number;
  confirmedPayments: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { config } = useCompetitionConfig();
  const router = useRouter();

  useEffect(() => {
    // 檢查管理者登入狀態
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          router.push('/admin');
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('無法載入儀表板資料');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">管理者後台</h1>
              <p className="text-gray-600">{config.competitionName}報名管理</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              登出
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">報名單位</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUnits || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">註冊選手</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalAthletes || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">報名項目</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalRegistrations || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">總收入</p>
                <p className="text-2xl font-bold text-gray-900">NT$ {stats?.totalRevenue?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-6 w-6 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">待確認繳費</h3>
            </div>
            <p className="text-3xl font-bold text-orange-600">{stats?.pendingPayments || 0}</p>
            <p className="text-sm text-gray-600 mt-1">需要審核的繳費單據</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">已確認繳費</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats?.confirmedPayments || 0}</p>
            <p className="text-sm text-gray-600 mt-1">已完成繳費確認</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <button 
              onClick={() => router.push('/admin/registrations')}
              className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-gray-900 font-medium">管理報名</span>
            </button>

            <button 
              onClick={() => router.push('/admin/payments')}
              className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-gray-900 font-medium">管理繳費</span>
            </button>

            <button 
              onClick={() => router.push('/admin/units')}
              className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Building2 className="h-5 w-5 text-purple-600" />
              <span className="text-gray-900 font-medium">管理單位</span>
            </button>

            <button 
              onClick={() => router.push('/admin/athletes')}
              className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UserCheck className="h-5 w-5 text-orange-600" />
              <span className="text-gray-900 font-medium">管理選手</span>
            </button>

            <button 
              onClick={() => router.push('/admin/config')}
              className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-5 w-5 text-indigo-600" />
              <span className="text-gray-900 font-medium">賽會設定</span>
            </button>

            <button 
              onClick={() => router.push('/admin/events')}
              className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Trophy className="h-5 w-5 text-red-600" />
              <span className="text-gray-900 font-medium">項目管理</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}