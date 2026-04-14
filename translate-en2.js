const fs=require('fs');

// Page-specific translations - grouped by file
const pageMap = {
  'feedback-en.html': [
    ["'익명'", "'Anonymous'"],
  ],
  'roleplay-practice-en.html': [
    ['Interviewer Avatar가 기내 상황 질문을 읽어드립니다.', 'The AI interviewer will present in-flight scenarios.'],
    ['대화가 종료되었습니다', 'The conversation has ended.'],
    ['대화 내용이 없습니다', 'No conversation recorded.'],
  ],
  'customer-service-en.html': [
    ['고객 응대 스킬 WonderfulCrew', 'Customer Service Skills — WonderfulCrew'],
    ['공감. 고객에게 공감 표현하기. 끄덕이기, 추임새 넣기. "아, 정말 속상하셨겠어요." "정말 불쾌하셨겠어요." "충분히 이해됩니다."', 'Empathize. Show empathy. Nod, use verbal affirmations. "I completely understand how frustrating this must be."'],
    ['열린 질문. 관련된 질문을 더 하기. 고객의 불만을 더 깊이 알아낼 수 있음. 이전에 안 좋은 서비스 기억이 있을 수도 있으니 충분히 들을 것.', 'Ask open questions. Dig deeper into the complaint. The customer may have had previous bad experiences — listen fully.'],
    ['패러프레이즈. 고객의 말을 내 언어로 다시 반복하기. \'처음부터 끝까지 다 듣고 있다\'는 걸 보여주는 행동.', "Paraphrase. Repeat the customer's words in your own language. This shows you've been listening from start to finish."],
    ['LEAP는 단순한 스킬이 아닙니다. 고객이 진정으로 원하는 것은 해결책보다 \'내 말을 들어주는 사람\'입니다. LEAP를 몸에 익히면 면접 롤플레이에서도, 실제 기내에서도 빛을 발합니다.', "LEAP is more than a skill. What customers truly want is someone who listens. Master LEAP and you'll shine in both interview roleplay and real flights."],
    ['묽게. 알코올을 묽게 만들기. 물을 타거나, 얼음을 많이 넣거나, 컵 립에만 알코올을 묻히기.', 'Dilute. Weaken the alcohol — add water, extra ice, or apply alcohol only to the cup rim.'],
    ['관심 돌리기. 다른 관심사로 돌리기. 말을 걸거나 다른 음식/음료 제안하기.', 'Distract. Redirect attention. Start a conversation or suggest alternative food/beverages.'],
    ['거절. 시니어 크루만 할 수 있음. 아무나 하면 안 됨. 반드시 시니어의 판단 하에 진행.', 'Deny. Only senior crew can do this. Must be done under senior crew judgment.'],
    ['4Ds는 순서대로 진행합니다. Deny는 반드시 시니어 크루가 판단해야 합니다. 면접에서 이 스킬을 언급하면 실무 이해도가 높다는 인상을 줄 수 있습니다.', 'The 4Ds are applied in order. Deny must be decided by senior crew. Mentioning this skill in interviews shows strong practical understanding.'],
  ],
  'settings-en.html': [
    ['알림 Settings', 'Notification Settings'],
    ['원하는 알림만 선택해서 받으세요.', 'Choose which notifications you want to receive.'],
    ['브라우저 푸시 알림 상태:', 'Browser push notification status:'],
    ['확인 중', 'Checking'],
    ['알림을 받으려면 브라우저 알림 권한을 허용해주세요.', 'Please allow browser notification permission to receive alerts.'],
    ['알림 허용하기', 'Allow Notifications'],
    ['알림이 허용되었습니다.', 'Notifications enabled.'],
    ['알림이 차단되었습니다. 브라우저 설정에서 변경해주세요.', 'Notifications blocked. Please change in browser settings.'],
    ['허용됨', 'Allowed'],
    ['차단됨', 'Blocked'],
    ['미설정', 'Not set'],
  ],
};

// Apply page-specific translations
Object.entries(pageMap).forEach(([file, pairs]) => {
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');
  let changes = 0;
  pairs.forEach(([ko, en]) => {
    if (html.includes(ko)) {
      html = html.split(ko).join(en);
      changes++;
    }
  });
  if (changes > 0) {
    fs.writeFileSync(file, html, 'utf8');
    console.log(file + ': ' + changes + ' page-specific replacements');
  }
});

// Now handle the big content pages by doing title-level translations
const titleMap = [
  // Common title patterns across many pages
  ['<title>호텔·럭셔리 면접   WonderfulCrew</title>', '<title>Hotel & Luxury Interview — WonderfulCrew</title>'],
  ['<title>크루즈 면접   WonderfulCrew</title>', '<title>Cruise Interview — WonderfulCrew</title>'],
  ['<title>채용정보   WonderfulCrew</title>', '<title>Airline Careers — WonderfulCrew</title>'],
  ['<title>토큰받기   WonderfulCrew</title>', '<title>Tokens & Rewards — WonderfulCrew</title>'],
  ['<title>매일 영어   WonderfulCrew</title>', '<title>Daily English — WonderfulCrew</title>'],
  ['<title>내 성장 기록 WonderfulCrew</title>', '<title>My Progress — WonderfulCrew</title>'],
  ['<title>WonderfulCrew   레벨 테스트</title>', '<title>WonderfulCrew — Level Test</title>'],
  ['<title>강의 영상   WonderfulCrew</title>', '<title>Video Lectures — WonderfulCrew</title>'],
  ['<title>증명사진 & 이력서 가이드   WonderfulCrew</title>', '<title>Resume & CV Guide — WonderfulCrew</title>'],
  ['<title>승무원 Interview Guide', '<title>Cabin Crew Interview Guide'],
  ['<title>고객 응대 스킬 WonderfulCrew</title>', '<title>Customer Service Skills — WonderfulCrew</title>'],
  ['<title>WonderfulCrew 승무원 면접 전용 코치</title>', '<title>WonderfulCrew AI Interview Coach</title>'],
];

const files2 = fs.readdirSync('.').filter(f => f.endsWith('-en.html') && f !== 'index-en.html');
let total = 0;
files2.forEach(f => {
  let html = fs.readFileSync(f, 'utf8');
  let changes = 0;
  titleMap.forEach(([ko, en]) => {
    if (html.includes(ko)) {
      html = html.split(ko).join(en);
      changes++;
    }
  });
  if (changes > 0) {
    fs.writeFileSync(f, html, 'utf8');
    total += changes;
    console.log(f + ': ' + changes + ' title fixes');
  }
});
console.log('Total pass 2 replacements:', total);
