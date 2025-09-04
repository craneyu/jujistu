'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Settings, Save, X, ArrowLeft } from 'lucide-react';

interface EventType {
  id: string;
  key: string;
  name: string;
  description?: string;
  requiresTeam: boolean;
  enabled: boolean;
  categories: EventCategory[];
}

interface EventCategory {
  id: string;
  eventTypeId: string;
  ageGroup: string;
  gender: string;
  weightClass: string;
  minWeight?: number;
  maxWeight?: number;
  description: string;
  enabled: boolean;
  eventType: EventType;
}

const AGE_GROUPS = {
  adult: '成人組',
  youth: '青年組', 
  junior: '青少年組',
  child: '兒童組',
  master: '大師組'
};

const GENDERS = {
  M: '男子組',
  F: '女子組',
  mixed: '混合組'
};

export default function EventsManagement() {
  const router = useRouter();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<EventCategory[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEventTypeForm, setShowEventTypeForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  const [editingCategory, setEditingCategory] = useState<EventCategory | null>(null);

  const [eventTypeForm, setEventTypeForm] = useState({
    key: '',
    name: '',
    description: '',
    requiresTeam: false,
    enabled: true
  });

  const [categoryForm, setCategoryForm] = useState({
    eventTypeId: '',
    ageGroup: 'adult',
    gender: 'M',
    weightClass: '',
    minWeight: '',
    maxWeight: '',
    description: '',
    enabled: true
  });

  useEffect(() => {
    fetchEventTypes();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedEventType) {
      const filtered = categories.filter(category => category.eventTypeId === selectedEventType);
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories([]);
    }
  }, [categories, selectedEventType]);

  // Group filtered categories by gender and age group for better display
  const groupedCategories = filteredCategories.reduce((groups, category) => {
    const genderKey = category.gender === 'M' ? '男子組' : category.gender === 'F' ? '女子組' : '混合組';
    const ageGroupKey = AGE_GROUPS[category.ageGroup as keyof typeof AGE_GROUPS];
    const key = `${genderKey} - ${ageGroupKey}`;
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(category);
    return groups;
  }, {} as Record<string, EventCategory[]>);

  const fetchEventTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/event-types');
      const result = await response.json();
      
      if (result.success) {
        setEventTypes(result.data);
      } else {
        setError('取得項目類型失敗');
      }
    } catch (err) {
      console.error('取得項目類型失敗:', err);
      setError('取得項目類型失敗');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/event-categories');
      const result = await response.json();
      
      if (result.success) {
        setCategories(result.data);
      }
    } catch (err) {
      console.error('取得項目分類失敗:', err);
    }
  };

  const handleCreateEventType = async () => {
    if (!eventTypeForm.key || !eventTypeForm.name) {
      setError('項目代碼和名稱必填');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/event-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventTypeForm)
      });

      const result = await response.json();

      if (result.success) {
        await fetchEventTypes();
        resetEventTypeForm();
        setError(null);
      } else {
        setError(result.error || '建立項目類型失敗');
      }
    } catch (err) {
      console.error('建立項目類型失敗:', err);
      setError('建立項目類型失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEventType = async () => {
    if (!editingEventType) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/event-types?id=${editingEventType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventTypeForm)
      });

      const result = await response.json();

      if (result.success) {
        await fetchEventTypes();
        resetEventTypeForm();
        setError(null);
      } else {
        setError(result.error || '更新項目類型失敗');
      }
    } catch (err) {
      console.error('更新項目類型失敗:', err);
      setError('更新項目類型失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEventType = async (id: string) => {
    if (!confirm('確定要刪除此項目類型嗎？此操作無法撤銷。')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/event-types?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await fetchEventTypes();
        setError(null);
      } else {
        setError(result.error || '刪除項目類型失敗');
      }
    } catch (err) {
      console.error('刪除項目類型失敗:', err);
      setError('刪除項目類型失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.eventTypeId || !categoryForm.weightClass || !categoryForm.description) {
      setError('項目類型、量級代碼和描述必填');
      return;
    }

    setLoading(true);
    try {
      const categoryData = {
        ...categoryForm,
        minWeight: categoryForm.minWeight ? parseFloat(categoryForm.minWeight) : null,
        maxWeight: categoryForm.maxWeight ? parseFloat(categoryForm.maxWeight) : null,
      };

      const response = await fetch('/api/event-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });

      const result = await response.json();

      if (result.success) {
        await fetchCategories();
        await fetchEventTypes(); // 重新載入以更新分類數量
        resetCategoryForm();
        setError(null);
      } else {
        setError(result.error || '建立項目分類失敗');
      }
    } catch (err) {
      console.error('建立項目分類失敗:', err);
      setError('建立項目分類失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    setLoading(true);
    try {
      const categoryData = {
        ...categoryForm,
        minWeight: categoryForm.minWeight ? parseFloat(categoryForm.minWeight) : null,
        maxWeight: categoryForm.maxWeight ? parseFloat(categoryForm.maxWeight) : null,
      };

      const response = await fetch(`/api/event-categories?id=${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });

      const result = await response.json();

      if (result.success) {
        await fetchCategories();
        await fetchEventTypes();
        resetCategoryForm();
        setError(null);
      } else {
        setError(result.error || '更新項目分類失敗');
      }
    } catch (err) {
      console.error('更新項目分類失敗:', err);
      setError('更新項目分類失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('確定要刪除此項目分類嗎？此操作無法撤銷。')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/event-categories?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await fetchCategories();
        await fetchEventTypes();
        setError(null);
      } else {
        setError(result.error || '刪除項目分類失敗');
      }
    } catch (err) {
      console.error('刪除項目分類失敗:', err);
      setError('刪除項目分類失敗');
    } finally {
      setLoading(false);
    }
  };

  const resetEventTypeForm = () => {
    setEventTypeForm({
      key: '',
      name: '',
      description: '',
      requiresTeam: false,
      enabled: true
    });
    setShowEventTypeForm(false);
    setEditingEventType(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      eventTypeId: '',
      ageGroup: 'adult',
      gender: 'M',
      weightClass: '',
      minWeight: '',
      maxWeight: '',
      description: '',
      enabled: true
    });
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  const startEditEventType = (eventType: EventType) => {
    setEventTypeForm({
      key: eventType.key,
      name: eventType.name,
      description: eventType.description || '',
      requiresTeam: eventType.requiresTeam,
      enabled: eventType.enabled
    });
    setEditingEventType(eventType);
    setShowEventTypeForm(true);
  };

  const startEditCategory = (category: EventCategory) => {
    setCategoryForm({
      eventTypeId: category.eventTypeId,
      ageGroup: category.ageGroup,
      gender: category.gender,
      weightClass: category.weightClass,
      minWeight: category.minWeight?.toString() || '',
      maxWeight: category.maxWeight?.toString() || '',
      description: category.description,
      enabled: category.enabled
    });
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="回上一頁"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">競賽項目管理</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowEventTypeForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            新增項目類型
          </button>
          <button
            onClick={() => setShowCategoryForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            新增分組
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* 項目類型表單 */}
      {showEventTypeForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingEventType ? '編輯項目類型' : '新增項目類型'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">項目代碼 *</label>
                <input
                  type="text"
                  value={eventTypeForm.key}
                  onChange={(e) => setEventTypeForm({...eventTypeForm, key: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例：fighting"
                  disabled={!!editingEventType}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">項目名稱 *</label>
                <input
                  type="text"
                  value={eventTypeForm.name}
                  onChange={(e) => setEventTypeForm({...eventTypeForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例：對打"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                <textarea
                  value={eventTypeForm.description}
                  onChange={(e) => setEventTypeForm({...eventTypeForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="項目描述"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={eventTypeForm.requiresTeam}
                    onChange={(e) => setEventTypeForm({...eventTypeForm, requiresTeam: e.target.checked})}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">需要組隊</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={eventTypeForm.enabled}
                    onChange={(e) => setEventTypeForm({...eventTypeForm, enabled: e.target.checked})}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">啟用</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={editingEventType ? handleUpdateEventType : handleCreateEventType}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? '處理中...' : (editingEventType ? '更新' : '建立')}
              </button>
              <button
                onClick={resetEventTypeForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 分類表單 */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCategory ? '編輯項目分組' : '新增項目分組'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">項目類型 *</label>
                <select
                  value={categoryForm.eventTypeId}
                  onChange={(e) => setCategoryForm({...categoryForm, eventTypeId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">請選擇項目類型</option>
                  {eventTypes.map(eventType => (
                    <option key={eventType.id} value={eventType.id}>
                      {eventType.name} ({eventType.key})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">年齡組別 *</label>
                  <select
                    value={categoryForm.ageGroup}
                    onChange={(e) => setCategoryForm({...categoryForm, ageGroup: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(AGE_GROUPS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">性別組別 *</label>
                  <select
                    value={categoryForm.gender}
                    onChange={(e) => setCategoryForm({...categoryForm, gender: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(GENDERS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">量級代碼 *</label>
                <input
                  type="text"
                  value={categoryForm.weightClass}
                  onChange={(e) => setCategoryForm({...categoryForm, weightClass: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例：-56, light, all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">最小體重 (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={categoryForm.minWeight}
                    onChange={(e) => setCategoryForm({...categoryForm, minWeight: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="可選"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">最大體重 (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={categoryForm.maxWeight}
                    onChange={(e) => setCategoryForm({...categoryForm, maxWeight: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="可選"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">級別描述 *</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例：成人男子 -56公斤級"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={categoryForm.enabled}
                    onChange={(e) => setCategoryForm({...categoryForm, enabled: e.target.checked})}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">啟用此分組</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? '處理中...' : (editingCategory ? '更新' : '建立')}
              </button>
              <button
                onClick={resetCategoryForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 項目類型列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">項目類型</h2>
          
          {loading ? (
            <div className="text-center py-8">載入中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">代碼</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">名稱</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">描述</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">需要組隊</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">分組數量</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">狀態</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {eventTypes.map(eventType => (
                    <tr key={eventType.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900">{eventType.key}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{eventType.name}</td>
                      <td className="py-3 px-4 text-gray-900">{eventType.description || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          eventType.requiresTeam 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {eventType.requiresTeam ? '是' : '否'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-900">{eventType.categories?.length || 0}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          eventType.enabled 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {eventType.enabled ? '啟用' : '停用'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditEventType(eventType)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="編輯"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEventType(eventType.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="刪除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 項目分類列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">項目分組設定</h2>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">選擇項目類型以查看分組</label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-w-xs"
            >
              <option value="">請選擇項目類型</option>
              {eventTypes.map(eventType => (
                <option key={eventType.id} value={eventType.id}>
                  {eventType.name} ({eventType.key})
                </option>
              ))}
            </select>
          </div>

          {selectedEventType ? (
            <div className="space-y-6">
              {Object.entries(groupedCategories).map(([groupName, categoriesInGroup]) => (
                <div key={groupName} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{groupName}</h3>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-medium">
                        {categoriesInGroup.length} 個分組
                      </span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900 w-1/4">分組描述</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 w-1/6">量級代碼</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 w-1/4">體重範圍</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 w-1/8">狀態</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 w-1/4">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoriesInGroup.map((category, index) => (
                          <tr 
                            key={category.id} 
                            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900">{category.description}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                                {category.weightClass}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {category.minWeight !== null || category.maxWeight !== null ? (
                                <div className="flex items-center">
                                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                                    {category.minWeight !== null ? `${category.minWeight}kg` : ''}
                                    {category.minWeight !== null && category.maxWeight !== null ? ' - ' : ''}
                                    {category.maxWeight !== null ? `${category.maxWeight}kg` : '以上'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">不限體重</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                category.enabled 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {category.enabled ? '啟用' : '停用'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEditCategory(category)}
                                  className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                                  title="編輯"
                                >
                                  <Edit2 className="h-3 w-3" />
                                  編輯
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="bg-red-600 text-white text-xs px-3 py-1.5 rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                                  title="刪除"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  刪除
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              
              {Object.keys(groupedCategories).length === 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <div className="text-center text-gray-500">
                    <p>此項目類型暫無分組設定</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>請先選擇項目類型以查看相關分組</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}