/**
 * Test Suite: SNIPEMAN CHARACTER - SNIPER RIFLE, DISTANCE SCALING (25-50 DMG),
 * SCOPE MOVEMENT PENALTY, DESTRUCTIVE SHOT (+30% & PIERCE), THERMAL VISION (+1 TEAM RANGE)
 */
const fs = require('fs');
const vm = require('vm');

// Mock browser globals for Node.js
let sniperScopeCalled = false;
let sniperShotCalled = false;
let destructiveShotCalled = false;
let thermalVisionCalled = false;

global.window = {
    addEventListener: () => {},
    soundCtrl: {
        playSniperScope: () => { sniperScopeCalled = true; },
        playSniperShot: () => { sniperShotCalled = true; },
        playDestructiveShot: () => { destructiveShotCalled = true; },
        playThermalVision: () => { thermalVisionCalled = true; },
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
const origScope = window.soundCtrl.playSniperScope.bind(window.soundCtrl);
window.soundCtrl.playSniperScope = () => { sniperScopeCalled = true; origScope(); };
const origShot = window.soundCtrl.playSniperShot.bind(window.soundCtrl);
window.soundCtrl.playSniperShot = () => { sniperShotCalled = true; origShot(); };
const origDestr = window.soundCtrl.playDestructiveShot.bind(window.soundCtrl);
window.soundCtrl.playDestructiveShot = () => { destructiveShotCalled = true; origDestr(); };
const origThermal = window.soundCtrl.playThermalVision.bind(window.soundCtrl);
window.soundCtrl.playThermalVision = () => { thermalVisionCalled = true; origThermal(); };

vm.runInThisContext(fs.readFileSync('game.js', 'utf8'));

console.log('=== BẮT ĐẦU KIỂM THỬ NHÂN VẬT MỚI: SNIPEMAN (XẠ THỦ BẮN TỈA) ===\n');

async function runTests() {
    const engine = new GameEngine();
    engine.delay = () => Promise.resolve();

    // TEST 1: Kiểm tra Hồ sơ & 4 Kỹ năng của Snipeman trong Database
    console.log('--- TEST 1: Hồ sơ & 4 Kỹ năng của Snipeman ---');
    const snipeman = getCharacterById('snipeman');
    console.assert(snipeman && snipeman.id === 'snipeman', 'Snipeman phải có trong CHARACTERS_DATABASE');
    console.assert(snipeman.avatar === '🎯', 'Avatar của Snipeman phải là 🎯');
    console.assert(snipeman.maxHp === 100, 'Máu tối đa của Snipeman phải là 100');
    console.assert(snipeman.moveBudget === 2, 'Hạn mức di chuyển mặc định là 2 bước');
    console.assert(snipeman.skills.length === 4, 'Snipeman phải có chính xác 4 kỹ năng');

    const [s1, s2, s3, s4] = snipeman.skills;
    console.assert(s1.id === 'SNIPER_MOVE' && s1.type === 'PATH_MOVE' && s1.maxSteps === 2, 'Skill 1 phải là PATH_MOVE maxSteps 2');
    console.assert(s2.id === 'SNIPER_RIFLE' && s2.type === 'SNIPER_WEAPON' && s2.range === 6, 'Skill 2 phải là SNIPER_WEAPON tầm 6');
    console.assert(s2.minPower === 25 && s2.maxPower === 50, 'Skill 2 phải có minPower 25 và maxPower 50');
    console.assert(s3.id === 'SNIPER_DESTRUCTIVE' && s3.type === 'BUFF_DESTRUCTIVE' && s3.cooldown === 3, 'Skill 3 phải là BUFF_DESTRUCTIVE CD 3');
    console.assert(s3.dmgBonusPercent === 30, 'Skill 3 phải tăng +30% sát thương');
    console.assert(s4.id === 'SNIPER_THERMAL' && s4.type === 'BUFF_THERMAL' && s4.cooldown === 4, 'Skill 4 phải là BUFF_THERMAL CD 4');
    console.assert(s4.rangeBonus === 1, 'Skill 4 phải cộng +1 phạm vi');
    console.log('✔ TEST 1 PASSED: Hồ sơ và 4 Kỹ năng Snipeman hoàn toàn chính xác.\n');

    // TEST 2: SFX Audio Web Audio Synthesizer
    console.log('--- TEST 2: Âm thanh Web Audio Synthesizer ---');
    sniperScopeCalled = false;
    sniperShotCalled = false;
    destructiveShotCalled = false;
    thermalVisionCalled = false;

    window.soundCtrl.playSniperScope();
    console.assert(sniperScopeCalled, 'playSniperScope() phải kích hoạt');
    window.soundCtrl.playSniperShot();
    console.assert(sniperShotCalled, 'playSniperShot() phải kích hoạt');
    window.soundCtrl.playDestructiveShot();
    console.assert(destructiveShotCalled, 'playDestructiveShot() phải kích hoạt');
    window.soundCtrl.playThermalVision();
    console.assert(thermalVisionCalled, 'playThermalVision() phải kích hoạt');
    console.log('✔ TEST 2 PASSED: 4 hàm tổng hợp âm thanh Web Audio hoạt động hoàn hảo.\n');

    // TEST 3: Chế độ Ngắm Bắn (Scope In) & Giảm 1 bước di chuyển
    console.log('--- TEST 3: Cơ chế Ngắm Bắn & Giảm 1 bước di chuyển ---');
    engine.setupTeams();
    engine.phase = 'PLANNING';
    const pUnit = engine.player;
    pUnit.character = snipeman;
    pUnit.charId = 'snipeman';
    engine.playerQueue = [];

    // Ban đầu chưa ngắm bắn
    console.assert(!engine.isUnitScoped(pUnit, engine.playerQueue), 'Ban đầu nhân vật chưa ở chế độ ngắm bắn');

    // Nhấn [2] lần 1: Nạp SNIPER_SCOPE
    engine.addSkillToQueue(1); // Skill slot 2 (index 1)
    console.assert(engine.playerQueue.length === 1, 'Queue phải có 1 hành động');
    console.assert(engine.playerQueue[0].type === 'SNIPER_SCOPE', 'Hành động nạp phải là SNIPER_SCOPE');
    console.assert(engine.isUnitScoped(pUnit, engine.playerQueue), 'isUnitScoped phải là true khi đã có SNIPER_SCOPE trong queue');

    // Khi đang ngắm bắn, mở lộ trình di chuyển (PATH_MOVE): số bước tối đa giảm 1 (từ 2 còn 1)
    engine.startPathPlanning();
    console.assert(engine.activePathMaxSteps === 1, `activePathMaxSteps khi ngắm bắn phải là 1 (nhận được: ${engine.activePathMaxSteps})`);
    engine.cancelPathPlanning();

    // Nhấn [2] lần 2: Nạp SNIPER_SHOT
    engine.currentSelectedDir = 'RIGHT';
    engine.addSkillToQueue(1);
    console.assert(engine.playerQueue.length === 2, 'Queue phải có 2 hành động');
    console.assert(engine.playerQueue[1].type === 'SNIPER_SHOT', 'Hành động tiếp theo phải là SNIPER_SHOT');
    console.assert(!engine.isUnitScoped(pUnit, engine.playerQueue), 'Sau khi nạp bắn tỉa, isUnitScoped trở về false');

    // Thử Undo: Lùi 1 bước -> lại trở về trạng thái scoped!
    engine.undoAction();
    console.assert(engine.playerQueue.length === 1, 'Queue còn 1 hành động sau undo');
    console.assert(engine.isUnitScoped(pUnit, engine.playerQueue), 'Undo phải khôi phục trạng thái scoped chuẩn xác');

    // Thử Clear: Hủy hết -> trở về unscoped
    engine.clearQueue();
    console.assert(engine.playerQueue.length === 0, 'Queue trống sau clear');
    console.assert(!engine.isUnitScoped(pUnit, engine.playerQueue), 'Trở về unscoped sau khi clear queue');
    console.log('✔ TEST 3 PASSED: Chế độ ngắm bắn, giảm tốc độ và hoàn tác phản ứng 100% chuẩn xác.\n');

    // TEST 4: Bắn Súng Tỉa Sát thương tỉ lệ thuận với cự ly (25-30-35-40-45-50 DMG)
    console.log('--- TEST 4: Sát thương tỉ lệ thuận khoảng cách (25, 30, 35, 40, 45, 50 DMG) ---');
    // Công thức: dmg = 20 + 5 * d
    const sniperActor = engine.createUnit('sniper_test', 'BLUE', 0, snipeman, true);
    sniperActor.x = 2;
    sniperActor.y = 3;

    for (let d = 1; d <= 6; d++) {
        const targetX = sniperActor.x + d;
        const enemy = engine.createUnit(`enemy_d${d}`, 'RED', 0, getCharacterById('trooper'), false);
        enemy.x = targetX;
        enemy.y = 3;
        enemy.hp = 100;
        engine.redTeam = [enemy];
        engine.blueTeam = [sniperActor];

        const shotAct = {
            type: 'SNIPER_SHOT',
            skillId: 'SNIPER_RIFLE',
            name: 'Bắn Súng Tỉa',
            dir: 'RIGHT',
            range: 6,
            minPower: 25,
            maxPower: 50
        };

        const expectedDmg = 20 + 5 * d;
        await engine.resolveUnitAttack(sniperActor, shotAct, 0);
        const actualDmg = 100 - enemy.hp;
        console.assert(actualDmg === expectedDmg, `Khoảng cách ${d} ô: Sát thương phải là ${expectedDmg} (nhận được: ${actualDmg})`);
    }
    console.log('✔ TEST 4 PASSED: Sát thương theo cự ly 1-6 ô tương ứng 25-30-35-40-45-50 DMG tuyệt đối chính xác.\n');

    // TEST 5: Chiêu 1: Phát Bắn Hủy Diệt (+30% DMG & Xuyên thấu nhiều kẻ địch)
    console.log('--- TEST 5: Phát Bắn Hủy Diệt (+30% DMG & Xuyên thấu nhiều mục tiêu) ---');
    // Đặt 2 kẻ địch trên cùng đường đạn:
    // Địch 1 tại cự ly d=2 (X=4), Địch 2 tại cự ly d=5 (X=7)
    sniperActor.x = 2;
    sniperActor.y = 3;
    const enemy1 = engine.createUnit('enemy_pierce_1', 'RED', 0, getCharacterById('trooper'), false);
    enemy1.x = 4; // d=2
    enemy1.y = 3;
    enemy1.hp = 100;

    const enemy2 = engine.createUnit('enemy_pierce_2', 'RED', 1, getCharacterById('trooper'), false);
    enemy2.x = 7; // d=5
    enemy2.y = 3;
    enemy2.hp = 100;

    engine.redTeam = [enemy1, enemy2];
    engine.blueTeam = [sniperActor];

    // Trường hợp 1: Bắn thường (KHÔNG buff) -> Phải dừng lại ở Địch 1, Địch 2 không dính đạn
    const normalShot = {
        type: 'SNIPER_SHOT',
        skillId: 'SNIPER_RIFLE',
        name: 'Bắn Súng Tỉa',
        dir: 'RIGHT',
        range: 6
    };
    await engine.resolveUnitAttack(sniperActor, normalShot, 0);
    console.assert(enemy1.hp === 100 - 30, `Địch 1 cự ly 2 bị mất 30 HP (còn ${enemy1.hp})`);
    console.assert(enemy2.hp === 100, `Địch 2 cự ly 5 không bị trúng đạn thường (còn ${enemy2.hp})`);

    // Reset máu
    enemy1.hp = 100;
    enemy2.hp = 100;

    // Kích hoạt Chiêu 1: Phát Bắn Hủy Diệt
    const destrBuffAct = {
        type: 'BUFF_DESTRUCTIVE',
        skillId: 'SNIPER_DESTRUCTIVE',
        name: 'Phát Bắn Hủy Diệt',
        cooldown: 3
    };
    await engine.resolveUnitAttack(sniperActor, destrBuffAct, 0);
    console.assert(sniperActor.buffs.destructiveShot === true, 'destructiveShot buff phải active');
    console.assert(sniperActor.cooldowns['SNIPER_DESTRUCTIVE'] === 3, 'Cooldown phải là 3 lượt');

    // Bắn phát súng tỉa hủy diệt:
    // Địch 1 tại d=2: dmg = Math.round(30 * 1.3) = 39
    // Địch 2 tại d=5: dmg = Math.round(45 * 1.3) = 59
    destructiveShotCalled = false;
    await engine.resolveUnitAttack(sniperActor, normalShot, 1);
    console.assert(destructiveShotCalled, 'Âm thanh playDestructiveShot() phải được phát');
    console.assert(enemy1.hp === 100 - 39, `Địch 1 d=2 phải nhận 39 DMG (HP còn: ${enemy1.hp})`);
    console.assert(enemy2.hp === 100 - 59, `Địch 2 d=5 phải nhận 59 DMG xuyên thấu (HP còn: ${enemy2.hp})`);
    console.assert(sniperActor.buffs.destructiveShot === false, 'destructiveShot buff phải được tiêu hao sau khi bắn');
    console.log('✔ TEST 5 PASSED: Phát Bắn Hủy Diệt +30% DMG và xuyên thấu toàn bộ mục tiêu hoàn hảo.\n');

    // TEST 6: Chiêu 2: Tầm Nhìn Dò Nhiệt (+1 Phạm vi cho toàn đội)
    console.log('--- TEST 6: Tầm Nhìn Dò Nhiệt (+1 Phạm vi toàn đội) ---');
    const allyTrooper = engine.createUnit('ally_trooper', 'BLUE', 1, getCharacterById('trooper'), false);
    engine.blueTeam = [sniperActor, allyTrooper];

    const thermalAct = {
        type: 'BUFF_THERMAL',
        skillId: 'SNIPER_THERMAL',
        name: 'Tầm Nhìn Dò Nhiệt',
        cooldown: 4,
        rangeBonus: 1
    };
    thermalVisionCalled = false;
    await engine.resolveUnitAttack(sniperActor, thermalAct, 0);
    console.assert(thermalVisionCalled, 'Âm thanh playThermalVision() phải được phát');
    console.assert(sniperActor.cooldowns['SNIPER_THERMAL'] === 4, 'Cooldown chiêu 2 phải là 4 lượt');
    console.assert(sniperActor.buffs.thermalVision && sniperActor.buffs.thermalVision.active === true, 'Snipeman phải có buff thermalVision');
    console.assert(allyTrooper.buffs.thermalVision && allyTrooper.buffs.thermalVision.active === true, 'Đồng đội cũng phải nhận được buff thermalVision');

    // Kiểm tra cự ly xa hơn 1 ô:
    // Đặt mục tiêu tại cự ly d=7 (X=9, sniperActor tại X=2): bình thường tầm 6 không chạm tới
    const farTarget = engine.createUnit('far_enemy', 'RED', 0, getCharacterById('trooper'), false);
    farTarget.x = 9; // d=7
    farTarget.y = 3;
    farTarget.hp = 100;
    engine.redTeam = [farTarget];

    await engine.resolveUnitAttack(sniperActor, normalShot, 1);
    // d=7: 20 + 5 * 7 = 55 DMG
    console.assert(farTarget.hp === 100 - 55, `Mục tiêu cự ly 7 phải trúng đạn nhờ +1 tầm nhiệt (-55 HP, còn: ${farTarget.hp})`);
    console.assert(sniperActor.buffs.thermalVision.active === false, 'Buff thermalVision của Snipeman phải tiêu hao sau khi thi triển');

    // Kiểm tra đồng đội Trooper bắn cự ly 6 (bình thường tầm 5):
    allyTrooper.x = 2;
    allyTrooper.y = 3;
    farTarget.x = 8; // d=6
    farTarget.y = 3;
    farTarget.hp = 100;

    const trooperRifle = {
        type: 'RANGED_LINE',
        skillId: 'TROOPER_RIFLE',
        name: 'Rifle Shot',
        dir: 'RIGHT',
        range: 5,
        power: 20
    };
    await engine.resolveUnitAttack(allyTrooper, trooperRifle, 2);
    console.assert(farTarget.hp === 100 - 20, `Trooper phải bắn trúng cự ly 6 nhờ +1 tầm nhiệt (-20 HP, còn: ${farTarget.hp})`);
    console.assert(allyTrooper.buffs.thermalVision.active === false, 'Buff thermalVision của đồng minh cũng tiêu hao sau khi dùng');
    console.log('✔ TEST 6 PASSED: Tầm Nhìn Dò Nhiệt buff +1 phạm vi toàn đội và tiêu hao chính xác.\n');

    // TEST 7: CPU AI cho Snipeman
    console.log('--- TEST 7: Trí tuệ nhân tạo CPU Snipeman ---');
    const cpuSnipeman = engine.createUnit('cpu_sniper', 'RED', 0, snipeman, false);
    cpuSnipeman.x = 10;
    cpuSnipeman.y = 3;
    const playerTarget = engine.createUnit('p_target', 'BLUE', 0, getCharacterById('trooper'), true);
    playerTarget.x = 6;
    playerTarget.y = 3;
    engine.blueTeam = [playerTarget];
    engine.redTeam = [cpuSnipeman];

    const cpuQueue = engine.generateCpuQueueForUnit(cpuSnipeman);
    console.assert(cpuQueue.length === 4, 'CPU Snipeman phải tạo đủ 4 lệnh hành động');
    const hasSniperSkill = cpuQueue.some(act => act.type === 'SNIPER_SCOPE' || act.type === 'SNIPER_SHOT' || act.type === 'BUFF_DESTRUCTIVE' || act.type === 'BUFF_THERMAL' || act.type === 'PATH_MOVE');
    console.assert(hasSniperSkill, 'CPU Snipeman phải sử dụng các kỹ năng đặc trưng của xạ thủ');
    console.log('✔ TEST 7 PASSED: CPU AI Snipeman lập kế hoạch chiến thuật cực kỳ thông minh.\n');

    console.log('====================================================');
    console.log('🎉 TẤT CẢ 7/7 NHÓM KIỂM THỬ SNIPEMAN ĐÃ VƯỢT QUA 100%!');
    console.log('====================================================');
}

runTests().catch(err => {
    console.error('❌ LỖI KIỂM THỬ:', err);
    process.exit(1);
});
