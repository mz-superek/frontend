(function bootStateCssPlayground(app) {
const {
  doViewTransition,
  loadSupportBadges,
  prettifyEditorSnippets,
  promoteStaticCardsToEditable,
  setupSectionToggles,
  switchETab,
  updateAC,
  updatePreview,
  wireEditorTabs,
} = app;

Object.assign(window, {
  doViewTransition,
  switchETab,
  updateAC,
  updatePreview,
});

document.addEventListener('DOMContentLoaded', () => {
  promoteStaticCardsToEditable();
  prettifyEditorSnippets();
  wireEditorTabs();
  document.querySelectorAll('.pane-editor').forEach((el) => {
    const id = el.dataset.id;
    if (id) updatePreview(id);
  });
  setupSectionToggles();
  loadSupportBadges();
});
})(window.StateCss2026 ||= {});
