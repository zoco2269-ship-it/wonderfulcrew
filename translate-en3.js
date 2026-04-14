const fs=require('fs');

function tr(file, pairs) {
  if (!fs.existsSync(file)) { console.log('SKIP:', file); return; }
  let html = fs.readFileSync(file, 'utf8');
  let c = 0;
  pairs.forEach(([k, v]) => {
    if (html.includes(k)) { html = html.split(k).join(v); c++; }
  });
  if (c > 0) { fs.writeFileSync(file, html, 'utf8'); console.log(file + ': ' + c); }
}

// ===== hotel-en.html =====
tr('hotel-en.html', [
  ['국내 최고급 호텔부터 글로벌 럭셔리 브랜드까지, 면접 프로세스와 실전 연습을 한 곳에서.', 'From top domestic hotels to global luxury brands — interview process and practice all in one place.'],
  ["name:'롯데호텔'", "name:'Lotte Hotel'"],
  ["name:'신라호텔'", "name:'The Shilla'"],
  ["name:'파크하얏트'", "name:'Park Hyatt'"],
  ["name:'JW메리어트'", "name:'JW Marriott'"],
  ["name:'포시즌스'", "name:'Four Seasons'"],
  ["name:'인터컨티넨탈'", "name:'InterContinental'"],
  ["name:'조선팰리스'", "name:'Josun Palace'"],
  ["name:'리츠칼튼'", "name:'The Ritz-Carlton'"],
  ["name:'워커힐'", "name:'Walkerhill'"],
  ['호텔 면접 프로세스', 'Hotel Interview Process'],
  ['서류전형 → 1차 면접 → 2차 면접 (부서장) → 임원면접 → 건강검진', 'Document Screening → 1st Interview → 2nd Interview (Dept. Head) → Executive Interview → Health Check'],
  ['더미 점수   AI 연동 후 활성화', 'Demo score — activated after AI integration'],
  ['시작하기', 'Start'],
  ['브랜드를 선택하세요', 'Select a brand'],
  ['호텔 · 럭셔리', 'Hotel & Luxury'],
]);

// ===== cruise-en.html =====
tr('cruise-en.html', [
  ['크루즈 선사', 'Cruise Line'],
  ['글로벌 크루즈 선사 면접은 전 과정 영어로 진행됩니다. 실전 영어 면접을 연습하세요.', 'Global cruise line interviews are conducted entirely in English. Practice your English interview skills here.'],
  ['<b>참고:</b> 크루즈 면접은 전 단계 영어로만 진행됩니다. 6개월 이상 장기 승선이 기본이므로 홈시크 대처 능력도 중요한 평가 항목입니다.', '<b>Note:</b> Cruise interviews are entirely in English. Long-term assignments of 6+ months are standard, so coping with homesickness is also evaluated.'],
  ["name:'로얄캐리비안'", "name:'Royal Caribbean'"],
  ['크루즈 면접 프로세스', 'Cruise Interview Process'],
  ['서류/CV 제출 → 에이전시 면접 → 본사 면접 → 서류 준비 → 안전교육 → 승선', 'CV Submission → Agency Interview → HQ Interview → Document Prep → Safety Training → Boarding'],
  ['에이전시 면접 (영어)', 'Agency Interview (English)'],
  ['이미지 피드백 (카메라 ON)', 'Image Feedback (Camera ON)'],
  ['본사 면접 (영어)', 'Headquarters Interview (English)'],
  ['롤플레이: 기내 컴플레인 상황 (영어)', 'Roleplay: Complaint Scenario (English)'],
  ['더미 점수   AI 연동 후 활성화', 'Demo score — activated after AI integration'],
  ['시작하기', 'Start'],
  ['브랜드를 선택하세요', 'Select a brand'],
]);

// ===== my-progress-en.html =====
tr('my-progress-en.html', [
  ['연습할수록 올라가는 내 실력을 확인하세요.', 'Track your growing skills with every practice session.'],
  ['종합 실력 분석', 'Overall Skills Analysis'],
  ['>유창성<', '>Fluency<'],
  ['>자신감<', '>Confidence<'],
  ['>내용 구성<', '>Structure<'],
  ['>발음<', '>Pronunciation<'],
  ['>서비스 마인드<', '>Service Mind<'],
  ['토큰 현황', 'Token Status'],
  ['보유 토큰', 'Tokens Held'],
  ['만료일', 'Expiry'],
  ['이번 달 사용', 'Used This Month'],
  ['출석 현황', 'Attendance Status'],
  ['연속 출석', 'Streak'],
  ['총 출석', 'Total'],
  ['최장 연속', 'Best Streak'],
  ['목표 항공사', 'Target Airline'],
  ['목표 항공사 선택', 'Select Target Airline'],
  ['>에미레이트<', '>Emirates<'],
  ['>카타르<', '>Qatar<'],
  ['>싱가포르<', '>Singapore<'],
  ['>캐세이퍼시픽<', '>Cathay Pacific<'],
  ['>대한항공<', '>Korean Air<'],
  ['>아시아나<', '>Asiana<'],
  ['>제주항공<', '>Jeju Air<'],
  ['>진에어<', '>Jin Air<'],
  ['목표 항공사를 선택해주세요', 'Please select your target airline'],
  ['획득 배지', 'Earned Badges'],
  ['3일 연속 출석', '3-Day Streak'],
  ['첫 영어 쉐도잉', 'First Shadowing'],
  ['첫 롤플레이', 'First Roleplay'],
  ['7일 연속 출석', '7-Day Streak'],
  ['30일 연속 출석', '30-Day Streak'],
  ['파이널 면접 통과', 'Final Interview Pass'],
  ['올 커리큘럼 완료', 'All Curriculum Done'],
  ['최근 연습 기록', 'Recent Practice History'],
  ['>날짜<', '>Date<'],
  ['>항공사<', '>Airline<'],
  ['>단계<', '>Stage<'],
  ['>점수<', '>Score<'],
  ['>피드백 요약<', '>Feedback<'],
  ['에미레이트', 'Emirates'],
  ['카타르', 'Qatar'],
  ['롤플레이', 'Roleplay'],
  ['영어 쉐도잉', 'Shadowing'],
  ['파이널 면접', 'Final Interview'],
  ['사과와 공감 표현이 자연스러움', 'Natural apology and empathy'],
  ['해결책 제시 속도 향상 필요', 'Needs faster solution delivery'],
  ['발음 정확도 우수', 'Excellent pronunciation'],
  ['구체적 경험 추가하면 더 좋음', 'Add more specific experiences'],
  ['Service Recovery 개념 적용 잘함', 'Good Service Recovery application'],
  ['더미 데이터 (Supabase 연동 후 실제 데이터 표시)', 'Demo data (actual data after Supabase integration)'],
  ["'유창성','자신감','내용구성','발음','서비스'", "'Fluency','Confidence','Structure','Pronunciation','Service'"],
  ["'일','월','화','수','목','금','토'", "'Sun','Mon','Tue','Wed','Thu','Fri','Sat'"],
  ['출석왕', 'Attendance King'],
  ['롤플레이 마스터', 'Roleplay Master'],
  ['연습 기록이 없습니다', 'No practice records yet'],
  ['코치 코멘트', 'Coach Comments'],
  ['아직 코치 피드백이 없습니다', 'No coach feedback yet'],
]);

// ===== login-en.html =====
tr('login-en.html', [
  ['WonderfulCrew 계정으로 로그인하세요.', 'Sign in to your WonderfulCrew account.'],
  ['Google 계정으로 로그인', 'Sign in with Google'],
  ['카카오 계정으로 로그인', 'Sign in with Kakao'],
  ['네이버 계정으로 로그인', 'Sign in with Naver'],
  ['또는</div>', 'or</div>'],
  ['이메일 주소', 'Email address'],
  ['비밀번호', 'Password'],
  ['이메일로 로그인', 'Sign in with Email'],
  ['아직 계정이 없으신가요?', "Don't have an account?"],
  ['회원가입', 'Sign up'],
  ['비밀번호 찾기', 'Forgot password?'],
  ['이메일과 비밀번호를 입력해주세요.', 'Please enter your email and password.'],
  ['로그인 성공!', 'Sign in successful!'],
  ['로그인에 실패했습니다.', 'Sign in failed.'],
]);

// ===== lecture-en.html =====
tr('lecture-en.html', [
  ['강의 영상은 수강생 전용입니다', 'Video lectures are for enrolled students only'],
  ['올패키지 또는 강의 수강권을 구매하시면', 'Purchase the all-in-one package or lecture pass to'],
  ['모든 강의 영상을 무제한으로 시청할 수 있습니다.', 'watch all lecture videos unlimited.'],
  ['수강 신청하기 →', 'Enroll Now →'],
  ['오픈데이, 스몰톡', 'Open Day & Small Talk'],
  ['오픈데이 당일 유의사항, 스몰톡 주제 준비, 대화 이어가는 법', 'Open Day tips, small talk topics, how to keep conversations going'],
  ['그룹 디스커션 완벽 대비', 'Group Discussion Prep'],
  ['그룹 디스커션에서 돋보이는 법', 'How to stand out in group discussions'],
  ['파이널 면접 실전', 'Final Interview Practice'],
  ['파이널 면접 핵심 질문 분석과 모범 답변', 'Final interview key questions and model answers'],
  ['이미지 메이킹 & 그루밍', 'Image Making & Grooming'],
  ['항공사별 그루밍 기준과 면접 당일 체크리스트', 'Airline grooming standards and interview day checklist'],
  ['서비스 마인드 & 기내 영어', 'Service Mind & In-flight English'],
  ['서비스 철학과 기내에서 쓰는 핵심 영어 표현', 'Service philosophy and essential in-flight English expressions'],
  ['잠금됨   수강생 전용', 'Locked — Students Only'],
]);

// ===== live-booking-en.html =====
tr('live-booking-en.html', [
  ['전문 코치와 함께하는 오프라인/온라인 라이브 수업. 실전 Interview Practice부터 1:1 피드백까지.', 'Live classes with professional coaches. From mock interviews to 1:1 feedback.'],
  ['<b>올인원 패키지 구매자</b>는 6개월 이내 모든 라이브 수업 우선 배정됩니다.', '<b>All-in-one package buyers</b> get priority booking for all live classes within 6 months.'],
  ['오프라인 · 홍대', 'Offline · Seoul'],
  ['에미레이트 면접 실전 연습', 'Emirates Interview Practice'],
  ['장소: 홍대 스터디룸', 'Location: Seoul Study Room'],
  ['상세 주소는 예약 확정 후 안내', 'Detailed address provided after booking confirmation'],
  ['온라인 · Zoom', 'Online · Zoom'],
  ['영어 면접 1:1 코칭', 'English Interview 1:1 Coaching'],
  ['롤플레이 실전 연습 + 즉석 피드백', 'Roleplay practice + instant feedback'],
  ['그룹 디스커션 연습', 'Group Discussion Practice'],
  ['이미지 메이킹 워크숍', 'Image Making Workshop'],
  ['전체 면접 시뮬레이션', 'Full Interview Simulation'],
  ['예약 완료! 수업 30분 전 알림을 보내드리겠습니다.', 'Booking confirmed! We will send a reminder 30 minutes before class.'],
  ['대기 등록 완료! 자리가 나면 알림을 보내드리겠습니다.', 'Waitlist registered! We will notify you when a spot opens.'],
  ['프리미엄 패키지 구매 후 예약 가능합니다.', 'Available after Premium Package purchase.'],
  ['잔여석', 'Seats left'],
  ['명', 'spots'],
]);

// ===== chatbot-en.html =====
tr('chatbot-en.html', [
  ['승무원 면접 전용 코치', 'AI Interview Coach'],
  ['승무원 지망생 전용 1:1 코칭', 'Personal 1:1 coaching for aspiring crew'],
  ['무료 2회', '2 Free'],
  ['응답을 생성하고 있어요...', 'Generating response...'],
  ['질문을 입력하세요...', 'Ask your question...'],
  ['메시지를 입력해주세요.', 'Please enter a message.'],
  ['답변을 생성하지 못했습니다.', 'Failed to generate a response.'],
  ['무료 체험이 끝났습니다. 월정액 구독 후 무제한으로 이용하세요!', 'Free trial ended. Subscribe for unlimited access!'],
]);

// ===== ai-coach-en.html =====
tr('ai-coach-en.html', [
  ['질문에 대한 답변을 입력하면 AI가 즉시 피드백을 제공합니다.', 'Enter your answer and get instant AI feedback.'],
  ['WonderfulCrew Service Philosophy 기반으로 분석합니다.', 'Analysis based on WonderfulCrew Service Philosophy.'],
  ['AI 코칭 피드백', 'AI Coaching Feedback'],
  ['여기에 AI 피드백이 표시됩니다.', 'AI feedback will appear here.'],
  ['분석할 답변을 입력해주세요.', 'Please enter an answer to analyze.'],
  ['피드백을 생성하지 못했습니다.', 'Failed to generate feedback.'],
  ['>에미레이트</option>', '>Emirates</option>'],
  ['>카타르</option>', '>Qatar</option>'],
  ['>싱가포르항공</option>', '>Singapore Airlines</option>'],
  ['>캐세이퍼시픽</option>', '>Cathay Pacific</option>'],
  ['>대한항공</option>', '>Korean Air</option>'],
  ['>아시아나</option>', '>Asiana</option>'],
  ['>제주항공</option>', '>Jeju Air</option>'],
  ['>진에어</option>', '>Jin Air</option>'],
  ['질문을 선택하세요', 'Select a question'],
  ['답변을 입력하세요...', 'Enter your answer...'],
  ['AI 피드백 받기', 'Get AI Feedback'],
  ['분석 중...', 'Analyzing...'],
]);

// ===== coach-feedback-en.html =====
tr('coach-feedback-en.html', [
  ['에미레이트 7년 일등석 승무원 출신 · 20년 코칭 경력 · 1,000+ 합격생 배출', '7 years Emirates first-class crew · 20 years coaching · 1,000+ successful placements'],
  ['AI가 아닌 진짜 사람의 눈으로 당신의 면접을 봐드립니다.', 'Real human eyes reviewing your interview, not just AI.'],
  ['>에미레이트</option>', '>Emirates</option>'],
  ['>카타르</option>', '>Qatar</option>'],
  ['>싱가포르항공</option>', '>Singapore Airlines</option>'],
  ['>캐세이퍼시픽</option>', '>Cathay Pacific</option>'],
  ['>대한항공</option>', '>Korean Air</option>'],
  ['>아시아나</option>', '>Asiana</option>'],
  ['>제주항공</option>', '>Jeju Air</option>'],
  ['>진에어</option>', '>Jin Air</option>'],
  ['면접 단계</label>', 'Interview Stage</label>'],
  ['>비디오 면접</option>', '>Video Interview</option>'],
  ['>1차 면접</option>', '>1st Interview</option>'],
  ['>2차 면접</option>', '>2nd Interview</option>'],
  ['>파이널</option>', '>Final</option>'],
  ['영상 링크 (구글 드라이브)</label>', 'Video Link (Google Drive)</label>'],
  ['구글 드라이브 공유 링크를 넣어주세요', 'Paste your Google Drive sharing link'],
  ['추가 메모</label>', 'Additional Notes</label>'],
  ['코치에게 전달하고 싶은 내용이 있다면 적어주세요', 'Any additional notes for the coach'],
  ['제출하기', 'Submit'],
  ['질문을 입력하세요</label>', 'Enter the Question</label>'],
  ['면접 질문을 입력하세요', 'Enter the interview question'],
  ['답변을 입력하세요</label>', 'Enter Your Answer</label>'],
  ['답변을 작성하세요 (200자 이상 권장)', 'Write your answer (200+ characters recommended)'],
  ['코치 피드백 예시</h3>', 'Coach Feedback Example</h3>'],
]);

// ===== walking-analysis-en.html =====
tr('walking-analysis-en.html', [
  ['워킹 & 자세 <em>AI 분석</em>', 'Walking & Posture <em>AI Analysis</em>'],
  ['국내 항공사는 워킹과 다리 라인을 중점적으로 평가합니다. AI가 당신의 워킹 영상을 분석해 개선 포인트를 알려드립니다.', 'Airlines evaluate walking posture and leg alignment carefully. Our AI analyzes your walking video and provides improvement points.'],
  ['촬영 가이드', 'Recording Guide'],
  ['<strong>전신이 보이게</strong> 촬영 (머리부터 발끝까지)', '<strong>Full body visible</strong> (head to toe)'],
  ['<strong>정면 + 측면</strong> 두 각도 권장', '<strong>Front + side</strong> views recommended'],
  ['<strong>밝은 곳</strong>에서 촬영', 'Record in a <strong>well-lit area</strong>'],
  ['<strong>5~10초</strong> 자연스럽게 걷기', '<strong>5-10 seconds</strong> of natural walking'],
  ['영상 업로드', 'Upload Video'],
  ['워킹 영상을 선택해주세요', 'Please select your walking video'],
  ['분석 시작', 'Start Analysis'],
  ['AI 분석 결과', 'AI Analysis Results'],
  ['자세 (Posture)', 'Posture'],
  ['어깨 정렬', 'Shoulder Alignment'],
  ['골반 균형', 'Hip Balance'],
  ['다리 라인', 'Leg Line'],
  ['걸음 패턴', 'Walking Pattern'],
  ['보폭 균일도', 'Stride Consistency'],
  ['착지 안정성', 'Landing Stability'],
  ['속도 리듬', 'Speed Rhythm'],
  ['팔 스윙', 'Arm Swing'],
  ['시선 처리', 'Eye Contact'],
  ['종합 점수', 'Overall Score'],
  ['개선 포인트', 'Improvement Points'],
  ['더미 분석 결과입니다. AI 연동 후 실제 분석이 제공됩니다.', 'Demo analysis results. Actual analysis available after AI integration.'],
  ['영상을 먼저 업로드해주세요.', 'Please upload a video first.'],
]);

console.log('=== Pass 3 complete ===');
