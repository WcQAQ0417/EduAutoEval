(function() {
    'use strict';

    if (window.__autoEvalRunning) {
        console.log('%c🤖 自动评教已在运行中！', 'color: #d15b47; font-weight: bold;');
        return;
    }
    window.__autoEvalRunning = true;
    window.__autoEvalStop = false;

    const CONFIG = {
        comments: [
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
        ],
        waitAfterFill: 3
    };

    let statusPanel = null;
    let completed = 0;

    function createStatusPanel() {
        if (statusPanel) {
            statusPanel.style.display = 'block';
            return;
        }
        statusPanel = document.createElement('div');
        statusPanel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 340px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.15);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
        `;
        statusPanel.innerHTML = `
            <div style="background: #438EB9; color: white; padding: 14px 18px; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                <span>🤖 自动评教助手</span>
                <button id="autoEvalStopBtn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">停止</button>
            </div>
            <div style="padding: 16px 18px;">
                <div id="autoEvalStatus" style="color: #374151; margin-bottom: 10px; line-height: 1.6;">正在初始化...</div>
                <div style="background: #f3f4f6; border-radius: 8px; padding: 10px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="color: #6b7280;">已完成</span>
                        <span id="autoEvalCount" style="color: #438EB9; font-weight: 600;">0</span>
                    </div>
                    <div style="background: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
                        <div id="autoEvalProgress" style="height: 100%; background: #438EB9; border-radius: 4px; transition: width 0.3s; width: 0%;"></div>
                    </div>
                </div>
                <div style="font-size: 12px; color: #9ca3af; line-height: 1.5;">
                    💡 提示：后端有2分钟时间校验，无法绕过，请耐心等待
                </div>
            </div>
        `;
        document.body.appendChild(statusPanel);

        document.getElementById('autoEvalStopBtn').addEventListener('click', function() {
            window.__autoEvalStop = true;
            updateStatus('⏹ 已停止，完成当前操作后退出');
        });
    }

    function updateStatus(text) {
        const el = document.getElementById('autoEvalStatus');
        if (el) el.innerHTML = text;
        console.log('[AutoEval]', text);
    }

    function updateCount() {
        const el = document.getElementById('autoEvalCount');
        if (el) el.textContent = completed;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function hookDialogs() {
        if (typeof layer !== 'undefined' && layer.confirm && !layer.confirm.__hooked) {
            const orig = layer.confirm;
            layer.confirm = function(msg, opts, cb) {
                console.log('[AutoEval] 自动确认弹窗:', msg);
                if (typeof cb === 'function') {
                    setTimeout(() => cb(true), 200);
                }
                return 0;
            };
            layer.confirm.__hooked = true;
        }

        if (typeof urp !== 'undefined' && urp.alert && !urp.alert.__hooked) {
            const origAlert = urp.alert;
            urp.alert = function(msg) {
                console.log('[AutoEval] 系统提示:', msg);
                window.__lastAlertMsg = msg;
                window.__lastAlertTime = Date.now();
                setTimeout(() => {
                    if (msg.includes('保存成功')) {
                        window.__submitSuccess = true;
                    } else if (msg.includes('失败') || msg.includes('未到') || msg.includes('错误')) {
                        window.__submitError = msg;
                    }
                }, 50);
            };
            urp.alert.__hooked = true;
        }
    }

    function getUnevaluatedButtons() {
        const buttons = [];
        const allBtns = document.querySelectorAll('button');
        for (const btn of allBtns) {
            const text = (btn.innerText || '').trim();
            const classes = btn.className || '';
            if (text.includes('评估') && !text.includes('查看') && !text.includes('修改') &&
                (classes.includes('btn-purple') || classes.includes('btn-success') || classes.includes('btn-primary'))) {
                const style = window.getComputedStyle(btn);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
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
                const textarea = document.querySelector('textarea[name="zgpj"]');
                if (textarea) {
                    const comment = CONFIG.comments[Math.floor(Math.random() * CONFIG.comments.length)];
                    updateStatus(`📝 填写主观评价...`);
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
            updateStatus('⏳ 开始等待2分钟倒计时（后端校验时间，无法绕过）...');
            const startTime = Date.now();
            let lastPrintTime = 0;
            let lastRemain = null;

            const checkTimer = setInterval(() => {
                if (window.__autoEvalStop) {
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
            window.__submitSuccess = false;
            window.__submitError = '';
            window.__lastAlertMsg = '';
            window.__lastAlertTime = 0;

            hookDialogs();
            window.scrollTo(0, document.body.scrollHeight);

            const form = document.StDaForm;
            if (!form) {
                resolve({ status: 'error', message: '未找到表单' });
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
                if (!window.__submitSuccess && !window.__submitError) {
                    $btn.removeAttr('disabled');
                    $btn.html(originalBtnText);
                    resolve({ status: 'timeout', message: '请求超时' });
                }
            }, 30000);
        });
    }

    async function returnToListPage() {
        updateStatus('🔙 返回评估列表页...');
        const listUrl = '/student/teachingEvaluation/evaluation/index';

        for (let i = 0; i < 3; i++) {
            if (window.__autoEvalStop) return false;
            try {
                window.location.href = listUrl;
                await sleep(3000);
                return true;
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
            if (window.__autoEvalStop) return false;
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
            if (window.__autoEvalStop) return false;

            updateStatus(`📤 提交尝试 ${attempt}/5...`);
            await sleep(1000);

            const result = await doSubmit();
            updateStatus(`提交结果: ${result.status} - ${result.message || ''}`);

            if (result.status === 'success' || result.status === 'redirect') {
                completed++;
                updateCount();
                updateStatus(`✅ 提交成功！已完成 ${completed} 个`);
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
        createStatusPanel();
        hookDialogs();

        while (!window.__autoEvalStop) {
            if (!window.location.pathname.includes('evaluation/index')) {
                await returnToListPage();
                await sleep(2000);
                continue;
            }

            const buttons = getUnevaluatedButtons();

            if (buttons.length === 0) {
                const viewBtns = document.querySelectorAll('button.btn-info');
                if (completed > 0 || viewBtns.length > 0) {
                    updateStatus(`🎉 全部评估完成！共完成 ${completed} 个`);
                    alert(`🎉 自动评教完成！共完成 ${completed} 个评估`);
                    break;
                } else {
                    updateStatus('⏳ 等待页面加载...');
                    await sleep(2000);
                    continue;
                }
            }

            updateStatus(`📋 发现 ${buttons.length} 个待评估项目 (已完成: ${completed})`);

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

        window.__autoEvalRunning = false;
        if (statusPanel) {
            setTimeout(() => { if (statusPanel) statusPanel.style.display = 'none'; }, 3000);
        }
        console.log('%c🤖 自动评教结束', 'color: #438EB9; font-weight: bold;');
    }

    console.log('%c🤖 自动评教助手已启动', 'color: #438EB9; font-size: 14px; font-weight: bold;');
    console.log('%c重要说明：后端有2分钟时间校验，将真实等待', 'color: #d15b47;');
    mainLoop().catch(err => {
        console.error('[AutoEval] 出错:', err);
        window.__autoEvalRunning = false;
    });

})();
