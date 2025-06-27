
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

    // This function should be called by a cron job daily
    console.log('Running lesson scheduler...')

    // Get all active users with their preferred lesson times
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        whatsapp_number,
        preferred_lesson_time,
        subscriptions!inner(status, expires_at)
      `)
      .eq('is_active', true)
      .eq('subscriptions.status', 'active')
      .gt('subscriptions.expires_at', new Date().toISOString())

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return new Response('Error fetching users', { status: 500, headers: corsHeaders })
    }

    console.log(`Found ${users?.length || 0} active users`)

    let lessonsScheduled = 0
    let messagesSent = 0

    for (const user of users || []) {
      try {
        // Check if user has already received a lesson today
        const today = new Date().toISOString().split('T')[0]
        const { data: todaysLesson } = await supabase
          .from('lesson_schedule')
          .select('*')
          .eq('user_id', user.id)
          .gte('scheduled_for', `${today}T00:00:00Z`)
          .lt('scheduled_for', `${today}T23:59:59Z`)
          .single()

        if (todaysLesson) {
          console.log(`User ${user.name} already has a lesson scheduled for today`)
          continue
        }

        // Get next lesson for user
        const nextLesson = await getNextLessonForUser(supabase, user.id)
        
        if (!nextLesson) {
          console.log(`No next lesson found for user ${user.name}`)
          continue
        }

        // Schedule the lesson for user's preferred time
        const lessonTime = new Date()
        lessonTime.setHours(
          parseInt(user.preferred_lesson_time.split(':')[0]),
          parseInt(user.preferred_lesson_time.split(':')[1]),
          0, 0
        )

        // If preferred time has passed today, schedule for tomorrow
        if (lessonTime <= new Date()) {
          lessonTime.setDate(lessonTime.getDate() + 1)
        }

        // Create lesson schedule entry
        await supabase
          .from('lesson_schedule')
          .insert({
            user_id: user.id,
            lesson_id: nextLesson.id,
            scheduled_for: lessonTime.toISOString()
          })

        lessonsScheduled++

        // Send the lesson immediately (for demo purposes)
        // In production, you'd schedule this based on preferred_lesson_time
        const lessonSent = await sendLessonToUser(supabase, user, nextLesson)
        
        if (lessonSent) {
          messagesSent++
          
          // Mark lesson as sent and completed
          await supabase
            .from('lesson_schedule')
            .update({
              sent_at: new Date().toISOString(),
              status: 'sent'
            })
            .eq('user_id', user.id)
            .eq('lesson_id', nextLesson.id)

          // Add to user progress
          await supabase
            .from('user_progress')
            .insert({
              user_id: user.id,
              lesson_id: nextLesson.id,
              completed_at: new Date().toISOString()
            })
        }

      } catch (error) {
        console.error(`Error processing user ${user.name}:`, error)
      }
    }

    // Also check for any pending scheduled lessons that should be sent now
    const { data: pendingLessons } = await supabase
      .from('lesson_schedule')
      .select(`
        *,
        users(name, whatsapp_number),
        lessons(*, learning_tracks(title))
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())

    for (const scheduledLesson of pendingLessons || []) {
      try {
        const lessonSent = await sendLessonToUser(
          supabase, 
          scheduledLesson.users, 
          scheduledLesson.lessons
        )

        if (lessonSent) {
          await supabase
            .from('lesson_schedule')
            .update({
              sent_at: new Date().toISOString(),
              status: 'sent'
            })
            .eq('id', scheduledLesson.id)

          messagesSent++
        } else {
          await supabase
            .from('lesson_schedule')
            .update({ status: 'failed' })
            .eq('id', scheduledLesson.id)
        }
      } catch (error) {
        console.error(`Error sending scheduled lesson:`, error)
      }
    }

    console.log(`Lesson scheduler completed: ${lessonsScheduled} scheduled, ${messagesSent} sent`)

    return new Response(JSON.stringify({
      success: true,
      lessonsScheduled,
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

  // Build the NOT IN clause properly
  let query = supabase
    .from('lessons')
    .select('*, learning_tracks(title)')
    .in('track_id', enrollments.map(e => e.track_id))
    .order('lesson_number')
    .limit(1)

  if (completedLessonIds.length > 0) {
    query = query.not('id', 'in', `(${completedLessonIds.join(',')})`)
  }

  const { data: nextLesson } = await query.single()
  return nextLesson
}

async function sendLessonToUser(supabase: any, user: any, lesson: any) {
  const message = `
📚 Today's SkillBoost Lesson

${lesson.title}
Track: ${lesson.learning_tracks?.title || 'General Skills'}

${lesson.content}

💡 Pro Tip: ${lesson.tip || 'Practice makes perfect!'}

⏱️ Duration: ${lesson.duration_minutes || 5} minutes

---
Reply NEXT for more lessons
Reply QUIZ to test your knowledge
Reply HELP for assistance

Keep learning! 💪
  `

  const messageSent = await sendWhatsAppMessage(user.whatsapp_number, message)
  
  if (messageSent) {
    // Log the sent message
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
    console.log('WhatsApp send result:', result)
    return response.ok
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error)
    return false
  }
}
