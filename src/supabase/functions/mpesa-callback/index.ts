
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json()
    console.log('M-Pesa callback received:', JSON.stringify(body, null, 2))

    const { Body } = body
    const { stkCallback } = Body

    if (!stkCallback) {
      return new Response('Invalid callback format', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID
    const resultCode = stkCallback.ResultCode
    const resultDesc = stkCallback.ResultDesc

    // Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('checkout_request_id', checkoutRequestId)
      .single()

    if (paymentError || !payment) {
      console.error('Payment not found:', checkoutRequestId)
      return new Response('Payment not found', { 
        status: 404,
        headers: corsHeaders 
      })
    }

    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || []
      
      const amount = callbackMetadata.find((item: any) => item.Name === 'Amount')?.Value
      const mpesaReceiptNumber = callbackMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value
      const phoneNumber = callbackMetadata.find((item: any) => item.Name === 'PhoneNumber')?.Value

      // Update payment record
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          mpesa_receipt_number: mpesaReceiptNumber,
          paid_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      // Activate/extend subscription
      await handleSuccessfulPayment(supabase, payment, amount)

      // Send WhatsApp confirmation
      await sendPaymentConfirmation(supabase, payment.user_id, mpesaReceiptNumber, amount)

      console.log(`Payment successful: ${mpesaReceiptNumber}`)

    } else {
      // Payment failed
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          error_message: resultDesc
        })
        .eq('id', payment.id)

      // Send failure notification
      await sendPaymentFailureNotification(supabase, payment.user_id, resultDesc)

      console.log(`Payment failed: ${resultDesc}`)
    }

    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('M-Pesa callback error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function handleSuccessfulPayment(supabase: any, payment: any, amount: number) {
  // Get or create subscription
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', payment.user_id)
    .eq('status', 'active')
    .single()

  const now = new Date()
  let expiresAt: Date

  // Determine subscription period based on amount
  if (amount <= 50) {
    // Weekly plan
    expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  } else {
    // Monthly plan
    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  }

  if (existingSubscription) {
    // Extend existing subscription
    const currentExpiry = new Date(existingSubscription.expires_at)
    const extendFrom = currentExpiry > now ? currentExpiry : now
    
    if (amount <= 50) {
      expiresAt = new Date(extendFrom.getTime() + 7 * 24 * 60 * 60 * 1000)
    } else {
      expiresAt = new Date(extendFrom.getTime() + 30 * 24 * 60 * 60 * 1000)
    }

    await supabase
      .from('subscriptions')
      .update({
        expires_at: expiresAt.toISOString(),
        status: 'active'
      })
      .eq('id', existingSubscription.id)
  } else {
    // Create new subscription
    await supabase
      .from('subscriptions')
      .insert({
        user_id: payment.user_id,
        plan_type: amount <= 50 ? 'weekly' : 'monthly',
        amount: amount,
        expires_at: expiresAt.toISOString(),
        status: 'active'
      })
  }

  // Update payment with subscription info
  await supabase
    .from('payments')
    .update({
      subscription_id: existingSubscription?.id || null
    })
    .eq('id', payment.id)
}

async function sendPaymentConfirmation(supabase: any, userId: string, receiptNumber: string, amount: number) {
  // Get user details
  const { data: user } = await supabase
    .from('users')
    .select('whatsapp_number, name')
    .eq('id', userId)
    .single()

  if (!user) return

  const planType = amount <= 50 ? 'Weekly' : 'Monthly'
  const message = `
🎉 Payment Confirmed!

Receipt: ${receiptNumber}
Amount: KES ${amount}
Plan: ${planType} Subscription

Your SkillBoost Kenya Premium is now active! 

✅ Unlimited lessons
✅ All learning tracks  
✅ Progress certificates
✅ Priority support

Your next lesson arrives tomorrow. Ready to boost your skills? 💪

Reply NEXT to get started!
  `

  await sendWhatsAppMessage(user.whatsapp_number, message)
  
  // Log the message
  await supabase.from('whatsapp_messages').insert({
    user_id: userId,
    phone_number: user.whatsapp_number.replace('+', ''),
    message_type: 'payment_confirmation',
    content: message,
    sent_at: new Date().toISOString()
  })
}

async function sendPaymentFailureNotification(supabase: any, userId: string, errorMessage: string) {
  // Get user details
  const { data: user } = await supabase
    .from('users')
    .select('whatsapp_number, name')
    .eq('id', userId)
    .single()

  if (!user) return

  const message = `
❌ Payment Failed

Hi ${user.name}, your M-Pesa payment couldn't be processed.

Reason: ${errorMessage}

Please try again:
• Ensure you have sufficient balance
• Check if M-Pesa is working
• Try a different number if needed

Visit: skillboost-kenya.lovable.app

Need help? Reply HELP
  `

  await sendWhatsAppMessage(user.whatsapp_number, message)
  
  // Log the message
  await supabase.from('whatsapp_messages').insert({
    user_id: userId,
    phone_number: user.whatsapp_number.replace('+', ''),
    message_type: 'payment_failed',
    content: message,
    sent_at: new Date().toISOString()
  })
}

async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  
  if (!accessToken || !phoneNumberId) {
    console.error('WhatsApp credentials not configured')
    return false
  }

  const cleanPhoneNumber = phoneNumber.replace('+', '')

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhoneNumber,
        type: 'text',
        text: { body: message }
      })
    })

    const result = await response.json()
    console.log('WhatsApp API response:', result)
    return response.ok
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error)
    return false
  }
}
