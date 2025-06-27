
// M-Pesa Integration Service
export class MpesaService {
  private consumerKey: string;
  private consumerSecret: string;
  private shortcode: string;
  private passkey: string;
  private environment: 'sandbox' | 'production';

  constructor(config: {
    consumerKey: string;
    consumerSecret: string;
    shortcode: string;
    passkey: string;
    environment?: 'sandbox' | 'production';
  }) {
    this.consumerKey = config.consumerKey;
    this.consumerSecret = config.consumerSecret;
    this.shortcode = config.shortcode;
    this.passkey = config.passkey;
    this.environment = config.environment || 'sandbox';
  }

  private get baseUrl(): string {
    return this.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  async getAccessToken(): Promise<string> {
    const auth = btoa(`${this.consumerKey}:${this.consumerSecret}`);
    
    try {
      const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('M-Pesa auth error:', error);
      throw new Error('Failed to get M-Pesa access token');
    }
  }

  async initiateSTKPush(params: {
    phoneNumber: string;
    amount: number;
    accountReference: string;
    transactionDesc: string;
    callbackUrl: string;
  }): Promise<any> {
    const accessToken = await this.getAccessToken();
    const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
    const password = btoa(`${this.shortcode}${this.passkey}${timestamp}`);

    // Format phone number for M-Pesa (254XXXXXXXXX)
    let formattedPhone = params.phoneNumber.replace(/^\+/, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    const requestBody = {
      BusinessShortCode: this.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: params.amount,
      PartyA: formattedPhone,
      PartyB: this.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: params.callbackUrl,
      AccountReference: params.accountReference,
      TransactionDesc: params.transactionDesc,
    };

    try {
      const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('STK Push error:', error);
      throw new Error('Failed to initiate STK Push');
    }
  }

  async querySTKStatus(checkoutRequestId: string): Promise<any> {
    const accessToken = await this.getAccessToken();
    const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
    const password = btoa(`${this.shortcode}${this.passkey}${timestamp}`);

    const requestBody = {
      BusinessShortCode: this.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    try {
      const response = await fetch(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('STK Query error:', error);
      throw new Error('Failed to query STK status');
    }
  }

  // Handle M-Pesa callback
  handleCallback(callbackData: any): {
    success: boolean;
    transactionId?: string;
    amount?: number;
    phoneNumber?: string;
    error?: string;
  } {
    try {
      const { Body } = callbackData;
      const { stkCallback } = Body;

      if (stkCallback.ResultCode === 0) {
        // Payment successful
        const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
        
        const amount = callbackMetadata.find((item: any) => item.Name === 'Amount')?.Value;
        const mpesaReceiptNumber = callbackMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
        const phoneNumber = callbackMetadata.find((item: any) => item.Name === 'PhoneNumber')?.Value;

        return {
          success: true,
          transactionId: mpesaReceiptNumber,
          amount: amount,
          phoneNumber: phoneNumber?.toString(),
        };
      } else {
        // Payment failed
        return {
          success: false,
          error: stkCallback.ResultDesc || 'Payment failed',
        };
      }
    } catch (error) {
      console.error('Callback parsing error:', error);
      return {
        success: false,
        error: 'Failed to parse callback data',
      };
    }
  }
}

// Utility functions for payment processing
export const formatKenyanPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
};

export const validateKenyanPhoneNumber = (phone: string): boolean => {
  const formatted = formatKenyanPhoneNumber(phone);
  
  // Kenyan phone numbers: 254XXXXXXXXX (12 digits total)
  // Mobile networks: 7XX (Safaricom), 1XX (Airtel)
  const regex = /^254[17]\d{8}$/;
  return regex.test(formatted);
};

// Sample payment plans
export const paymentPlans = {
  free: {
    name: 'Free Trial',
    amount: 0,
    period: 'week',
    lessons: 3,
    features: ['3 lessons per week', 'Basic progress tracking', 'Community access']
  },
  weekly: {
    name: 'Weekly Plan',
    amount: 50,
    period: 'week',
    lessons: 'unlimited',
    features: ['Unlimited lessons', 'All learning tracks', 'Progress certificates', 'Priority support']
  },
  monthly: {
    name: 'Monthly Plan',
    amount: 150,
    period: 'month',
    lessons: 'unlimited',
    features: ['Everything in Weekly', 'Advanced analytics', '1-on-1 coaching', 'Job placement support']
  }
};
