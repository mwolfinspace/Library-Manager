const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const productName = 'Xedryk Data Manager';
const distDir = path.join(__dirname, '..', 'dist');
const unpackedDir = path.join(distDir, 'win-unpacked');
const portableExe = path.join(distDir, `${productName}-1.0.0-x64.exe`);

function renameElectronExe(dir) {
  const electronExe = path.join(dir, 'electron.exe');
  const appExe = path.join(dir, `${productName}.exe`);

  if (fs.existsSync(electronExe) && fs.existsSync(appExe)) {
    console.log(`Renaming electron.exe in ${dir}...`);

    const tempExe = path.join(dir, 'electron_temp.exe');
    fs.renameSync(electronExe, tempExe);
    fs.renameSync(appExe, electronExe);
    fs.renameSync(tempExe, appExe);

    console.log('Done renaming in win-unpacked');
  }
}

function patchPortableExe(exePath) {
  if (!fs.existsSync(exePath)) {
    console.log('Portable exe not found, skipping...');
    return;
  }

  console.log('Patching portable exe...');

  const tempDir = path.join(distDir, 'temp_extract');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    execSync(`7z x "${exePath}" -o"${tempDir}" -y`, { stdio: 'pipe' });

    renameElectronExe(path.join(tempDir, 'win-unpacked'));

    const newExePath = exePath.replace('.exe', '_new.exe');
    execSync(`7z a -mx9 "${newExePath}" "${tempDir}\\*"`, { stdio: 'pipe' });

    fs.unlinkSync(exePath);
    fs.renameSync(newExePath, exePath);

    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('Done patching portable exe');
  } catch (error) {
    console.error('Error patching portable:', error.message);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

console.log('Post-build: Renaming Electron processes...');

if (fs.existsSync(unpackedDir)) {
  renameElectronExe(unpackedDir);
}

patchPortableExe(portableExe);

console.log('Post-build complete!');
