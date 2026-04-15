const fs=require('fs');
const template=fs.readFileSync('curriculum-koreanair.html','utf8');
const headNav=template.split('<div class="hero">')[0];
const footer='<footer>© 2026 WonderfulCrew Inc. Premium Cabin Crew Coaching.</footer>\n</body></html>';

function gen(file, data){
  let html=headNav;
  html=html.replace(/<title>[^<]+<\/title>/,'<title>'+data.title+' 커리큘럼   WonderfulCrew</title>');
  html+='\n<div class="hero">\n  <div class="label">'+data.labelEn+'</div>\n  <h1>'+data.name+'<br><em>면접 완벽 준비</em></h1>\n  <p>'+data.desc+'</p>\n</div>\n\n<section><div class="wrap">\n\n';
  html+='<div class="process">\n';
  data.steps.forEach(function(s,i){
    html+='  <span'+(i===0?' class="active"':'')+'>'+s.short+'</span>';
    if(i<data.steps.length-1) html+='<span class="arrow">→</span>\n';
  });
  html+='\n</div>\n\n';
  data.steps.forEach(function(s,i){
    html+='<div class="card">\n  <h3>'+(i+1)+'단계: '+s.name+'</h3>\n';
    if(s.sub) html+='  <div class="sub">'+s.sub+'</div>\n';
    html+='  <ul>\n';
    s.items.forEach(function(item){html+='    <li>'+item+'</li>\n';});
    html+='  </ul>\n';
    if(s.tip) html+='  <div class="tip"><b>TIP:</b> '+s.tip+'</div>\n';
    if(s.links) s.links.forEach(function(l){html+='  <a href="'+l.url+'" class="step-btn">'+l.text+'</a>\n';});
    html+='</div>\n\n';
  });
  html+='<div style="text-align:center;margin-top:32px;">\n  <a href="curriculum.html" class="step-btn" style="background:var(--navy);">← 항공사 선택으로</a>\n  <a href="lecture.html" class="step-btn" style="background:linear-gradient(135deg,#E8C96A,#C9A84C);">강의영상 보기 →</a>\n</div>\n\n</div></section>\n'+footer;
  fs.writeFileSync(file,html,'utf8');
  console.log('Created:',file);
}

// ===== 에어부산 =====
gen('curriculum-airbusan.html',{
  title:'에어부산',name:'에어부산',labelEn:'Air Busan Curriculum',
  desc:'부산 베이스. 에어부산 객실승무원 면접의 모든 단계를 준비하세요.',
  steps:[
    {short:'서류전형',name:'서류전형',sub:'자기소개서 · 증명사진',
     items:['자기소개서: 서비스 경험, 지원동기 중심','증명사진: 밝고 친근한 인상','어학성적 제출'],
     tip:'에어부산은 아시아나항공 자회사입니다. 부산/경남 지역 연고가 있으면 플러스.'},
    {short:'1차 이미지면접',name:'1차 면접 (이미지)',sub:'이미지 평가 · 자기소개',
     items:['이미지 평가: 표정, 자세, 헤어, 메이크업','한국어 자기소개 (1분)','간단한 영어 질의응답','서비스 마인드 질문','워킹 테스트'],
     tip:'밝은 미소와 자신감 있는 자세가 핵심. 에어부산의 친근한 이미지에 맞게 준비하세요.',
     links:[{url:'grooming-guide.html',text:'그루밍 가이드 →'}]},
    {short:'2차 디스커션',name:'2차 면접 (그룹 디스커션)',sub:'그룹 토론 · 팀워크 평가',
     items:['그룹 디스커션: 주어진 주제에 대해 팀 토론','팀워크 · 소통 능력 평가','찬반 토론 또는 상황 해결 과제','발표 및 의견 조율 능력'],
     tip:'디스커션에서는 자기 의견만 주장하지 마세요. 다른 사람 의견을 듣고 연결하는 능력이 핵심입니다. "좋은 의견이네요, 거기에 더해서..."',
     links:[{url:'roleplay-practice.html',text:'롤플레이 연습 →'}]},
    {short:'임원면접',name:'임원면접',sub:'심층 인성 · 최종 평가',
     items:['지원동기 심화: Why Air Busan?','인성 질문: 팀워크, 책임감, 갈등 해결','기내 상황 대처 질문','마지막 할 말'],
     tip:'에어부산의 노선 특성(일본/동남아 단거리)을 이해하고 답변하세요.'},
    {short:'건강검진',name:'건강검진',sub:'신체검사',
     items:['지정 병원 건강검진','교정시력 확인'],
     tip:'건강검진 전 충분한 수면과 금주.'}
  ]
});

// ===== 이스타항공 =====
gen('curriculum-eastar.html',{
  title:'이스타항공',name:'이스타항공',labelEn:'Eastar Jet Curriculum',
  desc:'이스타항공 객실승무원 면접의 모든 단계를 준비하세요.',
  steps:[
    {short:'서류전형',name:'서류전형',sub:'자기소개서 · 증명사진',
     items:['자기소개서 제출','증명사진: 밝고 활기찬 인상','어학성적 제출'],
     tip:'이스타항공은 재도약 중인 항공사입니다. 성장하는 회사와 함께하고 싶다는 의지를 보여주세요.'},
    {short:'1차 면접',name:'1차 면접 (이미지 · 영어)',sub:'이미지 평가 · 영어 질의응답',
     items:['이미지 평가: 표정, 자세, 전체적 인상','한국어/영어 자기소개','서비스 경험 질문','간단한 영어 질의응답'],
     tip:'밝은 에너지와 자신감이 핵심. 이스타항공의 젊고 역동적인 이미지에 맞게.',
     links:[{url:'grooming-guide.html',text:'그루밍 가이드 →'}]},
    {short:'2차 디스커션',name:'2차 면접 (그룹 디스커션)',sub:'그룹 토론 · 상황 대처',
     items:['그룹 디스커션: 주어진 주제에 대해 토론','팀워크 평가','기내 상황 대처 시나리오','의견 조율 및 발표'],
     tip:'디스커션에서는 경청이 가장 중요합니다. 상대 의견을 존중하면서 본인 의견을 더하세요.',
     links:[{url:'roleplay-practice.html',text:'롤플레이 연습 →'}]},
    {short:'임원면접',name:'임원면접',sub:'심층 인성 · 최종 평가',
     items:['지원동기 심화','인성 질문: 팀워크, 책임감','마지막 할 말'],
     tip:'짧고 핵심적으로. 감사+메시지+각오.'},
    {short:'건강검진',name:'건강검진',sub:'신체검사',
     items:['지정 병원 건강검진'],
     tip:'기본 건강검진 항목입니다.'}
  ]
});

// ===== 에어로케이 =====
gen('curriculum-aerok.html',{
  title:'에어로케이',name:'에어로케이',labelEn:'Aero K Curriculum',
  desc:'청주 베이스. 에어로케이 객실승무원 면접의 모든 단계를 준비하세요.',
  steps:[
    {short:'서류전형',name:'서류전형',sub:'자기소개서 · 증명사진',
     items:['자기소개서 제출','증명사진','어학성적 제출'],
     tip:'에어로케이는 청주 베이스 신생 항공사입니다. 새로운 항공사와 함께 성장하겠다는 의지가 중요합니다.'},
    {short:'1차 면접',name:'1차 면접 (이미지)',sub:'이미지 평가 · 자기소개',
     items:['이미지 평가','한국어 자기소개','영어 간단 질의응답','서비스 경험 질문'],
     tip:'신생 항공사답게 유연하고 적극적인 태도를 보여주세요.',
     links:[{url:'grooming-guide.html',text:'그루밍 가이드 →'}]},
    {short:'2차 디스커션',name:'2차 면접 (그룹 디스커션)',sub:'그룹 토론 · 팀워크',
     items:['그룹 디스커션: 주어진 주제 토론','팀워크 · 소통 능력 평가','상황 대처 과제','의견 발표'],
     tip:'소규모 항공사는 팀워크가 더 중요합니다. 협동심을 강조하세요.',
     links:[{url:'roleplay-practice.html',text:'롤플레이 연습 →'}]},
    {short:'임원면접',name:'임원면접',sub:'심층 인성 · 최종 평가',
     items:['지원동기: Why 에어로케이?','인성 질문','기내 상황 대처','마지막 할 말'],
     tip:'에어로케이의 비전과 노선 특성을 사전에 파악하세요.'},
    {short:'건강검진',name:'건강검진',sub:'신체검사',
     items:['지정 병원 건강검진'],
     tip:'기본 건강검진 항목입니다.'}
  ]
});

console.log('Done!');
