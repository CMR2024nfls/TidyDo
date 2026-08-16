export function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inlineMd(s) {
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/_([^_]+)_/g, '<em>$1</em>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  return s;
}

export function renderMarkdown(src) {
  if (!src) return '';
  const blocks = escHtml(src).split(/```/);
  let out = '';
  let list = null;
  let para = [];

  const closeList = () => {
    if (list === 'ul') out += '</ul>\n';
    else if (list === 'ol') out += '</ol>\n';
    list = null;
  };
  const flushPara = () => {
    if (para.length) {
      out += '<p>' + para.join('<br>') + '</p>\n';
      para = [];
    }
  };

  for (let i = 0; i < blocks.length; i++) {
    if (i % 2 === 1) {
      flushPara();
      closeList();
      let code = blocks[i].replace(/^\n/, '');
      let lang = '';
      const nl = code.indexOf('\n');
      const first = code.split('\n')[0].trim();
      if (first && !/\s/.test(first) && nl !== -1) {
        lang = code.slice(0, nl).trim();
        code = code.slice(nl + 1);
      } else if (first && !/\s/.test(first)) {
        lang = first;
        code = '';
      }
      out += `<pre><code${lang ? ` class="language-${escHtml(lang)}"` : ''}>${code}</code></pre>\n`;
      continue;
    }

    for (const line of blocks[i].split('\n')) {
      let m;
      if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
        flushPara();
        closeList();
        out += `<h${m[1].length}>${inlineMd(m[2])}</h${m[1].length}>\n`;
      } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        flushPara();
        closeList();
        out += '<hr>\n';
      } else if ((m = line.match(/^&gt;\s?(.*)$/))) {
        flushPara();
        closeList();
        out += `<blockquote>${inlineMd(m[1])}</blockquote>\n`;
      } else if ((m = line.match(/^[-*+]\s+(.*)$/))) {
        flushPara();
        if (list !== 'ul') {
          closeList();
          out += '<ul>\n';
          list = 'ul';
        }
        out += `<li>${inlineMd(m[1])}</li>\n`;
      } else if ((m = line.match(/^\d+[.)]\s+(.*)$/))) {
        flushPara();
        if (list !== 'ol') {
          closeList();
          out += '<ol>\n';
          list = 'ol';
        }
        out += `<li>${inlineMd(m[1])}</li>\n`;
      } else if (/^\s*$/.test(line)) {
        flushPara();
        closeList();
      } else {
        closeList();
        para.push(inlineMd(line));
      }
    }
    flushPara();
    closeList();
  }
  return out;
}