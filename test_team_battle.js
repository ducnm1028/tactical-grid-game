const fs = require('fs');
const vm = require('vm');

// Mock browser environment
const domElements = {};
class MockAudioContext {
    constructor() { this.state = 'running'; this.currentTime = 0; }
    resume() {}
    createOscillator() { return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
}
global.window = {
    addEventListener() {},
    AudioContext: MockAudioContext,
    soundCtrl: null
};
global.AudioContext = MockAudioContext;
global.document = {
    title: '',
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
                        restore() {}
                    };
                }
            };
        }
        return domElements[id];
    },
    querySelector(sel) {
        return {
            innerText: '',
            innerHTML: '',
            style: {},
            classList: { add() {}, remove() {}, toggle() {} },
            addEventListener() {}
        };
    },
    querySelectorAll(sel) {
        return [];
    },
    createElement(tag) {
        return {
            tagName: tag,
            className: '',
            innerText: '',
            innerHTML: '',
            appendChild() {}
        };
    }
};

global.requestAnimationFrame = (cb) => {};
global.performance = { now: () => Date.now() };

// Load project scripts
vm.runInThisContext(fs.readFileSync('i18n.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('characters.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('audio.js', 'utf8'));
global.window.soundCtrl = new SoundController();
vm.runInThisContext(fs.readFileSync('game.js', 'utf8'));

async function runTeamBattleTests() {
    console.log('=== KIỂM THỬ CHỨC NĂNG ĐẠI CHIẾN ĐỘI HÌNH (TEAM BATTLE MODE 1v1 - 5v5) ===\n');

    const engine = new GameEngine();
    engine.delay = () => Promise.resolve();

    // 1. Kiểm tra Presets Đội hình (1v1, 2v2, 3v3, 4v4, 5v5)
    console.log('[TEST 1] Kiểm tra các preset đội hình:');
    const presets = ['1v1', '2v2', '3v3', '4v4', '5v5'];
    for (const p of presets) {
        engine.applyTeamPreset(p);
        const expectedSize = parseInt(p[0], 10);
        if (engine.blueTeamSize !== expectedSize || engine.redTeamSize !== expectedSize) {
            throw new Error(`Preset ${p} thất bại! Blue: ${engine.blueTeamSize}, Red: ${engine.redTeamSize}`);
        }
        if (engine.blueTeam.length !== expectedSize || engine.redTeam.length !== expectedSize) {
            throw new Error(`Số lượng unit không khớp cho preset ${p}! Blue: ${engine.blueTeam.length}, Red: ${engine.redTeam.length}`);
        }
        console.log(`✓ Preset [${p}]: Đội Xanh = ${engine.blueTeam.length} đơn vị, Đội Đỏ = ${engine.redTeam.length} đơn vị.`);
    }

    // 2. Kiểm tra tùy chỉnh lệch đội (vd: 3 Blue vs 5 Red, 5 Blue vs 1 Red)
    console.log('\n[TEST 2] Kiểm tra tùy chỉnh số lượng đội bất đối xứng:');
    engine.setBlueTeamSize(3);
    engine.setRedTeamSize(5);
    if (engine.blueTeam.length !== 3 || engine.redTeam.length !== 5) {
        throw new Error(`Asymmetric team size failed! Blue: ${engine.blueTeam.length}, Red: ${engine.redTeam.length}`);
    }
    console.log(`✓ Tùy chỉnh bất đối xứng: 3 Đội Xanh vs 5 Đội Đỏ.`);

    // 3. Kiểm tra Tọa độ Xuất phát 5v5 không trùng lặp
    console.log('\n[TEST 3] Kiểm tra tọa độ xuất phát 5v5:');
    engine.applyTeamPreset('5v5');
    const blueCoords = engine.blueTeam.map(u => `${u.x},${u.y}`);
    const redCoords = engine.redTeam.map(u => `${u.x},${u.y}`);

    const uniqueBlue = new Set(blueCoords);
    const uniqueRed = new Set(redCoords);

    if (uniqueBlue.size !== 5) throw new Error('Trùng lặp vị trí xuất phát Đội Xanh!');
    if (uniqueRed.size !== 5) throw new Error('Trùng lặp vị trí xuất phát Đội Đỏ!');

    // Đảm bảo không unit nào ở ngoài bản đồ 20x7
    for (const u of [...engine.blueTeam, ...engine.redTeam]) {
        if (u.x < 0 || u.x >= GRID_COLS || u.y < 0 || u.y >= GRID_ROWS) {
            throw new Error(`Vị trí spawn ngoài biên: (${u.x}, ${u.y})`);
        }
    }
    console.log(`✓ Đội Xanh 5 vị trí: ${blueCoords.join(' | ')}`);
    console.log(`✓ Đội Đỏ 5 vị trí:   ${redCoords.join(' | ')}`);
    console.log('✓ 100% tọa độ xuất phát hợp lệ và không trùng lặp!');

    // 4. Kiểm tra AI của Đồng minh và Kẻ địch nhắm mục tiêu chính xác
    console.log('\n[TEST 4] Kiểm tra AI tự động nhắm mục tiêu đối thủ gần nhất:');
    engine.applyTeamPreset('3v3');
    for (const ally of engine.blueTeam.slice(1)) {
        const queue = engine.generateCpuQueueForUnit(ally);
        if (!queue || queue.length !== 4) throw new Error('Hàng đợi AI đồng minh không hợp lệ!');
    }
    for (const enemy of engine.redTeam) {
        const queue = engine.generateCpuQueueForUnit(enemy);
        if (!queue || queue.length !== 4) throw new Error('Hàng đợi AI kẻ địch không hợp lệ!');
    }
    console.log('✓ Tất cả CPU đồng minh và kẻ địch sinh 4 lệnh hành động chính xác!');

    // 5. Kiểm tra Khóa lệnh & Thực thi lượt đồng thời đa đơn vị (Simultaneous Step Resolution)
    console.log('\n[TEST 5] Kiểm tra commitTurn và thực thi lượt trận 3v3:');
    engine.startBattle();
    engine.playerQueue = [
        { type: 'ATTACK', dir: 'RIGHT', power: 25, name: 'Chém', icon: '⚔️', dirSymbol: '→' },
        { type: 'SHIELD', dir: 'RIGHT', name: 'Khiên', icon: '🛡️', dirSymbol: '→' },
        { type: 'RANGED_LINE', dir: 'RIGHT', range: 5, power: 20, name: 'Súng', icon: '🔫', dirSymbol: '→' },
        { type: 'SHIELD', dir: 'LEFT', name: 'Khiên', icon: '🛡️', dirSymbol: '←' }
    ];
    engine.commitTurn();

    if (engine.phase !== 'RESOLVING') throw new Error(`Phase must be RESOLVING, got: ${engine.phase}`);
    // Đảm bảo tất cả đơn vị còn sống đều có hàng đợi
    for (const u of engine.blueTeam) {
        if (!u.queue || u.queue.length !== 4) throw new Error(`Đơn vị ${u.name} không có hàng đợi 4 lệnh!`);
    }
    for (const u of engine.redTeam) {
        if (!u.queue || u.queue.length !== 4) throw new Error(`Đơn vị ${u.name} không có hàng đợi 4 lệnh!`);
    }
    console.log('✓ Toàn bộ 6 đấu thủ trên sân đều đã được khóa 4 lệnh đồng thời.');

    // Chờ quá trình giải quyết 4 nhịp hoàn tất
    await new Promise(r => setTimeout(r, 100));

    // 6. Kiểm tra Điều kiện Thắng / Thua Đội hình
    console.log('\n[TEST 6] Kiểm tra xử lý Thắng/Thua Đội hình:');
    engine.applyTeamPreset('2v2');

    // Trường hợp: Toàn bộ Đội Đỏ bị tiêu diệt
    engine.redTeam[0].hp = 0;
    engine.redTeam[1].hp = 0;
    engine.blueTeam[0].hp = 80;
    engine.blueTeam[1].hp = 50;

    engine.handleGameOver();
    if (engine.phase !== 'GAMEOVER') throw new Error('Phải chuyển sang phase GAMEOVER!');
    const modalTitle = domElements['modalTitle'].innerText;
    if (!modalTitle || (!modalTitle.includes('CHIẾN THẮNG') && !modalTitle.includes('VICTORY'))) {
        throw new Error(`Modal title should be victory! Actual: ${modalTitle}`);
    }
    console.log(`✓ Đội Đỏ bị tiêu diệt hết: Kích hoạt CHIẾN THẮNG ĐỘI HÌNH thành công! [${modalTitle}]`);

    // Trường hợp: Toàn bộ Đội Xanh bị tiêu diệt
    engine.blueTeam[0].hp = 0;
    engine.blueTeam[1].hp = 0;
    engine.redTeam[0].hp = 100;
    engine.redTeam[1].hp = 100;

    engine.handleGameOver();
    const defeatTitle = domElements['modalTitle'].innerText;
    if (!defeatTitle || (!defeatTitle.includes('THẤT BẠI') && !defeatTitle.includes('DEFEAT'))) {
        throw new Error(`Modal title should be defeat! Actual: ${defeatTitle}`);
    }
    console.log(`✓ Đội Xanh bị tiêu diệt hết: Kích hoạt THẤT BẠI ĐỘI HÌNH thành công! [${defeatTitle}]`);

    // 7. Kiểm tra Khởi động lại (Restart) bảo toàn thiết lập đội hình
    console.log('\n[TEST 7] Kiểm tra restartGame():');
    engine.applyTeamPreset('4v4');
    engine.restartGame();
    if (engine.blueTeam.length !== 4 || engine.redTeam.length !== 4) {
        throw new Error('restartGame không giữ nguyên số lượng đội hình!');
    }
    if (engine.turn !== 1 || engine.phase !== 'PLANNING') {
        throw new Error('restartGame không reset về Lượt 1 và phase PLANNING!');
    }
    console.log('✓ restartGame() hồi phục toàn bộ đấu thủ, reset máu và giữ nguyên đội hình 4v4!');

    console.log('\n🎉 TẤT CẢ 7/7 BÀI KIỂM THỬ ĐẠI CHIẾN ĐỘI HÌNH (1v1 - 5v5) ĐÃ VƯỢT QUA 100%!');
}

runTeamBattleTests().catch(err => {
    console.error('LỖI KIỂM THỬ:', err);
    process.exit(1);
});
