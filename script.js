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
let isDarkMode = true;
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

function formatDuration(ms) {
    const isNegative = ms < 0;
    ms = Math.abs(ms);

    const secs = Math.floor((ms / 1000) % 60);
    const mins = Math.floor((ms / 1000 / 60) % 60);
    const hours = Math.floor((ms / 1000 / 3600));
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
    const savedTheme = localStorage.getItem('xcpc-theme') || 'dark';
    const savedWarningRatio = localStorage.getItem('xcpc-warning-ratio');
    const savedFinalWarning = localStorage.getItem('xcpc-final-warning');
    const savedLegend = localStorage.getItem('xcpc-legend');
    const savedTz = localStorage.getItem('xcpc-tz');

    // 时区设置

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


    const eFmt = formatDuration(elapsedMs >= 0 ? displayElapsed_ms : elapsedMs);
    const rFmt = formatDuration(displayRemaining_ms);

    elapsedTimeEl.textContent = `${eFmt.sign}${eFmt.time}`;
    remainingTimeEl.textContent = rFmt.time;

    let mainColor = '#00ff00';
    const warningThreshold = 1.0 - warningRatio;
    let currentPhaseIdx = 1;

    if (elapsedMs < 0) {
        currentPhaseIdx = 0;
    } else if (ratio >= 1.0) {
        mainColor = '#00bfff';
        currentPhaseIdx = 4;
    } else if (remainingMs <= finalWarningMin * 60 * 1000 && remainingMs > 0) {
        mainColor = '#ff0000';
        currentPhaseIdx = 3;
    } else if (ratio >= warningThreshold) {
        mainColor = '#ffff00';
        currentPhaseIdx = 2;
    }

    progressBarFill.style.backgroundColor = mainColor;

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
        bigTextEl.style.color = 'inherit';
    }
    else if (ratio < warningThreshold) {
        bigTextEl.textContent = `+${eFmt.time}`;
        bigTextEl.style.color = 'inherit';
    }
    else if (ratio < 1.0) {
        bigTextEl.textContent = `-${rFmt.time}`;
        bigTextEl.style.color = mainColor;
    }
    else {
        bigTextEl.textContent = `+${eFmt.time}`;
        bigTextEl.style.color = mainColor;
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

saveSettingsBtn.addEventListener('click', saveSettings);

initSettings();

if (isDarkMode) {
    document.body.classList.add("color-scheme-dark");
}

setInterval(updateLoop, 100);
updateLoop();