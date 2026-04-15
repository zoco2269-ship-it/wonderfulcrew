const fs=require('fs');

const files=[
  'curriculum-asiana.html',
  'curriculum-jeju.html',
  'curriculum-jinair.html',
  'curriculum-tway.html',
  'curriculum-airpremia.html',
  'curriculum-airseoul.html',
  'curriculum-airbusan.html',
  'curriculum-eastar.html',
  'curriculum-aerok.html'
];

const buttons3='  <a href="english-interview.html" class="step-btn">면접 연습 →</a>\n  <a href="daily-english.html" class="step-btn">영어 쉐도잉 →</a>\n  <a href="roleplay-practice.html" class="step-btn">롤플레이 →</a>';
const buttons2='  <a href="english-interview.html" class="step-btn">면접 연습 →</a>\n  <a href="roleplay-practice.html" class="step-btn">롤플레이 →</a>';

files.forEach(f=>{
  if(!fs.existsSync(f)) return;
  let html=fs.readFileSync(f,'utf8');

  // 기존 step-btn 링크 제거 (강의영상, 워킹분석 등은 이미 제거됨)
  // TIP 다음에 버튼 추가 — 서류전형과 건강검진 단계는 제외
  // 각 카드의 </div> 직전에 버튼 삽입

  // 전략: </div>\n\n<div class="card"> 패턴 사이의 각 카드에서
  // "서류전형"이나 "건강검진"이 아닌 카드에만 버튼 추가

  const cards=html.split('</div>\n\n<div class="card">');
  let result=[];

  cards.forEach((card,i)=>{
    // 서류전형, 건강검진, 역량검사 카드는 버튼 안 넣음
    const isSkip=/서류전형|건강검진|역량검사/.test(card);
    // 이미 step-btn이 있으면 스킵
    const hasBtn=/step-btn/.test(card);

    if(!isSkip && !hasBtn && card.includes('<h3>')){
      // 영어 관련 내용이 있으면 3개, 없으면 2개
      const hasEnglish=/영어|English|영어구술|영어 면접|영어 질의/.test(card);
      const btns=hasEnglish?buttons3:buttons2;

      // </div> 마지막 직전에 버튼 삽입
      // TIP이 있으면 TIP 뒤에, 없으면 </ul> 뒤에
      if(card.includes('class="tip"')){
        card=card.replace(/(class="tip">[^<]*<\/div>)/, '$1\n'+btns);
      } else if(card.includes('</ul>')){
        card=card.replace(/<\/ul>/, '</ul>\n'+btns);
      }
    }
    result.push(card);
  });

  const newHtml=result.join('</div>\n\n<div class="card">');
  fs.writeFileSync(f,newHtml,'utf8');
  console.log('Updated:',f);
});

console.log('Done!');
