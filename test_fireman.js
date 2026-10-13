/**
 * Test Suite: FIRE MAN CHARACTER - SKILLS, OIL MECHANIC, FIRE CANNON & BURNING HAZARD
 */
const fs = require('fs');
const vm = require('vm');

// Mock browser globals for Node.js
global.window = {
    addEventListener: () => {},
    soundCtrl: {
        playRifleShot: () => {},
        playBombLauncher: () => {},
        playRocketLaunch: () => {},
        playExplosion: () => {},
        playHit: () => {},
        playShield: () => {},
        playMove: () => {},
        playSelect: () => {},
        playClash: () => {}
    },
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
global.performance = { now: () => Date.now() };

vm.runInThisContext(fs.readFileSync('i18n.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('characters.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('audio.js', 'utf8'));
global.window.soundCtrl = new SoundController();
vm.runInThisContext(fs.readFileSync('game.js', 'utf8'));

console.log('=== BẮT ĐẦU KIỂM THỬ NHÂN VẬT MỚI: FIRE MAN ===\n');

async function runTests() {
    const engine = new GameEngine();
    engine.delay = () => Promise.resolve();

    // TEST 1: Kiểm tra Hồ sơ & 4 Kỹ năng của Fire Man trong Database
    console.log('[TEST 1] Kiểm tra Hồ sơ nhân vật Fire Man trong Database:');
    const fireman = getCharacterById('fireman');
    if (!fireman) throw new Error('Không tìm thấy Fire Man trong CHARACTERS_DATABASE!');
    if (fireman.id !== 'fireman') throw new Error('Fire Man ID không chính xác!');
    if (fireman.maxHp !== 100) throw new Error(`Fire Man HP phải là 100, nhận được: ${fireman.maxHp}`);
    if (fireman.moveBudget !== 2) throw new Error(`Move budget phải là 2, nhận được: ${fireman.moveBudget}`);
    if (fireman.avatar !== '🔥') throw new Error(`Avatar phải là 🔥, nhận được: ${fireman.avatar}`);
    if (!fireman.isUnlocked) throw new Error('Fire Man phải được mở khóa (isUnlocked: true)!');
    if (fireman.skills.length !== 4) throw new Error(`Fire Man phải có 4 kỹ năng, nhận được: ${fireman.skills.length}`);

    const [s1, s2, s3, s4] = fireman.skills;
    console.log(`✓ Kỹ năng 1: [${s1.name}] (${s1.id}) - Type: ${s1.type}, MaxSteps: ${s1.maxSteps}`);
    console.log(`✓ Kỹ năng 2 (Vũ khí): [${s2.name}] (${s2.id}) - Range: ${s2.range}, Power: ${s2.power}, Burn: ${s2.burnTurns}L (-${s2.burnDmg} HP/lượt)`);
    console.log(`✓ Kỹ năng 3 (Chiêu 1): [${s3.name}] (${s3.id}) - Range: ${s3.range}, Power: ${s3.power}, AoE: 3x3, Cooldown: ${s3.cooldown}L`);
    console.log(`✓ Kỹ năng 4 (Chiêu 2): [${s4.name}] (${s4.id}) - Range: ${s4.range}, Power: ${s4.power}, AoE: 3x3, FireZone: ${s4.fireZoneDuration}L, Cooldown: ${s4.cooldown}L`);

    if (s2.power !== 15 || s2.range !== 5 || s2.burnTurns !== 3 || s2.burnDmg !== 5) {
        throw new Error('Chỉ số Gattling Fire không đúng yêu cầu (15 DMG, Range 5, 3L cháy -5 HP)!');
    }
    if (s3.power !== 0 || s3.range !== 6 || s3.aoeRadius !== 1 || s3.cooldown !== 3) {
        throw new Error('Chỉ số Thùng Dầu không đúng yêu cầu (0 DMG, Range 6, AoE 3x3, Hồi 3L)!');
    }
    if (s4.power !== 15 || s4.range !== 5 || s4.aoeRadius !== 1 || s4.fireZoneDuration !== 2 || s4.cooldown !== 4) {
        throw new Error('Chỉ số Đại Bác Lửa không đúng yêu cầu (15 DMG, Range 5, AoE 3x3, Vùng cháy 2L, Hồi 4L)!');
    }
    console.log('✓ TEST 1 PASS: Hồ sơ và 4 kỹ năng của Fire Man hoàn toàn chính xác!\n');

    // TEST 2: Kiểm tra Vũ khí Gattling Fire gây 15 DMG và hiệu ứng Cháy không cộng dồn
    console.log('[TEST 2] Kiểm tra Gattling Fire (15 DMG, Cháy 3 lượt, -5 HP/lượt, không cộng dồn):');
    engine.setupTeams();
    const blueFireman = engine.createUnit('b_fm', 'BLUE', 0, fireman, true);
    const redTarget = engine.createUnit('r_tg', 'RED', 0, getCharacterById('trooper'), false);
    blueFireman.x = 2; blueFireman.y = 3;
    redTarget.x = 5; redTarget.y = 3;
    engine.blueTeam = [blueFireman];
    engine.redTeam = [redTarget];

    // Bắn phát 1: Gattling Fire hướng RIGHT
    const gattlingAct = {
        type: 'RANGED_LINE',
        skillId: 'FIREMAN_GATTLING_FIRE',
        name: 'Gattling Fire',
        dir: 'RIGHT',
        range: 5,
        power: 15,
        burnTurns: 3,
        burnDmg: 5
    };
    await engine.resolveUnitAttack(blueFireman, gattlingAct, 0);

    console.log(`✓ Sau khi trúng Gattling Fire: Mục tiêu mất 15 HP (100 -> ${redTarget.hp})`);
    if (redTarget.hp !== 85) throw new Error(`Mục tiêu phải còn 85 HP sau khi trúng Gattling Fire, nhận được: ${redTarget.hp}`);
    if (redTarget.burnTurns !== 3) throw new Error(`Mục tiêu phải có burnTurns = 3, nhận được: ${redTarget.burnTurns}`);
    if (redTarget.burnDmg !== 5) throw new Error(`Mục tiêu phải có burnDmg = 5, nhận được: ${redTarget.burnDmg}`);

    // Bắn tiếp phát 2: Kiểm tra KHÔNG CỘNG DỒN sát thương
    await engine.resolveUnitAttack(blueFireman, gattlingAct, 1);
    console.log(`✓ Bắn phát thứ 2: Mục tiêu mất thêm 15 HP (85 -> ${redTarget.hp})`);
    if (redTarget.hp !== 70) throw new Error(`Mục tiêu phải còn 70 HP, nhận được: ${redTarget.hp}`);
    if (redTarget.burnDmg !== 5) throw new Error(`burnDmg không được cộng dồn (phải là 5), nhận được: ${redTarget.burnDmg}`);
    if (redTarget.burnTurns !== 3) throw new Error(`burnTurns phải được làm mới = 3, nhận được: ${redTarget.burnTurns}`);
    console.log('✓ TEST 2 PASS: Gattling Fire gây 15 DMG và áp dụng Cháy 3L chuẩn xác, không cộng dồn sát thương!\n');

    // TEST 3: Kiểm tra Sát thương Cháy cuối lượt (DOT) trong finishTurn()
    console.log('[TEST 3] Kiểm tra thiêu đốt -5 HP/lượt và đếm lùi lượt cháy:');
    const startHp = redTarget.hp; // 70
    engine.finishTurn();
    console.log(`✓ Hết Lượt 1: Mục tiêu bị trừ 5 HP (70 -> ${redTarget.hp}), còn lại ${redTarget.burnTurns} lượt cháy`);
    if (redTarget.hp !== startHp - 5) throw new Error(`Mục tiêu phải bị trừ 5 HP cháy, nhận được: ${redTarget.hp}`);
    if (redTarget.burnTurns !== 2) throw new Error(`burnTurns phải giảm còn 2, nhận được: ${redTarget.burnTurns}`);

    engine.finishTurn();
    console.log(`✓ Hết Lượt 2: Mục tiêu bị trừ tiếp 5 HP (65 -> ${redTarget.hp}), còn lại ${redTarget.burnTurns} lượt cháy`);
    if (redTarget.hp !== startHp - 10) throw new Error(`Mục tiêu phải bị trừ tiếp 5 HP, nhận được: ${redTarget.hp}`);
    if (redTarget.burnTurns !== 1) throw new Error(`burnTurns phải giảm còn 1, nhận được: ${redTarget.burnTurns}`);

    engine.finishTurn();
    console.log(`✓ Hết Lượt 3: Mục tiêu bị trừ 5 HP (60 -> ${redTarget.hp}), hết hiệu ứng cháy (burnTurns = ${redTarget.burnTurns})`);
    if (redTarget.hp !== startHp - 15) throw new Error(`Mục tiêu phải bị trừ tổng 15 HP sau 3 lượt cháy, nhận được: ${redTarget.hp}`);
    if (redTarget.burnTurns !== 0) throw new Error(`burnTurns phải về 0, nhận được: ${redTarget.burnTurns}`);

    // Hết lượt 4: Không còn bị trừ máu nữa
    engine.finishTurn();
    if (redTarget.hp !== startHp - 15) throw new Error('Sau khi hết lượt cháy, máu không được bị trừ nữa!');
    console.log('✓ TEST 3 PASS: Sát thương Cháy cuối mỗi lượt trừ đúng 5 HP và tự động kết thúc sau 3 lượt!\n');

    // TEST 4: Kiểm tra Kỹ năng 1 - Thùng Dầu (0 DMG, dính dầu, nổ sớm, bắt lửa khi nhận sát thương từ mọi nguồn)
    console.log('[TEST 4] Kiểm tra Thùng Dầu (Dính Dầu và Bắt Lửa khi trúng sát thương từ mọi nguồn):');
    redTarget.hp = 100;
    redTarget.isOiled = false;
    redTarget.burnTurns = 0;
    blueFireman.x = 2; blueFireman.y = 3;
    redTarget.x = 6; redTarget.y = 3;

    // Fireman ném Thùng Dầu về phía mục tiêu (RIGHT, range 6)
    const oilAct = {
        type: 'OIL_BARREL',
        skillId: 'FIREMAN_OIL_BARREL',
        name: 'Thùng Dầu',
        dir: 'RIGHT',
        range: 6,
        power: 0,
        aoeRadius: 1,
        cooldown: 3
    };
    await engine.resolveUnitAttack(blueFireman, oilAct, 0);

    console.log(`✓ Thùng Dầu nổ sớm khi va chạm mục tiêu tại (6, 3):`);
    console.log(`  - Máu mục tiêu không đổi (0 DMG): ${redTarget.hp} HP`);
    console.log(`  - Trạng thái dính dầu: isOiled = ${redTarget.isOiled}`);
    console.log(`  - Hồi chiêu Thùng Dầu: ${blueFireman.cooldowns['FIREMAN_OIL_BARREL']} lượt`);

    if (redTarget.hp !== 100) throw new Error('Thùng Dầu không được gây sát thương ban đầu (0 DMG)!');
    if (!redTarget.isOiled) throw new Error('Mục tiêu phải bị dính Dầu (isOiled = true)!');
    if (blueFireman.cooldowns['FIREMAN_OIL_BARREL'] !== 3) throw new Error('Thùng Dầu phải có hồi chiêu 3 lượt!');

    // Kích nổ dầu bằng một nguồn sát thương bất kỳ (ví dụ: Trooper bắn Assault Rifle 20 DMG)
    console.log('✓ Thử nghiệm gây sát thương từ nguồn bất kỳ (Trooper Rifle 20 DMG):');
    const attackerTrooper = engine.createUnit('b_tr', 'BLUE', 1, getCharacterById('trooper'), false);
    attackerTrooper.x = 2; attackerTrooper.y = 3;
    engine.applyDamage(redTarget, 20);

    console.log(`  - Máu mục tiêu sau đòn đánh: ${redTarget.hp} HP (100 -> 80)`);
    console.log(`  - Lớp dầu đã bắt lửa: isOiled = ${redTarget.isOiled}`);
    console.log(`  - Kích hoạt hiệu ứng Cháy: burnTurns = ${redTarget.burnTurns}, burnDmg = ${redTarget.burnDmg}`);

    if (redTarget.hp !== 80) throw new Error('Mục tiêu phải mất 20 HP!');
    if (redTarget.isOiled !== false) throw new Error('Lớp dầu phải bị tiêu thụ (isOiled = false)!');
    if (redTarget.burnTurns !== 3 || redTarget.burnDmg !== 5) {
        throw new Error('Dầu bắt lửa phải gây hiệu ứng Cháy 3 lượt (-5 HP/lượt)!');
    }
    console.log('✓ TEST 4 PASS: Thùng Dầu nổ 3x3 dính dầu chuẩn xác và tự động bốc cháy khi nhận sát thương từ mọi nguồn!\n');

    // TEST 5: Kiểm tra Kỹ năng 2 - Đại Bác Lửa (15 DMG, nổ 3x3, tạo Vùng Cháy 2 lượt)
    console.log('[TEST 5] Kiểm tra Đại Bác Lửa (15 DMG 3x3, tạo Vùng Cháy tồn tại 2 lượt):');
    redTarget.hp = 100;
    redTarget.isOiled = false;
    redTarget.burnTurns = 0;
    engine.fireZones = [];
    blueFireman.x = 2; blueFireman.y = 3;
    redTarget.x = 5; redTarget.y = 3;

    const cannonAct = {
        type: 'FIRE_CANNON',
        skillId: 'FIREMAN_FIRE_CANNON',
        name: 'Đại Bác Lửa',
        dir: 'RIGHT',
        range: 5,
        power: 15,
        aoeRadius: 1,
        fireZoneDuration: 2,
        cooldown: 4
    };
    await engine.resolveUnitAttack(blueFireman, cannonAct, 0);

    console.log(`✓ Đại Bác Lửa bắn trúng mục tiêu tại (5, 3):`);
    console.log(`  - Máu mục tiêu sau nổ: ${redTarget.hp} HP (100 -> 85)`);
    console.log(`  - Kẻ địch trong vùng nổ bị bốc cháy: burnTurns = ${redTarget.burnTurns}`);
    console.log(`  - Vùng Cháy được tạo: ${engine.fireZones.length} vùng, thời gian tồn tại: ${engine.fireZones[0].turnsLeft} lượt`);
    console.log(`  - Hồi chiêu Đại Bác Lửa: ${blueFireman.cooldowns['FIREMAN_FIRE_CANNON']} lượt`);

    if (redTarget.hp !== 85) throw new Error(`Mục tiêu phải mất 15 HP từ Đại Bác Lửa, nhận được: ${redTarget.hp}`);
    if (redTarget.burnTurns !== 3) throw new Error('Kẻ địch trong vụ nổ phải bị bốc cháy (burnTurns = 3)!');
    if (engine.fireZones.length !== 1) throw new Error('Phải tạo 1 Vùng Cháy trên sân!');
    if (engine.fireZones[0].turnsLeft !== 2) throw new Error('Vùng Cháy phải tồn tại 2 lượt!');
    if (blueFireman.cooldowns['FIREMAN_FIRE_CANNON'] !== 4) throw new Error('Đại Bác Lửa phải có hồi chiêu 4 lượt!');

    // TEST 6: Kiểm tra Cơ chế Vùng Cháy (Kẻ địch đi qua bị bốc cháy, đồng minh an toàn, hết 2 lượt tự biến mất)
    console.log('\n[TEST 6] Kiểm tra Kẻ địch đi qua Vùng Cháy bị bốc cháy & Đếm lùi 2 lượt:');
    const redWalker = engine.createUnit('r_walk', 'RED', 1, getCharacterById('trooper'), false);
    redWalker.x = 5; redWalker.y = 1; // Ở ngoài vùng cháy (5,3 radius 1 covers y 2..4)
    redWalker.burnTurns = 0;
    engine.redTeam.push(redWalker);

    // Kẻ địch bước vào ô (5, 2) thuộc vùng cháy 3x3 quanh (5, 3)
    redWalker.y = 2;
    engine.checkFireZones(redWalker);

    console.log(`✓ Kẻ địch bước vào ô (5, 2) thuộc Vùng Cháy:`);
    console.log(`  - Trạng thái Cháy của kẻ địch: burnTurns = ${redWalker.burnTurns}`);
    if (redWalker.burnTurns !== 3) throw new Error('Kẻ địch bước qua Vùng Cháy phải bị thiêu đốt (burnTurns = 3)!');

    // Kiểm tra đồng minh bước vào vùng cháy KHÔNG bị cháy
    const blueAlly = engine.createUnit('b_al', 'BLUE', 1, getCharacterById('razor'), false);
    blueAlly.x = 5; blueAlly.y = 2;
    blueAlly.burnTurns = 0;
    engine.checkFireZones(blueAlly);
    if (blueAlly.burnTurns !== 0) throw new Error('Đồng minh không được bị thiêu đốt bởi Vùng Cháy của đội mình!');
    console.log('✓ Đồng minh Đội Xanh di chuyển qua Vùng Cháy an toàn, không bị dính hiệu ứng!');

    // Kiểm tra đếm lùi 2 lượt của Vùng Cháy
    engine.finishTurn();
    console.log(`✓ Sau Lượt 1: Vùng Cháy còn ${engine.fireZones[0] ? engine.fireZones[0].turnsLeft : 0} lượt`);
    if (engine.fireZones.length !== 1 || engine.fireZones[0].turnsLeft !== 1) {
        throw new Error('Vùng Cháy sau 1 lượt phải còn 1 lượt tồn tại!');
    }

    engine.finishTurn();
    console.log(`✓ Sau Lượt 2: Vùng Cháy đã tàn lụi, số vùng còn lại: ${engine.fireZones.length}`);
    if (engine.fireZones.length !== 0) throw new Error('Vùng Cháy phải biến mất sau 2 lượt!');
    console.log('✓ TEST 6 PASS: Vùng Cháy thiêu đốt chuẩn xác kẻ địch đi qua và tự biến mất sau 2 lượt!\n');

    // TEST 7: Kiểm tra CPU AI cho Fire Man
    console.log('[TEST 7] Kiểm tra AI tự động sinh 4 lệnh cho CPU Fire Man:');
    engine.applyCpuCharacter('fireman');
    engine.player.x = 10; engine.player.y = 3;
    engine.cpu.x = 14; engine.cpu.y = 3;

    const cpuQueue = engine.generateCpuQueue();
    if (!cpuQueue || cpuQueue.length !== 4) throw new Error('Hàng đợi CPU Fire Man phải đủ 4 lệnh!');
    console.log(`✓ CPU Fire Man sinh hàng đợi: ${cpuQueue.map(a => `${a.icon} ${a.name} (${a.type})`).join(' -> ')}`);

    const validFiremanSkills = ['PATH_MOVE', 'RANGED_LINE', 'OIL_BARREL', 'FIRE_CANNON'];
    for (const act of cpuQueue) {
        if (!validFiremanSkills.includes(act.type)) {
            throw new Error(`Lệnh ${act.type} không thuộc bộ kỹ năng của Fire Man!`);
        }
    }
    console.log('✓ TEST 7 PASS: AI của Fire Man sinh 4 lệnh thông minh và tương thích 100% với bộ kỹ năng mới!\n');

    console.log('🎉 TẤT CẢ 7/7 BÀI KIỂM THỬ NHÂN VẬT FIRE MAN ĐÃ VƯỢT QUA 100% THÀNH CÔNG!');
}

runTests().catch(err => {
    console.error('\n❌ KIỂM THỬ THẤT BẠI:', err);
    process.exit(1);
});
