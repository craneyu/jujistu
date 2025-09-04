'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit2, Check, X, User, Phone, MapPin } from 'lucide-react';

const updateSchema = z.object({
  id: z.string(),
  address: z.string().optional(),
  contactName: z.string().min(1, '聯絡人必填'),
  phone: z.string().regex(/^09\d{8}$/, '請輸入正確的手機號碼格式')
});

type UpdateForm = z.infer<typeof updateSchema>;

interface UnitInfo {
  id: string;
  name: string;
  address?: string;
  contactName: string;
  phone: string;
  email: string;
}

interface Props {
  unitInfo: UnitInfo;
  onUnitUpdated: (updatedInfo: UnitInfo) => void;
}

export default function UnitProfile({ unitInfo, onUnitUpdated }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      id: unitInfo.id,
      address: unitInfo.address || '',
      contactName: unitInfo.contactName,
      phone: unitInfo.phone
    }
  });

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    form.reset({
      id: unitInfo.id,
      address: unitInfo.address || '',
      contactName: unitInfo.contactName,
      phone: unitInfo.phone
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    form.reset();
  };

  const handleUpdate = async (data: UpdateForm) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/units', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '更新失敗');
      }

      onUnitUpdated(result.data);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-900">編輯單位資料</h3>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">單位名稱 (不可修改)</label>
            <input
              value={unitInfo.name}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="inline h-4 w-4 mr-1" />
              地址
            </label>
            <input
              {...form.register('address')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="請輸入單位地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="inline h-4 w-4 mr-1" />
              聯絡人姓名 *
            </label>
            <input
              {...form.register('contactName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
            {form.formState.errors.contactName && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.contactName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="inline h-4 w-4 mr-1" />
              聯絡電話 *
            </label>
            <input
              {...form.register('phone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="09XXXXXXXX"
            />
            {form.formState.errors.phone && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件 (不可修改)</label>
            <input
              value={unitInfo.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Check className="inline h-4 w-4 mr-2" />
              {loading ? '更新中...' : '確認更新'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-900">目前登入單位</h3>
        <button
          onClick={handleEdit}
          className="flex items-center gap-2 px-3 py-1 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors text-sm"
        >
          <Edit2 className="h-4 w-4" />
          編輯資料
        </button>
      </div>
      
      <div className="space-y-2 text-blue-800">
        <p><span className="font-medium">單位名稱：</span>{unitInfo.name}</p>
        {unitInfo.address && (
          <p><span className="font-medium">地址：</span>{unitInfo.address}</p>
        )}
        <p><span className="font-medium">聯絡人：</span>{unitInfo.contactName}</p>
        <p><span className="font-medium">電話：</span>{unitInfo.phone}</p>
        <p><span className="font-medium">電子郵件：</span>{unitInfo.email}</p>
      </div>
    </div>
  );
}