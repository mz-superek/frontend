(function registerSnippetFormatters(app) {
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

Object.assign(app, {
  beautifyCssSnippet,
  beautifyHtmlSnippet,
  normalizeSnippetIndentation,
});
})(window.StateCss2026 ||= {});
