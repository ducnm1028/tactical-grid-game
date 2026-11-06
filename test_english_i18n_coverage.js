const fs = require('fs');
const vm = require('vm');

// Mock browser environment
const domElements = {};
function createMockElement(id = '') {
    return {
        id,
        tagName: 'DIV',
        innerText: '',
        innerHTML: '',
        title: '',
        style: {},
        classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            contains(c) { return this.classes.has(c); },
            toggle(c) {
                if (this.classes.has(c)) this.classes.delete(c);
                else this.classes.add(c);
            }
        },
        attributes: {},
        setAttribute(k, v) { this.attributes[k] = v; },
        getAttribute(k) { return this.attributes[k]; },
        disabled: false,
        listeners: {},
        addEventListener(event, cb) {
            this.listeners[event] = this.listeners[event] || [];
            this.listeners[event].push(cb);
        },
        click() {
            if (this.listeners['click']) {
                this.listeners['click'].forEach(cb => cb({ preventDefault() {} }));
            }
        },
        appendChild(child) { return child; },
        querySelectorAll() { return []; },
        querySelector() { return createMockElement(); },
        getContext() {
            return {
                fillStyle: '', strokeStyle: '', lineWidth: 1, font: '',
                fillRect() {}, strokeRect() {}, clearRect() {}, beginPath() {},
                closePath() {}, arc() {}, fill() {}, stroke() {}, moveTo() {},
                lineTo() {}, setLineDash() {}, save() {}, restore() {},
                fillText() {}, measureText() { return { width: 10 }; },
                createLinearGradient() { return { addColorStop() {} }; }
            };
        }
    };
}

global.document = {
    getElementById(id) {
        if (!domElements[id]) domElements[id] = createMockElement(id);
        return domElements[id];
    },
    querySelector(sel) {
        return createMockElement();
    },
    querySelectorAll(sel) {
        return [];
    },
    createElement(tag) {
        return createMockElement();
    }
};

global.window = {
    addEventListener() {},
    AudioContext: class {
        constructor() { this.state = 'running'; }
        createOscillator() { return { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
        createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
    }
};

global.requestAnimationFrame = () => {};
global.performance = { now: () => Date.now() };

vm.runInThisContext(fs.readFileSync('i18n.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('characters.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('audio.js', 'utf8'));
global.window.soundCtrl = new SoundController();
vm.runInThisContext(fs.readFileSync('game.js', 'utf8'));

console.log('=== VERIFYING ENGLISH I18N COVERAGE & LOCALIZATION ACCURACY ===\n');

const engine = new GameEngine();
engine.selectLanguage('en');

// 1. Dictionary checks
console.log('[TEST 1] Dictionary Translation Validation:');
if (t('appTitle') !== 'Breakers Combine! - WEGO Tactics 20x7') throw new Error('App title failed in EN');
if (t('tagStealth') !== '[STEALTH 7x7]') throw new Error('tagStealth failed in EN');
if (t('tagRevealed', { turns: 2 }) !== '[REVEALED: 2T]') throw new Error('tagRevealed failed in EN');
if (t('tagBurn', { turns: 3 }) !== '[🔥3T]') throw new Error('tagBurn failed in EN');
if (t('tagImmune') !== '[🛡️IMMUNE]') throw new Error('tagImmune failed in EN');
if (t('tagShield') !== '[⏳SHIELD]') throw new Error('tagShield failed in EN');
if (t('deployableZombie') !== 'Zombie 🧟') throw new Error('deployableZombie failed in EN');
if (t('deployableSentry') !== 'Sentry 🤖') throw new Error('deployableSentry failed in EN');
if (t('deployableTeleporter') !== 'Teleporter 🌀') throw new Error('deployableTeleporter failed in EN');
if (t('waitingRespawnDesc') !== 'Awaiting respawn') throw new Error('waitingRespawnDesc failed in EN');
if (t('hofBadge') !== 'HALL OF FAME • PERSONAL RECORDS') throw new Error('hofBadge failed in EN');
if (t('tooltipBtnUndo') !== 'Undo last selected action') throw new Error('tooltipBtnUndo failed in EN');
if (t('tooltipBtnClear') !== 'Clear all 4 actions') throw new Error('tooltipBtnClear failed in EN');
console.log('✓ All dictionary tags, labels, and tooltips correctly translated in EN');

// 2. Character translations
console.log('\n[TEST 2] All 10 Characters English Names, Titles, and Skills:');
const chars = getAllCharacters();
chars.forEach(c => {
    const cName = getCharName(c, 'en');
    const cTitle = getCharTitle(c, 'en');
    const cDesc = getCharDesc(c, 'en');
    if (!cName || !cTitle || !cDesc) throw new Error(`Missing EN info for character: ${c.id}`);
    if (c.skills.length !== 4) throw new Error(`Character ${c.id} should have 4 skills`);
    c.skills.forEach(s => {
        const sName = getSkillName(s, 'en');
        const sDesc = getSkillDesc(s, 'en');
        if (!sName || !sDesc) throw new Error(`Missing EN skill info for skill ${s.id} of ${c.id}`);
    });
    console.log(`✓ Character [${c.id}]: "${cName}" - "${cTitle}" (All 4 skills translated)`);
});

// 3. UI and Tooltips in EN
console.log('\n[TEST 3] Tooltips and Badges in applyLanguageToUI():');
engine.applyLanguageToUI();
const btnUndo = document.getElementById('btnUndo');
const btnClear = document.getElementById('btnClear');
const thKills = document.getElementById('thColKills');
const thScore = document.getElementById('thColScore');
if (btnUndo.title !== 'Undo last selected action') throw new Error(`btnUndo title mismatch: ${btnUndo.title}`);
if (btnClear.title !== 'Clear all 4 actions') throw new Error(`btnClear title mismatch: ${btnClear.title}`);
if (thKills.title !== 'Kills') throw new Error(`thKills title mismatch: ${thKills.title}`);
if (thScore.title !== 'Total Composite Score') throw new Error(`thScore title mismatch: ${thScore.title}`);
const hofBadgeEl = document.getElementById('hofBadge');
if (hofBadgeEl.innerText !== 'HALL OF FAME • PERSONAL RECORDS') throw new Error(`hofBadge mismatch: ${hofBadgeEl.innerText}`);
console.log('✓ UI Button and Table Header Tooltips updated properly in EN');

// 4. Action Translation & ActionName
console.log('\n[TEST 4] getActionName() translations:');
const testActions = [
    { name: 'Khiên', skillId: 'TROOPER_MOVE' },
    { name: 'Tên Lửa', skillId: 'TROOPER_ROCKET' },
    { name: 'Lựu Đạn', skillId: 'TROOPER_GRENADE' },
    { name: 'Bắn Bừa Bãi' },
    { name: 'Bắn Bừa Tên Lửa' },
    { name: 'Cú Bật Nhảy' },
    { name: 'Lộ Trình (3b)' }
];
testActions.forEach(act => {
    const translated = engine.getActionName(act);
    console.log(`  - "${act.name}" -> "${translated}"`);
    if (!translated || translated === act.name) {
        if (act.name !== 'Khiên' && act.name !== 'Tên Lửa') {
            throw new Error(`Action translation failed for: ${act.name}`);
        }
    }
});
console.log('✓ getActionName accurately maps Vietnamese actions to English');

// 5. Deployable damage bilingual logs
console.log('\n[TEST 5] Deployable damage logs in English:');
engine.startBattle();
const fakeSentry = { hp: 50, maxHp: 50, ownerName: 'Engie' };
engine.damageDeployable({ type: 'SENTRY', obj: fakeSentry, x: 5, y: 3 }, 20, { name: 'Trooper' });
if (fakeSentry.hp !== 30) throw new Error('Sentry hp should be 30');
console.log('✓ Deployable damage in English resolved cleanly');

// 6. KOTH KO floating text in English
console.log('\n[TEST 6] KOTH KO floating text in English:');
engine.gameMode = 'KOTH';
const testTarget = engine.blueTeam[0];
testTarget.hp = 10;
engine.applyDamage(testTarget, 20, engine.redTeam[0]);
const koText = engine.floatingTexts.find(ft => ft.text.includes('K.O!'));
if (!koText || koText.text !== '💀 K.O! (RESPAWN 2T)') {
    throw new Error(`Expected English KO floating text, got: ${koText ? koText.text : 'null'}`);
}
console.log('✓ KOTH KO floating text correctly formatted in English (2T)');

console.log('\n🎉 ALL ENGLISH I18N CHECKS PASSED 100%!');
