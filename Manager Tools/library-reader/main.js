const { app, BrowserWindow, ipcMain, WebContentsView } = require('electron');
const path = require('path');
const fs = require('fs');

// GPU acceleration
app.commandLine.appendSwitch('disable-frame-rate-limit');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('enable-webgl2');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('use-gl', 'angle');
app.commandLine.appendSwitch('use-angle', 'd3d11');

// Codec & feature flags
app.commandLine.appendSwitch('enable-features', [
  'VaapiVideoDecoder',
  'VaapiVideoEncoder',
  'PlatformHEVCDecoderSupport',
  'VideoToolboxHEVCDecode',
  'AcceleratedVideoDecodeLinuxZeroCopyWebRTC',
  'WebRTCHardwareVideoDecode',
  'WebRTCHardwareVideoEncode',
  'AV1Decoder',
  'Vp9kSVCHWDecoding',
  'CanvasOopRasterization',
  'AcceleratedVideoEncoder',
  'ParallelDownloading',
  'EnableMsaaOnNonWebFrame',
].join(','));

let mainWindow = null;
let homeView = null;
let viewerView = null;
let booted = false;
let isViewerActive = false;
let homePreloadTimer = null;
let rootDir = '';
let entryName = '';

function fileUrl(absPath) {
  return 'file:///' + absPath.replace(/\\/g, '/');
}

function resolveLibraryRoot() {
  const exeDir = path.dirname(app.getPath('exe'));
  const candidates = [
    exeDir,
    path.dirname(exeDir),
    path.dirname(process.execPath),
    process.cwd(),
  ];
  const seen = new Set();
  for (const p of candidates) {
    const norm = path.resolve(p);
    if (seen.has(norm)) continue;
    seen.add(norm);
    for (const name of ['homepage.html', 'index.html']) {
      if (fs.existsSync(path.join(norm, name))) {
        return { root: norm, entry: name };
      }
    }
  }
  return { root: path.resolve(candidates[0]), entry: null };
}

const BAR_H = 40;

function getContentBounds() {
  const b = mainWindow.getBounds();
  return { x: 0, y: BAR_H, width: b.width, height: b.height - BAR_H };
}

function createContentView() {
  return new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      backgroundThrottling: false,
    },
  });
}

function wireNav(view, isHome) {
  view.webContents.on('will-navigate', (event, url) => {
    if (!isHome) return;
    const u = url.toLowerCase();
    if (u.includes('viewer.html') || u.includes('view/viewer.html')) {
      event.preventDefault();
      showViewer(url);
    }
  });
  if (!isHome) {
    view.webContents.on('did-navigate', (_e, url) => {
      const u = url.toLowerCase();
      const onHomepage = u.includes('homepage.html') || u.includes('index.html');
      if (onHomepage !== !isViewerActive) {
        isViewerActive = !onHomepage;
        mainWindow.webContents.send('viewer-state', { isViewer: !onHomepage });
      }
    });
  }
}

function showHome() {
  mainWindow.contentView.removeChildView(viewerView);
  mainWindow.contentView.addChildView(homeView);
  homeView.setBounds(getContentBounds());
  isViewerActive = false;
  mainWindow.webContents.send('viewer-state', { isViewer: false });
  mainWindow.webContents.send('content-ready');
}

function showViewer(url) {
  if (homePreloadTimer) {
    clearTimeout(homePreloadTimer);
    homePreloadTimer = null;
  }
  mainWindow.contentView.removeChildView(homeView);
  if (!viewerView) {
    viewerView = createContentView();
    wireNav(viewerView, false);
  }
  mainWindow.contentView.addChildView(viewerView);
  viewerView.setBounds(getContentBounds());
  if (url) viewerView.webContents.loadURL(url);
  isViewerActive = true;
  mainWindow.webContents.send('viewer-state', { isViewer: true });
}

function enterAppMode(folderName) {
  const entryUrl = fileUrl(path.join(rootDir, entryName));

  homeView = createContentView();
  wireNav(homeView, true);

  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(titlebarHtml(folderName))}`);

  // Preload homepage in detached view, then add when stable
  homeView.webContents.loadURL(entryUrl);

  mainWindow.on('resize', () => {
    const b = getContentBounds();
    if (homeView) homeView.setBounds(b);
    if (viewerView) viewerView.setBounds(b);
  });

  let loadStable = false;
  const onStart = () => { loadStable = false; };
  const onStop = () => {
    loadStable = true;
    homePreloadTimer = setTimeout(() => {
      homePreloadTimer = null;
      if (!loadStable) return;
      if (isViewerActive) return;
      if (!viewerView) {
        mainWindow.contentView.addChildView(homeView);
        homeView.setBounds(getContentBounds());
        mainWindow.webContents.send('content-ready');
      }
    }, 600);
  };
  homeView.webContents.on('did-start-loading', onStart);
  homeView.webContents.on('did-stop-loading', onStop);
  homeView.webContents.on('did-finish-load', () => onStop());
}

function bootSplashHtml() {
  const found = !!entryName;
  const safeRoot = rootDir.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const safeEntry = entryName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;background:#070e18;overflow:hidden;font-family:'Segoe UI',sans-serif}
.splash{display:flex;flex-direction:column;height:100%;padding:48px 56px 32px;position:relative}
.hdr{display:flex;align-items:center;gap:14px;margin-bottom:32px}
.hdr-mark{width:12px;height:12px;border-radius:4px;background:linear-gradient(135deg,#62f7ff,#8dff7b);box-shadow:0 0 20px rgba(98,247,255,.35)}
.hdr-text{font-size:20px;font-weight:700;letter-spacing:.04em;color:#e8f1ff}
.hdr-sub{font-size:12px;color:#5a7a9a;margin-left:auto}
.log-area{flex:1;overflow-y:auto;margin-bottom:24px}
.log-area::-webkit-scrollbar{width:4px}
.log-area::-webkit-scrollbar-track{background:transparent}
.log-area::-webkit-scrollbar-thumb{background:rgba(98,247,255,.25);border-radius:2px}
.log-line{font:13px/1.7 'Cascadia Code','Fira Code','Consolas',monospace;color:#8ba4c7;opacity:0;transform:translateY(6px);transition:opacity .15s,transform .15s}
.log-line.visible{opacity:1;transform:translateY(0)}
.log-line.ok{color:#8dff7b}
.log-line.err{color:#ff6b6b}
.log-line.info{color:#62f7ff}
.progress-wrap{background:rgba(255,255,255,.06);border-radius:3px;height:4px;overflow:hidden;margin-bottom:8px}
.progress-fill{height:100%;width:0;border-radius:3px;background:linear-gradient(90deg,#62f7ff,#8dff7b);transition:width .3s ease}
.status{font:12px/1.4 'Segoe UI',sans-serif;color:#5a7a9a;letter-spacing:.02em}
.status .spinner{display:inline-block;animation:spin .8s steps(4) infinite;margin-right:6px}
@keyframes spin{0%{transform:rotate(0deg)}25%{transform:rotate(90deg)}50%{transform:rotate(180deg)}75%{transform:rotate(270deg)}}
.err-overlay{display:none;position:absolute;inset:0;background:rgba(7,14,24,.92);padding:56px;z-index:10;flex-direction:column}
.err-overlay.show{display:flex}
.err-icon{font-size:32px;margin-bottom:12px;color:#ff6b6b}
.err-title{font-size:18px;font-weight:700;color:#ff6b6b;margin-bottom:8px}
.err-msg{font:13px/1.6 'Cascadia Code',monospace;color:#acccff;white-space:pre-wrap;word-break:break-all}
.err-hint{font-size:13px;color:#5a7a9a;margin-top:16px}
</style></head><body>
<div class="splash" id="splash"><div class="hdr"><div class="hdr-mark"></div><div class="hdr-text">Library Reader</div><div class="hdr-sub">v1.0</div></div><div class="log-area" id="logArea"></div><div class="progress-wrap"><div class="progress-fill" id="progressFill"></div></div><div class="status" id="statusLine"><span class="spinner">|</span><span id="statusText">Initializing…</span></div></div>
<div class="err-overlay" id="errOverlay"><div class="err-icon">&#9888;</div><div class="err-title">Boot Failed</div><div class="err-msg" id="errMsg"></div><div class="err-hint">Place this reader in a library folder that contains <strong>homepage.html</strong> or <strong>index.html</strong>.</div></div>
<script>
var logArea=document.getElementById('logArea'),fill=document.getElementById('progressFill'),statusText=document.getElementById('statusText'),errOverlay=document.getElementById('errOverlay'),errMsg=document.getElementById('errMsg'),rootDir='${safeRoot}',entryName='${safeEntry}',entryFound=${String(found)},aborted=false;
function addLine(t,c){var d=document.createElement('div');d.className='log-line'+(c?' '+c:'');d.textContent=t;logArea.appendChild(d);requestAnimationFrame(function(){d.classList.add('visible')});logArea.scrollTop=logArea.scrollHeight}
function setProgress(p){fill.style.width=Math.min(100,Math.max(0,p))+'%'}
function setStatus(t){statusText.textContent=t}
var steps=[{msg:'Initializing kernel…',pct:8,delay:200,cls:'info'},{msg:'Loading core modules…',pct:16,delay:300,cls:''},{msg:'Allocating memory pages…',pct:22,delay:250,cls:''},{msg:'Mounting virtual file system…',pct:30,delay:350,cls:''},{msg:'Probing hardware…',pct:38,delay:280,cls:''},{msg:'Starting display server…',pct:45,delay:300,cls:'info'},{msg:'Scanning for library…',pct:55,delay:400,cls:''}];
if(entryFound){steps.push({msg:'Found: '+entryName,pct:68,delay:350,cls:'ok'});steps.push({msg:'Validating library structure…',pct:78,delay:300,cls:''});steps.push({msg:'Preparing render pipeline…',pct:86,delay:250,cls:''});steps.push({msg:'Starting display service…',pct:93,delay:300,cls:''});steps.push({msg:'Ready.',pct:100,delay:400,cls:'ok'})}else{steps.push({msg:'WARNING: No library entry found',pct:68,delay:300,cls:'err'});steps.push({msg:'Expected: homepage.html or index.html',pct:78,delay:400,cls:'err'});steps.push({msg:'Reader location: '+rootDir,pct:86,delay:350,cls:''});steps.push({msg:'Boot halted.',pct:93,delay:300,cls:'err'})}
var idx=0;
function next(){if(aborted)return;if(idx>=steps.length){setStatus('Waiting for display…');if(!entryFound){errMsg.textContent='No library page found in:\\n'+rootDir+'\\n\\nExpected: homepage.html or index.html';errOverlay.classList.add('show')}else{if(window.electronReader&&window.electronReader.signalBootComplete){window.electronReader.signalBootComplete()}}return}var s=steps[idx];addLine(s.msg,s.cls||'');setProgress(s.pct);setStatus(s.msg);idx++;setTimeout(next,s.delay)}
setTimeout(next,400);
</script></body></html>`;
}

function titlebarHtml(folderName) {
  const safeName = folderName.replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden;font-family:'Segoe UI',-apple-system,sans-serif}
:root{--bar-h:${BAR_H}px;--bar-bg:rgba(7,14,24,0.82);--bar-border:rgba(98,247,255,0.18);--bar-ink:rgba(232,241,255,0.92);--bar-muted:rgba(172,204,231,0.55);--bar-btn-hover:rgba(98,247,255,0.1);--bar-close-hover:rgba(255,80,80,0.88);--bar-shadow:0 1px 0 var(--bar-border)}
@media(prefers-color-scheme:light){:root{--bar-bg:rgba(248,250,254,0.85);--bar-border:rgba(160,185,210,0.3);--bar-ink:rgba(24,40,66,0.94);--bar-muted:rgba(90,120,150,0.6);--bar-btn-hover:rgba(60,140,220,0.08);--bar-close-hover:rgba(200,50,50,0.85);--bar-shadow:0 1px 0 var(--bar-border)}}
body{height:100%;background:var(--bar-bg);-webkit-backdrop-filter:blur(16px) saturate(1.3);backdrop-filter:blur(16px) saturate(1.3);border-bottom:1px solid var(--bar-border);box-shadow:var(--bar-shadow)}
#bar{display:flex;align-items:center;height:var(--bar-h);padding-right:0;user-select:none}
#bar .drag{min-width:0;flex:1;display:flex;align-items:center;gap:10px;padding:0 14px;height:100%;-webkit-app-region:drag}
#bar .mark{width:10px;height:10px;border-radius:3px;flex:0 0 auto;background:linear-gradient(135deg,#62f7ff,#8dff7b);box-shadow:0 0 12px rgba(98,247,255,0.35)}
#bar .title{font:600 12.5px/1.2 'Segoe UI',sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:0.01em;color:var(--bar-ink)}
#bar .home-indicator{display:none;width:6px;height:6px;border-radius:50%;margin-left:7px;background:rgba(141,255,123,0.9);box-shadow:0 0 8px rgba(141,255,123,0.5);transition:opacity .2s}
body.is-viewer #bar .home-indicator{display:inline-block}
#bar .actions{display:flex;align-items:stretch;height:100%;-webkit-app-region:no-drag}
#bar .btn{width:46px;min-width:46px;padding:0;border:none;border-radius:0;background:transparent;color:var(--bar-ink);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;transition:background .15s,color .15s;position:relative}
#bar .btn:hover{background:var(--bar-btn-hover)}
#bar .btn:active{background:rgba(128,128,128,0.12)}
#bar .btn.close:hover{background:var(--bar-close-hover);color:#fff}
#bar .btn.close:active{background:rgba(200,50,50,0.7);color:#fff}
#bar .btn svg{width:16px;height:16px;fill:currentColor;stroke:none;pointer-events:none;display:block}
#bar .btn.min svg{width:14px;height:14px}
#loading-overlay{position:fixed;top:var(--bar-h);left:0;right:0;bottom:0;background:var(--bar-bg);-webkit-backdrop-filter:blur(16px) saturate(1.3);backdrop-filter:blur(16px) saturate(1.3);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;z-index:10;transition:opacity .4s ease}
#loading-overlay.hidden{opacity:0;pointer-events:none}
#loading-overlay .spinner{width:28px;height:28px;border:2px solid rgba(98,247,255,0.15);border-top-color:#62f7ff;border-radius:50%;animation:spin 0.7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
#loading-overlay .msg{font:14px/1.4 'Segoe UI',sans-serif;color:var(--bar-muted)}
</style></head><body>
<div id="bar"><div class="drag" id="drag-area"><span class="mark"></span><strong class="title" id="title-text">${safeName}</strong><span class="home-indicator"></span></div><div class="actions"><button class="btn" id="home-btn" title="Home" aria-label="Home"><svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg></button><button class="btn" id="reload-btn" title="Reload" aria-label="Reload"><svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.96 7.96 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></button><button class="btn min" id="min-btn" title="Minimize" aria-label="Minimize"><svg viewBox="0 0 24 24"><path d="M20 14H4v-4h16v4z"/></svg></button><button class="btn max" id="max-btn" title="Maximize" aria-label="Maximize"><svg viewBox="0 0 24 24"><path id="max-path" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/></svg></button><button class="btn close" id="close-btn" title="Close" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div></div>
<div id="loading-overlay"><div class="spinner"></div><div class="msg">Loading library…</div></div>
<script>
(function(){
function r(id){return document.getElementById(id)}
var E=window.electronReader;
r('drag-area').addEventListener('dblclick',function(){E.toggleMaximizeWindow().then(updateMax)});
r('home-btn').addEventListener('click',function(){E.navigateHome()});
r('reload-btn').addEventListener('click',function(){E.reloadContent()});
r('min-btn').addEventListener('click',function(){E.minimizeWindow()});
r('close-btn').addEventListener('click',function(){E.closeWindow()});
r('max-btn').addEventListener('click',function(){E.toggleMaximizeWindow().then(updateMax)});
function updateMax(s){var p=r('max-path');if(s.isMaximized){p.setAttribute('d','M18 3H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H6V5h12v12z');r('max-btn').title='Restore Down';r('max-btn').setAttribute('aria-label','Restore Down')}else{p.setAttribute('d','M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z');r('max-btn').title='Maximize';r('max-btn').setAttribute('aria-label','Maximize')}}
E.onViewerStateChanged(function(st){document.body.classList.toggle('is-viewer',st.isViewer);if(!st.isViewer)r('title-text').textContent='${safeName}'});
E.onWindowStateChanged(function(st){updateMax(st);document.body.dataset.maximized=st.isMaximized?'true':'false'});
E.getWindowState().then(updateMax);
E.onContentReady(function(){r('loading-overlay').classList.add('hidden')});
})();
</script></body></html>`;
}

// ---------------------------------------------------------------------------

function createWindow() {
  const lib = resolveLibraryRoot();
  rootDir = lib.root;
  entryName = lib.entry || '';
  const folderName = path.basename(rootDir);

  mainWindow = new BrowserWindow({
    width: 1280, height: 820, minWidth: 980, minHeight: 680,
    title: folderName || 'Library Reader',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    frame: false, show: true, backgroundColor: '#070e18',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  ipcMain.handle('window-action', (_e, action) => {
    const w = mainWindow;
    if (!w || w.isDestroyed()) return { ok: false };
    if (action === 'minimize') { w.minimize(); return { ok: true }; }
    if (action === 'close') { w.destroy(); return { ok: true }; }
    if (action === 'toggle-maximize') {
      if (w.isMaximized()) w.unmaximize(); else w.maximize();
      return { isMaximized: w.isMaximized(), isFocused: w.isFocused() };
    }
    return { ok: false };
  });

  ipcMain.handle('get-window-state', () => ({
    isMaximized: mainWindow?.isMaximized() ?? false,
    isFocused: mainWindow?.isFocused() ?? true,
  }));

  const sendWinState = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send('window-state-changed', {
      isMaximized: mainWindow.isMaximized(),
      isFocused: mainWindow.isFocused(),
    });
  };
  mainWindow.on('maximize', sendWinState);
  mainWindow.on('unmaximize', sendWinState);
  mainWindow.on('focus', sendWinState);
  mainWindow.on('blur', sendWinState);

  ipcMain.handle('navigate-home', () => {
    if (isViewerActive) showHome();
  });

  ipcMain.handle('reload-content', () => {
    if (isViewerActive && viewerView) {
      viewerView.webContents.reload();
    } else if (homeView) {
      homeView.webContents.reload();
    }
  });

  // Phase 1: splash
  ipcMain.handle('boot-complete', () => {
    if (booted) return;
    booted = true;
    if (!entryName) return;
    const folderName = path.basename(rootDir);
    enterAppMode(folderName);
  });

  setTimeout(() => {
    if (!booted && mainWindow && !mainWindow.isDestroyed()) {
      booted = true;
      if (entryName) {
        const folderName = path.basename(rootDir);
        enterAppMode(folderName);
      }
    }
  }, 8000);

  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(bootSplashHtml())}`);

  mainWindow.on('closed', () => { mainWindow = null; homeView = null; viewerView = null; });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (!mainWindow) createWindow(); });
