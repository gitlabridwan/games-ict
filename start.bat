@echo off
title Kota Komputasional
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js belum terpasang. Unduh dari https://nodejs.org/
  pause
  exit /b 1
)
start "" http://localhost:4173
node server.mjs
pause
