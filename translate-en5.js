const fs=require('fs');
function tr(file, pairs) {
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');
  let c = 0;
  pairs.forEach(([k, v]) => {
    if (html.includes(k)) { html = html.split(k).join(v); c++; }
  });
  if (c > 0) { fs.writeFileSync(file, html, 'utf8'); console.log(file + ': ' + c); }
}

// ===== roleplay-practice-en.html (2 lines) =====
tr('roleplay-practice-en.html', [
  ['Interviewer Avatar가 기내 상황 질문을 읽어드립니다', 'The AI interviewer presents in-flight scenarios'],
  ["// fallback: 첫번째=남, 두번째=여", "// fallback: first=male, second=female"],
]);

// ===== cruise-en.html (2 lines) =====
tr('cruise-en.html', [
  ["name:'로얄캐리비안',en:'Royal Caribbean'", "name:'Royal Caribbean',en:'Royal Caribbean'"],
]);

// ===== hotel-en.html (5 lines) =====
tr('hotel-en.html', [
  ["서류전형", "Document Screening"],
  ["건강검진", "Health Check"],
  ["면접 프로세스", "Interview Process"],
  ["시작", "Start"],
  ["브랜드를 선택해주세요", "Please select a brand"],
]);

// ===== customer-service-en.html (8 lines) =====
tr('customer-service-en.html', [
  ['고객 응대 스킬 WonderfulCrew', 'Customer Service Skills — WonderfulCrew'],
  ["공감. 고객에게 공감 표현하기. 끄덕이기, 추임새 넣기. \"아, 정말 속상하셨겠어요.\" \"정말 불쾌하셨겠어요.\" \"충분히 이해됩니다.\"", 'Empathize. Show empathy. Nod, use verbal affirmations. "I completely understand how frustrating this must be."'],
  ["열린 질문. 관련된 질문을 더 하기. 고객의 불만을 더 깊이 알아낼 수 있음. 이전에 안 좋은 서비스 기억이 있을 수도 있으니 충분히 들을 것.", "Ask open questions. Dig deeper into complaints. Listen fully as they may have had previous bad experiences."],
  ["패러프레이즈. 고객의 말을 내 언어로 다시 반복하기. '처음부터 끝까지 다 듣고 있다'는 걸 보여주는 행동.", "Paraphrase. Repeat in your own words, showing you've been listening from start to finish."],
  ["LEAP는 단순한 스킬이 아닙니다. 고객이 진정으로 원하는 것은 해결책보다 '내 말을 들어주는 사람'입니다. LEAP를 몸에 익히면 면접 롤플레이에서도, 실제 기내에서도 빛을 발합니다.", "LEAP is more than a skill. What customers truly want is someone who listens. Master LEAP and shine in both interviews and real flights."],
  ["묽게. 알코올을 묽게 만들기. 물을 타거나, 얼음을 많이 넣거나, 컵 립에만 알코올을 묻히기.", "Dilute. Weaken the alcohol — add water, extra ice, or apply alcohol only to the cup rim."],
  ["관심 돌리기. 다른 관심사로 돌리기. 말을 걸거나 다른 음식/음료 제안하기.", "Distract. Redirect attention — start a conversation or suggest alternative food/beverages."],
  ["거절. 시니어 크루만 할 수 있음. 아무나 하면 안 됨. 반드시 시니어의 판단 하에 진행.", "Deny. Only senior crew can refuse. Must be done under senior crew judgment."],
  ["4Ds는 순서대로 진행합니다. Deny는 반드시 시니어 크루가 판단해야 합니다. 면접에서 이 스킬을 언급하면 실무 이해도가 높다는 인상을 줄 수 있습니다.", "The 4Ds proceed in order. Deny must always be decided by senior crew. Mentioning this in interviews shows strong practical understanding."],
]);

// ===== settings-en.html (13 lines) =====
tr('settings-en.html', [
  ['알림 Notification Settings', 'Notification Settings'],
  ['원하는 알림만 선택해서 받으세요', 'Choose which notifications you want to receive'],
  ['브라우저 푸시 알림 상태', 'Browser push notification status'],
  ['확인 중</span>', 'Checking</span>'],
  ['알림을 받으려면 브라우저 알림 권한을 허용해주세요', 'Please allow browser notification permission'],
  ['알림 허용하기', 'Allow Notifications'],
  ['알림이 허용되었습니다', 'Notifications enabled'],
  ['알림이 차단되었습니다. 브라우저 설정에서 변경해주세요', 'Notifications blocked. Please change in browser settings'],
  ['허용됨', 'Allowed'],
  ['차단됨', 'Blocked'],
  ['미설정', 'Not set'],
  ['알림 설정이 저장되었습니다', 'Notification settings saved'],
  ['설정 Save Settings', 'Save Settings'],
]);

// ===== login-en.html (13 lines) =====
tr('login-en.html', [
  ['WonderfulCrew 계정으로 로그인하세요', 'Sign in to your WonderfulCrew account'],
  ['Google 계정으로 로그인', 'Sign in with Google'],
  ['카카오 계정으로 로그인', 'Sign in with Kakao'],
  ['네이버 계정으로 로그인', 'Sign in with Naver'],
  ['또는', 'or'],
  ['이메일 주소', 'Email address'],
  ['비밀번호', 'Password'],
  ['이메일로 로그인', 'Sign in with Email'],
  ['아직 계정이 없으신가요?', "Don't have an account?"],
  ['회원가입', 'Sign up'],
  ['비밀번호 찾기', 'Forgot password?'],
  ['이메일과 비밀번호를 입력해주세요', 'Please enter your email and password'],
  ['로그인 성공', 'Sign in successful'],
  ['로그인에 실패했습니다', 'Sign in failed'],
  ['로그인   WonderfulCrew', 'Sign In — WonderfulCrew'],
]);

// ===== lecture-en.html =====
tr('lecture-en.html', [
  ['강의 영상   WonderfulCrew', 'Video Lectures — WonderfulCrew'],
  ['영상 준비중', 'Video Coming Soon'],
  ['유료 회원만 시청 가능합니다.', 'Available for paid members only.'],
  ['수강권 구매 후 이용 가능합니다.', 'Available after purchasing a lecture pass.'],
]);

// ===== live-booking-en.html =====
tr('live-booking-en.html', [
  ['오프라인', 'Offline'],
  ['홍대', 'Seoul'],
  ['에미레이트 면접 실전', 'Emirates Interview Practice'],
  ['면접 실전 연습', 'Interview Practice'],
  ['코칭', 'Coaching'],
  ['참가비:', 'Fee:'],
  ['무료 (올인원 패키지)', 'Free (All-in-One Package)'],
  ['인원:', 'Capacity:'],
  ['상세 주소는 예약 확정 후 안내', 'Address provided after booking'],
]);

console.log('=== Pass 5 complete ===');
