
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreditCard, Smartphone, Check, Loader2 } from 'lucide-react';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: string;
}

const PaymentModal = ({ open, onOpenChange, plan }: PaymentModalProps) => {
  const [paymentData, setPaymentData] = useState({
    phoneNumber: '',
    name: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('details'); // details, processing, success

  const planDetails = {
    weekly: { amount: 50, period: 'week', description: 'KES 50 per week' },
    monthly: { amount: 150, period: 'month', description: 'KES 150 per month' },
    premium: { amount: 150, period: 'month', description: 'KES 150 per month' }
  };

  const currentPlan = planDetails[plan as keyof typeof planDetails] || planDetails.monthly;

  const handlePayment = async () => {
    if (!paymentData.phoneNumber || !paymentData.name) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate phone number format
    const phoneRegex = /^(\+254|254|0)[17]\d{8}$/;
    if (!phoneRegex.test(paymentData.phoneNumber)) {
      toast.error("Please enter a valid Kenyan phone number");
      return;
    }

    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      // Simulate M-Pesa STK Push
      await initiateMpesaPayment();
      
      // Simulate payment processing delay
      setTimeout(() => {
        setPaymentStep('success');
        setIsProcessing(false);
        
        // Store subscription data
        const subscriptionData = {
          plan: plan,
          amount: currentPlan.amount,
          phoneNumber: paymentData.phoneNumber,
          subscribedAt: new Date().toISOString(),
          status: 'active',
          nextBilling: new Date(Date.now() + (plan === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString()
        };
        
        localStorage.setItem('skillboost_subscription', JSON.stringify(subscriptionData));
        
        toast.success(`Payment successful! Your ${plan} subscription is now active.`);
        
        setTimeout(() => {
          onOpenChange(false);
          setPaymentStep('details');
        }, 3000);
        
      }, 3000);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Payment failed. Please try again.");
      setIsProcessing(false);
      setPaymentStep('details');
    }
  };

  const initiateMpesaPayment = async () => {
    // This would integrate with M-Pesa Daraja API
    console.log('Initiating M-Pesa STK Push for:', paymentData.phoneNumber);
    
    const mpesaRequest = {
      phoneNumber: paymentData.phoneNumber,
      amount: currentPlan.amount,
      accountReference: 'SkillBoost Kenya',
      transactionDesc: `SkillBoost ${plan} subscription`
    };
    
    // Simulate API call to M-Pesa
    return new Promise(resolve => setTimeout(resolve, 1000));
  };

  const formatPhoneNumber = (phone: string) => {
    // Auto-format phone number
    let formatted = phone.replace(/\D/g, '');
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.slice(1);
    } else if (formatted.startsWith('7') || formatted.startsWith('1')) {
      formatted = '254' + formatted;
    }
    return '+' + formatted;
  };

  const renderPaymentStep = () => {
    switch (paymentStep) {
      case 'details':
        return (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-green-800">Selected Plan</span>
                  <Badge className="bg-green-600">{plan.charAt(0).toUpperCase() + plan.slice(1)}</Badge>
                </div>
                <div className="text-2xl font-bold text-green-800">
                  KES {currentPlan.amount}
                </div>
                <div className="text-sm text-green-700">
                  per {currentPlan.period} • Unlimited lessons • All tracks included
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div>
                <Label htmlFor="payment-name">Full Name *</Label>
                <Input
                  id="payment-name"
                  value={paymentData.name}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="payment-phone">M-Pesa Phone Number *</Label>
                <Input
                  id="payment-phone"
                  value={paymentData.phoneNumber}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setPaymentData(prev => ({ ...prev, phoneNumber: formatted }));
                  }}
                  placeholder="+254712345678"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  We'll send an STK push to this number
                </p>
              </div>
            </div>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">How it works:</h4>
                    <ol className="text-sm text-blue-700 space-y-1">
                      <li>1. Click "Pay with M-Pesa" below</li>
                      <li>2. Check your phone for M-Pesa prompt</li>
                      <li>3. Enter your M-Pesa PIN to complete</li>
                      <li>4. Instant subscription activation!</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handlePayment}
              className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
              disabled={isProcessing}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Pay KES {currentPlan.amount} with M-Pesa
            </Button>
          </div>
        );

      case 'processing':
        return (
          <div className="space-y-6 text-center py-8">
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Processing Payment...</h3>
              <p className="text-gray-600 mb-4">
                Check your phone for the M-Pesa payment prompt
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Please complete the payment on your phone within the next 2 minutes.
                </p>
              </div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6 text-center py-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-4">
                Your {plan} subscription is now active. Welcome to SkillBoost Kenya Premium!
              </p>
              
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-green-800 mb-2">What's Next?</h4>
                  <ul className="text-sm text-green-700 space-y-1 text-left">
                    <li>✅ Unlimited access to all learning tracks</li>
                    <li>✅ Daily lessons will start tomorrow</li>
                    <li>✅ Progress tracking and certificates</li>
                    <li>✅ Priority WhatsApp support</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Complete Payment</span>
          </DialogTitle>
          <DialogDescription>
            Secure payment with M-Pesa - Kenya's trusted mobile money
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {renderPaymentStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
