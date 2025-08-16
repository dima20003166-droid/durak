const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB

async function saveAvatarFromDataUrl(userId, dataUrl) {
  const match = String(dataUrl || '').match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i);
  if (!match) throw new Error('INVALID_FORMAT');
  const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
  const base64 = match[3];
  let buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
    if (buffer.toString('base64').replace(/=+$/, '') !== base64.replace(/=+$/, '')) {
      throw new Error('INVALID_FORMAT');
    }
  } catch {
    throw new Error('INVALID_FORMAT');
  }
  if (buffer.length > MAX_AVATAR_SIZE) throw new Error('FILE_TOO_LARGE');
  const uploadsDir = path.join(__dirname, 'uploads', 'avatars');
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  let safeId = String(userId || '').replace(/[^A-Za-z0-9_-]/g, '');
  if (!safeId) {
    safeId = randomUUID();
  }
  const filename = `${safeId}_${Date.now()}.${ext}`;
  const filePath = path.join(uploadsDir, filename);
  await fs.promises.writeFile(filePath, buffer);
  return `/uploads/avatars/${filename}`;
}

module.exports = { saveAvatarFromDataUrl, MAX_AVATAR_SIZE };
