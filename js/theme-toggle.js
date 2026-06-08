/* theme-toggle.js
   다크/라이트 토글 + localStorage 저장 + OS 자동 감지

   사용:
   1) HTML <head>에 이 파일을 <script>로 포함 (가급적 빨리 = FOUC 방지)
   2) <body>에 토글 버튼:
      <button class="theme-toggle" type="button" aria-label="테마 전환">
        <span class="icon-light">🌙</span><span class="icon-dark">☀️</span>
      </button>
*/

(function () {
  var STORAGE_KEY = 'theme';
  var root = document.documentElement;

  // 1) 초기 테마 결정: localStorage > OS > 미지정(시스템 따름)
  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (saved === 'dark' || saved === 'light') {
    root.setAttribute('data-theme', saved);
  }
  // saved 없으면 data-theme 미설정 → theme.css의 :root:not([data-theme]) 분기로 OS 따름

  // 2) 토글 버튼 바인딩 (DOMContentLoaded 후)
  function bindToggle() {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      if (!current) {
        // 아직 미설정 — 현재 실제 적용 테마의 반대로
        var osDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        current = osDark ? 'dark' : 'light';
      }
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindToggle);
  } else {
    bindToggle();
  }
})();
