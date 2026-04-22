// 모바일 드롭다운 — body 로 portal 이동해서 .nav-links overflow 클리핑 회피
(function(){
  var u=navigator.userAgent;
  if(u.indexOf("Chrome")>-1 && u.indexOf("Edg/")<0 && u.indexOf("OPR/")<0 && u.indexOf("SamsungBrowser")<0)
    document.documentElement.classList.add("is-chrome");

  function restoreMenu(m){
    if(!m || !m._wcOrigParent) return;
    try { m._wcOrigParent.insertBefore(m, m._wcOrigNext || null); } catch(e) {}
    m._wcOrigParent = null;
    m._wcOrigNext = null;
    if(m._wcOrigStyle) m.setAttribute("style", m._wcOrigStyle);
    else m.removeAttribute("style");
    m._wcOrigStyle = null;
  }

  function closeAll(){
    // 1) .open 클래스 제거
    document.querySelectorAll(".nav-dropdown.open").forEach(function(d){
      d.classList.remove("open");
    });
    // 2) body 로 portal 이동된 메뉴들 전부 원위치 복구
    //    (.nav-dropdown 내부에서 찾으면 이미 body 로 이동된 경우 못 찾음)
    document.querySelectorAll(".nav-dropdown-menu").forEach(function(m){
      if(m._wcOrigParent) restoreMenu(m);
    });
  }

  document.addEventListener("click", function(e){
    if(window.innerWidth > 900) return;
    var a = e.target.closest && e.target.closest(".nav-dropdown > a");
    if(!a){ closeAll(); return; }
    var p = a.parentElement;
    if(p.classList.contains("open")){
      // 같은 트리거 재탭 — 닫기
      e.preventDefault();
      closeAll();
      return;
    }
    e.preventDefault();
    closeAll();
    // 메뉴 찾기 — portal 이동 전에 .nav-dropdown 안에서 직접
    var menu = p.querySelector(".nav-dropdown-menu");
    // 혹시 이전 호출에서 아직 body 에 남아있는 이 dropdown 의 메뉴가 있으면 그걸 사용
    if(!menu){
      var all = document.body.querySelectorAll(".nav-dropdown-menu");
      for(var i=0;i<all.length;i++){
        if(all[i]._wcOrigParent === p){ menu = all[i]; break; }
      }
    }
    p.classList.add("open");
    if(!menu) return;
    var rect = a.getBoundingClientRect();
    // body 로 이동 (portal) — overflow 클리핑 회피
    if(!menu._wcOrigParent){
      menu._wcOrigParent = menu.parentNode;
      menu._wcOrigNext = menu.nextSibling;
      menu._wcOrigStyle = menu.getAttribute("style") || "";
      document.body.appendChild(menu);
    }
    menu.style.cssText = "display:block!important;position:fixed!important;top:" + (rect.bottom + 4) + "px;left:" + Math.max(8, rect.left) + "px;background:rgba(26,35,64,0.97)!important;border:1px solid rgba(201,168,76,0.3)!important;border-radius:10px!important;box-shadow:0 10px 30px rgba(0,0,0,0.45)!important;padding:6px 0!important;margin:0!important;min-width:180px!important;max-width:calc(100vw - 16px)!important;z-index:9999!important;";
    menu.querySelectorAll("a").forEach(function(la){
      la.style.cssText = "color:#fff!important;display:block!important;padding:9px 16px!important;font-size:0.88rem!important;line-height:1.3!important;text-decoration:none!important;white-space:nowrap!important;";
    });
  });

  // 윈도우 리사이즈 시 닫기 (위치 꼬임 방지)
  window.addEventListener("resize", closeAll);
  // 스크롤 시 닫기 (position:fixed 이 스크롤과 독립이지만 UX 상 닫는 게 자연스러움)
  window.addEventListener("scroll", closeAll, {passive:true});
})();
