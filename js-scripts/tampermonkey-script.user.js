// ==UserScript==
// @name         教务系统自动评教助手
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  自动填写教学评估问卷，等待2分钟倒计时后自动提交，返回列表继续处理
// @author       AutoEval
// @match        *://*/student/teachingEvaluation/*
// @match        *://jws.qgxy.cn/student/teachingEvaluation/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    if (window.top !== window.self) return;

    const DEFAULT_COMMENTS = [
        "老师教学认真负责讲解清晰易懂课堂氛围很好收获很大",
        "老师备课充分重点突出能够激发学生学习兴趣",
        "教学方法得当注重互动能够很好地引导学生思考",
        "老师授课生动有趣理论联系实际学到了很多知识",
        "老师责任心强答疑耐心课程设计合理非常满意",
        "老师讲课条理清晰深入浅出重点难点讲解透彻",
        "老师教学态度严谨课堂内容充实很有收获",
        "老师风趣幽默课堂气氛活跃教学效果很好",
        "老师讲解细致耐心善于举例帮助理解难点",
        "老师教学水平高课程安排合理受益匪浅"
    ];

    let CONFIG = {
        comments: DEFAULT_COMMENTS,
        waitAfterFill: 3
    };

    let state = {
        running: false,
        stopRequested: false,
        completed: 0,
        panelVisible: false,
        fab: null,
        panel: null,
        statusEl: null,
        countEl: null,
        progressEl: null
    };

    function saveConfig() {
        try { GM_setValue('autoEvalConfig', JSON.stringify(CONFIG)); } catch(e) {}
    }

    function loadConfig() {
        try {
            const saved = GM_getValue('autoEvalConfig');
            if (saved) {
                const parsed = JSON.parse(saved);
                CONFIG = { ...CONFIG, ...parsed };
            }
        } catch(e) {}
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function createUI() {
        if (state.fab) return;

        GM_addStyle(`
            #auto-eval-fab {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: #438EB9;
                color: white;
                border: none;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 4px 16px rgba(67, 142, 185, 0.4);
                z-index: 999999;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            #auto-eval-fab:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 24px rgba(67, 142, 185, 0.5);
                background: #3a7ba3;
            }
            #auto-eval-fab.running {
                animation: pulse 2s infinite;
                background: #d15b47;
            }
            @keyframes pulse {
                0%, 100% { box-shadow: 0 4px 16px rgba(209, 91, 71, 0.4); }
                50% { box-shadow: 0 4px 32px rgba(209, 91, 71, 0.7); }
            }
            #auto-eval-panel {
                position: fixed;
                bottom: 100px;
                right: 30px;
                width: 360px;
                background: white;
                border-radius: 14px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.18);
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                font-size: 14px;
                overflow: hidden;
                display: none;
                border: 1px solid #e5e7eb;
            }
            .auto-eval-header {
                background: #438EB9;
                color: white;
                padding: 16px 20px;
                font-weight: 600;
                font-size: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .auto-eval-header button {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 5px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
            }
            .auto-eval-header button:hover {
                background: rgba(255,255,255,0.3);
            }
            .auto-eval-body {
                padding: 18px 20px;
            }
            .auto-eval-status {
                color: #374151;
                line-height: 1.6;
                margin-bottom: 14px;
                min-height: 44px;
            }
            .auto-eval-stats {
                background: #f3f4f6;
                border-radius: 10px;
                padding: 12px 14px;
                margin-bottom: 14px;
            }
            .auto-eval-stat-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            .auto-eval-stat-row:last-child { margin-bottom: 0; }
            .auto-eval-stat-label { color: #6b7280; }
            .auto-eval-stat-value { color: #438EB9; font-weight: 600; }
            .auto-eval-progress {
                background: #e5e7eb;
                border-radius: 6px;
                height: 8px;
                overflow: hidden;
                margin-top: 4px;
            }
            .auto-eval-progress-bar {
                height: 100%;
                background: #438EB9;
                border-radius: 6px;
                transition: width 0.3s ease;
                width: 0%;
            }
            .auto-eval-tip {
                font-size: 12px;
                color: #9ca3af;
                line-height: 1.5;
                background: #f9fafb;
                padding: 10px 12px;
                border-radius: 8px;
            }
            .auto-eval-btn-row {
                display: flex;
                gap: 10px;
                margin-top: 14px;
            }
            .auto-eval-btn {
                flex: 1;
                padding: 10px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
            }
            .auto-eval-btn-primary {
                background: #438EB9;
                color: white;
            }
            .auto-eval-btn-primary:hover {
                background: #3a7ba3;
            }
            .auto-eval-btn-secondary {
                background: #f3f4f6;
                color: #374151;
            }
            .auto-eval-btn-secondary:hover {
                background: #e5e7eb;
            }
            .auto-eval-btn-danger {
                background: #fee2e2;
                color: #dc2626;
            }
            .auto-eval-btn-danger:hover {
                background: #fecaca;
            }
        `);

        state.fab = document.createElement('button');
        state.fab.id = 'auto-eval-fab';
        state.fab.innerHTML = '🤖';
        state.fab.title = '自动评教助手';
        state.fab.addEventListener('click', togglePanel);
        document.body.appendChild(state.fab);

        state.panel = document.createElement('div');
        state.panel.id = 'auto-eval-panel';
        state.panel.innerHTML = `
            <div class="auto-eval-header">
                <span>🤖 自动评教助手</span>
                <button id="autoEvalCloseBtn">×</button>
            </div>
            <div class="auto-eval-body">
                <div class="auto-eval-status" id="autoEvalStatus">点击开始按钮开始自动评教</div>
                <div class="auto-eval-stats">
                    <div class="auto-eval-stat-row">
                        <span class="auto-eval-stat-label">已完成</span>
                        <span class="auto-eval-stat-value" id="autoEvalCount">0</span>
                    </div>
                    <div class="auto-eval-progress">
                        <div class="auto-eval-progress-bar" id="autoEvalProgress"></div>
                    </div>
                </div>
                <div class="auto-eval-tip">
                    💡 后端有2分钟时间校验，脚本会真实等待倒计时结束后提交，请耐心等待
                </div>
                <div class="auto-eval-btn-row">
                    <button class="auto-eval-btn auto-eval-btn-primary" id="autoEvalStartBtn">开始</button>
                    <button class="auto-eval-btn auto-eval-btn-danger" id="autoEvalStopBtn" style="display:none;">停止</button>
                </div>
            </div>
        `;
        document.body.appendChild(state.panel);

        state.statusEl = document.getElementById('autoEvalStatus');
        state.countEl = document.getElementById('autoEvalCount');
        state.progressEl = document.getElementById('autoEvalProgress');

        document.getElementById('autoEvalCloseBtn').addEventListener('click', togglePanel);
        document.getElementById('autoEvalStartBtn').addEventListener('click', startEvaluation);
        document.getElementById('autoEvalStopBtn').addEventListener('click', stopEvaluation);

        GM_registerMenuCommand('🤖 开始自动评教', startEvaluation);
        GM_registerMenuCommand('⏹ 停止自动评教', stopEvaluation);
        GM_registerMenuCommand('📋 显示/隐藏面板', togglePanel);
    }

    function togglePanel() {
        state.panelVisible = !state.panelVisible;
        state.panel.style.display = state.panelVisible ? 'block' : 'none';
    }

    function updateStatus(text) {
        if (state.statusEl) state.statusEl.innerHTML = text;
        console.log('[AutoEval]', text);
    }

    function updateCount() {
        if (state.countEl) state.countEl.textContent = state.completed;
    }

    function setRunning(isRunning) {
        state.running = isRunning;
        if (state.fab) {
            state.fab.classList.toggle('running', isRunning);
        }
        const startBtn = document.getElementById('autoEvalStartBtn');
        const stopBtn = document.getElementById('autoEvalStopBtn');
        if (startBtn) startBtn.style.display = isRunning ? 'none' : 'block';
        if (stopBtn) stopBtn.style.display = isRunning ? 'block' : 'none';
    }

    function hookDialogs() {
        if (typeof layer !== 'undefined' && layer.confirm && !layer.confirm.__autoEvalHooked) {
            const orig = layer.confirm;
            layer.confirm = function(msg, opts, cb) {
                console.log('[AutoEval] 自动确认弹窗:', msg);
                if (typeof cb === 'function') {
                    setTimeout(() => cb(true), 200);
                }
                return 0;
            };
            layer.confirm.__autoEvalHooked = true;
        }

        if (typeof urp !== 'undefined' && urp.alert && !urp.alert.__autoEvalHooked) {
            const origAlert = urp.alert;
            urp.alert = function(msg) {
                console.log('[AutoEval] 系统提示:', msg);
                window.__autoEvalLastMsg = msg;
                setTimeout(() => {
                    if (msg.includes('保存成功')) {
                        window.__autoEvalSubmitSuccess = true;
                    } else if (msg.includes('失败') || msg.includes('未到') || msg.includes('错误')) {
                        window.__autoEvalSubmitError = msg;
                    }
                }, 50);
                origAlert.call(this, msg);
            };
            urp.alert.__autoEvalHooked = true;
        }
    }

    function getUnevaluatedButtons() {
        const buttons = [];
        const allBtns = document.querySelectorAll('button, a.btn');
        for (const btn of allBtns) {
            const text = (btn.innerText || '').trim();
            const classes = btn.className || '';
            if (text.includes('评估') && !text.includes('查看') && !text.includes('修改') &&
                (classes.includes('btn-purple') || classes.includes('btn-success') || classes.includes('btn-primary'))) {
                const style = window.getComputedStyle(btn);
                if (style.display !== 'none' && style.visibility !== 'hidden' && btn.offsetParent !== null) {
                    buttons.push(btn);
                }
            }
        }
        return buttons;
    }

    function selectScore(optionCount) {
        const r = Math.random();
        if (r > 0.75) return Math.min(2, optionCount - 1);
        else if (r > 0.35) return Math.min(1, optionCount - 1);
        else return 0;
    }

    function fillForm() {
        return new Promise((resolve) => {
            updateStatus('📝 正在填写问卷...');
            window.scrollTo(0, 0);

            const radioGroups = {};
            const allRadios = document.querySelectorAll('input[type="radio"]');
            for (const r of allRadios) {
                const name = r.name;
                if (name) {
                    if (!radioGroups[name]) radioGroups[name] = [];
                    radioGroups[name].push(r.value);
                }
            }

            const total = Object.keys(radioGroups).length;
            let filled = 0;

            for (const [name, values] of Object.entries(radioGroups)) {
                const idx = selectScore(values.length);
                const selectedValue = values[idx];

                const radios = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
                for (const radio of radios) {
                    if (radio.value === selectedValue) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('click', { bubbles: true }));
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                        const label = radio.closest('label');
                        if (label) label.click();
                        filled++;
                        break;
                    }
                }

                if (filled % 5 === 0) {
                    updateStatus(`📝 已完成 ${filled}/${total} 题`);
                }
            }

            updateStatus(`✅ 单选题填写完成: ${filled}/${total}`);

            setTimeout(() => {
                window.scrollTo(0, document.body.scrollHeight);
                const textarea = document.querySelector('textarea[name="zgpj"]');
                if (textarea) {
                    const comment = CONFIG.comments[Math.floor(Math.random() * CONFIG.comments.length)];
                    updateStatus('📝 填写主观评价...');
                    textarea.value = comment;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.dispatchEvent(new Event('change', { bubbles: true }));
                }

                setTimeout(resolve, CONFIG.waitAfterFill * 1000);
            }, 500);
        });
    }

    function waitForTimer() {
        return new Promise((resolve) => {
            updateStatus('⏳ 开始等待2分钟倒计时（后端校验时间）...');
            const startTime = Date.now();
            let lastPrintTime = 0;
            let lastRemain = null;

            const checkTimer = setInterval(() => {
                if (state.stopRequested) {
                    clearInterval(checkTimer);
                    resolve(false);
                    return;
                }

                const elapsed = (Date.now() - startTime) / 1000;
                if (elapsed > 210) {
                    clearInterval(checkTimer);
                    updateStatus('⚠️ 等待超时，尝试提交');
                    resolve(true);
                    return;
                }

                const mEl = document.getElementById('RemainM');
                const sEl = document.getElementById('RemainS');
                const min = mEl ? parseInt(mEl.textContent) : 0;
                const sec = sEl ? parseInt(sEl.textContent) : 0;
                const f = (typeof flag !== 'undefined') ? flag : false;

                const currentRemain = `${min}分${sec}秒`;
                if (f === true && min === 0 && sec === 0) {
                    clearInterval(checkTimer);
                    updateStatus('✅ 倒计时结束，准备提交');
                    resolve(true);
                    return;
                }

                if (currentRemain !== lastRemain || (Date.now() - lastPrintTime) > 10000) {
                    updateStatus(`⏳ 等待中... 剩余 ${currentRemain} (已等待 ${Math.floor(elapsed)}秒)`);
                    lastRemain = currentRemain;
                    lastPrintTime = Date.now();
                }

                if (Math.floor(elapsed) % 20 === 0 && Math.floor(elapsed) > 0) {
                    window.scrollTo({
                        top: window.scrollY + (Math.random() > 0.5 ? 100 : -50),
                        behavior: 'smooth'
                    });
                }
            }, 1000);
        });
    }

    function doSubmit() {
        return new Promise((resolve) => {
            window.__autoEvalSubmitSuccess = false;
            window.__autoEvalSubmitError = '';
            window.__autoEvalLastMsg = '';

            hookDialogs();
            window.scrollTo(0, document.body.scrollHeight);

            const form = document.StDaForm;
            if (!form) {
                resolve({ status: 'error', message: '未找到表单' });
                return;
            }

            if (typeof $ === 'undefined' || !$('#buttonSubmit').length) {
                resolve({ status: 'error', message: '页面未加载完成' });
                return;
            }

            const formData = $(form).serialize();
            const $btn = $('#buttonSubmit');
            const originalBtnText = $btn.html();
            $btn.attr('disabled', 'disabled');
            $btn.html('正在提交...');

            updateStatus('📤 正在提交...');

            $.ajax({
                cache: true,
                type: 'POST',
                async: true,
                url: '/student/teachingEvaluation/teachingEvaluation/assessment',
                data: formData,
                error: function(xhr) {
                    $btn.removeAttr('disabled');
                    $btn.html(originalBtnText);
                    resolve({ status: 'network_error', message: 'HTTP ' + xhr.status });
                },
                success: function(data) {
                    $btn.removeAttr('disabled');
                    $btn.html(originalBtnText);

                    if (data.token) {
                        const tokenInput = document.getElementById('tokenValue');
                        if (tokenInput) tokenInput.value = data.token;
                    }

                    if (data.result && data.result.indexOf('/') !== -1) {
                        resolve({ status: 'redirect', message: data.result });
                    } else if (data.result === 'success') {
                        resolve({ status: 'success', message: '保存成功' });
                    } else if (data.result === 'notEnoughTime') {
                        resolve({ status: 'not_enough_time', message: '未到时间' });
                    } else if (data.result === 'error') {
                        resolve({ status: 'illegal_submit', message: '非法提交' });
                    } else if (data.result === 'Less_than_specified_fraction') {
                        resolve({ status: 'low_score', message: '总分过低' });
                    } else {
                        resolve({ status: 'error', message: '未知错误' });
                    }
                }
            });

            setTimeout(() => {
                if (!window.__autoEvalSubmitSuccess && !window.__autoEvalSubmitError) {
                    $btn.removeAttr('disabled');
                    $btn.html(originalBtnText);
                }
            }, 30000);
        });
    }

    async function returnToListPage() {
        updateStatus('🔙 返回评估列表页...');
        const listUrl = '/student/teachingEvaluation/evaluation/index';

        for (let i = 0; i < 3; i++) {
            if (state.stopRequested) return false;
            try {
                if (!window.location.pathname.includes('evaluation/index')) {
                    window.location.href = listUrl;
                }
                await sleep(3000);
                const buttons = getUnevaluatedButtons();
                const viewBtns = document.querySelectorAll('button.btn-info');
                if (buttons.length > 0 || viewBtns.length > 0) {
                    updateStatus('已返回评估列表页');
                    return true;
                }
            } catch(e) {
                await sleep(2000);
            }
        }
        window.location.href = listUrl;
        await sleep(3000);
        return true;
    }

    async function waitForForm() {
        for (let i = 0; i < 90; i++) {
            if (state.stopRequested) return false;
            const form = document.querySelector('form[name="StDaForm"]');
            const submitBtn = document.getElementById('buttonSubmit');
            const radioCount = document.querySelectorAll('input[type="radio"]').length;
            const textarea = document.querySelector('textarea[name="zgpj"]');
            if (form && submitBtn && radioCount > 5 && textarea) {
                updateStatus(`📋 表单加载完成，共 ${radioCount} 个单选按钮`);
                await sleep(1000);
                return true;
            }
            await sleep(300);
        }
        return false;
    }

    async function processOneEvaluation() {
        await fillForm();
        await sleep(1000);

        const timerOk = await waitForTimer();
        if (!timerOk) return false;

        await sleep(2000);

        for (let attempt = 1; attempt <= 5; attempt++) {
            if (state.stopRequested) return false;

            updateStatus(`📤 提交尝试 ${attempt}/5...`);
            await sleep(1000);

            const result = await doSubmit();
            updateStatus(`提交结果: ${result.status} - ${result.message || ''}`);

            if (result.status === 'success' || result.status === 'redirect') {
                state.completed++;
                updateCount();
                updateStatus(`✅ 提交成功！已完成 ${state.completed} 个`);
                await sleep(3000);
                return true;
            } else if (result.status === 'not_enough_time') {
                updateStatus('⏳ 服务器提示未到时间，继续等待...');
                await waitForTimer();
                await sleep(1000);
                continue;
            } else if (result.status === 'low_score') {
                updateStatus('❌ 总分过低，跳过');
                return false;
            } else {
                if (attempt < 5) {
                    updateStatus(`⚠️ 提交失败，等待5秒重试...`);
                    await sleep(5000);
                }
            }
        }

        updateStatus('❌ 多次重试失败，跳过');
        return false;
    }

    async function goToEvaluation(btn) {
        try {
            const row = btn.closest('tr');
            if (row) {
                const tds = row.querySelectorAll('td');
                if (tds.length >= 4) {
                    const teacher = (tds[2].innerText || '').trim();
                    const course = (tds[3].innerText || '').trim();
                    updateStatus(`🚀 进入评估: ${teacher} - ${course}`);
                }
            }
            btn.click();
        } catch(e) {
            window.location.href = '/student/teachingEvaluation/evaluation/index';
            await sleep(2000);
            return false;
        }
        await sleep(3000);
        return await waitForForm();
    }

    async function mainLoop() {
        while (state.running && !state.stopRequested) {
            if (!window.location.pathname.includes('evaluation/index')) {
                await returnToListPage();
                await sleep(2000);
                continue;
            }

            const buttons = getUnevaluatedButtons();

            if (buttons.length === 0) {
                const viewBtns = document.querySelectorAll('button.btn-info');
                if (state.completed > 0 || viewBtns.length > 0) {
                    updateStatus(`🎉 全部评估完成！共完成 ${state.completed} 个`);
                    setRunning(false);
                    alert(`🎉 自动评教完成！共完成 ${state.completed} 个评估`);
                    break;
                } else {
                    updateStatus('⏳ 等待页面加载...');
                    await sleep(2000);
                    continue;
                }
            }

            updateStatus(`📋 发现 ${buttons.length} 个待评估项目 (已完成: ${state.completed})`);

            const btn = buttons[0];
            const entered = await goToEvaluation(btn);

            if (entered) {
                await processOneEvaluation();
            } else {
                updateStatus('⚠️ 进入表单失败，重试');
            }

            await returnToListPage();
            await sleep(2000);
        }

        setRunning(false);
        updateStatus(state.stopRequested ? '⏹ 已停止' : `完成！共 ${state.completed} 个`);
        state.completed = 0;
        updateCount();
    }

    function startEvaluation() {
        if (state.running) {
            updateStatus('⚠️ 已经在运行中');
            return;
        }
        loadConfig();
        hookDialogs();
        state.running = true;
        state.stopRequested = false;
        setRunning(true);
        if (!state.panelVisible) togglePanel();
        updateStatus('🚀 开始自动评教...');
        console.log('%c🤖 自动评教已启动', 'color: #438EB9; font-weight: bold;');
        mainLoop().catch(err => {
            console.error('[AutoEval] 出错:', err);
            setRunning(false);
            updateStatus('❌ 发生错误: ' + err.message);
        });
    }

    function stopEvaluation() {
        state.stopRequested = true;
        updateStatus('⏹ 正在停止...');
    }

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createUI);
        } else {
            createUI();
        }
    }

    init();

})();
