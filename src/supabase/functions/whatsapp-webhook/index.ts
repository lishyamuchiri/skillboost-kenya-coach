
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
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
        return new Response(challenge, { 
          status: 200,
          headers: corsHeaders 
        })
      } else {
        return new Response('Verification failed', { 
          status: 403,
          headers: corsHeaders 
        })
      }
    }

    if (req.method === 'POST') {
      // Handle incoming WhatsApp messages
      const body = await req.json()
      console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2))

      const entry = body.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value

      if (value?.messages) {
        for (const message of value.messages) {
          await handleIncomingMessage(supabase, message, value.metadata)
        }
      }

      // Handle message status updates
      if (value?.statuses) {
        for (const status of value.statuses) {
          await handleMessageStatus(supabase, status)
        }
      }

      return new Response('OK', { 
        status: 200,
        headers: corsHeaders 
      })
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function handleIncomingMessage(supabase: any, message: any, metadata: any) {
  const phoneNumber = message.from
  const messageText = message.text?.body?.toLowerCase() || ''
  const messageId = message.id

  console.log(`Received message from ${phoneNumber}: ${messageText}`)

  // Find user by phone number
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('whatsapp_number', `+${phoneNumber}`)
    .single()

  // Log incoming message
  await supabase.from('whatsapp_messages').insert({
    user_id: user?.id || null,
    phone_number: phoneNumber,
    message_type: 'incoming',
    content: messageText,
    sent_at: new Date().toISOString()
  })

  // Generate response based on message content
  let responseMessage = ''

  switch (messageText.trim()) {
    case 'help':
      responseMessage = `
🆘 SkillBoost Kenya Help

Commands:
• NEXT - Get next lesson
• STOP - Pause lessons  
• START - Resume lessons
• STATUS - Check progress
• QUIZ - Take a quiz
• UPGRADE - Premium plans

Need more help? Visit skillboost-kenya.lovable.app
      `
      break

    case 'stop':
      if (user) {
        await supabase
          .from('users')
          .update({ is_active: false })
          .eq('id', user.id)
      }
      responseMessage = "⏸️ Lessons paused. Reply START to resume anytime. We'll miss you!"
      break

    case 'start':
      if (user) {
        await supabase
          .from('users')
          .update({ is_active: true })
          .eq('id', user.id)
      }
      responseMessage = "🎉 Welcome back! Your lessons will resume tomorrow. Ready to learn?"
      break

    case 'next':
      if (user) {
        const nextLesson = await getNextLesson(supabase, user.id)
        if (nextLesson) {
          responseMessage = formatLessonMessage(nextLesson)
          await markLessonAsSent(supabase, user.id, nextLesson.id)
        } else {
          responseMessage = "🎉 You've completed all available lessons! Check back for new content or upgrade for advanced courses."
        }
      } else {
        responseMessage = "Please enroll first at skillboost-kenya.lovable.app"
      }
      break

    case 'status':
      if (user) {
        const progress = await getUserProgress(supabase, user.id)
        responseMessage = `
📊 Your SkillBoost Progress:

Lessons Completed: ${progress.completed_lessons}
Current Streak: ${progress.streak} days 🔥
Certificates Earned: ${progress.certificates}
Active Tracks: ${progress.active_tracks}

Keep it up! You're doing great! 💪
        `
      } else {
        responseMessage = "Please enroll first at skillboost-kenya.lovable.app"
      }
      break

    case 'upgrade':
      responseMessage = `
🚀 SkillBoost Premium Plans:

Weekly: KES 50/week
Monthly: KES 150/month

Benefits:
✅ Unlimited lessons
✅ All tracks included
✅ Progress certificates
✅ Priority support

Upgrade: skillboost-kenya.lovable.app
      `
      break

    default:
      responseMessage = `
Thanks for your message! 😊

I didn't understand "${messageText}". 

Try these commands:
• HELP - Get help
• NEXT - Next lesson
• STATUS - Your progress

Or visit: skillboost-kenya.lovable.app
      `
  }

  // Send response
  if (responseMessage) {
    await sendWhatsAppMessage(phoneNumber, responseMessage)
    
    // Log outgoing message
    await supabase.from('whatsapp_messages').insert({
      user_id: user?.id || null,
      phone_number: phoneNumber,
      message_type: 'response',
      content: responseMessage,
      sent_at: new Date().toISOString(),
      delivered: true
    })
  }
}

async function handleMessageStatus(supabase: any, status: any) {
  console.log('Message status update:', status)
  
  // Update message delivery status in database
  const { recipient_id, status: messageStatus, timestamp } = status
  
  await supabase
    .from('whatsapp_messages')
    .update({ 
      delivered: messageStatus === 'delivered' || messageStatus === 'read',
      updated_at: new Date(parseInt(timestamp) * 1000).toISOString()
    })
    .eq('phone_number', recipient_id)
    .order('sent_at', { ascending: false })
    .limit(1)
}

async function getNextLesson(supabase: any, userId: string) {
  // Get user's enrolled tracks
  const { data: enrollments } = await supabase
    .from('user_enrollments')
    .select('track_id')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (!enrollments?.length) return null

  // Get completed lessons
  const { data: completedLessons } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', userId)

  const completedLessonIds = completedLessons?.map(p => p.lesson_id) || []

  // Find next lesson from enrolled tracks
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

async function getUserProgress(supabase: any, userId: string) {
  // Get completed lessons count
  const { count: completedLessons } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)

  // Get active tracks count
  const { count: activeTracks } = await supabase
    .from('user_enrollments')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_active', true)

  // Calculate streak (simplified)
  const streak = 7 // This would be calculated based on recent lesson completion dates

  return {
    completed_lessons: completedLessons || 0,
    active_tracks: activeTracks || 0,
    certificates: Math.floor((completedLessons || 0) / 10), // 1 cert per 10 lessons
    streak
  }
}

async function markLessonAsSent(supabase: any, userId: string, lessonId: string) {
  await supabase.from('user_progress').insert({
    user_id: userId,
    lesson_id: lessonId,
    completed_at: new Date().toISOString()
  })
}

function formatLessonMessage(lesson: any) {
  return `
📚 ${lesson.title}
Track: ${lesson.learning_tracks?.title || 'SkillBoost'}

${lesson.content}

💡 Pro Tip: ${lesson.tip}

⏱️ Duration: ${lesson.duration_minutes} minutes

Reply NEXT for the next lesson or QUIZ to test your knowledge!
  `
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

    const result = await response.json()
    console.log('WhatsApp API response:', result)
    return response.ok
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error)
    return false
  }
}
