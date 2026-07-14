import asyncio
import json
import os
import random
import sys
import time
from datetime import datetime
from pathlib import Path

try:
    from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
except ImportError:
    print("错误: 未安装 playwright，请先执行:")
    print("  pip install playwright")
    print("  playwright install chromium")
    sys.exit(1)

CONFIG_FILE = Path(__file__).parent / "config.json"

DEFAULT_CONFIG = {
    "base_url": "https://jws.qgxy.cn",
    "headless": False,
    "slow_mo": 30,
    "score_strategy": "mixed",
    "submit_delay_seconds": 3,
    "wait_after_fill_seconds": 5,
    "max_wait_for_submit_seconds": 180,
    "comments": [
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
    ]
}


def load_config():
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                return {**DEFAULT_CONFIG, **saved}
        except Exception:
            pass
    return DEFAULT_CONFIG.copy()


def save_config(config):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)


def log_msg(msg, level="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    prefix = {"INFO": "ℹ️", "SUCCESS": "✅", "WARN": "⚠️", "ERROR": "❌", "WAIT": "⏳"}.get(level, "")
    print(f"[{timestamp}] {prefix} {msg}")


class AutoEvaluator:
    def __init__(self, config):
        self.config = config
        self.browser = None
        self.context = None
        self.page = None
        self.playwright = None
        self.completed = 0
        self.running = False
        self.stop_requested = False
        self.bypass_success = False
        self.current_course_info = ""

    async def init_browser(self):
        log_msg("正在启动浏览器...")
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=self.config["headless"],
            slow_mo=self.config["slow_mo"]
        )
        self.context = await self.browser.new_context(
            viewport={"width": 1366, "height": 900},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        )
        self.page = await self.context.new_page()
        self.page.set_default_timeout(10000)
        log_msg("浏览器启动完成，请在浏览器中登录教务系统", "SUCCESS")

    async def wait_for_login(self):
        log_msg("等待登录... 请在浏览器中手动登录教务系统")
        eval_url = self.config["base_url"] + "/student/teachingEvaluation/evaluation/index"

        for _ in range(300):
            if self.stop_requested:
                return False
            try:
                current_url = self.page.url
                if "teachingEvaluation/evaluation/index" in current_url:
                    log_msg("检测到已进入评估列表页", "SUCCESS")
                    return True
                if "login" not in current_url and "jws.qgxy.cn" in current_url:
                    try:
                        await self.page.goto(eval_url, wait_until="domcontentloaded")
                        await asyncio.sleep(2)
                        if "teachingEvaluation/evaluation/index" in self.page.url:
                            return True
                    except Exception:
                        pass
            except Exception:
                pass
            await asyncio.sleep(1)
        return False

    async def get_unevaluated_buttons(self):
        buttons = []
        try:
            all_btns = await self.page.query_selector_all("button")
            for btn in all_btns:
                try:
                    text = (await btn.inner_text()).strip()
                    classes = await btn.get_attribute("class") or ""
                    if ("评估" in text and "查看" not in text and "修改" not in text
                            and ("btn-purple" in classes or "btn-success" in classes or "btn-primary" in classes)):
                        if await btn.is_visible():
                            buttons.append(btn)
                except Exception:
                    continue
        except Exception as e:
            log_msg(f"获取评估列表出错: {e}", "WARN")
        return buttons

    async def wait_for_form(self, timeout=30):
        for _ in range(timeout * 3):
            if self.stop_requested:
                return False
            try:
                form = await self.page.query_selector('form[name="StDaForm"]')
                submit_btn = await self.page.query_selector("#buttonSubmit")
                radio_count = await self.page.evaluate("() => document.querySelectorAll('input[type=\"radio\"]').length")
                textarea = await self.page.query_selector('textarea[name="zgpj"]')
                
                if form and submit_btn and await submit_btn.is_visible() and radio_count > 5 and textarea:
                    await asyncio.sleep(1)
                    log_msg(f"表单加载完成，检测到 {radio_count} 个单选按钮")
                    return True
            except Exception:
                pass
            await asyncio.sleep(0.3)
        return False

    async def return_to_list_page(self):
        target_url = self.config["base_url"] + "/student/teachingEvaluation/evaluation/index"
        log_msg("正在返回评估列表页...")
        
        for attempt in range(3):
            if self.stop_requested:
                return False
            try:
                await self.page.goto(target_url, wait_until="domcontentloaded")
                await asyncio.sleep(2)
                
                buttons = await self.get_unevaluated_buttons()
                view_btns = await self.page.query_selector_all("button.btn-info")
                if buttons or view_btns or len(buttons) == 0 and self.completed > 0:
                    log_msg("已返回评估列表页")
                    return True
            except Exception as e:
                log_msg(f"返回列表页失败(第{attempt+1}次): {e}", "WARN")
                await asyncio.sleep(2)
        
        try:
            await self.page.goto(target_url, wait_until="networkidle")
            await asyncio.sleep(2)
        except Exception:
            pass
        return True

    async def get_current_course_info(self):
        try:
            values = await self.page.query_selector_all(".profile-info-value")
            if len(values) >= 2:
                teacher = (await values[0].inner_text()).strip()
                course = (await values[1].inner_text()).strip()
                return f"{teacher} - {course}"
        except Exception:
            pass
        return "未知课程"

    def select_score_index(self, option_count):
        strategy = self.config["score_strategy"]
        if strategy == "good":
            return 0 if random.random() > 0.2 else 1
        elif strategy == "random":
            return random.randint(0, min(1, option_count - 1))
        else:
            r = random.random()
            if r > 0.75:
                return 2
            elif r > 0.35:
                return 1
            else:
                return 0

    async def fill_form(self):
        log_msg("正在填写问卷...")

        await self.page.evaluate("window.scrollTo(0, 0)")
        await asyncio.sleep(0.3)

        radio_groups = {}
        all_radios = await self.page.query_selector_all('input[type="radio"]')
        for radio in all_radios:
            try:
                name = await radio.get_attribute("name")
                value = await radio.get_attribute("value")
                if name and value:
                    if name not in radio_groups:
                        radio_groups[name] = []
                    radio_groups[name].append(value)
            except Exception:
                continue

        total = len(radio_groups)
        filled = 0

        for name, values in radio_groups.items():
            if self.stop_requested:
                return False
            idx = self.select_score_index(len(values))
            idx = min(idx, len(values) - 1)
            selected_value = values[idx]

            try:
                result = await self.page.evaluate("""
                    (args) => {
                        const [name, value] = args;
                        const radios = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
                        let clicked = false;
                        for (const r of radios) {
                            if (r.value === value) {
                                r.checked = true;
                                r.dispatchEvent(new Event('click', { bubbles: true }));
                                r.dispatchEvent(new Event('change', { bubbles: true }));
                                const label = r.closest('label');
                                if (label) label.click();
                                clicked = true;
                                break;
                            }
                        }
                        return clicked;
                    }
                """, [name, selected_value])

                if result:
                    filled += 1
                    if filled % 5 == 0:
                        log_msg(f"  已完成 {filled}/{total} 题")
                else:
                    log_msg(f"  第{filled+1}题未找到选项，跳过", "WARN")

                await self.page.evaluate(f"""
                    () => {{
                        const radio = document.querySelector('input[type="radio"][name="{name}"][value="{selected_value}"]');
                        if (radio) {{
                            const rect = radio.getBoundingClientRect();
                            if (rect.top < 0 || rect.bottom > window.innerHeight) {{
                                radio.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
                            }}
                        }}
                    }}
                """)
                await asyncio.sleep(0.08 + random.random() * 0.12)

            except Exception as e:
                log_msg(f"  选择第{filled+1}题失败: {e}", "WARN")

        log_msg(f"单选题填写完成: {filled}/{total}")

        await asyncio.sleep(0.5)
        await self.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await asyncio.sleep(0.3)

        textarea = await self.page.query_selector('textarea[name="zgpj"]')
        if textarea:
            comment = random.choice(self.config["comments"])
            log_msg(f"填写主观评价: {comment[:20]}...")

            try:
                await self.page.evaluate("""
                    (text) => {
                        const ta = document.querySelector('textarea[name="zgpj"]');
                        if (ta) {
                            ta.value = text;
                            ta.dispatchEvent(new Event('input', { bubbles: true }));
                            ta.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }
                """, comment)
            except Exception as e:
                log_msg(f"用JS填写失败，尝试普通输入: {e}", "WARN")
                try:
                    await textarea.click()
                    await textarea.fill(comment)
                except Exception:
                    pass

        await asyncio.sleep(self.config["wait_after_fill_seconds"])
        log_msg("问卷填写完成")
        return True

    async def try_bypass_timer(self):
        log_msg("正在尝试绕过2分钟倒计时...")

        bypass_code = """
        () => {
            let results = {
                flag_set: false,
                nm_ns_set: false,
                dom_updated: false,
                timer_cleared: false,
                getrtime_replaced: false
            };

            try {
                if (typeof flag !== 'undefined') {
                    flag = true;
                    results.flag_set = true;
                }
            } catch(e) {}

            try {
                if (typeof nM !== 'undefined') nM = 0;
                if (typeof nS !== 'undefined') nS = 0;
                results.nm_ns_set = true;
            } catch(e) {}

            try {
                const m = document.getElementById('RemainM');
                const s = document.getElementById('RemainS');
                if (m) m.textContent = '0';
                if (s) s.textContent = '0';
                results.dom_updated = true;
            } catch(e) {}

            try {
                if (typeof getRTime === 'function') {
                    const origGetRTime = getRTime;
                    getRTime = function() {
                        try {
                            if (typeof flag !== 'undefined') flag = true;
                            const m = document.getElementById('RemainM');
                            const s = document.getElementById('RemainS');
                            if (m) m.textContent = '0';
                            if (s) s.textContent = '0';
                        } catch(e) {}
                    };
                    results.getrtime_replaced = true;
                }
            } catch(e) {}

            try {
                const highestTimeoutId = setTimeout(() => {}, 0);
                for (let i = 0; i < highestTimeoutId; i++) {
                    clearTimeout(i);
                }
                results.timer_cleared = true;
            } catch(e) {}

            return results;
        }
        """

        try:
            result = await self.page.evaluate(bypass_code)
            log_msg(f"绕过尝试结果: {result}")
            if result.get("flag_set") or result.get("nm_ns_set"):
                self.bypass_success = True
                log_msg("已设置绕过标志，等待几秒验证...", "SUCCESS")
                await asyncio.sleep(2)

                verify_code = """
                () => {
                    return {
                        flag: typeof flag !== 'undefined' ? flag : null,
                        nM: typeof nM !== 'undefined' ? nM : null,
                        nS: typeof nS !== 'undefined' ? nS : null,
                        remainM: document.getElementById('RemainM')?.textContent,
                        remainS: document.getElementById('RemainS')?.textContent
                    };
                }
                """
                verify = await self.page.evaluate(verify_code)
                log_msg(f"验证状态: flag={verify['flag']}, 剩余={verify['remainM']}分{verify['remainS']}秒")

                if verify["flag"] is True:
                    log_msg("✅ 倒计时绕过成功！可以立即提交", "SUCCESS")
                    return True
                else:
                    log_msg("⚠️ flag未成功设置为true，需要等待倒计时", "WARN")
                    return False
        except Exception as e:
            log_msg(f"绕过执行出错: {e}", "ERROR")
            return False

    async def wait_for_timer_natural(self):
        log_msg("⚠️ 绕过失败，进入保底等待模式（等待2分钟倒计时结束）", "WAIT")
        start_time = time.time()
        max_wait = self.config["max_wait_for_submit_seconds"]

        last_remain = None
        while True:
            if self.stop_requested:
                return False

            elapsed = time.time() - start_time
            if elapsed > max_wait:
                log_msg(f"等待超过{max_wait}秒，尝试强制提交", "WARN")
                return True

            try:
                remain_info = await self.page.evaluate("""
                    () => {
                        const m = document.getElementById('RemainM');
                        const s = document.getElementById('RemainS');
                        const f = typeof flag !== 'undefined' ? flag : false;
                        return {
                            flag: f,
                            min: m ? parseInt(m.textContent) : 0,
                            sec: s ? parseInt(s.textContent) : 0
                        };
                    }
                """)

                if remain_info["flag"] is True or (remain_info["min"] == 0 and remain_info["sec"] == 0):
                    log_msg("✅ 倒计时结束，可以提交！", "SUCCESS")
                    return True

                total_sec = remain_info["min"] * 60 + remain_info["sec"]
                current_remain = f"{remain_info['min']}分{remain_info['sec']}秒"
                if current_remain != last_remain:
                    log_msg(f"⏳ 等待中... 剩余 {current_remain} (已等待 {int(elapsed)}秒)")
                    last_remain = current_remain

            except Exception as e:
                pass

            await asyncio.sleep(1)

    async def hook_and_submit_ajax(self):
        result = await self.page.evaluate("""
            () => {
                return new Promise((resolve) => {
                    window.__submitResult = null;
                    window.__submitDone = false;

                    const form = document.StDaForm;
                    if (!form) {
                        resolve({ status: 'error', error: '未找到表单' });
                        return;
                    }

                    const formData = $(form).serialize();

                    const originalAlert = urp.alert;
                    urp.alert = function(msg) {
                        console.log('[HOOK] urp.alert:', msg);
                        if (msg.includes('保存成功')) {
                            window.__submitResult = { status: 'success', message: msg };
                        } else if (msg.includes('未到') || msg.includes('notEnoughTime')) {
                            window.__submitResult = { status: 'not_enough_time', message: msg };
                        } else if (msg.includes('非法提交')) {
                            window.__submitResult = { status: 'illegal_submit', message: msg };
                        } else if (msg.includes('总分过低')) {
                            window.__submitResult = { status: 'low_score', message: msg };
                        } else {
                            window.__submitResult = { status: 'error', message: msg };
                        }
                        window.__submitDone = true;
                        urp.alert = originalAlert;
                    };

                    const $btn = $('#buttonSubmit');
                    const originalBtnText = $btn.html();
                    $btn.attr('disabled', 'disabled');
                    $btn.html('正在提交...');

                    $.ajax({
                        cache: true,
                        type: 'POST',
                        async: true,
                        url: '/student/teachingEvaluation/teachingEvaluation/assessment',
                        data: formData,
                        error: function(xhr) {
                            window.__submitResult = { status: 'network_error', error: 'HTTP ' + xhr.status };
                            window.__submitDone = true;
                            $btn.removeAttr('disabled');
                            $btn.html(originalBtnText);
                            resolve(window.__submitResult);
                        },
                        success: function(data) {
                            $btn.removeAttr('disabled');
                            $btn.html(originalBtnText);

                            if (data.token) {
                                const tokenInput = document.getElementById('tokenValue');
                                if (tokenInput) {
                                    tokenInput.value = data.token;
                                    console.log('[HOOK] token已更新');
                                }
                            }

                            if (data.result && data.result.indexOf('/') !== -1) {
                                window.__submitResult = { status: 'redirect', message: data.result };
                                window.__submitDone = true;
                                resolve(window.__submitResult);
                                setTimeout(() => { window.location.href = data.result; }, 500);
                            } else if (data.result === 'success') {
                                urp.alert('保存成功');
                            } else if (data.result === 'notEnoughTime') {
                                urp.alert('距离上一次保存未到2分钟');
                            } else if (data.result === 'error') {
                                urp.alert('保存失败,非法提交');
                            } else if (data.result === 'Less_than_specified_fraction') {
                                urp.alert('评教总分过低，请重新评教');
                            } else {
                                urp.alert('保存失败');
                            }
                            if (window.__submitDone && window.__submitResult) {
                                resolve(window.__submitResult);
                            }
                        }
                    });

                    setTimeout(() => {
                        if (!window.__submitDone) {
                            window.__submitResult = { status: 'timeout', error: '请求超时' };
                            window.__submitDone = true;
                            $btn.removeAttr('disabled');
                            $btn.html(originalBtnText);
                            resolve(window.__submitResult);
                        }
                    }, 30000);
                });
            }
        """)
        return result

    async def do_submit(self):
        log_msg("准备提交（使用AJAX原生方式）...")

        await self.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await asyncio.sleep(0.5)

        submit_btn = await self.page.query_selector("#buttonSubmit")
        if not submit_btn:
            log_msg("未找到提交按钮", "ERROR")
            return "ERROR"

        try:
            result = await self.hook_and_submit_ajax()
        except Exception as e:
            log_msg(f"AJAX提交出错: {e}", "ERROR")
            return "ERROR"

        status = result.get("status")
        msg = result.get("message", result.get("error", ""))
        log_msg(f"提交结果: {status} - {msg}")

        if status == "success" or status == "redirect":
            log_msg("提交成功！", "SUCCESS")
            return "SUCCESS"
        elif status == "not_enough_time":
            return "NEED_WAIT"
        elif status == "low_score":
            log_msg(f"评分过低: {msg}", "ERROR")
            return "LOW_SCORE"
        elif status == "illegal_submit" or status == "error" or status == "network_error" or status == "timeout" or status == "flag_not_set":
            log_msg(f"提交失败: {msg}", "ERROR")
            return "ERROR"
        else:
            log_msg(f"未知返回: {result}", "WARN")
            return "ERROR"

    async def simulate_human_activity(self):
        try:
            await self.page.evaluate("""
                () => {
                    const scrollY = window.scrollY + (Math.random() > 0.5 ? 100 : -50);
                    window.scrollTo({ top: Math.max(0, Math.min(scrollY, document.body.scrollHeight)), behavior: 'smooth' });
                }
            """)
        except Exception:
            pass

    async def wait_for_timer_natural(self):
        log_msg("⏳ 开始等待倒计时结束（必须等待2分钟，后端有时间校验）...", "WAIT")
        start_time = time.time()
        max_wait = self.config["max_wait_for_submit_seconds"] + 30
        last_status_time = 0
        last_remain = None

        while True:
            if self.stop_requested:
                return False

            elapsed = time.time() - start_time
            if elapsed > max_wait:
                log_msg(f"等待超过{max_wait}秒，尝试提交", "WARN")
                return True

            try:
                remain_info = await self.page.evaluate("""
                    () => {
                        const m = document.getElementById('RemainM');
                        const s = document.getElementById('RemainS');
                        const f = typeof flag !== 'undefined' ? flag : false;
                        return {
                            flag: f,
                            min: m ? parseInt(m.textContent) : 0,
                            sec: s ? parseInt(s.textContent) : 0
                        };
                    }
                """)

                current_remain = f"{remain_info['min']}分{remain_info['sec']}秒"

                if remain_info["flag"] is True and remain_info["min"] == 0 and remain_info["sec"] == 0:
                    log_msg("✅ 倒计时结束！flag=true，准备提交", "SUCCESS")
                    return True

                if current_remain != last_remain or (time.time() - last_status_time) > 10:
                    log_msg(f"   剩余 {current_remain} (已等待 {int(elapsed)}秒)")
                    last_remain = current_remain
                    last_status_time = time.time()

                if int(elapsed) % 20 == 0 and int(elapsed) > 0:
                    await self.simulate_human_activity()

            except Exception as e:
                pass

            await asyncio.sleep(1)

    async def process_single_evaluation(self):
        log_msg(f"当前课程: {self.current_course_info}")

        if not await self.fill_form():
            return False

        await asyncio.sleep(1)

        log_msg("")
        log_msg("=" * 60)
        log_msg("📋 问卷填写完成，等待2分钟倒计时结束后自动提交")
        log_msg("   （后端服务器校验时间，无法绕过，请耐心等待）")
        log_msg("=" * 60)
        log_msg("")

        await self.wait_for_timer_natural()

        await asyncio.sleep(2)

        max_retries = 5
        for attempt in range(max_retries):
            if self.stop_requested:
                return False

            await asyncio.sleep(1)
            log_msg(f"提交尝试 {attempt+1}/{max_retries}...")

            result = await self.do_submit()

            if result == "SUCCESS":
                self.completed += 1
                log_msg(f"提交成功！已完成 {self.completed} 个评估", "SUCCESS")
                log_msg("等待页面跳转回列表页...")
                target_url = self.config["base_url"] + "/student/teachingEvaluation/evaluation/index"
                for _ in range(10):
                    await asyncio.sleep(1)
                    if "evaluation/index" in self.page.url:
                        break
                await asyncio.sleep(2)
                return True

            elif result == "NEED_WAIT":
                log_msg("服务器提示未到时间，继续等待...", "WAIT")
                await self.wait_for_timer_natural()
                await asyncio.sleep(1)
                continue

            elif result == "LOW_SCORE":
                log_msg("总分过低，请调整评分策略（全选好评试试）", "ERROR")
                return False

            elif result == "ERROR":
                if attempt < max_retries - 1:
                    log_msg(f"提交失败，等待5秒后重试...", "WARN")
                    await asyncio.sleep(5)
                continue

            else:
                await asyncio.sleep(3)
                continue

        log_msg(f"重试{max_retries}次后仍然失败，跳过这门课", "ERROR")
        return False

    async def run(self):
        self.running = True
        self.stop_requested = False
        self.completed = 0

        try:
            await self.init_browser()

            await self.page.goto(self.config["base_url"], wait_until="domcontentloaded")
            await asyncio.sleep(2)

            logged_in = await self.wait_for_login()
            if not logged_in:
                log_msg("登录超时或被取消", "ERROR")
                return

            target_url = self.config["base_url"] + "/student/teachingEvaluation/evaluation/index"
            if "evaluation/index" not in self.page.url:
                await self.page.goto(target_url, wait_until="networkidle")
                await asyncio.sleep(2)

            while not self.stop_requested:
                try:
                    buttons = await self.get_unevaluated_buttons()
                    if not buttons:
                        view_btns = await self.page.query_selector_all("button.btn-info")
                        if self.completed > 0 or len(view_btns) > 0:
                            log_msg("=" * 50)
                            log_msg(f"🎉 全部评估完成！共完成 {self.completed} 个评估", "SUCCESS")
                            log_msg("=" * 50)
                            break
                        else:
                            log_msg("未找到评估按钮，等待页面加载...", "WARN")
                            await asyncio.sleep(2)
                            continue

                    log_msg(f"发现 {len(buttons)} 个待评估项目 (已完成: {self.completed})")

                    first_btn = buttons[0]
                    try:
                        row = await first_btn.evaluate_handle("el => el.closest('tr')")
                        if row:
                            tds = await row.query_selector_all("td")
                            if len(tds) >= 4:
                                teacher = (await tds[2].inner_text()).strip()
                                course = (await tds[3].inner_text()).strip()
                                self.current_course_info = f"{teacher} - {course}"
                    except Exception:
                        self.current_course_info = "未知课程"

                    log_msg(f"进入评估: {self.current_course_info}")
                    try:
                        await first_btn.click()
                    except Exception as e:
                        log_msg(f"点击评估按钮失败: {e}，尝试直接跳转", "WARN")
                        await self.page.goto(target_url, wait_until="domcontentloaded")
                        await asyncio.sleep(2)
                        continue

                    await asyncio.sleep(2)

                    form_ready = await self.wait_for_form()
                    if not form_ready:
                        log_msg("等待表单加载超时，尝试刷新页面", "WARN")
                        await self.page.goto(target_url, wait_until="domcontentloaded")
                        await asyncio.sleep(2)
                        continue

                    success = await self.process_single_evaluation()
                    await self.return_to_list_page()
                    await asyncio.sleep(2)

                except Exception as e:
                    log_msg(f"主循环出错: {e}", "ERROR")
                    import traceback
                    traceback.print_exc()
                    await asyncio.sleep(3)
                    try:
                        await self.page.goto(target_url, wait_until="domcontentloaded")
                        await asyncio.sleep(2)
                    except Exception:
                        pass

        except Exception as e:
            log_msg(f"运行出错: {e}", "ERROR")
            import traceback
            traceback.print_exc()
        finally:
            self.running = False
            if self.browser and not self.config["headless"]:
                log_msg("浏览器保持打开状态，你可以手动关闭。按 Ctrl+C 退出程序。")

    async def stop(self):
        self.stop_requested = True
        log_msg("正在停止...", "WARN")

    async def close(self):
        try:
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
        except Exception:
            pass


async def _async_main():
    config = load_config()
    evaluator = AutoEvaluator(config)

    print("=" * 60)
    print("🤖 教务系统自动评教助手 (Python + Playwright 版本)")
    print("=" * 60)
    print()

    if not config.get("base_url"):
        print("使用默认地址: https://jws.qgxy.cn")
    else:
        print(f"教务系统地址: {config['base_url']}")

    print()
    print("重要说明:")
    print("  1. 脚本会先尝试绕过2分钟倒计时")
    print("  2. 如果绕过失败，会自动等待2分钟倒计时结束（保底机制）")
    print("  3. 等待期间会显示剩余时间")
    print("  4. 浏览器启动后需要你手动登录教务系统")
    print()

    save_config(config)

    try:
        await evaluator.run()
    except KeyboardInterrupt:
        print("\n检测到 Ctrl+C，正在停止...")
        await evaluator.stop()
    finally:
        await evaluator.close()


def main():
    try:
        asyncio.run(_async_main())
    except KeyboardInterrupt:
        print("\n程序已退出")


if __name__ == "__main__":
    main()
