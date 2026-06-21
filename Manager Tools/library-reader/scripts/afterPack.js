exports.default = async function afterPack(context) {
  const fs = require('fs');
  const path = require('path');
  const { appOutDir } = context;

  const localeDir = path.join(appOutDir, 'locales');
  if (fs.existsSync(localeDir)) {
    const files = fs.readdirSync(localeDir);
    for (const file of files) {
      if (file !== 'en-US.pak') {
        fs.unlinkSync(path.join(localeDir, file));
      }
    }
  }

  const unusedDlls = ['vk_swiftshader.dll', 'vulkan-1.dll'];
  for (const dll of unusedDlls) {
    const dllPath = path.join(appOutDir, dll);
    if (fs.existsSync(dllPath)) {
      fs.unlinkSync(dllPath);
    }
  }

  const licensesHtml = path.join(appOutDir, 'LICENSES.chromium.html');
  if (fs.existsSync(licensesHtml)) {
    fs.unlinkSync(licensesHtml);
  }
};
