# Python + Playwright 自动评教脚本

基于 Playwright 浏览器自动化框架的独立程序，一键启动脚本自动完成所有环境配置和依赖安装，打开浏览器后你只需要手动登录教务系统，剩下的评教流程全自动完成。

---

## 主要特点

- 一键启动：提供 `start.sh`（Mac/Linux）和 `start.bat`（Windows）脚本，自动处理环境，不需要手动安装Python、配置虚拟环境或安装依赖
- uv包管理：使用新一代 uv 包管理器管理依赖，依赖解析和下载速度比传统 pip 快 10-100 倍
- 国内镜像源：已默认配置清华大学 PyPI 镜像源，国内用户安装依赖速度快
- 自带浏览器：Playwright 自动下载安装独立的 Chromium 浏览器，不需要系统预先安装Chrome或Edge
- 有头模式：默认打开可视化浏览器窗口，可以直观看到操作过程，方便监控和调试
- 实时彩色日志：终端窗口实时打印详细进度、倒计时剩余时间、错误信息和重试提示
- 错误自动恢复：某个评估处理失败或超时，会自动返回列表页继续处理下一个，不会卡住整个流程
- 手动登录安全：程序不存储、不读取、不上传账号密码，启动后你在浏览器中手动登录，安全可靠
- 支持无头模式：配置后可以后台静默运行，不弹出浏览器窗口

---

## 文件说明

| 文件 | 说明 |
|------|------|
| [auto_evaluation.py](./auto_evaluation.py) | 主程序Python源码，包含所有自动化逻辑 |
| [pyproject.toml](./pyproject.toml) | uv 项目配置文件，包含依赖声明、入口点和清华源配置 |
| [start.sh](./start.sh) | Mac / Linux 系统一键启动shell脚本 |
| [start.bat](./start.bat) | Windows 系统一键启动批处理脚本 |
| [requirements.txt](./requirements.txt) | pip 兼容的依赖列表，供不使用uv的用户参考 |
| [.python-version](./.python-version) | 指定Python版本为3.11，uv会自动安装对应版本 |

---

## 快速开始

### Mac / Linux 用户

1. 打开终端（Terminal）应用
2. 使用 cd 命令进入 python-implementation 目录：
   ```bash
   cd /path/to/EduAutoEval/python-implementation
   ```
   把 `/path/to/` 替换为你实际存放项目的路径。

3. 给启动脚本添加执行权限（第一次运行需要）：
   ```bash
   chmod +x start.sh
   ```

4. 直接运行一键启动脚本：
   ```bash
   bash start.sh
   ```

5. 启动脚本会自动完成以下操作：
   - 检查系统是否已经安装 uv，如果没有则自动从官方源下载安装
   - 执行 `uv sync` 同步项目依赖，自动从清华大学镜像源下载，速度快
   - 执行 `uv run playwright install chromium` 安装 Playwright 自带的 Chromium 浏览器
   - 所有依赖安装完成后自动启动自动评教主程序

6. 程序启动后会自动打开一个 Chromium 浏览器窗口
7. 在打开的浏览器中**手动登录**你的教务系统账号
8. 登录后可以导航到教学评估列表页，脚本也会自动尝试跳转
9. 脚本开始自动运行，回到终端窗口可以看到实时的进度日志

### Windows 用户

1. 打开文件资源管理器，进入 `python-implementation` 文件夹
2. 找到 `start.bat` 文件，直接双击运行即可
3. 会弹出一个黑色命令行窗口，自动执行环境安装和依赖同步，耐心等待
4. 安装完成后浏览器会自动打开
5. 在打开的浏览器中手动登录教务系统即可，后续自动完成

---

## 手动运行（适合开发者）

如果你熟悉 Python 开发，或者希望进行二次开发，可以不使用一键脚本，手动执行以下步骤：

### 1. 安装 uv 包管理器

如果系统还没有安装 uv，可以执行以下命令安装：

```bash
# Mac / Linux 系统
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows 系统（PowerShell中执行）
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

安装完成后，**重启终端**让 PATH 环境变量生效，或者在当前终端执行：
```bash
# Mac/Linux
source $HOME/.local/bin/env
```

可以运行 `uv --version` 验证安装是否成功，如果输出版本号说明安装成功。

### 2. 安装项目依赖和浏览器

```bash
# 进入项目目录
cd python-implementation

# 使用uv同步依赖（自动创建虚拟环境，安装所有需要的包）
uv sync

# 安装Playwright的Chromium浏览器
uv run playwright install chromium
```

如果国内用户下载Chromium速度慢，可以先设置镜像源环境变量再安装：
```bash
# Mac/Linux
export PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright

# Windows PowerShell
$env:PLAYWRIGHT_DOWNLOAD_HOST = "https://npmmirror.com/mirrors/playwright"

uv run playwright install chromium
```

### 3. 运行程序

```bash
# 使用配置好的入口点运行
uv run auto-eval

# 或者直接运行Python脚本
uv run python auto_evaluation.py
```

---

## 配置说明

可以修改 [auto_evaluation.py](./auto_evaluation.py) 文件开头的 `CONFIG` 字典调整各种参数配置：

```python
CONFIG = {
    "base_url": "",  # 你们学校教务系统的根地址，例如 "https://jwxt.example.edu.cn"
    "headless": False,  # 是否使用无头模式：True=后台静默运行不弹出窗口，False=显示浏览器窗口
    "score_strategy": "mixed",  # 评分策略：mixed/good/random，详见下方说明
    "wait_after_fill": 2,  # 填写完整个表单后等待几秒再开始等2分钟倒计时，单位秒
    "submit_delay_seconds": 1,  # 倒计时结束后，提交前额外延迟几秒，模拟思考时间，单位秒
    "max_wait_for_submit_seconds": 210,  # 等待提交的最大时间，超过这个时间即使倒计时没结束也尝试提交，单位秒
    "submit_retry_count": 5,  # 提交失败后最多重试多少次
    "comments": [  # 主观评价好评列表，随机选择一条填写，可以自行添加修改
        "老师讲课认真负责重点突出收获很大",
        "课堂内容生动有趣讲解清晰易懂",
        "老师备课充分教学态度认真负责",
        "教学方法很好激发了学习兴趣",
        "老师耐心解答问题课程收获很多",
        "课程内容充实讲解透彻很有帮助",
        "老师教学严谨课堂氛围很好",
        "学到了很多知识感谢老师的教导",
        "老师讲课条理清晰重点明确",
        "课程设计合理教学效果很好"
    ]
}
```

注意：如果 `base_url` 留空，脚本启动后会停留在浏览器新标签页，你手动导航到教务系统即可。填写了 `base_url` 会自动打开对应地址。

### 评分策略说明

| 策略值 | 说明 | 评分分布 |
|--------|------|----------|
| `mixed` | 随机好评（推荐默认） | 35%概率选A（很好），40%概率选B（好），25%概率选C（较好），不会选D/E，评分分布更真实自然 |
| `good` | 全部好评 | 所有题目都选第一个选项（A/很好），满分评价 |
| `random` | 完全随机 | 每个题目完全随机选择选项，可能出现大量差评，可能触发总分过低校验，不推荐使用 |

### 主观评价自定义修改

默认内置了10条无空格好评文案，如果你想使用自己的评价内容，可以修改 `CONFIG["comments"]` 数组，添加或替换成你想要的评价内容。

```python
"comments": [
    "老师讲课认真负责收获很大",
    "你自定义的第一条评价内容",
    "你自定义的第二条评价内容",
]
```

**重要注意：评价内容中不要包含空格字符**，部分教务系统的主观评价文本框有输入校验，不允许输入空格，如果包含空格提交会失败。

---

## 日志输出说明

程序运行时，终端窗口会打印带时间戳的彩色日志，方便你了解当前进度和等待状态：

```
[20:01:23] 检测到 8 个待评估项目
[20:01:25] 进入评估: XXX老师 - 高等数学
[20:01:27] 表单加载完成，检测到 40 个单选按钮
[20:01:27] 正在填写问卷...
[20:01:28] 单选题填写完成: 40/40
[20:01:28] 填写主观评价...
[20:01:32] ============================================================
[20:01:32] 问卷填写完成，等待2分钟倒计时结束后自动提交
[20:01:32] （后端服务器校验时间，无法绕过，请耐心等待）
[20:01:32] ============================================================
[20:01:32] 开始等待倒计时结束（必须等待2分钟，后端有时间校验）...
[20:01:42]    剩余 1分50秒 (已等待 10秒)
[20:01:52]    剩余 1分40秒 (已等待 20秒)
...
[20:03:25] 倒计时结束！准备提交
[20:03:28] 提交尝试 1/5...
[20:03:28] 提交成功！
[20:03:28] 提交成功！已完成 1 个评估
[20:03:31] 正在返回评估列表页...
[20:03:34] 已返回评估列表页
```

| 日志前缀类型 | 含义 |
|--------------|------|
| 普通信息（白色/默认色） | 普通流程信息，报告当前步骤 |
| 成功（绿色） | 操作成功完成，比如填写完成、提交成功 |
| 警告/重试（黄色） | 出现小问题，正在重试，不影响整体流程 |
| 错误（红色） | 操作失败，会自动返回列表继续处理下一个 |
| 等待中（蓝色） | 正在等待2分钟倒计时，显示剩余时间 |
| 全部完成（绿色加粗） | 所有评估都处理完成，程序即将退出 |

---

## 技术实现细节

以下是Python版本的关键架构和技术实现细节，供二次开发参考。

### 1. 整体架构设计

程序采用面向对象设计，核心逻辑封装在 `AutoEvaluationBot` 类中：

```
AutoEvaluationBot 主类
├── run()                          # 主入口，协调所有流程
├── start_browser()                # 启动Playwright，创建浏览器实例和页面
├── main_loop()                    # 主循环，不断查找待评估并处理
│   ├── get_unevaluated_buttons()  # 在列表页查找所有未评估的按钮
│   ├── click_evaluation_button()  # 点击待评估按钮，进入填写页面
│   ├── process_single_evaluation()# 处理单个评估完整流程
│   │   ├── wait_for_form()        # 等待表单加载完成（所有单选按钮出现）
│   │   ├── fill_form()            # 填写所有单选题和主观评价
│   │   ├── wait_for_timer_natural() # 真实等待2分钟倒计时结束
│   │   ├── simulate_human_activity() # 模拟人类滚动页面活动
│   │   ├── hook_alerts()          # Hook弹窗和alert函数
│   │   └── hook_and_submit_ajax() # 使用jQuery AJAX原生提交
│   └── return_to_list_page()      # 提交后主动导航回列表页
└── (辅助工具方法)
    ├── sleep()                    # 异步等待
    ├── log_info/log_success/...   # 彩色日志输出方法
    └── click_button_safe()        # 安全点击按钮，处理超时和重试
```

### 2. 页面元素选择器

根据 URP 教务系统 Ace Admin 框架的 HTML 结构，使用以下选择器定位元素：

| 页面元素 | CSS 选择器 / 定位方式 |
|----------|------------------------|
| 待评估按钮 | `button.btn-purple, button.btn-success, button.btn-primary`，筛选文本包含"评估"且不包含"查看"、"修改"的可见按钮 |
| 评估表单 | `form[name="StDaForm"]` |
| 单选题组 | `input[type="radio"]`，按name属性分组 |
| 主观评价文本框 | `textarea[name="zgpj"]` |
| 提交按钮 | `#buttonSubmit` |
| 分钟倒计时 | `#RemainM` 元素的textContent |
| 秒倒计时 | `#RemainS` 元素的textContent |
| CSRF Token隐藏字段 | `#tokenValue` 隐藏input |
| 评估列表页URL路径 | `/student/teachingEvaluation/evaluation/index` |
| 提交接口URL | `POST /student/teachingEvaluation/teachingEvaluation/assessment` |

如果你们学校教务系统的class名称或字段name不同，需要修改对应选择器适配。

### 3. 单选框填写方案（解决element not visible超时）

Ace Admin 框架会美化单选按钮：原生 `<input type="radio">` 被CSS设置为完全透明（`opacity: 0`），上面覆盖自定义样式的 `<span class="lbl">`，导致 Playwright 原生的 `element.click()` 方法检测元素"不可见"而超时失败。

**解决方案：使用 page.evaluate 在浏览器页面上下文中直接执行JavaScript操作DOM**

```javascript
// 在页面内执行的JS代码
const radio = document.querySelector(`input[type="radio"][name="${name}"][value="${val}"]`);
if (radio) {
    radio.checked = true;
    radio.dispatchEvent(new Event('click', { bubbles: true }));
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    const label = radio.closest('label');
    if (label) label.click(); // 如果被label包裹，额外点击label更新UI样式
}
```

这种方式完全绕过浏览器的元素可见性检查，直接设置DOM选中状态，并触发完整的事件链（click、change冒泡），保证前端框架能正确接收到选择变化，更新UI样式。

### 4. 2分钟倒计时等待机制

后端服务器在用户进入评估页面时记录了服务器端时间戳，提交时必须满足进入时间超过2分钟才会接受，前端无法绕过。脚本采用真实等待策略：

```python
while True:
    # 在页面中读取倒计时状态
    remain_info = await self.page.evaluate("""
        () => {
            const mEl = document.getElementById('RemainM');
            const sEl = document.getElementById('RemainS');
            const f = (typeof flag !== 'undefined') ? flag : false;
            return {
                flag: f,
                min: mEl ? parseInt(mEl.textContent) : 99,
                sec: sEl ? parseInt(sEl.textContent) : 99
            };
        }
    """)

    # 等待成功条件：flag变量为true，且倒计时显示0分0秒
    if remain_info["flag"] is True and remain_info["min"] == 0 and remain_info["sec"] == 0:
        break  # 倒计时结束，可以提交

    # 超时兜底：超过最大等待时间也尝试提交
    if elapsed > self.config["max_wait_for_submit_seconds"]:
        break

    await asyncio.sleep(1)
```

等待期间做了以下优化：
- 每10秒打印一次剩余时间，不会每秒刷屏终端
- 每20秒调用 `simulate_human_activity()` 随机轻微滚动页面，模拟真实用户在阅读页面
- 最大等待时间设置为210秒（3分半），超过这个时间即使倒计时没到0也尝试提交作为兜底

### 5. AJAX 原生提交 + Token 自动更新

不直接点击提交按钮，也不调用页面原有的 `toEvaluation()` 函数（避免不可控的副作用），而是直接在页面上下文中执行 jQuery AJAX 请求，和网站原代码的提交流程完全一致：

```python
result = await self.page.evaluate("""
    async () => {
        return new Promise((resolve) => {
            const form = document.querySelector('form[name="StDaForm"]');
            const formData = $(form).serialize();
            const submitBtn = document.getElementById('buttonSubmit');

            // 更新按钮状态，模拟真实点击
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.value = '正在提交...';
            }

            $.ajax({
                cache: true,
                type: 'POST',
                async: true,
                url: '/student/teachingEvaluation/teachingEvaluation/assessment',
                data: formData,
                success: function(data) {
                    // 关键：每次提交后，服务器会返回新的CSRF token
                    // 必须更新隐藏字段中的token，下次提交才能成功
                    if (data.token) {
                        const tokenInput = document.getElementById('tokenValue');
                        if (tokenInput) tokenInput.value = data.token;
                    }

                    // 恢复按钮状态
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.value = '提交';
                    }

                    resolve({
                        status: data.result,
                        msg: data.msg || ''
                    });
                },
                error: function(xhr, status, err) {
                    resolve({ status: 'network_error', msg: err });
                }
            });
        });
    }
""")
```

**关键修复点：** 每次AJAX请求返回（无论成功还是失败），响应中都会包含一个新的 `data.token`，必须把这个新token更新到表单的 `#tokenValue` 隐藏输入框中，下一次提交才能成功。如果一直使用旧token，服务器会拒绝请求，持续返回"保存失败,非法提交"错误。

### 6. 弹窗自动处理

在进入评估页面后，第一时间Hook两个弹窗函数，避免弹窗阻塞流程：

```javascript
// Hook layer.confirm 确认弹窗，自动点击"是/确认"
layer.confirm = function(msg, opts, cb) {
    window.__lastConfirmMsg = msg;
    if (typeof cb === 'function') {
        setTimeout(() => cb(true), 200); // 延迟200ms模拟人类反应时间
    }
    return 0;
};

// Hook urp.alert 提示框，捕获提示消息判断结果
urp.alert = function(msg) {
    window.__lastAlertMsg = msg;
    setTimeout(() => {
        if (msg.includes('保存成功')) {
            window.__submitSuccess = true;
        } else if (msg.includes('失败') || msg.includes('未到时间') || msg.includes('错误')) {
            window.__submitError = msg;
        }
    }, 50);
};
```

自动处理提交时的确认弹窗："你确认你的评价是真实、客观的吗？是/否"，不需要手动点击。

### 7. 返回列表页的可靠实现

提交成功（或重试多次仍失败）后，无论页面当前跳转到哪里，都主动调用 `page.goto()` 导航回评估列表页URL，确保一定回到列表：

```python
async def return_to_list_page(self):
    target_url = self.config["base_url"].rstrip('/') + '/student/teachingEvaluation/evaluation/index'
    for attempt in range(3):
        try:
            await self.page.goto(target_url, wait_until='domcontentloaded', timeout=15000)
            await self.sleep(2)
            # 验证列表加载完成：能找到评估按钮或者已查看按钮
            try:
                await self.page.wait_for_selector('button.btn-purple, button.btn-success, button.btn-info',
                                                   timeout=10000)
                return True
            except:
                pass
        except Exception as e:
            self.log_warning(f"返回列表页尝试 {attempt+1}/3 失败: {e}")
            await self.sleep(2)
    # 最后兜底强制跳转一次
    await self.page.goto(target_url, wait_until='domcontentloaded', timeout=30000)
    await self.sleep(3)
    return True
```

带有3次重试机制，确保网络波动或加载失败时也能最终回到列表页，继续处理下一门课程。

### 8. 国内源配置说明

为了方便国内用户快速安装依赖，在两处配置了清华大学镜像源：

1. [pyproject.toml](./pyproject.toml) 文件中的 `[tool.uv]` 配置段：
   ```toml
   [tool.uv]
   index-url = "https://pypi.tuna.tsinghua.edu.cn/simple"
   trusted-hosts = ["pypi.tuna.tsinghua.edu.cn"]
   ```

2. [start.sh](./start.sh) 和 [start.bat](./start.bat) 启动脚本开头设置了环境变量，双重保险：
   ```bash
   # Mac/Linux (start.sh)
   export UV_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
   ```
   ```batch
   # Windows (start.bat)
   set UV_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
   ```

如果Playwright下载Chromium浏览器速度慢，可以在运行安装命令前设置Playwright镜像源环境变量：
```bash
# Mac/Linux
export PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright
uv run playwright install chromium
```

---

## 排障指南

| 问题现象 | 可能原因 | 解决方案 |
|----------|----------|----------|
| 启动提示 `uv: command not found` | uv安装后PATH环境变量未生效，或者安装失败 | 关闭当前终端重新打开，或者手动执行uv安装命令，安装后重启终端 |
| Playwright下载Chromium浏览器速度很慢或超时 | 默认从国外服务器下载，网络不好 | 设置环境变量 `PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright` 后重新安装 |
| 找不到待评估按钮，或者点击按钮没反应 | 你们学校教务系统的按钮class名称不是btn-purple/btn-success | 打开浏览器开发者工具查看待评估按钮的实际class，修改代码中对应选择器 |
| 提交一直返回"保存失败,非法提交" | 时间未到2分钟就提交，或者CSRF token没有更新 | 当前版本已修复：自动更新token，并且真实等待2分钟倒计时结束后再提交 |
| 选择单选题报"element not visible"超时错误 | Ace Admin框架隐藏了原生radio input | 当前版本已修复：使用JS直接设置checked属性，不依赖元素可见性，不需要手动处理 |
| 一个课程提交成功后脚本就退出，不继续处理下一个 | 提交成功后没有正确返回列表页 | 当前版本已修复：提交后无论页面是否自动跳转，都主动page.goto导航回列表页，带3次重试 |
| 浏览器打开了但是一片空白，不自动跳转 | CONFIG中的base_url配置不正确或为空 | 修改auto_evaluation.py开头CONFIG里的base_url为你们学校教务系统完整地址（包含https://），或者手动在浏览器导航到评估页面 |
| 提交后提示"评教总分过低，请重新评教" | 评分策略选择了random，选了太多低分选项 | 修改score_strategy配置为'mixed'（随机好评）或者'good'（全部满分），避免选太多低分 |
| 提交后提示"未到评价时间，请稍后再试" | 虽然倒计时显示0分0秒，但后端时间校验还没通过 | 脚本会自动继续等待，每隔几秒重试一次，直到成功为止 |
| 脚本运行中途卡住不动 | 页面加载缓慢或者网络请求超时 | 等待最多30秒会超时自动重试，或者关闭程序重新运行即可 |

---

## 常见问题

**Q: Python版本和浏览器控制台脚本、油猴脚本版本有什么区别？我该选哪个？**
A: Python版本是独立的桌面程序，不依赖浏览器保持标签页打开，一键启动脚本自动处理所有环境，最适合打包分享给不懂技术的同学使用。JS版本（控制台脚本和油猴脚本）不需要安装任何软件或依赖，更轻量，其中油猴脚本一次安装永久使用，适合自己日常使用。如果只是自己用，推荐油猴脚本；如果要分享给同学，推荐Python版本。

**Q: 为什么默认使用有头模式（能看到浏览器窗口）？可以后台运行吗？**
A: 默认打开浏览器窗口方便你查看操作过程，如果出现问题可以及时发现。如果你想后台静默运行，不弹出浏览器窗口，可以修改 `CONFIG["headless"] = True`，这样程序会在后台运行，不影响你做其他事情。

**Q: 脚本可以自动输入账号密码登录吗？**
A: 故意没有实现自动登录功能。因为账号密码属于敏感信息，不建议硬编码在配置文件或代码中。启动程序后你在打开的浏览器中手动登录一次即可，这样更安全，也避免密码泄露风险。

**Q: 为什么必须等2分钟？能不能修改代码快进？**
A: 2分钟等待是后端服务器的强制校验，服务器在你进入页面时记录了服务器时间，提交时校验间隔必须满2分钟，前端做任何修改都无法绕过这个校验。早期版本尝试过各种前端绕过方法（改flag变量、清除定时器、替换倒计时函数等），都无法成功提交。老老实实等待2分钟倒计时自然结束是100%可靠的方案。

**Q: 脚本运行的时候我可以用这个浏览器做别的事情吗？**
A: 可以。但不要最小化 Playwright 打开的那个 Chromium 窗口，不要在该窗口中手动点击导航（会打断自动流程），不要切换到其他用户Profile。你可以在系统中打开另一个Chrome/Edge窗口正常浏览网页，互不影响。

**Q: 运行脚本需要联网吗？对网络环境有要求吗？**
A: 需要联网访问教务系统网站。在校园网环境下使用最稳定，如果在校外需要确保能正常访问教务系统（VPN等）。安装依赖时需要联网下载Python包和浏览器，国内网络已配置清华源，速度较快。

---

## 传统pip安装方式（不推荐，建议使用uv）

如果你不想使用uv，也可以使用传统的pip和venv方式安装：

```bash
# 进入目录
cd python-implementation

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
# Mac/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate.bat

# 使用清华源安装依赖
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 安装Playwright Chromium浏览器
playwright install chromium

# 运行程序
python auto_evaluation.py
```

这种方式需要你自己预先安装好Python 3.10+版本，不如uv一键启动方便。
