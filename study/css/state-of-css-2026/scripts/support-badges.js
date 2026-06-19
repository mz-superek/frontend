(function registerSupportBadges(app) {
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeSupportKey(str) {
  return String(str).toLowerCase().replace(/\s+/g, ' ').trim();
}

function getCardSupportKey(card) {
  const h3 = card?.querySelector('.card-header h3');
  if (!h3) return '';
  const clone = h3.cloneNode(true);
  clone.querySelectorAll('span').forEach((el) => el.remove());
  return normalizeSupportKey(clone.textContent || '');
}

async function loadSupportBadges() {
  const bars = Array.from(document.querySelectorAll('.card > .support-bar'));
  try {
    const res = await fetch('support-badges.json', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();

    // New format: { byFeature: { [normalizedTitle]: badges[] } }
    if (data && data.byFeature && typeof data.byFeature === 'object') {
      const cards = Array.from(document.querySelectorAll('.card'));
      cards.forEach((card) => {
        const key = getCardSupportKey(card);
        const badges = data.byFeature[key];
        const bar = card.querySelector(':scope > .support-bar');
        if (!bar || !Array.isArray(badges)) return;
        bar.innerHTML = badges
          .map((b) => `<span class="pill ${escapeHtml(b.type)}">${escapeHtml(b.label)}</span>`)
          .join('');
      });
      return;
    }

    // Legacy format: [{ index, badges }]
    if (Array.isArray(data)) {
      data.forEach((entry) => {
        const bar = bars[entry.index];
        if (!bar || !Array.isArray(entry.badges)) return;
        bar.innerHTML = entry.badges
          .map((b) => `<span class="pill ${escapeHtml(b.type)}">${escapeHtml(b.label)}</span>`)
          .join('');
      });
    }
  } catch (err) {
    // file:// 환경에서는 fetch가 차단될 수 있어 기존 하드코드 배지를 유지한다.
  }
}

Object.assign(app, {
  loadSupportBadges,
});
})(window.StateCss2026 ||= {});
