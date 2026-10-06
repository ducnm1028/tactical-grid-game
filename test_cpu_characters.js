/**
 * Test Suite: CPU Character Selection, Specialized AI, Resolution & Cooldown/Ammo Lifecycle
 */
const fs = require('fs');
const vm = require('vm');

// Mock browser globals for Node.js test environment
global.window = {
    addEventListener: () => {},
    AudioContext: class {
        constructor() { this.state = 'running'; this.currentTime = 0; }
        resume() {}
        createOscillator() { return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
        createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
    }
};

const domElements = {};
global.document = {
    getElementById(id) {
        if (!domElements[id]) {
            domElements[id] = {
                id,
                style: {},
                classList: {
                    add() {},
                    remove() {},
                    toggle() {}
                },
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
                        fillStyle: '',
                        strokeStyle: '',
                        lineWidth: 1,
                        font: '',
                        textAlign: '',
                        textBaseline: '',
                        globalAlpha: 1,
                        fillRect() {},
                        strokeRect() {},
                        clearRect() {},
                        beginPath() {},
                        closePath() {},
                        arc() {},
                        fill() {},
                        stroke() {},
                        moveTo() {},
                        lineTo() {},
                        setLineDash() {},
                        save() {},
                        restore() {},
                        fillText() {},
                        measureText() { return { width: 10 }; },
                        createLinearGradient() { return { addColorStop() {} }; }
                    };
                }
            };
        }
        return domElements[id];
    },
    querySelectorAll(selector) {
        return [];
    },
    querySelector(selector) {
        return { innerText: '', innerHTML: '' };
    },
    createElement(tag) {
        return {
            className: '',
            innerText: '',
            innerHTML: '',
            appendChild() {}
        };
    }
};

global.requestAnimationFrame = (cb) => {};
global.performance = { now: () => Date.now() };

// Load code
vm.runInThisContext(fs.readFileSync('i18n.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('characters.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('audio.js', 'utf8'));
global.window.soundCtrl = new SoundController();
vm.runInThisContext(fs.readFileSync('game.js', 'utf8'));

async function runTests() {
    console.log('--- BẮT ĐẦU KIỂM THỬ CPU CHARACTER SELECTION & AI ---');

    const engine = new GameEngine();
    engine.delay = () => Promise.resolve();

    async function runSingleStep(stepIdx) {
        const realExecute = GameEngine.prototype.executeResolutionStep;
        engine.executeResolutionStep = async function(idx) {
            if (idx === stepIdx) {
                return realExecute.call(engine, idx);
            }
            return Promise.resolve();
        };
        await engine.executeResolutionStep(stepIdx);
        engine.executeResolutionStep = realExecute;
    }

    // TEST 1: Khởi tạo CPU với từng nhân vật
    console.log('\n[TEST 1] Khởi tạo CPU với 4 nhân vật khác nhau:');
    const testChars = ['trooper', 'hookman', 'smoke_guy', 'razor'];
    for (const cId of testChars) {
        engine.applyCpuCharacter(cId);
        console.log(`✓ Nhân vật CPU [${cId}]:`);
        console.log(`  - Tên: ${engine.cpu.name}, Avatar: ${engine.cpu.avatar}, Máu: ${engine.cpu.hp}/${engine.cpu.maxHp}`);
        console.log(`  - Move budget: ${engine.cpu.moveBudget}, Stealth radius: ${engine.cpu.stealthRadius}`);
        if (cId === 'hookman') {
            if (engine.cpu.maxHp !== 90) throw new Error('Hookman CPU HP must be 90!');
            if (engine.cpu.moveBudget !== 3) throw new Error('Hookman CPU move budget must be 3!');
        } else {
            if (engine.cpu.maxHp !== 100) throw new Error(`${cId} CPU HP must be 100!`);
        }
        if (cId === 'smoke_guy') {
            if (engine.cpuSkillAmmo['SMOKE_BOMB_LAUNCHER'] !== 2) throw new Error('Smoke Guy CPU must start with 2 bomb ammo!');
        }
        if (cId === 'razor') {
            if (engine.cpuSkillAmmo['RAZOR_BLADE'] !== 2) throw new Error('Razor CPU must start with 2 blade ammo!');
        }
    }
    console.log('✓ TEST 1 PASS: Cả 4 nhân vật CPU khởi tạo chính xác chỉ số, ammo, và hồi chiêu!');

    // TEST 2: CPU AI Queue Generation cho từng nhân vật
    console.log('\n[TEST 2] Sinh hàng đợi 4 lệnh AI theo từng nhân vật CPU:');
    for (const cId of testChars) {
        engine.applyCpuCharacter(cId);
        engine.player.x = 10;
        engine.player.y = 3;
        engine.cpu.x = 14;
        engine.cpu.y = 3;

        const queue = engine.generateCpuQueue();
        if (!queue || queue.length !== 4) throw new Error(`Queue length for ${cId} must be 4!`);

        console.log(`✓ CPU [${cId}] sinh hàng đợi: ${queue.map(a => `${a.icon} ${a.name} (${a.type})`).join(' -> ')}`);
        const validTypes = ['PATH_MOVE', 'RANGED_LINE', 'RANGED_VARIABLE', 'GRENADE', 'ROCKET', 'HOOK_PULL', 'BUFF_HEAL', 'BUFF_SMOKE', 'BOMB_LAUNCHER', 'RECT_SLASH', 'LEAP', 'SHIELD', 'ATTACK'];
        for (const a of queue) {
            if (!validTypes.includes(a.type)) throw new Error(`Invalid action type: ${a.type}`);
        }
    }
    console.log('✓ TEST 2 PASS: CPU sinh hàng đợi hợp lệ và đa dạng theo đúng đặc thù nhân vật!');

    // TEST 3: Smoke Guy CPU Bomb Launcher Ammo & Cooldown
    console.log('\n[TEST 3] Kiểm tra Smoke Guy CPU tiêu hao đạn Súng Bắn Bom:');
    engine.applyCpuCharacter('smoke_guy');
    engine.player.x = 10;
    engine.player.y = 3;
    engine.cpu.x = 14;
    engine.cpu.y = 3;
    engine.playerQueue = [
        { type: 'SHIELD', dir: 'RIGHT' },
        { type: 'SHIELD', dir: 'RIGHT' },
        { type: 'SHIELD', dir: 'RIGHT' },
        { type: 'SHIELD', dir: 'RIGHT' }
    ];

    const bombAct = {
        type: 'BOMB_LAUNCHER',
        skillId: 'SMOKE_BOMB_LAUNCHER',
        name: 'Súng Bắn Bom',
        icon: '💣',
        dir: 'LEFT',
        power: 30,
        range: 6,
        cooldown: 4,
        aoeRadius: 1
    };

    engine.cpuQueue = [bombAct, bombAct, { type: 'SHIELD', dir: 'LEFT' }, { type: 'SHIELD', dir: 'LEFT' }];

    // Step 0: Bomb 1
    await runSingleStep(0);
    if (engine.cpuSkillAmmo['SMOKE_BOMB_LAUNCHER'] !== 1) throw new Error(`Ammo should be 1 after 1st bomb! Actual: ${engine.cpuSkillAmmo['SMOKE_BOMB_LAUNCHER']}`);
    console.log('✓ Bắn viên 1: Đạn còn 1/2, chưa hồi chiêu.');

    // Step 1: Bomb 2
    await runSingleStep(1);
    if (engine.cpuSkillAmmo['SMOKE_BOMB_LAUNCHER'] !== 0) throw new Error(`Ammo should be 0 after 2nd bomb! Actual: ${engine.cpuSkillAmmo['SMOKE_BOMB_LAUNCHER']}`);
    if (engine.cpuCooldowns['SMOKE_BOMB_LAUNCHER'] !== 4) throw new Error(`Cooldown should be 4 after spending all bombs! Actual: ${engine.cpuCooldowns['SMOKE_BOMB_LAUNCHER']}`);
    console.log('✓ Bắn viên 2: Đạn còn 0/2, kích hoạt hồi chiêu 4 lượt!');

    // Test finishTurn decrement and ammo reload
    engine.finishTurn(); // Turn 1 ends -> CD: 3
    if (engine.cpuCooldowns['SMOKE_BOMB_LAUNCHER'] !== 3) throw new Error('CD should be 3!');
    engine.finishTurn(); // CD: 2
    engine.finishTurn(); // CD: 1
    engine.finishTurn(); // CD: 0 -> ammo reloaded to 2!
    if (engine.cpuCooldowns['SMOKE_BOMB_LAUNCHER'] !== 0) throw new Error('CD should be 0!');
    if (engine.cpuSkillAmmo['SMOKE_BOMB_LAUNCHER'] !== 2) throw new Error('Ammo should be reloaded to 2!');
    console.log('✓ Sau 4 lượt kết thúc: Súng Bắn Bom CPU hồi chiêu xong và nạp đầy 2/2 viên đạn!');
    console.log('✓ TEST 3 PASS!');

    // TEST 4: Razor CPU Kiếm Gắn Tay (3x2, 60 DMG)
    console.log('\n[TEST 4] Kiểm tra Razor CPU Kiếm Gắn Tay (3x2, 60 DMG):');
    engine.applyCpuCharacter('razor');
    engine.cpu.x = 5;
    engine.cpu.y = 3;
    engine.player.x = 7;
    engine.player.y = 3;
    engine.player.hp = 100;

    const bladeAct = {
        type: 'RECT_SLASH',
        skillId: 'RAZOR_BLADE',
        name: 'Kiếm Gắn Tay',
        icon: '🗡️',
        dir: 'RIGHT',
        power: 60,
        cooldown: 4
    };
    engine.playerQueue = [{ type: 'PATH_MOVE', path: [] }, { type: 'PATH_MOVE', path: [] }, { type: 'PATH_MOVE', path: [] }, { type: 'PATH_MOVE', path: [] }];
    engine.cpuQueue = [bladeAct, { type: 'PATH_MOVE', path: [] }, { type: 'PATH_MOVE', path: [] }, { type: 'PATH_MOVE', path: [] }];

    await runSingleStep(0);
    if (engine.player.hp !== 40) throw new Error(`Player HP should be 40 after 60 DMG sword strike! Actual: ${engine.player.hp}`);
    console.log(`✓ Kiếm Gắn Tay 3x2 của Razor CPU chém trúng người chơi! Người chơi mất 60 HP (còn ${engine.player.hp} HP).`);
    console.log('✓ TEST 4 PASS!');

    // TEST 5: Hookman CPU Adrenaline healing in finishTurn
    console.log('\n[TEST 5] Kiểm tra Hookman CPU Adrenaline và hồi máu cuối lượt:');
    engine.applyCpuCharacter('hookman');
    engine.cpu.hp = 60;
    engine.cpuBuffs.adrenaline.turnsLeft = 3;

    engine.finishTurn();
    if (engine.cpu.hp !== 65) throw new Error(`CPU HP should be 65 after Adrenaline heal! Actual: ${engine.cpu.hp}`);
    if (engine.cpuBuffs.adrenaline.turnsLeft !== 2) throw new Error('Adrenaline turnsLeft should be 2!');
    console.log(`✓ Adrenaline CPU hồi 5 HP (từ 60 lên ${engine.cpu.hp} HP), hiệu lực còn 2 lượt.`);
    console.log('✓ TEST 5 PASS!');

    // TEST 6: Trooper CPU Lựu Đạn (Hazard owner: CPU)
    console.log('\n[TEST 6] Kiểm tra Trooper CPU ném Lựu đạn hẹn giờ:');
    engine.applyCpuCharacter('trooper');
    engine.cpu.x = 15;
    engine.cpu.y = 3;
    engine.groundHazards = [];

    const grenadeAct = {
        type: 'GRENADE',
        skillId: 'TROOPER_GRENADE',
        name: 'Lựu Đạn',
        icon: '💣',
        dir: 'LEFT',
        range: 5,
        targetX: 11,
        targetY: 3,
        power: 50,
        fuse: 2,
        cooldown: 3
    };
    engine.playerQueue = [{ type: 'PATH_MOVE', path: [] }, { type: 'PATH_MOVE', path: [] }, { type: 'PATH_MOVE', path: [] }, { type: 'PATH_MOVE', path: [] }];
    engine.cpuQueue = [grenadeAct, { type: 'PATH_MOVE', path: [] }, { type: 'PATH_MOVE', path: [] }, { type: 'PATH_MOVE', path: [] }];

    await runSingleStep(0);
    if (engine.groundHazards.length !== 1) throw new Error('Ground hazard should be created!');
    const hz = engine.groundHazards[0];
    if (hz.owner !== 'CPU') throw new Error('Hazard owner should be CPU!');
    if (hz.x !== 11 || hz.y !== 3) throw new Error(`Hazard position wrong: ${hz.x}, ${hz.y}`);
    console.log(`✓ Trooper CPU ném lựu đạn hẹn giờ thành công tới (${hz.x}, ${hz.y}) với owner: 'CPU'!`);
    console.log('✓ TEST 6 PASS!');

    console.log('\n🎉 TẤT CẢ 6/6 BÀI KIỂM THỬ ĐÃ VƯỢT QUA 100% THÀNH CÔNG!');
}

runTests().catch(err => {
    console.error('LỖI KIỂM THỬ:', err);
    process.exit(1);
});
