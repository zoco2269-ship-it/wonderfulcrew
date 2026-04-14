const fs=require('fs');

const map = [
  // Feedback
  ['피드백 <em>남기기</em>', 'Leave <em>Feedback</em>'],
  ['피드백 남기기 WonderfulCrew', 'Leave Feedback — WonderfulCrew'],
  ['원더풀크루를 더 좋게 만들어주세요. 모든 피드백을 소중히 읽겠습니다.', 'Help us improve WonderfulCrew. We carefully read every piece of feedback.'],
  ['이름</label>', 'Name</label>'],
  ['이메일</label>', 'Email</label>'],
  ['전화번호</label>', 'Phone</label>'],
  ['카테고리</label>', 'Category</label>'],
  ['피드백 내용</label>', 'Feedback</label>'],
  ['placeholder="이름"', 'placeholder="Your name"'],
  ['placeholder="이메일"', 'placeholder="Your email"'],
  ['placeholder="전화번호"', 'placeholder="Your phone number"'],
  ['기능 개선 요청', 'Feature request'],
  ['버그 신고', 'Bug report'],
  ['콘텐츠 제안', 'Content suggestion'],
  ['칭찬/감사', 'Praise / Thanks'],
  ['기타</option>', 'Other</option>'],
  ['자유롭게 작성해주세요.', 'Write freely here.'],
  ['피드백 제출', 'Submit Feedback'],
  ['감사합니다!</h2>', 'Thank you!</h2>'],
  ['소중한 피드백이 제출되었습니다.', 'Your feedback has been submitted.'],
  ['더 나은 원더풀크루를 만들겠습니다.', 'We will keep improving WonderfulCrew.'],
  ['피드백 내용을 입력해주세요.', 'Please enter your feedback.'],

  // Login
  ['로그인   WonderfulCrew', 'Sign In — WonderfulCrew'],
  ['간편 <em>로그인</em>', 'Quick <em>Sign In</em>'],
  ['Google, 카카오, 네이버, 이메일 중 편한 방법으로 로그인하세요.', 'Sign in with Google, Kakao, Naver, or email.'],
  ['Google로 시작', 'Continue with Google'],
  ['카카오로 시작', 'Continue with Kakao'],
  ['네이버로 시작', 'Continue with Naver'],
  ['이메일로 시작', 'Continue with Email'],
  ['로그인하면 학습 기록이 자동 저장됩니다.', 'Your learning progress is saved automatically when signed in.'],

  // Settings
  ['설정   WonderfulCrew', 'Settings — WonderfulCrew'],
  ['알림 <em>설정</em>', 'Notification <em>Settings</em>'],
  ['원하는 알림만 켜고 불필요한 알림은 끌 수 있습니다.', 'Turn on the notifications you want and turn off the rest.'],
  ['채용 공고 알림', 'Job Posting Alerts'],
  ['새로운 항공사 채용 공고가 등록되면 알림', 'Get notified when new airline job postings are added'],
  ['라이브 수업 알림', 'Live Class Alerts'],
  ['라이브 수업 시작 30분 전 알림', 'Get notified 30 minutes before live class starts'],
  ['코치 피드백 알림', 'Coach Feedback Alerts'],
  ['코치가 내 영상/답변에 피드백을 남기면 알림', 'Get notified when a coach leaves feedback'],
  ['커뮤니티 알림', 'Community Alerts'],
  ['새로운 스터디 모집글이나 합격 후기가 올라오면 알림', 'Get notified about new study groups or success stories'],
  ['토큰 알림', 'Token Alerts'],
  ['토큰 만료 3일 전 알림', 'Get notified 3 days before token expiration'],
  ['알림 설정이 저장되었습니다.', 'Notification settings saved.'],
  ['설정 저장', 'Save Settings'],

  // Leveltest
  ['레벨 테스트   WonderfulCrew', 'Level Test — WonderfulCrew'],
  ['나의 면접 <em>레벨 테스트</em>', 'My Interview <em>Level Test</em>'],
  ['현재 실력을 측정하고 맞춤 학습 계획을 받아보세요.', 'Measure your current level and get a personalized study plan.'],
  ['테스트 시작', 'Start Test'],
  ['소요 시간: 약 5분', 'Duration: about 5 minutes'],
  ['레벨 테스트 결과', 'Level Test Results'],
  ['추천 학습 과정', 'Recommended Courses'],

  // About
  ['소개   WonderfulCrew', 'About — WonderfulCrew'],
  ['원더풀크루 <em>소개</em>', 'About <em>WonderfulCrew</em>'],
  ['서비스 철학', 'Service Philosophy'],
  ['자문단', 'Advisory Board'],
  ['대표 소개', 'Founder'],

  // Jobs
  ['항공사 채용 정보   WonderfulCrew', 'Airline Careers — WonderfulCrew'],
  ['항공사 <em>채용 정보</em>', 'Airline <em>Careers</em>'],
  ['최신 항공사 채용 공고와 일정을 한눈에 확인하세요.', 'View the latest airline job postings and schedules at a glance.'],
  ['채용 공고', 'Job Postings'],
  ['진행 중', 'Open'],
  ['마감', 'Closed'],
  ['상시채용', 'Rolling'],
  ['지원하기', 'Apply'],
  ['상세보기', 'Details'],
  ['채용 일정', 'Recruitment Schedule'],

  // Community
  ['커뮤니티   WonderfulCrew', 'Community — WonderfulCrew'],
  ['원더풀크루 <em>커뮤니티</em>', 'WonderfulCrew <em>Community</em>'],
  ['함께 준비하면 합격이 가까워집니다.', 'Prepare together, get closer to success.'],
  ['스터디 모집', 'Study Groups'],
  ['자유 게시판', 'Free Board'],
  ['면접 후기', 'Interview Reviews'],
  ['합격 후기', 'Success Stories'],
  ['스터디원 모집 중', 'Recruiting study partners'],
  ['모집 완료', 'Recruitment closed'],
  ['참여하기', 'Join'],
  ['글쓰기', 'Write'],
  ['위치 기반 매칭', 'Location-based Matching'],

  // Token Rewards
  ['토큰 충전 & 리워드   WonderfulCrew', 'Tokens & Rewards — WonderfulCrew'],
  ['토큰 충전 & <em>리워드</em>', 'Tokens & <em>Rewards</em>'],
  ['매일 출석하고 친구 초대하면 무료 토큰을 받을 수 있어요.', 'Earn free tokens by daily attendance and inviting friends.'],
  ['현재 보유 토큰', 'Current Tokens'],
  ['충전하기', 'Recharge'],
  ['무료</div>', 'Free</div>'],
  ['베이직', 'Basic'],
  ['엘리트', 'Elite'],
  ['구독하기', 'Subscribe'],
  ['문의하기', 'Contact Us'],
  ['출석 체크', 'Attendance'],
  ['오늘 출석 완료!', 'Attendance checked!'],
  ['친구 초대', 'Invite Friends'],
  ['링크 복사', 'Copy Link'],
  ['링크가 복사되었습니다.', 'Link copied.'],
  ['초대 링크', 'Invite Link'],

  // Live Booking
  ['라이브 수업   WonderfulCrew', 'Live Classes — WonderfulCrew'],
  ['이달의 <em>라이브 수업</em>', "This Month's <em>Live Classes</em>"],
  ['전문 코치와 함께하는 오프라인/온라인 라이브 수업. 실전 면접 연습부터 1:1 피드백까지.', 'Live classes with professional coaches. From mock interviews to 1:1 feedback.'],
  ['예약하기', 'Book Now'],
  ['대기 등록', 'Join Waitlist'],
  ['매진', 'Sold Out'],
  ['선착순', 'First come, first served'],

  // Lecture
  ['합격 강의   WonderfulCrew', 'Success Lectures — WonderfulCrew'],
  ['전문 코치의', "Professional Coach's"],
  ['<em>합격 강의</em>', '<em>Success Lectures</em>'],
  ['에미레이트 일등석 7년 경력', '7 years of Emirates first-class experience'],
  ['20년 코칭 내공을 강의 영상으로 만나보세요.', 'Watch lecture videos built on 20 years of coaching expertise.'],
  ['강의 보기', 'Watch Lecture'],
  ['잠금 해제', 'Unlock'],
  ['유료 회원 전용', 'Paid Members Only'],

  // Interview Guide
  ['면접 완벽 가이드   WonderfulCrew', 'Interview Guide — WonderfulCrew'],
  ['승무원 면접 <em>완벽 가이드</em>', 'Cabin Crew <em>Interview Guide</em>'],

  // Grooming Guide
  ['이미지 메이킹 & 그루밍   WonderfulCrew', 'Image Making & Grooming — WonderfulCrew'],
  ['이미지 메이킹 & <em>그루밍</em>', 'Image Making & <em>Grooming</em>'],

  // Resume Guide
  ['자기소개서 & CV   WonderfulCrew', 'Resume & CV — WonderfulCrew'],
  ['자기소개서 & <em>CV</em>', 'Resume & <em>CV</em>'],

  // Customer Service
  ['고객 응대 스킬   WonderfulCrew', 'Customer Service Skills — WonderfulCrew'],
  ['고객 응대 <em>스킬</em>', 'Customer Service <em>Skills</em>'],
  ['실제 기내에서 쓰이는 검증된 고객 응대 기술. 면접에서도, 입사 후에도 평생 써먹는 스킬입니다.', "Proven customer service skills used on real flights. Skills you'll use in interviews and throughout your career."],
  ['LEAP 스킬', 'LEAP Skills'],
  ['단골 손님', 'Regular Customers'],
  ['VIP 응대', 'VIP Service'],
  ['화가 난 고객 응대 4단계 <em>LEAP</em>', '4 Steps to Handle Upset Customers: <em>LEAP</em>'],
  ['고객이 화났을 때 절대 당황하지 마세요. LEAP 4단계만 알면 어떤 컴플레인도 해결할 수 있습니다.', 'Never panic when a customer is upset. Master the 4 LEAP steps to handle any complaint.'],
  ['경청. 절대 말을 끊지 마세요. 고객이 하는 말을 끝까지 경청할 것. 인터럽트 금지.', 'Listen. Never interrupt. Hear the customer out completely. No interruptions.'],
  ['공감. 고객에게 공감 표현하기. 끄덕이기, 추임새 넣기.', 'Empathize. Show empathy to the customer. Nod, use verbal cues.'],
  ['열린 질문. 관련된 질문을 더 하기.', 'Ask open questions. Ask more related questions.'],
  ['패러프레이즈. 고객의 말을 내 언어로 다시 반복하기.', 'Paraphrase. Repeat what the customer said in your own words.'],
  ['술 취한 승객 응대 4단계 <em>4Ds</em>', '4 Steps for Intoxicated Passengers: <em>4Ds</em>'],
  ['기내에서 음주 승객 응대는 안전과 직결됩니다. 4Ds를 알면 당황하지 않고 전문적으로 대처할 수 있습니다.', 'Handling intoxicated passengers is directly tied to safety. Know the 4Ds and respond professionally.'],
  ['지연. 최대한 천천히 서비스하기. 서두르지 말고 시간을 끌 것.', 'Delay. Serve as slowly as possible. Take your time.'],
  ['묽게. 알코올을 묽게 만들기.', 'Dilute. Weaken the alcohol content.'],
  ['관심 돌리기. 다른 관심사로 돌리기.', 'Distract. Redirect their attention elsewhere.'],
  ['거절. 시니어 크루만 할 수 있음.', 'Deny. Only senior crew can do this.'],
  ['콘텐츠 준비 중입니다. 곧 업데이트됩니다.', 'Content coming soon. Stay tuned for updates.'],
  ['단골 손님 <em>만드는 법</em>', 'How to Create <em>Regular Customers</em>'],
  ['VIP 응대 <em>스킬</em>', 'VIP Service <em>Skills</em>'],

  // Daily English
  ['영어 쉐도잉   WonderfulCrew', 'English Shadowing — WonderfulCrew'],
  ['영어 <em>쉐도잉</em>', 'English <em>Shadowing</em>'],

  // Walking Analysis
  ['워킹 & 자세 분석   WonderfulCrew', 'Walking & Posture Analysis — WonderfulCrew'],
  ['워킹 & <em>자세 분석</em>', 'Walking & <em>Posture Analysis</em>'],

  // AI Coach
  ['AI 코치   WonderfulCrew', 'AI Coach — WonderfulCrew'],
  ['AI <em>코치</em>', 'AI <em>Coach</em>'],

  // Coach Feedback
  ['1:1 코치 피드백   WonderfulCrew', '1:1 Coach Feedback — WonderfulCrew'],
  ['실제 코치가 직접', 'Real coaches provide'],
  ['<em>피드백합니다</em>', '<em>personal feedback</em>'],
  ['영상 제출</h3>', 'Video Submission</h3>'],
  ['면접 영상 녹화 후 업로드', 'Upload your recorded interview video'],
  ['이미지 + 내용 동시 피드백', 'Get feedback on both image and content'],
  ['답변 텍스트 제출</h3>', 'Text Submission</h3>'],
  ['질문에 대한 답변 텍스트 작성', 'Write your answer to a question'],
  ['내용 중심 피드백', 'Content-focused feedback'],
  ['항공사 / 직종</label>', 'Airline / Position</label>'],

  // Chatbot
  ['AI 면접 코치   WonderfulCrew', 'AI Interview Coach — WonderfulCrew'],

  // My Progress
  ['내 성장 기록   WonderfulCrew', 'My Progress — WonderfulCrew'],
  ['내 성장 <em>기록</em>', 'My <em>Progress</em>'],

  // Hotel
  ['호텔 면접 준비   WonderfulCrew', 'Hotel Interview Prep — WonderfulCrew'],
  ['호텔 면접 <em>준비</em>', 'Hotel Interview <em>Prep</em>'],

  // Cruise
  ['크루즈 면접 준비   WonderfulCrew', 'Cruise Interview Prep — WonderfulCrew'],
  ['크루즈 면접 <em>준비</em>', 'Cruise Interview <em>Prep</em>'],

  // English Interview
  ['한국어 & 영어 면접 핵심 표현   WonderfulCrew', 'Interview Essential Q&A — WonderfulCrew'],
  ['항공사 한국어 & 영어', 'Airline Interview'],
  ['<em>면접 핵심 표현</em>', '<em>Essential Q&A</em>'],
  ['한국어·영어·항공영어 빈출 질문과 모범 답변, 훈련 필수 표현까지 한번에 정리했습니다.', 'Frequently asked questions, model answers, and essential expressions for cabin crew interviews.'],
  ['한국어 면접</button>', 'Korean Interview</button>'],
  ['영어 면접</button>', 'English Interview</button>'],
  ['항공 영어 표현</button>', 'Aviation English</button>'],
  ['한국어 면접 <em>빈출 질문</em>', 'Korean Interview <em>FAQs</em>'],
  ['영어 면접 <em>빈출 질문</em>', 'English Interview <em>FAQs</em>'],
  ['꼭 알아야 하는 <em>항공 영어 표현</em>', 'Must-Know <em>Aviation English</em>'],
  ['합격 후 훈련(Training)에서 매일 사용하는 항공 영어 표현입니다.', 'Aviation English expressions used daily during post-hire training.'],

  // Roleplay
  ['롤플레이 면접 연습 WonderfulCrew', 'Roleplay Interview Practice — WonderfulCrew'],
  ['면접관 아바타가 기내 상황 질문을 읽어드립니다.', 'The AI interviewer will present in-flight scenarios.'],
  ['카메라 앞에서 실전처럼 답변하세요.', 'Answer as if you were in a real interview.'],
  ['AI가 피드백을 작성하고 있어요...', 'AI is generating feedback...'],
  ['아바타 이미지는 images/avatar-male.png, avatar-female.png에 넣으면 자동 적용됩니다.', 'Place avatar images at images/avatar-male.png and avatar-female.png.'],
  ['Southeast Asian English', ''],
  ['French English', ''],
  ['Spanish English', ''],

  // WonderfulCrew banner on english-interview
  ['WonderfulCrew AI는 에미레이트항공 일등석 출신 대표와 22개국 현직 승무원 자문단의 실전 경험이 학습된 전문 코칭 엔진입니다. 서비스 마인드, 공감 능력, 글로벌 기준 면접관이 실제로 보는 기준으로 설계된 답변만 제공합니다.', 'WonderfulCrew AI is a professional coaching engine trained on real-world experience from a former Emirates first-class crew member and an advisory board of active crew from 22 countries. We only provide answers designed to meet the actual standards interviewers look for: service mindset, empathy, and global benchmarks.'],

  // Common nav/footer leftover
  ['홈으로</a>', 'Home</a>'],
  ['← 홈', '← Home'],
];

// Remove empty Southeast Asian/French/Spanish accent options
const accentRemove = [
  '<option value="en-SG">Southeast Asian English</option>\n',
  '<option value="en-SG"></option>\n',
  '<option value="fr-FR">French English</option>\n',
  '<option value="fr-FR"></option>\n',
  '<option value="es-ES">Spanish English</option>\n',
  '<option value="es-ES"></option>\n',
  '        <option value="en-SG">Southeast Asian English</option>',
  '        <option value="fr-FR">French English</option>',
  '        <option value="es-ES">Spanish English</option>',
];

const files = fs.readdirSync('.').filter(f => f.endsWith('-en.html') && f !== 'index-en.html');
let total = 0;
files.forEach(f => {
  let html = fs.readFileSync(f, 'utf8');
  let changes = 0;
  map.forEach(([ko, en]) => {
    if (html.includes(ko) && ko !== en) {
      html = html.split(ko).join(en);
      changes++;
    }
  });
  accentRemove.forEach(s => {
    if (html.includes(s)) {
      html = html.split(s).join('');
      changes++;
    }
  });
  if (changes > 0) {
    fs.writeFileSync(f, html, 'utf8');
    total += changes;
    console.log(f + ': ' + changes);
  }
});
console.log('Total replacements:', total);
