const fs=require('fs');
const template=fs.readFileSync('curriculum-klm.html','utf8');
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

// ===== 카타르항공 =====
gen('curriculum-qatar.html',{
  title:'카타르항공',name:'카타르항공',labelEn:'Qatar Airways Curriculum',
  desc:'도하 베이스. 전 세계 오픈데이를 통한 채용. 카타르항공 객실승무원 면접의 모든 단계를 준비하세요.',
  steps:[
    {short:'온라인 지원',name:'온라인 지원',sub:'CV · 사진 · 영어테스트',
     items:['카타르항공 커리어 사이트에서 온라인 지원','CV/이력서 업로드','전신 사진 + 상반신 사진 첨부','온라인 영어 테스트','영상 인터뷰 (셀프 녹화형)'],
     tip:'CV는 영어로 작성. 사진은 깔끔한 비즈니스 룩으로. 영상 인터뷰에서는 자신감 있는 미소가 핵심입니다.'},
    {short:'오픈데이',name:'오픈데이 (현장 면접)',sub:'서류 제출 · 첫인상 · 키/암리치 테스트',
     items:['현장에서 이력서와 사진 제출','1~2개 질문: "Why cabin crew?" "Why Qatar?"','첫인상 평가: 미소, 자세, 그루밍','키 확인: 최소 157.5cm','Arm Reach 테스트: 212cm 이상 (까치발 가능)','타투/흉터 확인 (보이는 타투 불가)'],
     tip:'오픈데이는 초대 없이도 참석 가능합니다. 첫인상이 90%입니다. 밝은 미소, 단정한 비즈니스 정장, 깔끔한 메이크업.',
     links:[{url:'grooming-guide.html',text:'그루밍 가이드 →'}]},
    {short:'영어테스트',name:'영어 테스트 · 스피킹',sub:'필기 45분 · 즉석 스피치 1분',
     items:['영어 필기 테스트 (45분, 5개 유형)','스피킹 테스트: 랜덤 키워드 뽑아서 1분 즉석 발표','문법, 어휘, 독해, 작문 평가','발음보다 자신감과 유창성 평가'],
     tip:'스피킹 테스트에서 키워드를 뽑으면 30초 생각 후 1분간 말합니다. 완벽한 문법보다 자연스럽게 말하는 것이 중요합니다.',
     links:[{url:'daily-english.html',text:'영어 쉐도잉 →'}]},
    {short:'그룹 디스커션',name:'그룹 디스커션',sub:'팀 과제 · 문제 해결 · 팀워크',
     items:['4~6명이 한 팀으로 과제 수행 (약 15분)','주어진 상황에 대한 해결책 토론','팀워크, 리더십, 소통 능력 평가','결론 도출 후 팀 대표 발표'],
     tip:'그룹 디스커션에서 가장 많이 말하는 사람이 합격하는 게 아닙니다. 다른 사람 의견을 경청하고 연결하는 사람이 합격합니다. "I agree with... and I would add..."가 좋은 패턴.',
     links:[{url:'roleplay-practice.html',text:'롤플레이 연습 →'}]},
    {short:'파이널 인터뷰',name:'파이널 인터뷰',sub:'1:1 면접 · 심층 질문 · 처우 안내',
     items:['1:1 개별 면접 (약 20~30분)','Why Qatar Airways?','서비스 경험 구체적 사례','도하 생활 적응 의지','장거리 비행 체력 관련 질문','처우/급여/베네핏 안내'],
     tip:'파이널에서는 진정성이 핵심입니다. 도하에서의 생활, 문화 차이 적응에 대한 긍정적 태도를 보여주세요.',
     links:[{url:'english-interview.html',text:'면접 표현 →'}]}
  ]
});

// ===== 싱가포르항공 =====
gen('curriculum-singapore.html',{
  title:'싱가포르항공',name:'싱가포르항공',labelEn:'Singapore Airlines Curriculum',
  desc:'싱가포르 베이스. 세계 최고 수준의 서비스로 유명한 싱가포르항공 면접을 준비하세요.',
  steps:[
    {short:'온라인 지원',name:'온라인 지원',sub:'이력서 · 사진 · 자격요건',
     items:['싱가포르항공 커리어 사이트 온라인 지원','영문 이력서 업로드','최소 키: 여성 158cm / 남성 165cm','학력: 최소 고졸 이상'],
     tip:'싱가포르항공은 "Singapore Girl/Boy" 이미지가 강합니다. 단정하고 우아한 인상이 중요합니다.'},
    {short:'영상 인터뷰',name:'온라인 영상 인터뷰',sub:'셀프 녹화 · 상황 질문',
     items:['셀프 녹화형 영상 인터뷰','시나리오 기반 질문','Why cabin crew? Why SIA?','영어 지문 읽기','전신 촬영 포함'],
     tip:'영상 인터뷰에서 배경은 깔끔하게, 조명은 얼굴 정면으로. 자연스러운 미소를 유지하세요.',
     links:[{url:'roleplay-practice.html',text:'영상면접 연습 →'}]},
    {short:'Assessment Centre',name:'Assessment Centre',sub:'키 체크 · 그룹 과제 · 개별 면접',
     items:['키/Arm Reach 체크 (즉시 탈락 가능)','그룹 과제: 팀별 질문 답변','서비스 시나리오 롤플레이','스몰톡: 면접관과 자연스러운 대화','개별 면접: 서비스 경험, 동기, 장기 비전'],
     tip:'Assessment Centre는 모든 순간이 평가입니다. 대기 중에도 자세와 표정을 유지하세요. 다른 지원자와의 상호작용도 관찰됩니다.',
     links:[{url:'customer-service.html',text:'고객 응대 스킬 →'}]},
    {short:'파이널 인터뷰',name:'파이널 인터뷰',sub:'심층 면접 · 영어 구술',
     items:['1:1 심층 면접','영어 구술 능력 평가','Why Singapore Airlines specifically?','해외 생활 적응력','서비스 철학에 대한 이해도'],
     tip:'싱가포르항공의 서비스 철학을 사전에 공부하세요. "A Great Way to Fly" 슬로건의 의미를 본인의 경험과 연결하세요.',
     links:[{url:'english-interview.html',text:'면접 표현 →'}]},
    {short:'건강검진',name:'건강검진 · 최종확인',sub:'신체검사 · 배경조사',
     items:['지정 병원 건강검진','배경 조사','최종 합격 통보 (약 2~3주)','합격 후 싱가포르 훈련 시작'],
     tip:'합격부터 입사까지 약 3개월. 입사 전 영어 회화 능력을 더 키워두세요.'}
  ]
});

// ===== 캐세이퍼시픽 =====
gen('curriculum-cathay.html',{
  title:'캐세이퍼시픽',name:'캐세이퍼시픽',labelEn:'Cathay Pacific Curriculum',
  desc:'홍콩 베이스. 캐세이퍼시픽 객실승무원 면접의 모든 단계를 준비하세요.',
  steps:[
    {short:'온라인 지원',name:'온라인 지원 · 디지털 인터뷰',sub:'이력서 · 셀프 녹화 면접',
     items:['캐세이퍼시픽 커리어 사이트 온라인 지원','디지털 인터뷰: 3개 질문 (준비 1분 + 답변 2분)','Why Cathay Pacific?','서비스 경험 관련 질문','영어로 답변'],
     tip:'디지털 인터뷰는 집에서 진행합니다. 3개 질문에 각각 1분 준비, 2분 답변입니다. 핵심만 간결하게.',
     links:[{url:'roleplay-practice.html',text:'영상면접 연습 →'}]},
    {short:'Assessment Day',name:'Assessment Day',sub:'그룹 활동 · 서비스 시나리오',
     items:['Cathay City(홍콩) 또는 해외 채용 도시에서 진행','그룹 활동: 승객 서비스 시나리오 과제','팀워크, 소통, 전문성 평가','Safety Demo 시연 가능'],
     tip:'Assessment Day는 종일 진행됩니다. 체력 관리와 밝은 에너지를 유지하세요. 대기 중에도 평가받고 있습니다.',
     links:[{url:'customer-service.html',text:'고객 응대 스킬 →'}]},
    {short:'개별 면접',name:'개별 면접 (Individual Interview)',sub:'역량 기반 면접 · 20~40분',
     items:['1:1 면접 (20~40분)','역량 기반 질문: "Tell me about a time when..."','지원동기, 장기 계획','서비스 경험 구체적 사례','홍콩 생활 적응 의지','영어/중국어(만다린) 테스트 가능'],
     tip:'STAR 기법으로 답변하세요. 구체적 경험 + 구체적 결과. 중국어가 가능하면 큰 플러스입니다.',
     links:[{url:'english-interview.html',text:'면접 표현 →'}]},
    {short:'건강검진',name:'건강검진 · 배경조사',sub:'신체검사 · 최종 확인',
     items:['건강검진 (Medical Check)','배경 조사 (Background Check)','최종 합격 통보','합격 후 홍콩 훈련 시작'],
     tip:'합격부터 훈련 시작까지 4~10주. 영어 회화와 체력을 유지하세요.'}
  ]
});

// ===== 에티하드 =====
gen('curriculum-etihad.html',{
  title:'에티하드항공',name:'에티하드항공',labelEn:'Etihad Airways Curriculum',
  desc:'아부다비 베이스. 에티하드항공 객실승무원 면접의 모든 단계를 준비하세요.',
  steps:[
    {short:'온라인 지원',name:'온라인 지원',sub:'CV · 사진 · 영상 인터뷰',
     items:['에티하드 커리어 사이트 온라인 지원','영문 CV 업로드','전신 사진 + 상반신 사진','온라인 영상 인터뷰 (셀프 녹화)'],
     tip:'에티하드는 럭셔리 서비스가 핵심입니다. CV와 사진에서 프리미엄 이미지를 보여주세요.'},
    {short:'Assessment Day',name:'Assessment Day',sub:'그룹 활동 · 영어 테스트 · Arm Reach',
     items:['현장 서류 확인 및 첫인상 평가','Arm Reach 테스트: 212cm 이상','영어 테스트 (필기 + 스피킹)','그룹 디스커션: 팀 과제 수행','롤플레이: 기내 서비스 상황 시뮬레이션'],
     tip:'에티하드의 "Choose Well" 브랜드 가치를 이해하세요. 그룹 활동에서는 럭셔리 서비스 마인드를 보여주세요.',
     links:[{url:'roleplay-practice.html',text:'롤플레이 연습 →'}]},
    {short:'파이널 인터뷰',name:'파이널 인터뷰',sub:'1:1 면접 · 심층 질문',
     items:['1:1 개별 면접','Why Etihad?','서비스 경험 심층 질문','아부다비 생활 적응 의지','문화적 감수성 질문','처우/급여 안내'],
     tip:'에티하드는 에미레이트와 다른 차별점을 알고 있어야 합니다. "럭셔리하면서도 따뜻한 서비스"가 키워드.',
     links:[{url:'english-interview.html',text:'면접 표현 →'}]},
    {short:'건강검진',name:'건강검진 · 최종확인',sub:'신체검사 · 배경조사',
     items:['건강검진','배경 조사','최종 합격 통보','아부다비 훈련 시작'],
     tip:'합격 후 아부다비에서 약 7~8주 집중 훈련이 진행됩니다.'}
  ]
});

// ===== 핀에어 =====
gen('curriculum-finnair.html',{
  title:'핀에어',name:'핀에어',labelEn:'Finnair Curriculum',
  desc:'헬싱키 베이스. 핀에어 객실승무원 면접의 모든 단계를 준비하세요.',
  steps:[
    {short:'온라인 지원',name:'온라인 지원',sub:'CV · 커버레터',
     items:['핀에어 커리어 사이트 온라인 지원','영문 CV + 커버레터','어학 요건: 영어 유창 + 핀란드어 우대','EU 취업 가능 비자 필요'],
     tip:'핀에어는 북유럽 스타일의 미니멀하고 효율적인 서비스를 추구합니다. CV도 간결하게.'},
    {short:'영상 인터뷰',name:'영상 인터뷰',sub:'셀프 녹화 · 영어 질의응답',
     items:['셀프 녹화형 영상 인터뷰','Why Finnair? Why cabin crew?','서비스 경험 관련 질문','영어 구술 능력 평가'],
     tip:'핀에어는 "Northern Hospitality" — 과하지 않으면서 세심한 서비스. 이 철학을 이해하고 답변하세요.',
     links:[{url:'roleplay-practice.html',text:'영상면접 연습 →'}]},
    {short:'Assessment Day',name:'Assessment Day (헬싱키)',sub:'그룹 활동 · 개별 면접',
     items:['헬싱키에서 Assessment Day 진행','그룹 활동: 팀 과제, 문제 해결','개별 면접: 역량 기반 질문','서비스 시나리오 롤플레이','영어 + 핀란드어 능력 확인'],
     tip:'핀에어 Assessment Day는 헬싱키에서 진행됩니다. 여행 일정을 미리 준비하세요.',
     links:[{url:'customer-service.html',text:'고객 응대 스킬 →'}]},
    {short:'건강검진',name:'건강검진 · 최종확인',sub:'신체검사 · 배경조사',
     items:['건강검진','배경 조사','최종 합격 통보','헬싱키 훈련 시작'],
     tip:'핀에어 훈련은 헬싱키에서 진행됩니다. 추운 날씨에 대한 적응도 미리 준비하세요.'}
  ]
});

// ===== 에어아시아 =====
gen('curriculum-airasia.html',{
  title:'에어아시아',name:'에어아시아',labelEn:'AirAsia Curriculum',
  desc:'말레이시아 베이스. 아시아 최대 LCC 에어아시아 객실승무원 면접을 준비하세요.',
  steps:[
    {short:'온라인 지원',name:'온라인 지원',sub:'이력서 · 사진',
     items:['에어아시아 커리어 사이트 온라인 지원','영문 이력서','전신 사진 + 상반신 사진','최소 키: 여성 157cm / 남성 170cm'],
     tip:'에어아시아는 밝고 활기찬 에너지를 중요시합니다. 사진에서 자연스러운 미소를 보여주세요.'},
    {short:'Walk-in Interview',name:'Walk-in Interview',sub:'현장 면접 · 첫인상 · 그룹활동',
     items:['현장 서류 제출 및 첫인상 평가','Arm Reach 테스트: 212cm','영어 자기소개 (1분)','그룹 디스커션: 팀 과제','롤플레이: 기내 서비스 상황'],
     tip:'에어아시아 Walk-in은 에너지가 핵심입니다. 밝고 적극적인 모습을 보여주세요.',
     links:[{url:'grooming-guide.html',text:'그루밍 가이드 →'}]},
    {short:'파이널 인터뷰',name:'파이널 인터뷰',sub:'1:1 면접 · 영어 테스트',
     items:['1:1 개별 면접','Why AirAsia?','서비스 경험 질문','영어 구술 테스트','말레이시아 생활 적응 의지'],
     tip:'에어아시아의 "Now Everyone Can Fly" 철학을 이해하세요. LCC이지만 서비스 품질에 대한 자부심이 높습니다.',
     links:[{url:'english-interview.html',text:'면접 표현 →'}]},
    {short:'건강검진',name:'건강검진 · 최종확인',sub:'신체검사',
     items:['건강검진','최종 합격 통보','말레이시아 훈련 시작'],
     tip:'합격 후 쿠알라룸푸르에서 훈련이 진행됩니다.'}
  ]
});

console.log('All foreign airline curricula generated!');
