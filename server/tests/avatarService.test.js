const test = require('node:test');
const assert = require('node:assert');
const { saveAvatarFromDataUrl, MAX_AVATAR_SIZE } = require('../avatarService');
const fs = require('fs');
const path = require('path');

const bigBase64 = Buffer.alloc(MAX_AVATAR_SIZE + 1).toString('base64');

test('rejects too large avatar files', async () => {
  const dataUrl = `data:image/png;base64,${bigBase64}`;
  await assert.rejects(() => saveAvatarFromDataUrl('user', dataUrl), /FILE_TOO_LARGE/);
});

test('accepts small avatar files', async () => {
  const smallBase64 = Buffer.alloc(10).toString('base64');
  const dataUrl = `data:image/png;base64,${smallBase64}`;
  const url = await saveAvatarFromDataUrl('user', dataUrl);
  assert.match(url, /^\/uploads\/avatars\//);
  const filePath = path.join(__dirname, '..', url.replace(/^\//, ''));
  await fs.promises.unlink(filePath).catch(() => {});
});
