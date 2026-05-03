exports.default = async function afterPack(context) {
  const fs = require('fs');
  const path = require('path');
  const { execSync } = require('child_process');

  const { appOutDir } = context;
  const productName = 'Xedryk Data Manager';

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
};
