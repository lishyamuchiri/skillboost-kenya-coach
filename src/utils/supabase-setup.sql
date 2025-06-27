
-- SkillBoost Kenya Database Schema
-- Run this in your Supabase SQL Editor after connecting

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL UNIQUE,
  preferred_lesson_time TIME DEFAULT '09:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Learning tracks
CREATE TABLE IF NOT EXISTS learning_tracks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  total_lessons INTEGER DEFAULT 0,
  duration_weeks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default learning tracks
INSERT INTO learning_tracks (id, title, description, total_lessons, duration_weeks) VALUES
  ('digital', 'Digital Skills Mastery', 'Social media marketing, Excel basics, online selling', 21, 3),
  ('english', 'Business English Pro', 'Professional communication, writing, presentations', 28, 4),
  ('entrepreneurship', 'Hustle & Business', 'Business planning, customer service, financial literacy', 35, 5),
  ('vocational', 'Professional Skills', 'Accounting basics, project management, sales techniques', 42, 6)
ON CONFLICT (id) DO NOTHING;

-- User track enrollments
CREATE TABLE IF NOT EXISTS user_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  track_id TEXT REFERENCES learning_tracks(id),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, track_id)
);

-- Lessons
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id TEXT REFERENCES learning_tracks(id),
  lesson_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tip TEXT,
  duration_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(track_id, lesson_number)
);

-- User lesson progress
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score INTEGER NULL, -- For quizzes
  UNIQUE(user_id, lesson_id)
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'weekly', 'monthly')),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  phone_number TEXT NOT NULL,
  mpesa_receipt_number TEXT UNIQUE,
  checkout_request_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp messages log
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NULL,
  phone_number TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('welcome', 'lesson', 'reminder', 'response')),
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered BOOLEAN DEFAULT false,
  error_message TEXT NULL
);

-- Lesson schedule
CREATE TABLE IF NOT EXISTS lesson_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Functions to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_schedule ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your auth setup)
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Insert sample lessons
INSERT INTO lessons (track_id, lesson_number, title, content, tip) VALUES
  ('digital', 1, 'Social Media Basics', 'Social media marketing starts with understanding your audience. In Kenya, most people are active on WhatsApp (99%), Facebook (80%), and Instagram (45%). Focus on platforms where your customers spend time.', 'Post when your audience is online - typically 6-9 PM in Kenya'),
  ('digital', 2, 'Creating Engaging Content', 'Good content tells a story. Use local languages (Swahili/English mix), share customer testimonials, and post behind-the-scenes content. People buy from brands they trust.', 'Use Before & After photos to show your products impact'),
  ('digital', 3, 'WhatsApp Business Marketing', 'WhatsApp Business lets you create a professional presence. Set up business hours, automated messages, and product catalogs. Use WhatsApp Status to showcase your products daily.', 'Always respond to messages within 30 minutes for better customer satisfaction'),
  ('english', 1, 'Professional Email Writing', 'A professional email has: Clear subject line, polite greeting, main message in first paragraph, and professional closing. Example: Dear Mr. Kamau, I hope this email finds you well...', 'Always proofread before sending - typos hurt your credibility'),
  ('english', 2, 'Business Phone Conversations', 'Start with a professional greeting: Good morning, this is [Name] from [Company]. Speak clearly, listen actively, and always confirm next steps before ending the call.', 'Smile while talking on the phone - people can hear it in your voice'),
  ('entrepreneurship', 1, 'Customer Service Excellence', 'Great customer service means: Listen actively, respond quickly, solve problems, and follow up. In Kenyas competitive market, service quality differentiates you from competitors.', 'Always say Thank you and mean it - gratitude builds loyalty'),
  ('entrepreneurship', 2, 'Basic Financial Management', 'Track your money: Income minus expenses equals profit. Keep business and personal money separate. Save 10% of profits for emergencies. Use simple apps like Excel or notebook to track daily sales.', 'Count your money every evening - daily tracking prevents big surprises'),
  ('vocational', 1, 'Time Management for Productivity', 'Use the 80/20 rule: 80% of results come from 20% of efforts. Focus on high-impact activities first. Plan your day the night before. Set specific times for checking messages.', 'Start your day with your most important task while your energy is high'),
  ('vocational', 2, 'Basic Project Management', 'Every project needs: Clear goal, timeline, budget, and responsible person. Break big tasks into smaller steps. Track progress weekly. Communicate updates to all stakeholders regularly.', 'Write everything down - memory is unreliable, documentation is forever')
ON CONFLICT (track_id, lesson_number) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON users(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_user_id ON user_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_lesson_schedule_user_id ON lesson_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_schedule_scheduled_for ON lesson_schedule(scheduled_for);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
