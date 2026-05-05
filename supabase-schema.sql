-- WonderfulCrew Supabase Schema
-- Supabase SQL Editor에서 실행하세요

-- 1. users 프로필 테이블 (auth.users와 별도)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  phone TEXT,
  age INTEGER,
  region TEXT,
  edu TEXT,
  apply_exp TEXT,
  eng_level TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free',
  plan_active BOOLEAN DEFAULT false,
  free_trial_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 기존 테이블에 새 컬럼 추가 (이미 운영 중일 때 — 한 번만 실행)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS edu TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS apply_exp TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS eng_level TEXT;

-- RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = auth_id);
CREATE POLICY "Service can manage all" ON public.users FOR ALL USING (auth.role() = 'service_role');

-- 자동 프로필 생성: 새 유저 가입 시
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. subscriptions 구독 테이블
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Service can manage subscriptions" ON public.subscriptions FOR ALL USING (auth.role() = 'service_role');

-- 3. payments 결제 테이블
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  plan TEXT,
  amount INTEGER NOT NULL DEFAULT 0,
  method TEXT DEFAULT 'innopay',
  tid TEXT,
  moid TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Service can manage payments" ON public.payments FOR ALL USING (auth.role() = 'service_role');

-- 4. practice_records 연습 기록
CREATE TABLE IF NOT EXISTS public.practice_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  airline TEXT,
  stage TEXT,
  question TEXT,
  answer_text TEXT,
  score INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.practice_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own records" ON public.practice_records FOR ALL USING (true);

-- 5. video_records 영상 기록
CREATE TABLE IF NOT EXISTS public.video_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT,
  airline TEXT,
  storage_path TEXT,
  duration_sec INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.video_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own videos" ON public.video_records FOR ALL USING (true);

-- 6. ai_feedback AI 피드백 기록
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  page TEXT,
  question TEXT,
  student_answer TEXT,
  ai_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own feedback" ON public.ai_feedback FOR ALL USING (true);

-- 7. level_results 레벨 테스트 결과
CREATE TABLE IF NOT EXISTS public.level_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  level TEXT,
  recommended_airlines JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.level_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own results" ON public.level_results FOR ALL USING (true);

-- 8. pending_deposits 무통장 입금 신청
CREATE TABLE IF NOT EXISTS public.pending_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  email TEXT NOT NULL,
  name TEXT,
  plan TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  depositor_name TEXT NOT NULL,
  phone TEXT,
  memo TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pending_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service can manage pending_deposits" ON public.pending_deposits FOR ALL USING (auth.role() = 'service_role');
