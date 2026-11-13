const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const domElements = {};
global.localStorage = {
    store: {},
    getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; }
};

let oscStartCount = 0;
class MockAudioContext {
    constructor() {
        this.state = 'running';
        this.currentTime = 0;
        this.sampleRate = 44100;
        this.destination = {};
    }
    resume() {}
    createOscillator() {
        return {
            type: '',
            frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
            connect() {},
            start() { oscStartCount++; },
            stop() {}
        };
    }
    createGain() {
        return {
            gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
            connect() {}
        };
    }
    createBuffer(ch, len) {
        return { length: len, getChannelData: () => new Float32Array(len) };
    }
    createBufferSource() {
        return { buffer: null, connect() {}, start() { oscStartCount++; } };
    }
    createBiquadFilter() {
        return {
            type: '',
            Q: { value: 1 },
            frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
            connect() {}
        };
    }
}

global.AudioContext = MockAudioContext;
global.window = {
    addEventListener() {},
    AudioContext: MockAudioContext,
    soundCtrl: null
};

global.document = {
    title: '',
    documentElement: { lang: 'vi' },
    getElementById(id) {
        if (!domElements[id]) {
            domElements[id] = {
                id,
                style: {},
                className: '',
                classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
                innerText: '',
                innerHTML: '',
                title: '',
                disabled: false,
                setAttribute() {},
                getAttribute() { return null; },
                addEventListener() {},
                appendChild() {},
                querySelector() { return null; },
                querySelectorAll() { return []; },
                getBoundingClientRect() { return { left: 0, top: 0, width: 960, height: 448 }; },
                getContext() {
                    return {
                        fillStyle: '', strokeStyle: '', lineWidth: 1, font: '',
                        textAlign: '', textBaseline: '', globalAlpha: 1,
                        fillRect() {}, strokeRect() {}, clearRect() {},
                        beginPath() {}, closePath() {}, arc() {}, fill() {}, stroke() {},
                        moveTo() {}, lineTo() {}, setLineDash() {}, save() {}, restore() {},
                        fillText() {}, measureText() { return { width: 10 }; },
                        createLinearGradient() { return { addColorStop() {} }; }
                    };
                }
            };
        }
        return domElements[id];
    },
    querySelector() {
        return { innerText: '', innerHTML: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {} };
    },
    querySelectorAll() { return []; },
    createElement(tag) {
        return { tagName: tag, className: '', innerText: '', innerHTML: '', style: {}, appendChild() {}, parentNode: { insertBefore() {} } };
    },
    getElementsByTagName() {
        return [{ parentNode: { insertBefore() {} } }];
    }
};

global.requestAnimationFrame = () => {};
global.performance = { now: () => Date.now() };

vm.runInThisContext(fs.readFileSync('./audio.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('./i18n.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('./characters.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('./game.js', 'utf8'));

async function runAuditTests() {
    console.log('=== KIỂM THỬ HỒI QUY: RACE CONDITION, STATE RESET, AUDIO MUTE & BẢO MẬT XSS ===\n');

    // [TEST 1] SoundController respects enabled = false across all combat SFX
    oscStartCount = 0;
    window.soundCtrl.enabled = false;
    window.soundCtrl.playMove();
    window.soundCtrl.playAttack();
    window.soundCtrl.playRifleShot();
    window.soundCtrl.playExplosion();
    window.soundCtrl.playHealStation();
    window.soundCtrl.playNecromancy();
    assert.strictEqual(oscStartCount, 0, 'Muted SoundController must not trigger any oscillator/buffer playback!');

    window.soundCtrl.enabled = true;
    window.soundCtrl.playMove();
    assert.ok(oscStartCount > 0, 'Enabled SoundController must play sound normally!');
    console.log('✓ [TEST 1] SoundController chặn 100% SFX khi tắt tiếng hoặc đang phát quảng cáo SDK!');

    // [TEST 2] Duplicate SDK_GAME_PAUSE does not overwrite user sound preference
    const htmlContent = fs.readFileSync('./index.html', 'utf8');
    const sdkMatch = htmlContent.match(/<script type="text\/javascript">([\s\S]*?)<\/script>/);
    assert.ok(sdkMatch, 'SDK script block must exist in index.html');
    vm.runInThisContext(sdkMatch[1]);
    window.soundCtrl.enabled = true;
    window.__isAdShowing = false;
    window.SDK_OPTIONS.onEvent({ name: 'SDK_GAME_PAUSE' });
    window.SDK_OPTIONS.onEvent({ name: 'SDK_GAME_PAUSE' }); // Duplicate pause event!
    assert.strictEqual(window.soundCtrl.enabled, false, 'Sound must be muted during pause');
    window.SDK_OPTIONS.onEvent({ name: 'SDK_GAME_START' });
    assert.strictEqual(window.soundCtrl.enabled, true, 'Sound must restore to true even after duplicate SDK_GAME_PAUSE!');
    console.log('✓ [TEST 2] Chống ghi đè trạng thái âm thanh khi SDK gửi lặp sự kiện SDK_GAME_PAUSE!');

    // [TEST 3] Arena entity cleanup across startBattle() and restartGame()
    const engine = new GameEngine();
    engine.groundHazards.push({ id: 1, x: 5, y: 3 });
    engine.fireZones.push({ id: 2, x: 6, y: 3 });
    engine.sentries.push({ id: 3, x: 7, y: 3, hp: 50 });
    engine.teleporters.push({ id: 4, inX: 2, inY: 2, outX: 8, outY: 2, hp: 60 });
    engine.zombies.push({ id: 5, x: 4, y: 3, hp: 40 });
    engine.activeHookTethers.push({ skillId: 'HOOK' });

    engine.startBattle();
    assert.strictEqual(engine.groundHazards.length, 0, 'startBattle must clear groundHazards');
    assert.strictEqual(engine.fireZones.length, 0, 'startBattle must clear fireZones');
    assert.strictEqual(engine.sentries.length, 0, 'startBattle must clear sentries');
    assert.strictEqual(engine.teleporters.length, 0, 'startBattle must clear teleporters');
    assert.strictEqual(engine.zombies.length, 0, 'startBattle must clear zombies');
    assert.strictEqual(engine.activeHookTethers.length, 0, 'startBattle must clear activeHookTethers');

    engine.zombies.push({ id: 9, x: 4, y: 3, hp: 40 });
    engine.restartGame();
    assert.strictEqual(engine.zombies.length, 0, 'restartGame must also clear zombies');
    console.log('✓ [TEST 3] startBattle() & restartGame() dọn sạch hoàn toàn vật thể/thây ma tồn dư từ ván cũ!');

    // [TEST 4] Async executeResolutionStep cancellation on mid-turn exit/restart
    let pendingResolve = null;
    engine.delay = () => new Promise(res => { pendingResolve = res; });
    engine.selectedCharacter = getCharacterById('trooper');
    engine.startBattle();
    const oldTurn = engine.turn;
    engine.playerQueue = [
        { type: 'PATH_MOVE', name: 'Route', icon: '👟', path: [{ x: 3, y: 3, dir: 'RIGHT' }] },
        { type: 'PATH_MOVE', name: 'Route', icon: '👟', path: [{ x: 4, y: 3, dir: 'RIGHT' }] },
        { type: 'PATH_MOVE', name: 'Route', icon: '👟', path: [{ x: 5, y: 3, dir: 'RIGHT' }] },
        { type: 'PATH_MOVE', name: 'Route', icon: '👟', path: [{ x: 6, y: 3, dir: 'RIGHT' }] }
    ];
    engine.commitTurn();
    assert.strictEqual(engine.phase, 'RESOLVING');
    // User exits to Main Menu mid-resolution while awaiting delay(180)
    engine.showMainMenuScreen();
    assert.strictEqual(engine.phase, 'MAIN_MENU');
    if (pendingResolve) pendingResolve();
    await Promise.resolve();
    await Promise.resolve();
    assert.strictEqual(engine.phase, 'MAIN_MENU', 'Cancelled resolution must not overwrite MAIN_MENU phase!');
    assert.strictEqual(engine.turn, oldTurn, 'Cancelled resolution must not advance turn!');
    engine.delay = () => Promise.resolve();
    console.log('✓ [TEST 4] Hủy tức thì chuỗi bất đồng bộ executeResolutionStep khi thoát/chơi lại giữa lượt!');

    // [TEST 5] Skill metadata preservation in addSkillToQueue (Fake Savior)
    engine.selectedCharacter = getCharacterById('fake_savior');
    engine.startBattle();
    engine.addSkillToQueue(2); // Telekinesis
    engine.addSkillToQueue(3); // Necromancy
    assert.strictEqual(engine.playerQueue[0].comboPower, 30, 'Telekinesis comboPower must be preserved');
    assert.strictEqual(engine.playerQueue[0].knockback, 3, 'Telekinesis knockback must be preserved');
    assert.strictEqual(engine.playerQueue[1].zombieHp, 40, 'Necromancy zombieHp must be preserved');
    assert.strictEqual(engine.playerQueue[1].zombiePower, 35, 'Necromancy zombiePower must be preserved');
    console.log('✓ [TEST 5] Bảo toàn đầy đủ thuộc tính kỹ năng đặc thù khi nạp hàng đợi!');

    // [TEST 6] Corrupted localStorage & XSS sanitization in Hall of Fame
    localStorage.setItem('crazy_warfare_match_history', '{"corrupted":true}');
    assert.deepStrictEqual(engine.getMatchHistory(), [], 'Non-array JSON must safely return []');

    localStorage.setItem('crazy_warfare_match_history', JSON.stringify([
        null,
        {
            outcome: 'VICTORY',
            dateFormatted: '<script>alert(1)</script>',
            gameMode: 'KOTH',
            teamSize: '5v5',
            playerChar: '',
            playerCharName: '<img src=x onerror=alert(2)>',
            playerAvatar: '🪖',
            kills: 5,
            deaths: 1,
            damageDealt: 300,
            score: 750,
            mvpAvatar: '👑',
            mvpName: '<svg onload=alert(3)>'
        }
    ]));
    engine.openHallOfFame();
    const hofHtml = domElements['hofTbody'].innerHTML;
    assert.ok(!hofHtml.includes('<script>'), 'Script tag must be escaped in Hall of Fame');
    assert.ok(!hofHtml.includes('<img src=x'), 'XSS img tag must be escaped in Hall of Fame');
    assert.ok(!hofHtml.includes('<svg onload='), 'XSS svg tag must be escaped in Hall of Fame');
    assert.ok(hofHtml.includes('&lt;img src=x onerror=alert(2)&gt;'), 'Escaped text must be rendered safely');
    localStorage.removeItem('crazy_warfare_match_history');
    console.log('✓ [TEST 6] Chống lỗi localStorage hỏng và ngăn chặn hoàn toàn DOM XSS trên Bảng Kỷ Lục!');

    console.log('\n🎉 TẤT CẢ 6/6 BÀI KIỂM THỬ HỒI QUY & BẢO MẬT ĐÃ VƯỢT QUA 100%!');
}

runAuditTests().catch(err => {
    console.error(err);
    process.exit(1);
});
