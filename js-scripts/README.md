# JavaScript 版本使用说明（浏览器控制台脚本 + 油猴脚本）

本目录包含两个纯 JavaScript 实现的方案，无需安装 Python 环境，直接在浏览器中运行。

---

## 文件说明

| 文件 | 方案 |
|------|------|
| [console-script.js](./console-script.js) | 方案一：浏览器控制台脚本（零安装） |
| [tampermonkey-script.user.js](./tampermonkey-script.user.js) | 方案二：油猴脚本（推荐日常使用） |

---

## 方案一：浏览器控制台脚本（零安装）

适合临时使用一次，不想安装任何扩展或软件的场景。

### 特点

- 零安装：不需要任何浏览器扩展或第三方软件
- 即用即走：刷新页面或关闭标签页后脚本立即消失，不留任何痕迹
- 缺点：关闭页面或刷新后需要重新复制粘贴代码

### 使用步骤

1. 打开 Chrome/Edge/Firefox 浏览器，登录你的教务系统
2. 导航进入"教学评估"列表页面，确保能看到所有待评估课程列表
3. 按键盘 `F12`（Mac 系统按 `Cmd+Opt+I`）打开浏览器开发者工具
4. 在开发者工具顶部标签栏中切换到 **Console（控制台）** 标签
5. Chrome 浏览器出于安全机制考虑，第一次在控制台粘贴代码会提示"请勿粘贴你不理解的代码"，此时需要先在控制台输入 `allow pasting` 并按回车，解除粘贴限制
6. 使用文本编辑器打开 [console-script.js](./console-script.js) 文件，按 `Ctrl+A`（Mac按 `Cmd+A`）全选所有内容，然后复制
7. 回到浏览器控制台，在输入框中粘贴复制的代码，按 **回车** 键运行
8. 页面右上角会出现一个蓝色状态面板，实时显示当前进度、已完成数量和进度条，脚本自动开始处理
9. 等待所有评估处理完成即可，期间不要关闭开发者工具和当前标签页

### 运行界面说明

- 右上角蓝色面板显示当前状态文字
- 实时统计已完成评估数量
- 进度条可视化显示完成进度
- 面板右上角有"停止"按钮，可以随时终止脚本运行

### 停止脚本的方式

- 点击状态面板上的"停止"按钮，等待当前操作完成后自动退出
- 或者直接刷新页面，脚本立即终止
- 或者直接关闭当前标签页

---

## 方案二：油猴脚本（推荐日常使用）

适合需要反复使用，希望使用更方便、界面更友好的场景。一次安装永久生效，后续访问教务系统自动加载。

### 特点

- 一次安装永久使用：脚本安装后，每次访问教务系统评估页面自动加载，不需要重新操作
- 浮动控制按钮：页面右下角有蓝色圆形浮动按钮，随时可以点击开始/停止
- 美观控制面板：Apple 极简风格 UI，纯色无渐变，和教务系统蓝色主题一致
- 配置持久化：脚本配置自动保存在油猴存储中，下次打开保持上次设置
- 菜单快捷操作：通过 Tampermonkey 图标菜单可以快速开始、停止、显示隐藏面板
- 键盘快捷键支持

### 安装步骤

#### 第一步：安装 Tampermonkey 浏览器扩展

Tampermonkey 是最流行的用户脚本管理器，支持所有主流浏览器：

- Chrome/Edge 浏览器：从 [Chrome 网上应用店](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) 搜索安装 Tampermonkey
- Firefox 浏览器：从 [Firefox 附加组件商店](https://addons.mozilla.org/firefox/addon/tampermonkey/) 安装
- Safari 浏览器：在 Mac App Store 搜索 Tampermonkey 安装（付费）

安装完成后，浏览器右上角工具栏会出现 Tampermonkey 图标（一个黑色方块带两个白色圆点）。

#### 第二步：安装本自动评教脚本

1. 点击浏览器右上角的 Tampermonkey 图标，在弹出菜单中选择"添加新脚本"
2. 此时会打开 Tampermonkey 脚本编辑器，编辑器里默认有一些模板代码，把这些内容全部删除清空
3. 使用文本编辑器打开 [tampermonkey-script.user.js](./tampermonkey-script.user.js) 文件，全选复制所有内容
4. 回到 Tampermonkey 编辑器，把复制的代码粘贴进去
5. 按 `Ctrl+S`（Mac 按 `Cmd+S`）保存脚本，或者点击编辑器顶部菜单"文件" → "保存"
6. 点击 Tampermonkey 图标，选择"已安装脚本"（Dashboard），确认"教务系统自动评教助手"脚本的开关是开启状态（绿色）

#### 第三步：开始使用

1. 登录教务系统，导航到教学评估相关页面（列表页或评估页均可）
2. 页面加载完成后，右下角会出现一个蓝色圆形浮动按钮（机器人图标）
3. 点击这个浮动按钮，会滑出控制面板
4. 点击面板上的"开始"按钮，脚本开始自动运行
5. 面板会实时显示当前状态、等待倒计时、已完成数量和进度条
6. 需要停止时点击"停止"按钮即可

### 油猴菜单功能说明

点击浏览器右上角的 Tampermonkey 图标，在弹出的脚本菜单中可以看到以下快捷操作：

- 开始自动评教：直接启动脚本，不需要打开面板点击
- 停止自动评教：立即停止脚本运行
- 显示/隐藏面板：切换控制面板的显示状态

### 卸载脚本

如果不再需要使用，可以完全卸载：
1. 点击 Tampermonkey 图标 → 选择"已安装脚本"进入仪表盘
2. 在脚本列表中找到"教务系统自动评教助手"
3. 点击该行末尾的垃圾桶图标即可删除

---

## 技术实现细节

以下是脚本实现的关键技术点，供二次开发参考。

### 1. 待评估按钮识别逻辑

在评估列表页查找符合以下所有条件的按钮/链接：

```javascript
const allBtns = document.querySelectorAll('button, a.btn');
for (const btn of allBtns) {
    const text = btn.innerText.trim();
    const classes = btn.className || '';
    // 条件1: 按钮文本包含"评估"两个字
    // 条件2: 按钮文本不包含"查看"、"修改"（这些是已评估项目的按钮）
    // 条件3: class包含btn-purple、btn-success或btn-primary
    // 条件4: 元素实际可见（display不是none，visibility不是hidden，有布局尺寸）
    if (text.includes('评估') && !text.includes('查看') && !text.includes('修改') &&
        (classes.includes('btn-purple') || classes.includes('btn-success') || classes.includes('btn-primary'))) {
        // 确认为未评估按钮
    }
}
```

如果你们学校的按钮class名称不同，可以修改这里的class判断条件。

### 2. 单选题自动填写（核心难点解决）

教务系统使用 **Ace Admin** 前端框架，单选框被美化处理：原生的 `<input type="radio">` 元素被 CSS 设置为 `opacity: 0`，视觉上被 `<span class="lbl">` 自定义样式覆盖。这导致常规的元素点击方法（如 Playwright 的 `element.click()`、Selenium 的 `click()`）会报 "element not visible" 超时错误。

**解决方案：直接用 JavaScript 操作 DOM，不依赖元素可见性**

```javascript
// 选中对应value的单选按钮
radio.checked = true;                                    // 直接设置DOM选中状态
radio.dispatchEvent(new Event('click', { bubbles: true })); // 触发click事件（冒泡）
radio.dispatchEvent(new Event('change', { bubbles: true }));// 触发change事件（冒泡）
const label = radio.closest('label');
if (label) label.click();                                // 如果被label包裹，额外点击label更新框架样式
```

这种方式完全绕过浏览器的可见性检查，直接设置状态并触发完整的事件链，保证框架能正确接收到选择变化，更新UI样式。

**评分策略（随机好评，更自然）：**
```javascript
function selectScore(optionCount) {
    const r = Math.random();
    if (r > 0.75) return Math.min(2, optionCount - 1);   // 25%概率选C（较好）
    else if (r > 0.35) return Math.min(1, optionCount - 1); // 40%概率选B（好）
    else return 0;                                        // 35%概率选A（很好）
}
```
不会全选A或全选E，评分分布A:B:C约为 35%:40%:25%，更像真实用户的评分习惯，避免被检测为机器操作。

### 3. 主观评价填写逻辑

- 内置 10 条无空格好评文案（教务系统文本框校验不允许空格字符）
- 每次评估随机选择一条，避免所有课程评价一模一样
- 使用 JavaScript 直接设置 textarea 的 value，并触发 input 和 change 事件，保证框架接收到输入变化：

```javascript
textarea.value = comment;
textarea.dispatchEvent(new Event('input', { bubbles: true }));
textarea.dispatchEvent(new Event('change', { bubbles: true }));
```

默认评价文案均为无空格的正面评价，你可以在代码的 `CONFIG.comments` 数组中添加自己的评价内容，注意不要加空格。

### 4. 2分钟倒计时等待（不绕过）

**重要：后端有服务端时间校验，无法绕过**

后端服务器在用户进入评估页面时就记录了服务器端时间戳，提交时会校验距离进入时间是否满2分钟。前端强行修改 `flag = true`、`nM = 0`、`nS = 0` 等变量都没用，提交时后端还是会拒绝，返回 `notEnoughTime` 或"非法提交"错误。这是经过实际测试验证的结论。

因此最终方案是**真实等待倒计时自然结束**：

```javascript
function waitForTimer() {
    return new Promise((resolve) => {
        const startTime = Date.now();
        let lastPrintTime = 0;
        let lastRemain = null;

        const checkTimer = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;

            // 读取页面上的倒计时显示和flag变量
            const mEl = document.getElementById('RemainM');
            const sEl = document.getElementById('RemainS');
            const min = mEl ? parseInt(mEl.textContent) : 0;
            const sec = sEl ? parseInt(sEl.textContent) : 0;
            const f = (typeof flag !== 'undefined') ? flag : false;

            // 等待成功条件：flag为true，且倒计时显示0分0秒
            if (f === true && min === 0 && sec === 0) {
                clearInterval(checkTimer);
                resolve(true); // 倒计时结束，可以提交
                return;
            }

            // 每10秒打印一次剩余时间，避免控制台刷屏
            const currentRemain = `${min}分${sec}秒`;
            if (currentRemain !== lastRemain || (Date.now() - lastPrintTime) > 10000) {
                console.log(`[AutoEval] 等待中... 剩余 ${currentRemain} (已等待 ${Math.floor(elapsed)}秒)`);
                lastRemain = currentRemain;
                lastPrintTime = Date.now();
            }

            // 每20秒轻微滚动页面，模拟人类活动
            if (Math.floor(elapsed) % 20 === 0 && Math.floor(elapsed) > 0) {
                window.scrollTo({
                    top: window.scrollY + (Math.random() > 0.5 ? 100 : -50),
                    behavior: 'smooth'
                });
            }
        }, 1000); // 每秒检查一次
    });
}
```

等待期间控制台输出示例：
```
[AutoEval] 等待中... 剩余 1分48秒 (已等待 12秒)
[AutoEval] 等待中... 剩余 1分38秒 (已等待 22秒)
[AutoEval] 等待中... 剩余 1分28秒 (已等待 32秒)
...
[AutoEval] 倒计时结束，准备提交
```

最大等待时间设置为210秒，超过这个时间也会尝试提交作为兜底。

### 5. AJAX 原生提交（解决"非法提交"错误）

不调用页面原有的 `toEvaluation()` 函数（避免不可控的副作用），而是直接使用 jQuery 发送和原网站完全一致的 POST 请求，保证请求参数、格式和手动提交没有区别：

```javascript
$.ajax({
    cache: true,
    type: 'POST',
    async: true,
    url: '/student/teachingEvaluation/teachingEvaluation/assessment',
    data: $(form).serialize(),  // 使用jQuery serialize()序列化表单，自动包含所有字段和tokenValue
    success: function(data) {
        // 关键修复：每次提交（无论成功失败），服务器都会返回新的CSRF token
        // 必须更新隐藏字段中的token，下次提交才能成功，否则一直报"非法提交"
        if (data.token) {
            const tokenInput = document.getElementById('tokenValue');
            if (tokenInput) tokenInput.value = data.token;
        }

        // 根据服务器返回的result字段判断结果
        if (data.result && data.result.indexOf('/') !== -1) {
            // 返回跳转URL，提交成功
        } else if (data.result === 'success') {
            // 提交成功
        } else if (data.result === 'notEnoughTime') {
            // 时间未到，继续等待
        } else if (data.result === 'error') {
            // 非法提交，更新token后重试
        } else if (data.result === 'Less_than_specified_fraction') {
            // 总分过低，需要重新评分
        }
    }
});
```

**关键修复点：** 每次提交（无论成功还是失败），服务器响应中都会返回一个新的 CSRF token，必须把这个新 token 更新到表单的 `#tokenValue` 隐藏输入框中，下一次提交才能成功。如果一直使用旧 token，服务器会拒绝请求，持续返回"保存失败,非法提交"错误。

提交过程中还会同步更新提交按钮状态：点击后禁用按钮显示"正在提交..."，完成后恢复按钮文本和可用状态，和真实用户操作一致。

### 6. 弹窗自动确认处理

教务系统使用 layer 弹窗组件和自定义 urp.alert，提交时会弹出确认框：

```javascript
// Hook layer.confirm，自动点击"是/确认"按钮
layer.confirm = function(msg, opts, cb) {
    console.log('[AutoEval] 自动确认弹窗:', msg);
    if (typeof cb === 'function') {
        setTimeout(() => cb(true), 200); // 延迟200ms模拟人类反应，再点击确认
    }
    return 0;
};

// Hook urp.alert，捕获系统提示消息，判断提交结果
urp.alert = function(msg) {
    console.log('[AutoEval] 系统提示:', msg);
    window.__lastAlertMsg = msg;
    setTimeout(() => {
        if (msg.includes('保存成功')) {
            window.__submitSuccess = true;
        } else if (msg.includes('失败') || msg.includes('未到') || msg.includes('错误')) {
            window.__submitError = msg;
        }
    }, 50);
};
```

自动确认"你确认你的评价是真实、客观的吗？"等提交确认弹窗，不需要手动点击。

### 7. 返回列表页循环处理逻辑

提交成功（或失败重试多次仍失败）后，无论当前页面跳转到哪里，都主动导航回评估列表页，然后重新查找待评估按钮，继续处理下一门课程：

```javascript
async function returnToListPage() {
    const listUrl = '/student/teachingEvaluation/evaluation/index';
    // 最多重试3次导航
    for (let i = 0; i < 3; i++) {
        window.location.href = listUrl;
        await sleep(3000);
        // 检查列表是否加载完成（有评估按钮或已查看按钮）
        const buttons = getUnevaluatedButtons();
        const viewBtns = document.querySelectorAll('button.btn-info');
        if (buttons.length > 0 || viewBtns.length > 0) {
            return true;
        }
    }
    // 3次失败后强制跳转
    window.location.href = listUrl;
    await sleep(3000);
    return true;
}
```

确保处理完一门课程后一定能回到列表，不会卡在某个页面导致循环终止。

### 8. 防止重复运行机制

使用全局变量标记脚本运行状态，避免用户多次粘贴代码导致多个实例同时运行冲突：

```javascript
if (window.__autoEvalRunning) {
    console.log('自动评教已在运行中，请勿重复启动');
    return;
}
window.__autoEvalRunning = true;
```

停止时会重置这个标记，下次可以重新启动。

---

## 常见问题

### Q: 控制台粘贴代码没反应？
Chrome 浏览器出于安全考虑，第一次在控制台粘贴代码需要先输入 `allow pasting` 并按回车，然后才能正常粘贴运行代码。这是 Chrome 的安全机制，防止用户被诱导粘贴恶意代码。

### Q: 这个脚本能在其他学校教务系统用吗？
本脚本针对 **URP 教务系统**（基于 Ace Admin 框架的教学评估模块）开发。如果你们学校也是 URP 系统，页面URL路径类似（`/student/teachingEvaluation/...`），HTML结构一致（表单name是StDaForm，按钮class是btn-purple等），那么大概率可以直接使用。如果结构不同，需要修改代码中的选择器（按钮class、字段name等）适配。

### Q: 为什么不绕过2分钟直接提交？
因为后端服务器记录了用户进入页面的时间戳，必须等够2分钟后端才接受提交，前端修改任何JavaScript变量都无法影响后端的时间校验。强行提交只会返回 `notEnoughTime` 或"非法提交"错误，浪费时间。真实等待2分钟是100%可靠的方案。

### Q: 使用这个脚本会被学校检测到吗？
脚本从以下方面模拟真实用户操作：
- 所有 DOM 事件（click/change/input）都正常冒泡触发，和真实点击一致
- 请求头、表单数据序列化方式和手动提交完全相同
- 等待期间每20秒随机滚动页面，模拟人类活动
- 评分不是全选A，而是随机分布A/B/C，更符合真实评分习惯
- CSRF token每次更新，和正常提交流程一致
- 提交按钮状态变化（禁用→提交中→恢复）也和手动操作一致

一般情况下不会被检测到，但请合理使用。教学评估是改进教学质量的重要反馈渠道，建议认真对待。
