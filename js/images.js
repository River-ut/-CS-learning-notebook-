// ============================================================
// IMAGES — 图片处理（读取、按需缩放、转 base64）
// 说明：截图以 data URL 形式内嵌进笔记内容，随笔记一起保存在
// localStorage 中，导出时也一并写入 .md，保证图片与文字不分离。
// ============================================================

// 图片最长边超过此值时自动等比缩小，兼顾清晰度与 localStorage 容量
const MAX_DIMENSION = 1600;

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}

/**
 * 处理图片文件：读取为 data URL，过长边时等比缩小，返回 PNG data URL。
 * @param {File|Blob} file
 * @returns {Promise<{dataUrl: string, width: number, height: number}>}
 */
export async function processImageFile(file) {
  const original = await readAsDataURL(file);
  const img = await loadImage(original);
  const { width, height } = img;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  if (scale >= 1) {
    return { dataUrl: original, width, height };
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
}
