
// WhatsApp integration utilities for SkillBoost Kenya
// This handles frontend WhatsApp integration logic

export interface WhatsAppMessage {
  to: string;
  message: string;
  type: 'welcome' | 'lesson' | 'reminder' | 'payment';
}

export const formatWhatsAppNumber = (phoneNumber: string): string => {
  // Remove all non-digits
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle Kenyan numbers
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return '+' + cleaned;
};

export const validateKenyanPhoneNumber = (phoneNumber: string): boolean => {
  const formatted = formatWhatsAppNumber(phoneNumber);
  // Kenyan numbers: +254[7|1]xxxxxxxx
  const kenyanRegex = /^\+254[71]\d{8}$/;
  return kenyanRegex.test(formatted);
};

export const createWelcomeMessage = (name: string, tracks: string[]): string => {
  return `🎉 Welcome to SkillBoost Kenya, ${name}!

You've successfully enrolled in:
${tracks.map(track => `• ${track}`).join('\n')}

🔥 Your first lesson will arrive soon!

Reply with:
• NEXT - Get next lesson
• STOP - Pause lessons  
• HELP - Get support

Ready to boost your skills? Let's go! 💪`;
};

export const createLessonMessage = (lesson: any): string => {
  return `📚 Today's SkillBoost Lesson

${lesson.title}
Track: ${lesson.track}

${lesson.content}

💡 Pro Tip: ${lesson.tip}

⏱️ Duration: ${lesson.duration} minutes

Reply NEXT for more lessons! 💪`;
};

export const createPaymentConfirmation = (amount: number, plan: string): string => {
  return `🎉 Payment Confirmed!

Amount: KES ${amount}
Plan: ${plan} Subscription

Your SkillBoost Kenya Premium is now active! 

✅ Unlimited lessons
✅ All learning tracks  
✅ Progress certificates
✅ Priority support

Your next lesson arrives tomorrow. Ready to boost your skills? 💪`;
};

// Simulate WhatsApp message sending for demo purposes
export const sendWhatsAppMessage = async (phoneNumber: string, message: string): Promise<boolean> => {
  console.log(`Sending WhatsApp message to ${phoneNumber}:`, message);
  
  // In production, this would connect to your Supabase Edge Function
  // For demo, we'll simulate the API call
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store message in localStorage for demo purposes
    const messages = JSON.parse(localStorage.getItem('whatsapp_messages') || '[]');
    messages.push({
      to: phoneNumber,
      message,
      timestamp: new Date().toISOString(),
      status: 'sent'
    });
    localStorage.setItem('whatsapp_messages', JSON.stringify(messages));
    
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return false;
  }
};

export const getMessageHistory = (): any[] => {
  return JSON.parse(localStorage.getItem('whatsapp_messages') || '[]');
};
