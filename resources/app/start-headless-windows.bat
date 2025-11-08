@echo off
echo Starting BEST Backend in HEADLESS mode...
echo This will run WITHOUT the GUI window
echo.
set HEADLESS=true
node_modules\.bin\electron.cmd . --headless
