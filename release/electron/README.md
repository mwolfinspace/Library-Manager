# Data Manager Desktop Build

This Electron wrapper uses the live files in `Manager Tools/` as the app source.

## Build once

```powershell
npm install
```

## Run the desktop app locally

```powershell
npm run desktop:dev
```

## Build updated Windows apps after changing HTML/CSS/JS

```powershell
npm run desktop:build
```

Output files will be created in `release/dist/`.
