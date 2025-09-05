'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, User, Phone, Mail, Lock, LogIn } from 'lucide-react';
import ForgotPassword from './ForgotPassword';

const registerSchema = z.object({
  name: z.string().min(1, '單位名稱必填'),
  address: z.string().optional(),
  contactName: z.string().min(1, '聯絡人必填'),
  phone: z.string().regex(/^09\d{8}$/, '請輸入正確的手機號碼格式'),
  email: z.string().email('請輸入正確的電子郵件格式'),
  password: z.string().min(6, '密碼至少6個字元'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: '密碼不相符',
  path: ['confirmPassword']
});

const loginSchema = z.object({
  email: z.string().email('請輸入正確的電子郵件格式'),
  password: z.string().min(1, '請輸入密碼')
});

type RegisterForm = z.infer<typeof registerSchema>;
type LoginForm = z.infer<typeof loginSchema>;

interface UnitInfo {
  id: string;
  name: string;
  address?: string;
  contactName: string;
  phone: string;
  email: string;
}

interface Props {
  onUnitRegistered: (unitId: string, unitInfo: UnitInfo) => void;
  disabled?: boolean;
}

export default function UnitRegistration({ onUnitRegistered, disabled = false }: Props) {
  const [isLogin, setIsLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const handleRegister = async (data: RegisterForm) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/units/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '註冊失敗');
      }

      onUnitRegistered(result.data.id, result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (data: LoginForm) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/units/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '登入失敗');
      }

      // 登入成功，調用回調函數
      onUnitRegistered(result.data.id, result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (disabled) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <Lock className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-amber-800 mb-2">資料已鎖定</h3>
            <p className="text-amber-700">報名資料已鎖定，無法進行修改。您仍可查看現有資料。</p>
          </div>
        </div>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <ForgotPassword 
        onBack={() => {
          setShowForgotPassword(false);
          setError(null);
        }} 
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex justify-center gap-4">
        <button
          type="button"
          onClick={() => {
            setIsLogin(false);
            setError(null);
          }}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            !isLogin 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          註冊新單位
        </button>
        <button
          type="button"
          onClick={() => {
            setIsLogin(true);
            setError(null);
          }}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            isLogin 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          已有帳號登入
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {!isLogin ? (
        <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="inline h-4 w-4 mr-1" />
              單位名稱 *
            </label>
            <input
              {...registerForm.register('name')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
              placeholder="例：台北柔術道館"
            />
            {registerForm.formState.errors.name && (
              <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              地址
            </label>
            <input
              {...registerForm.register('address')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
              placeholder="請輸入單位地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              聯絡人姓名 *
            </label>
            <input
              {...registerForm.register('contactName')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
              placeholder="請輸入聯絡人姓名"
            />
            {registerForm.formState.errors.contactName && (
              <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.contactName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline h-4 w-4 mr-1" />
              聯絡電話 *
            </label>
            <input
              {...registerForm.register('phone')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
              placeholder="09XXXXXXXX"
            />
            {registerForm.formState.errors.phone && (
              <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline h-4 w-4 mr-1" />
              電子郵件 *
            </label>
            <input
              type="email"
              {...registerForm.register('email')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
              placeholder="example@email.com"
            />
            {registerForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="inline h-4 w-4 mr-1" />
              密碼 *
            </label>
            <input
              type="password"
              {...registerForm.register('password')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
              placeholder="至少6個字元"
            />
            {registerForm.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="inline h-4 w-4 mr-1" />
              確認密碼 *
            </label>
            <input
              type="password"
              {...registerForm.register('confirmPassword')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
              placeholder="請再次輸入密碼"
            />
            {registerForm.formState.errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '註冊中...' : '註冊單位'}
          </button>
        </form>
      ) : (
        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline h-4 w-4 mr-1" />
              電子郵件
            </label>
            <input
              type="email"
              {...loginForm.register('email')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
              placeholder="example@email.com"
            />
            {loginForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="inline h-4 w-4 mr-1" />
              密碼
            </label>
            <input
              type="password"
              {...loginForm.register('password')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
              placeholder="請輸入密碼"
            />
            {loginForm.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <LogIn className="inline h-4 w-4 mr-2" />
            {loading ? '登入中...' : '登入'}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              忘記密碼？
            </button>
          </div>
        </form>
      )}
    </div>
  );
}