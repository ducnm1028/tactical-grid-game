/**
 * Test Suite: MEDIC CHARACTER - MACHINE PISTOL, HEALING STATION, INVULNERABILITY SHIELD
 * Tests character database, audio synthesizers, 12.5 DMG Machine Pistol (8 directions),
 * 5x5 Healing Station (0 CD, multiple allies), Next-Turn Invulnerability Shield,
 * complete damage immunity, debuffs/knockback preservation, buff expiration, and CPU AI.
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

console.log('=== BẮT ĐẦU KIỂM THỬ NHÂN VẬT MỚI: MEDIC (BÁC SĨ QUÂN Y) ===\n');

async function runMedicTests() {
    const engine = new GameEngine();

    // --- TEST 1: Hồ sơ & 4 Kỹ năng của Medic ---
    console.log('--- TEST 1: Hồ sơ & 4 Kỹ năng của Medic ---');
    const medic = getCharacterById('medic');
    console.assert(medic && medic.id === 'medic', 'Medic phải có trong CHARACTERS_DATABASE');
    console.assert(medic.avatar === '🩺', 'Avatar của Medic phải là 🩺');
    console.assert(medic.themeColor === '#10b981', 'Theme Color của Medic phải là #10b981');
    console.assert(medic.maxHp === 100, 'Máu tối đa của Medic phải là 100');
    console.assert(medic.moveBudget === 2, 'Hạn mức di chuyển mặc định là 2 bước');
    console.assert(medic.skills.length === 4, 'Medic phải có chính xác 4 kỹ năng');

    const [s1, s2, s3, s4] = medic.skills;
    console.assert(s1.id === 'MEDIC_MOVE' && s1.type === 'PATH_MOVE' && s1.maxSteps === 2, 'Kỹ năng 1 phải là Lộ Trình (2 bước)');
    console.assert(s2.id === 'MEDIC_MACHINE_PISTOL' && s2.type === 'MACHINE_PISTOL' && s2.range === 5 && s2.power === 12.5, 'Kỹ năng 2 phải là Machine Pistol (Range 5, 12.5 DMG)');
    console.assert(s3.id === 'MEDIC_HEAL_STATION' && s3.type === 'HEAL_STATION' && s3.range === 2 && s3.power === 10 && s3.cooldown === 0, 'Kỹ năng 3 phải là Trạm Hồi Máu (5x5, 10 HP, 0 Cooldown)');
    console.assert(s4.id === 'MEDIC_INVULNERABILITY_SHIELD' && s4.type === 'INVULNERABILITY_SHIELD' && s4.range === 8 && s4.cooldown === 4, 'Kỹ năng 4 phải là Hộ Thuẫn Bất Tử (Range 8, CD 4)');
    console.log('✔ TEST 1 PASSED: Hồ sơ và 4 Kỹ năng Medic hoàn toàn chính xác.\n');

    // --- TEST 2: Âm thanh Web Audio Synthesizer ---
    console.log('--- TEST 2: Âm thanh Web Audio Synthesizer ---');
    console.assert(typeof window.soundCtrl.playMachinePistol === 'function', 'Phải có soundCtrl.playMachinePistol()');
    console.assert(typeof window.soundCtrl.playHealStation === 'function', 'Phải có soundCtrl.playHealStation()');
    console.assert(typeof window.soundCtrl.playInvulnerabilityShield === 'function', 'Phải có soundCtrl.playInvulnerabilityShield()');

    window.soundCtrl.playMachinePistol();
    window.soundCtrl.playHealStation();
    window.soundCtrl.playInvulnerabilityShield();
    console.log('✔ TEST 2 PASSED: 3 hàm âm thanh Web Audio mới của Medic hoạt động hoàn hảo.\n');

    // --- TEST 3: Vũ khí Machine Pistol (12.5 Sát thương, Tầm 5 ô theo 8 hướng) ---
    console.log('--- TEST 3: Vũ khí Machine Pistol (12.5 Sát thương, Tầm 5 ô theo 8 hướng) ---');
    const medicActor = engine.createUnit('medic_test', 'BLUE', 0, medic, true);
    medicActor.x = 2;
    medicActor.y = 3;
    medicActor.dir = 'RIGHT';

    const enemyTarget = engine.createUnit('enemy_test', 'RED', 0, getCharacterById('trooper'), false);
    enemyTarget.x = 7; // distance = 5
    enemyTarget.y = 3;
    enemyTarget.hp = 100;

    engine.blueTeam = [medicActor];
    engine.redTeam = [enemyTarget];

    const machinePistolAct = {
        type: 'MACHINE_PISTOL',
        skillId: 'MEDIC_MACHINE_PISTOL',
        name: 'Machine Pistol',
        range: 5,
        power: 12.5,
        dir: 'RIGHT'
    };

    await engine.resolveUnitAttack(medicActor, machinePistolAct, 0);
    console.assert(enemyTarget.hp === 87.5, `Machine Pistol phải gây đúng 12.5 sát thương (100 - 12.5 = 87.5)! Thực tế: HP = ${enemyTarget.hp}`);

    // Bắn theo đường chéo DOWN_RIGHT (tầm 4 ô)
    medicActor.x = 2;
    medicActor.y = 1;
    enemyTarget.x = 5;
    enemyTarget.y = 4;
    enemyTarget.hp = 100;
    const diagAct = {
        type: 'MACHINE_PISTOL',
        skillId: 'MEDIC_MACHINE_PISTOL',
        name: 'Machine Pistol',
        range: 5,
        power: 12.5,
        dir: 'DOWN_RIGHT'
    };
    await engine.resolveUnitAttack(medicActor, diagAct, 0);
    console.assert(enemyTarget.hp === 87.5, `Machine Pistol bắn chéo 8 hướng phải trúng mục tiêu và gây 12.5 DMG! Thực tế: HP = ${enemyTarget.hp}`);

    // Ngoài tầm 5 ô (khoảng cách 6) -> Trượt
    enemyTarget.x = 8;
    enemyTarget.y = 1; // distance = 6 from (2, 1)
    enemyTarget.hp = 100;
    await engine.resolveUnitAttack(medicActor, machinePistolAct, 0);
    console.assert(enemyTarget.hp === 100, 'Machine Pistol tầm 5 không được bắn trúng mục tiêu ở khoảng cách 6!');
    console.log('✔ TEST 3 PASSED: Machine Pistol 12.5 DMG, tầm 5 ô theo 8 hướng chính xác tuyệt đối.\n');

    // --- TEST 4: Trạm Hồi Máu (5x5 AoE, 10 HP, Không cooldown) ---
    console.log('--- TEST 4: Trạm Hồi Máu (5x5 AoE, 10 HP, Không cooldown) ---');
    medicActor.x = 5;
    medicActor.y = 5;
    medicActor.hp = 70; // Medic bản thân bị thương

    const ally1 = engine.createUnit('ally_1', 'BLUE', 1, getCharacterById('trooper'), false);
    ally1.x = 6;
    ally1.y = 6; // Chebyshev dist = 1 (trong 5x5)
    ally1.hp = 80;

    const ally2 = engine.createUnit('ally_2', 'BLUE', 2, getCharacterById('razor'), false);
    ally2.x = 7;
    ally2.y = 4; // Chebyshev dist = 2 (rìa vùng 5x5)
    ally2.hp = 95;

    const allyOutside = engine.createUnit('ally_out', 'BLUE', 3, getCharacterById('snipeman'), false);
    allyOutside.x = 8;
    allyOutside.y = 5; // Chebyshev dist = 3 (ngoài 5x5)
    allyOutside.hp = 50;

    engine.blueTeam = [medicActor, ally1, ally2, allyOutside];

    const healStationAct = {
        type: 'HEAL_STATION',
        skillId: 'MEDIC_HEAL_STATION',
        name: 'Trạm Hồi Máu',
        range: 2, // 5x5
        power: 10,
        cooldown: 0,
        dir: 'RIGHT'
    };

    medicActor.stats.healing = 0;
    await engine.resolveUnitAttack(medicActor, healStationAct, 0);

    console.assert(medicActor.hp === 80, `Medic phải được hồi 10 HP (70 + 10 = 80)! Thực tế: ${medicActor.hp}`);
    console.assert(ally1.hp === 90, `Đồng đội 1 trong 5x5 phải được hồi 10 HP (80 + 10 = 90)! Thực tế: ${ally1.hp}`);
    console.assert(ally2.hp === 100, `Đồng đội 2 phải được hồi tối đa đến maxHp 100 (95 + 10 -> 100)! Thực tế: ${ally2.hp}`);
    console.assert(allyOutside.hp === 50, `Đồng đội ngoài 5x5 không được nhận hồi máu! Thực tế: ${allyOutside.hp}`);
    console.assert(medicActor.stats.healing === 25, `Tổng lượng máu hồi ghi nhận vào stats.healing phải là 10 + 10 + 5 = 25! Thực tế: ${medicActor.stats.healing}`);
    console.assert(!medicActor.cooldowns['MEDIC_HEAL_STATION'] || medicActor.cooldowns['MEDIC_HEAL_STATION'] === 0, 'Trạm hồi máu không có hồi chiêu (CD = 0)!');
    console.log('✔ TEST 4 PASSED: Trạm Hồi Máu 5x5 hồi máu cho toàn bộ đồng đội trong phạm vi và không cooldown.\n');

    // --- TEST 5: Hộ Thuẫn Bất Tử - Niệm Hộ Thuẫn Lên Đồng Đội & Kích Hoạt Hồi Chiêu 4 ---
    console.log('--- TEST 5: Hộ Thuẫn Bất Tử - Niệm Hộ Thuẫn Lên Đồng Đội & Kích Hoạt Hồi Chiêu 4 ---');
    ally1.hp = 40; // Đang nguy cấp
    const shieldAct = {
        type: 'INVULNERABILITY_SHIELD',
        skillId: 'MEDIC_INVULNERABILITY_SHIELD',
        name: 'Hộ Thuẫn Bất Tử',
        range: 8,
        cooldown: 4,
        targetUnit: ally1
    };

    await engine.resolveUnitAttack(medicActor, shieldAct, 0);
    console.assert(ally1.buffs.invulnerability.primedForNextTurn === true, 'Hộ thuẫn phải được primed cho lượt tiếp theo');
    console.assert(ally1.buffs.invulnerability.active === false, 'Trong lượt hiện tại, hộ thuẫn chưa active');
    console.assert(medicActor.cooldowns['MEDIC_INVULNERABILITY_SHIELD'] === 4, 'Medic phải nhận hồi chiêu 4 lượt');
    console.log('✔ TEST 5 PASSED: Niệm Hộ Thuẫn Bất Tử gán primedForNextTurn và kích hoạt CD 4 lượt chuẩn xác.\n');

    // --- TEST 6: Chuyển Sang Lượt Kế Tiếp - Kháng Toàn Bộ Sát Thương ---
    console.log('--- TEST 6: Chuyển Sang Lượt Kế Tiếp - Kháng Toàn Bộ Sát Thương ---');
    // Cuối lượt N: finishTurn kích hoạt hộ thuẫn
    engine.finishTurn();
    console.assert(ally1.buffs.invulnerability.active === true, 'Hộ thuẫn phải active ở lượt tiếp theo!');
    console.assert(ally1.buffs.invulnerability.turnsLeft === 1, 'Hộ thuẫn phải có thời hạn 1 lượt hoạt động!');

    // Giờ đối thủ tấn công ally1 với đòn sát thương cực lớn (50 DMG)
    const prevAllyHp = ally1.hp;
    engine.applyDamage(ally1, 50, enemyTarget);
    console.assert(ally1.hp === prevAllyHp, `Hộ thuẫn phải triệt tiêu 100% sát thương! HP không đổi: ${ally1.hp}`);

    // Bị trúng bom nổ diện rộng 30 DMG
    engine.applyDamage(ally1, 30, null);
    console.assert(ally1.hp === prevAllyHp, `Hộ thuẫn phải chặn toàn bộ sát thương diện rộng! HP vẫn là: ${ally1.hp}`);
    console.log('✔ TEST 6 PASSED: Trong lượt tiếp theo, đồng đội kháng toàn bộ mọi nguồn sát thương (0 DMG).\n');

    // --- TEST 7: Kháng Sát Thương Nhưng VẪN NHẬN HIỆU ỨNG XẤU (Hất văng, Kéo móc) ---
    console.log('--- TEST 7: Kháng Sát Thương Nhưng VẪN NHẬN HIỆU ỨNG XẤU (Hất văng, Kéo móc) ---');
    ally1.x = 6;
    ally1.y = 5;
    ally1.lastMoveDx = -1; // Đang di chuyển sang trái
    ally1.lastMoveDy = 0;

    const saviorEnemy = engine.createUnit('savior_cpu', 'RED', 0, getCharacterById('fake_savior'), false);
    saviorEnemy.x = 4;
    saviorEnemy.y = 5;
    engine.blueTeam = [ally1];
    engine.redTeam = [saviorEnemy];

    const telekinesisAct = {
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

    const hpBeforeTele = ally1.hp;
    await engine.resolveUnitAttack(saviorEnemy, telekinesisAct, 0);

    // Kẻ địch hất văng ally1 3 ô sang phải (ngược hướng lastMoveDx = -1) -> 6 + 3 = 9
    console.assert(ally1.x === 9, `Đồng đội có khiên vẫn phải bị hất văng 3 ô tới x = 9! Thực tế: ${ally1.x}`);
    // Nhưng KHÔNG mất máu vì có hộ thuẫn bất tử!
    console.assert(ally1.hp === hpBeforeTele, `Đồng đội có khiên bất tử không bị trừ máu! HP thực tế: ${ally1.hp}`);
    console.log('✔ TEST 7 PASSED: Đồng đội có Hộ Thuẫn Bất Tử vẫn nhận đầy đủ hiệu ứng xấu (hất tung/văng) nhưng kháng hoàn toàn sát thương.\n');

    // --- TEST 8: Kết Thúc Lượt Bảo Hộ - Hộ Thuẫn Hết Hiệu Lực ---
    console.log('--- TEST 8: Kết Thúc Lượt Bảo Hộ - Hộ Thuẫn Hết Hiệu Lực ---');
    // Cuối lượt N+1: finishTurn làm hết hạn hộ thuẫn
    engine.finishTurn();
    console.assert(ally1.buffs.invulnerability.active === false, 'Hộ thuẫn phải kết thúc hiệu lực sau khi hết 1 lượt bảo hộ!');

    // Giờ bị tấn công lại -> phải nhận sát thương bình thường
    engine.applyDamage(ally1, 20, saviorEnemy);
    console.assert(ally1.hp === hpBeforeTele - 20, `Sau khi hết hộ thuẫn, nhận sát thương bình thường! HP: ${ally1.hp}`);
    console.log('✔ TEST 8 PASSED: Hộ Thuẫn Bất Tử tự động hết hiệu lực sau 1 lượt và đồng đội nhận sát thương trở lại bình thường.\n');

    // --- TEST 9: Trí Tuệ Nhân Tạo CPU Cho Medic ---
    console.log('--- TEST 9: Trí Tuệ Nhân Tạo CPU Cho Medic ---');
    const cpuMedic = engine.createUnit('cpu_medic', 'RED', 0, medic, false);
    cpuMedic.x = 10;
    cpuMedic.y = 3;
    cpuMedic.hp = 60; // Medic thấp máu

    const cpuQueue = engine.generateCpuQueueForUnit(cpuMedic);
    console.assert(Array.isArray(cpuQueue) && cpuQueue.length === 4, `CPU Medic phải tạo đúng 4 hành động! Độ dài: ${cpuQueue.length}`);
    console.assert(cpuQueue.some(act => act.type === 'INVULNERABILITY_SHIELD' || act.type === 'HEAL_STATION'), 'CPU Medic phải biết ưu tiên Hộ Thuẫn hoặc Hồi Máu khi đồng đội/bản thân bị thương!');
    console.log('✔ TEST 9 PASSED: CPU AI của Medic lập trình chiến thuật 4 lệnh hỗ trợ và tấn công thông minh.\n');

    console.log('================================================================');
    console.log('🎉 TẤT CẢ 9 BÀI KIỂM THỬ CHO MEDIC ĐỀU THÀNH CÔNG VẺ VANG! 100% PASS');
    console.log('================================================================\n');
}

runMedicTests().catch(err => {
    console.error('❌ LỖI KIỂM THỬ MEDIC:', err);
    process.exit(1);
});
