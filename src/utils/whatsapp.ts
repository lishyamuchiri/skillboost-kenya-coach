
// WhatsApp Business API Integration
export class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message }
        })
      });

      const result = await response.json();
      return response.ok;
    } catch (error) {
      console.error('WhatsApp message error:', error);
      return false;
    }
  }

  async sendWelcomeMessage(phoneNumber: string, name: string, tracks: string[]): Promise<boolean> {
    const message = `
🎉 Welcome to SkillBoost Kenya, ${name}!

You've successfully enrolled in:
${tracks.map(track => `• ${track}`).join('\n')}

🔥 Your first 5-minute lesson starts tomorrow!

Reply with:
• NEXT - Get next lesson  
• STOP - Pause lessons
• HELP - Get support
• STATUS - Check progress

Ready to boost your skills? Let's go! 💪

Visit: skillboost-kenya.lovable.app
    `;

    return this.sendMessage(phoneNumber, message);
  }

  async sendLessonMessage(phoneNumber: string, lesson: any): Promise<boolean> {
    const message = `
📚 ${lesson.title}
Track: ${lesson.track}

${lesson.content}

💡 Quick Tip: ${lesson.tip}

⏱️ Time: ${lesson.duration} minutes
Progress: ${lesson.progress}

Reply NEXT for the next lesson or QUIZ to test your knowledge!
    `;

    return this.sendMessage(phoneNumber, message);
  }

  async sendPaymentReminder(phoneNumber: string, name: string): Promise<boolean> {
    const message = `
Hi ${name}! 👋

Your SkillBoost Kenya free trial is ending soon. 

🔥 Upgrade to Premium for:
✅ Unlimited lessons
✅ All learning tracks
✅ Certificates
✅ Priority support

Pay KES 50/week or KES 150/month
Visit: skillboost-kenya.lovable.app/payment

Reply STOP to unsubscribe
    `;

    return this.sendMessage(phoneNumber, message);
  }

  async handleIncomingMessage(message: any): Promise<string> {
    const userMessage = message.text?.body?.toLowerCase() || '';
    const phoneNumber = message.from;

    switch (userMessage) {
      case 'help':
        return `
SkillBoost Kenya Help 🆘

Commands:
• NEXT - Get next lesson
• STOP - Pause lessons  
• START - Resume lessons
• STATUS - Check progress
• QUIZ - Take a quiz
• UPGRADE - Premium plans

Need more help? Visit skillboost-kenya.lovable.app
        `;

      case 'stop':
        // Update user status in database
        return "⏸️ Lessons paused. Reply START to resume anytime. We'll miss you!";

      case 'start':
        return "🎉 Welcome back! Your lessons will resume tomorrow. Ready to learn?";

      case 'next':
        // Get next lesson for user
        return "📚 Getting your next lesson ready...";

      case 'status':
        // Get user progress from database
        return `
📊 Your SkillBoost Progress:

Lessons Completed: 15/21
Current Track: Digital Skills
Streak: 7 days 🔥
Certificates: 2

Keep it up! You're doing great! 💪
        `;

      case 'quiz':
        return `
🧠 Quick Quiz Time!

Question: What's the best time to post on social media in Kenya?

A) 6-8 AM
B) 12-2 PM  
C) 6-9 PM
D) 10-12 PM

Reply with A, B, C, or D!
        `;

      case 'upgrade':
        return `
🚀 SkillBoost Premium Plans:

Weekly: KES 50/week
Monthly: KES 150/month

Benefits:
✅ Unlimited lessons
✅ All tracks included
✅ Progress certificates
✅ Priority support

Upgrade: skillboost-kenya.lovable.app/payment
        `;

      default:
        return `
Thanks for your message! 😊

I didn't understand "${userMessage}". 

Try these commands:
• HELP - Get help
• NEXT - Next lesson
• STATUS - Your progress

Or visit: skillboost-kenya.lovable.app
        `;
    }
  }
}

// Sample lesson content
export const sampleLessons = {
  digital: [
    {
      id: 1,
      title: "Social Media Basics",
      content: "Social media marketing starts with understanding your audience. In Kenya, most people are active on WhatsApp (99%), Facebook (80%), and Instagram (45%). Focus on platforms where your customers spend time.",
      tip: "Post when your audience is online - typically 6-9 PM in Kenya",
      duration: "5 min",
      track: "Digital Skills"
    },
    {
      id: 2,
      title: "Creating Engaging Content",
      content: "Good content tells a story. Use local languages (Swahili/English mix), share customer testimonials, and post behind-the-scenes content. People buy from brands they trust.",
      tip: "Use 'Before & After' photos to show your product's impact",
      duration: "5 min",
      track: "Digital Skills"
    }
  ],
  english: [
    {
      id: 1,
      title: "Professional Email Writing",
      content: "A professional email has: Clear subject line, polite greeting, main message in first paragraph, and professional closing. Example: 'Dear Mr. Kamau, I hope this email finds you well...'",
      tip: "Always proofread before sending - typos hurt your credibility",
      duration: "5 min",
      track: "Business English"
    }
  ],
  entrepreneurship: [
    {
      id: 1,
      title: "Customer Service Excellence",
      content: "Great customer service means: Listen actively, respond quickly, solve problems, and follow up. In Kenya's competitive market, service quality differentiates you from competitors.",
      tip: "Always say 'Thank you' and mean it - gratitude builds loyalty",
      duration: "5 min",
      track: "Entrepreneurship"
    }
  ]
};
