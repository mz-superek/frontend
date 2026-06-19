(function registerDemoActions(app) {
function updateAC(v) {
  ['ac-cb', 'ac-rb', 'ac-range'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.accentColor = v;
  });
}

let vtPage = 'A';

function doViewTransition() {
  const el = document.getElementById('vt-demo');
  const applyNext = () => {
    vtPage = vtPage === 'A' ? 'B' : 'A';
    el.classList.toggle('is-alt', vtPage === 'B');
    el.textContent = 'Page ' + vtPage;
  };

  document.startViewTransition(applyNext);
}

Object.assign(app, {
  doViewTransition,
  updateAC,
});
Object.assign(window, {
  doViewTransition,
  updateAC,
});
})(window.StateCss2026 ||= {});
