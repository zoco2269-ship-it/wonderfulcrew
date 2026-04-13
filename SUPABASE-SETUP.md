# WonderfulCrew Supabase 설정 가이드

## 1. Supabase 프로젝트 생성
1. https://supabase.com 접속 → New Project
2. Project name: wonderfulcrew
3. Region: Northeast Asia (ap-northeast-1) 권장

## 2. Storage 버킷 생성
SQL Editor에서 실행:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('wonderfulcrew', 'wonderfulcrew', true);

-- Storage 정책 (로그인 유저만 자기 폴더에 업로드)
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'wonderfulcrew' AND (storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Users can read own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'wonderfulcrew' AND (storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text);
```

## 3. DB 테이블 생성
SQL Editor에서 실행:

```sql
-- 연습 기록
CREATE TABLE practice_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  airline TEXT,
  stage TEXT,
  question TEXT,
  answer_text TEXT,
  score JSONB,
  feedback TEXT,
  video_path TEXT,
  audio_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 영상 기록 (레벨테스트/롤플레이 첫 영상)
CREATE TABLE video_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT, -- 'level_test' or 'roleplay_first'
  airline TEXT,
  storage_path TEXT NOT NULL,
  duration_sec INTEGER DEFAULT 0,
  tag TEXT DEFAULT '', -- 'before' or 'after'
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE video_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own video data" ON video_records FOR ALL TO authenticated USING (user_id = auth.uid()::text);
-- 관리자는 전체 조회 가능 (service_role key 사용);

-- AI 피드백
CREATE TABLE ai_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  page TEXT,
  question TEXT,
  student_answer TEXT,
  ai_feedback TEXT,
  model_answer TEXT,
  scores JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 레벨 테스트 결과
CREATE TABLE level_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  score INTEGER,
  level TEXT,
  level_ko TEXT,
  strengths TEXT[],
  improvements TEXT[],
  recommended_airlines JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 출석
CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  UNIQUE(user_id, date)
);

-- 토큰
CREATE TABLE user_tokens (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  tokens INTEGER DEFAULT 10,
  unlimited BOOLEAN DEFAULT false,
  purchase_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ
);

-- 코치 피드백 요청
CREATE TABLE coach_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT, -- 'video' or 'text'
  airline TEXT,
  stage TEXT,
  question TEXT,
  answer_text TEXT,
  video_url TEXT,
  coach_feedback TEXT,
  status TEXT DEFAULT 'pending', -- pending/completed/rejected
  created_at TIMESTAMPTZ DEFAULT now(),
  feedback_at TIMESTAMPTZ
);

-- RLS 정책 (Row Level Security)
ALTER TABLE practice_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_requests ENABLE ROW LEVEL SECURITY;

-- 유저는 자기 데이터만 접근
CREATE POLICY "Users own data" ON practice_records FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users own data" ON ai_feedback FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users own data" ON level_results FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users own data" ON attendance FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users own data" ON user_tokens FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users own data" ON coach_requests FOR ALL TO authenticated USING (user_id = auth.uid());
```

## 4. 환경변수 설정

### login.html 수정
```javascript
var SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
var SUPABASE_ANON_KEY = 'eyJ...YOUR_ANON_KEY...';
```

### Vercel 환경변수 (API Routes용)
```
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_KEY=eyJ...YOUR_SERVICE_KEY...
```

## 5. Authentication 설정
1. Supabase Dashboard → Authentication → Providers
2. Google: Client ID/Secret 입력 (Google Cloud Console에서 생성)
3. Site URL: https://wonderfulcrew.vercel.app
4. Redirect URLs: https://wonderfulcrew.vercel.app/login.html

## Storage 구조
```
wonderfulcrew/
  users/
    {user_id}/
      videos/
        interview_2026-04-13_Q1.webm
        roleplay_2026-04-13.webm
      audio/
        shadowing_2026-04-13.webm
        practice_2026-04-13.webm
```
