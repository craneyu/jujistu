'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Check,
  X,
  Eye,
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  Image,
  ExternalLink
} from 'lucide-react';

interface Payment {
  id: string;
  unit: {
    name: string;
    contactName: string;
    email: string;
    phone: string;
  };
  totalAmount: number;
  paymentStatus: string;
  bankName?: string;
  accountLastFive?: string;
  transferDate?: string;
  transferAmount?: number;
  proofImage?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentsManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, paid, confirmed
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchPayments();
  }, [router]);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          paymentId, 
          paymentStatus: status 
        })
      });

      if (response.ok) {
        await fetchPayments();
      }
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesFilter = filter === 'all' || payment.paymentStatus === filter;
    const matchesSearch = payment.unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.unit.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.unit.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-500" />;
      case 'paid':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
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

  const getStatusColor = (status: string) => {
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
                <h1 className="text-2xl font-bold text-gray-900">繳費管理</h1>
                <p className="text-gray-600">管理所有報名繳費狀態</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部狀態</option>
                  <option value="pending">待繳費</option>
                  <option value="paid">待確認</option>
                  <option value="confirmed">已確認</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:min-w-64">
              <Search className="h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="搜尋單位名稱、聯絡人或Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    單位資訊
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    繳費狀態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    匯款資訊
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{payment.unit.name}</div>
                        <div className="text-sm text-gray-600">{payment.unit.contactName}</div>
                        <div className="text-sm text-gray-600">{payment.unit.email}</div>
                        <div className="text-sm text-gray-600">{payment.unit.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.paymentStatus)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.paymentStatus)}`}>
                          {getStatusText(payment.paymentStatus)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        NT$ {payment.totalAmount.toLocaleString()}
                      </div>
                      {payment.transferAmount && (
                        <div className="text-sm text-gray-600">
                          實匯: NT$ {payment.transferAmount.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {payment.bankName && (
                        <div className="text-sm text-gray-900">
                          <div>{payment.bankName}</div>
                          <div>後五碼: {payment.accountLastFive}</div>
                          {payment.transferDate && (
                            <div>日期: {new Date(payment.transferDate).toLocaleDateString('zh-TW')}</div>
                          )}
                          {payment.proofImage && (
                            <div className="mt-2">
                              <button
                                onClick={() => window.open(payment.proofImage, '_blank')}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                              >
                                <Image className="h-3 w-3" />
                                查看匯款證明
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {payment.paymentStatus === 'paid' && (
                          <>
                            <button
                              onClick={() => updatePaymentStatus(payment.id, 'confirmed')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="確認繳費"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => updatePaymentStatus(payment.id, 'pending')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="退回待繳費"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="查看詳情"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">沒有找到符合條件的繳費記錄</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}