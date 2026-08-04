// ============================================================
// MARKDOWN — Markdown 渲染器
// ============================================================
import { escapeHTML } from './utils.js';

export const MD = {
  parse(text) {
    if (!text) return '<p style="color:var(--text-muted);font-style:italic;">开始输入 Markdown，这里会实时预览…</p>';
    const lines = text.split('\n');
    let html = '', i = 0, inList = false, listType = '';
    function closeList() {
      if (inList) { html += listType === 'ul' ? '</ul>\n' : '</ol>\n'; inList = false; listType = ''; }
    }
    while (i < lines.length) {
      const raw = lines[i];
      if (/^```/.test(raw)) {
        closeList();
        const lang = raw.slice(3).trim();
        html += '<pre data-lang="' + escapeHTML(lang || 'code') + '">'; i++;
        const codeLines = [];
        while (i < lines.length && !/^```/.test(lines[i])) { codeLines.push(lines[i]); i++; }
        html += '<code>' + escapeHTML(codeLines.join('\n')) + '</code></pre>\n'; i++; continue;
      }
      if (/^\s*$/.test(raw)) { closeList(); html += '\n'; i++; continue; }
      if (/^[-*_]{3,}\s*$/.test(raw)) { closeList(); html += '<hr>\n'; i++; continue; }
      const hMatch = raw.match(/^(#{1,4})\s+(.*)/);
      if (hMatch) {
        closeList();
        const lv = hMatch[1].length;
        html += '<h' + lv + '>' + this.parseInline(hMatch[2]) + '</h' + lv + '>\n'; i++; continue;
      }
      if (/^>\s?/.test(raw)) {
        closeList();
        const qLines = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { qLines.push(lines[i].replace(/^>\s?/, '')); i++; }
        html += '<blockquote>' + this.parseInline(qLines.join('<br>')) + '</blockquote>\n'; continue;
      }
      const ulMatch = raw.match(/^(\s*)[-*+]\s+(.*)/);
      if (ulMatch) {
        if (!inList || listType !== 'ul') { closeList(); html += '<ul>\n'; inList = true; listType = 'ul'; }
        const taskMatch = ulMatch[2].match(/^\[(x| )\]\s+/i);
        const content = taskMatch ? ulMatch[2].replace(/^\[(x| )\]\s+/i, '') : ulMatch[2];
        const doneClass = taskMatch && taskMatch[1].toLowerCase() === 'x' ? ' class="task-done"' : '';
        html += '<li' + doneClass + '>' + this.parseInline(content) + '</li>\n'; i++; continue;
      }
      const olMatch = raw.match(/^(\s*)\d+[.)]\s+(.*)/);
      if (olMatch) {
        if (!inList || listType !== 'ol') { closeList(); html += '<ol>\n'; inList = true; listType = 'ol'; }
        html += '<li>' + this.parseInline(olMatch[2]) + '</li>\n'; i++; continue;
      }
      if (/^\|.+\|/.test(raw) && lines[i + 1] && /^\|[\s\-:|]+\|/.test(lines[i + 1])) {
        closeList();
        const hCells = raw.split('|').filter(c => c.trim());
        html += '<table>\n<thead>\n<tr>\n';
        hCells.forEach(c => { html += '<th>' + this.parseInline(c.trim()) + '</th>\n'; });
        html += '</tr>\n</thead>\n<tbody>\n'; i += 2;
        while (i < lines.length && /^\|.+\|/.test(lines[i])) {
          const cells = lines[i].split('|').filter(c => c.trim());
          html += '<tr>\n';
          cells.forEach(c => { html += '<td>' + this.parseInline(c.trim()) + '</td>\n'; });
          html += '</tr>\n'; i++;
        }
        html += '</tbody>\n</table>\n'; continue;
      }
      closeList();
      const pLines = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,4}\s|```|>\s?|[-*+]\s+|\d+[.)]\s+|\|)/.test(lines[i]) && !/^[-*_]{3,}\s*$/.test(lines[i])) {
        pLines.push(lines[i]); i++;
      }
      if (pLines.length > 0) {
        html += '<p>' + this.parseInline(pLines.join('<br>')) + '</p>\n';
      } else {
        // Safety: line matched exclusion pattern but no handler consumed it
        i++;
      }
    }
    closeList();
    return html;
  },

  parseInline(text) {
    let t = escapeHTML(text);
    t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
    t = t.replace(/__(.+?)__/g, '<strong>$1</strong>');
    t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    t = t.replace(/_([^_]+)_/g, '<em>$1</em>');
    t = t.replace(/~~(.+?)~~/g, '<del>$1</del>');
    return t;
  }
};
