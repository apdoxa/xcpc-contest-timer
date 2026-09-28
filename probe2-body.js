function rec(letter, isAc) {
    const sheet = document.getElementById('pb-sheet');
    if (sheet.classList.contains('hidden')) document.getElementById('pb-add').click();
    document.querySelector('.pb-pick[data-letter="' + letter + '"]').click();
    document.getElementById(isAc ? 'pb-ac' : 'pb-wa').click();
}
rec('A', false); rec('A', true);
document.getElementById('pb-sheet-close').click();
const bar = document.getElementById('progress-bar-fill');
const lines = [];
lines.push('before: inline=' + bar.style.width + ' computed=' + getComputedStyle(bar).width + ' rect=' + bar.getBoundingClientRect().width.toFixed(1));
const t = document.getElementById('sim-toggle');
t.checked = false;
t.dispatchEvent(new Event('change', { bubbles: true }));
lines.push('afterOff: inline=' + bar.style.width + ' computed=' + getComputedStyle(bar).width + ' rect=' + bar.getBoundingClientRect().width.toFixed(1));
// 关掉 transition 后重新赋值
bar.style.transition = 'none';
bar.style.width = '40%';
lines.push('noTransition: inline=' + bar.style.width + ' computed=' + getComputedStyle(bar).width + ' rect=' + bar.getBoundingClientRect().width.toFixed(1));
const out = document.createElement('pre'); out.id = 'test-result'; out.textContent = lines.join('\n'); document.body.appendChild(out);
