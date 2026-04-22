// 모바일 드롭다운 — body 로 portal 이동해서 .nav-links overflow 클리핑 회피
(function(){
  var u=navigator.userAgent;
  if(u.indexOf("Chrome")>-1 && u.indexOf("Edg/")<0 && u.indexOf("OPR/")<0 && u.indexOf("SamsungBrowser")<0)
    document.documentElement.classList.add("is-chrome");

  function closeAll(){
    document.querySelectorAll(".nav-dropdown.open").forEach(function(d){
      d.classList.remove("open");
      var m = d.querySelector(".nav-dropdown-menu");
      if(m && m._wcOrigParent){
        m._wcOrigParent.insertBefore(m, m._wcOrigNext || null);
        m._wcOrigParent = null;
        if(m._wcOrigStyle !== undefined) m.setAttribute("style", m._wcOrigStyle);
        else m.removeAttribute("style");
      }
    });
  }

  document.addEventListener("click", function(e){
    if(window.innerWidth > 900) return;
    var a = e.target.closest && e.target.closest(".nav-dropdown > a");
    if(!a){ closeAll(); return; }
    var p = a.parentElement;
    if(p.classList.contains("open")){ return; }
    e.preventDefault();
    closeAll();
    p.classList.add("open");
    var menu = p.querySelector(".nav-dropdown-menu");
    if(!menu) return;
    var rect = a.getBoundingClientRect();
    // body 로 이동 (portal) — overflow 클리핑 회피
    menu._wcOrigParent = menu.parentNode;
    menu._wcOrigNext = menu.nextSibling;
    menu._wcOrigStyle = menu.getAttribute("style") || "";
    document.body.appendChild(menu);
    menu.style.cssText = "display:block!important;position:fixed!important;top:" + (rect.bottom + 4) + "px;left:" + Math.max(8, rect.left) + "px;background:rgba(26,35,64,0.97)!important;border:1px solid rgba(201,168,76,0.3)!important;border-radius:10px!important;box-shadow:0 10px 30px rgba(0,0,0,0.45)!important;padding:6px 0!important;margin:0!important;min-width:180px!important;max-width:calc(100vw - 16px)!important;z-index:9999!important;";
    menu.querySelectorAll("a").forEach(function(la){
      la.style.cssText = "color:#fff!important;display:block!important;padding:9px 16px!important;font-size:0.88rem!important;line-height:1.3!important;text-decoration:none!important;white-space:nowrap!important;";
    });
  });

  // 윈도우 리사이즈 시 닫기 (위치 꼬임 방지)
  window.addEventListener("resize", closeAll);
})();
