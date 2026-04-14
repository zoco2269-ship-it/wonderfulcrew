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

// ai-coach.html
tr('ai-coach.html', [
  ['<span style="font-size:0.78rem;color:var(--text-muted);margin-left:12px;">토큰 1개 소모 (테스트 기간 무료)</span>', ''],
]);

// daily-english.html
tr('daily-english.html', [
  ["alert('토큰이 부족합니다. 토큰을 구매해주세요.');", "showSubscribePopup();"],
]);

// index.html - search data
tr('index.html', [
  ["{keywords:'가격 결제 토큰 pricing 플랜',title:'토큰 충전 & 가격',url:'token-rewards.html'}", "{keywords:'가격 결제 요금제 pricing 플랜 구독',title:'요금제',url:'token-rewards.html'}"],
]);

// my-progress.html
tr('my-progress.html', [
  ['토큰 현황', '구독 현황'],
  ['보유 토큰', '구독 상태'],
  ['id="p-tokens">0', 'id="p-tokens">무료체험'],
]);

// pricing.html
tr('pricing.html', [
  ['<b>AI 코칭 토큰 무제한</b>   영어쉐도잉, 면접 연습 무제한', '<b>AI 코칭 무제한</b>   영어쉐도잉, 면접 연습 무제한'],
]);

// resume-guide.html
tr('resume-guide.html', [
  ["alert('토큰 차감 비활성화 (테스트 기간)')", "alert('월정액 구독 후 이용 가능합니다.')"],
  ['합격 자기소개서 보기 (토큰 1개)', '합격 자기소개서 보기 (월정액)'],
  ['합격 CV 보기 (토큰 1개)', '합격 CV 보기 (월정액)'],
  ['토큰 2개 (테스트 무료)', '월정액 이용자 전용'],
  ['토큰 1개 (테스트 무료)', '월정액 이용자 전용'],
]);

// success.html
tr('success.html', [
  ['AI 코칭 토큰 무제한', 'AI 코칭 무제한'],
]);

// customer-service.html - check
tr('customer-service.html', [
  ['토큰 2개로 전체 보기', '월정액 구독하고 전체 보기'],
]);

console.log('=== Token removal complete ===');
