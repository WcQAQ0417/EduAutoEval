#!/bin/bash
set -e

echo "=========================================="
echo "🤖 教务系统自动评教助手 - 一键启动"
echo "=========================================="
echo ""

# 检查 uv 是否安装
if ! command -v uv &> /dev/null; then
    echo "📦 正在安装 uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    echo "✅ uv 安装完成"
    echo ""
    # 重新加载 PATH
    export PATH="$HOME/.cargo/bin:$PATH"
    if [ -f "$HOME/.local/bin/uv" ]; then
        export PATH="$HOME/.local/bin:$PATH"
    fi
fi

echo "🐍 使用 Python 3.11..."
echo ""

echo "📦 安装/同步依赖 (使用清华源加速)..."
export UV_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
uv sync

echo ""
echo "🌐 安装 Playwright 浏览器 (Chromium)..."
uv run playwright install chromium

echo ""
echo "🚀 启动自动评教助手..."
echo ""
uv run auto-eval
