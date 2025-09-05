'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, Key } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('請輸入正確的電子郵件格式')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, '重設權杖為必填'),
  password: z.string().min(6, '密碼至少6個字元'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: '密碼不相符',
  path: ['confirmPassword']
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

interface Props {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: Props) {
  const [step, setStep] = useState<'forgot' | 'reset'>('forgot');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string>('');

  const forgotForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const handleForgotPassword = async (data: ForgotPasswordForm) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const response = await fetch('/api/units/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '發送重設郵件失敗');
      }

      setMessage(result.message);
      // For demo purposes, automatically set the token
      if (result.resetToken) {
        setResetToken(result.resetToken);
        resetForm.setValue('token', result.resetToken);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordForm) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const response = await fetch('/api/units/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '密碼重設失敗');
      }

      setMessage(result.message);
      setTimeout(() => {
        onBack(); // Return to login form after success
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回登入
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {message}
        </div>
      )}

      {step === 'forgot' ? (
        <div>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">忘記密碼</h2>
            <p className="text-gray-600">請輸入您的電子郵件地址，我們將發送密碼重設說明給您。</p>
          </div>

          <form onSubmit={forgotForm.handleSubmit(handleForgotPassword)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                電子郵件
              </label>
              <input
                type="email"
                {...forgotForm.register('email')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                placeholder="example@email.com"
              />
              {forgotForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{forgotForm.formState.errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '發送中...' : '發送重設說明'}
            </button>

            {resetToken && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setStep('reset')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  繼續重設密碼
                </button>
              </div>
            )}
          </form>
        </div>
      ) : (
        <div>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Key className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">重設密碼</h2>
            <p className="text-gray-600">請輸入重設權杖和您的新密碼。</p>
          </div>

          <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                重設權杖
              </label>
              <input
                {...resetForm.register('token')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                placeholder="輸入重設權杖"
              />
              {resetForm.formState.errors.token && (
                <p className="mt-1 text-sm text-red-600">{resetForm.formState.errors.token.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新密碼
              </label>
              <input
                type="password"
                {...resetForm.register('password')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                placeholder="至少6個字元"
              />
              {resetForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">{resetForm.formState.errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                確認新密碼
              </label>
              <input
                type="password"
                {...resetForm.register('confirmPassword')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                placeholder="請再次輸入新密碼"
              />
              {resetForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{resetForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '重設中...' : '重設密碼'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}