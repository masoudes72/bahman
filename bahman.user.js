// ==UserScript==
// @name         Bahman Auto Buyer (Mobile Optimized + Update)
// @namespace    https://bahman.iranecar.com/
// @version      2025-11-21-MobileUI
// @description  Full automation optimized for Mobile screens (Kiwi Browser/Safari Userscripts)
// @author       You
// @match        https://bahman.iranecar.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      bahmanapi2.iranecar.com
// @connect      recaptchag.iranecar.com
// @connect      siapa-bahman.viiona.ir
// @connect      github.com
// ==/UserScript==

(function () {
    'use strict';

    // تنظیمات ثابت و آدرس‌ها
    const PROVINCES = [
        { id: "1", title: "آذربایجان شرقی" }, { id: "2", title: "آذربایجان غربی" }, { id: "3", title: "اردبیل" },
        { id: "4", title: "ایلام" }, { id: "5", title: "اصفهان" }, { id: "6", title: "بوشهر" },
        { id: "7", title: "تهران" }, { id: "8", title: "چهارمحال بختیاری" }, { id: "9", title: "خراسان شمالی" },
        { id: "10", title: "خراسان رضوی" }, { id: "11", title: "خراسان جنوبی" }, { id: "12", title: "خوزستان" },
        { id: "13", title: "زنجان" }, { id: "14", title: "سمنان" }, { id: "15", title: "سیستان و بلوچستان" },
        { id: "16", title: "فارس" }, { id: "17", title: "قزوین" }, { id: "19", title: "کرمان" },
        { id: "20", title: "کرمانشاه" }, { id: "21", title: "کهگیلویه و بویراحمد" }, { id: "22", title: "گلستان" },
        { id: "23", title: "گیلان" }, { id: "24", title: "مازندران" }, { id: "25", title: "مرکزی" },
        { id: "26", title: "هرمزگان" }, { id: "27", title: "همدان" }, { id: "28", title: "یزد" },
        { id: "29", title: "کردستان" }, { id: "30", title: "لرستان" }, { id: "31", title: "البرز" },
        { id: "33", title: "قم" }, { id: "34", title: "سایر" }
    ];

    const DEFAULT_CONFIG = {
        targetCar: 'دیگنیتی',
        targetPrice: '',
        planKeywords: '',
        provinceId: '7',
        cityName: 'تهران',
        bankName: 'ParsianKarafarin',
        colorPriorities: 'سفید, مشکی'
    };

    const API_BASE = "https://bahmanapi2.iranecar.com/api/v1";
    const CAPTCHA_BASE = "https://recaptchag.iranecar.com/api";
    const SOLVER_URL = "https://siapa-bahman.viiona.ir/solve";
    const UPDATE_URL = "https://github.com/masoudes72/bahman/raw/refs/heads/main/bahman.user.js";

    const HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0",
        "Accept": "application/json",
        "Accept-Language": "fa-IR,fa;q=0.9",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
        "Priority": "u=4"
    };

    // --- استایل‌های بهینه شده برای موبایل ---
    const styles = `
        /* کانتینر اصلی: ریسپانسیو */
        .bm-container {
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%); /* وسط چین */
            width: 95%; /* عرض 95 درصد برای موبایل */
            max-width: 400px; /* حداکثر عرض برای تبلت */
            max-height: 90vh; /* جلوگیری از بلندتر شدن از صفحه */
            overflow-y: auto; /* اسکرول در صورت نیاز */
            background: #121212;
            color: #e0e0e0;
            border: 1px solid #333;
            border-radius: 12px;
            z-index: 100000;
            font-family: 'Tahoma', sans-serif;
            direction: rtl;
            text-align: right;
            box-shadow: 0 10px 40px rgba(0,0,0,0.9);
            font-size: 14px; /* فونت کمی بزرگتر */
            display: none;
        }

        .bm-header {
            background: #1a1a1a;
            padding: 15px;
            border-bottom: 1px solid #333;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 12px 12px 0 0;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        /* دکمه‌های شناور - کمی بالاتر برای موبایل */
        #bm-controls {
            position: fixed;
            bottom: 80px; /* بالاتر برای جلوگیری از تداخل با منوی مرورگر موبایل */
            right: 15px;
            z-index: 99999;
            display: flex;
            flex-direction: column-reverse;
            gap: 12px;
        }
        .bm-float-btn {
            width: 55px; /* دکمه بزرگتر برای لمس */
            height: 55px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            border: 2px solid #fff;
            transition: transform 0.2s;
        }
        .bm-float-btn:active { transform: scale(0.9); }
        .bm-float-btn span { font-size: 26px; }

        #bm-floater-main { background: linear-gradient(135deg, #00c853, #64dd17); }
        #bm-floater-net { background: linear-gradient(135deg, #2979ff, #29b6f6); }
        #bm-floater-update { background: linear-gradient(135deg, #ff9100, #ffea00); }

        .bm-close-btn { cursor: pointer; color: #ff5252; font-size: 22px; padding: 5px; } /* بزرگتر برای تاچ */

        .bm-content { padding: 15px; display: flex; flex-direction: column; gap: 12px; }

        /* ورودی‌ها بزرگتر برای تایپ راحت‌تر */
        .bm-input, .bm-select {
            background: #252525;
            border: 1px solid #444;
            color: #fff;
            padding: 12px; /* پدینگ بیشتر */
            border-radius: 8px;
            width: 100%;
            box-sizing: border-box;
            text-align: center;
            font-size: 16px; /* فونت بزرگتر برای جلوگیری از زوم خودکار آیفون */
            outline: none;
            margin-top: 3px;
        }
        .bm-select { text-align: right; padding-right: 10px; }
        .bm-input:focus, .bm-select:focus { border-color: #00e676; background: #2a2a2a; }

        .bm-label { font-size: 12px; color: #aaa; margin-right: 5px; margin-bottom: 2px; }

        .bm-btn {
            background: linear-gradient(135deg, #00c853, #64dd17);
            color: #000;
            border: none;
            padding: 14px; /* دکمه بلندتر */
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            width: 100%;
            font-size: 16px;
        }
        .bm-btn:disabled { background: #424242; color: #888; }

        .bm-captcha-img { width: 100%; height: 70px; object-fit: contain; background: #fff; border-radius: 6px; cursor: pointer; border: 2px solid #444; }

        .bm-log {
            background: #000;
            color: #00e676;
            padding: 10px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 12px;
            height: 120px;
            overflow-y: auto;
            border: 1px solid #333;
        }

        .bm-row { display: flex; gap: 10px; flex-wrap: wrap; } /* Wrap برای صفحه‌های خیلی کوچک */
        .bm-row > div { min-width: 45%; flex: 1; }

        /* Network Monitor Panel Mobile */
        .bm-net-panel {
            position: fixed;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            width: 95%;
            height: 40vh; /* ارتفاع کمتر */
            background: #0d1117;
            border: 1px solid #30363d;
            border-radius: 8px;
            z-index: 99998;
            display: none;
            flex-direction: column;
            box-shadow: 0 -5px 20px rgba(0,0,0,0.8);
            font-family: monospace;
            font-size: 11px;
            color: #c9d1d9;
        }
        .bm-net-header { padding: 8px 10px; background: #161b22; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center; }
        .bm-net-body { flex: 1; overflow-y: auto; padding: 5px; }
        .bm-net-row { display: flex; border-bottom: 1px solid #21262d; padding: 8px 0; }
        .bm-net-url { flex: 1; overflow: hidden; text-overflow: ellipsis; padding: 0 5px; }

        /* کلاس‌های کمکی رنگ */
        .status-200 { color: #3fb950; }
        .status-400 { color: #f85149; }
        .method-GET { color: #58a6ff; }
        .method-POST { color: #d29922; }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // --- State ---
    let currentVisitorId = localStorage.getItem('VisitorId') || (Math.random().toString(16).slice(2) + Date.now().toString(16));
    localStorage.setItem('VisitorId', currentVisitorId);
    let storedCookies = localStorage.getItem('bm_cookies') || '';
    let loginCapToken = null;
    let isRunning = false;

    // توابع کمکی
    function normalizePersian(str) {
        if (!str) return "";
        return str.toString().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function getUserConfig() {
        return {
            targetCar: localStorage.getItem('bm_cfg_car') || DEFAULT_CONFIG.targetCar,
            targetPrice: localStorage.getItem('bm_cfg_price') || DEFAULT_CONFIG.targetPrice,
            planKeywords: localStorage.getItem('bm_cfg_keywords') || DEFAULT_CONFIG.planKeywords,
            provinceId: localStorage.getItem('bm_cfg_province') || DEFAULT_CONFIG.provinceId,
            cityName: localStorage.getItem('bm_cfg_cityname') || DEFAULT_CONFIG.cityName,
            bankName: localStorage.getItem('bm_cfg_bank') || DEFAULT_CONFIG.bankName,
            colorPriorities: localStorage.getItem('bm_cfg_colors') || DEFAULT_CONFIG.colorPriorities
        };
    }

    function saveUserConfig(cfg) {
        localStorage.setItem('bm_cfg_car', cfg.targetCar);
        localStorage.setItem('bm_cfg_price', cfg.targetPrice);
        localStorage.setItem('bm_cfg_keywords', cfg.planKeywords);
        localStorage.setItem('bm_cfg_province', cfg.provinceId);
        localStorage.setItem('bm_cfg_cityname', cfg.cityName);
        localStorage.setItem('bm_cfg_bank', cfg.bankName);
        localStorage.setItem('bm_cfg_colors', cfg.colorPriorities);
    }

    function log(msg) {
        console.log(`[BahmanBot] ${msg}`);
        const el = document.getElementById('bm-log-box');
        if (el) {
            const time = new Date().toLocaleTimeString('fa-IR');
            el.innerHTML += `<div style="border-bottom:1px solid #222;padding:2px 0;">[${time}] ${msg}</div>`;
            el.scrollTop = el.scrollHeight;
        }
    }

    function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    // --- Network Monitor ---
    function initMonitor() {
        if (document.querySelector('.bm-net-panel')) return;
        const div = document.createElement('div');
        div.className = 'bm-net-panel';
        div.id = 'bm-net-panel';
        div.innerHTML = `
            <div class="bm-net-header">
                <span style="font-size:14px">🌐 Network</span>
                <span class="bm-close-btn" onclick="document.getElementById('bm-net-panel').style.display='none'; document.getElementById('bm-floater-net').style.display='flex';">✖</span>
            </div>
            <div class="bm-net-body" id="bm-net-list"></div>
        `;
        document.body.appendChild(div);
    }

    function logNetwork(method, url, status, time, reqData, resData) {
        const list = document.getElementById('bm-net-list');
        if (!list) return;

        const row = document.createElement('div');
        row.className = 'bm-net-row';
        const cleanUrl = url.replace(API_BASE, '').split('?')[0];
        const statusClass = status >= 200 && status < 300 ? 'status-200' : 'status-400';
        row.innerHTML = `
            <div class="bm-net-method method-${method}" style="width:40px;font-weight:bold">${method}</div>
            <div class="bm-net-status ${statusClass}" style="width:35px">${status}</div>
            <div class="bm-net-url">${cleanUrl}</div>
        `;
        row.onclick = () => {
            console.log('URL:', url);
            console.log('Req:', reqData);
            console.log('Res:', resData);
            alert(`Status: ${status}\nUrl: ${cleanUrl}\nCheck console for details.`);
        };
        list.appendChild(row);
        list.scrollTop = list.scrollHeight;
    }

    // --- Request Engine ---
    function request(url, method = 'GET', data = null, auth = true) {
        return new Promise((resolve, reject) => {
            const headers = { ...HEADERS };
            headers['VisitorId'] = currentVisitorId;
            if (storedCookies) headers['Cookie'] = storedCookies;

            if (auth) {
                const tokenData = localStorage.getItem('bm_token');
                if (tokenData) {
                    try {
                        if (tokenData.startsWith('{')) {
                            const parsed = JSON.parse(tokenData);
                            headers['Authorization'] = `Bearer ${parsed.token || parsed}`;
                        } else {
                            headers['Authorization'] = `Bearer ${tokenData}`;
                        }
                    } catch (e) { headers['Authorization'] = `Bearer ${tokenData}`; }
                }
            }

            if (method === 'GET') delete headers['Content-Type'];
            else headers['Content-Type'] = 'application/json';

            const fullUrl = `${url}${url.includes('?') ? '&' : '?'}rnd=${Math.random()}`;
            const startTime = Date.now();
            const reqBody = data ? JSON.stringify(data) : null;

            GM_xmlhttpRequest({
                method: method,
                url: fullUrl,
                headers: headers,
                data: reqBody,
                onload: function(response) {
                    logNetwork(method, url, response.status, Date.now() - startTime, reqBody, response.responseText);

                    const setCookie = response.responseHeaders.match(/^set-cookie:\s*(.*)$/gim);
                    if (setCookie) {
                        storedCookies = setCookie.map(c => c.replace(/^set-cookie:\s*/i, '').split(';')[0]).join('; ');
                        localStorage.setItem('bm_cookies', storedCookies);
                    }

                    if (response.status === 401) {
                        log('❌ نشست منقضی شد.');
                        localStorage.removeItem('bm_token');
                        isRunning = false;
                        renderLogin();
                        reject('401');
                        return;
                    }

                    if (response.status >= 200 && response.status < 300) {
                        try { resolve(JSON.parse(response.responseText)); } catch { resolve(response.responseText); }
                    } else {
                        try {
                            const json = JSON.parse(response.responseText);
                            reject(json.errors?.[0]?.errorDescription || json.message || `Status ${response.status}`);
                        } catch { reject(`Status ${response.status}`); }
                    }
                },
                onerror: function() {
                    logNetwork(method, url, 0, 0, reqBody, 'Net Error');
                    reject('Network Error');
                }
            });
        });
    }

    function getCaptcha() {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${CAPTCHA_BASE}/Captcha/GetCaptchaImage2?visitorId=${currentVisitorId}&t=${Math.random()}`,
                headers: { ...HEADERS, 'Accept': '*/*' },
                responseType: 'blob',
                onload: function(res) {
                    if (res.status === 200) {
                        const t = res.responseHeaders.match(/token-id:\s*(.*)/i);
                        const url = URL.createObjectURL(res.response);
                        resolve({ url, tid: t ? t[1].trim() : null });
                    } else reject('Captcha Error');
                }
            });
        });
    }

    async function solveCaptcha(blobUrl) {
        try {
            const res = await fetch(blobUrl);
            const blob = await res.blob();
            const formData = new FormData();
            formData.append('file', blob, 'image.jpg');
            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: SOLVER_URL,
                    data: formData,
                    onload: (response) => {
                        try {
                            const json = JSON.parse(response.responseText);
                            resolve(json.text || json.result || null);
                        } catch { resolve(null); }
                    },
                    onerror: () => resolve(null)
                });
            });
        } catch { return null; }
    }

    async function retryUntilSuccess(taskName, taskFn, delay = 1000) {
        while (isRunning) {
            try {
                const result = await taskFn();
                if (result) return result;
                log(`⏳ ${taskName}...`);
            } catch (e) {
                if (String(e).includes('401')) return null;
                log(`⚠️ ${taskName}: ${e}`);
            }
            await sleep(delay);
        }
        return null;
    }

    // --- UI Logic ---
    function toggleMain(show) {
        const panel = document.querySelector('.bm-container');
        const btn = document.getElementById('bm-floater-main');
        if(show) {
            if(panel) panel.style.display = 'block';
            if(btn) btn.style.display = 'none';
        } else {
            if(panel) panel.style.display = 'none';
            if(btn) btn.style.display = 'flex';
        }
    }

    function toggleNet(show) {
        const panel = document.getElementById('bm-net-panel');
        const btn = document.getElementById('bm-floater-net');
        if(show) {
            if(panel) panel.style.display = 'flex';
            if(btn) btn.style.display = 'none';
        } else {
            if(panel) panel.style.display = 'none';
            if(btn) btn.style.display = 'flex';
        }
    }

    function createFloaters() {
        if (document.getElementById('bm-controls')) return;
        const con = document.createElement('div');
        con.id = 'bm-controls';

        const btnMain = document.createElement('div');
        btnMain.className = 'bm-float-btn';
        btnMain.id = 'bm-floater-main';
        btnMain.innerHTML = '<span>🤖</span>';
        btnMain.onclick = () => toggleMain(true);

        const btnNet = document.createElement('div');
        btnNet.className = 'bm-float-btn';
        btnNet.id = 'bm-floater-net';
        btnNet.innerHTML = '<span>🌐</span>';
        btnNet.onclick = () => toggleNet(true);

        const btnUpdate = document.createElement('div');
        btnUpdate.className = 'bm-float-btn';
        btnUpdate.id = 'bm-floater-update';
        btnUpdate.innerHTML = '<span>🔄</span>';
        btnUpdate.onclick = () => { if(confirm('بروزرسانی؟')) window.open(UPDATE_URL, '_blank'); };

        con.appendChild(btnMain);
        con.appendChild(btnNet);
        con.appendChild(btnUpdate);
        document.body.appendChild(con);
    }

    function createUI() {
        const exist = document.querySelector('.bm-container');
        if (exist) exist.remove();
        initMonitor();
        createFloaters();
        const div = document.createElement('div');
        div.className = 'bm-container';
        document.body.appendChild(div);
        toggleMain(true);
        toggleNet(false); // در موبایل پیش فرض بسته باشد بهتر است
        return div;
    }

    function renderLogin() {
        const div = createUI();
        div.innerHTML = `
            <div class="bm-header">
                <span>🔐 ورود موبایل</span>
                <span class="bm-close-btn" onclick="document.querySelector('.bm-container').style.display='none'; document.getElementById('bm-floater-main').style.display='flex';">✖</span>
            </div>
            <div class="bm-content">
                <input id="bm-user" class="bm-input" type="tel" placeholder="کد ملی">
                <input id="bm-pass" type="password" class="bm-input" placeholder="رمز عبور">
                <div style="text-align:center;cursor:pointer" id="bm-cap-box"><small>Loading...</small></div>
                <input id="bm-cap-input" class="bm-input" type="tel" placeholder="کد امنیتی">
                <button id="bm-login-btn" class="bm-btn">ورود</button>
                <div id="bm-log-box" class="bm-log">منتظر ورود...</div>
            </div>
        `;
        const refresh = async () => {
            const box = document.getElementById('bm-cap-box');
            const inp = document.getElementById('bm-cap-input');
            box.innerHTML = '<small>...</small>';
            try {
                const cap = await getCaptcha();
                loginCapToken = cap.tid;
                box.innerHTML = `<img src="${cap.url}" class="bm-captcha-img">`;
                box.onclick = refresh;
                inp.placeholder = "حل خودکار...";
                const txt = await solveCaptcha(cap.url);
                if(txt) { inp.value = txt; inp.style.borderColor = '#00e676'; }
            } catch { box.innerHTML = 'خطا در لود'; }
        };
        refresh();
        document.getElementById('bm-login-btn').onclick = async () => {
            const u = document.getElementById('bm-user').value;
            const p = document.getElementById('bm-pass').value;
            const c = document.getElementById('bm-cap-input').value;
            if (!u || !p || !c) return log('فیلدها خالی است');

            log('🔄 در حال ورود...');
            try {
                const res = await request(`${API_BASE}/identity/login`, 'POST', {
                    nationalCode: u, password: p, captchaResult: c, captchaToken: loginCapToken, captchaResponse: ""
                }, false);

                let token = res.token?.token || res.data?.token?.token;
                let user = res.customer || res.data?.customer;

                if (token) {
                    log('✅ ورود موفق!');
                    localStorage.setItem('bm_token', JSON.stringify(res.token || res.data.token));
                    if(user) localStorage.setItem('bm_user', JSON.stringify(user));
                    renderDashboard(user);
                } else {
                    log('❌ ' + (res.message || 'خطا در ورود'));
                    refresh();
                }
            } catch (e) { log('❌ ' + e); refresh(); }
        };
    }

    function getProvinceOptions(selectedId) {
        return PROVINCES.map(p =>
            `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.title}</option>`
        ).join('');
    }

    function renderDashboard(user) {
        const div = createUI();
        const cfg = getUserConfig();
        const name = user ? `${user.firstName} ${user.lastName}` : 'کاربر';
        div.innerHTML = `
            <div class="bm-header">
                <div>
                    <span>🏎️ خرید موبایل</span>
                    <br><span style="font-size:11px;color:#00e676">${name}</span>
                </div>
                <span class="bm-close-btn" onclick="document.querySelector('.bm-container').style.display='none'; document.getElementById('bm-floater-main').style.display='flex';">✖</span>
            </div>
            <div class="bm-content">
                <div class="bm-row">
                    <div>
                        <div class="bm-label">خودرو</div>
                        <input id="cfg-car" class="bm-input" value="${cfg.targetCar}">
                    </div>
                    <div>
                        <div class="bm-label">فیلتر (اختیاری)</div>
                        <input id="cfg-keywords" class="bm-input" value="${cfg.planKeywords}">
                    </div>
                </div>
                <div class="bm-row">
                    <div>
                        <div class="bm-label">قیمت</div>
                        <input id="cfg-price" class="bm-input" type="tel" value="${cfg.targetPrice}">
                    </div>
                     <div>
                        <div class="bm-label">رنگ‌ها</div>
                        <input id="cfg-color" class="bm-input" value="${cfg.colorPriorities}">
                    </div>
                </div>
                <div class="bm-row">
                    <div>
                        <div class="bm-label">استان</div>
                        <select id="cfg-province" class="bm-select bm-input">
                            ${getProvinceOptions(cfg.provinceId)}
                        </select>
                    </div>
                    <div>
                        <div class="bm-label">شهر</div>
                        <input id="cfg-cityname" class="bm-input" value="${cfg.cityName}">
                    </div>
                </div>

                <button id="bm-start" class="bm-btn">شروع خرید</button>
                <button id="bm-stop" class="bm-btn" style="background:#e65100;display:none">توقف</button>
                <button id="bm-logout" class="bm-btn" style="background:#d32f2f;margin-top:5px">خروج</button>
                <div id="bm-log-box" class="bm-log">آماده...</div>
            </div>
        `;
        const toggle = (run) => {
            isRunning = run;
            document.getElementById('bm-start').style.display = run ? 'none' : 'block';
            document.getElementById('bm-stop').style.display = run ? 'block' : 'none';
        };
        document.getElementById('bm-start').onclick = () => {
            const newCfg = {
                targetCar: document.getElementById('cfg-car').value.trim(),
                planKeywords: document.getElementById('cfg-keywords').value.trim(),
                targetPrice: document.getElementById('cfg-price').value.trim().replace(/[,،]/g, ''),
                provinceId: document.getElementById('cfg-province').value,
                cityName: document.getElementById('cfg-cityname').value.trim(),
                bankName: DEFAULT_CONFIG.bankName,
                colorPriorities: document.getElementById('cfg-color').value.trim()
            };
            saveUserConfig(newCfg);
            toggle(true);
            startBuyingFlow(newCfg).finally(() => toggle(false));
        };
        document.getElementById('bm-stop').onclick = () => { log('🛑 توقف کاربر'); toggle(false); };
        document.getElementById('bm-logout').onclick = () => {
            localStorage.clear();
            renderLogin();
        };
    }

    function askCaptcha(imgUrl) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:200000;display:flex;justify-content:center;align-items:center";
            overlay.innerHTML = `
                <div style="background:#1A1B26;padding:20px;border-radius:12px;width:90%;max-width:350px;text-align:center;border:1px solid #00e676;">
                    <h3 style="color:#fff;margin:0 0 10px">کد امنیتی</h3>
                    <img src="${imgUrl}" style="width:100%;border-radius:6px;background:#fff;height:80px;object-fit:contain;margin-bottom:10px">
                    <div id="cap-status" style="margin-bottom:5px;color:#aaa">حل خودکار...</div>
                    <input id="pop-input" class="bm-input" type="tel" style="font-size:24px;letter-spacing:5px" autocomplete="off">
                    <button id="pop-btn" class="bm-btn" style="margin-top:10px">تایید</button>
                </div>
            `;
            document.body.appendChild(overlay);
            const inp = overlay.querySelector('#pop-input');
            const status = overlay.querySelector('#cap-status');
            const btn = overlay.querySelector('#pop-btn');

            inp.focus();
            const submit = () => { if(inp.value) { overlay.remove(); resolve(inp.value); } };
            btn.onclick = submit;
            inp.onkeydown = e => { if(e.key === 'Enter') submit(); };

            solveCaptcha(imgUrl).then(text => {
                if (text) {
                    inp.value = text;
                    status.innerText = "✅ حل شد!";
                    status.style.color = "#00e676";
                    setTimeout(submit, 500);
                } else {
                    status.innerText = "❌ دستی وارد کنید";
                    status.style.color = "#f44336";
                }
            });
        });
    }

    async function startBuyingFlow(userConfig) {
        try {
            let product = null;
            await retryUntilSuccess('جستجوی خودرو', async () => {
                const homeRes = await request(`${API_BASE}/HomeItem/GetHomeItems?GetDataType=0`);
                const items = homeRes.data || homeRes;
                product = items.find(i => (i.title && i.title.includes(userConfig.targetCar)) || (i.titleDetails && i.titleDetails.includes(userConfig.targetCar)));
                return product;
            }, 1000);

            log(`✅ یافت شد: ${product.title}`);

            let activeCirc = null;
            await retryUntilSuccess('جستجوی بخشنامه', async () => {
                const circRes = await request(`${API_BASE}/circulation/getCirculationData`, 'POST', {
                    CarModelId: String(product.productGroup || product.id), getDataType: 0
                });
                const circs = circRes.data || circRes;
                const activeCircs = circs.filter(c => (c.isOnSale === "1" || c.isOnSale === true) && c.circulationColors?.length > 0);
                if (activeCircs.length === 0) return null;

                const targetP = parseInt(userConfig.targetPrice);
                const keywords = userConfig.planKeywords ? userConfig.planKeywords.split(/[,،\s]+/).filter(k => k.trim().length > 0).map(normalizePersian) : [];

                if (targetP || keywords.length > 0) {
                    activeCirc = activeCircs.find(c => {
                        const titleNorm = normalizePersian(c.title + " " + (c.titleDetails || ""));
                        let priceMatch = targetP > 0 ? (parseInt(c.basePrice) === targetP) : true;
                        let keywordMatch = keywords.length > 0 ? keywords.every(k => titleNorm.includes(k)) : true;
                        return priceMatch && keywordMatch;
                    });
                }
                if (!activeCirc) activeCirc = activeCircs[0];
                return activeCirc;
            }, 1000);

            log(`✅ بخشنامه: ${activeCirc.title}`);

            let orderId = null;
            while (isRunning && !orderId) {
                try {
                    const cap1 = await getCaptcha();
                    const cap1Val = await askCaptcha(cap1.url);
                    if (!isRunning) return;

                    log('🚀 ارسال سفارش...');
                    const opts = (activeCirc.options || []).map(o => String(o.id));
                    let selectedColor = null;
                    const colors = activeCirc.circulationColors;
                    const prefs = userConfig.colorPriorities.split(/[,،]/).map(s => normalizePersian(s));
                    for (let pref of prefs) {
                        if(!pref) continue;
                        const found = colors.find(c => normalizePersian(c.plainColor).includes(pref));
                        if (found) { selectedColor = found; break; }
                    }
                    if (!selectedColor) selectedColor = colors[0];

                    const regPayload = {
                        branchId: 0,
                        cirId: String(activeCirc.id),
                        crcl_Row: String(activeCirc.crcl_row || activeCirc.rowId),
                        circOpIds: opts,
                        color_code: String(selectedColor.colorCode),
                        count: 1,
                        carVINNumber: "", carChassisNumber: "", carEngineNumber: "", carType: "", carName: "", capacity: "",
                        captchaResponse: "",
                        captchaToken: String(cap1.tid),
                        captchaResult: String(cap1Val)
                    };

                    const regRes = await request(`${API_BASE}/order/register`, 'POST', regPayload);
                    const orderData = regRes.data || regRes;

                    if (orderData.id && orderData.id !== "0") {
                        orderId = orderData.id;
                        log(`✅ سفارش ثبت شد: ${orderId}`);

                        // مرحله بانک و نمایندگی
                        const banks = orderData.banks || [];
                        let bank = banks[Math.floor(Math.random() * banks.length)] || { bankName: userConfig.bankName };

                        // جستجوی نمایندگی
                        await request(`${API_BASE}/branch/getCirculationBranchProvinceCity`, 'POST', {
                             provinceId: String(userConfig.provinceId), circulationId: String(selectedColor.circulationId)
                        });
                        const citiesRes = await request(`${API_BASE}/branch/getCirculationBranchProvinceCity`, 'POST', {
                            provinceId: String(userConfig.provinceId), circulationId: String(selectedColor.circulationId)
                        });
                        const cities = citiesRes.data || citiesRes;
                        const targetCity = normalizePersian(userConfig.cityName);
                        let selectedCity = cities.find(c => normalizePersian(c.title).includes(targetCity)) || cities[0];

                        const branchRes = await request(`${API_BASE}/branch/getCirculationBranchCity`, 'POST', {
                            cityCode: String(selectedCity.code || selectedCity.id), circulationId: String(selectedColor.circulationId)
                        });
                        const branches = branchRes.data || branchRes;
                        if(!branches || !branches.length) throw new Error('نمایندگی پر شد');

                        const cap2 = await getCaptcha();
                        const cap2Val = await askCaptcha(cap2.url);

                        const fillRes = await request(`${API_BASE}/fillConfirm/post`, 'POST', {
                            onlineshoppingId: String(orderId),
                            bankName: bank.bankName,
                            branchId: String(branches[0].id),
                            ticket: 'no-ticket',
                            captchaResponse: "",
                            captchaToken: String(cap2.tid),
                            captchaResult: String(cap2Val)
                        });

                        const fillData = fillRes.data || fillRes;
                        if(fillData.queueId) {
                            log(`✅ در صف: ${fillData.queueId}`);
                            await checkResultLoop(fillData.queueId, orderId);
                            return;
                        }
                    } else {
                        log(`⚠️ ${orderData.errors?.[0]?.errorDescription || 'خطا در ثبت'}`);
                    }
                } catch (e) {
                    log(`⚠️ ${e}`);
                    await sleep(1000);
                }
            }
        } catch (e) {
            log(`❌ ${e}`);
            isRunning = false;
        }
    }

    async function checkResultLoop(queueId, orderId) {
        for(let i=0; i<60 && isRunning; i++) {
             const check = await request(`${API_BASE}/bank/checkResult`, 'POST', { queueId: String(queueId), orderId: String(orderId) });
             const d = check.data || check;
             if(d.nextPageUrl) {
                 log('🚀 انتقال به بانک...');
                 window.location.href = d.nextPageUrl;
                 return;
             }
             log(`⏳ در صف... ${i}`);
             await sleep(1000);
        }
    }

    // شروع برنامه
    const t = localStorage.getItem('bm_token');
    const u = localStorage.getItem('bm_user');
    if (t && u) { try { renderDashboard(JSON.parse(u)); } catch { renderLogin(); } } else { renderLogin(); }

})();
