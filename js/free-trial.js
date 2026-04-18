/**
 * WonderfulCrew 무료체험 시스템
 * - 총 10회 무료 콘텐츠 열람
 * - 소진 후 월정액 구독 유도
 *
 * 사용법:
 *   if (useFreeTrialOrCheck()) {
 *     // 콘텐츠 보여주기
 *   }
 *   // → 무료체험 남아있으면 1회 차감 후 true 반환
 *   // → 소진됐으면 구독 팝업 띄우고 false 반환
 *   // → 구독자면 항상 true
 */

var FREE_TRIAL_KEY = 'wc_free_trial';
var FREE_TRIAL_MAX = 10;

function getTrialData() {
  try { return JSON.parse(localStorage.getItem(FREE_TRIAL_KEY) || '{}'); } catch(e) { return {}; }
}

function saveTrialData(data) {
  localStorage.setItem(FREE_TRIAL_KEY, JSON.stringify(data));
}

// 남은 무료체험 횟수
function getFreeTrialLeft() {
  var data = getTrialData();
  if (data.subscribed) return -1; // 구독자는 무제한
  var used = data.used || 0;
  return Math.max(0, FREE_TRIAL_MAX - used);
}

// 구독자 여부
function isSubscribed() {
  var data = getTrialData();
  return data.subscribed === true;
}

// 무료체험 사용 또는 구독 체크
// true 반환 = 콘텐츠 접근 가능, false = 불가
function useFreeTrialOrCheck() {
  if (typeof isAdmin === 'function' && isAdmin()) return true;

  var data = getTrialData();

  // 구독자는 항상 통과
  if (data.subscribed) return true;

  var used = data.used || 0;
  var left = FREE_TRIAL_MAX - used;

  if (left > 0) {
    // 무료체험 1회 차감
    data.used = used + 1;
    saveTrialData(data);
    var remaining = FREE_TRIAL_MAX - data.used;
    showTrialToast(remaining);
    return true;
  } else {
    // 소진 → 구독 유도
    showSubscribePopup();
    return false;
  }
}

// 무료체험 N회 남음 토스트
function showTrialToast(remaining) {
  var existing = document.getElementById('wc-trial-toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'wc-trial-toast';
  toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1A2340;color:#fff;padding:12px 24px;border-radius:28px;font-size:0.84rem;font-family:inherit;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);display:flex;align-items:center;gap:8px;';
  if (remaining > 0) {
    toast.innerHTML = '<span style="color:#C9A84C;font-weight:700;">무료체험</span> ' + remaining + '회 남음';
  } else {
    toast.innerHTML = '<span style="color:#C9A84C;font-weight:700;">무료체험</span> 모두 사용 완료';
  }
  document.body.appendChild(toast);
  setTimeout(function() { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; }, 2500);
  setTimeout(function() { if (toast.parentNode) toast.remove(); }, 3000);
}

// 월정액 구독 팝업
function showSubscribePopup() {
  var existing = document.getElementById('wc-subscribe-popup');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'wc-subscribe-popup';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:40px 32px;max-width:400px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
    '<div style="font-size:2rem;margin-bottom:12px;">✨</div>' +
    '<h2 style="font-family:\'DM Serif Display\',serif;font-size:1.4rem;color:#1A2340;margin-bottom:8px;">무료체험이 끝났습니다</h2>' +
    '<p style="font-size:0.88rem;color:#5A5048;line-height:1.7;margin-bottom:24px;">더 많은 콘텐츠와 AI 코칭을 이용하려면<br>월정액을 구독해주세요.</p>' +
    '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<a href="token-rewards.html" style="display:block;padding:14px;background:linear-gradient(135deg,#E8C96A,#C9A84C);color:#fff;border-radius:28px;font-size:0.92rem;font-weight:700;text-decoration:none;">구독 플랜 보기</a>' +
      '<button onclick="this.closest(\'#wc-subscribe-popup\').remove();" style="padding:10px;background:none;border:1px solid #e8e0d0;border-radius:28px;font-size:0.84rem;color:#5A5048;cursor:pointer;font-family:inherit;">닫기</button>' +
    '</div>' +
  '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
}

// 현재 상태 표시 배지 (선택적으로 페이지에 삽입)
function renderTrialBadge(containerId) {
  var el = document.getElementById(containerId);
  if (!el) return;
  if (isSubscribed()) {
    el.innerHTML = '<span style="color:#C9A84C;font-weight:600;font-size:0.82rem;">구독 중 ✓</span>';
  } else {
    var left = getFreeTrialLeft();
    el.innerHTML = '<span style="font-size:0.82rem;color:#5A5048;">무료체험 <b style="color:#C9A84C;">' + left + '회</b> 남음</span>';
  }
}
