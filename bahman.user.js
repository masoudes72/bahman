// ==UserScript==
// @name         Bahman Auto Buyer - Mobile Fix Edition
// @namespace    https://bahman.iranecar.com/
// @version      2025.11.26.MobileFix
// @description  Bahman Motors auto buyer refactored for Mobile (CORS & Token Fix).
// @author       You
// @match        https://bahman.iranecar.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // -------------------------------------------------
    // Static configuration
    // -------------------------------------------------
    const SCRIPT = {
        NAME: 'Bahman Auto Buyer (Mobile)',
        VERSION: '2025.11.26.MobileFix',
        STORAGE_PREFIX: 'bm'
    };

    const API = {
        BASE: 'https://bahmanapi2.iranecar.com/api/v1',
        CAPTCHA: 'https://recaptchag.iranecar.com/api',
        SOLVER: 'https://siapa-bahman.viiona.ir/solve',
        ENDPOINTS: {
            LOGIN: '/identity/login',
            HOME: '/HomeItem/GetHomeItems?GetDataType=0',
            CIRCULATION: '/circulation/getCirculationData',
            REGISTER: '/order/register',
            FILL_CONFIRM: '/fillConfirm/post',
            BANK_CHECK: '/bank/checkResult',
            BRANCH_PROVINCE: '/branch/getCirculationBranchProvinceCity',
            BRANCH_CITY: '/branch/getCirculationBranchCity'
        }
    };

    const PROVINCES = [
        { id: '1', title: 'آذربایجان شرقی' }, { id: '2', title: 'آذربایجان غربی' }, { id: '3', title: 'اردبیل' },
        { id: '4', title: 'ایلام' }, { id: '5', title: 'اصفهان' }, { id: '6', title: 'بوشهر' },
        { id: '7', title: 'تهران' }, { id: '8', title: 'چهارمحال بختیاری' }, { id: '9', title: 'خراسان شمالی' },
        { id: '10', title: 'خراسان رضوی' }, { id: '11', title: 'خراسان جنوبی' }, { id: '12', title: 'خوزستان' },
        { id: '13', title: 'زنجان' }, { id: '14', title: 'سمنان' }, { id: '15', title: 'سیستان و بلوچستان' },
        { id: '16', title: 'فارس' }, { id: '17', title: 'قزوین' }, { id: '19', title: 'کرمان' },
        { id: '20', title: 'کرمانشاه' }, { id: '21', title: 'کهگیلویه و بویراحمد' }, { id: '22', title: 'گلستان' },
        { id: '23', title: 'گیلان' }, { id: '24', title: 'مازندران' }, { id: '25', title: 'مرکزی' },
        { id: '26', title: 'هرمزگان' }, { id: '27', title: 'همدان' }, { id: '28', title: 'یزد' },
        { id: '29', title: 'کردستان' }, { id: '30', title: 'لرستان' }, { id: '31', title: 'البرز' },
        { id: '33', title: 'قم' }, { id: '34', title: 'سایر' }
    ];

    const DEFAULT_CONFIG = {
        targetCar: 'دیگنیتی',
        targetPrice: '',
        provinceId: '7',
        cityName: 'تهران',
        bankName: 'ParsianKarafarin',
        colorPriorities: 'سفید, مشکی'
    };

    const SOUND_URLS = {
        queueFull: 'https://www.soundjay.com/mechanical/sounds/gun-cocking-01.mp3',
        success: 'https://www.soundjay.com/misc/sounds/magic-chime-01.mp3'
    };

    const BASE_HEADERS = {
        'Accept': 'application/json',
        'Accept-Language': 'fa-IR,fa;q=0.9'
    };

    // -------------------------------------------------
    // Utilities
    // -------------------------------------------------
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const normalizePersian = (str = '') => str.toString().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ').trim().toLowerCase();
    const appendRnd = (url) => `${url}${url.includes('?') ? '&' : '?'}rnd=${Math.random()}`;

    const parseJSON = (payload, fallback = null) => {
        try { return JSON.parse(payload); } catch { return fallback; }
    };

    // -------------------------------------------------
    // Storage helpers
    // -------------------------------------------------
    const Store = {
        getVisitorId() {
            let id = localStorage.getItem('VisitorId');
            if (!id) {
                id = `${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
                localStorage.setItem('VisitorId', id);
            }
            return id;
        },
        getToken() { return localStorage.getItem('bm_token'); },
        setToken(token) { if (!token) localStorage.removeItem('bm_token'); else localStorage.setItem('bm_token', token); },
        getUser() { return parseJSON(localStorage.getItem('bm_user')); },
        setUser(user) { if (!user) localStorage.removeItem('bm_user'); else localStorage.setItem('bm_user', JSON.stringify(user)); },
        getCookies() { return localStorage.getItem('bm_cookies') || ''; },
        setCookies(cookie) { if (cookie) localStorage.setItem('bm_cookies', cookie); },
        getConfig() {
            return {
                targetCar: localStorage.getItem('bm_cfg_car') || DEFAULT_CONFIG.targetCar,
                targetPrice: localStorage.getItem('bm_cfg_price') || DEFAULT_CONFIG.targetPrice,
                provinceId: localStorage.getItem('bm_cfg_province') || DEFAULT_CONFIG.provinceId,
                cityName: localStorage.getItem('bm_cfg_cityname') || DEFAULT_CONFIG.cityName,
                bankName: localStorage.getItem('bm_cfg_bank') || DEFAULT_CONFIG.bankName,
                colorPriorities: localStorage.getItem('bm_cfg_colors') || DEFAULT_CONFIG.colorPriorities
            };
        },
        saveConfig(cfg) {
            localStorage.setItem('bm_cfg_car', cfg.targetCar);
            localStorage.setItem('bm_cfg_price', cfg.targetPrice);
            localStorage.setItem('bm_cfg_province', cfg.provinceId);
            localStorage.setItem('bm_cfg_cityname', cfg.cityName);
            localStorage.setItem('bm_cfg_bank', cfg.bankName);
            localStorage.setItem('bm_cfg_colors', cfg.colorPriorities);
        },
        clearSession() {
            localStorage.removeItem('bm_token');
            localStorage.removeItem('bm_user');
        },
        soundEnabled() {
            const val = localStorage.getItem('bm_sound_enabled');
            return val === null ? true : val === 'true';
        },
        setSound(flag) { localStorage.setItem('bm_sound_enabled', flag ? 'true' : 'false'); }
    };

    // -------------------------------------------------
    // Logger + audio bus
    // -------------------------------------------------
    class UILogger {
        constructor() {
            this.targetId = null;
        }
        attach(elementId) { this.targetId = elementId; }
        push(message, level = 'info') {
            const time = new Date().toLocaleTimeString('fa-IR');
            const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
            console[consoleMethod](`[${SCRIPT.NAME}] ${message}`);
            if (!this.targetId) return;
            const el = document.getElementById(this.targetId);
            if (!el) return;
            el.innerHTML += `<div style="border-bottom:1px solid #1f1f1f;padding:2px 0"><span style="color:#999">[${time}]</span> ${message}</div>`;
            el.scrollTop = el.scrollHeight;
        }
    }

    class SoundBus {
        constructor() {
            this.enabled = Store.soundEnabled();
            this.registry = {
                queueFull: new Audio(SOUND_URLS.queueFull),
                success: new Audio(SOUND_URLS.success)
            };
            Object.values(this.registry).forEach((audio) => { audio.volume = 1.0; });
        }
        toggle(flag) { this.enabled = flag; Store.setSound(flag); }
        play(name) {
            if (!this.enabled) return;
            const audio = this.registry[name];
            if (audio) audio.play().catch(() => {});
        }
    }

    // -------------------------------------------------
    // Network monitor
    // -------------------------------------------------
    class NetworkMonitor {
        constructor() {
            this.ensurePanel();
        }
        ensurePanel() {
            if (document.getElementById('bm-net-panel')) return;
            const div = document.createElement('div');
            div.className = 'bm-net-panel';
            div.id = 'bm-net-panel';
            div.innerHTML = `
                <div class="bm-net-header">
                    <span>🌐 Network Log (Mobile Mode)</span>
                    <span class="bm-close-btn" data-close-net>✖</span>
                </div>
                <div class="bm-net-body" id="bm-net-list"></div>
            `;
            document.body.appendChild(div);
            div.querySelector('[data-close-net]').addEventListener('click', () => this.hide());
        }
        panel() { return document.getElementById('bm-net-panel'); }
        list() { return document.getElementById('bm-net-list'); }
        show() { const panel = this.panel(); if (panel) panel.style.display = 'flex'; }
        hide() { const panel = this.panel(); if (panel) panel.style.display = 'none'; }
        toggle() { const panel = this.panel(); if (!panel) return; panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex'; }
        record({ method, url, status, duration, requestBody, responseBody }) {
            const list = this.list();
            if (!list) return;
            const row = document.createElement('div');
            row.className = 'bm-net-row';
            const statusClass = status >= 200 && status < 300 ? 'status-200' : 'status-400';
            const cleanUrl = url.replace(API.BASE, '.../api');
            row.innerHTML = `
                <div class="bm-net-method method-${method}" style="width:45px">${method}</div>
                <div class="bm-net-status ${statusClass}" style="width:45px">${status}</div>
                <div class="bm-net-url" title="${url}">${cleanUrl}</div>
                <div style="width:50px;text-align:right">${duration}ms</div>
            `;
            row.addEventListener('click', () => {
                alert(`URL: ${url}\nStatus: ${status}\nTime: ${duration}ms\n\nRequest:\n${requestBody || '-'}\n\nResponse:\n${(responseBody || '').slice(0, 500)}...`);
            });
            list.appendChild(row);
            list.scrollTop = list.scrollHeight;
        }
    }

    // -------------------------------------------------
    // HTTP client (Corrected for Mobile & Objects)
    // -------------------------------------------------
    class HttpClient {
        constructor(monitor) {
            this.monitor = monitor;
            this.cookies = Store.getCookies();
        }

        async request({ endpoint, url, method = 'GET', data = null, auth = true, headers = {}, timeout = 15000 }) {
            const target = appendRnd(url || `${API.BASE}${endpoint || ''}`);
            const visitorId = Store.getVisitorId();

            const finalHeaders = { ...BASE_HEADERS, VisitorId: visitorId, ...headers };

            if (auth) {
                const rawToken = Store.getToken();
                if (rawToken) {
                    let tokenStr = rawToken;
                    try {
                        const parsed = JSON.parse(rawToken);
                        if (typeof parsed === 'object' && parsed !== null) {
                            tokenStr = parsed.token || parsed.accessToken || parsed.access_token || rawToken;
                        } else {
                            tokenStr = parsed;
                        }
                    } catch {
                        tokenStr = rawToken;
                    }

                    if (typeof tokenStr === 'object') {
                         tokenStr = JSON.stringify(tokenStr);
                    }

                    finalHeaders['Authorization'] = `Bearer ${tokenStr}`;
                }
            }

            if (method !== 'GET') finalHeaders['Content-Type'] = 'application/json';

            const started = performance.now();
            const body = data ? JSON.stringify(data) : undefined;

            try {
                const response = await fetch(target, {
                    method: method,
                    headers: finalHeaders,
                    body: body
                });

                const duration = Math.max(1, Math.round(performance.now() - started));
                const text = await response.text();
                const payload = parseJSON(text, text);

                this.monitor.record({ method, url: target, status: response.status, duration, requestBody: body, responseBody: text });

                if (response.status === 401) {
                    throw new Error('نشست منقضی شد (401)');
                }

                if (response.ok) {
                    return payload;
                } else {
                    const err = payload?.errors?.[0]?.errorDescription || payload?.message || `HTTP ${response.status}`;
                    throw new Error(err);
                }
            } catch (err) {
                const duration = Math.max(1, Math.round(performance.now() - started));
                this.monitor.record({ method, url: target, status: 0, duration, requestBody: body, responseBody: err.message });
                throw err;
            }
        }
    }

    // -------------------------------------------------
    // Captcha utilities
    // -------------------------------------------------
    const fetchCaptchaImage = async () => {
        const visitorId = Store.getVisitorId();
        const url = `${API.CAPTCHA}/Captcha/GetCaptchaImage2?visitorId=${visitorId}&t=${Math.random()}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { ...BASE_HEADERS, Accept: '*/*' }
            });
            if (response.ok) {
                const token = response.headers.get('token-id');
                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                return { url: objectUrl, token };
            } else {
                throw new Error('Captcha fetch failed');
            }
        } catch (e) {
            console.error(e);
            throw new Error('Captcha network error');
        }
    };
    const solveCaptchaImage = async (objectUrl) => {
        try {
            const response = await fetch(objectUrl);
            const blob = await response.blob();
            const formData = new FormData();
            formData.append('file', blob, 'captcha.jpg');
            const solveRes = await fetch(API.SOLVER, {
                method: 'POST',
                body: formData
            });
            if (solveRes.ok) {
                const json = await solveRes.json();
                return json.text || json.result || null;
            }
            return null;
        } catch (e) {
            console.warn('Solver failed', e);
            return null;
        } finally {
            setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
        }
    };

    class CaptchaSupervisor {
        constructor(soundBus) {
            this.queue = [];
            this.maxSize = 6;
            this.expire = 110000;
            this.interval = 3000;
            this.active = false;
            this.soundBus = soundBus;
            this.onUpdate = () => {};
        }
        setUpdateHandler(handler) {
            this.onUpdate = handler || (() => {});
            this.onUpdate(this.snapshot());
        }
        snapshot() { return { size: this.queue.length, active: this.active }; }
        purge() {
            const now = Date.now();
            const before = this.queue.length;
            this.queue = this.queue.filter((item) => (now - item.timestamp) < this.expire);
            if (before !== this.queue.length) this.onUpdate(this.snapshot());
        }
        async start() {
            if (this.active) return;
            this.active = true;
            this.loop();
            this.onUpdate(this.snapshot());
        }
        stop() {
            this.active = false;
            this.onUpdate(this.snapshot());
        }
        async loop() {
            while (this.active) {
                try {
                    this.purge();
                    if (this.queue.length < this.maxSize) {
                        const cap = await fetchCaptchaImage();
                        const text = await solveCaptchaImage(cap.url);
                        if (text && text.length >= 4) {
                            this.queue.push({ token: cap.token, value: text, timestamp: Date.now() });
                            this.onUpdate(this.snapshot());
                            if (this.queue.length === this.maxSize) this.soundBus.play('queueFull');
                        }
                    }
                } catch (err) {
                    console.warn('Captcha worker error', err);
                }
                await sleep(this.interval);
            }
        }
        async acquire() {
            this.purge();
            if (this.queue.length) {
                const item = this.queue.shift();
                this.onUpdate(this.snapshot());
                return item;
            }
            const cap = await fetchCaptchaImage();
            const text = await solveCaptchaImage(cap.url);
            return { token: cap.token, value: text };
        }
    }

    // -------------------------------------------------
    // UI manager
    // -------------------------------------------------
    class UIManager {
        constructor({ provinces, defaults, monitor, soundBus, actions }) {
            this.actions = actions;
            this.defaults = defaults;
            this.provinces = provinces;
            this.monitor = monitor;
            this.soundBus = soundBus;
            this.logger = new UILogger();
            this.currentUser = null;
            this.injectStyles();
            this.buildChrome();
        }
        injectStyles() {
            if (document.getElementById('bm-style')) return;
            const style = document.createElement('style');
            style.id = 'bm-style';
            style.innerText = `
                .bm-container { position: fixed; top: 10px; left: 50%; transform: translateX(-50%); width: 95%; max-width: 420px; max-height: 90vh; overflow-y: auto; background: #111; color: #e0e0e0; border: 1px solid #222; border-radius: 14px; z-index: 99998; font-family: 'Tahoma', sans-serif; direction: rtl; display:none; box-shadow: 0 12px 40px rgba(0,0,0,0.75); }
                .bm-header { padding: 16px; border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center; font-weight: bold; background:#181818; position: sticky; top:0; }
                .bm-close-btn { cursor: pointer; color: #ff5252; font-size: 22px; }
                .bm-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
                .bm-input, .bm-select { background:#1e1e1e; border: 1px solid #333; color:#f5f5f5; padding: 11px; border-radius: 8px; width: 100%; box-sizing: border-box; text-align:center; font-size: 15px; }
                .bm-input:focus { border-color:#00e676; }
                .bm-btn { background: linear-gradient(135deg,#00c853,#64dd17); color:#000; border:none; padding: 13px; border-radius:9px; cursor:pointer; font-weight:bold; font-size:15px; }
                .bm-btn[disabled] { opacity: 0.6; cursor:not-allowed; }
                .bm-log { background:#000; color:#00e676; padding:10px; border-radius:8px; font-family:monospace; font-size:11px; height:130px; overflow-y:auto; border:1px solid #222; }
                .bm-row { display:flex; gap:8px; flex-wrap:wrap; }
                .bm-row > div { flex:1; min-width:45%; }
                #bm-controls { position: fixed; bottom:80px; right:20px; z-index:99999; display:flex; flex-direction:column-reverse; gap:12px; }
                .bm-float-btn { width:56px; height:56px; border-radius:50%; border:2px solid #fff; display:flex; align-items:center; justify-content:center; font-size:22px; cursor:pointer; box-shadow:0 8px 24px rgba(0,0,0,0.4); transition: transform 0.2s; }
                .bm-float-btn:active { transform:scale(0.9); }
                .bm-badge-container { background:#151515; border:1px dashed #333; border-radius:10px; padding:12px; display:flex; justify-content:space-between; align-items:center; }
                .bm-badge-info { font-size:12px; color:#bbb; }
                .bm-badge-count { font-size:22px; font-weight:bold; }
                .bm-net-panel { position: fixed; bottom: 10px; left: 50%; transform: translateX(-50%); width: 95%; height: 40vh; background: #0d1117; border: 1px solid #30363d; border-radius: 8px; z-index: 99997; display: none; flex-direction: column; box-shadow: 0 -5px 20px rgba(0,0,0,0.8); font-family: monospace; font-size: 11px; color: #c9d1d9; text-align: left; direction: ltr; }
                .bm-net-header { padding: 8px 10px; background: #161b22; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center; }
                .bm-net-body { flex: 1; overflow-y: auto; padding: 5px; }
                .bm-net-row { display: flex; border-bottom: 1px solid #21262d; padding: 8px 0; cursor: pointer; }
                .bm-net-url { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 6px; }
                .status-200 { color:#3fb950; }
                .status-400 { color:#f85149; }
                .method-GET { color:#58a6ff; font-weight:bold; }
                .method-POST { color:#d29922; font-weight:bold; }
                .bm-switch { display:flex; align-items:center; justify-content:space-between; background:#151515; border:1px solid #222; border-radius:8px; padding:10px 14px; font-size:12px; }
            `;
            document.head.appendChild(style);
        }
        buildChrome() {
            if (!document.getElementById('bm-controls')) {
                const controls = document.createElement('div');
                controls.id = 'bm-controls';
                controls.innerHTML = `
                    <div class="bm-float-btn" id="bm-floater-main" style="background:linear-gradient(135deg,#00c853,#64dd17)">🤖</div>
                    <div class="bm-float-btn" id="bm-floater-net" style="background:linear-gradient(135deg,#2979ff,#29b6f6)">🌐</div>
                `;
                document.body.appendChild(controls);
                controls.querySelector('#bm-floater-main').addEventListener('click', () => this.showContainer());
                controls.querySelector('#bm-floater-net').addEventListener('click', () => this.monitor.toggle());
            }
            this.monitor.ensurePanel();
            this.container = document.querySelector('.bm-container');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.className = 'bm-container';
                document.body.appendChild(this.container);
            }
        }
        showContainer() { if (this.container) this.container.style.display = 'block'; }
        hideContainer() { if (this.container) this.container.style.display = 'none'; }
        renderLogin() {
            this.currentUser = null;
            this.container.style.display = 'block';
            this.container.innerHTML = `
                <div class="bm-header">
                    <span>🔐 ورود | ${SCRIPT.NAME}</span>
                    <span class="bm-close-btn" id="bm-close">✖</span>
                </div>
                <div class="bm-content">
                    <input id="bm-user" class="bm-input" type="tel" placeholder="کد ملی">
                    <input id="bm-pass" class="bm-input" type="password" placeholder="رمز عبور">
                    <div id="bm-cap-box" style="text-align:center;cursor:pointer;min-height:70px;border:1px dashed #444;border-radius:8px;display:flex;align-items:center;justify-content:center">کپچا</div>
                    <input id="bm-cap-input" class="bm-input" type="tel" placeholder="کد امنیتی">
                    <button id="bm-login-btn" class="bm-btn">ورود</button>
                    <div id="bm-log-box" class="bm-log">آماده...</div>
                </div>
            `;
            document.getElementById('bm-close').addEventListener('click', () => { this.hideContainer(); document.getElementById('bm-floater-main').style.display = 'flex'; });
            const capBox = document.getElementById('bm-cap-box');
            this.logger.attach('bm-log-box');
            let captchaToken = null;
            const refreshCaptcha = async () => {
                capBox.innerHTML = '...';
                try {
                    const cap = await fetchCaptchaImage();
                    captchaToken = cap.token;
                    const img = document.createElement('img');
                    img.src = cap.url;
                    img.style.height = '70px';
                    img.style.borderRadius = '6px';
                    capBox.innerHTML = '';
                    capBox.appendChild(img);
                    const solved = await solveCaptchaImage(cap.url);
                    if (solved) document.getElementById('bm-cap-input').value = solved;
                } catch {
                    capBox.innerHTML = '<span style="color:#ff5252">خطا</span>';
                }
            };
            capBox.addEventListener('click', refreshCaptcha);
            refreshCaptcha();
            document.getElementById('bm-login-btn').addEventListener('click', () => {
                const nationalCode = document.getElementById('bm-user').value.trim();
                const password = document.getElementById('bm-pass').value.trim();
                const captcha = document.getElementById('bm-cap-input').value.trim();
                if (!nationalCode || !password || !captcha) {
                    this.logger.push('لطفا تمام فیلدها را کامل کنید', 'warn');
                    return;
                }
                this.actions.onLogin({ nationalCode, password, captchaResult: captcha, captchaToken });
            });
        }
        renderDashboard(user, config) {
            this.currentUser = user;
            this.container.style.display = 'block';
            this.container.innerHTML = `
                <div class="bm-header">
                    <span style="font-size:13px">کاربر: <span style="color:#00e676">${user?.firstName || user?.FirstName || 'کاربر'}</span></span>
                    <span class="bm-close-btn" id="bm-close">✖</span>
                </div>
                <div class="bm-content">
                    <div class="bm-badge-container">
                        <div class="bm-badge-info">موتور کپچا<br><span id="queue-status" style="color:#777">غیرفعال</span></div>
                        <div style="text-align:center">
                            <div id="queue-count" class="bm-badge-count">0</div>
                            <small style="color:#888">صف آماده</small>
                        </div>
                    </div>
                    <div class="bm-row">
                        <div><input id="cfg-car" class="bm-input" value="${config.targetCar}" placeholder="خودرو"></div>
                        <div><input id="cfg-price" class="bm-input" value="${config.targetPrice}" placeholder="قیمت"></div>
                    </div>
                    <div class="bm-row">
                        <div><input id="cfg-color" class="bm-input" value="${config.colorPriorities}" placeholder="رنگ‌ها"></div>
                        <div><select id="cfg-province" class="bm-select">${this.renderProvinceOptions(config.provinceId)}</select></div>
                    </div>
                    <input id="cfg-city" class="bm-input" value="${config.cityName}" placeholder="شهر">
                    <div class="bm-switch">
                        <span>صدای اعلان</span>
                        <label>
                            <input type="checkbox" id="bm-sound-toggle" ${this.soundBus.enabled ? 'checked' : ''}>
                        </label>
                    </div>
                    <button id="bm-toggle-worker" class="bm-btn" style="background:linear-gradient(135deg,#2979ff,#29b6f6)">⚡ موتور کپچا</button>
                    <button id="bm-start" class="bm-btn">🚀 شروع خرید</button>
                    <button id="bm-stop" class="bm-btn" style="background:#e65100;display:none">⛔ توقف</button>
                    <button id="bm-logout" class="bm-btn" style="background:#d32f2f;font-size:12px;padding:10px;margin-top:10px">خروج</button>
                    <div id="bm-log-box" class="bm-log">آماده...</div>
                </div>
            `;
            document.getElementById('bm-close').addEventListener('click', () => { this.hideContainer(); document.getElementById('bm-floater-main').style.display = 'flex'; });
            this.logger.attach('bm-log-box');
            document.getElementById('bm-toggle-worker').addEventListener('click', this.actions.onToggleCaptcha);
            document.getElementById('bm-start').addEventListener('click', () => this.actions.onStart(this.collectConfig()));
            document.getElementById('bm-stop').addEventListener('click', () => this.actions.onStop());
            document.getElementById('bm-logout').addEventListener('click', this.actions.onLogout);
            document.getElementById('bm-sound-toggle').addEventListener('change', (e) => this.actions.onSoundToggle(e.target.checked));
        }
        renderProvinceOptions(selectedId) {
            return this.provinces.map((p) => `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.title}</option>`).join('');
        }
        collectConfig() {
            return {
                targetCar: document.getElementById('cfg-car').value.trim() || DEFAULT_CONFIG.targetCar,
                targetPrice: document.getElementById('cfg-price').value.trim().replace(/[,،]/g, ''),
                provinceId: document.getElementById('cfg-province').value,
                cityName: document.getElementById('cfg-city').value.trim() || DEFAULT_CONFIG.cityName,
                bankName: DEFAULT_CONFIG.bankName,
                colorPriorities: document.getElementById('cfg-color').value.trim() || DEFAULT_CONFIG.colorPriorities
            };
        }
        updateQueue({ size, active }) {
            const count = document.getElementById('queue-count');
            const status = document.getElementById('queue-status');
            if (count) count.innerText = size;
            if (count) count.style.color = size >= 4 ? '#00e676' : '#ff5252';
            if (status) status.innerText = active ? 'فعال' : 'غیرفعال';
            if (status) status.style.color = active ? '#00e676' : '#777';
        }
        setRunState(running) {
            const startBtn = document.getElementById('bm-start');
            const stopBtn = document.getElementById('bm-stop');
            if (!startBtn || !stopBtn) return;
            startBtn.style.display = running ? 'none' : 'block';
            stopBtn.style.display = running ? 'block' : 'none';
        }
        log(message, level = 'info') { this.logger.push(message, level); }
    }

    // -------------------------------------------------
    // Buying engine
    // -------------------------------------------------
    class BuyingEngine {
        constructor({ http, captcha, ui, sound }) {
            this.http = http;
            this.captcha = captcha;
            this.ui = ui;
            this.sound = sound;
            this.running = false;
            this.currentConfig = DEFAULT_CONFIG;
        }
        isRunning() { return this.running; }
        async start(config) {
            if (this.running) return;
            this.running = true;
            this.currentConfig = config;
            Store.saveConfig(config);
            this.ui.setRunState(true);
            this.ui.log('✅ شروع فرآیند خرید...');
            try {
                await this.run();
            } catch (err) {
                this.ui.log(`❌ خطا: ${err.message || err}`, 'error');
            } finally {
                this.running = false;
                this.ui.setRunState(false);
            }
        }
        stop(reason = 'درخواست کاربر') {
            if (!this.running) return;
            this.running = false;
            this.ui.log(`⛔ توقف: ${reason}`, 'warn');
            this.ui.setRunState(false);
        }
        async run() {
            const cfg = this.currentConfig;
            const product = await this.findProduct(cfg.targetCar);
            if (!this.running || !product) return;
            this.ui.log(`🏎️ محصول یافت شد: ${product.title || product.titleDetails}`);
            const circulation = await this.findActiveCirculation(product);
            if (!this.running || !circulation) return;
            this.ui.log('📄 بخشنامه فعال یافت شد');
            const color = this.pickColor(circulation.circulationColors || [], cfg.colorPriorities);
            if (!color) {
                this.ui.log('رنگ مطابق سلیقه وجود ندارد؛ اولین رنگ انتخاب می‌شود', 'warn');
            } else {
                this.ui.log(`🎨 رنگ انتخابی: ${color.plainColor}`);
            }
            await this.registerLoop({ circulation, color: color || (circulation.circulationColors || [])[0], cfg });
        }
        async findProduct(targetCar) {
            this.ui.log('🔍 جستجوی خودرو...');
            while (this.running) {
                try {
                    const res = await this.http.request({ endpoint: API.ENDPOINTS.HOME });
                    const items = res.data || res;
                    const found = (items || []).find((item) => {
                        const text = (item.title || '') + (item.titleDetails || '');
                        return normalizePersian(text).includes(normalizePersian(targetCar));
                    });
                    if (found) return found;
                } catch (err) {
                    this.ui.log(`Home error: ${err.message || err}`, 'warn');
                }
                await sleep(100);
            }
            return null;
        }
        async findActiveCirculation(product) {
            this.ui.log('📑 جستجوی بخشنامه...');
            const modelId = String(product.productGroup || product.id);
            while (this.running) {
                try {
                    const res = await this.http.request({ endpoint: API.ENDPOINTS.CIRCULATION, method: 'POST', data: { CarModelId: modelId, getDataType: 0 } });
                    const entries = res.data || res;
                    const active = (entries || []).find((entry) => (entry.isOnSale === '1' || entry.isOnSale === true) && (entry.circulationColors || []).length > 0);
                    if (active) return active;
                } catch (err) {
                    this.ui.log(`Circulation error: ${err.message || err}`, 'warn');
                }
                await sleep(80);
            }
            return null;
        }
        pickColor(colors, preferenceString) {
            if (!colors || !colors.length) return null;
            const prefs = (preferenceString || '').split(/[,،]/).map(normalizePersian).filter(Boolean);
            for (const pref of prefs) {
                const match = colors.find((c) => normalizePersian(c.plainColor).includes(pref));
                if (match) return match;
            }
            return colors[0];
        }
        async resolveBranch({ provinceId, cityName, color }) {
            try {
                const citiesRes = await this.http.request({
                    endpoint: API.ENDPOINTS.BRANCH_PROVINCE,
                    method: 'POST',
                    data: { provinceId: String(provinceId), circulationId: String(color.circulationId) }
                });
                const cities = citiesRes.data || citiesRes || [];
                const targetCity = normalizePersian(cityName);
                const selectedCity = cities.find((c) => normalizePersian(c.title).includes(targetCity)) || cities[0];
                if (!selectedCity) return 0;
                const branchRes = await this.http.request({
                    endpoint: API.ENDPOINTS.BRANCH_CITY,
                    method: 'POST',
                    data: { cityCode: String(selectedCity.code || selectedCity.id), circulationId: String(color.circulationId) }
                });
                const branches = branchRes.data || branchRes || [];
                return branches.length ? branches[0].id : 0;
            } catch {
                return 0;
            }
        }
        async registerLoop({ circulation, color, cfg }) {
            while (this.running) {
                try {
                    const captcha = await this.captcha.acquire();
                    if (!captcha?.value) continue;
                    const [registerRes, branchId] = await Promise.all([
                        this.http.request({
                            endpoint: API.ENDPOINTS.REGISTER,
                            method: 'POST',
                            data: {
                                branchId: 0,
                                cirId: String(circulation.id),
                                crcl_Row: String(circulation.crcl_row || circulation.rowId),
                                circOpIds: (circulation.options || []).map((o) => String(o.id)),
                                color_code: String(color.colorCode),
                                count: 1,
                                captchaResponse: '',
                                captchaToken: String(captcha.token),
                                captchaResult: String(captcha.value)
                            }
                        }),
                        this.resolveBranch({ provinceId: cfg.provinceId, cityName: cfg.cityName, color })
                    ]);
                    const orderData = registerRes.data || registerRes;
                    if (orderData.id && orderData.id !== '0') {
                        this.ui.log(`🎉 سفارش ثبت شد: ${orderData.id}`);
                        this.sound.play('success');
                        await this.fillAndPoll(orderData, branchId || 0);
                        this.running = false;
                        return;
                    }
                    const err = orderData.errors?.[0]?.errorDescription || orderData.message || 'نامشخص';
                    this.ui.log(`⚠️ عدم ثبت: ${err}`);
                    if (!err.includes('کد امنیتی')) await sleep(300);
                } catch (err) {
                    this.ui.log(`⏳ تلاش مجدد: ${err.message || err}`, 'warn');
                    await sleep(250);
                }
            }
        }
        async fillAndPoll(orderData, branchId) {
            const captcha = await this.captcha.acquire();
            if (!captcha?.value) throw new Error('Captcha missing for fill confirm');
            const bankName = (orderData.banks && orderData.banks.length) ? orderData.banks[0].bankName : this.currentConfig.bankName;
            const payload = {
                onlineshoppingId: String(orderData.id),
                bankName,
                branchId: String(branchId || 0),
                ticket: 'no-ticket',
                captchaResponse: '',
                captchaToken: String(captcha.token),
                captchaResult: String(captcha.value)
            };
            const fillRes = await this.http.request({ endpoint: API.ENDPOINTS.FILL_CONFIRM, method: 'POST', data: payload });
            const fillData = fillRes.data || fillRes;
            if (!fillData.queueId) {
                this.ui.log('⚠️ صف بانک در دسترس نیست');
                return;
            }
            this.ui.log('🏁 در انتظار درگاه بانکی...');
            for (let i = 0; i < 60 && this.running; i++) {
                const check = await this.http.request({ endpoint: API.ENDPOINTS.BANK_CHECK, method: 'POST', data: { queueId: String(fillData.queueId), orderId: String(orderData.id) } });
                const data = check.data || check;
                if (data.nextPageUrl) {
                    this.ui.log('🔗 باز کردن درگاه بانکی');
                    const win = window.open(data.nextPageUrl, '_blank');
                    if (!win) window.location.href = data.nextPageUrl;
                    return;
                }
                await sleep(1000);
            }
        }
    }

    // -------------------------------------------------
    // Bootstrapping
    // -------------------------------------------------
    const monitor = new NetworkMonitor();
    const http = new HttpClient(monitor);
    const sound = new SoundBus();
    const captcha = new CaptchaSupervisor(sound);
    const ui = new UIManager({
        provinces: PROVINCES,
        defaults: DEFAULT_CONFIG,
        monitor,
        soundBus: sound,
        actions: {}
    });
    const engine = new BuyingEngine({ http, captcha, ui, sound });
    const actions = {
        async onLogin({ nationalCode, password, captchaResult, captchaToken }) {
            try {
                ui.log('در حال ورود...');
                const res = await http.request({
                    endpoint: API.ENDPOINTS.LOGIN,
                    method: 'POST',
                    data: { nationalCode, password, captchaResult, captchaToken },
                    auth: false
                });
                const token = res.token || res.data?.token;
                const user = res.customer || res.data?.customer;
                if (!token || !user) throw new Error('پاسخ نامعتبر');

                Store.setToken(typeof token === 'object' ? JSON.stringify(token) : token);
                Store.setUser(user);

                ui.log('ورود موفق ✅');
                // Removed reload for mobile stability
                ui.renderDashboard(user, Store.getConfig());
            } catch (err) {
                ui.log(`ورود ناموفق: ${err.message || err}`, 'error');
            }
        },
        onToggleCaptcha: () => {
            if (captcha.active) { captcha.stop(); ui.log('موتور کپچا متوقف شد'); }
            else { captcha.start(); ui.log('موتور کپچا فعال شد'); }
        },
        onStart: (config) => {
            engine.start(config);
        },
        onStop: () => engine.stop(),
        onLogout: () => {
            Store.clearSession();
            window.location.reload();
        },
        onSoundToggle: (flag) => {
            sound.toggle(flag);
            ui.log(flag ? 'صدا فعال شد' : 'صدا غیرفعال شد');
        }
    };

    ui.actions = actions;
    captcha.setUpdateHandler((snapshot) => ui.updateQueue(snapshot));
    const boot = () => {
        const token = Store.getToken();
        const user = Store.getUser();
        if (token && user) ui.renderDashboard(user, Store.getConfig());
        else ui.renderLogin();
    };

    boot();
})();
