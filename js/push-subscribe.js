// WonderfulCrew Web Push 구독
(function() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  var PROMPTED_KEY = 'wc_push_prompted';

  navigator.serviceWorker.register('/sw.js').catch(function() {});

  window.wcPromptPush = async function() {
    // 이미 granted면 구독 정보 서버 전송
    if (Notification.permission === 'granted') {
      await subscribePush();
      localStorage.setItem(PROMPTED_KEY, '1');
      // 사용자에게 피드백
      var toast=document.createElement('div');
      toast.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1A2340;color:#fff;padding:12px 24px;border-radius:28px;font-size:0.84rem;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);';
      toast.textContent='✓ 푸시 알림이 활성화되어 있습니다';
      document.body.appendChild(toast);
      setTimeout(function(){toast.style.opacity='0';toast.style.transition='opacity 0.5s';},2500);
      setTimeout(function(){if(toast.parentNode)toast.remove();},3000);
      return;
    }

    if (localStorage.getItem(PROMPTED_KEY)) return;

    if (Notification.permission === 'denied') {
      localStorage.setItem(PROMPTED_KEY, '1');
      return;
    }

    showPushPopup();
  };

  function showPushPopup() {
    var overlay = document.createElement('div');
    overlay.id = 'wc-push-popup';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:36px 28px;max-width:380px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
      '<div style="font-size:1.8rem;margin-bottom:12px;">🔔</div>' +
      '<h2 style="font-family:\'DM Serif Display\',serif;font-size:1.3rem;color:#1A2340;margin-bottom:8px;">항공사 채용 알림</h2>' +
      '<p style="font-size:0.86rem;color:#5A5048;line-height:1.7;margin-bottom:20px;">채용 오픈, 기출문제, 채용 정보 등<br>중요한 소식을 푸시 알림으로 받으시겠습니까?</p>' +
      '<div style="display:flex;flex-direction:column;gap:10px;">' +
        '<button id="wc-push-yes" style="padding:13px;background:linear-gradient(135deg,#E8C96A,#C9A84C);color:#fff;border:none;border-radius:28px;font-size:0.9rem;font-weight:700;cursor:pointer;font-family:inherit;">알림 받기</button>' +
        '<button id="wc-push-no" style="padding:10px;background:none;border:1px solid #e8e0d0;border-radius:28px;font-size:0.84rem;color:#5A5048;cursor:pointer;font-family:inherit;">다음에</button>' +
      '</div>' +
    '</div>';
    document.body.appendChild(overlay);

    document.getElementById('wc-push-yes').onclick = async function() {
      overlay.remove();
      localStorage.setItem(PROMPTED_KEY, '1');
      await subscribePush();
    };
    document.getElementById('wc-push-no').onclick = function() {
      overlay.remove();
      localStorage.setItem(PROMPTED_KEY, '1');
    };
  }

  async function subscribePush() {
    try {
      var reg = await navigator.serviceWorker.ready;

      var res = await fetch('/api/vapid-public');
      var cfg = await res.json();
      if (!cfg.publicKey) return;

      var sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(cfg.publicKey)
      });

      var user = JSON.parse(localStorage.getItem('wc_user') || '{}');
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userId: user.id || null,
          email: user.email || null
        })
      });
    } catch(e) { console.log('Push subscribe failed:', e); }
  }

  function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var rawData = atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }
})();
