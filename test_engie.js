/**
 * Test Suite: ENGIE CHARACTER - IRON ROD GUN, AUTO-SENTRY (11x11 ZONE), TELEPORTER & DEPLOYABLE DURABILITY
 */
const fs = require('fs');
const vm = require('vm');

// Mock browser globals for Node.js
let nailgunSoundCalled = false;
let wrenchSoundCalled = false;
let sentryShotSoundCalled = false;
let portalOpenSoundCalled = false;
let teleportSoundCalled = false;

global.window = {
    addEventListener: () => {},
    soundCtrl: {
        playNailgun: () => { nailgunSoundCalled = true; },
        playWrench: () => { wrenchSoundCalled = true; },
        playSentryShot: () => { sentryShotSoundCalled = true; },
        playPortalOpen: () => { portalOpenSoundCalled = true; },
        playTeleport: () => { teleportSoundCalled = true; },
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

vm.runInThisContext(fs.readFileSync('i18n.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('characters.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('audio.js', 'utf8'));
global.window.soundCtrl = new SoundController();
// Wrap SFX with spy flags
const origNail = window.soundCtrl.playNailgun.bind(window.soundCtrl);
window.soundCtrl.playNailgun = () => { nailgunSoundCalled = true; origNail(); };
const origWrench = window.soundCtrl.playWrench.bind(window.soundCtrl);
window.soundCtrl.playWrench = () => { wrenchSoundCalled = true; origWrench(); };
const origSentryShot = window.soundCtrl.playSentryShot.bind(window.soundCtrl);
window.soundCtrl.playSentryShot = () => { sentryShotSoundCalled = true; origSentryShot(); };
const origPortalOpen = window.soundCtrl.playPortalOpen.bind(window.soundCtrl);
window.soundCtrl.playPortalOpen = () => { portalOpenSoundCalled = true; origPortalOpen(); };
const origTeleport = window.soundCtrl.playTeleport.bind(window.soundCtrl);
window.soundCtrl.playTeleport = () => { teleportSoundCalled = true; origTeleport(); };

vm.runInThisContext(fs.readFileSync('game.js', 'utf8'));

console.log('=== BẮT ĐẦU KIỂM THỬ NHÂN VẬT MỚI: ENGIE (KỸ SƯ CƠ KHÍ) ===\n');

async function runTests() {
    const engine = new GameEngine();
    engine.delay = () => Promise.resolve();

    // TEST 1: Kiểm tra Hồ sơ & 4 Kỹ năng của Engie trong Database
    console.log('[TEST 1] Kiểm tra Hồ sơ nhân vật Engie trong Database:');
    const engie = getCharacterById('engie');
    if (!engie) throw new Error('Không tìm thấy Engie trong CHARACTERS_DATABASE!');
    if (engie.id !== 'engie') throw new Error('Engie ID không chính xác!');
    if (engie.maxHp !== 100) throw new Error(`Engie HP phải là 100, nhận được: ${engie.maxHp}`);
    if (engie.moveBudget !== 2) throw new Error(`Move budget phải là 2, nhận được: ${engie.moveBudget}`);
    if (engie.avatar !== '🔧') throw new Error(`Avatar phải là 🔧, nhận được: ${engie.avatar}`);
    if (!engie.isUnlocked) throw new Error('Engie phải được mở khóa (isUnlocked: true)!');
    if (engie.skills.length !== 4) throw new Error(`Engie phải có 4 kỹ năng, nhận được: ${engie.skills.length}`);

    const [s1, s2, s3, s4] = engie.skills;
    console.log(`✓ Kỹ năng 1: [${s1.name}] (${s1.id}) - Type: ${s1.type}, MaxSteps: ${s1.maxSteps}`);
    console.log(`✓ Kỹ năng 2 (Vũ khí): [${s2.name}] (${s2.id}) - Range: ${s2.range}, Power: ${s2.power}`);
    console.log(`✓ Kỹ năng 3 (Chiêu 1): [${s3.name}] (${s3.id}) - Range: ${s3.range}, SentryHP: ${s3.sentryHp}, Power: ${s3.power}, Scan: 11x11, Cooldown: ${s3.cooldown}L`);
    console.log(`✓ Kỹ năng 4 (Chiêu 2): [${s4.name}] (${s4.id}) - Range: ${s4.range}, PortalHP: ${s4.portalHp}, Cooldown: ${s4.cooldown}L`);

    if (s2.power !== 15 || s2.range !== 5) {
        throw new Error('Chỉ số Súng Thanh Sắt không đúng yêu cầu (15 DMG, Range 5)!');
    }
    if (s3.sentryHp !== 50 || s3.power !== 10 || s3.sentryRange !== 5 || s3.cooldown !== 2) {
        throw new Error('Chỉ số Xây Sentry không đúng yêu cầu (50 HP, 10 DMG, Quét 11x11, Hồi 2L)!');
    }
    if (s4.portalHp !== 60 || s4.range !== 5 || s4.cooldown !== 3) {
        throw new Error('Chỉ số Cổng Dịch Chuyển không đúng yêu cầu (60 HP, Range 5, Hồi 3L)!');
    }
    console.log('✓ TEST 1 PASS: Hồ sơ và 4 kỹ năng của Engie hoàn toàn chính xác!\n');

    // TEST 2: Kiểm tra Súng Thanh Sắt (15 DMG, Range 5)
    console.log('[TEST 2] Kiểm tra Súng Thanh Sắt (15 DMG, Phạm vi 5 ô):');
    engine.setupTeams();
    const blueEngie = engine.createUnit('b_eng', 'BLUE', 0, engie, true);
    const redTarget = engine.createUnit('r_tg', 'RED', 0, getCharacterById('trooper'), false);
    blueEngie.x = 2; blueEngie.y = 3;
    redTarget.x = 7; redTarget.y = 3; // Khoảng cách đúng 5 ô
    engine.blueTeam = [blueEngie];
    engine.redTeam = [redTarget];

    nailgunSoundCalled = false;
    const nailgunAct = {
        type: 'RANGED_LINE',
        skillId: 'ENGIE_NAILGUN',
        name: 'Súng Thanh Sắt',
        dir: 'RIGHT',
        range: 5,
        power: 15
    };
    await engine.resolveUnitAttack(blueEngie, nailgunAct, 0);

    if (redTarget.hp !== 85) {
        throw new Error(`Mục tiêu phải mất 15 HP (còn 85 HP), thực tế: ${redTarget.hp}`);
    }
    if (!nailgunSoundCalled) {
        throw new Error('Âm thanh playNailgun() không được phát khi bắn Súng Thanh Sắt!');
    }
    console.log(`✓ Súng Thanh Sắt bắn trúng mục tiêu tầm 5 gây đúng 15 DMG (100 -> 85 HP) và phát âm thanh playNailgun() chuẩn xác!`);
    console.log('✓ TEST 2 PASS: Súng Thanh Sắt hoạt động chính xác!\n');

    // TEST 3: Kiểm tra Xây Sentry tự động (50 HP, 10 DMG, quét 11x11, Hồi 2L)
    console.log('[TEST 3] Kiểm tra Xây Sentry tự động (50 HP, 10 DMG, Quét 11x11 quanh nó, Hồi 2L):');
    wrenchSoundCalled = false;
    blueEngie.x = 3; blueEngie.y = 3;
    const sentryDeployAct = {
        type: 'DEPLOY_SENTRY',
        skillId: 'ENGIE_SENTRY',
        name: 'Xây Sentry',
        dir: 'RIGHT',
        range: 1,
        power: 10,
        sentryHp: 50,
        sentryRange: 5,
        cooldown: 2
    };
    await engine.resolveUnitAttack(blueEngie, sentryDeployAct, 0);

    if (engine.sentries.length !== 1) {
        throw new Error(`Phải có 1 Sentry trên sân, thực tế: ${engine.sentries.length}`);
    }
    const mySentry = engine.sentries[0];
    if (mySentry.x !== 4 || mySentry.y !== 3) {
        throw new Error(`Sentry phải đặt tại (4, 3), thực tế: (${mySentry.x}, ${mySentry.y})`);
    }
    if (mySentry.hp !== 50 || mySentry.maxHp !== 50) {
        throw new Error(`Máu Sentry phải là 50/50, thực tế: ${mySentry.hp}/${mySentry.maxHp}`);
    }
    if (blueEngie.cooldowns['ENGIE_SENTRY'] !== 2) {
        throw new Error(`Hồi chiêu Xây Sentry phải là 2 lượt, thực tế: ${blueEngie.cooldowns['ENGIE_SENTRY']}`);
    }
    if (!wrenchSoundCalled) {
        throw new Error('Âm thanh playWrench() không được phát khi xây Sentry!');
    }
    console.log(`✓ Sentry được triển khai tại (${mySentry.x}, ${mySentry.y}) với 50/50 HP, hồi chiêu 2L, phát âm thanh playWrench()!`);

    // Sentry tự động nã đạn vào kẻ địch gần nhất trong 11x11 (Chebyshev dist <= 5)
    sentryShotSoundCalled = false;
    redTarget.x = 8; redTarget.y = 4; // Khoảng cách dx=4, dy=1 -> nằm trong 11x11
    redTarget.hp = 85;
    await engine.resolveSentryAttacks(0);

    if (redTarget.hp !== 75) {
        throw new Error(`Sentry phải gây 10 DMG vào mục tiêu (85 -> 75 HP), thực tế: ${redTarget.hp}`);
    }
    if (!sentryShotSoundCalled) {
        throw new Error('Âm thanh playSentryShot() không được phát khi Sentry khai hỏa!');
    }
    console.log(`✓ Sentry tự động quét mục tiêu tại (8, 4) trong vùng 11x11 và bắn trúng (-10 DMG: 85 -> 75 HP), phát playSentryShot()!`);

    // Kiểm tra kẻ địch ngoài vùng 11x11 (dx > 5)
    redTarget.x = 15; redTarget.y = 3; // dx = 11 > 5 -> Ngoài vùng 11x11
    redTarget.hp = 75;
    await engine.resolveSentryAttacks(1);
    if (redTarget.hp !== 75) {
        throw new Error(`Sentry không được bắn kẻ địch ngoài vùng 11x11, nhưng máu bị trừ thành: ${redTarget.hp}`);
    }
    console.log(`✓ Kẻ địch ngoài vùng 11x11 an toàn không bị Sentry bắn!`);
    console.log('✓ TEST 3 PASS: Kỹ năng Xây Sentry tự động và nã đạn 11x11 hoàn toàn chính xác!\n');

    // TEST 4: Kiểm tra Sentry có thể bị kẻ địch tấn công và phá hủy khi hết máu
    console.log('[TEST 4] Kiểm tra Sentry bị tấn công và phá hủy khi HP <= 0:');
    // Kẻ địch bắn súng 20 DMG vào ô Sentry (4, 3)
    const enemyRifleAct = {
        type: 'RANGED_LINE',
        skillId: 'TROOPER_RIFLE',
        dir: 'LEFT',
        range: 5,
        power: 20
    };
    redTarget.x = 7; redTarget.y = 3;
    await engine.resolveUnitAttack(redTarget, enemyRifleAct, 0);

    if (mySentry.hp !== 30) {
        throw new Error(`Sentry phải nhận 20 DMG (50 -> 30 HP), thực tế: ${mySentry.hp}`);
    }
    console.log(`✓ Đòn bắn của địch trúng Sentry làm giảm máu: 50 -> 30 HP!`);

    // Kẻ địch ném tên lửa 30 DMG vào Sentry
    const enemyRocketAct = {
        type: 'ROCKET',
        skillId: 'TROOPER_ROCKET',
        dir: 'LEFT',
        range: 5,
        power: 30
    };
    await engine.resolveUnitAttack(redTarget, enemyRocketAct, 1);

    if (engine.sentries.length !== 0) {
        throw new Error(`Sentry sau khi hết máu phải bị phá hủy và loại bỏ khỏi sân! Hiện còn: ${engine.sentries.length}`);
    }
    console.log(`✓ Sentry nhận thêm 30 DMG (30 -> 0 HP) và phát nổ tan tành, biến mất khỏi sân!`);
    console.log('✓ TEST 4 PASS: Độ bền và cơ chế phá hủy Sentry hoạt động hoàn hảo!\n');

    // TEST 5: Kiểm tra Cổng Dịch Chuyển (60 HP, Phạm vi 5, Hồi 3L)
    console.log('[TEST 5] Kiểm tra Cổng Dịch Chuyển (DEPLOY_TELEPORTER 60 HP, Range 5, Cooldown 3L):');
    portalOpenSoundCalled = false;
    blueEngie.x = 2; blueEngie.y = 3;
    const teleDeployAct = {
        type: 'DEPLOY_TELEPORTER',
        skillId: 'ENGIE_TELEPORTER',
        name: 'Cổng Dịch Chuyển',
        dir: 'RIGHT',
        range: 5,
        portalHp: 60,
        cooldown: 3
    };
    await engine.resolveUnitAttack(blueEngie, teleDeployAct, 0);

    if (engine.teleporters.length !== 1) {
        throw new Error(`Phải có 1 cặp Teleporter trên sân, thực tế: ${engine.teleporters.length}`);
    }
    const myTele = engine.teleporters[0];
    if (myTele.inX !== 2 || myTele.inY !== 3) {
        throw new Error(`Cổng vào phải ở vị trí Engie (2, 3), thực tế: (${myTele.inX}, ${myTele.inY})`);
    }
    if (myTele.outX !== 7 || myTele.outY !== 3) {
        throw new Error(`Cổng ra phải ở đích tầm 5 (7, 3), thực tế: (${myTele.outX}, ${myTele.outY})`);
    }
    if (myTele.hp !== 60 || myTele.maxHp !== 60) {
        throw new Error(`Máu Cổng Dịch Chuyển phải là 60/60, thực tế: ${myTele.hp}/${myTele.maxHp}`);
    }
    if (blueEngie.cooldowns['ENGIE_TELEPORTER'] !== 3) {
        throw new Error(`Hồi chiêu Cổng Dịch Chuyển phải là 3 lượt, thực tế: ${blueEngie.cooldowns['ENGIE_TELEPORTER']}`);
    }
    if (!portalOpenSoundCalled) {
        throw new Error('Âm thanh playPortalOpen() không được phát khi mở Cổng Dịch Chuyển!');
    }
    console.log(`✓ Cổng Vào tại (${myTele.inX}, ${myTele.inY}), Cổng Ra tại (${myTele.outX}, ${myTele.outY}) (60 HP, Hồi: 3L), phát playPortalOpen()!`);
    console.log('✓ TEST 5 PASS: Mở Cổng Dịch Chuyển chuẩn xác!\n');

    // TEST 6: Kiểm tra Đồng minh dịch chuyển tức thì từ Cổng Vào sang Cổng Ra
    console.log('[TEST 6] Kiểm tra Đồng minh bước vào Cổng Vào lập tức xuất hiện tại Cổng Ra:');
    teleportSoundCalled = false;
    redTarget.x = 15; redTarget.y = 3; // Di dời kẻ địch ra xa
    const blueAlly = engine.createUnit('b_ally', 'BLUE', 1, getCharacterById('trooper'), false);
    blueAlly.x = 1; blueAlly.y = 3;
    engine.blueTeam = [blueEngie, blueAlly];

    // Đồng minh bước vào ô Cổng Vào (2, 3)
    blueAlly.x = 2; blueAlly.y = 3;
    engine.checkTeleporters(blueAlly);

    if (blueAlly.x !== 7 || blueAlly.y !== 3) {
        throw new Error(`Đồng minh phải lập tức xuất hiện tại Cổng Ra (7, 3), thực tế: (${blueAlly.x}, ${blueAlly.y})`);
    }
    if (!teleportSoundCalled) {
        throw new Error('Âm thanh playTeleport() không được phát khi đơn vị dịch chuyển!');
    }
    console.log(`✓ Đồng minh bước vào Cổng Vào (2, 3) lập tức xuất hiện tại Cổng Ra (7, 3) và phát âm thanh playTeleport()!`);

    // Kiểm tra trường hợp ô Cổng Ra bị chiếm bởi đơn vị khác: đơn vị dịch chuyển sang ô kề cận
    redTarget.x = 7; redTarget.y = 3; // Kẻ địch đứng chiếm ô Cổng Ra
    blueAlly.x = 2; blueAlly.y = 3; // Đồng minh bước lại vào Cổng Vào
    engine.checkTeleporters(blueAlly);
    if (blueAlly.x === 7 && blueAlly.y === 3) {
        throw new Error('Cổng ra bị chiếm nhưng đơn vị vẫn chồng lên ô bị chiếm!');
    }
    if (Math.abs(blueAlly.x - 7) > 1 || Math.abs(blueAlly.y - 3) > 1) {
        throw new Error(`Đơn vị phải đáp xuống ô kề cận của Cổng Ra, thực tế: (${blueAlly.x}, ${blueAlly.y})`);
    }
    console.log(`✓ Khi Cổng Ra (7, 3) bị đối thủ chiếm, đồng minh thông minh đáp xuống ô kề cận (${blueAlly.x}, ${blueAlly.y}) an toàn!`);

    // Kẻ thù bước vào ô Cổng Vào (2, 3) KHÔNG ĐƯỢC dịch chuyển
    redTarget.x = 2; redTarget.y = 3;
    engine.checkTeleporters(redTarget);
    if (redTarget.x !== 2 || redTarget.y !== 3) {
        throw new Error(`Kẻ thù KHÔNG được sử dụng cổng của đối phương! Thực tế vị trí bị đổi thành: (${redTarget.x}, ${redTarget.y})`);
    }
    console.log(`✓ Kẻ thù bước vào Cổng Vào của đối phương không bị dịch chuyển (ở nguyên vị trí)!`);
    console.log('✓ TEST 6 PASS: Cơ chế Dịch Chuyển Đồng Minh hoạt động chuẩn xác!\n');

    // TEST 7: Kiểm tra Độ bền và Cơ chế Phá hủy Cổng Dịch Chuyển (60 HP)
    console.log('[TEST 7] Kiểm tra Cổng Dịch Chuyển bị tấn công và phá hủy:');
    // Kẻ địch tấn công vào Cổng Ra tại (7, 3) với 25 sát thương
    const enemyAttackAct = {
        type: 'ATTACK',
        name: 'Chém Kiếm',
        dir: 'LEFT',
        range: 1,
        power: 25
    };
    redTarget.x = 8; redTarget.y = 3;
    await engine.resolveUnitAttack(redTarget, enemyAttackAct, 0);

    if (myTele.hp !== 35) {
        throw new Error(`Cổng Dịch Chuyển phải mất 25 HP (60 -> 35 HP), thực tế: ${myTele.hp}`);
    }
    console.log(`✓ Cổng Dịch Chuyển bị chém cận chiến: 60 -> 35 HP!`);

    // Vụ nổ Lựu Đạn (50 DMG) trúng Cổng Dịch Chuyển
    engine.damageDeployablesInArea(7, 3, 1, 50, 'RED', { name: 'Lựu Đạn' });

    if (engine.teleporters.length !== 0) {
        throw new Error(`Cổng Dịch Chuyển sau khi hết máu phải bị sập và loại bỏ! Hiện còn: ${engine.teleporters.length}`);
    }
    console.log(`✓ Cổng Dịch Chuyển nhận thêm 50 DMG (35 -> 0 HP), sập và biến mất khỏi sân hoàn toàn!`);
    console.log('✓ TEST 7 PASS: Độ bền và cơ chế phá hủy Cổng Dịch Chuyển hoạt động hoàn hảo!\n');

    // TEST 8: Kiểm tra AI CPU tự động sinh 4 lệnh cho Engie
    console.log('[TEST 8] Kiểm tra AI tự động sinh 4 lệnh cho CPU Engie:');
    const cpuEngieUnit = engine.createUnit('c_eng', 'RED', 0, engie, false);
    cpuEngieUnit.x = 17; cpuEngieUnit.y = 3;
    blueEngie.x = 4; blueEngie.y = 3;
    engine.blueTeam = [blueEngie];
    engine.redTeam = [cpuEngieUnit];

    const cpuQueue = engine.generateCpuQueueForUnit(cpuEngieUnit);
    if (!cpuQueue || cpuQueue.length !== 4) {
        throw new Error(`CPU Engie phải sinh đúng 4 lệnh, thực tế: ${cpuQueue ? cpuQueue.length : 0}`);
    }
    console.log(`✓ CPU Engie sinh 4 lệnh:`);
    cpuQueue.forEach((act, idx) => {
        console.log(`  Lệnh ${idx + 1}: [${act.name}] (${act.type}) - Hướng: ${act.dir}`);
    });
    const hasSentryOrTele = cpuQueue.some(act => act.type === 'DEPLOY_SENTRY' || act.type === 'DEPLOY_TELEPORTER' || act.type === 'RANGED_LINE');
    if (!hasSentryOrTele) {
        throw new Error('AI Engie phải sử dụng các kỹ năng đặc trưng (Sentry / Teleporter / Nailgun)!');
    }
    console.log('✓ TEST 8 PASS: AI của Engie sinh 4 lệnh thông minh tương thích 100% với kỹ năng mới!\n');

    console.log('====================================================');
    console.log('🎉 TẤT CẢ 8/8 BÀI KIỂM THỬ NHÂN VẬT ENGIE ĐÃ VƯỢT QUA 100% THÀNH CÔNG!');
    console.log('====================================================');
}

runTests().catch(err => {
    console.error('\n❌ TEST THẤT BẠI:', err);
    process.exit(1);
});
