const fs=require('fs');

// 대한항공 템플릿에서 head+nav+footer 추출
const template=fs.readFileSync('curriculum-koreanair.html','utf8');
const headNav=template.split('<div class="hero">')[0];
const footer='<footer>© 2026 WonderfulCrew Inc. Premium Cabin Crew Coaching.</footer>\n</body></html>';

function gen(file, data){
  let html=headNav;
  html=html.replace(/<title>[^<]+<\/title>/,'<title>'+data.title+' 커리큘럼   WonderfulCrew</title>');
  html+='\n<div class="hero">\n  <div class="label">'+data.labelEn+'</div>\n  <h1>'+data.name+'<br><em>면접 완벽 준비</em></h1>\n  <p>'+data.desc+'</p>\n</div>\n\n<section><div class="wrap">\n\n';
  // Process bar
  html+='<div class="process">\n';
  data.steps.forEach(function(s,i){
    html+='  <span'+(i===0?' class="active"':'')+'>'+s.short+'</span>';
    if(i<data.steps.length-1) html+='<span class="arrow">→</span>\n';
  });
  html+='\n</div>\n\n';
  // Cards
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

// ===== 아시아나항공 =====
gen('curriculum-asiana.html',{
  title:'아시아나항공',name:'아시아나항공',labelEn:'Asiana Airlines Curriculum',
  desc:'대한항공 통합 이후 새로운 채용 프로세스에 맞춘 체계적 준비. 서류부터 최종합격까지.',
  steps:[
    {short:'서류전형',name:'서류전형',sub:'자기소개서 · 증명사진 · 어학성적',
     items:['자기소개서: 서비스 경험 중심, 아시아나만의 차별화 포인트 강조','증명사진: 밝고 단정한 인상','어학성적: TOEIC 550점 이상 / TOEIC Speaking IM 이상 / OPIc IM 이상','교정시력 1.0 이상'],
     tip:'대한항공 통합 이후 채용 기준이 변화하고 있습니다. 아시아나의 "아름다운 사람들" 브랜드 가치를 이해하되, 통합 항공사로서의 비전도 준비하세요.'},
    {short:'온라인 면접',name:'온라인 면접 (비대면)',sub:'동영상 면접 · 영어 자기소개',
     items:['비대면 동영상 면접 (녹화형)','한국어/영어 자기소개','지원동기 및 서비스 경험','이미지/표정/자세 평가'],
     tip:'카메라를 정면으로 보고, 자연스러운 미소를 유지하세요. 배경은 깔끔하게.',
     links:[{url:'roleplay-practice.html',text:'영상면접 연습 →'}]},
    {short:'영어구술',name:'영어구술 면접',sub:'영어 대화 · 상황 대처',
     items:['영어 구술 능력 평가','일상 영어 대화','서비스 상황 영어 대처','Why Asiana? 영어 답변'],
     tip:'영어 유창함보다 자신감과 미소가 중요합니다. 쉬운 단어로 명확하게.',
     links:[{url:'daily-english.html',text:'영어 쉐도잉 →'}]},
    {short:'인성검사',name:'인성검사 · 최종면접',sub:'인성검사 · 임원면접',
     items:['온라인 인성검사','임원면접: 심층 인성 질문','지원동기 심화','마지막 할 말'],
     tip:'진정성이 핵심입니다. 외운 답변이 아닌 본인의 경험을 본인의 언어로.'},
    {short:'건강검진',name:'건강검진 · 수영',sub:'신체검사 · 수영 테스트',
     items:['지정 병원 건강검진','수영 테스트: 50m 완영','Arm Reach 테스트'],
     tip:'수영은 시간 제한 없이 완주하면 됩니다. 미리 연습하세요.'}
  ]
});

// ===== 제주항공 =====
gen('curriculum-jeju.html',{
  title:'제주항공',name:'제주항공',labelEn:'Jeju Air Curriculum',
  desc:'제주항공 객실승무원 면접의 모든 단계를 체계적으로 준비하세요.',
  steps:[
    {short:'서류전형',name:'서류전형',sub:'자기소개서 · 증명사진',
     items:['자기소개서: 서비스 경험, 지원동기','증명사진: 밝고 활기찬 인상','어학성적 제출'],
     tip:'제주항공은 밝고 에너지 넘치는 이미지를 선호합니다. 자기소개서에도 활력이 느껴지게 작성하세요.'},
    {short:'1차 이미지면접',name:'1차 면접 (이미지)',sub:'이미지 평가 · 워킹 · 자기소개',
     items:['이미지 평가: 표정, 자세, 전체적 인상','워킹 테스트','한국어 자기소개 (1분)','간단한 영어 질의응답','서비스 마인드 질문'],
     tip:'밝은 미소와 자신감 있는 워킹이 핵심입니다. 워킹할 때 어깨를 펴고 정면을 보세요.',
     links:[{url:'walking-analysis.html',text:'워킹 분석 →'}]},
    {short:'2차 그룹면접',name:'2차 면접 (그룹토론)',sub:'그룹 디스커션 · 상황 대처',
     items:['그룹 디스커션: 주어진 주제에 대해 토론','팀워크 평가: 다른 지원자와의 소통 능력','상황 대처 질문: 기내 컴플레인 시나리오','영어 면접 포함 가능'],
     tip:'그룹 디스커션에서는 자기 의견만 강하게 주장하지 마세요. 다른 사람의 의견을 경청하고 "We"로 말하는 것이 핵심입니다.',
     links:[{url:'roleplay-practice.html',text:'롤플레이 연습 →'}]},
    {short:'임원면접',name:'임원면접',sub:'심층 인성 · 최종 평가',
     items:['지원동기 심화','인성 질문: 팀워크, 책임감','기내 상황 대처 질문','마지막 할 말'],
     tip:'임원면접은 짧고 간결하게. 핵심만 전달하세요.'},
    {short:'건강검진',name:'건강검진',sub:'신체검사 · 체력테스트',
     items:['지정 병원 건강검진','체력 테스트 (항공사별 상이)'],
     tip:'건강검진 전 충분한 수면과 금주가 중요합니다.'}
  ]
});

// ===== 진에어 =====
gen('curriculum-jinair.html',{
  title:'진에어',name:'진에어',labelEn:'Jin Air Curriculum',
  desc:'진에어만의 독특한 토론면접과 핑퐁 대화형 면접을 완벽하게 준비하세요.',
  steps:[
    {short:'서류/영상',name:'서류전형 · 영상면접',sub:'자기소개서 · 동영상 면접',
     items:['자기소개서 제출','동영상 면접 (녹화형)','영어 자기소개','지원동기'],
     tip:'진에어는 자유롭고 젊은 분위기를 선호합니다. 딱딱하지 않게, 자연스러운 모습을 보여주세요.'},
    {short:'1차 토론면접',name:'1차 면접 (그룹 토론)',sub:'디스커션 · 팀워크 평가',
     items:['그룹 디스커션: 찬반 토론 또는 주제 토론','팀워크 능력 평가','리더십 vs 협동심 관찰','발표 능력'],
     tip:'토론에서 가장 중요한 것은 "경청"입니다. 상대 의견을 듣고 거기에 연결해서 말하세요. "좋은 의견이네요, 거기에 더해서..."가 좋은 패턴입니다.',
     links:[{url:'roleplay-practice.html',text:'롤플레이 연습 →'}]},
    {short:'역량검사',name:'역량검사 (온라인)',sub:'인성검사 · 역량평가',
     items:['온라인 인성/역량 검사','성격 유형 파악','서비스 적합도 평가'],
     tip:'일관성 있게 답변하세요. 앞뒤 답변이 모순되면 감점입니다.'},
    {short:'2차 핑퐁면접',name:'2차 면접 (핑퐁 대화형)',sub:'임원면접 · 빠른 질의응답',
     items:['핑퐁 대화형: 빠르게 질문과 답변이 오가는 형태','순발력 평가','지원동기, 인성, 상황 대처를 빠르게 확인','마지막 할 말'],
     tip:'핑퐁면접은 생각할 시간이 거의 없습니다. 짧고 핵심적으로 답변하세요. 길게 말하면 오히려 감점입니다.'},
    {short:'건강검진',name:'건강검진',sub:'신체검사',
     items:['지정 병원 건강검진','기본 체력 확인'],
     tip:'건강검진은 기본 항목입니다. 평소 건강 관리가 중요합니다.'}
  ]
});

// ===== 티웨이항공 =====
gen('curriculum-tway.html',{
  title:'티웨이항공',name:'티웨이항공',labelEn:'T\'way Air Curriculum',
  desc:'티웨이항공 객실승무원 면접 전 단계를 빠짐없이 준비하세요.',
  steps:[
    {short:'서류전형',name:'서류전형',sub:'자기소개서 · 증명사진',
     items:['자기소개서: 서비스 경험 중심','증명사진: 밝고 친근한 인상','어학성적 제출'],
     tip:'티웨이항공은 친근하고 따뜻한 이미지를 중요시합니다.'},
    {short:'1차 면접',name:'1차 면접 (이미지 · 영어)',sub:'이미지 평가 · 영어 질의응답',
     items:['이미지 평가: 표정, 자세, 헤어, 메이크업','한국어 자기소개 (1분)','영어 질의응답','서비스 경험 질문'],
     tip:'첫인상이 결정적입니다. 밝은 미소와 자신감 있는 자세로.',
     links:[{url:'grooming-guide.html',text:'그루밍 가이드 →'}]},
    {short:'2차 면접',name:'2차 면접 (심층)',sub:'인성면접 · 상황 대처',
     items:['심층 인성 면접','팀워크 경험 질문','갈등 해결 경험','기내 서비스 상황 대처','지원동기 심화'],
     tip:'구체적 경험 사례를 미리 3-4개 준비하세요. STAR(상황-과제-행동-결과) 기법을 활용하세요.',
     links:[{url:'english-interview.html',text:'면접 표현 →'}]},
    {short:'3차 면접',name:'3차 면접 (임원)',sub:'임원면접 · 최종 평가',
     items:['임원면접: 지원동기, 비전, 인성','회사에 대한 이해도','마지막 할 말'],
     tip:'30초 이내로 간결하게. 감사+핵심 메시지+각오.'},
    {short:'건강검진',name:'건강검진',sub:'신체검사',
     items:['지정 병원 건강검진'],
     tip:'건강검진 전 충분한 수면과 금주.'}
  ]
});

// ===== 에어프레미아 =====
gen('curriculum-airpremia.html',{
  title:'에어프레미아',name:'에어프레미아',labelEn:'Air Premia Curriculum',
  desc:'중장거리 하이브리드 항공사 에어프레미아의 면접을 준비하세요.',
  steps:[
    {short:'서류전형',name:'서류전형',sub:'이력서 · 자기소개서',
     items:['이력서/자기소개서 제출','서비스 경험 중심 작성','영어 능력 증빙'],
     tip:'에어프레미아는 중장거리 노선 특성상 영어 능력과 체력을 중요시합니다.'},
    {short:'1차 면접',name:'1차 면접 (이미지 · 실무)',sub:'이미지 평가 · 실무 면접',
     items:['이미지 평가','한국어/영어 자기소개','서비스 경험 질문','Why Air Premia?','중장거리 비행 적합성 질문'],
     tip:'에어프레미아는 "프리미엄 이코노미" 콘셉트입니다. 가성비 있는 프리미엄 서비스에 대한 이해를 보여주세요.',
     links:[{url:'roleplay-practice.html',text:'롤플레이 연습 →'}]},
    {short:'2차 면접',name:'2차 면접 (Culture Fit)',sub:'컬처핏 면접 · 인성 평가',
     items:['Culture Fit 면접: 회사 가치관과의 적합성','팀워크 · 소통 능력','장거리 비행 체력 관련 질문','해외 체류 경험 또는 적응력'],
     tip:'에어프레미아의 핵심 가치를 사전에 파악하세요. 스타트업 문화를 이해하고 유연한 태도를 보여주세요.'},
    {short:'건강검진',name:'건강검진',sub:'신체검사',
     items:['지정 병원 건강검진','교정시력 확인'],
     tip:'중장거리 항공사 특성상 체력 기준이 높을 수 있습니다.'}
  ]
});

// ===== 에어서울 =====
gen('curriculum-airseoul.html',{
  title:'에어서울',name:'에어서울',labelEn:'Air Seoul Curriculum',
  desc:'에어서울 객실승무원 면접을 단계별로 준비하세요.',
  steps:[
    {short:'서류전형',name:'서류전형',sub:'자기소개서 · 증명사진',
     items:['자기소개서 제출','증명사진: 밝고 친근한 인상','어학성적 제출'],
     tip:'아시아나항공 자회사로서의 서비스 기준을 이해하고 작성하세요.'},
    {short:'1차 면접',name:'1차 면접 (이미지)',sub:'이미지 평가 · 자기소개',
     items:['이미지 평가: 표정, 자세, 전체적 인상','한국어 자기소개 (1분)','간단한 영어 질의응답','서비스 경험 질문'],
     tip:'에어서울은 일본 노선이 주력입니다. 일본어 능력이 있으면 플러스.',
     links:[{url:'grooming-guide.html',text:'그루밍 가이드 →'}]},
    {short:'2차 면접',name:'2차 면접 (심층)',sub:'인성면접 · 상황대처',
     items:['심층 인성 면접','팀워크 경험','기내 상황 대처 질문','지원동기 심화','마지막 할 말'],
     tip:'에어서울만의 차별점(일본 노선, 아시아나 그룹)을 이해하고 답변하세요.',
     links:[{url:'customer-service.html',text:'고객 응대 스킬 →'}]},
    {short:'건강검진',name:'건강검진',sub:'신체검사',
     items:['지정 병원 건강검진'],
     tip:'기본 건강검진 항목입니다.'}
  ]
});

// ===== KLM =====
gen('curriculum-klm.html',{
  title:'KLM',name:'KLM Royal Dutch Airlines',labelEn:'KLM Curriculum',
  desc:'네덜란드 암스테르담 베이스. KLM 객실승무원 면접의 모든 단계를 준비하세요.',
  steps:[
    {short:'Online Application',name:'온라인 지원',sub:'CV · 사진 · 어학 증빙',
     items:['온라인 지원서 작성 (KLM 커리어 사이트)','CV/이력서 업로드','최근 사진 첨부','어학 증빙: 영어 + 네덜란드어 (네덜란드어 B2 이상 필수)','비자/취업 자격 증빙'],
     tip:'KLM은 네덜란드어가 필수입니다 (B2 이상). 영어만으로는 지원 불가합니다. 네덜란드어 학습을 미리 시작하세요.'},
    {short:'Online Test',name:'온라인 테스트',sub:'적성검사 · 언어평가 · 인성검사',
     items:['언어 평가 (영어 + 네덜란드어)','상황판단 테스트 (Situational Judgment Test)','성격/인성 프로파일링','고객 서비스 적합도 평가'],
     tip:'상황판단 테스트는 정답이 없습니다. 서비스 마인드와 팀워크를 보여주는 선택을 하세요.'},
    {short:'Assessment Day',name:'Assessment Day (암스테르담)',sub:'그룹 활동 · 롤플레이 · 프레젠테이션',
     items:['Meet & Greet: 네덜란드어와 영어로 자기소개 (약 1.5분)','그룹 과제: 팀으로 특정 목표를 달성하는 과제','롤플레이: 기내 서비스 상황 시뮬레이션','문제 해결 과제'],
     tip:'Assessment Day는 암스테르담에서 진행됩니다. 자기소개는 네덜란드어로 준비해야 합니다. 그룹 과제에서는 리더십보다 협동심을 보여주세요.',
     links:[{url:'roleplay-practice.html',text:'롤플레이 연습 →'}]},
    {short:'CBI Interview',name:'CBI 면접 (Criteria Based Interview)',sub:'역량 기반 면접 · 2인 면접관',
     items:['2명의 면접관과 역량 기반 면접','서비스 경험 관련 구체적 사례 질문','팀워크, 리더십, 문제 해결 역량 평가','Why KLM?','해외 생활 적응력 질문'],
     tip:'CBI 면접은 "Tell me about a time when..." 형식입니다. STAR 기법(상황-과제-행동-결과)으로 구체적 사례를 준비하세요.',
     links:[{url:'english-interview.html',text:'면접 표현 →'}]},
    {short:'Final Check',name:'최종 확인',sub:'배경조사 · 건강검진',
     items:['배경 조사 (Background Check)','보안 조사','레퍼런스 체크','건강검진 (약물/알코올 검사 포함)'],
     tip:'모든 선발 과정 통과 후 약 40시간 디지털 과정 + 20일 집중 훈련(Schiphol-East)이 진행됩니다.'}
  ]
});

console.log('All curriculum pages generated!');
