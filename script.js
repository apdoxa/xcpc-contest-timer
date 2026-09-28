const modal = document.getElementById('settings-modal');
const settingsToggleBtn = document.getElementById('settings-toggle');
const themeToggleBtn = document.getElementById('theme-toggle');
const saveSettingsBtn = document.getElementById('save-settings-btn');

const pageTitleInput = document.getElementById('page-title');
const startDateInput = document.getElementById('start-date');
const startClockInput = document.getElementById('start-clock');
const durationHoursInput = document.getElementById('duration-hours');
const resetTimeBtn = document.getElementById('reset-time-btn');
const startClockPickBtn = document.getElementById('start-clock-pick');
const startPicker = document.getElementById('start-picker');
const tpHour = document.getElementById('tp-hour');
const tpMin = document.getElementById('tp-min');
const tpSec = document.getElementById('tp-sec');
const tpNowBtn = document.getElementById('tp-now');
const durationBtnUp = document.getElementById('duration-btn-up');
const durationBtnDown = document.getElementById('duration-btn-down');
const endTimeHintEl = document.getElementById('end-time-hint');
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

/* 拆成 <input type="date"> 与 <input type="time">，Firefox 下也能选时刻 */
function formatDateForInput(date, tzOffsetH) {
    const targetMs = date.getTime() + tzOffsetH * 3600000;
    const d = new Date(targetMs);
    const YYYY = d.getUTCFullYear();
    const MM = String(d.getUTCMonth() + 1).padStart(2, '0');
    const DD = String(d.getUTCDate()).padStart(2, '0');
    return `${YYYY}-${MM}-${DD}`;
}

function formatClockForInput(date, tzOffsetH) {
    const targetMs = date.getTime() + tzOffsetH * 3600000;
    const d = new Date(targetMs);
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

/* 从设置面板读出比赛时长（小时），无效时返回 null */
function getDurationHours() {
    if (!durationHoursInput) return null;
    const hours = parseFloat(durationHoursInput.value);
    if (isNaN(hours) || hours <= 0 || hours > 48) return null;
    return hours;
}

function getDurationMs() {
    const hours = getDurationHours();
    return (hours === null ? 5 : hours) * 3600000;
}

function updateEndTimeHint() {
    if (!endTimeHintEl) return;
    const hours = getDurationHours();
    const dateStr = startDateInput ? startDateInput.value : '';
    const clockStr = startClockInput ? startClockInput.value : '';

    if (hours === null || !dateStr || !clockStr) {
        endTimeHintEl.textContent = '结束 End —';
        return;
    }

    const tzInput = parseTzOffset(timezoneOffsetInput.value);
    const tzForHint = isNaN(tzInput) ? tzOffsetHours : tzInput;
    const start = parseLocalInput(`${dateStr}T${clockStr}`, tzForHint);
    if (isNaN(start.getTime())) {
        endTimeHintEl.textContent = '结束 End —';
        return;
    }

    const end = new Date(start.getTime() + hours * 3600000);
    endTimeHintEl.textContent = `结束 End ${formatDateForInput(end, tzForHint)} ${formatClockForInput(end, tzForHint)}`;
}

function parseLocalInput(timeStr, tzOffsetH) {
    let fullStr = timeStr;
    if (fullStr.length === 16) fullStr += ':00';

    const offsetStr = formatTzOffset(tzOffsetH);
    return new Date(`${fullStr}${offsetStr}`);
}

function getTotalDurationMin() {
    const hours = getDurationHours();
    return hours === null ? 0 : hours * 60;
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
    const savedDuration = localStorage.getItem('xcpc-duration');
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

    // 比赛时长（分钟）：优先用新字段，旧数据从 end - start 推算
    let durationMin = null;
    const parsedDuration = parseFloat(savedDuration);
    if (savedDuration !== null && !isNaN(parsedDuration) && parsedDuration > 0) {
        durationMin = parsedDuration;
    } else if (savedStart && savedEnd) {
        const legacy = (new Date(savedEnd).getTime() - new Date(savedStart).getTime()) / 60000;
        if (isFinite(legacy) && legacy > 0) durationMin = legacy;
    }
    if (durationMin === null) durationMin = 5 * 60;

    if (savedStart) {
        startTime = new Date(savedStart);
    } else {
        startTime = new Date();
    }
    endTime = new Date(startTime.getTime() + durationMin * 60000);

    startDateInput.value = formatDateForInput(startTime, tzOffsetHours);
    startClockInput.value = formatClockForInput(startTime, tzOffsetHours);
    durationHoursInput.value = Number((durationMin / 60).toFixed(2)).toString();
    updateEndTimeHint();
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
    const startStr = `${startDateInput.value}T${startClockInput.value}`;

    if (!startDateInput.value || !startClockInput.value) {
        alert("请输入完整的开始日期和时刻");
        return;
    }

    const durationHoursVal = getDurationHours();
    if (durationHoursVal === null) {
        alert("比赛时长必须是 0 到 48 小时之间的数字");
        return;
    }

    const tzVal = parseTzOffset(timezoneOffsetInput.value);
    if (isNaN(tzVal) || tzVal < -12 || tzVal > 14) {
        alert("格式请使用类似于 +08:00 的形式");
        return;
    }

    tzOffsetHours = tzVal;

    const start = parseLocalInput(startStr, tzOffsetHours);
    if (isNaN(start.getTime())) {
        alert("时间格式无法解析");
        return;
    }

    const end = new Date(start.getTime() + durationHoursVal * 3600000);

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
    localStorage.setItem('xcpc-duration', (durationHoursVal * 60).toString());
    localStorage.removeItem('xcpc-end');
    localStorage.setItem('xcpc-warning-ratio', warningRatio.toString());
    localStorage.setItem('xcpc-final-warning', finalWarningMin.toString());
    localStorage.setItem('xcpc-tz', tzOffsetHours.toString());

    timezoneDisplayEl.textContent = `UTC${formatTzOffset(tzOffsetHours)}`;
    timezoneOffsetInput.value = formatTzOffset(tzOffsetHours);
    mainTitleEl.textContent = title;
    document.title = title;
    updateEndTimeHint();

    modal.classList.add('hidden');
    updateLegendMarkers();
    updateLoop();

    applyPenaltySettings(wrongPenaltyVal, problemCountVal);
}

/* 只在内容真正变化时才写 DOM，避免每 100ms 触发无谓的重排 */
const uiCache = {
    clock: null,
    elapsed: null,
    remaining: null,
    big: null,
    width: null,
    barPhase: null,
    clockPhase: null,
    phaseIdx: -1
};

let legendSegments = null;

function getLegendSegments() {
    if (!legendSegments) legendSegments = Array.prototype.slice.call(document.querySelectorAll('.legend-segment'));
    return legendSegments;
}

function setCachedText(el, value, key) {
    if (!el || uiCache[key] === value) return;
    uiCache[key] = value;
    el.textContent = value;
}

function updateLoop() {
    const now = getDisplayNow();
    setCachedText(currentTimeEl, formatClock(now), 'clock');

    if (!startTime || !endTime) return;
    const totalMs = endTime - startTime;
    const elapsedMs = now - startTime;
    const remainingMs = endTime - now;

    let ratio = elapsedMs / totalMs;
    if (ratio < 0) ratio = 0;
    if (ratio > 1) ratio = 1;

    const barWidth = Math.round(ratio * 1000) / 10;
    if (uiCache.width !== barWidth) {
        uiCache.width = barWidth;
        progressBarFill.style.width = barWidth + '%';
    }

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

    setCachedText(elapsedTimeEl, `${eFmt.sign}${eFmt.time}`, 'elapsed');
    setCachedText(remainingTimeEl, rFmt.time, 'remaining');

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

    if (uiCache.barPhase !== phase) {
        uiCache.barPhase = phase;
        progressBarFill.dataset.phase = phase;
    }
    if (uiCache.clockPhase !== phase) {
        uiCache.clockPhase = phase;
        bigTextEl.dataset.phase = phase;
    }

    if (uiCache.phaseIdx !== currentPhaseIdx) {
        uiCache.phaseIdx = currentPhaseIdx;
        const segments = getLegendSegments();
        for (let i = 0; i < segments.length; i++) {
            segments[i].classList.toggle('passed-segment', i < currentPhaseIdx);
        }
    }

    let bigText;
    if (elapsedMs < 0) {
        bigText = `${eFmt.sign}${eFmt.time}`;
    } else if (ratio < warningThreshold) {
        bigText = `+${eFmt.time}`;
    } else if (ratio < 1.0) {
        bigText = `-${rFmt.time}`;
    } else {
        bigText = `+${eFmt.time}`;
    }
    setCachedText(bigTextEl, bigText, 'big');

    syncScrubber();
    updateLive(Math.floor(Math.max(0, elapsedMs) / 1000));
}

settingsToggleBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
});

/* 关闭设置面板时收起时间选择器 */
if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => toggleTimePicker(false));
}

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

timezoneOffsetInput.addEventListener('input', updateEndTimeHint);

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
startDateInput.addEventListener('input', () => {
    updateEndTimeHint();
    syncWarningTimeFromRatio();
});
startClockInput.addEventListener('input', () => {
    if (startPicker && !startPicker.classList.contains('hidden')) syncTimePicker();
    updateEndTimeHint();
    syncWarningTimeFromRatio();
});
durationHoursInput.addEventListener('input', () => {
    updateEndTimeHint();
    syncWarningTimeFromRatio();
});

function adjustFwInput(delta) {
    let current = parseFloat(finalWarningInput.value);
    if (isNaN(current)) current = 3;
    let next = current + delta;
    if (next < 0) next = 0;
    finalWarningInput.value = Number(next.toFixed(2)).toString();
}

/* ---- 自定义时刻选择器（时 / 分 / 秒 三列） ---- */
const TIME_PICKER_COLS = [
    { el: tpHour, count: 24, get: (h, m, sec) => h, set: (h, m, sec, v) => [v, m, sec] },
    { el: tpMin, count: 60, get: (h, m, sec) => m, set: (h, m, sec, v) => [h, v, sec] },
    { el: tpSec, count: 60, get: (h, m, sec) => sec, set: (h, m, sec, v) => [h, m, v] }
];

function parseClockParts(text) {
    const parts = String(text || '').trim().split(':').map((p) => parseInt(p, 10));
    let h = parts[0];
    let m = parts.length > 1 ? parts[1] : 0;
    let sec = parts.length > 2 ? parts[2] : 0;
    if (!isFinite(h) || h < 0 || h > 23) h = 0;
    if (!isFinite(m) || m < 0 || m > 59) m = 0;
    if (!isFinite(sec) || sec < 0 || sec > 59) sec = 0;
    return [h, m, sec];
}

function currentClockParts() {
    return parseClockParts(startClockInput.value);
}

function writeClockParts(parts) {
    const pad = (n) => String(n).padStart(2, '0');
    startClockInput.value = `${pad(parts[0])}:${pad(parts[1])}:${pad(parts[2])}`;
}

function buildTimePicker() {
    if (!startPicker) return;

    TIME_PICKER_COLS.forEach((col) => {
        if (!col.el || col.el.childElementCount) return;
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < col.count; i++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.value = String(i);
            btn.textContent = String(i).padStart(2, '0');
            fragment.appendChild(btn);
        }
        col.el.appendChild(fragment);
    });
}

function syncTimePicker() {
    if (!startPicker) return;
    const parts = currentClockParts();

    TIME_PICKER_COLS.forEach((col, colIndex) => {
        if (!col.el) return;
        const current = parts[colIndex];
        const buttons = col.el.children;
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('on', i === current);
        }
        if (buttons[current]) {
            const target = buttons[current];
            const top = target.offsetTop - col.el.clientHeight / 2 + target.offsetHeight / 2;
            col.el.scrollTop = Math.max(0, top);
        }
    });
}

function toggleTimePicker(show) {
    if (!startPicker) return;
    const willShow = (show === undefined) ? startPicker.classList.contains('hidden') : show;
    if (willShow) {
        buildTimePicker();
        startPicker.classList.remove('hidden');
        syncTimePicker();
    } else {
        startPicker.classList.add('hidden');
    }
}

if (startPicker) {
    startPicker.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-value]');
        if (!btn) return;
        const col = btn.parentElement;
        const colIndex = TIME_PICKER_COLS.findIndex((c) => c.el === col);
        if (colIndex < 0) return;

        const parts = currentClockParts();
        parts[colIndex] = parseInt(btn.dataset.value, 10);
        writeClockParts(parts);
        syncTimePicker();
        updateEndTimeHint();
        syncWarningTimeFromRatio();
    });
}

if (startClockPickBtn) {
    startClockPickBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTimePicker();
    });
}

/* 点选择器以外的位置就收起 */
document.addEventListener('click', (e) => {
    if (!startPicker || startPicker.classList.contains('hidden')) return;
    if (startPicker.contains(e.target)) return;
    if (startClockPickBtn && startClockPickBtn.contains(e.target)) return;
    toggleTimePicker(false);
});

if (tpNowBtn) {
    tpNowBtn.addEventListener('click', () => {
        const now = new Date();
        startClockInput.value = formatClockForInput(now, tzOffsetHours);
        startDateInput.value = formatDateForInput(now, tzOffsetHours);
        syncTimePicker();
        updateEndTimeHint();
        syncWarningTimeFromRatio();
    });
}

function adjustDuration(delta) {
    let current = parseFloat(durationHoursInput.value);
    if (isNaN(current)) current = 5;
    const next = Math.min(48, Math.max(0.5, Math.round((current + delta) * 100) / 100));
    durationHoursInput.value = Number(next.toFixed(2)).toString();
    updateEndTimeHint();
    syncWarningTimeFromRatio();
}

/* 重置：以当前时间为开始时间，时长不变 */
function resetTimeToNow() {
    const now = new Date();

    startDateInput.value = formatDateForInput(now, tzOffsetHours);
    startClockInput.value = formatClockForInput(now, tzOffsetHours);
    if (startPicker && !startPicker.classList.contains('hidden')) syncTimePicker();

    const hours = getDurationHours();
    const durationMin = (hours === null ? 5 * 60 : hours * 60);

    startTime = now;
    endTime = new Date(now.getTime() + durationMin * 60000);

    try {
        localStorage.setItem('xcpc-start', startTime.toISOString());
        localStorage.setItem('xcpc-duration', durationMin.toString());
    } catch (e) {
        /* 忽略 */
    }

    if (scrubSec !== null) clearScrub();
    lastLiveSec = -1;
    updateEndTimeHint();
    updateLegendMarkers();
    updateLoop();
    pbToast('已重置：从现在开始重新计时');
}

if (durationBtnUp) durationBtnUp.addEventListener('click', () => adjustDuration(0.5));
if (durationBtnDown) durationBtnDown.addEventListener('click', () => adjustDuration(-0.5));
if (resetTimeBtn) resetTimeBtn.addEventListener('click', resetTimeToNow);

if (durationHoursInput) {
    durationHoursInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            adjustDuration(0.5);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            adjustDuration(-0.5);
        }
    });
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

/* ===================== 时间轴 / Timeline ===================== */
/*
 * scrubSec === null  -> 跟随真实时间
 * scrubSec 为数字     -> 时间被“拖住”，榜单与罚时板都按该时刻回放
 */

const scrubInput = document.getElementById('time-scrub');
const scrubResetBtn = document.getElementById('scrub-reset');

let scrubSec = null;
let lastLiveSec = -1;

function contestDurationSec() {
    if (!startTime || !endTime) return 0;
    return Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 1000));
}

function currentContestSec() {
    if (!startTime) return 0;
    if (scrubSec !== null) {
        return Math.max(0, Math.min(scrubSec, contestDurationSec()));
    }
    return Math.max(0, Math.floor((Date.now() - startTime.getTime()) / 1000));
}

function getDisplayNow() {
    if (scrubSec !== null && startTime) {
        return new Date(startTime.getTime() + scrubSec * 1000);
    }
    return new Date(Date.now());
}

function setScrubSec(sec) {
    const duration = contestDurationSec();
    scrubSec = Math.max(0, Math.min(sec, duration));
    document.body.classList.add('scrubbing');
}

function clearScrub() {
    scrubSec = null;
    document.body.classList.remove('scrubbing');
}

function syncScrubber() {
    if (!scrubInput) return;
    const duration = contestDurationSec();
    const max = String(duration || 0);
    if (scrubInput.max !== max) scrubInput.max = max;
    const value = String(Math.min(currentContestSec(), duration || 0));
    if (scrubInput.value !== value) scrubInput.value = value;
}

/* ===================== 榜单模拟开关 / Ranklist simulation switch ===================== */
/*
 * 关掉后隐藏榜单与时间轴，回到“纯计时器 + 罚时板”的界面；
 * 同时把被拖动的时间放回实时，避免卡在暂停状态。
 */

const simToggle = document.getElementById('sim-toggle');
const SIM_STORAGE_KEY = 'xcpc-sim';

let simEnabled = true;

function applySimMode() {
    document.body.classList.toggle('sim-off', !simEnabled);
    if (simToggle) simToggle.checked = simEnabled;
}

function setSimEnabled(enabled) {
    simEnabled = !!enabled;
    if (!simEnabled && scrubSec !== null) clearScrub();
    applySimMode();
    try {
        localStorage.setItem(SIM_STORAGE_KEY, simEnabled ? '1' : '0');
    } catch (e) {
        /* 存储不可用时忽略 */
    }
    lastLiveSec = -1;
    updateLoop();
}

function simInit() {
    let saved = null;
    try {
        saved = localStorage.getItem(SIM_STORAGE_KEY);
    } catch (e) {
        saved = null;
    }
    simEnabled = saved !== '0';
    applySimMode();
}

if (simToggle) {
    simToggle.addEventListener('change', () => setSimEnabled(simToggle.checked));
}

/* ===================== 罚时板 Penalty Board ===================== */
/*
 * 标准 ICPC 罚时：只有已通过的题目计罚时
 *   罚时 = 该题 AC 时刻(赛时分钟, 向下取整) + 每次错误罚时 × AC 之前的错误提交次数
 * 所有数据都按“当前赛时”过滤，因此拖动时间轴时罚时板也会回到那一刻的状态。
 * 导入榜单后，罚时板的题号与榜单列一一对应（最后一行的“我”）。
 */

const PB_STORAGE_KEY = 'xcpc-vp-board';
const PB_DEFAULT_PROBLEM_COUNT = 15;
const PB_DEFAULT_WRONG_PENALTY = 20;
const PB_MAX_PROBLEMS = 26;

const pbGrid = document.getElementById('pb-grid');
const pbRankEl = document.getElementById('pb-rank');
const pbSolvedEl = document.getElementById('pb-solved');
const pbPenaltyEl = document.getElementById('pb-penalty');
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
let pbCellRefs = {};

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
        if (!letter || !entry || !Array.isArray(entry.subs)) return;

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

/* 罚时板当前的题号列表：有榜单时跟随榜单题号（缓存，导入/改设置时失效） */
let pbProblemCache = null;
let pbScoredCache = null;

function pbInvalidateProblemCache() {
    pbProblemCache = null;
    pbScoredCache = null;
}

function pbProblems() {
    if (pbProblemCache) return pbProblemCache;

    if (rlModel && rlModel.problems && rlModel.problems.length) {
        pbProblemCache = rlModel.problems.map((p) => p.alias);
    } else {
        const list = [];
        for (let i = 0; i < problemCount; i++) list.push(pbLetter(i));
        pbProblemCache = list;
    }
    return pbProblemCache;
}

/* 计分范围：显示中的题目 + 已有记录的题目 */
function pbScoredLetters() {
    if (pbScoredCache) return pbScoredCache;

    const seen = Object.create(null);
    const list = [];
    pbProblems().forEach((alias) => {
        if (!seen[alias]) { seen[alias] = 1; list.push(alias); }
    });
    Object.keys(pbData).forEach((alias) => {
        const entry = pbData[alias];
        if (entry && entry.subs && entry.subs.length && !seen[alias]) {
            seen[alias] = 1;
            list.push(alias);
        }
    });
    pbScoredCache = list;
    return list;
}

/* 一次算出所有题目的实时状态 + 我的总分，供罚时板与榜单共用 */
function pbLiveData(sec) {
    const info = Object.create(null);
    let solved = 0;
    let penaltyMin = 0;
    const letters = pbScoredLetters();

    for (let i = 0; i < letters.length; i++) {
        const item = pbComputeAt(letters[i], sec);
        info[letters[i]] = item;
        if (item.solved) {
            solved++;
            penaltyMin += item.penaltyMin;
        }
    }

    return { info: info, solved: solved, penaltyMin: penaltyMin, penaltySec: penaltyMin * 60 };
}

function pbComputeAt(letter, sec) {
    const subs = pbSubs(letter)
        .filter((s) => s.timeSec <= sec)
        .sort((a, b) => (a.timeSec - b.timeSec) || (a.seq - b.seq));

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
        penaltyMin: ac ? (acMin + wrong * penaltyPerWrong) : 0,
        solved: !!ac
    };
}

function pbLiveScore(sec) {
    let solved = 0;
    let penaltyMin = 0;

    pbScoredLetters().forEach((alias) => {
        const info = pbComputeAt(alias, sec);
        if (info.solved) {
            solved++;
            penaltyMin += info.penaltyMin;
        }
    });

    return { solved: solved, penaltyMin: penaltyMin, penaltySec: penaltyMin * 60 };
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

function pbStateClassAt(letter, sec) {
    const info = pbComputeAt(letter, sec);
    if (info.solved) return 'is-ac';
    if (info.subs.length) return 'is-wa';
    return '';
}

function pbCellTitle(letter, sec) {
    return pbCellTitleFrom(letter, pbComputeAt(letter, sec));
}

function pbCellTitleFrom(letter, info) {
    if (info.solved) {
        return `${letter} 题：AC ${pbFmtShort(info.ac.timeSec)}`
            + (info.wrong ? ` · 错 ${info.wrong} 次` : '')
            + ` · 罚时 ${info.penaltyMin} min（点击可清除该题记录）`;
    }
    if (info.subs.length) {
        return `${letter} 题：未通过 · ${info.subs.length} 次提交（点击可清除该题记录）`;
    }
    return `${letter} 题：未提交（点击记录提交）`;
}

function pbUpdateLive(sec, data, force) {
    const problems = pbProblems();
    const info = data ? data.info : null;

    for (let i = 0; i < problems.length; i++) {
        const alias = problems[i];
        const cell = pbCellRefs[alias];
        if (!cell) continue;

        const item = info && info[alias] ? info[alias] : pbComputeAt(alias, sec);
        let state = '';
        if (item.solved) state = 'is-ac';
        else if (item.subs.length) state = 'is-wa';

        if (force || cell.dataset.state !== state) {
            cell.dataset.state = state;
            cell.className = ('pb-cell ' + state).trim();
            cell.title = pbCellTitleFrom(alias, item);
        }
    }

    const solved = data ? data.solved : pbLiveScore(sec).solved;
    const penaltyMin = data ? data.penaltyMin : pbLiveScore(sec).penaltyMin;

    if (pbSolvedEl && pbSolvedEl.dataset.v !== String(solved)) {
        pbSolvedEl.dataset.v = String(solved);
        pbSolvedEl.textContent = solved;
    }
    if (pbPenaltyEl && pbPenaltyEl.dataset.v !== String(penaltyMin)) {
        pbPenaltyEl.dataset.v = String(penaltyMin);
        pbPenaltyEl.textContent = penaltyMin;
    }
    if (!rlModel && pbRankEl && pbRankEl.textContent !== '—') pbRankEl.textContent = '—';
}

function pbRender() {
    if (!pbGrid) return;

    pbCellRefs = {};
    const fragment = document.createDocumentFragment();

    pbProblems().forEach((alias) => {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'pb-cell';
        cell.dataset.letter = alias;
        cell.textContent = alias;
        pbCellRefs[alias] = cell;
        fragment.appendChild(cell);
    });

    pbGrid.innerHTML = '';
    pbGrid.appendChild(fragment);
    pbUpdateLive(currentContestSec(), null, true);

    const problems = pbProblems();
    if (!problems.length || problems.indexOf(pbSelected) < 0) {
        pbSelected = problems.length ? problems[0] : 'A';
    }
    if (pbSheet && !pbSheet.classList.contains('hidden')) pbRenderPicker();
}

function pbRenderPicker() {
    if (!pbPicker) return;
    const problems = pbProblems();
    const sec = currentContestSec();

    const fragment = document.createDocumentFragment();
    problems.forEach((alias) => {
        const pick = document.createElement('button');
        pick.type = 'button';
        pick.className = ('pb-pick ' + pbStateClassAt(alias, sec) + (alias === pbSelected ? ' selected' : '')).trim();
        pick.dataset.letter = alias;
        pick.textContent = alias;
        pick.title = pbCellTitle(alias, sec);
        fragment.appendChild(pick);
    });

    pbPicker.innerHTML = '';
    pbPicker.appendChild(fragment);
}

function pbRecord(letter, isAc) {
    const notStarted = !!(startTime && getDisplayNow().getTime() < startTime.getTime());
    const timeSec = currentContestSec();

    pbSeq++;
    pbSubs(letter).push({
        id: 's' + pbSeq,
        status: isAc ? 'AC' : 'WA',
        timeSec: timeSec,
        seq: pbSeq
    });

    pbSave();
    pbInvalidateProblemCache();
    pbRender();
    updateLive(currentContestSec(), true);

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
    pbInvalidateProblemCache();
    pbRender();
    updateLive(currentContestSec(), true);
    pbToast(`${letter} 题记录已清除`);
}

function pbClearAll() {
    if (!confirm('确定要清空罚时板的所有记录吗？此操作不可撤销。')) return;
    pbData = {};
    pbSave();
    pbInvalidateProblemCache();
    pbRender();
    updateLive(currentContestSec(), true);
    pbToast('罚时板已清空');
}

function pbFirstUnsolved() {
    const problems = pbProblems();
    const sec = currentContestSec();
    for (let i = 0; i < problems.length; i++) {
        if (!pbComputeAt(problems[i], sec).solved) return problems[i];
    }
    return problems.length ? problems[0] : 'A';
}

function pbOpenSheet(letter) {
    if (!pbSheet) return;

    const problems = pbProblems();
    pbSelected = (letter && problems.indexOf(letter) >= 0) ? letter : pbFirstUnsolved();

    pbRenderPicker();
    pbSheet.classList.remove('hidden');
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

    pbSyncSettingsInputs();
    pbInvalidateProblemCache();
    pbRender();
    updateLive(currentContestSec(), true);
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

    pbSyncSettingsInputs();
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

/* ===================== srk 榜单导入 / Ranklist import ===================== */
/*
 * 参考 Standard Ranklist Kit (srk) 规范：
 *   - problems[] 与每行 rows[].statuses[] 按下标一一对应
 *   - rows[].statuses[].result ∈ { "FB", "AC", "RJ", "?", null }
 *   - rows[].score.value = 通过题数，rows[].score.time = 总罚时（TimeDuration）
 *   - sorter.config.penalty 为每次错误罚时（默认 [20, "min"]）
 *   - 有 solutions 时按提交时间精确回放；否则用 AC 时刻近似
 */

const RL_STORAGE_KEY = 'xcpc-ranklist';
const RL_TIME_UNITS = { ms: 0.001, s: 1, min: 60, h: 3600, d: 86400 };

const rlTitleEl = document.getElementById('rl-title');
const rlEmptyEl = document.getElementById('rl-empty');
const rlScrollEl = document.getElementById('rl-scroll');
const rlTableEl = document.getElementById('rl-table');
const rlImportBtn = document.getElementById('rl-import-btn');
const rlImportBtn2 = document.getElementById('rl-import-btn-2');
const rlClearBtn = document.getElementById('rl-clear-btn');
const rlModal = document.getElementById('rl-modal');
const rlInput = document.getElementById('rl-input');
const rlErrorEl = document.getElementById('rl-error');
const rlConfirmBtn = document.getElementById('rl-import-confirm');
const rlCancelBtn = document.getElementById('rl-import-cancel');
const rlFileBtn = document.getElementById('rl-file-btn');
const rlFileInput = document.getElementById('rl-file-input');
const rlFileNote = document.getElementById('rl-file-note');
const RL_FILE_NOTE_DEFAULT = rlFileNote ? rlFileNote.textContent : '';

let rlModel = null;
let rlTbody = null;
let rlOrderedRows = [];
let rlLastOrder = [];

/* 语言偏好：先看页面语言（index.html 的 lang），再看浏览器语言 */
const RL_LANGS = (function () {
    const list = [];
    const push = (tag) => {
        if (!tag) return;
        const value = String(tag).toLowerCase();
        if (list.indexOf(value) < 0) list.push(value);
    };

    if (typeof document !== 'undefined' && document.documentElement) push(document.documentElement.lang);
    if (typeof navigator !== 'undefined') {
        if (navigator.languages && navigator.languages.length) {
            for (let i = 0; i < navigator.languages.length; i++) push(navigator.languages[i]);
        }
        push(navigator.language);
    }
    push('en');

    return list;
})();

/*
 * srk 的 Text 可以是 string，也可以是 I18NStringSet（{ fallback, "zh-CN": ... }）。
 * 规范要求：优先取与用户语言匹配的项，取不到才用 fallback。
 */
function rlI18NText(set) {
    const map = Object.create(null);
    const keys = Object.keys(set);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key === 'fallback') continue;
        if (typeof set[key] === 'string') map[key.toLowerCase()] = set[key];
    }

    for (let i = 0; i < RL_LANGS.length; i++) {
        const tag = RL_LANGS[i];

        // 完全匹配（zh-cn）
        if (map[tag] !== undefined) return map[tag];

        // 同主语言（zh-cn -> zh / zh-hans）
        const base = tag.split('-')[0];
        for (const key in map) {
            if (key.split('-')[0] === base) return map[key];
        }
    }

    if (typeof set.fallback === 'string') return set.fallback;

    for (const key in map) return map[key];
    return '';
}

function rlText(value, fallback) {
    if (value === null || value === undefined) return fallback || '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
        const text = rlI18NText(value);
        if (text) return text;
    }
    return fallback || '';
}

function rlDurationSec(value) {
    if (!Array.isArray(value) || value.length < 2) return null;
    const amount = Number(value[0]);
    const factor = RL_TIME_UNITS[String(value[1]).toLowerCase()];
    if (!isFinite(amount) || amount < 0 || factor === undefined) return null;
    return amount * factor;
}

function rlFmtDuration(sec) {
    if (sec === null || sec === undefined) return '—';
    const total = Math.round(sec);
    const h = Math.floor(total / 3600);
    const m = Math.floor(total / 60) % 60;
    const s = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function rlPenaltyMinutes(sec) {
    if (sec === null || sec === undefined) return '—';
    return String(Math.round(sec / 60));
}

function rlParseStatus(raw, penaltySec, noPenaltyResults) {
    const empty = { state: 'none', result: null, timeSec: null, tries: null, solutions: [], solved: false };
    if (!raw || typeof raw !== 'object') return empty;

    const result = typeof raw.result === 'string' ? raw.result : null;
    const timeSec = rlDurationSec(raw.time);

    let tries = Number(raw.tries);
    if (!isFinite(tries) || tries < 0) tries = null;

    // solutions：完整提交记录，用于按时间精确回放
    const solutions = [];
    if (Array.isArray(raw.solutions)) {
        raw.solutions.forEach((item) => {
            if (!item || typeof item !== 'object') return;
            const res = typeof item.result === 'string' ? item.result : '';
            if (!res) return;
            solutions.push({ result: res, timeSec: rlDurationSec(item.time) });
        });
        solutions.sort((a, b) => {
            const ta = a.timeSec === null ? Number.POSITIVE_INFINITY : a.timeSec;
            const tb = b.timeSec === null ? Number.POSITIVE_INFINITY : b.timeSec;
            return ta - tb;
        });
    }

    // tries 缺失时用 solutions 推算
    if (tries === null && solutions.length) {
        let count = 0;
        for (let i = 0; i < solutions.length; i++) {
            const res = solutions[i].result;
            if (res === 'AC' || res === 'FB') { count++; break; }
            if (noPenaltyResults.has(res)) continue;
            count++;
        }
        tries = count || null;
    }

    let state = 'none';
    if (result === 'AC' || result === 'FB') state = 'solved';
    else if (result === '?') state = 'frozen';
    else if (result !== null) state = 'rj';

    const solved = state === 'solved';
    const extraTries = solved ? Math.max(0, (tries === null ? 1 : tries) - 1) : 0;
    const penalty = (solved && timeSec !== null) ? (timeSec + extraTries * penaltySec) : null;

    return {
        state: state,
        result: result,
        timeSec: timeSec,
        tries: tries,
        solutions: solutions,
        penaltySec: penalty,
        solved: solved
    };
}

function rlParse(text) {
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error('JSON 解析失败：' + e.message);
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('顶层必须是一个 JSON 对象');
    }
    if (!Array.isArray(data.problems) || !data.problems.length) {
        throw new Error('缺少 problems 数组（题目列表）');
    }
    if (!Array.isArray(data.rows) || !data.rows.length) {
        throw new Error('缺少 rows 数组（队伍数据）');
    }

    const problems = data.problems.map((item, index) => {
        const p = (item && typeof item === 'object') ? item : {};
        const bg = p.style && typeof p.style.backgroundColor === 'string' ? p.style.backgroundColor : null;
        return {
            alias: rlText(p.alias, String.fromCharCode(65 + index)),
            title: rlText(p.title, ''),
            bg: bg
        };
    });

    const sorter = (data.sorter && typeof data.sorter === 'object') ? data.sorter : null;
    const algorithm = sorter ? String(sorter.algorithm || '') : '';
    const config = (sorter && sorter.config && typeof sorter.config === 'object') ? sorter.config : {};

    const penaltyFromConfig = rlDurationSec(config.penalty);
    const penaltySec = penaltyFromConfig === null ? 20 * 60 : penaltyFromConfig;

    const noPenalty = new Set(
        Array.isArray(config.noPenaltyResults)
            ? config.noPenaltyResults.map((v) => String(v))
            : ['FB', 'AC', '?', 'NOUT', 'CE', 'UKE', 'null']
    );

    const rows = data.rows.map((item, index) => {
        const row = (item && typeof item === 'object') ? item : {};
        const user = (row.user && typeof row.user === 'object') ? row.user : {};
        const rawStatuses = Array.isArray(row.statuses) ? row.statuses : [];

        const statuses = problems.map((_, i) => rlParseStatus(rawStatuses[i], penaltySec, noPenalty));

        const score = (row.score && typeof row.score === 'object') ? row.score : null;
        const finalSolved = score && isFinite(Number(score.value))
            ? Number(score.value)
            : statuses.filter((st) => st.solved).length;

        let finalPenalty = score ? rlDurationSec(score.time) : null;
        if (finalPenalty === null) {
            let sum = 0;
            let known = false;
            statuses.forEach((st) => {
                if (st.solved && st.penaltySec !== null) { sum += st.penaltySec; known = true; }
            });
            finalPenalty = known ? sum : null;
        }

        return {
            index: index,
            name: rlText(user.name, 'Team ' + (index + 1)),
            org: rlText(user.organization, ''),
            official: user.official !== false,
            finalSolved: finalSolved,
            finalPenaltySec: finalPenalty,
            statuses: statuses,
            rank: index + 1,
            _live: { solved: 0, penaltySec: null, cells: [] },
            _cells: []
        };
    });

    return {
        title: rlText(data.contest && data.contest.title, ''),
        problems: problems,
        rows: rows,
        algorithm: algorithm,
        hasSorter: !!sorter && (algorithm === 'ICPC' || algorithm === 'score'),
        penaltySec: penaltySec,
        noPenalty: noPenalty
    };
}

/* ---- 按时间回放 ---- */

function rlLiveStatus(status, sec) {
    const penaltySec = rlModel ? rlModel.penaltySec : 20 * 60;
    const noPenalty = rlModel ? rlModel.noPenalty : new Set(['FB', 'AC', '?', 'NOUT', 'CE', 'UKE', 'null']);

    // 有完整提交记录 -> 精确回放
    if (status.solutions.length) {
        let wrong = 0;
        for (let i = 0; i < status.solutions.length; i++) {
            const sol = status.solutions[i];
            if (sol.timeSec !== null && sol.timeSec > sec) break;
            if (sol.result === 'AC' || sol.result === 'FB') {
                const acceptTime = sol.timeSec === null ? 0 : sol.timeSec;
                return { state: 'solved', penaltySec: acceptTime + wrong * penaltySec, wrong: wrong };
            }
            if (!noPenalty.has(sol.result)) wrong++;
        }
        return wrong > 0
            ? { state: 'rj', penaltySec: 0, wrong: wrong }
            : { state: 'none', penaltySec: 0, wrong: 0 };
    }

    // 只有最终状态：已通过的题按 AC 时刻出现
    if (status.solved) {
        if (status.timeSec !== null && status.timeSec <= sec) {
            const extra = Math.max(0, (status.tries === null ? 1 : status.tries) - 1);
            return { state: 'solved', penaltySec: status.timeSec + extra * penaltySec, wrong: extra };
        }
        return { state: 'none', penaltySec: 0, wrong: 0 };
    }

    if (status.state === 'frozen') return { state: 'frozen', penaltySec: 0, wrong: 0 };
    if (status.state === 'rj') {
        // 有提交时刻就按时刻出现；没有时刻信息时始终显示（最终状态已知）
        if (status.timeSec !== null) {
            return status.timeSec <= sec
                ? { state: 'rj', penaltySec: 0, wrong: 0 }
                : { state: 'none', penaltySec: 0, wrong: 0 };
        }
        return { state: 'rj', penaltySec: 0, wrong: 0 };
    }
    return { state: 'none', penaltySec: 0, wrong: 0 };
}

/* 就地更新，避免每 tick 产生大量临时对象 */
function rlLiveStatusInto(out, status, sec) {
    const penaltySec = rlModel.penaltySec;
    const noPenalty = rlModel.noPenalty;

    // 有完整提交记录 -> 精确回放
    if (status.solutions.length) {
        const solutions = status.solutions;
        let wrong = 0;
        for (let i = 0; i < solutions.length; i++) {
            const sol = solutions[i];
            if (sol.timeSec !== null && sol.timeSec > sec) break;
            if (sol.result === 'AC' || sol.result === 'FB') {
                const acceptTime = sol.timeSec === null ? 0 : sol.timeSec;
                out.state = 'solved';
                out.penaltySec = acceptTime + wrong * penaltySec;
                out.wrong = wrong;
                return out;
            }
            if (!noPenalty.has(sol.result)) wrong++;
        }
        out.state = wrong > 0 ? 'rj' : 'none';
        out.penaltySec = 0;
        out.wrong = wrong;
        return out;
    }

    // 只有最终状态：已通过的题按 AC 时刻出现
    if (status.solved) {
        if (status.timeSec !== null && status.timeSec <= sec) {
            const extra = Math.max(0, (status.tries === null ? 1 : status.tries) - 1);
            out.state = 'solved';
            out.penaltySec = status.timeSec + extra * penaltySec;
            out.wrong = extra;
            return out;
        }
        out.state = 'none';
        out.penaltySec = 0;
        out.wrong = 0;
        return out;
    }

    if (status.state === 'frozen') {
        out.state = 'frozen';
    } else if (status.state === 'rj') {
        // 有提交时刻就按时刻出现；没有时刻信息时始终显示（最终状态已知）
        out.state = (status.timeSec !== null && status.timeSec > sec) ? 'none' : 'rj';
    } else {
        out.state = 'none';
    }
    out.penaltySec = 0;
    out.wrong = 0;
    return out;
}

function rlLiveScore(row, sec) {
    const live = row._live || (row._live = { solved: 0, penaltySec: 0, cells: [] });
    const cells = live.cells;
    const statuses = row.statuses;
    let solved = 0;
    let penalty = 0;

    for (let i = 0; i < statuses.length; i++) {
        const cell = rlLiveStatusInto(cells[i] || (cells[i] = { state: 'none', penaltySec: 0, wrong: 0 }), statuses[i], sec);
        if (cell.state === 'solved') {
            solved++;
            penalty += cell.penaltySec;
        }
    }

    live.solved = solved;
    live.penaltySec = penalty;
    return live;
}

/* a 是否严格优于 b（ICPC：先比通过数，再比罚时） */
function rlIsBetter(a, b) {
    if (a.solved !== b.solved) return a.solved > b.solved;
    const pa = a.penaltySec === null ? Number.POSITIVE_INFINITY : a.penaltySec;
    const pb = b.penaltySec === null ? Number.POSITIVE_INFINITY : b.penaltySec;
    return pa < pb;
}

/* 排序与并列判定都基于“回放后的成绩”对象 { solved, penaltySec } */
function rlLiveCompare(a, b) {
    if (a.solved !== b.solved) return b.solved - a.solved;
    if (rlModel && rlModel.algorithm === 'score') return 0;
    const pa = a.penaltySec === null ? Number.POSITIVE_INFINITY : a.penaltySec;
    const pb = b.penaltySec === null ? Number.POSITIVE_INFINITY : b.penaltySec;
    return pa - pb;
}

function rlLiveSameRank(a, b) {
    if (a.solved !== b.solved) return false;
    if (rlModel && rlModel.algorithm === 'score') return true;
    const pa = a.penaltySec === null ? Number.POSITIVE_INFINITY : a.penaltySec;
    const pb = b.penaltySec === null ? Number.POSITIVE_INFINITY : b.penaltySec;
    return pa === pb;
}

function rlStatusTitle(problem, live) {
    const parts = [problem.alias + (problem.title ? ' · ' + problem.title : '')];
    if (live.state === 'none') {
        parts.push('此刻未提交 / 未通过');
    } else if (live.state === 'solved') {
        parts.push('此刻已通过');
        if (live.penaltySec) parts.push('罚时 ' + rlPenaltyMinutes(live.penaltySec) + ' min');
    } else if (live.state === 'frozen') {
        parts.push('封榜中');
    } else {
        parts.push('此刻未通过');
    }
    return parts.join(' · ');
}

function rlOrderChanged(ordered) {
    if (rlLastOrder.length !== ordered.length) return true;
    for (let i = 0; i < ordered.length; i++) {
        if (rlLastOrder[i] !== ordered[i]) return true;
    }
    return false;
}

/* 只写真正变化的内容 */
function rlUpdateRowDom(row) {
    const live = row._live;

    if (row._domRank !== row.rank) {
        row._domRank = row.rank;
        row._rankTd.textContent = row.rank;
    }
    if (row._domSolved !== live.solved) {
        row._domSolved = live.solved;
        row._solvedTd.textContent = live.solved;
    }
    if (row._domPenalty !== live.penaltySec) {
        row._domPenalty = live.penaltySec;
        row._penaltyTd.textContent = rlPenaltyMinutes(live.penaltySec);
    }

    const states = row._domStates;
    const cells = row._cells;
    const problems = rlModel.problems;

    for (let i = 0; i < live.cells.length; i++) {
        const state = live.cells[i].state;
        if (states[i] === state) continue;
        states[i] = state;

        const td = cells[i];
        const problem = problems[i];
        td.className = 'rl-cell state-' + state;
        td.title = rlStatusTitle(problem, live.cells[i]);
        if (td.firstChild) td.firstChild.textContent = state === 'frozen' ? '?' : problem.alias;
    }
}

/* 每个 tick 更新：名次 / 通过 / 罚时 / 每题状态 */
function rlUpdateLive(sec, mine) {
    if (!rlModel) {
        if (pbRankEl && pbRankEl.textContent !== '—') pbRankEl.textContent = '—';
        return;
    }

    const rows = rlModel.rows;
    for (let i = 0; i < rows.length; i++) rlLiveScore(rows[i], sec);

    const ordered = rlOrderedRows;
    ordered.length = 0;
    for (let i = 0; i < rows.length; i++) ordered.push(rows[i]);

    if (rlModel.hasSorter) {
        ordered.sort((x, y) => rlLiveCompare(x._live, y._live));
        let rank = 1;
        for (let i = 0; i < ordered.length; i++) {
            if (i > 0 && !rlLiveSameRank(ordered[i - 1]._live, ordered[i]._live)) rank = i + 1;
            ordered[i].rank = rank;
        }
    } else {
        for (let i = 0; i < ordered.length; i++) ordered[i].rank = i + 1;
    }

    for (let i = 0; i < ordered.length; i++) rlUpdateRowDom(ordered[i]);

    // 顺序变化时才真正移动节点
    if (rlOrderChanged(ordered)) {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < ordered.length; i++) fragment.appendChild(ordered[i]._tr);
        rlTbody.appendChild(fragment);
        rlLastOrder = ordered.slice();
    }

    // 我的名次：比我强的队伍数 + 1
    let better = 0;
    for (let i = 0; i < rows.length; i++) {
        if (rlIsBetter(rows[i]._live, mine)) better++;
    }
    const rankText = String(better + 1);
    if (pbRankEl && pbRankEl.textContent !== rankText) pbRankEl.textContent = rankText;
}

function rlContrastText(hexColor) {
    const match = /^#([0-9a-f]{6})$/i.exec(String(hexColor || '').trim());
    if (!match) return null;
    const value = parseInt(match[1], 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.62 ? '#2b3f52' : '#ffffff';
}

function rlRender() {
    if (!rlTableEl) return;

    const hasData = !!rlModel;

    if (rlEmptyEl) rlEmptyEl.classList.toggle('hidden', hasData);
    if (rlScrollEl) rlScrollEl.classList.toggle('hidden', !hasData);
    if (rlClearBtn) rlClearBtn.classList.toggle('hidden', !hasData);
    if (rlTitleEl) rlTitleEl.textContent = hasData ? rlModel.title : '';

    rlTbody = null;
    rlTableEl.innerHTML = '';

    if (!hasData) return;

    const colgroup = document.createElement('colgroup');
    const addCol = (width) => {
        const col = document.createElement('col');
        if (width) col.style.width = width;
        colgroup.appendChild(col);
    };
    addCol('var(--rl-rank-w)');
    addCol('var(--rl-team-w)');
    addCol('var(--rl-solved-w)');
    addCol('var(--rl-penalty-w)');
    rlModel.problems.forEach(() => addCol('var(--rl-cell-w)'));
    addCol(null); // 末尾占位列
    rlTableEl.appendChild(colgroup);

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');

    const thRank = document.createElement('th');
    thRank.className = 'rl-rank';
    thRank.textContent = '#';
    headRow.appendChild(thRank);

    const thTeam = document.createElement('th');
    thTeam.className = 'rl-team';
    thTeam.textContent = '队伍';
    headRow.appendChild(thTeam);

    const thSolved = document.createElement('th');
    thSolved.className = 'rl-solved';
    thSolved.textContent = '通过';
    headRow.appendChild(thSolved);

    const thPenalty = document.createElement('th');
    thPenalty.className = 'rl-penalty';
    thPenalty.textContent = '罚时';
    headRow.appendChild(thPenalty);

    rlModel.problems.forEach((problem) => {
        const th = document.createElement('th');
        th.className = 'rl-prob-head';
        th.textContent = problem.alias;
        if (problem.title) th.title = problem.title;
        if (problem.bg) {
            th.style.backgroundColor = problem.bg;
            const textColor = rlContrastText(problem.bg);
            if (textColor) th.style.color = textColor;
        }
        headRow.appendChild(th);
    });

    const thSpacer = document.createElement('th');
    thSpacer.className = 'rl-spacer';
    headRow.appendChild(thSpacer);

    thead.appendChild(headRow);
    rlTableEl.appendChild(thead);

    const tbody = document.createElement('tbody');
    rlTbody = tbody;

    rlModel.rows.forEach((row) => {
        const tr = document.createElement('tr');
        if (!row.official) tr.className = 'unofficial';

        const tdRank = document.createElement('td');
        tdRank.className = 'rl-rank';
        tr.appendChild(tdRank);
        row._rankTd = tdRank;

        const tdTeam = document.createElement('td');
        tdTeam.className = 'rl-team';
        const nameEl = document.createElement('span');
        nameEl.className = 'rl-name';
        nameEl.textContent = row.name;
        nameEl.title = row.name;
        tdTeam.appendChild(nameEl);
        if (row.org) {
            const orgEl = document.createElement('span');
            orgEl.className = 'rl-org';
            orgEl.textContent = row.org;
            orgEl.title = row.org;
            tdTeam.appendChild(orgEl);
        }
        tr.appendChild(tdTeam);

        const tdSolved = document.createElement('td');
        tdSolved.className = 'rl-solved';
        tr.appendChild(tdSolved);
        row._solvedTd = tdSolved;

        const tdPenalty = document.createElement('td');
        tdPenalty.className = 'rl-penalty';
        tr.appendChild(tdPenalty);
        row._penaltyTd = tdPenalty;

        row._cells = rlModel.problems.map((problem) => {
            const td = document.createElement('td');
            td.className = 'rl-cell state-none';
            const chip = document.createElement('span');
            chip.className = 'rl-chip';
            chip.textContent = problem.alias;
            td.appendChild(chip);
            tr.appendChild(td);
            return td;
        });

        const tdSpacer = document.createElement('td');
        tdSpacer.className = 'rl-spacer';
        tr.appendChild(tdSpacer);

        row._tr = tr;
        row._domRank = undefined;
        row._domSolved = undefined;
        row._domPenalty = undefined;
        row._domStates = [];
        tbody.appendChild(tr);
    });

    rlTableEl.appendChild(tbody);
    rlLastOrder = [];
    updateLive(currentContestSec(), true);
}

function rlShowError(message) {
    if (!rlErrorEl) return;
    rlErrorEl.textContent = message;
    rlErrorEl.classList.remove('hidden');
}

function rlHideError() {
    if (!rlErrorEl) return;
    rlErrorEl.textContent = '';
    rlErrorEl.classList.add('hidden');
}

function rlSetFileNote(text, loaded) {
    if (!rlFileNote) return;
    rlFileNote.textContent = text;
    rlFileNote.classList.toggle('loaded', !!loaded);
}

function rlResetFileNote() {
    rlSetFileNote(RL_FILE_NOTE_DEFAULT, false);
}

function rlFormatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function rlLoadFile(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        const text = String(reader.result || '');
        if (rlInput) {
            rlInput.value = text;
            rlInput.scrollTop = 0;
        }
        rlHideError();

        try {
            rlParse(text);
            rlSetFileNote(`已载入 ${file.name}（${rlFormatSize(file.size)}），点「确认导入」应用`, true);
        } catch (e) {
            rlSetFileNote(`已载入 ${file.name}（${rlFormatSize(file.size)}），但格式有问题`, false);
            rlShowError(e && e.message ? e.message : '数据格式不正确');
        }
    };

    reader.onerror = () => {
        rlShowError('读取文件失败，请确认文件是 UTF-8 编码的文本');
    };

    reader.readAsText(file, 'utf-8');
}

function rlApplyModel(model) {
    rlModel = model;
    document.body.classList.toggle('has-ranklist', !!rlModel);
    pbInvalidateProblemCache();
    pbRender();
    rlRender();
}

function rlOpenModal() {
    if (!rlModal) return;
    pbCloseSheet();
    rlHideError();
    rlResetFileNote();
    if (rlFileInput) rlFileInput.value = '';
    if (rlInput) {
        rlInput.value = localStorage.getItem(RL_STORAGE_KEY) || '';
        rlInput.focus();
    }
    rlModal.classList.remove('hidden');
}

function rlCloseModal() {
    if (rlModal) rlModal.classList.add('hidden');
}

function rlConfirmImport() {
    if (!rlInput) return;
    const text = rlInput.value.trim();

    if (!text) {
        rlShowError('请先粘贴 srk 榜单 JSON 数据，或选择一个 .json 文件');
        return;
    }

    let model;
    try {
        model = rlParse(text);
    } catch (e) {
        rlShowError(e && e.message ? e.message : '数据格式不正确');
        return;
    }

    try {
        localStorage.setItem(RL_STORAGE_KEY, text);
    } catch (e) {
        /* 存储不可用时忽略 */
    }

    rlHideError();
    rlApplyModel(model);
    updateLive(currentContestSec(), true);
    rlCloseModal();
    pbToast(`已导入榜单：${model.rows.length} 支队伍 · ${model.problems.length} 题`);
}

function rlClear() {
    if (!rlModel) return;
    if (!confirm('确定要清除已导入的榜单吗？')) return;
    try {
        localStorage.removeItem(RL_STORAGE_KEY);
    } catch (e) {
        /* 忽略 */
    }
    rlApplyModel(null);
    updateLive(currentContestSec(), true);
    pbToast('榜单已清除');
}

function rlInit() {
    let saved = null;
    try {
        saved = localStorage.getItem(RL_STORAGE_KEY);
    } catch (e) {
        saved = null;
    }

    let model = null;
    if (saved) {
        try {
            model = rlParse(saved);
        } catch (e) {
            model = null;
        }
    }

    rlApplyModel(model);
}

if (rlImportBtn) rlImportBtn.addEventListener('click', rlOpenModal);
if (rlImportBtn2) rlImportBtn2.addEventListener('click', rlOpenModal);
if (rlClearBtn) rlClearBtn.addEventListener('click', rlClear);
if (rlConfirmBtn) rlConfirmBtn.addEventListener('click', rlConfirmImport);
if (rlCancelBtn) rlCancelBtn.addEventListener('click', rlCloseModal);

if (rlModal) {
    rlModal.addEventListener('click', (e) => {
        if (e.target === rlModal) rlCloseModal();
    });
}

if (rlFileBtn && rlFileInput) {
    rlFileBtn.addEventListener('click', () => rlFileInput.click());

    rlFileInput.addEventListener('change', () => {
        const file = rlFileInput.files && rlFileInput.files[0];
        if (file) rlLoadFile(file);
        rlFileInput.value = '';
    });
}

if (rlInput) {
    ['dragenter', 'dragover'].forEach((type) => {
        rlInput.addEventListener(type, (e) => {
            e.preventDefault();
            rlInput.classList.add('dragover');
        });
    });

    ['dragleave', 'dragend'].forEach((type) => {
        rlInput.addEventListener(type, () => rlInput.classList.remove('dragover'));
    });

    rlInput.addEventListener('drop', (e) => {
        e.preventDefault();
        rlInput.classList.remove('dragover');
        const dt = e.dataTransfer;
        const file = dt && dt.files && dt.files[0];
        if (file) rlLoadFile(file);
    });

    rlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            rlCloseModal();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            rlConfirmImport();
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && rlModal && !rlModal.classList.contains('hidden')) rlCloseModal();
});

/* 榜单横向滚动时，底部题号格跟随，保持与榜单列对齐 */
if (rlScrollEl && pbGrid) {
    let scrollRaf = 0;
    rlScrollEl.addEventListener('scroll', () => {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(() => {
            scrollRaf = 0;
            pbGrid.style.transform = `translateX(${-rlScrollEl.scrollLeft}px)`;
        });
    }, { passive: true });
}

/* ===================== 实时联动 / Live sync ===================== */

/*
 * 实时联动：同一份实时数据同时喂给榜单与底部。
 * 未变化直接跳过；拖动时间轴时按时间节流，避免每帧重算整张榜。
 */
const LIVE_MIN_INTERVAL = 80;
let lastLiveAt = 0;

function updateLive(sec, force) {
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    if (!force) {
        if (sec === lastLiveSec) return;
        if (now - lastLiveAt < LIVE_MIN_INTERVAL) return;
    }

    lastLiveAt = now;
    lastLiveSec = sec;

    const mine = pbLiveData(sec);
    rlUpdateLive(sec, mine);
    pbUpdateLive(sec, mine, force);
}

/* 拖动时间轴时用 rAF 合并事件，一帧最多重算一次 */
let scrubRaf = 0;
function scheduleScrubUpdate() {
    if (scrubRaf) return;
    scrubRaf = requestAnimationFrame(() => {
        scrubRaf = 0;
        updateLoop();
    });
}

if (scrubInput) {
    const onScrub = () => {
        setScrubSec(parseFloat(scrubInput.value) || 0);
        scheduleScrubUpdate();
    };
    scrubInput.addEventListener('input', onScrub);
    scrubInput.addEventListener('change', onScrub);
}

if (scrubResetBtn) {
    scrubResetBtn.addEventListener('click', () => {
        clearScrub();
        lastLiveSec = -1;
        updateLoop();
    });
}

saveSettingsBtn.addEventListener('click', saveSettings);

initSettings();
simInit();
pbInit();
rlInit();
pbRender();
syncScrubber();

if (isDarkMode) {
    document.body.classList.add("color-scheme-dark");
}

setInterval(updateLoop, 100);
updateLoop();
