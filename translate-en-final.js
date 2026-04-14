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

// ===== leveltest-en.html =====
tr('leveltest-en.html', [
  ['Language / 언어 선택', 'Language Selection'],
  ['대한항공 · 아시아나 · 국내 LCC 지망생 추천', 'Recommended for Korean airline applicants'],
  ['한국어 자기소개 + AI 평가', 'Korean self-intro + AI evaluation'],
  ['먼저 <em>나에 대해</em>', 'Tell Us <em>About You</em>'],
  ['알려주세요', ''],
  ['맞춤형 레벨 평가와 항공사 추천을 위해', 'For personalized assessment and airline recommendation.'],
  ['>이름 <em>*</em>', '>Name <em>*</em>'],
  ['>전화번호 <em>*</em>', '>Phone <em>*</em>'],
  ['>이메일 <em>*</em>', '>Email <em>*</em>'],
  ['면접 교육 경험', 'Interview Training Experience'],
  ['>없음<', '>None<'],
  ['>독학<', '>Self-study<'],
  ['>학원 수강<', '>Academy<'],
  ['>1:1 코칭<', '>1:1 Coaching<'],
  ['지원 경험', 'Application Experience'],
  ['아직 지원한 적 없어요', 'Never applied'],
  ['서류 탈락 경험 있음', 'Rejected at document stage'],
  ['면접 경험 있음', 'Interview experience'],
  ['파이널 경험 있음', 'Final round experience'],
  ['영어 수준', 'English Level'],
  ['기초 (인사/자기소개)', 'Basic (greetings/intro)'],
  ['일상회화', 'Conversational'],
  ['비즈니스 영어', 'Business English'],
  ['원어민급', 'Near-native'],
  ['다음 단계로', 'Next Step'],
  ['카메라를 켜고', 'Turn on your camera and'],
  ['아래 질문에 영어로 답변해주세요', 'answer the question in English'],
  ['AI가 표정, 자세, 답변 내용을 종합 분석합니다', 'AI analyzes your expression, posture, and answer'],
  ['카메라 시작', 'Start Camera'],
  ['녹화 시작', 'Start Recording'],
  ['녹화 중...', 'Recording...'],
  ['녹화 중지', 'Stop Recording'],
  ['다시 찍기', 'Retake'],
  ['AI 분석 시작', 'Start AI Analysis'],
  ['분석 중...', 'Analyzing...'],
  ['레벨 테스트 결과', 'Level Test Results'],
  ['추천 커리큘럼', 'Recommended Curriculum'],
  ['커리큘럼 시작하기', 'Start Curriculum'],
  ['다시 테스트하기', 'Retake Test'],
  ['테스트를 시작해주세요', 'Please start the test'],
  ['영상을 먼저 녹화해주세요', 'Please record a video first'],
  ['카메라를 먼저 시작해주세요', 'Please start the camera first'],
]);

// ===== community-en.html =====
tr('community-en.html', [
  ['이야기 나눠요', 'Free Discussion'],
  ['고민, 질문, 자유 토크', 'Questions, concerns, free talk'],
  ['어땠나요?', 'How Was It?'],
  ['Airline별 면접 질문 & 경험 공유', 'Share interview questions & experiences by airline'],
  ['합격 인증 회원만 작성 가능', 'Verified members only'],
  ['아직 Study Groups글이 없어요. 첫 글을 올려보세요!', 'No study groups yet. Be the first to post!'],
  ['아직 글이 없어요. 첫 이야기를 나눠보세요!', 'No posts yet. Start the first conversation!'],
  ['아직 Interview Reviews가 없어요.', 'No interview reviews yet.'],
  ['아직 Success Stories가 없어요.', 'No success stories yet.'],
  ['합격 인증 후 작성 가능합니다.', 'Available for verified members.'],
  ['합격 인증 신청은 카카오톡으로 문의해주세요.', 'Please contact us via KakaoTalk for verification.'],
  ['스터디 올리기', 'Create Study Group'],
  ['합격 후기 쓰기', 'Write Success Story'],
  ['후기 쓰기', 'Write Review'],
  ['지역:', 'Region:'],
  ['인원:', 'Members:'],
  ['시간:', 'Time:'],
  ['작성일', 'Posted'],
  ['개의 후기', 'reviews'],
  ['카카오톡: @wonderfulcrew', 'KakaoTalk: @wonderfulcrew'],
]);

// ===== about-en.html =====
tr('about-en.html', [
  ['항공사 일등석의', 'First-Class Airline'],
  ['전 세계 1%만 경험하는 에미레이트항공 일등석 서비스를 7yr간 몸으로 배웠습니다. 고객이 말하기 전에 먼저 움직이는 것, 컴플레인을 선물로 받아들이는 것. 이 철학을 13yr간,', 'Learned Emirates first-class service — experienced by only 1% worldwide — through 7 years of hands-on work. Moving before the customer speaks, treating complaints as gifts. Over 13 years,'],
  ['에미레이트·카타르·캐세이퍼시픽·대한항공·아시아나·티웨이·싱가포르항공 등 현직 승무원 드림 Advisory Board이 함께하며, 원더풀크루가 학습시킨 자체 AI가 그 경험을 24시', 'Active crew from Emirates, Qatar, Cathay Pacific, Korean Air, Asiana, T\'way, Singapore Airlines form our Advisory Board, and our proprietary AI delivers that experience 24/7.'],
  ['면접에서 합격하는 방법을 넘어, 고객을 대하는 서비스의 본질을 배웁니다.', 'Beyond passing interviews — learn the essence of serving customers.'],
  ['원더풀크루 <em>Service Philosophy</em>', 'WonderfulCrew <em>Service Philosophy</em>'],
  ['Fly Better : 고객의 기대를 뛰어넘는 경험 설계', 'Fly Better: Designing experiences that exceed expectations'],
  ['고객이 기대하는 것을 충족하는 것으로는 부족합니다.', 'Meeting expectations is not enough.'],
  ['기대하지 못했던 감동을 먼저 설계하는 것이 진짜 서비스입니다.', 'True service is designing unexpected moments of delight.'],
  ['공감 : 고객이 되어 볼 것', 'Empathy: Walk in the customer\'s shoes'],
  ['나라면 이 상황에서 어떤 기분일까?', 'How would I feel in this situation?'],
  ['공감은 말이 아니라 행동으로 보여줘야 합니다.', 'Empathy must be shown through actions, not just words.'],
  ['디테일 : 작은 것이 브랜드를 만든다', 'Details: Small things build the brand'],
  ['고객이 눈치채지 못하는 곳까지 신경 쓰는 것.', 'Caring even where customers don\'t notice.'],
  ['그 1%의 차이가 일등석과 이코노미를 가릅니다.', 'That 1% difference separates first class from economy.'],
  ['선제적 서비스 (Anticipation)', 'Proactive Service (Anticipation)'],
  ['고객이 요청하기 전에 먼저 제공하는 것.', 'Providing before the customer asks.'],
  ['최고의 서비스는 고객이 버튼을 누를 필요가 없는 서비스입니다.', 'The best service is one where customers never need to press the call button.'],
  ['팀워크 : We, not I', 'Teamwork: We, not I'],
  ['혼자 빛나는 것보다 팀이 빛나는 것이 진짜 승무원입니다.', 'A true crew member makes the team shine, not just themselves.'],
  ['회복력 (Service Recovery)', 'Service Recovery'],
  ['실수는 신뢰를 쌓는 기회입니다.', 'Mistakes are opportunities to build trust.'],
  ['잘 해결된 컴플레인은 최고의 마케팅입니다.', 'A well-resolved complaint is the best marketing.'],
  ['문화적 감수성', 'Cultural Sensitivity'],
  ['전 세계 고객을 대하려면 그들의 문화를 이해해야 합니다.', 'To serve global customers, you must understand their cultures.'],
  ['작은 배려가 잊지 못할 경험을 만듭니다.', 'Small gestures create unforgettable experiences.'],
  ['즐기는 마음 : 면접도, 비행도', 'Enjoy: Both interviews and flights'],
  ['즐기는 사람이 합격합니다. 긴장이 아니라 설렘으로.', 'Those who enjoy succeed. With excitement, not anxiety.'],
  ['나다움 : 자기 말로 표현하기', 'Authenticity: Express in your own words'],
  ['외운 문장은 면접관이 알아봅니다.', 'Interviewers can spot memorized answers.'],
  ['자기 말로 말하는 사람이 진심이 전달됩니다.', 'Speaking in your own words conveys sincerity.'],
  ['진정성 : 진심은 통한다', 'Sincerity: Genuine hearts connect'],
  ['매뉴얼보다 진심이 고객을 감동시킵니다.', 'Sincerity moves customers more than manuals.'],
  ['고객은 직원의 진심을 느낍니다.', 'Customers feel when service is genuine.'],
]);

// ===== jobs-en.html =====
tr('jobs-en.html', [
  ['서울 Open Day 진행. 영어 인터뷰 + 암아즈 테스트 포함.', 'Seoul Open Day. Includes English interview + arm-reach test.'],
  ['한국인 승무원 Rolling Recruitment. Starts with online CV screening.', 'Korean crew rolling recruitment. Starts with online CV screening.'],
  ['Seoul recruitment info session & interview. 스몰토크 & 그룹 인터뷰.', 'Seoul recruitment info session & interview. Small talk & group interview.'],
  ['2026 Cabin Crew 모집. 영어 인터뷰 및 Safety Demo.', '2026 Cabin Crew recruitment. English interview & Safety Demo.'],
  ['신입 객실승무원 공개채용 하반기 예정.', 'Entry-level cabin crew open recruitment expected H2.'],
  ['스타얼라이언스 · Incheon base. 공채 일정 공지 Standby중.', 'Star Alliance · Incheon base. Open recruitment schedule on standby.'],
  ['면접과정 보기', 'View Interview Process'],
  ['채용 뉴스', 'Recruitment News'],
]);

// ===== daily-english-en.html =====
tr('daily-english-en.html', [
  ['Streak 출석일', 'Day Streak'],
  ['총 출석일', 'Total Days'],
  ["오늘의 영어 연습 Complete! Streak 출석이 기록되었습니다.", "Today's English practice complete! Streak recorded."],
  ['기내방송 <em>쉐도잉</em>', 'In-flight Announcement <em>Shadowing</em>'],
  ["'첫 이용 무료'", "'Free trial'"],
  ["'남은 토큰: '+t.tokens+'개'", "'Free trial: '+getFreeTrialLeft()+' left'"],
  ['Record Answer 시작', 'Start Recording'],
  ['Model Answer 보기', 'View Model Answer'],
  ['예시 Listen', 'Listen to Example'],
  ['녹음 중...', 'Recording...'],
  ['녹음 완료', 'Recording done'],
  ['제출 완료', 'Submitted'],
  ['다음 문장', 'Next Sentence'],
  ['따라읽기', 'Read Along'],
  ['원어민 발음을 듣고 따라 읽어보세요', 'Listen to native pronunciation and repeat'],
]);

// ===== my-progress-en.html =====
tr('my-progress-en.html', [
  ['Target Airline 선택', 'Select Target Airline'],
  ["value=\"싱가포르\"", "value=\"Singapore\""],
  ["value=\"대한항공\"", "value=\"Korean Air\""],
  ["value=\"아시아나\"", "value=\"Asiana\""],
  ["value=\"제주항공\"", "value=\"Jeju Air\""],
  ["value=\"진에어\"", "value=\"Jin Air\""],
  ['Target Airline을 선택해주세요', 'Please select your target airline'],
  ['3일 Streak', '3-Day Streak'],
  ['7일 Streak', '7-Day Streak'],
  ['30일 Streak', '30-Day Streak'],
  ['10문제 Complete', '10 Questions Done'],
  ['연습 기록이 없습니다.', 'No practice records.'],
  ['코치 피드백', 'Coach Feedback'],
  ['아직 코치 피드백이 없습니다.', 'No coach feedback yet.'],
  ['최근 코치 피드백', 'Recent Coach Feedback'],
  ['사과 표현이 자연스럽고 진정성이 느껴짐', 'Natural and sincere apology expression'],
  ['해결책을 한 가지 더 제시하면 완벽', 'One more solution suggestion would be perfect'],
  ['전체적으로 큰 발전이 보임', 'Overall great improvement shown'],
  ['연속 출석', 'Streak'],
  ['총 출석', 'Total'],
  ['최장 연속', 'Best Streak'],
]);

// ===== live-booking-en.html =====
tr('live-booking-en.html', [
  ['4월 19일 (토)', 'Apr 19 (Sat)'],
  ['4월 22일 (화)', 'Apr 22 (Tue)'],
  ['4월 26일 (토)', 'Apr 26 (Sat)'],
  ['5월 3일 (토)', 'May 3 (Sat)'],
  ['5월 10일 (토)', 'May 10 (Sat)'],
  ['14:00~17:00 · 3시간', '14:00-17:00 · 3hr'],
  ['20:00~22:00 · 2시간', '20:00-22:00 · 2hr'],
  ['상세 주소 신청 후 안내', 'Address provided after booking'],
  ['Zoom 링크 신청 후 발송', 'Zoom link sent after booking'],
  ['정원', 'Capacity'],
  ['잔여', 'Remaining'],
  ['석', ' seats'],
  ['신청하기', 'Book Now'],
  ['영어 면접 집중 클래스', 'English Interview Intensive'],
  ['그룹 디스커션 마스터 클래스', 'Group Discussion Master Class'],
  ['이미지 메이킹 & 그루밍 실전', 'Image Making & Grooming Workshop'],
  ['모의 면접 올인원', 'All-in-One Mock Interview'],
  ["수업 신청은 카카오톡으로 문의해주세요.\\n@wonderfulcrew", "Please contact us via KakaoTalk to book.\\n@wonderfulcrew"],
  ['프리미엄 패키지 구매자만 예약 가능합니다.', 'Available for Premium Package members only.'],
]);

// ===== ai-coach-en.html =====
tr('ai-coach-en.html', [
  ['답변을 입력하면 잘한 점,', 'Enter your answer to get feedback on strengths,'],
  ['개선할 점, 추천 표현을 AI가 실시간 분석합니다.', 'areas to improve, and recommended expressions.'],
  ["호텔 · 럭셔리", "Hotel & Luxury"],
  ["크루즈", "Cruise"],
  ['면접 단계</label>', 'Interview Stage</label>'],
  ["비디오 면접", "Video Interview"],
  ["1차 면접", "1st Interview"],
  ["2차 면접", "2nd Interview"],
  ["디스커션", "Discussion"],
  ['>질문</label>', '>Question</label>'],
  ['>내 답변</label>', '>My Answer</label>'],
  ['예: Why do you want to work for Emirates?', 'e.g. Why do you want to work for Emirates?'],
  ['영어 또는 한국어로 답변을 입력하세요. 가능한 자세하게 작성할수록 정확한 피드백을 받을 수 있습니다.', 'Enter your answer in English. The more detailed, the better the feedback.'],
  ['AI 피드백 받기', 'Get AI Feedback'],
  ['분석 중...', 'Analyzing...'],
  ['여기에 AI 피드백이 표시됩니다', 'AI feedback will appear here'],
  ['분석할 답변을 입력해주세요', 'Please enter an answer to analyze'],
  ['피드백을 생성하지 못했습니다', 'Failed to generate feedback'],
]);

// ===== coach-feedback-en.html =====
tr('coach-feedback-en.html', [
  ['AI가 아닌 진짜 사람의 눈으로 당신의 면접을 봐드립니다.', 'Real human eyes reviewing your interview — not just AI.'],
  ['영상을 구글 드라이브에 업로드 → 공유 설정 "링크가 있는 모든 사용자" → 링크 붙여넣기', 'Upload to Google Drive → Set sharing to "Anyone with link" → Paste link'],
  ['어떤 점이 걱정되시나요? 특별히 봐주었으면 하는 부분이 있나요?', 'Any concerns? Anything specific you want the coach to review?'],
  ['>질문</label>', '>Question</label>'],
  ['면접 질문을 입력하세요', 'Enter the interview question'],
  ['>답변</label>', '>Answer</label>'],
  ['답변을 작성하세요 (200자 이상 권장)', 'Write your answer (200+ chars recommended)'],
  ['코치 피드백 예시', 'Coach Feedback Example'],
  ['제출하기</button>', 'Submit</button>'],
]);

// ===== settings-en.html =====
tr('settings-en.html', [
  ['항공사 Job Posting Alerts', 'Job Posting Alerts'],
  ['새 Job Postings가 등록되면 알려드립니다', 'Get notified when new job postings are added'],
  ['항공 뉴스 알림', 'Aviation News Alerts'],
  ['주요 항공사 소식을 알려드립니다', 'Get notified about major airline news'],
  ['매일 영어 연습 알림', 'Daily English Practice Reminder'],
  ['매일 오전 10시 "오늘 영어 연습 하셨나요?"', 'Daily 10AM: "Have you practiced English today?"'],
  ['라이브 수업 리마인드', 'Live Class Reminder'],
  ['수업 전날 + 당일 오전 알림', 'Day before + morning of class notification'],
  ['코치 피드백 완료 알림', 'Coach Feedback Ready Alert'],
  ['영상/답변에 코치 피드백이 등록되면 알림', 'Get notified when coach feedback is posted'],
]);

// ===== walking-analysis-en.html =====
tr('walking-analysis-en.html', [
  ['자연광 추천', 'natural light recommended'],
  ['편안한 구두 착용 (면접 때 신을 구두 권장)', 'Wear comfortable dress shoes (same as interview)'],
  ['5~10초 정도 걸어오는 영상', '5-10 second walking video'],
  ['<b>참고:</b> 무릎이 붙는 일자 다리가 유리합니다. 국내 항공사는 특히 워킹과 Leg Line을 중점적으로 평가합니다.', '<b>Note:</b> Straight leg line is preferred. Airlines especially evaluate walking posture and leg alignment.'],
  ['워킹 영상을 업로드하세요', 'Upload your walking video'],
  ['MP4, MOV, WebM (최대 50MB)', 'MP4, MOV, WebM (max 50MB)'],
  ['AI가 워킹 영상을 분석하고 있어요...', 'AI is analyzing your walking video...'],
  ['약 10초 소요', 'Takes about 10 seconds'],
  ['분석이 완료되면 여기에 결과가 표시됩니다.', 'Analysis results will appear here.'],
  ['영상을 먼저 업로드해주세요', 'Please upload a video first'],
  ['더미 분석   AI 연동 예정', 'Demo analysis — AI integration coming soon'],
  ['어깨가 균형 잡혀 있습니다.', 'Shoulders are well balanced.'],
  ['골반 정렬이 양호합니다.', 'Hip alignment is good.'],
  ['다리 라인이 일직선에 가깝습니다.', 'Leg line is close to straight.'],
  ['보폭이 일정합니다.', 'Stride is consistent.'],
  ['착지가 안정적입니다.', 'Landing is stable.'],
  ['걷는 속도가 적절합니다.', 'Walking speed is appropriate.'],
  ['팔 스윙이 자연스럽습니다.', 'Arm swing is natural.'],
  ['시선이 정면을 향하고 있습니다.', 'Eye contact is forward-facing.'],
  ['전체적으로 좋은 자세입니다.', 'Overall good posture.'],
  ['개선 포인트:', 'Improvement Points:'],
  ['어깨를 조금 더 펴주세요.', 'Open your shoulders a bit more.'],
  ['보폭을 약간 넓히면 더 자신감 있어 보입니다.', 'Slightly wider strides will look more confident.'],
  ['턱을 살짝 당기면 목선이 더 예뻐집니다.', 'Tucking your chin slightly will improve your neck line.'],
]);

// ===== token-rewards-en.html - this should mirror the Korean token-rewards.html which was already redesigned =====
// Just overwrite with the redesigned version
// Skip for now - it needs full rewrite

console.log('=== Final translation pass complete ===');
