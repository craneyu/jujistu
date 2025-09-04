import { useState, useEffect } from 'react';

interface PaymentInfo {
  id: string;
  paymentStatus: 'pending' | 'paid' | 'confirmed';
  totalAmount: number;
  bankName?: string;
  accountLastFive?: string;
  transferDate?: string;
  transferAmount?: number;
  proofImage?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const usePaymentStatus = (unitId: string | null) => {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPaymentStatus = async () => {
    if (!unitId) {
      setPaymentInfo(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/payments?unitId=${unitId}`);
      const result = await response.json();
      
      if (result.success && result.data.payment) {
        setPaymentInfo(result.data.payment);
      } else {
        setPaymentInfo(null);
      }
    } catch (error) {
      console.error('Failed to fetch payment status:', error);
      setPaymentInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentStatus();
  }, [unitId]);

  // Determine if registration modifications should be disabled
  const isRegistrationLocked = paymentInfo && 
    (paymentInfo.paymentStatus === 'paid' || paymentInfo.paymentStatus === 'confirmed');

  return {
    paymentInfo,
    loading,
    isRegistrationLocked,
    refreshPaymentStatus: fetchPaymentStatus
  };
};