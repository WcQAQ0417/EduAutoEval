@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==========================================
echo 🤖 教务系统自动评教助手 - 一键启动
echo ==========================================
echo.

:: 检查 uv 是否安装
where uv >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 正在安装 uv...
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    echo ✅ uv 安装完成
    echo.
    :: 添加到 PATH
    set "PATH=%USERPROFILE%\.local\bin;%USERPROFILE%\.cargo\bin;%PATH%"
)

echo 🐍 使用 Python 3.11...
echo.

echo 📦 安装/同步依赖 ^(使用清华源加速^)...
set UV_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
uv sync
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo.
echo 🌐 安装 Playwright 浏览器 ^(Chromium^)...
uv run playwright install chromium
if %errorlevel% neq 0 (
    echo ❌ 浏览器安装失败
    pause
    exit /b 1
)

echo.
echo 🚀 启动自动评教助手...
echo.
uv run auto-eval

echo.
pause
