# Python + Playwright 自动评教脚本

基于 Playwright 浏览器自动化框架的独立程序，一键启动脚本自动安装所有依赖，打开浏览器后你只需要手动登录即可，剩下的全自动完成。

---

## ✨ 特点

- ✅ **一键启动**：`start.sh` / `start.bat` 自动处理环境，不需要手动装Python/依赖
- ✅ **uv 包管理**：使用最新的 uv 管理依赖，速度比 pip 快 10-100 倍
- ✅ **国内镜像源**：已配置清华源，国内用户下载依赖速度快
- ✅ **自带浏览器**：Playwright 自动安装 Chromium，不需要系统有Chrome
- ✅ **有头模式**：默认打开可视化浏览器，可以看到操作过程，方便监控
- ✅ **实时日志**：终端显示详细进度、倒计时剩余时间、错误信息
- ✅ **错误恢复**：某个评估处理失败会自动返回列表继续下一个，不会卡住
- ✅ **手动登录**：启动后自动打开浏览器，你手动登录即可，不需要输入密码更安全

---

## 📦 文件说明

| 文件 | 说明 |
|------|------|
| [auto_evaluation.py](./auto_evaluation.py) | 主程序源码 |
| [pyproject.toml](./pyproject.toml) | uv 项目配置 + 依赖声明 + 清华源配置 |
| [start.sh](./start.sh) | Mac/Linux 一键启动脚本 |
| [start.bat](./start.bat) | Windows 一键启动脚本 |
| [requirements.txt](./requirements.txt) | pip 兼容的依赖列表（可选，不推荐用） |

---

## 🚀 快速开始

### Mac / Linux 用户

1. 打开终端，进入本目录：
   ```bash
   cd /path/to/python-implementation
   ```

2. 直接运行一键启动脚本：
   ```bash
   bash start.sh
   ```

   脚本会自动做以下事情：
   - 检查并安装 uv（如果没装）
   - 用 uv sync 同步依赖（自动从清华源下载）
   - 安装 Playwright 的 Chromium 浏览器
   - 启动自动评教程序

3. 浏览器自动打开后，**手动登录教务系统**
4. 登录后导航到教学评估列表页，或者脚本会自动跳转
5. 脚本开始自动运行，终端会显示进度日志

### Windows 用户

1. 双击 `start.bat` 文件
2. 等待自动安装环境，然后浏览器会自动打开
3. 手动登录教务系统即可

---

## 🔧 手动运行（开发者）

如果你熟悉 Python，可以不用一键脚本，手动操作：

### 1. 安装 uv（如果没有）

```bash
# Mac/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

安装后重启终端，或者执行：
```bash
source $HOME/.local/bin/env  # Mac/Linux
```

### 2. 安装依赖和浏览器

```bash
cd python-implementation
uv sync
uv run playwright install chromium
```

### 3. 运行程序

```bash
uv run auto-eval
# 或者
uv run python auto_evaluation.py
```

---

## ⚙️ 配置说明

可以修改 [auto_evaluation.py](./auto_evaluation.py) 开头的 `CONFIG` 字典调整配置：

```python
CONFIG = {
    "base_url": "https://你的教务系统地址",  # 改成你们学校的地址
    "headless": False,                      # True=后台静默运行，False=显示浏览器窗口
    "score_strategy": "mixed",              # 评分策略：mixed/good/random
    "wait_after_fill": 2,                   # 填完表单后等待几秒开始等倒计时
    "submit_delay_seconds": 1,              # 提交前的延迟
    "max_wait_for_submit_seconds": 180,     # 最大等待提交时间（秒）
    "submit_retry_count": 5,                # 提交失败重试次数
    "comments": [...]                       # 主观评价列表，可以自己加
}
```

### 评分策略说明

| 策略 | 说明 |
|------|------|
| `mixed` | **推荐**：随机好评，35%A、40%B、25%C，评分分布更真实 |
| `good` | 全部选A（最好） |
| `random` | 完全随机选，可能会有差评，不推荐 |

### 主观评价修改

默认内置了10条无空格好评，可以修改 `CONFIG["comments"]` 数组自己添加：
```python
"comments": [
    "老师讲课认真负责收获很大",
    "你的自定义评价1",
    "你的自定义评价2",
]
```
**注意：不要加空格**，教务系统的文本框不允许输入空格。

---

## 📊 日志说明

程序运行时终端会打印彩色日志：

```
[20:01:23] ℹ️ 检测到 8 个待评估项目
[20:01:25] ℹ️ 进入评估: XXX老师 - 高等数学
[20:01:27] ℹ️ 表单加载完成，检测到 40 个单选按钮
[20:01:27] ℹ️ 正在填写问卷...
[20:01:28] ✅ 单选题填写完成: 40/40
[20:01:28] ℹ️ 填写主观评价...
[20:01:32] ============================================================
[20:01:32] 📋 问卷填写完成，等待2分钟倒计时结束后自动提交
[20:01:32]    （后端服务器校验时间，无法绕过，请耐心等待）
[20:01:32] ============================================================
[20:01:32] ⏳ 开始等待倒计时结束（必须等待2分钟，后端有时间校验）...
[20:01:42]    剩余 1分50秒 (已等待 10秒)
[20:01:52]    剩余 1分40秒 (已等待 20秒)
...
[20:03:25] ✅ 倒计时结束！flag=true，准备提交
[20:03:28] ℹ️ 提交尝试 1/5...
[20:03:28] ✅ 提交成功！
[20:03:28] ✅ 提交成功！已完成 1 个评估
[20:03:31] 🔙 正在返回评估列表页...
[20:03:34] ℹ️ 已返回评估列表页
```

| 图标 | 含义 |
|------|------|
| ℹ️ | 普通信息 |
| ✅ | 成功 |
| ⚠️ | 警告/重试 |
| ❌ | 错误 |
| ⏳ | 等待中 |
| 🚀 | 开始操作 |
| 🎉 | 全部完成 |

---

## 🔧 技术实现细节

### 1. 架构设计

```
AutoEvaluationBot 类
├── run()                    # 主入口
├── start_browser()          # 启动Playwright浏览器
├── main_loop()              # 主循环
│   ├── get_unevaluated_buttons()  # 查找待评估按钮
│   ├── click_evaluation_button()  # 点击进入评估
│   ├── process_single_evaluation() # 处理单个评估
│   │   ├── fill_form()            # 填写表单
│   │   ├── wait_for_timer_natural() # 等待2分钟倒计时
│   │   ├── do_submit()            # 提交
│   │   └── hook_and_submit_ajax() # AJAX原生提交
│   └── return_to_list_page()     # 返回列表页
└── wait_for_form()          # 等待表单加载
```

### 2. 页面元素选择器

根据URP教务系统Ace Admin框架的HTML结构：

| 元素 | 选择器 |
|------|--------|
| 待评估按钮 | `button.btn-purple, button.btn-success, button.btn-primary`，文本包含"评估"且不含"查看/修改" |
| 表单 | `form[name="StDaForm"]` |
| 单选按钮 | `input[type="radio"]`（按name分组） |
| 主观评价框 | `textarea[name="zgpj"]` |
| 提交按钮 | `#buttonSubmit` |
| 倒计时显示 | `#RemainM`（分）、`#RemainS`（秒） |
| CSRF Token | `#tokenValue` |
| 列表页URL | `/student/teachingEvaluation/evaluation/index` |
| 提交接口 | `POST /student/teachingEvaluation/teachingEvaluation/assessment` |

### 3. 单选框填写（解决"element not visible"）

Ace Admin 框架美化单选框后，原生 `<input>` 被隐藏，不能用 Playwright 的 `element.click()`（会报超时）。

**解决方案：使用 page.evaluate 直接在页面内执行JS**
```javascript
const radio = document.querySelector(`input[type="radio"][name="${name}"][value="${val}"]`);
radio.checked = true;
radio.dispatchEvent(new Event('click', { bubbles: true }));
radio.dispatchEvent(new Event('change', { bubbles: true }));
const label = radio.closest('label');
if (label) label.click();
```
这种方式完全绕过可见性检查，直接设置DOM状态并触发事件。

### 4. 2分钟等待机制

后端有服务端时间校验，记录进入页面的时间戳，必须等够2分钟。脚本每秒检查：
```python
remain_info = await self.page.evaluate("""
    () => {
        const m = document.getElementById('RemainM');
        const s = document.getElementById('RemainS');
        const f = typeof flag !== 'undefined' ? flag : false;
        return { flag: f, min: parseInt(m.textContent), sec: parseInt(s.textContent) };
    }
""")
# 等待条件：flag === true 且 min === 0 且 sec === 0
```

等待期间的优化：
- 每10秒打印一次剩余时间（不刷屏）
- 每20秒调用 `simulate_human_activity()` 轻微滚动页面，模拟人类活动
- 最大等待时间设为210秒，超时也尝试提交

### 5. AJAX 提交 + Token 更新

不点击按钮或调用页面的 `toEvaluation()`，而是直接在页面上下文里执行 jQuery AJAX 请求，和原代码逻辑完全一致：

```python
result = await self.page.evaluate("""
    () => {
        return new Promise((resolve) => {
            const formData = $(form).serialize();
            $.ajax({
                type: 'POST',
                url: '/student/teachingEvaluation/teachingEvaluation/assessment',
                data: formData,
                success: function(data) {
                    // 关键：每次返回后更新token！
                    if (data.token) {
                        document.getElementById('tokenValue').value = data.token;
                    }
                    resolve({ status: data.result, ... });
                }
            });
        });
    }
""")
```

**关键修复**：每次提交（无论成功失败）服务器都会返回新的 `data.token`，必须更新 `#tokenValue` 隐藏输入框，否则下次提交会返回"非法提交"错误。

### 6. 弹窗自动处理

Hook 了两个弹窗函数：
- `layer.confirm()`：自动点击确认（"你确认你的评价是真实客观的吗？"）
- `urp.alert()`：捕获提示信息，判断提交成功/失败

```javascript
layer.confirm = function(msg, opts, cb) {
    if (typeof cb === 'function') setTimeout(() => cb(true), 200);
    return 0;
};
```

### 7. 返回列表页的可靠实现

提交成功后，不管页面有没有自动跳转，都主动 `page.goto()` 导航回列表页，并等待列表加载：
```python
async def return_to_list_page(self):
    target_url = self.config["base_url"] + "/student/teachingEvaluation/evaluation/index";
    for attempt in range(3):
        await self.page.goto(target_url, wait_until="domcontentloaded");
        await asyncio.sleep(2);
        buttons = await self.get_unevaluated_buttons();
        if buttons or len(buttons) == 0 and self.completed > 0:
            return True  # 列表加载完成
```
确保处理完一门课后一定能回到列表，继续找下一门。

### 8. 国内源配置

在 [pyproject.toml](./pyproject.toml) 中配置了清华源：
```toml
[tool.uv]
index-url = "https://pypi.tuna.tsinghua.edu.cn/simple"
trusted-hosts = ["pypi.tuna.tsinghua.edu.cn"]
```
`start.sh` 和 `start.bat` 也额外设置了环境变量 `UV_INDEX_URL` 双保险。

---

## 🐛 排障指南

| 问题 | 可能原因 | 解决方法 |
|------|----------|----------|
| `uv: command not found` | uv 没装成功 | 重启终端再试，或者手动安装 uv |
| Playwright 安装 Chromium 慢 | 网络问题 | 设置 Playwright 镜像：`export PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright` |
| 点击按钮没反应 | 按钮选择器不对 | 检查你们学校按钮的 class 名称，可能是 btn-primary 而不是 btn-purple |
| 提交一直返回"非法提交" | token 没更新/时间没到 | 已经修复：自动更新token，等足2分钟再提交 |
| "element not visible" 超时 | 单选框被CSS隐藏 | 已修复：使用JS直接设置checked，不依赖点击 |
| 提交成功后不继续下一个 | 没返回列表页 | 已修复：提交后主动goto列表页 |
| 浏览器打开但不自动跳转 | base_url不对 | 修改CONFIG里的base_url为你们学校教务系统地址 |

---

## ❓ 常见问题

### Q: 和浏览器控制台/油猴脚本版本有什么区别？
Python版本是独立程序，功能更稳定，不依赖浏览器保持打开标签页，有一键启动脚本，方便打包分享给不懂技术的同学使用。JS版本不需要装任何东西，更轻量。

### Q: 为什么默认是有头模式（能看到浏览器窗口）？
方便你看到操作过程，如果有问题可以及时发现。如果想后台静默运行，把 `CONFIG["headless"]` 改成 `True`。

### Q: 可以自动输入账号密码吗？
**故意没有做这个功能**，因为密码属于敏感信息，不建议写在配置文件里。启动后你手动登录一次即可，更安全。

### Q: 为什么必须等2分钟，能不能快一点？
后端服务器记录了你进入页面的时间，必须等够2分钟服务器才接受提交，前端做任何操作都绕不过。这就是为什么早期版本尝试绕过失败的原因。老老实实等2分钟是100%可靠的方案。

### Q: 运行时我可以用浏览器做别的事情吗？
可以，但是不要最小化Playwright打开的那个浏览器窗口，也不要切换到其他用户profile。你可以在系统里开另一个Chrome窗口用。

---

## 📝 手动pip安装（不推荐，建议用uv）

如果你不想用uv，也可以用传统pip：
```bash
cd python-implementation
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
# Windows: venv\Scripts\activate
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
playwright install chromium
python auto_evaluation.py
```
