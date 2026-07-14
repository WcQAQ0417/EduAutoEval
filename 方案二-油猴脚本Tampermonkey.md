# 教务自动填表 - 方案二：油猴脚本(Tampermonkey)

## 方案概述
使用浏览器扩展 Tampermonkey（油猴）来运行用户脚本。脚本会在你访问教务系统时自动加载，提供更完善的用户界面和功能。

## 优点
- ✅ 一次安装，永久使用，访问页面自动生效
- ✅ 可以添加精美的控制界面
- ✅ 支持配置保存、功能开关
- ✅ 可以在多个页面间保持状态
- ✅ 代码更新方便

## 缺点
- ❌ 需要安装浏览器扩展
- ❌ 初次设置稍复杂

## 安装步骤

### 第一步：安装 Tampermonkey 扩展
1. 根据你的浏览器选择对应的扩展：
   - **Chrome/Edge**: [Tampermonkey - Chrome 网上应用店](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - **Firefox**: [Tampermonkey - Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tampermonkey/)
   - **Safari**: [Tampermonkey - App Store](https://apps.apple.com/app/tampermonkey/id1482490089)

2. 安装完成后，浏览器右上角会出现油猴图标

### 第二步：安装脚本
1. 点击油猴图标 → "添加新脚本"
2. 删除默认的模板内容
3. 将下面的脚本代码复制粘贴进去
4. 按 `Ctrl+S`（Mac: `Cmd+S`）保存脚本

---

## 油猴脚本代码

```javascript
// ==UserScript==
// @name         教务系统自动评教助手
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  自动填写教务系统教学评估，绕过2分钟限制，一键完成所有评估
// @author       AutoEval
// @match        *://jws.qgxy.cn/student/teachingEvaluation/*
// @match        *://*.qgxy.cn/student/teachingEvaluation/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置管理 ====================
    const DEFAULT_CONFIG = {
        scoreStrategy: 'mixed',      // good/random/mixed
        submitDelay: 5000,           // 提交前等待(ms)
        autoNext: true,              // 自动继续下一个
        skipCompleted: true,         // 跳过已完成
        enableShortcut: true,        // 启用快捷键
        floatingButton: true,        // 显示浮动按钮
        customComments: [
            '老师教学认真负责，讲解清晰易懂，课堂氛围很好，收获很大',
            '老师备课充分，重点突出，能够激发学生学习兴趣',
            '教学方法得当，注重互动，能够很好地引导学生思考',
            '老师授课生动有趣，理论联系实际，学到了很多知识',
            '老师责任心强，答疑耐心，课程设计合理，非常满意',
            '老师讲课条理清晰，深入浅出，重点难点讲解透彻',
            '老师教学态度严谨，课堂内容充实，很有收获',
            '老师风趣幽默，课堂气氛活跃，教学效果很好'
        ]
    };

    let config = { ...DEFAULT_CONFIG, ...GM_getValue('autoEvalConfig', {}) };
    let isRunning = false;
    let shouldStop = false;
    let completedCount = 0;
    let totalCount = 0;

    // ==================== 样式注入 ====================
    GM_addStyle(`
        #auto-eval-fab {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #438EB9;
            color: white;
            border: none;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(67, 142, 185, 0.4);
            z-index: 999999;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #auto-eval-fab:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(67, 142, 185, 0.6);
            background: #3a7ba3;
        }
        #auto-eval-fab.running {
            animation: pulse 2s infinite;
            background: #d15b47;
        }
        @keyframes pulse {
            0%, 100% { box-shadow: 0 4px 15px rgba(209, 91, 71, 0.4); }
            50% { box-shadow: 0 4px 30px rgba(209, 91, 71, 0.8); }
        }
        #auto-eval-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.9);
            width: 450px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            z-index: 1000000;
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        #auto-eval-panel.show {
            opacity: 1;
            pointer-events: auto;
            transform: translate(-50%, -50%) scale(1);
        }
        #auto-eval-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        #auto-eval-overlay.show {
            opacity: 1;
            pointer-events: auto;
        }
        .auto-eval-header {
            padding: 20px 24px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .auto-eval-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }
        .auto-eval-close {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: none;
            background: #f5f5f5;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        .auto-eval-close:hover {
            background: #eee;
        }
        .auto-eval-body {
            padding: 24px;
            max-height: 60vh;
            overflow-y: auto;
        }
        .auto-eval-status {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
        }
        .auto-eval-status-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .auto-eval-status-item:last-child {
            margin-bottom: 0;
        }
        .auto-eval-status-label {
            color: #666;
        }
        .auto-eval-status-value {
            font-weight: 600;
            color: #333;
        }
        .auto-eval-progress {
            margin-top: 12px;
            height: 6px;
            background: #e9ecef;
            border-radius: 3px;
            overflow: hidden;
        }
        .auto-eval-progress-bar {
            height: 100%;
            background: #438EB9;
            border-radius: 3px;
            transition: width 0.3s ease;
            width: 0%;
        }
        .auto-eval-current {
            margin-top: 8px;
            font-size: 12px;
            color: #888;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .auto-eval-section {
            margin-bottom: 20px;
        }
        .auto-eval-section-title {
            font-size: 14px;
            font-weight: 600;
            color: #333;
            margin-bottom: 12px;
        }
        .auto-eval-options {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        }
        .auto-eval-option {
            padding: 10px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
            background: white;
        }
        .auto-eval-option:hover {
            border-color: #438EB9;
        }
        .auto-eval-option.active {
            border-color: #438EB9;
            background: #e8f4fa;
            color: #438EB9;
            font-weight: 600;
        }
        .auto-eval-footer {
            padding: 16px 24px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 12px;
        }
        .auto-eval-btn {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .auto-eval-btn-primary {
            background: #438EB9;
            color: white;
        }
        .auto-eval-btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(67, 142, 185, 0.4);
            background: #3a7ba3;
        }
        .auto-eval-btn-danger {
            background: #fee;
            color: #e53e3e;
        }
        .auto-eval-btn-danger:hover {
            background: #fdd;
        }
        .auto-eval-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
        }
        .auto-eval-toast {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: #333;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000001;
            transition: transform 0.3s ease;
        }
        .auto-eval-toast.show {
            transform: translateX(-50%) translateY(0);
        }
        .auto-eval-toast.success {
            background: #48bb78;
        }
        .auto-eval-toast.error {
            background: #f56565;
        }
    `);

    // ==================== UI 创建 ====================
    function showToast(message, type = 'info') {
        let toast = document.getElementById('auto-eval-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'auto-eval-toast';
            toast.className = 'auto-eval-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.className = `auto-eval-toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function createFloatingButton() {
        if (!config.floatingButton) return;
        if (document.getElementById('auto-eval-fab')) return;

        const fab = document.createElement('button');
        fab.id = 'auto-eval-fab';
        fab.innerHTML = '🤖';
        fab.title = '自动评教助手';
        fab.addEventListener('click', togglePanel);
        document.body.appendChild(fab);
    }

    function createPanel() {
        if (document.getElementById('auto-eval-panel')) return;

        const overlay = document.createElement('div');
        overlay.id = 'auto-eval-overlay';
        overlay.addEventListener('click', hidePanel);

        const panel = document.createElement('div');
        panel.id = 'auto-eval-panel';
        panel.innerHTML = `
            <div class="auto-eval-header">
                <h3>🤖 自动评教助手</h3>
                <button class="auto-eval-close" id="auto-eval-close">✕</button>
            </div>
            <div class="auto-eval-body">
                <div class="auto-eval-status">
                    <div class="auto-eval-status-item">
                        <span class="auto-eval-status-label">运行状态</span>
                        <span class="auto-eval-status-value" id="eval-state">就绪</span>
                    </div>
                    <div class="auto-eval-status-item">
                        <span class="auto-eval-status-label">完成进度</span>
                        <span class="auto-eval-status-value" id="eval-count">0 / 0</span>
                    </div>
                    <div class="auto-eval-progress">
                        <div class="auto-eval-progress-bar" id="eval-progress-bar"></div>
                    </div>
                    <div class="auto-eval-current" id="eval-current">等待开始...</div>
                </div>
                <div class="auto-eval-section">
                    <div class="auto-eval-section-title">评分策略</div>
                    <div class="auto-eval-options" id="score-strategy-options">
                        <div class="auto-eval-option ${config.scoreStrategy === 'good' ? 'active' : ''}" data-value="good">
                            👍 全部好评
                        </div>
                        <div class="auto-eval-option ${config.scoreStrategy === 'mixed' ? 'active' : ''}" data-value="mixed">
                            🎲 随机好评
                        </div>
                        <div class="auto-eval-option ${config.scoreStrategy === 'random' ? 'active' : ''}" data-value="random">
                            🎰 完全随机
                        </div>
                    </div>
                </div>
            </div>
            <div class="auto-eval-footer">
                <button class="auto-eval-btn auto-eval-btn-primary" id="eval-start">开始自动评教</button>
                <button class="auto-eval-btn auto-eval-btn-danger" id="eval-stop" style="display:none;">停止</button>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        // 绑定事件
        document.getElementById('auto-eval-close').addEventListener('click', hidePanel);
        document.getElementById('eval-start').addEventListener('click', startAutoEval);
        document.getElementById('eval-stop').addEventListener('click', stopAutoEval);

        document.querySelectorAll('#score-strategy-options .auto-eval-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('#score-strategy-options .auto-eval-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                config.scoreStrategy = opt.dataset.value;
                saveConfig();
            });
        });
    }

    function togglePanel() {
        createPanel();
        const panel = document.getElementById('auto-eval-panel');
        const overlay = document.getElementById('auto-eval-overlay');
        const fab = document.getElementById('auto-eval-fab');
        if (panel.classList.contains('show')) {
            hidePanel();
        } else {
            panel.classList.add('show');
            overlay.classList.add('show');
        }
    }

    function hidePanel() {
        const panel = document.getElementById('auto-eval-panel');
        const overlay = document.getElementById('auto-eval-overlay');
        if (panel) panel.classList.remove('show');
        if (overlay) overlay.classList.remove('show');
    }

    function updateUI() {
        const state = document.getElementById('eval-state');
        const count = document.getElementById('eval-count');
        const progress = document.getElementById('eval-progress-bar');
        const current = document.getElementById('eval-current');
        const startBtn = document.getElementById('eval-start');
        const stopBtn = document.getElementById('eval-stop');
        const fab = document.getElementById('auto-eval-fab');

        if (state) state.textContent = isRunning ? '运行中...' : (shouldStop ? '正在停止...' : '就绪');
        if (count) count.textContent = `${completedCount} / ${totalCount}`;
        if (progress && totalCount > 0) {
            progress.style.width = `${(completedCount / totalCount) * 100}%`;
        }
        if (fab) fab.classList.toggle('running', isRunning);

        if (startBtn && stopBtn) {
            if (isRunning) {
                startBtn.style.display = 'none';
                stopBtn.style.display = 'block';
            } else {
                startBtn.style.display = 'block';
                stopBtn.style.display = 'none';
                startBtn.disabled = false;
                startBtn.textContent = shouldStop ? '已停止' : '开始自动评教';
            }
        }
    }

    function setCurrentText(text) {
        const el = document.getElementById('eval-current');
        if (el) el.textContent = text;
    }

    function saveConfig() {
        GM_setValue('autoEvalConfig', config);
    }

    // ==================== 核心逻辑 ====================
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getUnevaluatedButtons() {
        return Array.from(document.querySelectorAll('button.btn-purple, button.btn-success')).filter(btn => {
            const text = btn.textContent.trim();
            return text.includes('评估') && !text.includes('查看') && !text.includes('修改');
        });
    }

    function getRandomComment() {
        return config.customComments[Math.floor(Math.random() * config.customComments.length)];
    }

    async function fillForm() {
        setCurrentText('正在填写问卷...');

        // 获取所有单选题
        const radioGroups = {};
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            if (!radioGroups[radio.name]) radioGroups[radio.name] = [];
            radioGroups[radio.name].push(radio);
        });

        const names = Object.keys(radioGroups);
        for (let i = 0; i < names.length; i++) {
            if (shouldStop) return false;
            const options = radioGroups[names[i]];
            let selectedIndex;

            switch (config.scoreStrategy) {
                case 'good':
                    selectedIndex = Math.random() > 0.3 ? 0 : 1;
                    break;
                case 'random':
                    selectedIndex = Math.floor(Math.random() * Math.min(options.length, 3));
                    break;
                case 'mixed':
                default:
                    const r = Math.random();
                    selectedIndex = r > 0.8 ? 2 : (r > 0.4 ? 1 : 0);
            }

            selectedIndex = Math.min(selectedIndex, options.length - 1);
            options[selectedIndex].checked = true;
            options[selectedIndex].click();
            options[selectedIndex].dispatchEvent(new Event('change', { bubbles: true }));
            await sleep(30 + Math.random() * 50);
        }

        // 填写主观评价
        await sleep(300);
        const textarea = document.querySelector('textarea[name="zgpj"]');
        if (textarea) {
            const comment = getRandomComment();
            textarea.value = comment;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }

        setCurrentText('填写完成，等待提交...');
        await sleep(config.submitDelay);

        return true;
    }

    async function submitEvaluation() {
        setCurrentText('正在提交...');

        // 绕过时间限制
        if (typeof flag !== 'undefined') {
            flag = true;
        }
        if (typeof nM !== 'undefined' && typeof nS !== 'undefined') {
            nM = 0;
            nS = 0;
        }
        const remainM = document.getElementById('RemainM');
        const remainS = document.getElementById('RemainS');
        if (remainM) remainM.textContent = '0';
        if (remainS) remainS.textContent = '0';

        // Hook 确认框自动确认
        const originalLayerConfirm = layer.confirm;
        layer.confirm = function(msg, opts, cb) {
            if (typeof cb === 'function') setTimeout(() => cb(true), 100);
            return 0;
        };

        // Hook alert 避免阻塞
        let submitSuccess = false;
        const originalAlert = urp.alert;
        urp.alert = function(msg) {
            console.log('[自动评教]', msg);
            if (msg.includes('成功')) {
                submitSuccess = true;
            }
        };

        try {
            if (typeof toEvaluation === 'function') {
                toEvaluation('submit');
            } else {
                document.StDaForm.submit();
            }
        } catch (e) {
            console.error('提交出错:', e);
        }

        // 等待提交结果
        for (let i = 0; i < 50; i++) {
            if (shouldStop) break;
            if (submitSuccess || window.location.href.includes('evaluation/index')) {
                break;
            }
            await sleep(200);
        }

        // 恢复原函数
        layer.confirm = originalLayerConfirm;
        urp.alert = originalAlert;

        completedCount++;
        updateUI();

        return true;
    }

    async function runEvaluationPage() {
        setCurrentText('等待页面加载...');
        
        // 等待表单出现
        for (let i = 0; i < 50; i++) {
            if (shouldStop) return;
            if (document.querySelector('form[name="StDaForm"]')) break;
            await sleep(200);
        }

        if (shouldStop) return;

        // 获取教师/课程信息
        const infoRows = document.querySelectorAll('.profile-info-row .profile-info-value');
        let infoText = '';
        if (infoRows.length >= 2) {
            infoText = `${infoRows[0].textContent.trim()} - ${infoRows[1].textContent.trim()}`;
        }
        setCurrentText(infoText || '正在评估...');
        updateUI();

        await sleep(800);
        await fillForm();
        if (shouldStop) return;
        await submitEvaluation();
    }

    async function runListPage() {
        setCurrentText('正在获取评估列表...');
        
        // 等待列表加载
        await sleep(1000);
        for (let i = 0; i < 30; i++) {
            if (shouldStop) return;
            const buttons = getUnevaluatedButtons();
            if (buttons.length > 0 || document.querySelectorAll('button.btn-info').length > 0) break;
            await sleep(300);
        }

        const buttons = getUnevaluatedButtons();
        totalCount = completedCount + buttons.length;
        updateUI();

        if (buttons.length === 0) {
            isRunning = false;
            shouldStop = false;
            updateUI();
            showToast(`评教完成！共完成 ${completedCount} 个评估`, 'success');
            return;
        }

        setCurrentText(`找到 ${buttons.length} 个待评估项目`);

        // 点击第一个评估按钮
        await sleep(500);
        if (shouldStop) return;
        
        const btn = buttons[0];
        const row = btn.closest('tr');
        if (row) {
            const tds = row.querySelectorAll('td');
            if (tds.length >= 4) {
                setCurrentText(`进入: ${tds[2].textContent.trim()} - ${tds[3].textContent.trim()}`);
            }
        }
        updateUI();
        btn.click();
    }

    function checkPage() {
        const url = window.location.href;
        if (url.includes('evaluationPage') || document.querySelector('form[name="StDaForm"]')) {
            return 'evaluation';
        }
        if (url.includes('evaluation/index')) {
            return 'list';
        }
        return 'unknown';
    }

    async function startAutoEval() {
        if (isRunning) return;
        isRunning = true;
        shouldStop = false;
        completedCount = 0;
        hidePanel();
        updateUI();
        showToast('自动评教已开始');

        // 主循环
        while (!shouldStop) {
            const page = checkPage();
            
            if (page === 'list') {
                await runListPage();
                if (isRunning === false && shouldStop === false) break;
            } else if (page === 'evaluation') {
                await runEvaluationPage();
            } else {
                setCurrentText('未知页面，正在跳转...');
                window.location.href = '/student/teachingEvaluation/evaluation/index';
                await sleep(2000);
            }

            await sleep(1000);
        }

        isRunning = false;
        updateUI();
    }

    function stopAutoEval() {
        shouldStop = true;
        setCurrentText('正在停止...');
        updateUI();
        showToast('正在停止...');
    }

    // ==================== 快捷键 ====================
    document.addEventListener('keydown', (e) => {
        if (config.enableShortcut && e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            togglePanel();
        }
    });

    // ==================== 页面跳转监听 ====================
    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            if (isRunning && !shouldStop) {
                setTimeout(() => {
                    const page = checkPage();
                    if (page === 'list') {
                        runListPage();
                    } else if (page === 'evaluation') {
                        runEvaluationPage();
                    }
                }, 1000);
            }
        }
    });

    // ==================== 初始化 ====================
    function init() {
        createFloatingButton();
        urlObserver.observe(document, { subtree: true, childList: true });
        console.log('%c🤖 教务自动评教助手已加载', 'color: #438EB9; font-size: 14px; font-weight: bold;');
        console.log('%c按 Ctrl+E 打开控制面板', 'color: #888; font-size: 12px;');
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
    } else {
        window.addEventListener('DOMContentLoaded', init);
    }

})();
```

## 使用说明

### 基本使用
1. 安装脚本后，访问教务系统教学评估页面
2. 右下角会出现一个紫色的浮动按钮（🤖）
3. 点击浮动按钮（或按 `Ctrl+E`）打开控制面板
4. 选择评分策略，点击"开始自动评教"
5. 脚本会自动完成所有评估

### 评分策略
- **👍 全部好评**：所有题目选"好"/"完全符合"，偶尔选"较好"
- **🎲 随机好评**（推荐）：大部分好评，夹杂一些"较好"和"一般"，看起来更真实
- **🎰 完全随机**：在前3个选项中随机选择

### 功能特性
- 🎨 美观的控制面板，实时显示进度
- ⚡ 自动绕过2分钟倒计时限制
- 📊 进度条显示完成情况
- 🔄 自动处理页面跳转
- ⌨️ 快捷键 `Ctrl+E` 快速打开面板
- 💾 配置自动保存
- 🛑 随时可以停止

### 注意事项
1. 使用前请确保已登录教务系统
2. 脚本会自动覆盖提交确认框
3. 如果遇到问题，刷新页面即可重置
4. 主观评价内容可以在脚本中 `customComments` 数组修改
