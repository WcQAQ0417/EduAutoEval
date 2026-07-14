# JavaScript 版本说明（浏览器控制台 + 油猴脚本）

本目录包含两个纯 JavaScript 实现的方案，无需安装 Python 环境，直接在浏览器中运行。

---

## 📄 文件说明

| 文件 | 方案 |
|------|------|
| [console-script.js](./console-script.js) | 方案一：浏览器控制台脚本（零安装） |
| [tampermonkey-script.user.js](./tampermonkey-script.user.js) | 方案二：油猴脚本（推荐） |

---

## 🚀 方案一：浏览器控制台脚本（零安装）

### 特点
- ✅ **零安装**：不需要任何扩展或软件
- ✅ **即用即走**：刷新页面脚本就消失，不留痕迹
- ❌ 关闭页面或刷新后需要重新粘贴

### 使用步骤

1. 打开浏览器，登录教务系统
2. 导航到「教学评估」列表页面
3. 按 `F12`（Mac 按 `Cmd+Opt+I`）打开开发者工具
4. 切换到 **Console（控制台）** 标签
5. 如果浏览器提示"不要粘贴你不理解的代码"，输入 `allow pasting` 并回车（Chrome安全机制）
6. 打开 [console-script.js](./console-script.js)，全选复制全部内容
7. 粘贴到控制台输入框，按 **回车** 运行

### 运行界面
- 页面右上角会出现蓝色状态面板
- 实时显示当前状态、已完成数量、进度条
- 右上角有「停止」按钮可以随时终止

### 停止脚本
- 点击面板上的「停止」按钮，或者
- 刷新页面

---

## 🚀 方案二：油猴脚本（推荐日常使用）

### 特点
- ✅ **一次安装永久使用**：下次访问自动加载
- ✅ **浮动按钮**：右下角 🤖 机器人按钮，随时可以开始/停止
- ✅ **美观面板**：Apple风格UI，无渐变色
- ✅ **配置持久化**：油猴存储配置
- ✅ **快捷键/菜单**：油猴菜单支持快速操作

### 安装步骤

#### 第一步：安装 Tampermonkey 扩展

根据你的浏览器选择安装：
- **Chrome/Edge**：[Chrome网上应用店](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**：[Firefox附加组件](https://addons.mozilla.org/firefox/addon/tampermonkey/)
- **Safari**：App Store 搜索 Tampermonkey

安装后浏览器右上角会出现 Tampermonkey 图标。

#### 第二步：安装脚本

1. 点击 Tampermonkey 图标 → 选择「**添加新脚本**」
2. 删除编辑器里的默认模板内容（全部清空）
3. 打开 [tampermonkey-script.user.js](./tampermonkey-script.user.js)，全选复制全部内容
4. 粘贴到编辑器中
5. 按 `Ctrl+S`（Mac `Cmd+S`）保存，或者点击「文件」→「保存」
6. 确认脚本已启用：点击 Tampermonkey 图标 → 「已安装脚本」中能看到「教务系统自动评教助手」已开启

#### 第三步：使用

1. 登录教务系统，进入教学评估页面
2. 页面右下角会出现一个蓝色圆形 **🤖** 浮动按钮
3. 点击按钮打开控制面板
4. 点击「**开始**」按钮即可自动开始

### 油猴菜单功能
点击 Tampermonkey 图标，在脚本菜单中可以看到：
- 🤖 开始自动评教
- ⏹ 停止自动评教
- 📋 显示/隐藏面板

### 卸载
点击 Tampermonkey 图标 → 「已安装脚本」→ 点击垃圾桶图标删除即可。

---

## 🔧 技术实现细节

### 1. 待评估按钮识别

在列表页查找符合以下条件的按钮：
```javascript
const text = btn.innerText.trim();
// 文本包含"评估"，但不包含"查看"、"修改"
// className 包含 btn-purple / btn-success / btn-primary
// 元素可见（display !== 'none'，visibility !== 'hidden'）
```

### 2. 单选题自动填写（核心难点解决）

教务系统使用 **Ace Admin** 框架，单选框被美化，原生 `<input type="radio">` 被 CSS 隐藏（`opacity: 0` 或被 `<span class="lbl">` 覆盖），导致 Playwright/常规 click() 报 "element not visible" 错误。

**解决方案：直接用JS操作DOM**
```javascript
radio.checked = true;                                    // 设置选中状态
radio.dispatchEvent(new Event('click', { bubbles: true })); // 触发click事件
radio.dispatchEvent(new Event('change', { bubbles: true }));// 触发change事件
radio.closest('label')?.click();                         // 额外点击label确保样式更新
```
这种方式**完全不要求元素可见**，直接设置状态并模拟事件链。

评分策略（随机好评策略）：
```javascript
function selectScore(optionCount) {
    const r = Math.random();
    if (r > 0.75) return 2;   // 25%概率选C
    else if (r > 0.35) return 1; // 40%概率选B
    else return 0;             // 35%概率选A
}
```
不会全选A/E，评分分布更自然。

### 3. 主观评价填写

- 内置10条**无空格好评**（教务系统不允许空格字符）
- 每次随机选一条
- 使用JS直接设置value并触发input/change事件
```javascript
textarea.value = comment;
textarea.dispatchEvent(new Event('input', { bubbles: true }));
textarea.dispatchEvent(new Event('change', { bubbles: true }));
```

### 4. 2分钟倒计时等待（不绕过）

**⚠️ 重要：后端有服务端时间校验**，记录了你进入页面的时间，前端强行改 `flag = true` 没用，提交时后端还是会拒绝，返回 `notEnoughTime` 错误。

所以改为**真实等待**：
```javascript
function waitForTimer() {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const checkTimer = setInterval(() => {
            const m = document.getElementById('RemainM'); // 分
            const s = document.getElementById('RemainS'); // 秒
            const min = m ? parseInt(m.textContent) : 0;
            const sec = s ? parseInt(s.textContent) : 0;
            const f = (typeof flag !== 'undefined') ? flag : false;
            
            // 等待条件：flag为true 且 0分0秒
            if (f === true && min === 0 && sec === 0) {
                clearInterval(checkTimer);
                resolve(true); // 倒计时结束，可以提交了
            }
            
            // 每10秒打印一次进度
            // 每20秒轻微滚动页面模拟人类活动
        }, 1000);
    });
}
```

等待期间控制台输出示例：
```
[AutoEval] ⏳ 等待中... 剩余 1分48秒 (已等待 12秒)
[AutoEval] ⏳ 等待中... 剩余 1分38秒 (已等待 22秒)
```

### 5. AJAX 原生提交（解决"非法提交"）

不调用页面的 `toEvaluation()` 函数，而是直接用 jQuery 发送和原网站完全一致的 POST 请求：
```javascript
$.ajax({
    type: 'POST',
    url: '/student/teachingEvaluation/teachingEvaluation/assessment',
    data: $(form).serialize(),  // 序列化表单，包含所有字段和tokenValue
    success: function(data) {
        // 重点：每次返回后自动更新token！
        if (data.token) {
            document.getElementById('tokenValue').value = data.token;
        }
        // 根据data.result判断结果：success/notEnoughTime/error/Less_than_specified_fraction
    }
});
```

**关键修复**：每次提交失败（不管什么原因），服务器都会返回一个**新的token**，必须更新表单里的 `tokenValue`，下一次提交才能成功。如果一直用旧token，就会一直返回"非法提交"。

### 6. 弹窗自动确认

教务系统使用 layer 弹出确认框：
```javascript
// Hook layer.confirm，自动点击"是"
layer.confirm = function(msg, opts, cb) {
    if (typeof cb === 'function') setTimeout(() => cb(true), 200);
    return 0;
};

// Hook urp.alert，捕获返回结果
urp.alert = function(msg) {
    // 根据msg内容判断成功/失败
    if (msg.includes('保存成功')) window.__submitSuccess = true;
    if (msg.includes('失败') || msg.includes('未到')) window.__submitError = msg;
};
```

### 7. 返回列表页循环处理

提交成功（或失败）后，主动导航回列表页：
```javascript
async function returnToListPage() {
    window.location.href = '/student/teachingEvaluation/evaluation/index';
    await sleep(3000);
    // 等待列表加载，检查有无待评估按钮
}
```
回到列表页后，重新查找待评估按钮，进入下一个循环，直到没有待评估项目。

### 8. 防止重复运行

使用全局变量标记：
```javascript
if (window.__autoEvalRunning) {
    console.log('已在运行中');
    return;
}
window.__autoEvalRunning = true;
```

---

## ❓ 常见问题

### Q: 控制台粘贴代码没反应？
Chrome 出于安全考虑，第一次粘贴需要先输入 `allow pasting` 并回车，然后再粘贴代码。

### Q: 脚本能在其他学校教务系统用吗？
本脚本针对**URP教务系统**（基于Ace Admin框架的教学评估模块）开发。如果你们学校也是URP系统，URL路径类似（`/student/teachingEvaluation/...`），大概率可以直接用，否则需要修改选择器。

### Q: 为什么不绕过2分钟直接提交？
因为后端服务器记录了进入页面的时间戳，必须等够2分钟后端才接受提交，前端改什么都没用，强行提交会返回 `notEnoughTime` 或 `非法提交`。真实等待2分钟是100%可靠的方案。

### Q: 会被检测到吗？
脚本：
- 所有事件（click/change/input）都正常触发
- 请求头/表单数据和手动提交完全一致
- 等待期间有随机滚动模拟人类活动
- 评分不是全选A，而是随机分布A/B/C
- token每次更新，和正常提交流程一致

一般不会被检测到，但请合理使用。
