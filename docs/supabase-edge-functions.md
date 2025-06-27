
# SkillBoost Kenya - Supabase Edge Functions

This document contains the Edge Functions code that needs to be deployed to Supabase after connecting your project.

## Setup Instructions

1. Connect to Supabase using the green button in Lovable
2. Go to your Supabase Dashboard → SQL Editor
3. Run the SQL schema from `src/utils/supabase-setup.sql`
4. Create these Edge Functions in Supabase Dashboard → Edge Functions

## Edge Functions to Create

### 1. whatsapp-webhook
Create a new Edge Function named `whatsapp-webhook` with this code:

```typescript
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

    if (req.method === 'GET') {
      // WhatsApp webhook verification
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')
      
      const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN')
      
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('WhatsApp webhook verified')
        return new Response(challenge, { status: 200, headers: corsHeaders })
      } else {
        return new Response('Verification failed', { status: 403, headers: corsHeaders })
      }
    }

    if (req.method === 'POST') {
      const body = await req.json()
      console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2))

      const entry = body.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value

      if (value?.messages) {
        for (const message of value.messages) {
          await handleIncomingMessage(supabase, message)
        }
      }

      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function handleIncomingMessage(supabase: any, message: any) {
  const phoneNumber = message.from
  const messageText = message.text?.body?.toLowerCase() || ''

  // Find user by phone number
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('whatsapp_number', `+${phoneNumber}`)
    .single()

  let responseMessage = ''

  switch (messageText.trim()) {
    case 'help':
      responseMessage = `🆘 SkillBoost Kenya Help\n\nCommands:\n• NEXT - Get next lesson\n• STOP - Pause lessons\n• START - Resume lessons\n• STATUS - Check progress\n\nNeed help? Visit skillboost-kenya.lovable.app`
      break
    case 'stop':
      if (user) {
        await supabase.from('users').update({ is_active: false }).eq('id', user.id)
      }
      responseMessage = "⏸️ Lessons paused. Reply START to resume anytime."
      break
    case 'start':
      if (user) {
        await supabase.from('users').update({ is_active: true }).eq('id', user.id)
      }
      responseMessage = "🎉 Welcome back! Your lessons will resume tomorrow."
      break
    case 'next':
      if (user) {
        const nextLesson = await getNextLesson(supabase, user.id)
        if (nextLesson) {
          responseMessage = formatLessonMessage(nextLesson)
        } else {
          responseMessage = "🎉 You've completed all available lessons!"
        }
      }
      break
    default:
      responseMessage = `Thanks for your message! Try: HELP, NEXT, STOP, START\n\nVisit: skillboost-kenya.lovable.app`
  }

  if (responseMessage) {
    await sendWhatsAppMessage(phoneNumber, responseMessage)
  }
}

async function getNextLesson(supabase: any, userId: string) {
  const { data: enrollments } = await supabase
    .from('user_enrollments')
    .select('track_id')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (!enrollments?.length) return null

  const { data: completedLessons } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', userId)

  const completedLessonIds = completedLessons?.map(p => p.lesson_id) || []

  const { data: nextLesson } = await supabase
    .from('lessons')
    .select('*, learning_tracks(title)')
    .in('track_id', enrollments.map(e => e.track_id))
    .not('id', 'in', `(${completedLessonIds.join(',') || 'null'})`)
    .order('lesson_number')
    .limit(1)
    .single()

  return nextLesson
}

function formatLessonMessage(lesson: any) {
  return `📚 ${lesson.title}\nTrack: ${lesson.learning_tracks?.title}\n\n${lesson.content}\n\n💡 Tip: ${lesson.tip}\n\nReply NEXT for more!`
}

async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  
  if (!accessToken || !phoneNumberId) {
    console.error('WhatsApp credentials not configured')
    return false
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: message }
      })
    })

    return response.ok
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error)
    return false
  }
}
```

### 2. mpesa-callback
Create a new Edge Function named `mpesa-callback` with this code:

```typescript
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
      return new Response('Invalid callback format', { status: 400, headers: corsHeaders })
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID
    const resultCode = stkCallback.ResultCode

    // Find the payment record
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('checkout_request_id', checkoutRequestId)
      .single()

    if (!payment) {
      return new Response('Payment not found', { status: 404, headers: corsHeaders })
    }

    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || []
      const mpesaReceiptNumber = callbackMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value

      await supabase
        .from('payments')
        .update({
          status: 'completed',
          mpesa_receipt_number: mpesaReceiptNumber,
          paid_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      // Activate subscription
      await activateSubscription(supabase, payment)

      console.log(`Payment successful: ${mpesaReceiptNumber}`)
    } else {
      // Payment failed
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id)
    }

    return new Response('OK', { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('M-Pesa callback error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function activateSubscription(supabase: any, payment: any) {
  const now = new Date()
  const expiresAt = payment.amount <= 50 
    ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)  // Weekly
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // Monthly

  await supabase
    .from('subscriptions')
    .insert({
      user_id: payment.user_id,
      plan_type: payment.amount <= 50 ? 'weekly' : 'monthly',
      amount: payment.amount,
      expires_at: expiresAt.toISOString(),
      status: 'active'
    })
}
```

### 3. lesson-scheduler
Create a new Edge Function named `lesson-scheduler` with this code:

```typescript
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

    console.log('Running lesson scheduler...')

    // Get active users with subscriptions
    const { data: users } = await supabase
      .from('users')
      .select(`id, name, whatsapp_number, subscriptions!inner(status, expires_at)`)
      .eq('is_active', true)
      .eq('subscriptions.status', 'active')
      .gt('subscriptions.expires_at', new Date().toISOString())

    let messagesSent = 0

    for (const user of users || []) {
      try {
        const nextLesson = await getNextLessonForUser(supabase, user.id)
        
        if (nextLesson) {
          const lessonSent = await sendLessonToUser(supabase, user, nextLesson)
          
          if (lessonSent) {
            messagesSent++
            
            await supabase
              .from('user_progress')
              .insert({
                user_id: user.id,
                lesson_id: nextLesson.id,
                completed_at: new Date().toISOString()
              })
          }
        }
      } catch (error) {
        console.error(`Error processing user ${user.name}:`, error)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      messagesSent,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Lesson scheduler error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function getNextLessonForUser(supabase: any, userId: string) {
  const { data: enrollments } = await supabase
    .from('user_enrollments')
    .select('track_id')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (!enrollments?.length) return null

  const { data: completedLessons } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', userId)

  const completedLessonIds = completedLessons?.map(p => p.lesson_id) || []

  const { data: nextLesson } = await supabase
    .from('lessons')
    .select('*, learning_tracks(title)')
    .in('track_id', enrollments.map(e => e.track_id))
    .not('id', 'in', `(${completedLessonIds.join(',') || 'null'})`)
    .order('lesson_number')
    .limit(1)
    .single()

  return nextLesson
}

async function sendLessonToUser(supabase: any, user: any, lesson: any) {
  const message = `📚 Today's SkillBoost Lesson\n\n${lesson.title}\n\n${lesson.content}\n\n💡 Pro Tip: ${lesson.tip}\n\nReply NEXT for more lessons!`

  const messageSent = await sendWhatsAppMessage(user.whatsapp_number, message)
  
  if (messageSent) {
    await supabase.from('whatsapp_messages').insert({
      user_id: user.id,
      phone_number: user.whatsapp_number.replace('+', ''),
      message_type: 'lesson',
      content: message,
      sent_at: new Date().toISOString(),
      delivered: true
    })
  }

  return messageSent
}

async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  
  if (!accessToken || !phoneNumberId) {
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

    return response.ok
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error)
    return false
  }
}
```

## Required Secrets in Supabase

Add these in Supabase Dashboard → Settings → Secrets:

### WhatsApp Business API
- `WHATSAPP_ACCESS_TOKEN` - Your WhatsApp Business API access token
- `WHATSAPP_PHONE_NUMBER_ID` - Your WhatsApp Business phone number ID
- `WHATSAPP_VERIFY_TOKEN` - Random string for webhook verification

### M-Pesa Integration
- `MPESA_CONSUMER_KEY` - Your M-Pesa consumer key
- `MPESA_CONSUMER_SECRET` - Your M-Pesa consumer secret
- `MPESA_SHORTCODE` - Your M-Pesa shortcode
- `MPESA_PASSKEY` - Your M-Pesa passkey

## Webhook URLs
After deploying the Edge Functions, you'll get URLs like:
- WhatsApp Webhook: `https://your-project.supabase.co/functions/v1/whatsapp-webhook`
- M-Pesa Callback: `https://your-project.supabase.co/functions/v1/mpesa-callback`

Use these URLs when configuring your WhatsApp Business API and M-Pesa Daraja API webhooks.
