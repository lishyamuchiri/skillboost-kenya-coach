
// M-Pesa integration utilities for SkillBoost Kenya
// This handles frontend M-Pesa integration logic

export interface MpesaPayment {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface MpesaResponse {
  success: boolean;
  checkoutRequestId?: string;
  responseCode?: string;
  responseDescription?: string;
  customerMessage?: string;
}

export const formatMpesaNumber = (phoneNumber: string): string => {
  // Remove all non-digits
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle Kenyan numbers for M-Pesa (254XXXXXXXXX format)
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned.slice(1);
  }
  
  return cleaned;
};

export const validateMpesaNumber = (phoneNumber: string): boolean => {
  const formatted = formatMpesaNumber(phoneNumber);
  // M-Pesa supports Safaricom numbers: 254[7|1]xxxxxxxx
  const mpesaRegex = /^254[71]\d{8}$/;
  return mpesaRegex.test(formatted);
};

// Simulate M-Pesa STK Push for demo purposes
export const initiateStkPush = async (payment: MpesaPayment): Promise<MpesaResponse> => {
  console.log('Initiating M-Pesa STK Push:', payment);
  
  // Validate phone number
  if (!validateMpesaNumber(payment.phoneNumber)) {
    return {
      success: false,
      responseDescription: 'Invalid phone number format'
    };
  }
  
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock checkout request ID
    const checkoutRequestId = `ws_CO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store payment request for demo purposes
    const payments = JSON.parse(localStorage.getItem('mpesa_payments') || '[]');
    payments.push({
      ...payment,
      checkoutRequestId,
      status: 'pending',
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('mpesa_payments', JSON.stringify(payments));
    
    // Simulate successful STK push initiation
    return {
      success: true,
      checkoutRequestId,
      responseCode: '0',
      responseDescription: 'Success. Request accepted for processing',
      customerMessage: 'Success. Request accepted for processing'
    };
    
  } catch (error) {
    console.error('M-Pesa STK Push failed:', error);
    return {
      success: false,
      responseDescription: 'Failed to initiate payment. Please try again.'
    };
  }
};

// Simulate payment confirmation for demo purposes
export const confirmPayment = async (checkoutRequestId: string): Promise<boolean> => {
  console.log('Confirming M-Pesa payment:', checkoutRequestId);
  
  try {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Update payment status in localStorage
    const payments = JSON.parse(localStorage.getItem('mpesa_payments') || '[]');
    const paymentIndex = payments.findIndex((p: any) => p.checkoutRequestId === checkoutRequestId);
    
    if (paymentIndex !== -1) {
      payments[paymentIndex].status = 'completed';
      payments[paymentIndex].mpesaReceiptNumber = `NLJ${Math.random().toString(36).substr(2, 7).toUpperCase()}${Date.now().toString().slice(-4)}`;
      payments[paymentIndex].completedAt = new Date().toISOString();
      localStorage.setItem('mpesa_payments', JSON.stringify(payments));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Payment confirmation failed:', error);
    return false;
  }
};

export const getPaymentStatus = (checkoutRequestId: string): any => {
  const payments = JSON.parse(localStorage.getItem('mpesa_payments') || '[]');
  return payments.find((p: any) => p.checkoutRequestId === checkoutRequestId);
};

export const getPaymentHistory = (): any[] => {
  return JSON.parse(localStorage.getItem('mpesa_payments') || '[]');
};

// M-Pesa amount validation
export const validateAmount = (amount: number): boolean => {
  return amount >= 1 && amount <= 150000; // M-Pesa limits
};

// Get subscription plan details
export const getSubscriptionPlan = (amount: number) => {
  if (amount <= 50) {
    return {
      type: 'weekly',
      duration: '7 days',
      features: ['3 lessons per week', 'Basic support', 'Progress tracking']
    };
  } else {
    return {
      type: 'monthly',
      duration: '30 days',
      features: ['Unlimited lessons', 'All tracks included', 'Certificates', 'Priority support']
    };
  }
};
