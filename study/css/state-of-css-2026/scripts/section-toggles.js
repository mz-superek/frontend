(function registerSectionToggles(app) {
function setupSectionToggles() {
  document.querySelectorAll('.section').forEach((section) => {
    const title = section.querySelector('.section-title');
    if (!title) return;
    const btn = document.createElement('button');
    btn.className = 'section-toggle';
    btn.type = 'button';
    btn.textContent = '접기';
    btn.setAttribute('aria-expanded', 'true');
    btn.addEventListener('click', () => {
      const collapsed = section.classList.toggle('collapsed');
      btn.textContent = collapsed ? '펼치기' : '접기';
      btn.setAttribute('aria-expanded', String(!collapsed));
    });
    title.appendChild(btn);
  });
}

Object.assign(app, {
  setupSectionToggles,
});
})(window.StateCss2026 ||= {});
