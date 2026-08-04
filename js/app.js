// ============================================================
// APP — 应用入口（ES 模块自动 defer，DOM 已就绪）
// ============================================================
import { Notes } from './notes.js';
import { UI } from './ui.js';

function init() {
  Notes.init();
  UI.init();
}

init();
