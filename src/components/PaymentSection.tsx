'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, FileText, Upload, Check, AlertCircle, CreditCard } from 'lucide-react';
import { formatCurrency, getWeightClass } from '@/lib/utils';
import FileUpload from './FileUpload';

const paymentSchema = z.object({
  bankName: z.string().min(1, '請輸入銀行名稱'),
  accountLastFive: z.string().regex(/^\d{5}$/, '請輸入帳號後五碼'),
  transferDate: z.string().min(1, '請選擇匯款日期'),
  transferAmount: z.string().transform(val => parseFloat(val)).pipe(z.number().positive('金額必須大於0')),
  notes: z.string().optional()
});

type PaymentForm = z.infer<typeof paymentSchema>;

interface Props {
  unitId: string | null;
}

export default function PaymentSection({ unitId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const form = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema)
  });

  useEffect(() => {
    if (unitId) {
      fetchPaymentInfo();
    }
  }, [unitId]);

  const fetchPaymentInfo = async () => {
    if (!unitId) return;
    
    try {
      const response = await fetch(`/api/payments?unitId=${unitId}`);
      const result = await response.json();
      if (result.success) {
        setPaymentData(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch payment info:', err);
    }
  };

  const handleSubmitPayment = async (data: PaymentForm) => {
    if (!unitId) {
      setError('請先完成前面的步驟');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          unitId,
          transferAmount: data.transferAmount
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '繳費資料提交失敗');
      }

      fetchPaymentInfo();
      setShowPaymentForm(false);
      form.reset();
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
        <p className="text-gray-900 font-medium">請先完成前面的步驟</p>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-900 font-medium">載入中...</p>
      </div>
    );
  }

  const { registrations, totalAmount, payment } = paymentData;

  if (registrations.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-900 font-medium">尚無報名項目，請先完成項目報名</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">報名繳費</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* 費用明細 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          費用明細
        </h3>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-900 font-medium">報名項目數</span>
            <span className="font-medium text-gray-900">{registrations.length} 項</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-900 font-medium">費用說明</span>
            <span className="font-medium text-gray-900 text-right text-sm">
              個人項目（青年以下）：NT$ 800/人<br/>
              個人項目（成人大師）：NT$ 1,200/人<br/>
              演武項目：NT$ 1,200/組
            </span>
          </div>
          <div className="flex justify-between items-center py-3 text-lg">
            <span className="font-semibold text-gray-900">總計</span>
            <span className="font-bold text-blue-600">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* 報名項目列表及費用明細 */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-800 mb-3">報名項目及費用明細：</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    項目
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    選手/組員
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    組別
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    體重(kg)
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    級別
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                    費用
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  const rows: any[] = [];
                  let itemNumber = 0;
                  const processedDuoTeams = new Set<string>();
                  
                  // Process all registrations
                  registrations.forEach((reg: any) => {
                    const eventType = reg.eventType;
                    const ageGroup = reg.athlete.ageGroup;
                    
                    // Check if this is a duo event with a team
                    if ((eventType === 'duo_traditional' || eventType === 'duo_creative') && reg.teamPartnerId) {
                      
                      // Create unique team identifier
                      const teamMembers = [reg.athleteId, reg.teamPartnerId].sort();
                      const genderDiv = reg.genderDivision || 'unknown';
                      const teamId = `${eventType}-${genderDiv}-${teamMembers.join('-')}`;
                      
                      // Skip if team already processed
                      if (processedDuoTeams.has(teamId)) {
                        return;
                      }
                      processedDuoTeams.add(teamId);
                      
                      itemNumber++;
                      
                      const eventName = eventType === 'duo_traditional' ? '傳統演武' : '創意演武';
                      
                      // Always show gender division for duo events
                      const genderDivisionName = 
                        reg.genderDivision === 'men' ? '男子組' :
                        reg.genderDivision === 'women' ? '女子組' : 
                        reg.genderDivision === 'mixed' ? '男女混合組' : '男女混合組'; // Default to mixed if not specified
                      
                      // Find partner's registration to get their name
                      const partnerReg = registrations.find((r: any) => 
                        r.athleteId === reg.teamPartnerId && 
                        r.eventType === eventType
                      );
                      
                      const teamMemberNames = [reg.athlete.name];
                      if (partnerReg?.athlete?.name) {
                        teamMemberNames.push(partnerReg.athlete.name);
                      }
                      
                      rows.push(
                        <tr key={teamId} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {itemNumber}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {eventName}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                            {teamMemberNames.join(' / ')}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {genderDivisionName}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            -
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            -
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-semibold text-right">
                            NT$ 1,200
                          </td>
                        </tr>
                      );
                      
                    } else if ((eventType === 'duo_traditional' || eventType === 'duo_creative') && !reg.teamPartnerId) {
                      // Solo duo event (no team partner)
                      itemNumber++;
                      
                      const eventName = eventType === 'duo_traditional' ? '傳統演武(單人)' : '創意演武(單人)';
                      const ageGroupName = 
                        ageGroup === 'child' ? '兒童組' :
                        ageGroup === 'junior' ? '青少年組' :
                        ageGroup === 'youth' ? '青年組' :
                        ageGroup === 'adult' ? '成人組' :
                        ageGroup === 'master' ? '大師組' : ageGroup;
                      
                      rows.push(
                        <tr key={reg.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {itemNumber}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {eventName}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {reg.athlete.name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {ageGroupName}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {reg.athlete.weight || '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            -
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-semibold text-right">
                            NT$ 600
                          </td>
                        </tr>
                      );
                      
                    } else if (eventType !== 'duo_traditional' && eventType !== 'duo_creative') {
                      // Individual events (not duo)
                      itemNumber++;
                      
                      const fee = (ageGroup === 'child' || ageGroup === 'junior' || ageGroup === 'youth') ? 800 : 1200;
                      
                      const eventName = 
                        eventType === 'fighting' ? '對打' :
                        eventType === 'newaza' ? '寢技' :
                        eventType === 'fullcontact' ? '格鬥' :
                        eventType === 'nogi' ? '無道袍' : eventType;
                      
                      const ageGroupName = 
                        ageGroup === 'child' ? '兒童組' :
                        ageGroup === 'junior' ? '青少年組' :
                        ageGroup === 'youth' ? '青年組' :
                        ageGroup === 'adult' ? '成人組' :
                        ageGroup === 'master' ? '大師組' : ageGroup;
                      
                      // Recalculate weight class if it's 'all' (for older registrations)
                      let weightClass = reg.weightClass;
                      if (weightClass === 'all' && reg.athlete.weight) {
                        weightClass = getWeightClass(reg.athlete.weight, eventType, ageGroup, reg.athlete.gender);
                      }
                      const weightClassDisplay = weightClass && weightClass !== 'all' ? `${weightClass}級` : '-';
                      
                      rows.push(
                        <tr key={reg.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {itemNumber}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {eventName}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {reg.athlete.name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {ageGroupName}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {reg.athlete.weight || '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {weightClassDisplay}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-semibold text-right">
                            NT$ {fee.toLocaleString('zh-TW')}
                          </td>
                        </tr>
                      );
                    }
                  });
                  
                  return rows;
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 匯款資訊 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-blue-900">
          <CreditCard className="h-5 w-5 mr-2" />
          匯款資訊
        </h3>
        <div className="space-y-2 text-blue-800">
          <div>
            <span className="font-medium">銀行：</span>
            <span className="ml-2">第一銀行（代碼 007）</span>
          </div>
          <div>
            <span className="font-medium">戶名：</span>
            <span className="ml-2">中華民國柔術協會</span>
          </div>
          <div>
            <span className="font-medium">帳號：</span>
            <span className="ml-2">123-456-789012</span>
          </div>
          <div>
            <span className="font-medium">應繳金額：</span>
            <span className="ml-2 text-lg font-bold">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* 繳費狀態 */}
      {payment && (
        <div className={`border rounded-lg p-6 mb-6 ${
          payment.paymentStatus === 'confirmed' ? 'bg-green-50 border-green-200' :
          payment.paymentStatus === 'paid' ? 'bg-yellow-50 border-yellow-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4">繳費狀態</h3>
          <div className="flex items-center gap-2">
            {payment.paymentStatus === 'confirmed' && (
              <>
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">繳費已確認</span>
              </>
            )}
            {payment.paymentStatus === 'paid' && (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-700 font-medium">已提交匯款資料，待確認</span>
              </>
            )}
            {payment.paymentStatus === 'pending' && (
              <>
                <AlertCircle className="h-5 w-5 text-gray-700" />
                <span className="text-gray-700 font-medium">待繳費</span>
              </>
            )}
          </div>
          
          {payment.transferDate && (
            <div className="mt-4 space-y-2 text-sm text-gray-800 font-medium">
              <div>匯款日期：{new Date(payment.transferDate).toLocaleDateString('zh-TW')}</div>
              <div>匯款金額：{formatCurrency(payment.transferAmount || 0)}</div>
              <div>銀行：{payment.bankName}</div>
              <div>帳號後五碼：{payment.accountLastFive}</div>
              {payment.notes && <div>備註：{payment.notes}</div>}
            </div>
          )}
        </div>
      )}

      {/* 繳費表單 */}
      {(!payment || payment.paymentStatus === 'pending') && (
        <>
          {!showPaymentForm ? (
            <button
              onClick={() => setShowPaymentForm(true)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <DollarSign className="inline h-5 w-5 mr-2" />
              填寫匯款資料
            </button>
          ) : (
            <form onSubmit={form.handleSubmit(handleSubmitPayment)} className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">填寫匯款資料</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    匯款銀行 *
                  </label>
                  <input
                    {...form.register('bankName')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                    placeholder="例：台北富邦銀行"
                  />
                  {form.formState.errors.bankName && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.bankName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    帳號後五碼 *
                  </label>
                  <input
                    {...form.register('accountLastFive')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                    placeholder="12345"
                    maxLength={5}
                  />
                  {form.formState.errors.accountLastFive && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.accountLastFive.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    匯款日期 *
                  </label>
                  <input
                    type="date"
                    {...form.register('transferDate')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                  />
                  {form.formState.errors.transferDate && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.transferDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    匯款金額 *
                  </label>
                  <input
                    type="number"
                    {...form.register('transferAmount')}
                    defaultValue={totalAmount}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                  />
                  {form.formState.errors.transferAmount && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.transferAmount.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  備註
                </label>
                <textarea
                  {...form.register('notes')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                  placeholder="如有需要補充的資訊請填寫"
                />
              </div>

              <div>
                <FileUpload
                  onFileSelect={setReceiptFile}
                  accept="image/*,application/pdf"
                  maxSize={10 * 1024 * 1024}
                  label="匯款證明 (選填)"
                  description="可上傳匯款單據或截圖，支援圖片和PDF格式"
                  allowCamera={true}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '提交中...' : '提交匯款資料'}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* 完成提示 */}
      {payment && payment.paymentStatus !== 'pending' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">
            <Check className="inline h-5 w-5 mr-2" />
            您的報名資料已完成！系統將在確認繳費後寄送確認信至您的電子郵件。
          </p>
        </div>
      )}
    </div>
  );
}