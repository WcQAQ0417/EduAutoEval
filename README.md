# EduAutoEval - 教务系统自动评教助手

自动填写URP教务系统教学评估问卷，等待2分钟服务器校验倒计时后自动提交，完成一门课程后自动返回列表页继续处理下一门，直到所有评估完成。

## 项目概述

本项目针对基于Ace Admin框架的URP高校教务系统，提供了三种不同技术方案的自动评教脚本，经过实际测试验证，解决了以下常见问题：

- Ace Admin框架美化单选框导致原生input元素不可见，常规点击方式失败
- 后端服务端时间校验，前端强行修改flag变量无法绕过2分钟等待
- 提交后CSRF token更新不及时导致"非法提交"错误
- 提交成功后未正确返回列表页导致无法继续处理下一门
- 主观评价输入包含空格被系统校验拒绝

## 适配系统

本脚本适配以下特征的教务系统：

- URP综合教务系统（青果软件/正方现代教学管理信息系统）
- URL路径包含 `/student/teachingEvaluation/`
- 使用Ace Admin前端框架
- 使用layer弹窗组件和urp.alert提示
- 表单name为`StDaForm`，提交按钮id为`buttonSubmit`
- 倒计时元素id为`RemainM`（分钟）和`RemainS`（秒）
- CSRF token隐藏字段id为`tokenValue`
- 主观评价textarea name为`zgpj`
- 提交接口为 `POST /student/teachingEvaluation/teachingEvaluation/assessment`

如果你们学校教务系统结构不同，可能需要修改对应选择器。

## 重要说明

1. **必须等待2分钟**：后端服务器记录了进入评估页面的时间戳，前端任何修改都无法绕过，必须真实等待倒计时结束（flag为true且0分0秒）后提交才能成功。本脚本不尝试绕过，100%可靠。
2. **等待时间提示**：等待期间每10秒在控制台/面板输出一次剩余时间，请耐心等待。
3. **评分策略**：默认使用随机好评策略（35%概率选A、40%概率选B、25%概率选C），不会全选A/E，评分分布更真实自然。
4. **主观评价无空格**：所有预设评价文案均不含空格字符，教务系统文本框不允许输入空格，避免校验失败。
5. **手动登录**：所有方案都不自动输入账号密码，启动后需要你手动登录教务系统，更安全。
6. **弹窗自动确认**：自动处理"你确认你的评价是真实、客观的吗？"等确认弹窗，无需手动点击。

## 三种方案对比

| 方案 | 难度等级 | 安装要求 | 主要特点 | 适用场景 | 推荐指数 |
|------|----------|----------|----------|----------|----------|
| 浏览器控制台脚本 | 最简单 | 无任何安装 | F12打开控制台粘贴代码即可运行，刷新即消失 | 临时使用一次，不想安装任何软件/扩展 | 临时使用 |
| 油猴脚本（Tampermonkey） | 简单 | 安装Tampermonkey浏览器扩展 | 右下角浮动控制按钮，美观面板，配置持久化，一次安装永久使用 | 日常重复使用，推荐大多数同学 | 推荐 |
| Python + Playwright | 中等 | Python环境 + uv包管理 | 独立GUI程序，一键启动脚本自动安装依赖，自带浏览器，可后台静默运行 | 分享给不懂技术的同学，需要独立程序 | 分享首选 |

## 目录结构

```
EduAutoEval/
├── README.md                           本说明文档
├── .gitignore                          Git忽略配置
├── js-scripts/                         JavaScript方案目录
│   ├── README.md                       JS版本详细使用说明
│   ├── console-script.js               方案一：浏览器控制台脚本
│   └── tampermonkey-script.user.js     方案二：油猴脚本
├── python-implementation/              Python方案目录
│   ├── README.md                       Python版本详细使用说明
│   ├── auto_evaluation.py              主程序源码
│   ├── pyproject.toml                  uv项目配置（清华源）
│   ├── requirements.txt                pip兼容依赖列表
│   ├── .python-version                 Python版本锁定（3.11）
│   ├── start.sh                        Mac/Linux一键启动脚本
│   └── start.bat                       Windows一键启动脚本
├── 学生评估问卷列表.html               列表页HTML参考
├── 学生评估问卷列表_files/             列表页静态资源参考
├── 问卷评估.html                       评估填写页HTML参考
├── 方案一-浏览器控制台脚本.md          早期方案文档（可忽略）
├── 方案二-油猴脚本Tampermonkey.md      早期方案文档（可忽略）
├── 方案三-Python自动化脚本.md          早期方案文档（可忽略）
└── 方案对比与推荐.md                   早期方案文档（可忽略）
```

注：带"早期方案文档"的md文件为开发过程中的设计草稿，使用请以`js-scripts/`和`python-implementation/`目录下的最新代码和README为准。

---

## 快速开始

### 方案一：浏览器控制台脚本（零安装）

适合只想用一次，不想安装任何东西的场景。

**使用步骤：**

1. 打开Chrome/Edge/Firefox浏览器，登录你的教务系统
2. 导航进入"教学评估"列表页面，能看到所有待评估课程
3. 按键盘 `F12`（Mac系统按 `Cmd+Opt+I`）打开开发者工具
4. 在开发者工具中切换到 **Console（控制台）** 标签页
5. Chrome浏览器出于安全考虑，第一次粘贴代码需要先输入 `allow pasting` 并回车
6. 用文本编辑器打开 [console-script.js](./js-scripts/console-script.js)，全选（Ctrl+A）复制全部内容
7. 回到浏览器控制台，粘贴代码，按 **回车** 键运行
8. 页面右上角会出现蓝色状态面板，显示当前进度，脚本自动开始处理
9. 等待处理完成即可，期间不要关闭开发者工具和当前标签页

**停止方式：**
- 点击状态面板上的"停止"按钮
- 或者直接刷新页面/关闭标签页

详细技术说明见 [js-scripts/README.md](./js-scripts/README.md)

---

### 方案二：油猴脚本（推荐日常使用）

适合需要反复使用，希望使用更方便的场景。

**第一步：安装 Tampermonkey 扩展**

根据你的浏览器选择对应版本安装：
- Chrome/Edge浏览器：从 [Chrome网上应用店](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) 安装
- Firefox浏览器：从 [Firefox附加组件商店](https://addons.mozilla.org/firefox/addon/tampermonkey/) 安装
- Safari浏览器：在App Store搜索Tampermonkey安装

安装完成后，浏览器右上角工具栏会出现Tampermonkey图标。

**第二步：安装本脚本**

1. 点击浏览器右上角的Tampermonkey图标，在弹出菜单中选择"添加新脚本"
2. 此时会打开脚本编辑器，删除里面的所有默认模板内容（清空）
3. 用文本编辑器打开 [tampermonkey-script.user.js](./js-scripts/tampermonkey-script.user.js)，全选复制全部内容
4. 粘贴到Tampermonkey编辑器中
5. 按 `Ctrl+S`（Mac按 `Cmd+S`）保存脚本，或者点击编辑器菜单"文件"→"保存"
6. 点击Tampermonkey图标，进入"已安装脚本"页面，确认"教务系统自动评教助手"已启用（开关为开启状态）

**第三步：使用**

1. 登录教务系统，进入教学评估相关页面
2. 页面加载完成后，右下角会出现一个蓝色圆形浮动按钮（机器人图标）
3. 点击浮动按钮打开控制面板
4. 点击面板上的"开始"按钮，脚本自动开始运行
5. 可以点击"停止"按钮随时终止

**其他说明：**
- 点击Tampermonkey图标，在脚本菜单中可以快速开始/停止/显示隐藏面板
- 配置会自动保存在油猴存储中
- 卸载方式：Tampermonkey仪表盘→找到脚本→点击删除图标

详细技术说明见 [js-scripts/README.md](./js-scripts/README.md)

---

### 方案三：Python脚本（适合分享）

适合分享给不懂技术的同学，或者需要独立程序运行的场景。

**Mac/Linux 系统：**

1. 打开终端（Terminal）
2. 进入 `python-implementation` 目录：
   ```bash
   cd /path/to/EduAutoEval/python-implementation
   ```
3. 直接运行一键启动脚本：
   ```bash
   bash start.sh
   ```
4. 脚本会自动完成以下操作：
   - 检查系统是否安装uv，没有则自动安装
   - 使用uv sync同步项目依赖（自动从清华大学镜像源下载，国内速度快）
   - 自动安装Playwright自带的Chromium浏览器
   - 启动自动评教程序
5. 程序启动后会自动打开Chromium浏览器
6. 在打开的浏览器中**手动登录**你的教务系统
7. 登录后导航到教学评估列表页，或者脚本会自动跳转
8. 脚本开始自动运行，终端窗口会显示实时进度日志

**Windows 系统：**

1. 打开 `python-implementation` 文件夹
2. 直接双击 `start.bat` 文件即可
3. 会弹出命令行窗口自动安装环境并启动程序
4. 后续步骤同上，在打开的浏览器中手动登录即可

**手动运行（适合开发者）：**

如果你熟悉Python开发，也可以不使用一键脚本，手动操作：
```bash
# 安装uv（如果没有）
curl -LsSf https://astral.sh/uv/install.sh | sh   # Mac/Linux
# Windows PowerShell:
# powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# 安装依赖和浏览器
cd python-implementation
uv sync
uv run playwright install chromium

# 运行程序
uv run auto-eval
```

详细配置说明、参数调整、技术实现见 [python-implementation/README.md](./python-implementation/README.md)

---

## 核心工作流程

```
                     评估列表页
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [未评估课程1]  [未评估课程2]  [已查看课程]  [已评估课程]    │
│        │                                                     │
└────────┼────────────────────────────────────────────────────┘
         │ 1. 查找文本包含"评估"，class为btn-purple/btn-success的按钮
         │ 2. 点击进入评估填写页
         ▼
┌─────────────────────────────────────────────────────────────┐
│                        问卷填写页                            │
│                                                             │
│  1. 等待表单完全加载（检测单选按钮数量>5，textarea存在）      │
│  2. 按name分组遍历所有单选题                                 │
│     - 使用JavaScript直接设置radio.checked = true             │
│     - 触发click和change事件，保证框架状态更新                │
│     - 如果有label包裹，额外点击label更新样式                 │
│  3. 填写主观评价                                             │
│     - 从预设无空格好评列表中随机选择一条                     │
│     - JS设置textarea值，触发input/change事件                │
│  4. 等待2分钟倒计时                                          │
│     - 每秒检查RemainM/RemainS文本和flag变量                  │
│     - 每10秒输出一次剩余时间                                 │
│     - 每20秒轻微滚动页面模拟人类活动                         │
│     - 等待条件：flag === true 且 剩余0分0秒                  │
│  5. 倒计时结束后提交                                         │
│     - 使用jQuery $.ajax发送与原网站完全一致的POST请求         │
│     - $(form).serialize()序列化所有表单字段                  │
│     - 提交后自动用服务器返回的新token更新tokenValue隐藏字段  │
│     - Hook layer.confirm自动确认提交弹窗                     │
│     - Hook urp.alert捕获提交结果提示                         │
│  6. 最多重试5次，如果返回notEnoughTime继续等待               │
│                                                             │
└────────┬────────────────────────────────────────────────────┘
         │ 提交成功
         ▼
┌─────────────────────────────────────────────────────────────┐
│  主动导航回评估列表页，等待列表加载完成                       │
│  重新查找下一个未评估按钮                                    │
│  重复上述流程，直到没有未评估项目                             │
│  弹出完成提示                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 关键技术细节

### 1. 单选框填写问题解决

教务系统使用Ace Admin框架，原生`<input type="radio">`被CSS设置为`opacity: 0`或被`<span class="lbl">`覆盖，导致常规的元素点击方式（Playwright click()/Selenium click()）报"element not visible"超时错误。

本项目的解决方案是不依赖元素可见性，直接在页面上下文执行JavaScript设置DOM状态并触发完整事件链：
```javascript
radio.checked = true;
radio.dispatchEvent(new Event('click', { bubbles: true }));
radio.dispatchEvent(new Event('change', { bubbles: true }));
const label = radio.closest('label');
if (label) label.click();
```

### 2. 2分钟时间校验问题

**问题：** 早期版本尝试在前端设置`flag = true`、`nM = 0`、`nS = 0`、替换getRTime函数等方式绕过倒计时，但提交仍然返回"非法提交"或"notEnoughTime"错误。

**原因：** 后端服务器在用户进入评估页面时记录了服务器端时间戳，提交时校验距离进入时间是否满2分钟，前端修改任何变量都无法影响后端校验。

**最终方案：** 放弃绕过，真实等待倒计时自然结束，每秒检查倒计时显示和flag状态，等0分0秒且flag=true后再提交，100%成功。等待期间有模拟人类活动（随机滚动），避免被检测为非活跃。

### 3. "非法提交"错误解决

**问题：** 提交时返回`{result: "error", token: "xxx"}`，提示"保存失败,非法提交"。

**原因：**
1. 时间未到2分钟，后端拒绝
2. 每次提交（无论成功失败）服务器都会返回一个新的CSRF token，如果继续使用旧token提交就会被拒绝

**解决方案：**
1. 等待真实2分钟倒计时结束再提交
2. 在AJAX success回调中，每次都用`data.token`更新`#tokenValue`隐藏字段的值，确保下一次提交使用最新token
3. 完全复制页面原有提交流程，使用相同的序列化方式和请求头，保证请求与手动提交无差异

### 4. 提交后循环继续处理

**问题：** 早期版本提交成功后停留在当前页面或跳转后没有重新查找待评估按钮，导致处理完一个就退出。

**解决方案：** 无论提交成功还是失败，处理完一门课程后**主动调用page.goto()/window.location.href**导航回列表页URL，等待列表加载完成后重新查找未评估按钮，确保能继续处理下一门。如果导航失败有3次重试机制。

### 5. 国内源配置

为了方便国内用户安装依赖，在两处配置了清华大学镜像源：
- `pyproject.toml`中`[tool.uv]`配置index-url为清华pypi源
- `start.sh`和`start.bat`启动脚本设置了`UV_INDEX_URL`环境变量
- Playwright下载浏览器如果慢可以设置`PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright`环境变量

---

## 已知问题与排障指南

| 问题现象 | 可能原因 | 解决方案 |
|----------|----------|----------|
| 点击/选择单选框超时，提示element not visible | Ace Admin样式隐藏原生input元素 | 本项目已修复，使用JS直接设置checked，无需手动处理 |
| 提交返回"保存失败,非法提交" | 提交时token过期，或者时间未到2分钟 | 本项目已修复，自动更新token + 真实等待2分钟 |
| 提交成功后脚本退出，不继续处理下一门 | 没有正确返回列表页 | 本项目已修复，提交后主动导航回列表页 |
| 控制台粘贴代码没反应 | Chrome安全机制限制 | 先在控制台输入`allow pasting`回车，再粘贴代码 |
| uv命令找不到（command not found） | uv安装后未生效，或者没安装成功 | 重启终端，或者手动执行uv安装命令 |
| Playwright下载Chromium很慢 | 网络问题，默认从国外下载 | 设置环境变量`PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright`后再安装 |
| 找不到待评估按钮 | 学校教务系统按钮class名称不同 | 检查按钮的class，修改代码中btn-purple/btn-success/btn-primary为实际class |
| Python版本提示找不到包 | Python版本不兼容 | 项目指定Python 3.11，uv会自动安装对应版本 |
| 油猴脚本不加载 | 匹配URL不对 | 修改油猴脚本头部的@match匹配规则，加入你们学校的域名 |
| 提交后提示"评教总分过低，请重新评教" | 评分策略选了太多低分 | 修改评分策略为`good`（全选A）或者保证随机时不会选太多低分选项 |

---

## 常见问题FAQ

**Q: 这个脚本只能用于这一个学校吗？其他学校URP系统能用吗？**
A: 脚本针对标准URP教务系统（教学评估模块路径为`/student/teachingEvaluation/`）开发，如果你们学校也是URP系统，HTML结构一致就可以直接使用。如果结构不同，需要修改按钮选择器、字段名称等对应配置。

**Q: 使用脚本会被学校检测到吗？会有什么风险吗？**
A: 脚本模拟正常用户操作：所有DOM事件正常触发，请求参数和手动提交完全一致，等待时间真实，评分分布自然，token每次更新，请求频率正常。一般情况下不会被检测到。但请合理使用，建议认真对待教学评估，本工具仅用于减少重复机械操作。

**Q: 为什么一定要等2分钟？能不能快进？**
A: 2分钟是后端服务器的强制校验，服务器记录了你进入页面的时间，必须等够2分钟才接受提交，前端没有任何办法绕过。强行提交只会返回错误，浪费时间。真实等待是唯一100%可靠的方案。

**Q: 为什么主观评价不能加空格？我想写自定义评价怎么办？**
A: 部分教务系统的zgpj文本框有输入校验，不允许输入空格字符，如果包含空格提交会失败。你可以修改代码中`CONFIG.comments`数组，添加自己的无空格评价内容。

**Q: 运行脚本的时候我可以用浏览器做别的事情吗？**
A: 如果是JS版本（控制台/油猴），不要关闭运行脚本的标签页，可以在其他标签页浏览。如果是Python+Playwright版本，可以使用系统其他软件，但不要最小化Playwright打开的那个浏览器窗口，你可以额外打开一个Chrome窗口正常使用。

**Q: 脚本会记录或上传我的账号密码吗？**
A: 不会。所有代码都是开源可见的，没有任何网络上报逻辑，账号密码你手动在浏览器登录，脚本不读取不存储密码信息。

**Q: 我可以修改评分策略吗？想全部打满分或者随机差评？**
A: 可以。修改对应代码中的评分函数：
- JS版本：修改`selectScore()`函数的返回值逻辑
- Python版本：修改`CONFIG["score_strategy"]`为`good`（全A）、`mixed`（随机好评，默认）或`random`（完全随机）
不建议使用完全随机，可能会有太多差评，甚至触发总分过低校验。

---

## 更新日志

### v2.0 (当前版本)
- 修复单选框点击超时问题，改用JS直接操作DOM
- 放弃绕过2分钟尝试，改为真实等待服务器校验
- 修复"非法提交"错误，每次提交自动更新CSRF token
- 修复提交后不继续循环问题，主动返回列表页
- 新增油猴脚本浮动面板UI
- 新增Python版本uv管理和一键启动脚本，配置清华源
- 编写完整详细的README文档

---

## 免责声明

本项目仅供学习交流浏览器自动化技术使用，请勿用于商业用途。使用本脚本产生的一切后果由使用者自行承担。教学评估是教学质量改进的重要反馈渠道，建议同学们认真对待每一份评估，客观真实地给出评价，帮助老师改进教学质量。作者不对因使用本脚本造成的任何问题负责。
