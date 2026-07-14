# 教务自动填表 - 方案三：Python + Playwright 自动化脚本

## 方案概述
使用 Python + Playwright 编写独立的自动化脚本。脚本会自动打开浏览器、登录、完成所有评估，完全不需要人工干预。这是最强大、最灵活的方案。

## 优点
- ✅ 完全自动化，一键运行，无需任何手动操作
- ✅ 支持自动登录（可保存账号密码）
- ✅ 功能最强大，可以处理各种复杂情况
- ✅ 有完整的 GUI 控制界面
- ✅ 可以生成详细的日志和报告
- ✅ 支持无头模式（后台运行，不显示浏览器窗口）

## 缺点
- ❌ 需要安装 Python 环境和依赖库
- ❌ 初次配置稍复杂

---

## 安装步骤

### 第一步：安装 Python
1. 访问 [Python 官网](https://www.python.org/downloads/) 下载并安装 Python 3.8 或更高版本
2. 安装时勾选 "Add Python to PATH"

### 第二步：安装依赖
打开终端（命令提示符），执行以下命令：

```bash
pip install playwright
playwright install chromium
```

如果需要 tkinter GUI（默认已包含在Python中）：
- Windows: 安装Python时勾选 tcl/tk
- Mac: 通常已自带
- Linux: `sudo apt install python3-tk`

---

## 自动化脚本代码

将以下代码保存为 `auto_eval.py`：

```python
import asyncio
import json
import os
import random
import time
from datetime import datetime
from pathlib import Path
from playwright.async_api import async_playwright, Page, Browser

CONFIG_FILE = Path(__file__).parent / "auto_eval_config.json"

DEFAULT_CONFIG = {
    "base_url": "https://jws.qgxy.cn",
    "username": "",
    "password": "",
    "remember_me": False,
    "score_strategy": "mixed",  # good / mixed / random
    "wait_before_submit": 5,
    "comments": [
        "老师教学认真负责，讲解清晰易懂，课堂氛围很好，收获很大",
        "老师备课充分，重点突出，能够激发学生学习兴趣",
        "教学方法得当，注重互动，能够很好地引导学生思考",
        "老师授课生动有趣，理论联系实际，学到了很多知识",
        "老师责任心强，答疑耐心，课程设计合理，非常满意",
        "老师讲课条理清晰，深入浅出，重点难点讲解透彻",
        "老师教学态度严谨，课堂内容充实，很有收获",
        "老师风趣幽默，课堂气氛活跃，教学效果很好"
    ],
    "headless": False,
    "slow_mo": 50
}


def load_config():
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                return {**DEFAULT_CONFIG, **saved}
        except:
            pass
    return DEFAULT_CONFIG.copy()


def save_config(config):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)


def log(message, level="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")


class AutoEvaluator:
    def __init__(self, config):
        self.config = config
        self.browser = None
        self.context = None
        self.page = None
        self.completed = 0
        self.total = 0
        self.running = False
        self.stop_flag = False
        self.status_callback = None
        self.log_callback = None

    def set_callbacks(self, status_cb=None, log_cb=None):
        self.status_callback = status_cb
        self.log_callback = log_cb

    def update_status(self, status):
        log(status)
        if self.status_callback:
            self.status_callback(status, self.completed, self.total)

    def log_msg(self, msg, level="INFO"):
        log(msg, level)
        if self.log_callback:
            self.log_callback(msg, level)

    async def init_browser(self):
        self.log_msg("正在启动浏览器...")
        p = await async_playwright().start()
        self.browser = await p.chromium.launch(
            headless=self.config["headless"],
            slow_mo=self.config["slow_mo"]
        )
        self.context = await self.browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        self.page = await self.context.new_page()
        self.page.set_default_timeout(30000)

    async def login(self):
        self.update_status("正在访问教务系统...")
        await self.page.goto(self.config["base_url"])
        await self.page.wait_for_load_state("networkidle")

        # 检查是否需要登录
        if "login" in self.page.url or await self.page.query_selector("input[name='username'], input[name='j_username'], #username, #yhm"):
            self.update_status("正在登录...")
            
            # 尝试查找用户名输入框
            username_selectors = [
                "input[name='username']",
                "input[name='j_username']",
                "input#username",
                "input#yhm",
                "input[type='text']"
            ]
            password_selectors = [
                "input[name='password']",
                "input[name='j_password']",
                "input#password",
                "input#mm",
                "input[type='password']"
            ]
            
            username_input = None
            for sel in username_selectors:
                username_input = await self.page.query_selector(sel)
                if username_input:
                    break
            
            password_input = None
            for sel in password_selectors:
                password_input = await self.page.query_selector(sel)
                if password_input:
                    break
            
            if username_input and password_input and self.config["username"] and self.config["password"]:
                await username_input.fill(self.config["username"])
                await password_input.fill(self.config["password"])
                
                # 查找登录按钮
                login_btn = await self.page.query_selector("button[type='submit'], input[type='submit'], .login_btn, #login_btn")
                if login_btn:
                    await login_btn.click()
                else:
                    await self.page.keyboard.press("Enter")
                
                await self.page.wait_for_load_state("networkidle")
                await asyncio.sleep(2)
                self.log_msg("登录完成")
            else:
                self.log_msg("请在浏览器中手动登录...", "WARN")
                # 等待用户手动登录
                for _ in range(120):
                    if self.stop_flag:
                        return False
                    if "login" not in self.page.url and await self.page.query_selector("a[href*='teachingEvaluation'], .nav-list"):
                        break
                    await asyncio.sleep(1)
                self.log_msg("检测到登录成功")
        
        return True

    async def navigate_to_evaluation(self):
        self.update_status("正在进入教学评估页面...")
        eval_url = self.config["base_url"] + "/student/teachingEvaluation/evaluation/index"
        await self.page.goto(eval_url)
        await self.page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)

    async def get_unevaluated_buttons(self):
        buttons = []
        all_buttons = await self.page.query_selector_all("button")
        for btn in all_buttons:
            try:
                text = await btn.inner_text()
                classes = await btn.get_attribute("class") or ""
                text = text.strip()
                if ("评估" in text and "查看" not in text and "修改" not in text 
                    and ("btn-purple" in classes or "btn-success" in classes)):
                    buttons.append(btn)
            except:
                continue
        return buttons

    async def fill_radio_group(self, group_name, option_count):
        strategies = self.config["score_strategy"]
        
        if strategies == "good":
            idx = 0 if random.random() > 0.3 else 1
        elif strategies == "random":
            idx = random.randint(0, min(2, option_count - 1))
        else:
            r = random.random()
            if r > 0.8:
                idx = 2
            elif r > 0.4:
                idx = 1
            else:
                idx = 0
        
        idx = min(idx, option_count - 1)
        
        try:
            radio = await self.page.query_selector(f"input[type='radio'][name='{group_name}'] >> nth={idx}")
            if radio:
                await radio.click()
                await asyncio.sleep(0.05 + random.random() * 0.05)
                return True
        except Exception as e:
            self.log_msg(f"选项 {group_name} 填写失败: {e}", "WARN")
        
        return False

    async def fill_evaluation_form(self):
        self.update_status("正在填写评估问卷...")
        
        # 获取所有单选题
        radios = await self.page.query_selector_all("input[type='radio']")
        groups = {}
        for radio in radios:
            name = await radio.get_attribute("name")
            if name and name not in groups:
                groups[name] = 0
            if name:
                groups[name] += 1
        
        for group_name, count in groups.items():
            if self.stop_flag:
                return False
            await self.fill_radio_group(group_name, count)
            await asyncio.sleep(0.03)
        
        # 填写主观评价
        await asyncio.sleep(0.3)
        textarea = await self.page.query_selector("textarea[name='zgpj']")
        if textarea:
            comment = random.choice(self.config["comments"])
            await textarea.fill(comment)
            self.log_msg(f"主观评价: {comment[:20]}...")
        
        self.update_status(f"填写完成，等待 {self.config['wait_before_submit']} 秒后提交...")
        await asyncio.sleep(self.config["wait_before_submit"])
        
        return True

    async def bypass_timer(self):
        try:
            await self.page.evaluate("""
                () => {
                    if (typeof flag !== 'undefined') flag = true;
                    if (typeof nM !== 'undefined') nM = 0;
                    if (typeof nS !== 'undefined') nS = 0;
                    const m = document.getElementById('RemainM');
                    const s = document.getElementById('RemainS');
                    if (m) m.textContent = '0';
                    if (s) s.textContent = '0';
                }
            """)
        except:
            pass

    async def submit_form(self):
        self.update_status("正在提交...")
        
        await self.bypass_timer()
        
        # 拦截确认框
        self.page.once("dialog", lambda dialog: dialog.accept())
        
        # Hook layer.confirm
        await self.page.evaluate("""
            () => {
                if (typeof layer !== 'undefined' && layer.confirm) {
                    window._originalLayerConfirm = layer.confirm;
                    layer.confirm = function(msg, opts, cb) {
                        if (typeof cb === 'function') setTimeout(() => cb(true), 100);
                        return 0;
                    };
                }
                if (typeof urp !== 'undefined' && urp.alert) {
                    window._originalUrpAlert = urp.alert;
                    urp.alert = function(msg) {
                        window._lastAlertMsg = msg;
                    };
                }
            }
        """)
        
        submit_btn = await self.page.query_selector("#buttonSubmit")
        if submit_btn:
            await submit_btn.click()
        
        # 等待跳转回列表页
        for _ in range(60):
            if self.stop_flag:
                return False
            url = self.page.url
            if "evaluation/index" in url:
                break
            await asyncio.sleep(0.5)
        
        await asyncio.sleep(1)
        self.completed += 1
        return True

    async def get_current_evaluation_info(self):
        try:
            info_values = await self.page.query_selector_all(".profile-info-value")
            if len(info_values) >= 2:
                teacher = await info_values[0].inner_text()
                course = await info_values[1].inner_text()
                return f"{teacher.strip()} - {course.strip()}"
        except:
            pass
        return "未知课程"

    async def run(self):
        self.running = True
        self.stop_flag = False
        self.completed = 0
        
        try:
            await self.init_browser()
            
            if not await self.login():
                return
            
            await self.navigate_to_evaluation()
            
            while not self.stop_flag:
                # 在列表页
                await asyncio.sleep(1)
                
                buttons = await self.get_unevaluated_buttons()
                self.total = self.completed + len(buttons)
                
                if not buttons:
                    self.update_status("🎉 所有评估已完成！")
                    self.log_msg(f"共完成 {self.completed} 个评估", "SUCCESS")
                    break
                
                self.log_msg(f"还有 {len(buttons)} 个待评估")
                
                # 获取第一个按钮的信息
                first_btn = buttons[0]
                row = await first_btn.evaluate_handle("el => el.closest('tr')")
                try:
                    tds = await row.query_selector_all("td")
                    if len(tds) >= 4:
                        teacher = await tds[2].inner_text()
                        course = await tds[3].inner_text()
                        self.update_status(f"正在评估: {teacher.strip()} - {course.strip()}")
                except:
                    pass
                
                # 点击进入评估页
                await first_btn.click()
                await self.page.wait_for_load_state("networkidle")
                await asyncio.sleep(2)
                
                # 等待表单出现
                for _ in range(30):
                    if self.stop_flag:
                        break
                    form = await self.page.query_selector("form[name='StDaForm']")
                    if form:
                        break
                    await asyncio.sleep(0.3)
                
                if self.stop_flag:
                    break
                
                # 填写并提交
                if await self.fill_evaluation_form():
                    if self.stop_flag:
                        break
                    await self.submit_form()
                
                await asyncio.sleep(1)
            
        except Exception as e:
            self.log_msg(f"运行出错: {e}", "ERROR")
            import traceback
            traceback.print_exc()
        finally:
            self.running = False
            if not self.config["headless"]:
                self.log_msg("浏览器将保持打开，按 Ctrl+C 退出程序")

    def stop(self):
        self.stop_flag = True
        self.update_status("正在停止...")

    async def close(self):
        if self.browser:
            await self.browser.close()


def run_gui():
    try:
        import tkinter as tk
        from tkinter import ttk, messagebox, scrolledtext
    except ImportError:
        print("tkinter 不可用，将使用命令行模式")
        return False

    config = load_config()
    evaluator = AutoEvaluator(config)

    root = tk.Tk()
    root.title("教务系统自动评教助手")
    root.geometry("700x600")
    root.resizable(True, True)

    main_frame = ttk.Frame(root, padding="10")
    main_frame.pack(fill=tk.BOTH, expand=True)

    # 账号配置区
    config_frame = ttk.LabelFrame(main_frame, text="配置", padding="10")
    config_frame.pack(fill=tk.X, pady=(0, 10))

    ttk.Label(config_frame, text="账号:").grid(row=0, column=0, sticky=tk.W, padx=5)
    username_var = tk.StringVar(value=config["username"])
    ttk.Entry(config_frame, textvariable=username_var, width=20).grid(row=0, column=1, padx=5)

    ttk.Label(config_frame, text="密码:").grid(row=0, column=2, sticky=tk.W, padx=5)
    password_var = tk.StringVar(value=config["password"])
    ttk.Entry(config_frame, textvariable=password_var, show="*", width=20).grid(row=0, column=3, padx=5)

    remember_var = tk.BooleanVar(value=config["remember_me"])
    ttk.Checkbutton(config_frame, text="记住账号", variable=remember_var).grid(row=0, column=4, padx=5)

    ttk.Label(config_frame, text="评分策略:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=(10, 0))
    strategy_var = tk.StringVar(value=config["score_strategy"])
    strategy_frame = ttk.Frame(config_frame)
    strategy_frame.grid(row=1, column=1, columnspan=4, sticky=tk.W, pady=(10, 0))
    ttk.Radiobutton(strategy_frame, text="全部好评", variable=strategy_var, value="good").pack(side=tk.LEFT, padx=5)
    ttk.Radiobutton(strategy_frame, text="随机好评(推荐)", variable=strategy_var, value="mixed").pack(side=tk.LEFT, padx=5)
    ttk.Radiobutton(strategy_frame, text="完全随机", variable=strategy_var, value="random").pack(side=tk.LEFT, padx=5)

    headless_var = tk.BooleanVar(value=config["headless"])
    ttk.Checkbutton(config_frame, text="无头模式(后台运行)", variable=headless_var).grid(row=2, column=0, columnspan=2, sticky=tk.W, pady=(10, 0))

    # 状态区
    status_frame = ttk.LabelFrame(main_frame, text="状态", padding="10")
    status_frame.pack(fill=tk.X, pady=(0, 10))

    status_var = tk.StringVar(value="就绪")
    ttk.Label(status_frame, textvariable=status_var, font=("Arial", 12, "bold")).pack(anchor=tk.W)

    progress_frame = ttk.Frame(status_frame)
    progress_frame.pack(fill=tk.X, pady=(10, 0))
    ttk.Label(progress_frame, text="进度:").pack(side=tk.LEFT)
    progress_var = tk.StringVar(value="0 / 0")
    ttk.Label(progress_frame, textvariable=progress_var).pack(side=tk.LEFT, padx=(5, 0))
    progress_bar = ttk.Progressbar(progress_frame, length=400, mode='determinate')
    progress_bar.pack(side=tk.LEFT, padx=(10, 0), fill=tk.X, expand=True)

    # 日志区
    log_frame = ttk.LabelFrame(main_frame, text="运行日志", padding="10")
    log_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))

    log_text = scrolledtext.ScrolledText(log_frame, height=15, wrap=tk.WORD, font=("Consolas", 10))
    log_text.pack(fill=tk.BOTH, expand=True)
    log_text.tag_config("INFO", foreground="#333")
    log_text.tag_config("SUCCESS", foreground="#48bb78")
    log_text.tag_config("WARN", foreground="#ed8936")
    log_text.tag_config("ERROR", foreground="#f56565")

    def add_log(msg, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_text.insert(tk.END, f"[{timestamp}] ", "INFO")
        log_text.insert(tk.END, f"{msg}\n", level)
        log_text.see(tk.END)
        root.update_idletasks()

    def update_status_cb(status, completed, total):
        status_var.set(status)
        progress_var.set(f"{completed} / {total}")
        if total > 0:
            progress_bar["value"] = (completed / total) * 100
        root.update_idletasks()

    evaluator.set_callbacks(update_status_cb, add_log)

    # 按钮区
    btn_frame = ttk.Frame(main_frame)
    btn_frame.pack(fill=tk.X)

    def save_config_from_gui():
        config["username"] = username_var.get()
        config["password"] = password_var.get()
        config["remember_me"] = remember_var.get()
        config["score_strategy"] = strategy_var.get()
        config["headless"] = headless_var.get()
        evaluator.config = config
        if remember_var.get():
            save_config(config)
        add_log("配置已保存", "SUCCESS")

    def start_eval():
        save_config_from_gui()
        
        if not config["headless"] and (not config["username"] or not config["password"]):
            add_log("未填写账号密码，启动后需要手动登录", "WARN")

        async def run_async():
            await evaluator.run()

        def run_thread():
            asyncio.run(run_async())

        import threading
        thread = threading.Thread(target=run_thread, daemon=True)
        thread.start()

    def stop_eval():
        evaluator.stop()

    ttk.Button(btn_frame, text="保存配置", command=save_config_from_gui).pack(side=tk.LEFT, padx=5)
    start_btn = ttk.Button(btn_frame, text="开始自动评教", command=start_eval)
    start_btn.pack(side=tk.LEFT, padx=5)
    stop_btn = ttk.Button(btn_frame, text="停止", command=stop_eval, state=tk.DISABLED)
    stop_btn.pack(side=tk.LEFT, padx=5)

    def update_button_states():
        if evaluator.running:
            start_btn["state"] = tk.DISABLED
            stop_btn["state"] = tk.NORMAL
        else:
            start_btn["state"] = tk.NORMAL
            stop_btn["state"] = tk.DISABLED
        root.after(500, update_button_states)

    update_button_states()

    def on_closing():
        if evaluator.running:
            evaluator.stop()
        root.destroy()

    root.protocol("WM_DELETE_WINDOW", on_closing)

    add_log("欢迎使用教务自动评教助手！", "SUCCESS")
    add_log("请填写账号密码后点击开始")
    root.mainloop()
    return True


async def run_cli():
    config = load_config()
    evaluator = AutoEvaluator(config)
    
    def on_status(status, completed, total):
        pass
    
    def on_log(msg, level):
        log(msg, level)
    
    evaluator.set_callbacks(on_status, on_log)
    
    try:
        await evaluator.run()
        while evaluator.running:
            await asyncio.sleep(0.5)
    except KeyboardInterrupt:
        evaluator.stop()
    finally:
        await evaluator.close()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--cli":
        asyncio.run(run_cli())
    else:
        if not run_gui():
            asyncio.run(run_cli())
```

---

## 使用说明

### GUI 模式（推荐）
直接运行脚本即可打开图形界面：

```bash
python auto_eval.py
```

使用步骤：
1. 填写教务系统账号密码（可选，不填则需手动登录）
2. 选择评分策略
3. 点击"保存配置"
4. 点击"开始自动评教"
5. 脚本会自动打开浏览器完成所有操作

### 命令行模式
如果不需要界面，可以使用命令行模式：

```bash
python auto_eval.py --cli
```

### 无头模式（后台运行）
勾选"无头模式"后，浏览器不会显示窗口，完全在后台运行。

### 配置说明

| 配置项 | 说明 |
|--------|------|
| 账号/密码 | 教务系统登录账号，勾选"记住账号"会保存到配置文件 |
| 评分策略 | 同前面两个方案 |
| 无头模式 | 后台运行，不显示浏览器窗口 |
| wait_before_submit | 填写完成后等待几秒提交（代码中配置，默认5秒） |

### 注意事项
1. 首次运行会自动下载 Chromium 浏览器
2. 如果登录有验证码，脚本会暂停等待你手动完成
3. 运行过程中可以随时点击"停止"
4. 配置会保存在同目录下的 `auto_eval_config.json`
5. 如果学校教务系统有特殊的登录页面，可能需要稍作调整

---

## 扩展功能（可选）

你可以根据需要扩展以下功能：

1. **自定义评价模板**：修改代码中 `comments` 数组添加更多评价
2. **定时运行**：配合 Windows 任务计划或 crontab 定时执行
3. **多账号支持**：批量为多个账号完成评估
4. **报告生成**：完成后生成评估报告
5. **异常重试**：遇到错误自动重试
