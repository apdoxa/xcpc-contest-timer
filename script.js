const modal = document.getElementById('settings-modal');
const settingsToggleBtn = document.getElementById('settings-toggle');
const themeToggleBtn = document.getElementById('theme-toggle');
const saveSettingsBtn = document.getElementById('save-settings-btn');

const pageTitleInput = document.getElementById('page-title');
const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');
const warningRatioInput = document.getElementById('warning-ratio');
const warningTimeInput = document.getElementById('warning-time');
const finalWarningInput = document.getElementById('final-warning');
const legendToggleBtn = document.getElementById('legend-toggle');
const timezoneOffsetInput = document.getElementById('timezone-offset');
const tzBtnUp = document.getElementById('tz-btn-up');
const tzBtnDown = document.getElementById('tz-btn-down');
const wrBtnUp = document.getElementById('wr-btn-up');
const wrBtnDown = document.getElementById('wr-btn-down');
const fwBtnUp = document.getElementById('fw-btn-up');
const fwBtnDown = document.getElementById('fw-btn-down');

const mainTitleEl = document.getElementById('main-title');
const timezoneDisplayEl = document.getElementById('timezone-display');
const currentTimeEl = document.getElementById('current-time-display');
const bigTextEl = document.getElementById('big-text');
const elapsedTimeEl = document.getElementById('elapsed-time');
const remainingTimeEl = document.getElementById('remaining-time');
const progressBarFill = document.getElementById('progress-bar-fill');
const legendBarContainer = document.getElementById('legend-bar-container');

let startTime = null;
let endTime = null;
let isDarkMode = false;
let warningRatio = 0.20;
let tzOffsetHours = 8;
let finalWarningMin = 3;
let isLegendVisible = true;

function formatTzOffset(tzOffsetFloat) {
    const isNegative = tzOffsetFloat < 0;
    const sign = isNegative ? '-' : '+';
    const abs = Math.abs(tzOffsetFloat);
    const hh = String(Math.floor(abs)).padStart(2, '0');
    const mm = String(Math.floor((abs % 1) * 60)).padStart(2, '0');
    return `${sign}${hh}:${mm}`;
}

function parseTzOffset(tzOffsetStr) {
    if (!tzOffsetStr) return NaN;
    if (!tzOffsetStr.includes(':')) {
        const val = parseFloat(tzOffsetStr);
        if (!isNaN(val)) return val;
    }
    const match = tzOffsetStr.trim().match(/^([+-]?)(\d{1,2}):(\d{2})$/);
    if (!match) return NaN;
    const sign = match[1] === '-' ? -1 : 1;
    const h = parseInt(match[2], 10);
    const m = parseInt(match[3], 10);
    return sign * (h + m / 60);
}

function formatDuration(totalSecs) {
    const isNegative = totalSecs < 0;
    totalSecs = Math.abs(totalSecs);

    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60) % 60;
    const hours = Math.floor(totalSecs / 3600);
    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');

    return {
        sign: isNegative ? '-' : '',
        time: `${hh}:${mm}:${ss}`
    };
}

function formatClock(date) {
    const targetMs = date.getTime() + tzOffsetHours * 3600000;
    const d = new Date(targetMs);
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

function formatForInput(date, tzOffsetH) {
    const targetMs = date.getTime() + tzOffsetH * 3600000;
    const d = new Date(targetMs);
    const YYYY = d.getUTCFullYear();
    const MM = String(d.getUTCMonth() + 1).padStart(2, '0');
    const DD = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}`;
}

function parseLocalInput(timeStr, tzOffsetH) {
    let fullStr = timeStr;
    if (fullStr.length === 16) fullStr += ':00';

    const offsetStr = formatTzOffset(tzOffsetH);
    return new Date(`${fullStr}${offsetStr}`);
}

function getTotalDurationMin() {
    const startStr = startTimeInput.value;
    const endStr = endTimeInput.value;

    if (!startStr || !endStr) return 0;
    const startObj = new Date(startStr);
    const endObj = new Date(endStr);

    if (isNaN(startObj) || isNaN(endObj)) return 0;
    const diffMin = (endObj - startObj) / 60000;
    return diffMin > 0 ? diffMin : 0;
}

function syncWarningTimeFromRatio() {
    let r = parseFloat(warningRatioInput.value);

    if (isNaN(r)) return;
    const totalMin = getTotalDurationMin();
    const wMin = totalMin * r;

    if (warningTimeInput) warningTimeInput.value = parseFloat(wMin.toFixed(2)).toString();
}

function syncWarningRatioFromTime() {
    let wMin = parseFloat(warningTimeInput.value);

    if (isNaN(wMin)) return;
    const totalMin = getTotalDurationMin();

    if (totalMin > 0) {
        let r = wMin / totalMin;
        if (r > 1) r = 1;
        if (r < 0) r = 0;
        warningRatioInput.value = parseFloat(r.toFixed(4)).toString();
    } else {
        warningRatioInput.value = '0';
    }
}

function updateLegendMarkers() {
    if (!startTime || !endTime) return;

    const t0 = startTime;
    const totalMs = endTime - startTime;
    const warningT = 1.0 - warningRatio;
    const t1 = new Date(startTime.getTime() + totalMs * warningT);
    const t2 = new Date(endTime.getTime() - finalWarningMin * 60 * 1000);
    const t3 = endTime;

    const m1 = document.getElementById('marker-1');
    const m2 = document.getElementById('marker-2');
    const m3 = document.getElementById('marker-3');
    const m4 = document.getElementById('marker-4');

    if (m1) m1.textContent = formatClock(t0);
    if (m2) m2.textContent = formatClock(t1);
    if (m3) m3.textContent = formatClock(t2);
    if (m4) m4.textContent = formatClock(t3);
}

function initSettings() {
    const savedTitle = localStorage.getItem('xcpc-title') || 'XCPC Contest Timer';
    const savedStart = localStorage.getItem('xcpc-start');
    const savedEnd = localStorage.getItem('xcpc-end');
    const savedTheme = localStorage.getItem('xcpc-theme') || 'light';
    const savedWarningRatio = localStorage.getItem('xcpc-warning-ratio');
    const savedFinalWarning = localStorage.getItem('xcpc-final-warning');
    const savedLegend = localStorage.getItem('xcpc-legend');
    const savedTz = localStorage.getItem('xcpc-tz');

    if (savedTz !== null) {
        tzOffsetHours = parseFloat(savedTz);
    }

    timezoneOffsetInput.value = formatTzOffset(tzOffsetHours);
    timezoneDisplayEl.textContent = `UTC${formatTzOffset(tzOffsetHours)}`;

    if (savedLegend === 'hidden') {
        isLegendVisible = false;
        legendBarContainer.classList.add('hidden');
    }

    pageTitleInput.value = savedTitle;
    if (savedWarningRatio !== null) {
        warningRatio = parseFloat(savedWarningRatio);
    }

    warningRatioInput.value = warningRatio;

    if (savedFinalWarning !== null) {
        finalWarningMin = parseFloat(savedFinalWarning);
    }
    finalWarningInput.value = finalWarningMin;

    mainTitleEl.textContent = savedTitle;
    document.title = savedTitle;

    if (savedStart && savedEnd) {
        startTime = new Date(savedStart);
        endTime = new Date(savedEnd);
    } else {
        const now = new Date();
        const later = new Date(now.getTime() + 5 * 3600 * 1000);
        startTime = now;
        endTime = later;
    }

    startTimeInput.value = formatForInput(startTime, tzOffsetHours);
    endTimeInput.value = formatForInput(endTime, tzOffsetHours);
    syncWarningTimeFromRatio();

    if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        isDarkMode = false;
    } else {
        document.body.classList.add('dark-mode');
        isDarkMode = true;
    }
    updateLegendMarkers();
}

function saveSettings() {
    const title = pageTitleInput.value.trim() || 'TIME';
    const startStr = startTimeInput.value;
    const endStr = endTimeInput.value;

    if (!startStr || !endStr) {
        alert("请输入完整的开始和结束时间");
        return;
    }

    const tzVal = parseTzOffset(timezoneOffsetInput.value);
    if (isNaN(tzVal) || tzVal < -12 || tzVal > 14) {
        alert("格式请使用类似于 +08:00 的形式");
        return;
    }

    tzOffsetHours = tzVal;

    const start = parseLocalInput(startStr, tzOffsetHours);
    const end = parseLocalInput(endStr, tzOffsetHours);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        alert("时间格式无法解析");
        return;
    }

    if (start >= end) {
        alert("结束时间必须晚于开始时间");
        return;
    }

    const ratioVal = parseFloat(warningRatioInput.value);
    if (isNaN(ratioVal) || ratioVal < 0 || ratioVal > 1) {
        alert("提醒比例必须在 0 到 1 之间");
        return;
    }

    const finalWarningVal = parseFloat(finalWarningInput.value);
    if (isNaN(finalWarningVal) || finalWarningVal < 0) {
        alert("最后提醒时间必须为大于或等于 0 的数字");
        return;
    }

    const wrongPenaltyVal = parseFloat(wrongPenaltyInput.value);
    if (isNaN(wrongPenaltyVal) || wrongPenaltyVal < 0) {
        alert("每次错误罚时必须为大于或等于 0 的数字");
        return;
    }

    const problemCountVal = parseInt(problemCountInput.value, 10);
    if (isNaN(problemCountVal) || problemCountVal < 1 || problemCountVal > 26) {
        alert("题目数量必须在 1 到 26 之间");
        return;
    }

    startTime = start;
    endTime = end;
    warningRatio = ratioVal;
    finalWarningMin = finalWarningVal;

    localStorage.setItem('xcpc-title', title);
    localStorage.setItem('xcpc-start', startTime.toISOString());
    localStorage.setItem('xcpc-end', endTime.toISOString());
    localStorage.setItem('xcpc-warning-ratio', warningRatio.toString());
    localStorage.setItem('xcpc-final-warning', finalWarningMin.toString());
    localStorage.setItem('xcpc-tz', tzOffsetHours.toString());

    timezoneDisplayEl.textContent = `UTC${formatTzOffset(tzOffsetHours)}`;
    timezoneOffsetInput.value = formatTzOffset(tzOffsetHours);
    mainTitleEl.textContent = title;
    document.title = title;

    modal.classList.add('hidden');
    updateLegendMarkers();
    updateLoop();

    applyPenaltySettings(wrongPenaltyVal, problemCountVal);
}

function updateLoop() {
    const now = new Date();
    currentTimeEl.textContent = formatClock(now);

    if (!startTime || !endTime) return;
    const totalMs = endTime - startTime;
    const elapsedMs = now - startTime;
    const remainingMs = endTime - now;

    let ratio = elapsedMs / totalMs;
    if (ratio < 0) ratio = 0;
    if (ratio > 1) ratio = 1;

    progressBarFill.style.width = `${ratio * 100}%`;
    let displayElapsed_ms = elapsedMs;
    if (elapsedMs < 0) displayElapsed_ms = 0;
    if (elapsedMs > totalMs) displayElapsed_ms = totalMs;


    let displayRemaining_ms = remainingMs;
    if (remainingMs < 0) displayRemaining_ms = 0;
    if (remainingMs > totalMs) displayRemaining_ms = totalMs;


    const eSecs = Math.floor((elapsedMs >= 0 ? displayElapsed_ms : elapsedMs) / 1000);
    const rSecs = Math.ceil(displayRemaining_ms / 1000);
    const eFmt = formatDuration(eSecs);
    const rFmt = formatDuration(rSecs);

    elapsedTimeEl.textContent = `${eFmt.sign}${eFmt.time}`;
    remainingTimeEl.textContent = rFmt.time;

    let phase = 'run';
    const warningThreshold = 1.0 - warningRatio;
    let currentPhaseIdx = 1;

    if (elapsedMs < 0) {
        phase = 'pending';
        currentPhaseIdx = 0;
    } else if (ratio >= 1.0) {
        phase = 'done';
        currentPhaseIdx = 4;
    } else if (remainingMs <= finalWarningMin * 60 * 1000 && remainingMs > 0) {
        phase = 'final';
        currentPhaseIdx = 3;
    } else if (ratio >= warningThreshold) {
        phase = 'warn';
        currentPhaseIdx = 2;
    }

    progressBarFill.dataset.phase = phase;
    bigTextEl.dataset.phase = phase;

    const segments = document.querySelectorAll('.legend-segment');
    segments.forEach((seg, idx) => {
        if (idx < currentPhaseIdx) {

            seg.classList.add('passed-segment');
        } else {
            seg.classList.remove('passed-segment');
        }
    });

    if (elapsedMs < 0) {
        bigTextEl.textContent = `${eFmt.sign}${eFmt.time}`;
    }
    else if (ratio < warningThreshold) {
        bigTextEl.textContent = `+${eFmt.time}`;
    }
    else if (ratio < 1.0) {
        bigTextEl.textContent = `-${rFmt.time}`;
    }
    else {
        bigTextEl.textContent = `+${eFmt.time}`;
    }
}

settingsToggleBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
});

function adjustTzInput(deltaHours) {
    let currentTz = parseTzOffset(timezoneOffsetInput.value);
    if (isNaN(currentTz)) currentTz = 8;
    let newTz = currentTz + deltaHours;
    if (newTz > 14) newTz = 14;
    if (newTz < -12) newTz = -12;
    timezoneOffsetInput.value = formatTzOffset(newTz);
}

tzBtnUp.addEventListener('click', () => adjustTzInput(0.5));
tzBtnDown.addEventListener('click', () => adjustTzInput(-0.5));

timezoneOffsetInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        adjustTzInput(0.5);
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        adjustTzInput(-0.5);
    }
});

function adjustWrInput(delta) {
    let current = parseFloat(warningRatioInput.value);
    if (isNaN(current)) current = 0.20;
    let next = current + delta;
    if (next > 1) next = 1;
    if (next < 0) next = 0;
    warningRatioInput.value = next.toFixed(2);
    syncWarningTimeFromRatio();
}

wrBtnUp.addEventListener('click', () => adjustWrInput(0.01));
wrBtnDown.addEventListener('click', () => adjustWrInput(-0.01));

warningRatioInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        adjustWrInput(0.01);
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        adjustWrInput(-0.01);
    }
});

warningRatioInput.addEventListener('input', syncWarningTimeFromRatio);
warningTimeInput.addEventListener('input', syncWarningRatioFromTime);
startTimeInput.addEventListener('input', syncWarningTimeFromRatio);
endTimeInput.addEventListener('input', syncWarningTimeFromRatio);

function adjustFwInput(delta) {
    let current = parseFloat(finalWarningInput.value);
    if (isNaN(current)) current = 3;
    let next = current + delta;
    if (next < 0) next = 0;
    finalWarningInput.value = Number(next.toFixed(2)).toString();
}

fwBtnUp.addEventListener('click', () => adjustFwInput(0.5));
fwBtnDown.addEventListener('click', () => adjustFwInput(-0.5));

finalWarningInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        adjustFwInput(0.5);
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        adjustFwInput(-0.5);
    }
});

legendToggleBtn.addEventListener('click', () => {
    isLegendVisible = !isLegendVisible;
    if (isLegendVisible) {
        legendBarContainer.classList.remove('hidden');
        localStorage.setItem('xcpc-legend', 'visible');
    } else {
        legendBarContainer.classList.add('hidden');
        localStorage.setItem('xcpc-legend', 'hidden');
    }
});

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    isDarkMode = document.body.classList.contains('dark-mode');

    if (!isDarkMode) {
        document.body.classList.remove("color-scheme-dark");
    } else {
        document.body.classList.add("color-scheme-dark");
    }

    localStorage.setItem('xcpc-theme', isDarkMode ? 'dark' : 'light');
});

/* ===================== 罚时板 Penalty Board ===================== */
/*
 * 标准 ICPC 罚时：只有已通过的题目计罚时
 *   罚时 = 该题 AC 时刻(赛时分钟, 向下取整) + 每次错误罚时 × AC 之前的错误提交次数
 * 未通过的题目不计罚时；AC 之后的提交不计罚时。
 * 界面只用颜色表达状态：绿色 = 已通过，红色 = 有错误未通过，灰蓝 = 未提交。
 */

const PB_STORAGE_KEY = 'xcpc-vp-board';
const PB_DEFAULT_PROBLEM_COUNT = 15;
const PB_DEFAULT_WRONG_PENALTY = 20;
const PB_MAX_PROBLEMS = 26;

const pbGrid = document.getElementById('pb-grid');
const pbSummaryEl = document.getElementById('pb-summary-text');
const pbPicker = document.getElementById('pb-picker');
const pbSheet = document.getElementById('pb-sheet');
const pbSheetClose = document.getElementById('pb-sheet-close');
const pbAddBtn = document.getElementById('pb-add');
const pbAcBtn = document.getElementById('pb-ac');
const pbWaBtn = document.getElementById('pb-wa');
const pbResetSettingsBtn = document.getElementById('pb-reset-settings');
const toastEl = document.getElementById('toast');
const wrongPenaltyInput = document.getElementById('wrong-penalty');
const problemCountInput = document.getElementById('problem-count');
const wpBtnUp = document.getElementById('wp-btn-up');
const wpBtnDown = document.getElementById('wp-btn-down');
const pcBtnUp = document.getElementById('pc-btn-up');
const pcBtnDown = document.getElementById('pc-btn-down');

let problemCount = PB_DEFAULT_PROBLEM_COUNT;
let penaltyPerWrong = PB_DEFAULT_WRONG_PENALTY;
let pbData = {};
let pbSeq = 0;
let pbSelected = 'A';
let pbToastTimer = null;

function pbLetter(index) {
    return String.fromCharCode(65 + index);
}

function pbSubs(letter) {
    if (!pbData[letter] || !Array.isArray(pbData[letter].subs)) {
        pbData[letter] = { subs: [] };
    }
    return pbData[letter].subs;
}

function pbSave() {
    try {
        localStorage.setItem(PB_STORAGE_KEY, JSON.stringify({ seq: pbSeq, problems: pbData }));
    } catch (e) {
        /* 存储不可用时忽略 */
    }
}

function pbLoad() {
    let raw = null;
    try {
        raw = localStorage.getItem(PB_STORAGE_KEY);
    } catch (e) {
        raw = null;
    }

    if (raw) {
        try {
            const obj = JSON.parse(raw);
            if (obj && typeof obj === 'object') {
                if (obj.problems && typeof obj.problems === 'object') pbData = obj.problems;
                if (typeof obj.seq === 'number' && isFinite(obj.seq)) pbSeq = obj.seq;
            }
        } catch (e) {
            pbData = {};
        }
    }

    // 规范化：任何非 AC 的状态都视为错误提交
    const normalized = {};
    Object.keys(pbData).forEach((letter) => {
        const entry = pbData[letter];
        if (!letter.match(/^[A-Z]$/) || !entry || !Array.isArray(entry.subs)) return;

        const subs = [];
        entry.subs.forEach((s) => {
            if (!s || typeof s.timeSec !== 'number') return;
            const timeSec = Math.max(0, Math.round(s.timeSec));
            if (!isFinite(timeSec)) return;
            pbSeq++;
            subs.push({
                id: 's' + pbSeq,
                status: s.status === 'AC' ? 'AC' : 'WA',
                timeSec: timeSec,
                seq: pbSeq
            });
        });
        if (subs.length) normalized[letter] = { subs: subs };
    });
    pbData = normalized;
}

function pbNowSec() {
    if (!startTime) return 0;
    return Math.max(0, Math.floor((Date.now() - startTime.getTime()) / 1000));
}

function pbCompute(letter) {
    const subs = pbSubs(letter).slice().sort((a, b) => (a.timeSec - b.timeSec) || (a.seq - b.seq));
    let ac = null;
    let wrong = 0;

    for (let i = 0; i < subs.length; i++) {
        if (subs[i].status === 'AC') {
            ac = subs[i];
            break;
        }
        wrong++;
    }

    const acMin = ac ? Math.floor(ac.timeSec / 60) : 0;

    return {
        subs: subs,
        ac: ac,
        wrong: wrong,
        acMin: acMin,
        penalty: ac ? (acMin + wrong * penaltyPerWrong) : 0,
        solved: !!ac
    };
}

function pbTotals() {
    let solved = 0;
    let penalty = 0;

    for (let i = 0; i < problemCount; i++) {
        const info = pbCompute(pbLetter(i));
        if (!info.solved) continue;
        solved++;
        penalty += info.penalty;
    }

    return { solved: solved, penalty: penalty };
}

function pbFmtShort(totalSec) {
    const sec = Math.max(0, Math.floor(totalSec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor(sec / 60) % 60;
    const s = sec % 60;
    if (h > 0) {
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function pbToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    if (pbToastTimer) clearTimeout(pbToastTimer);
    pbToastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600);
}

function pbStateClass(letter) {
    const info = pbCompute(letter);
    if (info.solved) return 'is-ac';
    if (info.subs.length) return 'is-wa';
    return '';
}

function pbCellTitle(letter) {
    const info = pbCompute(letter);
    if (info.solved) {
        return `${letter} 题：AC ${pbFmtShort(info.ac.timeSec)}`
            + (info.wrong ? ` · 错 ${info.wrong} 次` : '')
            + ` · 罚时 ${info.penalty} min（点击可清除该题记录）`;
    }
    if (info.subs.length) {
        return `${letter} 题：未通过 · ${info.subs.length} 次提交（点击可清除该题记录）`;
    }
    return `${letter} 题：未提交（点击记录提交）`;
}

function pbRecord(letter, isAc) {
    const notStarted = !!(startTime && Date.now() < startTime.getTime());
    const timeSec = pbNowSec();

    pbSeq++;
    pbSubs(letter).push({
        id: 's' + pbSeq,
        status: isAc ? 'AC' : 'WA',
        timeSec: timeSec,
        seq: pbSeq
    });

    pbSave();
    pbRender();

    const label = isAc ? '正确' : '错误';
    if (notStarted) {
        pbToast(`${letter} 题 · ${label}（比赛未开始，记为 00:00）`);
    } else {
        pbToast(`${letter} 题 · ${label} · 赛时 ${pbFmtShort(timeSec)}`);
    }
}

function pbClearProblem(letter) {
    if (pbData[letter]) delete pbData[letter];
    pbSave();
    pbRender();
    pbToast(`${letter} 题记录已清除`);
}

function pbClearAll() {
    if (!confirm('确定要清空罚时板的所有记录吗？此操作不可撤销。')) return;
    pbData = {};
    pbSave();
    pbRender();
    pbToast('罚时板已清空');
}

function pbRender() {
    if (!pbGrid) return;

    // 字母格
    const gridFrag = document.createDocumentFragment();
    for (let i = 0; i < problemCount; i++) {
        const letter = pbLetter(i);
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = ('pb-cell ' + pbStateClass(letter)).trim();
        cell.dataset.letter = letter;
        cell.textContent = letter;
        cell.title = pbCellTitle(letter);
        gridFrag.appendChild(cell);
    }
    pbGrid.innerHTML = '';
    pbGrid.appendChild(gridFrag);

    // 选择器
    if (pbPicker) {
        const pickFrag = document.createDocumentFragment();
        for (let i = 0; i < problemCount; i++) {
            const letter = pbLetter(i);
            const pick = document.createElement('button');
            pick.type = 'button';
            pick.className = ('pb-pick ' + pbStateClass(letter) + (letter === pbSelected ? ' selected' : '')).trim();
            pick.dataset.letter = letter;
            pick.textContent = letter;
            pick.title = pbCellTitle(letter);
            pickFrag.appendChild(pick);
        }
        pbPicker.innerHTML = '';
        pbPicker.appendChild(pickFrag);
    }

    // 汇总
    if (pbSummaryEl) {
        const totals = pbTotals();
        pbSummaryEl.textContent = `已通过 ${totals.solved} · 罚时 ${totals.penalty}`;
        pbSummaryEl.title = `罚时单位：分钟（AC 时刻 + ${penaltyPerWrong} × 错误次数）`;
    }
}

function pbFirstUnsolved() {
    for (let i = 0; i < problemCount; i++) {
        const letter = pbLetter(i);
        if (!pbCompute(letter).solved) return letter;
    }
    return 'A';
}

function pbOpenSheet(letter) {
    if (!pbSheet) return;

    const index = letter ? letter.charCodeAt(0) - 65 : -1;
    pbSelected = (index >= 0 && index < problemCount) ? letter : pbFirstUnsolved();

    pbSheet.classList.remove('hidden');
    pbRender();
}

function pbCloseSheet() {
    if (pbSheet) pbSheet.classList.add('hidden');
}

function pbSyncSettingsInputs() {
    if (wrongPenaltyInput) wrongPenaltyInput.value = penaltyPerWrong;
    if (problemCountInput) problemCountInput.value = problemCount;
}

function applyPenaltySettings(wrongPenaltyVal, problemCountVal) {
    penaltyPerWrong = wrongPenaltyVal;
    problemCount = problemCountVal;

    localStorage.setItem('xcpc-wrong-penalty', penaltyPerWrong.toString());
    localStorage.setItem('xcpc-problem-count', problemCount.toString());

    if (pbSelected.charCodeAt(0) - 65 >= problemCount) pbSelected = pbFirstUnsolved();

    pbSyncSettingsInputs();
    pbRender();
}

function pbAdjustPenalty(delta) {
    let current = parseFloat(wrongPenaltyInput.value);
    if (isNaN(current)) current = PB_DEFAULT_WRONG_PENALTY;
    wrongPenaltyInput.value = Number(Math.max(0, current + delta).toFixed(2)).toString();
}

function pbAdjustProblemCount(delta) {
    let current = parseInt(problemCountInput.value, 10);
    if (isNaN(current)) current = PB_DEFAULT_PROBLEM_COUNT;
    problemCountInput.value = Math.min(PB_MAX_PROBLEMS, Math.max(1, current + delta));
}

function pbInit() {
    pbLoad();

    const savedPenalty = localStorage.getItem('xcpc-wrong-penalty');
    const savedCount = localStorage.getItem('xcpc-problem-count');

    const parsedPenalty = parseFloat(savedPenalty);
    if (savedPenalty !== null && !isNaN(parsedPenalty) && parsedPenalty >= 0) {
        penaltyPerWrong = parsedPenalty;
    }

    const parsedCount = parseInt(savedCount, 10);
    if (savedCount !== null && !isNaN(parsedCount) && parsedCount >= 1 && parsedCount <= PB_MAX_PROBLEMS) {
        problemCount = parsedCount;
    }

    pbSelected = pbFirstUnsolved();
    pbSyncSettingsInputs();
    pbRender();
}

if (pbGrid) {
    pbGrid.addEventListener('click', (e) => {
        const cell = e.target.closest('.pb-cell');
        if (!cell) return;
        const letter = cell.dataset.letter;

        if (pbSubs(letter).length) {
            if (!confirm(`清除 ${letter} 题的记录？`)) return;
            pbClearProblem(letter);
        } else {
            pbOpenSheet(letter);
        }
    });
}

if (pbPicker) {
    pbPicker.addEventListener('click', (e) => {
        const pick = e.target.closest('.pb-pick');
        if (!pick) return;
        pbSelected = pick.dataset.letter;
        // 只切换选中样式，不重建 DOM，避免点击事件的目标元素被移除
        pbPicker.querySelectorAll('.pb-pick').forEach((el) => {
            el.classList.toggle('selected', el === pick);
        });
    });
}

if (pbAddBtn) pbAddBtn.addEventListener('click', () => pbOpenSheet());
if (pbSheetClose) pbSheetClose.addEventListener('click', pbCloseSheet);
if (pbAcBtn) pbAcBtn.addEventListener('click', () => pbRecord(pbSelected, true));
if (pbWaBtn) pbWaBtn.addEventListener('click', () => pbRecord(pbSelected, false));
if (pbResetSettingsBtn) pbResetSettingsBtn.addEventListener('click', pbClearAll);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') pbCloseSheet();
});

document.addEventListener('click', (e) => {
    if (!pbSheet || pbSheet.classList.contains('hidden')) return;

    // 用事件派发时冻结的路径判断，避免渲染后目标元素已被移除导致误判
    const path = (typeof e.composedPath === 'function') ? e.composedPath() : [];

    if (path.indexOf(pbSheet) >= 0) return;
    if (pbAddBtn && path.indexOf(pbAddBtn) >= 0) return;
    if (pbGrid && path.indexOf(pbGrid) >= 0) return;

    if (pbSheet.contains(e.target)) return;
    if (pbAddBtn && pbAddBtn.contains(e.target)) return;
    if (pbGrid && pbGrid.contains(e.target)) return;

    pbCloseSheet();
});

if (wpBtnUp) wpBtnUp.addEventListener('click', () => pbAdjustPenalty(1));
if (wpBtnDown) wpBtnDown.addEventListener('click', () => pbAdjustPenalty(-1));
if (pcBtnUp) pcBtnUp.addEventListener('click', () => pbAdjustProblemCount(1));
if (pcBtnDown) pcBtnDown.addEventListener('click', () => pbAdjustProblemCount(-1));

if (wrongPenaltyInput) {
    wrongPenaltyInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            pbAdjustPenalty(1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            pbAdjustPenalty(-1);
        }
    });
}

if (problemCountInput) {
    problemCountInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            pbAdjustProblemCount(1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            pbAdjustProblemCount(-1);
        }
    });
}

saveSettingsBtn.addEventListener('click', saveSettings);

initSettings();
pbInit();

if (isDarkMode) {
    document.body.classList.add("color-scheme-dark");
}

setInterval(updateLoop, 100);
updateLoop();
