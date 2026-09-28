function rec(letter, isAc) {
    const sheet = document.getElementById('pb-sheet');
    if (sheet.classList.contains('hidden')) document.getElementById('pb-add').click();
    document.querySelector('.pb-pick[data-letter="' + letter + '"]').click();
    document.getElementById(isAc ? 'pb-ac' : 'pb-wa').click();
}
rec('A', false); rec('A', true); rec('B', true);
document.getElementById('pb-sheet-close').click();
if (window.__SHOT_MODE === 'off') {
    const t = document.getElementById('sim-toggle');
    t.checked = false;
    t.dispatchEvent(new Event('change', { bubbles: true }));
}
const bar = document.getElementById('progress-bar-fill');
const out = document.createElement('pre');
out.id = 'test-result';
out.textContent = 'inlineWidth=' + bar.style.width +
    ' | computedWidth=' + getComputedStyle(bar).width +
    ' | phase=' + bar.dataset.phase +
    ' | transition=' + getComputedStyle(bar).transition +
    ' | parentWidth=' + getComputedStyle(bar.parentElement).width;
document.body.appendChild(out);
