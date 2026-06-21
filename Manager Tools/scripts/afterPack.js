exports.default = async function afterPack(context) {
  const fs = require('fs');
  const path = require('path');
  const { execSync } = require('child_process');

  const { appOutDir } = context;
  const productName = 'Xedryk Data Manager';

  // --- Rename electron.exe to product name ---
  const electronExe = path.join(appOutDir, 'electron.exe');
  const mainExe = path.join(appOutDir, `${productName}.exe`);

  if (fs.existsSync(electronExe) && fs.existsSync(mainExe)) {
    console.log(`Renaming electron.exe to ${productName}.exe (overwriting existing)...`);

    fs.unlinkSync(mainExe);
    fs.renameSync(electronExe, mainExe);

    const tempElectron = path.join(appOutDir, 'electron.exe');
    execSync(`copy "${mainExe}" "${tempElectron}"`, { shell: 'cmd.exe', stdio: 'pipe' });
    fs.unlinkSync(mainExe);
    fs.renameSync(tempElectron, mainExe);

    console.log('Renamed successfully');
  }

  // --- Strip unused files to reduce size ---
  const localeDir = path.join(appOutDir, 'locales');
  if (fs.existsSync(localeDir)) {
    const files = fs.readdirSync(localeDir);
    for (const file of files) {
      if (file !== 'en-US.pak') {
        const filePath = path.join(localeDir, file);
        fs.unlinkSync(filePath);
        console.log(`Removed locale: ${file}`);
      }
    }
  }

  const unusedDlls = ['vk_swiftshader.dll', 'vulkan-1.dll'];
  for (const dll of unusedDlls) {
    const dllPath = path.join(appOutDir, dll);
    if (fs.existsSync(dllPath)) {
      fs.unlinkSync(dllPath);
      console.log(`Removed: ${dll}`);
    }
  }

  const licensesHtml = path.join(appOutDir, 'LICENSES.chromium.html');
  if (fs.existsSync(licensesHtml)) {
    fs.unlinkSync(licensesHtml);
    console.log('Removed LICENSES.chromium.html');
  }
};
