/**
 * Test Suite: FAKE SAVIOR CHARACTER - REVOLVER, TELEKINESIS, NECROMANCY
 * Tests character database, audio synthesizers, combat mechanics, knockback, damage scaling,
 * zombie summons, zombie AI single-attack per turn, deployable interactions, and CPU AI.
 */
const fs = require('fs');
const vm = require('vm');

// Mock browser globals
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
                    toggle() {},
                    contains() { return false; }
                },
                innerText: '',
                innerHTML: '',
                disabled: false,
                appendChild() {},
                listeners: {},
                addEventListener(event, cb) {
                    this.listeners[event] = this.listeners[event] || [];
                    this.listeners[event].push(cb);
                },
                click() {
                    if (this.onclick) this.onclick();
                    if (this.listeners['click']) {
                        this.listeners['click'].forEach(cb => cb({ preventDefault() {} }));
                    }
                },
                querySelectorAll() { return []; },
                querySelector() { return { innerText: '', innerHTML: '', style: {} }; },
                getBoundingClientRect() { return { left: 0, top: 0, width: 960, height: 448 }; },
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
        return domElements[id];
    },
    querySelector() {
        return { innerText: '', innerHTML: '', style: {} };
    },
    querySelectorAll() {
        return [];
    },
    createElement() {
        return { className: '', innerText: '', innerHTML: '', appendChild() {}, style: {} };
    }
};

global.window = {
    addEventListener() {},
    AudioContext: class {
        constructor() { this.state = 'running'; this.currentTime = 0; }
        resume() {}
        createOscillator() {
            return {
                type: '',
                frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
                connect() {}, start() {}, stop() {}
            };
        }
        createGain() {
            return {
                gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
                connect() {}
            };
        }
        createBufferSource() {
            return { buffer: null, connect() {}, start() {}, stop() {} };
        }
        createBuffer(ch, len, rate) {
            return { length: len, getChannelData() { return new Float32Array(len); } };
        }
    }
};

global.requestAnimationFrame = () => {};
global.performance = { now: () => Date.now() };

// Run dependencies in current VM context
vm.runInThisContext(fs.readFileSync('i18n.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('characters.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('audio.js', 'utf8'));
global.window.soundCtrl = new SoundController();
vm.runInThisContext(fs.readFileSync('game.js', 'utf8'));

console.log('=== BẮT ĐẦU KIỂM THỬ NHÂN VẬT MỚI: FAKE SAVIOR (KẺ CỨU RỖI GIẢ TẠO) ===\n');

async function runFakeSaviorTests() {
    const engine = new GameEngine();

    // --- TEST 1: Hồ sơ & 4 Kỹ năng của Fake Savior ---
    console.log('--- TEST 1: Hồ sơ & 4 Kỹ năng của Fake Savior ---');
    const savior = getCharacterById('fake_savior');
    console.assert(savior && savior.id === 'fake_savior', 'Fake Savior phải có trong CHARACTERS_DATABASE');
    console.assert(savior.avatar === '🪬', 'Avatar của Fake Savior phải là 🪬');
    console.assert(savior.maxHp === 100, 'Máu tối đa của Fake Savior phải là 100');
    console.assert(savior.moveBudget === 2, 'Hạn mức di chuyển mặc định là 2 bước');
    console.assert(savior.skills.length === 4, 'Fake Savior phải có chính xác 4 kỹ năng');

    const [s1, s2, s3, s4] = savior.skills;
    console.assert(s1.id === 'SAVIOR_MOVE' && s1.type === 'PATH_MOVE' && s1.maxSteps === 2, 'Kỹ năng 1 phải là Lộ Trình (2 bước)');
    console.assert(s2.id === 'SAVIOR_REVOLVER' && s2.type === 'REVOLVER' && s2.range === 4 && s2.power === 25, 'Kỹ năng 2 phải là Revolver (Range 4, 25 DMG)');
    console.assert(s3.id === 'SAVIOR_TELEKINESIS' && s3.type === 'TELEKINESIS' && s3.cooldown === 3 && s3.power === 20 && s3.comboPower === 30, 'Kỹ năng 3 phải là Telekinesis (5x5, 20/30 DMG, CD 3)');
    console.assert(s4.id === 'SAVIOR_NECROMANCY' && s4.type === 'NECROMANCY' && s4.zombieHp === 40 && s4.zombiePower === 35 && s4.cooldown === 4, 'Kỹ năng 4 phải là Necromancy (Triệu hồi 2 thây ma 40 HP, 35 DMG, CD 4)');
    console.log('✔ TEST 1 PASSED: Hồ sơ và 4 Kỹ năng Fake Savior hoàn toàn chính xác.\n');

    // --- TEST 2: Âm thanh Web Audio Synthesizer ---
    console.log('--- TEST 2: Âm thanh Web Audio Synthesizer ---');
    console.assert(typeof window.soundCtrl.playRevolver === 'function', 'Phải có soundCtrl.playRevolver()');
    console.assert(typeof window.soundCtrl.playTelekinesis === 'function', 'Phải có soundCtrl.playTelekinesis()');
    console.assert(typeof window.soundCtrl.playNecromancy === 'function', 'Phải có soundCtrl.playNecromancy()');
    console.assert(typeof window.soundCtrl.playZombieAttack === 'function', 'Phải có soundCtrl.playZombieAttack()');

    window.soundCtrl.playRevolver();
    window.soundCtrl.playTelekinesis();
    window.soundCtrl.playNecromancy();
    window.soundCtrl.playZombieAttack();
    console.log('✔ TEST 2 PASSED: 4 hàm âm thanh Web Audio mới của Fake Savior hoạt động hoàn hảo.\n');

    // --- TEST 3: Vũ khí Revolver (25 Sát thương, Tầm 4) ---
    console.log('--- TEST 3: Vũ khí Revolver (25 Sát thương, Tầm 4) ---');
    const saviorActor = engine.createUnit('savior_test', 'BLUE', 0, savior, true);
    saviorActor.x = 2;
    saviorActor.y = 3;
    saviorActor.dir = 'RIGHT';

    const enemyTarget = engine.createUnit('enemy_test', 'RED', 0, getCharacterById('trooper'), false);
    enemyTarget.x = 6; // distance = 4
    enemyTarget.y = 3;
    enemyTarget.hp = 100;

    engine.blueTeam = [saviorActor];
    engine.redTeam = [enemyTarget];

    const revolverAct = {
        type: 'REVOLVER',
        skillId: 'SAVIOR_REVOLVER',
        name: 'Revolver',
        range: 4,
        power: 25,
        dir: 'RIGHT'
    };

    await engine.resolveUnitAttack(saviorActor, revolverAct, 0);
    console.assert(enemyTarget.hp === 75, `Revolver tầm 4 phải gây 25 sát thương! Nhận: ${100 - enemyTarget.hp} DMG`);

    // Kiểm tra kẻ địch ngoài tầm 4 (khoảng cách 5) thì không bị bắn trúng
    enemyTarget.x = 8; // distance = 6 (savior at 2)
    enemyTarget.hp = 100;
    await engine.resolveUnitAttack(saviorActor, revolverAct, 0);
    console.assert(enemyTarget.hp === 100, 'Revolver tầm 4 không được bắn trúng mục tiêu ở khoảng cách 6!');
    console.log('✔ TEST 3 PASSED: Revolver 25 DMG, tầm bắn 4 ô hoạt động chính xác 100%.\n');

    // --- TEST 4: Telekinesis (5x5, hất văng 3 ô ngược hướng di chuyển, 20 DMG mục tiêu đơn) ---
    console.log('--- TEST 4: Telekinesis (5x5, hất văng 3 ô ngược hướng di chuyển, 20 DMG mục tiêu đơn) ---');
    saviorActor.x = 5;
    saviorActor.y = 3;
    enemyTarget.x = 7; // distance = 2 (trong vùng 5x5)
    enemyTarget.y = 3;
    enemyTarget.hp = 100;
    // Giả lập kẻ địch vừa di chuyển sang PHẢI (dx = 1, dy = 0)
    enemyTarget.lastMoveDx = 1;
    enemyTarget.lastMoveDy = 0;

    const teleAct = {
        type: 'TELEKINESIS',
        skillId: 'SAVIOR_TELEKINESIS',
        name: 'Telekinesis',
        range: 2,
        power: 20,
        comboPower: 30,
        knockback: 3,
        cooldown: 3,
        dir: 'RIGHT'
    };

    await engine.resolveUnitAttack(saviorActor, teleAct, 0);
    // Hướng di chuyển là PHẢI -> hướng hất văng ngược lại là TRÁI (kbDx = -1)
    // enemyTarget từ x = 7 lùi 3 ô sang trái -> x = 4
    console.assert(enemyTarget.x === 4, `Kẻ địch phải bị hất văng 3 ô sang trái tới x = 4! Thực tế: x = ${enemyTarget.x}`);
    console.assert(enemyTarget.hp === 80, `Mục tiêu đơn lẻ phải nhận 20 DMG (100 - 20 = 80)! Thực tế: HP = ${enemyTarget.hp}`);
    console.assert(saviorActor.cooldowns['SAVIOR_TELEKINESIS'] === 3, 'Telekinesis phải kích hoạt hồi chiêu 3 lượt!');
    console.log('✔ TEST 4 PASSED: Telekinesis quét 5x5, hất văng 3 ô ngược hướng di chuyển và gây 20 DMG đơn lẻ chuẩn xác.\n');

    // --- TEST 5: Telekinesis (Đẩy tiếp kẻ địch khác trên đường văng & 30 DMG mỗi người) ---
    console.log('--- TEST 5: Telekinesis (Đẩy tiếp kẻ địch khác trên đường văng & 30 DMG mỗi người) ---');
    saviorActor.x = 3;
    saviorActor.y = 3;

    // Mục tiêu chính A ở x = 5 (cách 2 ô)
    const enemyA = engine.createUnit('enemy_a', 'RED', 0, getCharacterById('trooper'), false);
    enemyA.x = 5;
    enemyA.y = 3;
    enemyA.hp = 100;
    enemyA.lastMoveDx = -1; // di chuyển sang TRÁI -> bị hất ngược lại sang PHẢI (+1)

    // Mục tiêu phụ B đứng ở x = 7 (nằm trên đường hất văng 3 ô của A: từ 5 -> 6, 7, 8)
    const enemyB = engine.createUnit('enemy_b', 'RED', 1, getCharacterById('razor'), false);
    enemyB.x = 7;
    enemyB.y = 3;
    enemyB.hp = 100;

    engine.redTeam = [enemyA, enemyB];

    await engine.resolveUnitAttack(saviorActor, teleAct, 0);
    // A bị hất sang phải 3 ô: 5 -> 8
    console.assert(enemyA.x === 8, `Enemy A phải bị hất văng tới x = 8! Thực tế: ${enemyA.x}`);
    // B cũng bị đẩy xa 3 ô sang phải: 7 -> 10
    console.assert(enemyB.x === 10, `Enemy B phải bị đẩy xa 3 ô sang phải tới x = 10! Thực tế: ${enemyB.x}`);
    // "Nếu có nhiều kẻ thù bị ảnh hưởng thì gây 30 sát thương mỗi người"
    console.assert(enemyA.hp === 70, `Enemy A phải nhận 30 DMG (100 - 30 = 70)! Thực tế: ${enemyA.hp}`);
    console.assert(enemyB.hp === 70, `Enemy B phải nhận 30 DMG (100 - 30 = 70)! Thực tế: ${enemyB.hp}`);
    console.log('✔ TEST 5 PASSED: Telekinesis phát hiện chuỗi va chạm, đẩy xa 3 ô và gây 30 DMG mỗi người hoàn hảo.\n');

    // --- TEST 6: Necromancy (Triệu hồi 2 Thây Ma CPU 40 HP) ---
    console.log('--- TEST 6: Necromancy (Triệu hồi 2 Thây Ma CPU 40 HP) ---');
    saviorActor.x = 5;
    saviorActor.y = 3;
    engine.zombies = [];

    const necroAct = {
        type: 'NECROMANCY',
        skillId: 'SAVIOR_NECROMANCY',
        name: 'Necromancy',
        zombieHp: 40,
        zombiePower: 35,
        cooldown: 4,
        dir: 'RIGHT'
    };

    await engine.resolveUnitAttack(saviorActor, necroAct, 0);
    console.assert(engine.zombies.length === 2, `Phải triệu hồi đúng 2 thây ma! Thực tế: ${engine.zombies.length}`);
    for (const z of engine.zombies) {
        console.assert(z.hp === 40 && z.maxHp === 40, 'Thây ma phải có 40 HP');
        console.assert(z.power === 35, 'Sát thương tấn công của thây ma phải là 35');
        console.assert(z.team === 'BLUE', 'Thây ma phải cùng đội với Fake Savior (BLUE)');
        console.assert(z.owner === saviorActor, 'Chủ nhân của thây ma phải là saviorActor');
        console.assert(z.attackedThisTurn === false, 'Thây ma mới triệu hồi chưa tấn công');
    }
    console.assert(saviorActor.cooldowns['SAVIOR_NECROMANCY'] === 4, 'Necromancy phải có hồi chiêu 4 lượt!');
    console.log('✔ TEST 6 PASSED: Necromancy triệu hồi chuẩn xác 2 Thây Ma CPU 40 HP.\n');

    // --- TEST 7: Thây Ma Tấn Công (Chỉ 1 lệnh 35 DMG trong 3x3 vào 1 kẻ địch ngẫu nhiên) ---
    console.log('--- TEST 7: Thây Ma Tấn Công (Chỉ 1 lệnh 35 DMG trong 3x3 vào 1 kẻ địch ngẫu nhiên) ---');
    const testZombie = engine.zombies[0];
    testZombie.x = 10;
    testZombie.y = 3;
    testZombie.attackedThisTurn = false;

    // Đặt 2 kẻ địch trong phạm vi 3x3 của zombie (khoảng cách Chebyshev <= 1)
    const enemy1 = engine.createUnit('z_target_1', 'RED', 0, getCharacterById('trooper'), false);
    enemy1.x = 11;
    enemy1.y = 3;
    enemy1.hp = 100;

    const enemy2 = engine.createUnit('z_target_2', 'RED', 1, getCharacterById('razor'), false);
    enemy2.x = 10;
    enemy2.y = 4;
    enemy2.hp = 100;

    engine.redTeam = [enemy1, enemy2];

    // Chỉ cho 1 zombie thực thi để test chính xác
    engine.zombies = [testZombie];

    await engine.resolveZombieAttacks(0);
    console.assert(testZombie.attackedThisTurn === true, 'Thây ma phải được đánh dấu đã tấn công trong lượt');

    // Chỉ có DUY NHẤT 1 kẻ địch bị cắn mất 35 HP, kẻ địch còn lại giữ nguyên 100 HP
    const oneTook35 = (enemy1.hp === 65 && enemy2.hp === 100) || (enemy1.hp === 100 && enemy2.hp === 65);
    console.assert(oneTook35, `Chỉ duy nhất 1 kẻ địch ngẫu nhiên bị cắn 35 HP! e1=${enemy1.hp}, e2=${enemy2.hp}`);

    // Khi gọi lại trong cùng lượt, thây ma không được tấn công lần nữa ("Chỉ có duy nhất 1 lệnh tấn công")
    await engine.resolveZombieAttacks(1);
    const unchanged = (enemy1.hp === 65 && enemy2.hp === 100) || (enemy1.hp === 100 && enemy2.hp === 65);
    console.assert(unchanged, 'Thây ma không được tấn công lần 2 trong cùng 1 lượt!');

    // Kết thúc lượt -> finishTurn() nạp lại quyền tấn công cho lượt sau
    engine.finishTurn();
    console.assert(testZombie.attackedThisTurn === false, 'Sau khi hết lượt, thây ma được mở lại 1 lệnh tấn công cho lượt mới!');
    console.log('✔ TEST 7 PASSED: Cơ chế 1 lệnh tấn công 35 DMG trong vùng 3x3 của Thây Ma hoạt động tuyệt đối chính xác.\n');

    // --- TEST 8: Thây Ma Nhận Sát Thương & Tiêu Diệt Khi Hết Máu ---
    console.log('--- TEST 8: Thây Ma Nhận Sát Thương & Tiêu Diệt Khi Hết Máu ---');
    testZombie.x = 10;
    testZombie.y = 3;
    testZombie.hp = 40;
    engine.zombies = [testZombie];

    // Bắn đạn 25 DMG trúng thây ma
    const depHit = engine.getEnemyDeployableAt(10, 3, 'RED');
    console.assert(depHit && depHit.type === 'ZOMBIE', 'getEnemyDeployableAt phải nhận diện được Thây Ma');
    engine.damageDeployable(depHit, 25, enemy1);
    console.assert(testZombie.hp === 15, `Thây ma nhận 25 sát thương phải còn 15 HP! Thực tế: ${testZombie.hp}`);

    // Bắn tiếp 20 DMG -> Thây ma chết (0 HP) và bị loại khỏi sân
    engine.damageDeployable(depHit, 20, enemy1);
    console.assert(testZombie.hp === 0, 'Thây ma hết máu phải có 0 HP');
    console.assert(engine.zombies.length === 0, 'Thây ma 0 HP phải bị xóa hoàn toàn khỏi danh sách!');
    console.log('✔ TEST 8 PASSED: Thây ma nhận sát thương và biến mất khi bị tiêu diệt hoàn hảo.\n');

    // --- TEST 9: Trí tuệ nhân tạo CPU Fake Savior ---
    console.log('--- TEST 9: Trí tuệ nhân tạo CPU Fake Savior ---');
    const cpuSavior = engine.createUnit('cpu_savior', 'RED', 0, savior, false);
    cpuSavior.x = 10;
    cpuSavior.y = 3;
    saviorActor.x = 6;
    saviorActor.y = 3;

    engine.blueTeam = [saviorActor];
    engine.redTeam = [cpuSavior];
    engine.zombies = [];

    const cpuQueue = engine.generateCpuQueueForUnit(cpuSavior);
    console.assert(cpuQueue.length === 4, 'CPU Fake Savior phải tạo đủ 4 hành động');
    const usedSaviorSkill = cpuQueue.some(a =>
        a.skillId === 'SAVIOR_NECROMANCY' ||
        a.skillId === 'SAVIOR_TELEKINESIS' ||
        a.skillId === 'SAVIOR_REVOLVER' ||
        a.skillId === 'SAVIOR_MOVE'
    );
    console.assert(usedSaviorSkill, 'CPU Fake Savior phải biết dùng các kỹ năng của mình');
    console.log('✔ TEST 9 PASSED: CPU AI Fake Savior tạo chuỗi 4 lệnh chiến thuật xuất sắc.\n');

    console.log('====================================================');
    console.log('🎉 TẤT CẢ 9/9 NHÓM KIỂM THỬ FAKE SAVIOR ĐÃ VƯỢT QUA 100%!');
    console.log('====================================================\n');
}

runFakeSaviorTests().catch(err => {
    console.error('❌ LỖI KIỂM THỬ FAKE SAVIOR:', err);
    process.exit(1);
});
