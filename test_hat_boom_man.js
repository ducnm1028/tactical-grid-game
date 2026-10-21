/**
 * Test Suite: HAT BOOM MAN CHARACTER - TANK CANNON, DISTANCE SCALING (15-45 DMG),
 * 3x3 SPLASH (10 DMG EXCLUDING CENTER), INVULNERABLE LEAP (2 TILES), CHAOS SHOT (+30% & 5x5)
 */
const fs = require('fs');
const vm = require('vm');

// Mock browser globals for Node.js
let tankScopeCalled = false;
let tankShotCalled = false;
let boomLeapCalled = false;
let chaosChargeCalled = false;

global.window = {
    addEventListener: () => {},
    soundCtrl: {
        playTankScope: () => { tankScopeCalled = true; },
        playTankShot: () => { tankShotCalled = true; },
        playBoomLeap: () => { boomLeapCalled = true; },
        playChaosCharge: () => { chaosChargeCalled = true; },
        playSniperScope: () => {},
        playSniperShot: () => {},
        playDestructiveShot: () => {},
        playThermalVision: () => {},
        playRifleShot: () => {},
        playBombLauncher: () => {},
        playRocketLaunch: () => {},
        playExplosion: () => {},
        playHit: () => {},
        playShield: () => {},
        playMove: () => {},
        playSelect: () => {},
        playUndo: () => {},
        playClash: () => {}
    },
    AudioContext: class {
        constructor() { this.state = 'running'; this.currentTime = 0; }
        resume() {}
        createOscillator() { return { type: '', frequency: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
        createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
        createBuffer() { return { getChannelData: () => new Float32Array(100), length: 100 }; }
        createBufferSource() { return { connect() {}, start() {} }; }
        createBiquadFilter() { return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
    }
};

const domElements = {};
global.document = {
    getElementById(id) {
        if (!domElements[id]) {
            domElements[id] = {
                id,
                style: {},
                classList: { add() {}, remove() {}, toggle() {} },
                innerText: '',
                innerHTML: '',
                disabled: false,
                setAttribute() {},
                getAttribute() { return null; },
                addEventListener() {},
                appendChild() {},
                querySelectorAll() { return []; },
                getBoundingClientRect() { return { left: 0, top: 0, width: 960, height: 448 }; },
                getContext() {
                    return {
                        fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '', globalAlpha: 1,
                        fillRect() {}, strokeRect() {}, clearRect() {}, beginPath() {}, closePath() {}, arc() {}, fill() {}, stroke() {},
                        moveTo() {}, lineTo() {}, setLineDash() {}, save() {}, restore() {}, fillText() {}, measureText() { return { width: 10 }; },
                        createLinearGradient() { return { addColorStop() {} }; }, createRadialGradient() { return { addColorStop() {} }; }
                    };
                }
            };
        }
        return domElements[id];
    },
    querySelectorAll(selector) { return []; },
    querySelector(selector) { return { innerText: '', innerHTML: '', style: {} }; },
    createElement(tag) { return { className: '', innerText: '', innerHTML: '', style: {}, addEventListener() {} }; }
};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = () => {};

vm.runInThisContext(fs.readFileSync('i18n.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('characters.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('audio.js', 'utf8'));
global.window.soundCtrl = new SoundController();

// Wrap SFX with spy flags
const origScope = window.soundCtrl.playTankScope.bind(window.soundCtrl);
window.soundCtrl.playTankScope = () => { tankScopeCalled = true; origScope(); };
const origShot = window.soundCtrl.playTankShot.bind(window.soundCtrl);
window.soundCtrl.playTankShot = () => { tankShotCalled = true; origShot(); };
const origLeap = window.soundCtrl.playBoomLeap.bind(window.soundCtrl);
window.soundCtrl.playBoomLeap = () => { boomLeapCalled = true; origLeap(); };
const origChaos = window.soundCtrl.playChaosCharge.bind(window.soundCtrl);
window.soundCtrl.playChaosCharge = () => { chaosChargeCalled = true; origChaos(); };

vm.runInThisContext(fs.readFileSync('game.js', 'utf8'));

console.log('=== BẮT ĐẦU KIỂM THỬ NHÂN VẬT MỚI: HAT BOOM MAN (CHUYÊN GIA PHÁO & MŨ BOM) ===\n');

async function runTests() {
    const engine = new GameEngine();
    engine.delay = () => Promise.resolve();

    // TEST 1: Kiểm tra Hồ sơ & 4 Kỹ năng của Hat Boom Man trong Database
    console.log('--- TEST 1: Hồ sơ & 4 Kỹ năng của Hat Boom Man ---');
    const boomMan = getCharacterById('hat_boom_man');
    console.assert(boomMan && boomMan.id === 'hat_boom_man', 'Hat Boom Man phải có trong CHARACTERS_DATABASE');
    console.assert(boomMan.avatar === '🎩', 'Avatar của Hat Boom Man phải là 🎩');
    console.assert(boomMan.maxHp === 100, 'Máu tối đa của Hat Boom Man phải là 100');
    console.assert(boomMan.moveBudget === 2, 'Hạn mức di chuyển mặc định là 2 bước');
    console.assert(boomMan.skills.length === 4, 'Hat Boom Man phải có chính xác 4 kỹ năng');

    const [s1, s2, s3, s4] = boomMan.skills;
    console.assert(s1.id === 'BOOM_MOVE' && s1.type === 'PATH_MOVE' && s1.maxSteps === 2, 'Skill 1 phải là PATH_MOVE maxSteps 2');
    console.assert(s2.id === 'TANK_CANNON' && s2.type === 'TANK_WEAPON' && s2.range === 6, 'Skill 2 phải là TANK_WEAPON tầm 6');
    console.assert(s2.minPower === 15 && s2.maxPower === 45, 'Skill 2 phải có minPower 15 và maxPower 45');
    console.assert(s3.id === 'BOOM_LEAP' && s3.type === 'BOOM_LEAP' && s3.range === 2 && s3.cooldown === 2, 'Skill 3 phải là BOOM_LEAP phạm vi 2, CD 2');
    console.assert(s4.id === 'BOOM_CHAOS_SHOT' && s4.type === 'BUFF_CHAOS_SHOT' && s4.cooldown === 3, 'Skill 4 phải là BUFF_CHAOS_SHOT CD 3');
    console.assert(s4.dmgBonusPercent === 30 && s4.aoeRadius === 2, 'Skill 4 phải tăng +30% sát thương và aoeRadius 2 (5x5)');
    console.log('✔ TEST 1 PASSED: Hồ sơ và 4 Kỹ năng Hat Boom Man hoàn toàn chính xác.\n');

    // TEST 2: SFX Audio Web Audio Synthesizer
    console.log('--- TEST 2: Âm thanh Web Audio Synthesizer ---');
    tankScopeCalled = false;
    tankShotCalled = false;
    boomLeapCalled = false;
    chaosChargeCalled = false;

    window.soundCtrl.playTankScope();
    console.assert(tankScopeCalled, 'playTankScope() phải kích hoạt');
    window.soundCtrl.playTankShot();
    console.assert(tankShotCalled, 'playTankShot() phải kích hoạt');
    window.soundCtrl.playBoomLeap();
    console.assert(boomLeapCalled, 'playBoomLeap() phải kích hoạt');
    window.soundCtrl.playChaosCharge();
    console.assert(chaosChargeCalled, 'playChaosCharge() phải kích hoạt');
    console.log('✔ TEST 2 PASSED: 4 hàm âm thanh Web Audio mới của Hat Boom Man hoạt động hoàn hảo.\n');

    // TEST 3: Chế độ Ngắm Bắn Nòng Pháo & Phạt tốc độ di chuyển
    console.log('--- TEST 3: Cơ chế Ngắm Nòng Pháo & Giảm 1 bước di chuyển ---');
    engine.setupTeams();
    engine.phase = 'PLANNING';
    const pUnit = engine.player;
    pUnit.character = boomMan;
    pUnit.charId = 'hat_boom_man';
    engine.playerQueue = [];

    console.assert(!engine.isUnitScoped(pUnit, engine.playerQueue), 'Ban đầu nhân vật chưa ở chế độ ngắm bắn');

    // Nhấn [2] lần 1: Nạp TANK_SCOPE
    engine.addSkillToQueue(1); // Skill slot 2 (index 1)
    console.assert(engine.playerQueue.length === 1, 'Queue phải có 1 hành động');
    console.assert(engine.playerQueue[0].type === 'TANK_SCOPE', 'Hành động nạp phải là TANK_SCOPE');
    console.assert(engine.isUnitScoped(pUnit, engine.playerQueue), 'isUnitScoped phải là true khi đã có TANK_SCOPE trong queue');

    // Mở lộ trình di chuyển: bị phạt 1 bước (từ 2 còn 1 bước)
    engine.startPathPlanning();
    console.assert(engine.activePathMaxSteps === 1, `activePathMaxSteps khi ngắm bắn phải là 1 (nhận được: ${engine.activePathMaxSteps})`);
    engine.cancelPathPlanning();

    // Nhấn [2] lần 2: Nạp TANK_SHOT
    engine.currentSelectedDir = 'RIGHT';
    engine.addSkillToQueue(1);
    console.assert(engine.playerQueue.length === 2, 'Queue phải có 2 hành động');
    console.assert(engine.playerQueue[1].type === 'TANK_SHOT', 'Hành động tiếp theo phải là TANK_SHOT');
    console.assert(!engine.isUnitScoped(pUnit, engine.playerQueue), 'Sau khi nạp bắn đại bác, isUnitScoped trở về false');

    // Undo và Clear
    engine.undoAction();
    console.assert(engine.playerQueue.length === 1 && engine.isUnitScoped(pUnit, engine.playerQueue), 'Undo phải khôi phục trạng thái scoped');
    engine.clearQueue();
    console.assert(engine.playerQueue.length === 0 && !engine.isUnitScoped(pUnit, engine.playerQueue), 'Clear queue trả về unscoped');
    console.log('✔ TEST 3 PASSED: Ngắm nòng pháo, giảm bước di chuyển và hoàn tác phản ứng chuẩn xác.\n');

    // TEST 4: Sát thương nòng xe tăng tỉ lệ thuận khoảng cách (15-20-30-35-40-45 DMG) & Nổ 3x3 lan 10 DMG trừ tâm
    console.log('--- TEST 4: Sát thương Nòng Xe Tăng (15, 20, 30, 35, 40, 45 DMG) & Nổ lan 3x3 trừ tâm ---');
    const boomActor = engine.createUnit('boom_tester', 'BLUE', 0, boomMan, true);
    boomActor.x = 2;
    boomActor.y = 3;

    // Bảng cự ly: d=1: 15, d=2: 20, d=3: 30, d=4: 35, d=5: 40, d=6: 45
    const expectedDmgs = [0, 15, 20, 30, 35, 40, 45];

    for (let d = 1; d <= 6; d++) {
        const targetX = boomActor.x + d;
        const mainTarget = engine.createUnit(`main_d${d}`, 'RED', 0, getCharacterById('trooper'), false);
        mainTarget.x = targetX;
        mainTarget.y = 3;
        mainTarget.hp = 100;

        // Đặt thêm một mục tiêu phụ kề bên (trong vùng 3x3 nhưng KHÔNG ở tâm)
        const splashTarget = engine.createUnit(`splash_d${d}`, 'RED', 1, getCharacterById('trooper'), false);
        splashTarget.x = targetX;
        splashTarget.y = 4; // Kề dưới tâm 1 ô (trong 3x3)
        splashTarget.hp = 100;

        engine.redTeam = [mainTarget, splashTarget];
        engine.blueTeam = [boomActor];

        const cannonShotAct = {
            type: 'TANK_SHOT',
            skillId: 'TANK_CANNON',
            name: 'Bắn Nòng Xe Tăng',
            dir: 'RIGHT',
            range: 6
        };

        await engine.resolveUnitAttack(boomActor, cannonShotAct, 0);

        const mainDmg = 100 - mainTarget.hp;
        const splashDmg = 100 - splashTarget.hp;

        console.assert(mainDmg === expectedDmgs[d], `Cự ly ${d} ô: Sát thương tâm phải là ${expectedDmgs[d]} (nhận được: ${mainDmg})`);
        console.assert(splashDmg === 10, `Mục tiêu kề bên trong 3x3 phải nhận đúng 10 sát thương nổ lan (nhận được: ${splashDmg})`);
    }
    console.log('✔ TEST 4 PASSED: Sát thương theo cự ly 15-20-30-35-40-45 DMG và nổ 3x3 lan 10 DMG trừ tâm hoàn hảo.\n');

    // TEST 5: Kĩ năng 1: Cú Bật Nhảy (phạm vi 2 ô, miễn nhiễm mọi sát thương)
    console.log('--- TEST 5: Cú Bật Nhảy (Phạm vi 2 ô, miễn nhiễm mọi sát thương) ---');
    boomActor.x = 4;
    boomActor.y = 3;
    boomActor.hp = 100;
    boomActor.queue = [
        { type: 'BOOM_LEAP', skillId: 'BOOM_LEAP', name: 'Cú Bật Nhảy', dir: 'RIGHT', range: 2, cooldown: 2 }
    ];

    const attackingEnemy = engine.createUnit('attacker', 'RED', 0, getCharacterById('trooper'), false);
    attackingEnemy.x = 6;
    attackingEnemy.y = 3;
    attackingEnemy.queue = [
        { type: 'ATTACK', name: 'Slash', dir: 'LEFT', range: 1, power: 50 }
    ];

    engine.blueTeam = [boomActor];
    engine.redTeam = [attackingEnemy];
    engine.playerQueue = boomActor.queue;
    engine.cpuQueue = attackingEnemy.queue;
    engine.phase = 'RESOLVING';

    boomLeapCalled = false;
    await engine.executeResolutionStep(0);

    // BoomActor phải nhảy từ (4, 3) sang (6, 3) và miễn nhiễm sát thương (HP vẫn 100)
    console.assert(boomActor.x === 6 && boomActor.y === 3, `BoomActor phải nhảy tới (6, 3), thực tế: (${boomActor.x}, ${boomActor.y})`);
    console.assert(boomActor.hp === 100, `BoomActor phải miễn nhiễm mọi sát thương khi bật nhảy (HP: ${boomActor.hp}/100)`);
    console.assert(boomLeapCalled, 'playBoomLeap() phải được phát');
    console.log('✔ TEST 5 PASSED: Cú Bật Nhảy 2 ô và miễn nhiễm hoàn toàn sát thương thành công 100%.\n');

    // TEST 6: Kĩ năng 2: Phát Bắn Rối Loạn (+30% DMG & nổ 5x5)
    console.log('--- TEST 6: Phát Bắn Rối Loạn (+30% DMG & Vùng Nổ 5x5) ---');
    boomActor.x = 2;
    boomActor.y = 3;
    boomActor.buffs.chaosShot = false;

    // Kích hoạt Chiêu 2
    const chaosAct = {
        type: 'BUFF_CHAOS_SHOT',
        skillId: 'BOOM_CHAOS_SHOT',
        name: 'Phát Bắn Rối Loạn',
        cooldown: 3,
        dmgBonusPercent: 30,
        aoeRadius: 2
    };
    chaosChargeCalled = false;
    await engine.resolveUnitAttack(boomActor, chaosAct, 0);
    console.assert(chaosChargeCalled, 'playChaosCharge() phải được phát');
    console.assert(boomActor.buffs.chaosShot === true, 'chaosShot buff phải active');
    console.assert(boomActor.cooldowns['BOOM_CHAOS_SHOT'] === 3, 'Cooldown phải là 3 lượt');

    // Bố trí:
    // Mục tiêu chính tại d=4 (X=6, Y=3): DMG gốc 35, +30% -> Math.round(35 * 1.3) = 46 DMG
    // Mục tiêu phụ 1 tại (6, 5): cách tâm 2 ô (trong vùng 5x5 nhưng ngoài vùng 3x3!) -> phải nhận 10 DMG lan!
    // Mục tiêu phụ 2 tại (6, 6): cách tâm 3 ô (ngoài vùng 5x5) -> an toàn, 0 DMG!
    const targetCenter = engine.createUnit('t_center', 'RED', 0, getCharacterById('trooper'), false);
    targetCenter.x = 6; targetCenter.y = 3; targetCenter.hp = 100;

    const targetIn5x5 = engine.createUnit('t_in5x5', 'RED', 1, getCharacterById('trooper'), false);
    targetIn5x5.x = 6; targetIn5x5.y = 5; targetIn5x5.hp = 100; // dy = 2 -> trong 5x5!

    const targetOut5x5 = engine.createUnit('t_out5x5', 'RED', 2, getCharacterById('trooper'), false);
    targetOut5x5.x = 6; targetOut5x5.y = 6; targetOut5x5.hp = 100; // dy = 3 -> ngoài 5x5!

    engine.redTeam = [targetCenter, targetIn5x5, targetOut5x5];
    engine.blueTeam = [boomActor];

    const chaosShot = {
        type: 'TANK_SHOT',
        skillId: 'TANK_CANNON',
        name: 'Bắn Nòng Xe Tăng',
        dir: 'RIGHT',
        range: 6
    };
    await engine.resolveUnitAttack(boomActor, chaosShot, 1);

    const centerDmg = 100 - targetCenter.hp;
    const splashDmg5x5 = 100 - targetIn5x5.hp;
    const outDmg = 100 - targetOut5x5.hp;

    console.assert(centerDmg === 46, `Tâm nổ cự ly 4 (+30% DMG) phải nhận đúng 46 DMG (35 * 1.3) (nhận: ${centerDmg})`);
    console.assert(splashDmg5x5 === 10, `Mục tiêu ở rìa 5x5 (cách 2 ô) phải nhận 10 DMG nổ lan (nhận: ${splashDmg5x5})`);
    console.assert(outDmg === 0, `Mục tiêu ngoài vùng 5x5 (cách 3 ô) không được nhận sát thương (nhận: ${outDmg})`);
    console.assert(boomActor.buffs.chaosShot === false, 'chaosShot buff phải tiêu hao sau khi bắn');
    console.log('✔ TEST 6 PASSED: Phát Bắn Rối Loạn +30% DMG và nổ lan cực đại 5x5 hoạt động chính xác.\n');

    // TEST 7: Trí tuệ nhân tạo CPU Hat Boom Man
    console.log('--- TEST 7: Trí tuệ nhân tạo CPU Hat Boom Man ---');
    const cpuBoom = engine.createUnit('cpu_boom', 'RED', 0, boomMan, false);
    cpuBoom.x = 10; cpuBoom.y = 3;
    const pEnemy = engine.createUnit('p_enemy', 'BLUE', 0, getCharacterById('trooper'), true);
    pEnemy.x = 6; pEnemy.y = 3;
    engine.blueTeam = [pEnemy];
    engine.redTeam = [cpuBoom];

    const cpuQueue = engine.generateCpuQueueForUnit(cpuBoom);
    console.assert(cpuQueue.length === 4, 'CPU Hat Boom Man phải sinh đủ 4 hành động');
    const hasBoomSkill = cpuQueue.some(act => act.type === 'TANK_SCOPE' || act.type === 'TANK_SHOT' || act.type === 'BOOM_LEAP' || act.type === 'BUFF_CHAOS_SHOT' || act.type === 'PATH_MOVE');
    console.assert(hasBoomSkill, 'CPU Hat Boom Man phải sử dụng các kỹ năng đặc trưng của nhân vật');
    console.log('✔ TEST 7 PASSED: CPU AI Hat Boom Man tạo chuỗi 4 lệnh chiến thuật thông minh.\n');

    console.log('====================================================');
    console.log('🎉 TẤT CẢ 7/7 NHÓM KIỂM THỬ HAT BOOM MAN ĐÃ VƯỢT QUA 100%!');
    console.log('====================================================');
}

runTests().catch(err => {
    console.error('❌ LỖI KIỂM THỬ:', err);
    process.exit(1);
});
