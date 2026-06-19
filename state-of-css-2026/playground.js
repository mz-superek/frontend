/* ── 탭 전환 ── */
function switchETab(btn, id, type) {
  const editor = btn.closest('.pane-editor');
  editor.querySelectorAll('.etab').forEach((b) => b.classList.remove('active'));
  editor.querySelectorAll('.code-ta').forEach((t) => t.classList.remove('active'));
  btn.classList.add('active');
  editor.querySelector('.' + type + '-ta').classList.add('active');
}

/* ── 에디터 → 프리뷰 실시간 반영 ── */
function updatePreview(id) {
  const css = document.getElementById(id + '-css').value;
  const html = document.getElementById(id + '-html').value;
  const jsEl = document.getElementById(id + '-js');
  const js = jsEl ? jsEl.value : '';
  const safeJs = String(js || '').replace(/<\/script>/gi, '<\\/script>');
  const jsBlock = safeJs ? `\n<script>\n${safeJs}\n</` + 'script>' : '';
  const doc = `<!DOCTYPE html><html><head><style>
:root {
  --bg: #0f1117;
  --surface: #1a1d27;
  --surface2: #22263a;
  --border: #2e3350;
  --accent: #7c6aff;
  --accent2: #48d9ff;
  --text: #e4e6f0;
  --text-muted: #8b90a8;
  --green: #4ade80;
  --yellow: #facc15;
  --red: #f87171;
  --orange: #fb923c;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, sans-serif;
  background: #0f1117;
  color: #e4e6f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 160px;
  padding: 20px;
}
${css}
    </style></head><body>${html}${jsBlock}</body></html>`;
  document.getElementById(id + '-frame').srcdoc = doc;
}

function beautifyCssSnippet(source) {
  const raw = String(source || '')
    .replace(/\r\n/g, '\n')
    .trim();
  if (!raw) return '';

  // 이미 속성 단위 줄바꿈이 되어 있으면 그대로 유지.
  if (raw.includes('{\n') && raw.includes(';\n')) return raw;

  const rough = raw
    .replace(/\s*{\s*/g, ' {\n  ')
    .replace(/;\s*/g, ';\n  ')
    .replace(/\s*}\s*/g, '\n}\n')
    .replace(/\n\s*\n+/g, '\n')
    .trim();

  let indent = 0;
  return rough
    .split('\n')
    .map((line) => {
      const t = line.trim();
      if (!t) return '';
      if (t.startsWith('}')) indent = Math.max(indent - 1, 0);
      const out = `${'  '.repeat(indent)}${t}`;
      if (t.endsWith('{')) indent += 1;
      return out;
    })
    .join('\n')
    .trim();
}

function beautifyHtmlSnippet(source) {
  const raw = String(source || '')
    .replace(/\r\n/g, '\n')
    .trim();
  if (!raw) return '';

  // script 블록은 JS 문자열/연산자 훼손을 피하기 위해 그대로 둔다.
  if (/<script[\s>]/i.test(raw)) return raw;

  // 이미 줄바꿈이 충분하면 그대로 유지.
  if (raw.split('\n').length > 6) return raw;

  const voidTags = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ]);
  const lines = raw
    .replace(/>\s*</g, '>\n<')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let indent = 0;
  return lines
    .map((line) => {
      const isClosing = /^<\//.test(line);
      if (isClosing) indent = Math.max(indent - 1, 0);

      const out = `${'  '.repeat(indent)}${line}`;

      const openTag = line.match(/^<([a-zA-Z0-9-]+)/);
      const tagName = openTag ? openTag[1].toLowerCase() : '';
      const selfClosed = /\/>$/.test(line) || voidTags.has(tagName);
      const inlinePair = /^<([a-zA-Z0-9-]+)(\s[^>]*)?>.*<\/\1>$/.test(line);

      if (!isClosing && openTag && !selfClosed && !inlinePair) indent += 1;
      return out;
    })
    .join('\n')
    .trim();
}

function normalizeSnippetIndentation(source) {
  const lines = String(source || '')
    .replace(/\r\n/g, '\n')
    .split('\n');
  const nonEmpty = lines.filter((line) => line.trim().length > 0);
  if (!nonEmpty.length) return '';

  const minIndent = nonEmpty.reduce((min, line) => {
    const indent = (line.match(/^\s*/) || [''])[0].length;
    return Math.min(min, indent);
  }, Infinity);

  return lines
    .map((line) => line.slice(Math.min(minIndent, line.length)).replace(/\s+$/g, ''))
    .join('\n')
    .trim();
}

function prettifyEditorSnippets() {
  document.querySelectorAll('.pane-editor .css-ta').forEach((ta) => {
    ta.value = beautifyCssSnippet(ta.value);
  });
  document.querySelectorAll('.pane-editor .html-ta').forEach((ta) => {
    ta.value = beautifyHtmlSnippet(ta.value);
  });
}

function collectInlineHandlerFunctionNames(root) {
  const names = new Set();
  root.querySelectorAll('*').forEach((el) => {
    el.getAttributeNames().forEach((attr) => {
      if (!attr.startsWith('on')) return;
      const code = el.getAttribute(attr) || '';
      let m;
      const re = /\b([A-Za-z_$][\w$]*)\s*\(/g;
      while ((m = re.exec(code))) names.add(m[1]);
    });
  });
  return Array.from(names);
}

function buildInjectedJsForPreview(previewArea) {
  const stateByFn = {
    doViewTransition: "let vtPage = 'A';",
  };

  const chunks = [];
  const includedState = new Set();
  const fnNames = collectInlineHandlerFunctionNames(previewArea);

  fnNames.forEach((name) => {
    const state = stateByFn[name];
    if (state && !includedState.has(state)) {
      chunks.push(state);
      includedState.add(state);
    }
    if (typeof window[name] === 'function') {
      chunks.push(window[name].toString());
    }
  });

  previewArea.querySelectorAll('script').forEach((s) => {
    const code = (s.textContent || '').trim();
    if (code) chunks.push(code);
  });

  return chunks.join('\n\n').trim();
}

function collectRelevantPreviewCss(previewArea) {
  // 프리뷰 레이아웃 구조용 helper 클래스는 CSS 데모 내용이 아니므로 추출에서 제외
  const INFRA_CLASS_BLOCKLIST = new Set([
    'pv-label',
    'preview-area',
    'split-preview',
    'split-pane',
    'split-title',
    'split-note',
  ]);

  const classNames = new Set();
  const ids = new Set();

  previewArea.querySelectorAll('*').forEach((el) => {
    el.classList.forEach((c) => {
      if (!INFRA_CLASS_BLOCKLIST.has(c)) classNames.add(c);
    });
    if (el.id) ids.add(el.id);
  });

  if (!classNames.size && !ids.size) return '';

  const matchesSelector = (selectorText) => {
    if (!selectorText) return false;
    for (const c of classNames) {
      if (new RegExp(`\\.${c}(?![\\w-])`).test(selectorText)) return true;
    }
    for (const id of ids) {
      if (new RegExp(`#${id}(?![\\w-])`).test(selectorText)) return true;
    }
    return false;
  };

  const matched = new Set();
  const referencedAnimations = new Set();
  const referencedCustomProperties = new Set();

  const addMatched = (cssText) => {
    const text = String(cssText || '').trim();
    if (text) matched.add(text);
  };

  const isPropertyRule = (rule) => {
    if (!rule) return false;
    if (
      typeof CSSRule !== 'undefined' &&
      typeof CSSRule.PROPERTY_RULE === 'number' &&
      rule.type === CSSRule.PROPERTY_RULE
    ) {
      return true;
    }
    return String(rule.cssText || '')
      .trim()
      .startsWith('@property ');
  };

  const getPropertyRuleName = (rule) => {
    const text = String(rule?.cssText || '').trim();
    const m = text.match(/^@property\s+(--[A-Za-z0-9_-]+)/);
    return m ? m[1] : '';
  };

  const collectCustomPropertyNames = (cssText) => {
    const text = String(cssText || '');
    const matches = text.match(/--[A-Za-z0-9_-]+/g);
    if (!matches) return;
    matches.forEach((name) => referencedCustomProperties.add(name));
  };

  const collectAnimationNames = (styleDecl) => {
    const names = String(styleDecl?.animationName || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s !== 'none');
    names.forEach((n) => referencedAnimations.add(n));
  };

  const containsMatchedStyle = (rule) => {
    if (!rule) return false;
    if (rule.type === CSSRule.STYLE_RULE) return matchesSelector(rule.selectorText);
    if (!rule.cssRules) return false;
    return Array.from(rule.cssRules).some((child) => containsMatchedStyle(child));
  };

  const collectFromRule = (rule, inIncludedGroup = false) => {
    if (!rule) return;

    if (rule.type === CSSRule.STYLE_RULE) {
      if (matchesSelector(rule.selectorText)) {
        collectAnimationNames(rule.style);
        collectCustomPropertyNames(rule.cssText);
        if (!inIncludedGroup) addMatched(rule.cssText);
      }
      return;
    }

    if (rule.cssRules) {
      const includeGroup = containsMatchedStyle(rule);
      if (includeGroup) {
        addMatched(rule.cssText);
        collectCustomPropertyNames(rule.cssText);
      }
      Array.from(rule.cssRules).forEach((child) => collectFromRule(child, inIncludedGroup || includeGroup));
    }
  };

  const collectReferencedAtRules = (rule) => {
    if (!rule) return;
    if (rule.type === CSSRule.KEYFRAMES_RULE) {
      if (referencedAnimations.has(rule.name)) addMatched(rule.cssText);
      return;
    }
    if (isPropertyRule(rule)) {
      const propertyName = getPropertyRuleName(rule);
      if (propertyName && referencedCustomProperties.has(propertyName)) {
        addMatched(rule.cssText);
      }
      return;
    }
    if (rule.cssRules) Array.from(rule.cssRules).forEach((child) => collectReferencedAtRules(child));
  };

  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch (e) {
      continue;
    }
    if (!rules) continue;

    Array.from(rules).forEach((rule) => collectFromRule(rule));
    Array.from(rules).forEach((rule) => collectReferencedAtRules(rule));
  }

  return Array.from(matched).join('\n');
}

function promoteStaticCardsToEditable() {
  let seq = 100;
  document.querySelectorAll('.card:not(.editable)').forEach((card) => {
    const paneCode = card.querySelector('.pane-code');
    const code = paneCode?.querySelector('pre code');
    const panePreview = card.querySelector('.pane-preview');
    const previewArea = panePreview?.querySelector('.preview-area');
    if (!paneCode || !code || !panePreview || !previewArea) return;

    const id = `auto${seq++}`;
    const originalCodeText = beautifyCssSnippet(code.textContent || '');

    // 원본 코드에서 최상위 셀렉터 추출 (중복 방지용)
    const selectorsInOriginal = new Set();
    {
      let depth = 0,
        buf = '';
      for (const ch of originalCodeText) {
        if (ch === '{') {
          if (depth === 0) {
            const sel = buf.trim().replace(/\s+/g, ' ');
            if (sel && !sel.startsWith('/*')) selectorsInOriginal.add(sel);
            buf = '';
          }
          depth++;
        } else if (ch === '}') {
          depth = Math.max(0, depth - 1);
        } else if (depth === 0) {
          buf += ch;
        }
      }
    }

    const previewCss = collectRelevantPreviewCss(previewArea);

    // 최상위 블록 단위로 분리해서 원본과 겹치는 블록 제거
    const deduplicatedPreviewCss = (() => {
      if (!previewCss) return '';
      const blocks = [];
      let depth = 0,
        start = 0,
        inBlock = false;
      for (let i = 0; i < previewCss.length; i++) {
        const ch = previewCss[i];
        if (ch === '{') {
          if (depth === 0) inBlock = true;
          depth++;
        } else if (ch === '}') {
          depth--;
          if (depth === 0 && inBlock) {
            blocks.push(previewCss.slice(start, i + 1));
            start = i + 1;
            inBlock = false;
          }
        }
      }
      return blocks
        .filter((block) => {
          const sel = (block.match(/^([\s\S]*?)\{/) || [])[1];
          if (!sel) return true;
          const normalized = sel.trim().replace(/\s+/g, ' ');
          // @starting-style, @keyframes 같은 at-rule 그룹은 이름 충돌로 오탐 제거하지 않는다.
          if (normalized.startsWith('@')) return true;
          return !selectorsInOriginal.has(normalized);
        })
        .join('\n')
        .trim();
    })();

    const previewCssFormatted = deduplicatedPreviewCss ? beautifyCssSnippet(deduplicatedPreviewCss) : '';
    const cssMerged = [
      originalCodeText,
      previewCssFormatted
        ? `/* -- preview-from-page -- */\n${previewCssFormatted}\n/* -- /preview-from-page -- */`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    const cssText = cssMerged;
    const normalizedHtml = normalizeSnippetIndentation(previewArea.innerHTML || '');
    const htmlText = beautifyHtmlSnippet(normalizedHtml);
    const jsText = buildInjectedJsForPreview(previewArea);
    const hasJs = Boolean(jsText.trim());

    const paneEditor = document.createElement('div');
    paneEditor.className = 'pane-editor';
    paneEditor.dataset.id = id;

    const tabs = document.createElement('div');
    tabs.className = 'editor-tabs';

    const htmlBtn = document.createElement('button');
    htmlBtn.className = 'etab active';
    htmlBtn.type = 'button';
    htmlBtn.textContent = 'HTML';
    htmlBtn.addEventListener('click', () => switchETab(htmlBtn, id, 'html'));

    const cssBtn = document.createElement('button');
    cssBtn.className = 'etab';
    cssBtn.type = 'button';
    cssBtn.textContent = 'CSS';
    cssBtn.addEventListener('click', () => switchETab(cssBtn, id, 'css'));

    tabs.appendChild(htmlBtn);
    tabs.appendChild(cssBtn);
    let jsTa = null;
    if (hasJs) {
      const jsBtn = document.createElement('button');
      jsBtn.className = 'etab';
      jsBtn.type = 'button';
      jsBtn.textContent = 'JS';
      jsBtn.addEventListener('click', () => switchETab(jsBtn, id, 'js'));
      tabs.appendChild(jsBtn);

      jsTa = document.createElement('textarea');
      jsTa.className = 'code-ta js-ta';
      jsTa.id = `${id}-js`;
      jsTa.spellcheck = false;
      jsTa.addEventListener('input', () => updatePreview(id));
      jsTa.value = jsText;
    }

    const cssTa = document.createElement('textarea');
    cssTa.className = 'code-ta css-ta';
    cssTa.id = `${id}-css`;
    cssTa.spellcheck = false;
    cssTa.addEventListener('input', () => updatePreview(id));
    cssTa.value = cssText;

    const htmlTa = document.createElement('textarea');
    htmlTa.className = 'code-ta html-ta active';
    htmlTa.id = `${id}-html`;
    htmlTa.spellcheck = false;
    htmlTa.addEventListener('input', () => updatePreview(id));
    htmlTa.value = htmlText;

    paneEditor.appendChild(tabs);
    paneEditor.appendChild(cssTa);
    paneEditor.appendChild(htmlTa);
    if (jsTa) paneEditor.appendChild(jsTa);

    const iframe = document.createElement('iframe');
    iframe.className = 'preview-frame';
    iframe.id = `${id}-frame`;

    previewArea.replaceWith(iframe);
    paneCode.replaceWith(paneEditor);

    updatePreview(id);
  });
}

/* ── 페이지 로드 시 모든 에디터 카드 초기 렌더링 ── */
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

function wireEditorTabs() {
  document.querySelectorAll('.pane-editor').forEach((editor) => {
    const id = editor.dataset.id;
    if (!id) return;
    editor.querySelectorAll('.editor-tabs .etab[onclick]').forEach((btn) => {
      const label = (btn.textContent || '').trim().toLowerCase();
      const type = label === 'html' ? 'html' : label === 'css' ? 'css' : label === 'js' ? 'js' : '';
      if (!type) return;
      btn.removeAttribute('onclick');
      btn.addEventListener('click', () => switchETab(btn, id, type));
    });
  });
}

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

/* ── 비-에디터 카드 인터랙션 ── */
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
