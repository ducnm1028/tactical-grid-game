const fs = require('fs');
const vm = require('vm');

// Mock DOM & Audio environment
const domElements = {};
function createMockElement(id = '') {
    return {
        id,
        tagName: 'DIV',
        innerText: '',
        innerHTML: '',
        style: {},
        classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            contains(c) { return this.classes.has(c); },
            toggle(c, force) {
                if (force === undefined) {
                    if (this.classes.has(c)) this.classes.delete(c);
                    else this.classes.add(c);
                } else if (force) {
                    this.classes.add(c);
                } else {
                    this.classes.delete(c);
                }
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
        if (!domElements[id]) {
            domElements[id] = createMockElement(id);
        }
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
    addEventListener(event, cb) {
        this.listeners = this.listeners || {};
        this.listeners[event] = this.listeners[event] || [];
        this.listeners[event].push(cb);
    },
    dispatchKey(code, key = '') {
        if (this.listeners && this.listeners['keydown']) {
            this.listeners['keydown'].forEach(cb => cb({ code, key, preventDefault() {} }));
        }
    },
    AudioContext: class {
        constructor() { this.state = 'running'; this.currentTime = 0; }
        resume() {}
        createOscillator() { return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
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

console.log('=== KIỂM THỬ CHẾ ĐỘ 2 NGƯỜI CHƠI LOCAL (HOTSEAT 2P & WEGO SIMULTANEOUS) ===\n');

// Khởi tạo GameEngine
const engine = new GameEngine();

// Chọn tiếng Việt và vào màn hình chọn nhân vật
engine.selectLanguage('vi');
engine.showCharSelectScreen();

// [TEST 1] Chuyển đổi giữa Chế độ 1 Người chơi và 2 Người chơi Local
console.log('[TEST 1] Kiểm tra Chuyển chế độ 1P <-> 2P:');
if (engine.isTwoPlayerMode !== false) throw new Error('Default match mode must be 1P');

engine.setMatchMode(true);
if (engine.isTwoPlayerMode !== true) throw new Error('isTwoPlayerMode should be true after setMatchMode(true)');
console.log('✓ Bật chế độ 2 Người Chơi Local thành công (isTwoPlayerMode = true)');

engine.setMatchMode(false);
if (engine.isTwoPlayerMode !== false) throw new Error('isTwoPlayerMode should be false after setMatchMode(false)');
console.log('✓ Chuyển lại chế độ 1 Người Chơi vs CPU thành công (isTwoPlayerMode = false)');

engine.setMatchMode(true);

// [TEST 2] Tùy ý chọn Đội và Tướng cho P1 và P2 (PvP và Co-op)
console.log('\n[TEST 2] Kiểm tra tùy chọn Đội và Tướng P1 & P2:');
engine.setP1Team('BLUE');
engine.setP1Character('trooper');
engine.setP2Team('RED');
engine.setP2Character('razor');

if (engine.p1Team !== 'BLUE' || engine.p1Character.id !== 'trooper') throw new Error('P1 config mismatch');
if (engine.p2Team !== 'RED' || engine.p2Character.id !== 'razor') throw new Error('P2 config mismatch');
console.log(`✓ PvP Cấu hình: P1 [${engine.p1Character.name}] Đội ${engine.p1Team} vs P2 [${engine.p2Character.name}] Đội ${engine.p2Team}`);

// Bắt đầu trận đấu PvP
engine.startBattle();
if (engine.phase !== 'PLANNING') throw new Error(`Battle start phase should be PLANNING, got ${engine.phase}`);
if (engine.activePlanningPlayer !== 1) throw new Error(`Turn must begin with Player 1 planning, got ${engine.activePlanningPlayer}`);
if (!engine.p1Unit || engine.p1Unit.team !== 'BLUE') throw new Error('p1Unit must be in BLUE team');
if (!engine.p2Unit || engine.p2Unit.team !== 'RED') throw new Error('p2Unit must be in RED team');
console.log('✓ Khởi tạo đơn vị trận đấu: P1Unit = BLUE, P2Unit = RED, activePlanningPlayer = 1');

// [TEST 3] Quy trình Lập lệnh P1 -> Khóa bảo mật (Anti-Peeking) -> Chuyển giao Hotseat P2
console.log('\n[TEST 3] Kiểm tra Quy trình Hotseat Lập lệnh P1 -> Transition -> P2:');

// P1 nạp 4 lệnh: Trooper nạp Rifle (chiêu 2) và Di chuyển
engine.currentSelectedDir = 'RIGHT';
engine.addSkillToQueue(1); // Chiêu [2] Assault Rifle
engine.currentSelectedDir = 'UP_RIGHT';
engine.addSkillToQueue(1); // Chiêu [2] Assault Rifle
engine.currentSelectedDir = 'RIGHT';
engine.addSkillToQueue(1); // Chiêu [2] Assault Rifle
engine.currentSelectedDir = 'DOWN_RIGHT';
engine.addSkillToQueue(1); // Chiêu [2] Assault Rifle

if (engine.p1Queue.length !== 4) throw new Error(`P1 queue should have 4 actions, got ${engine.p1Queue.length}`);
console.log('✓ P1 đã nạp đủ 4 lệnh vào hàng đợi');

// Khi P1 đủ 4 lệnh, nhấn SPACE kích hoạt Transition Modal
window.dispatchKey('Space');
if (!engine.isHotseatModalOpen) throw new Error('Hotseat transition modal should be open after P1 commits');
console.log('✓ Modal chuyển giao bảo mật (Privacy Transition Shield) đã hiển thị');

// P2 nhận máy và nhấn Space để tiếp tục
window.dispatchKey('Space');
if (engine.isHotseatModalOpen) throw new Error('Hotseat transition modal should close after P2 confirms');
if (engine.activePlanningPlayer !== 2) throw new Error(`Active planning player must now be 2, got ${engine.activePlanningPlayer}`);
if (engine.selectedCharacter.id !== 'razor') throw new Error(`Selected character should now be P2 character (Razor), got ${engine.selectedCharacter.id}`);
console.log('✓ Giao diện và tham số đã chuyển sang P2 [Razor] thành công');

// [TEST 4] P2 lập lệnh và Chốt WEGO Resolution đồng thời
console.log('\n[TEST 4] Kiểm tra P2 nạp lệnh và Thực thi WEGO đồng thời:');
engine.currentSelectedDir = 'LEFT';
engine.addSkillToQueue(1); // Pulse Rifle
engine.currentSelectedDir = 'LEFT';
engine.addSkillToQueue(2); // Razor Leap
engine.currentSelectedDir = 'LEFT';
engine.addSkillToQueue(3); // Razor Blade (viên 1)
engine.currentSelectedDir = 'LEFT';
engine.addSkillToQueue(3); // Razor Blade (viên 2)

if (engine.p2Queue.length !== 4) throw new Error(`P2 queue should have 4 actions, got ${engine.p2Queue.length}`);
console.log('✓ P2 đã nạp đủ 4 lệnh vào hàng đợi');

// P2 chốt lệnh bằng Space -> Bắt đầu RESOLVING
window.dispatchKey('Space');
if (engine.phase !== 'RESOLVING') throw new Error(`Phase should transition to RESOLVING, got ${engine.phase}`);
if (engine.p1Unit.queue.length !== 4 || engine.p2Unit.queue.length !== 4) throw new Error('Both P1 and P2 queues must be locked');
console.log('✓ Cả 2 hàng đợi P1 và P2 đã được giải mã và thực thi WEGO đồng thời!');

// [TEST 5] Kiểm tra Chu kỳ lượt tiếp theo (Finish turn resets to P1)
console.log('\n[TEST 5] Kiểm tra Hoàn thành lượt và Reset chu kỳ sang P1:');
engine.finishTurn();
if (engine.phase !== 'PLANNING') throw new Error(`Phase after turn finish should be PLANNING, got ${engine.phase}`);
if (engine.activePlanningPlayer !== 1) throw new Error(`Turn 2 must start with P1 planning, got ${engine.activePlanningPlayer}`);
if (engine.p1Queue.length !== 0 || engine.p2Queue.length !== 0) throw new Error('Both queues must be empty at start of Turn 2');
console.log('✓ Chu kỳ Turn 2 tự động đặt lại quyền lập lệnh cho P1');

// [TEST 6] Kiểm tra Phân định Thắng/Thua PvP (P1 Thắng / P2 Thắng)
console.log('\n[TEST 6] Kiểm tra Tuyên bố Thắng/Thua PvP:');
// Giả định P2 bị tiêu diệt
engine.p2Unit.hp = 0;
engine.handleGameOver();
const modalTitle = document.getElementById('modalTitle').innerText;
const modalDesc = document.getElementById('modalDesc').innerText;

if ((!modalTitle.includes('NGƯỜI CHƠI 1') || !modalTitle.includes('CHIẾN THẮNG')) && !modalTitle.includes('PLAYER 1 VICTORY')) {
    throw new Error(`Expected P1 Victory title, got: ${modalTitle}`);
}
console.log(`✓ Phân định Thắng PvP chính xác: "${modalTitle}" - "${modalDesc}"`);

// [TEST 7] Kiểm tra Chế độ Co-op (Cùng phe đối đầu CPU)
console.log('\n[TEST 7] Kiểm tra Chế độ Hợp tác Co-op (P1 & P2 cùng Đội Xanh):');
engine.setMatchMode(true);
engine.setP1Team('BLUE');
engine.setP2Team('BLUE');
engine.setP1Character('trooper');
engine.setP2Character('hookman');
engine.applyTeamPreset('2v2');
engine.startBattle();

if (engine.p1Unit.team !== 'BLUE' || engine.p2Unit.team !== 'BLUE') throw new Error('Both players must be in BLUE team in Co-op');
if (engine.redTeam.length !== 2) throw new Error('Red team should have 2 CPU enemies');
console.log('✓ Khởi tạo Co-op thành công: P1 & P2 cùng thuộc Đội Xanh chiến đấu chống 2 CPU Đội Đỏ');

// Diệt sạch kẻ địch Red team
engine.redTeam.forEach(u => u.hp = 0);
engine.handleGameOver();
const coopTitle = document.getElementById('modalTitle').innerText;
if (!coopTitle.includes('ĐỒNG LÒNG CHIẾN THẮNG') && !coopTitle.includes('CO-OP VICTORY')) {
    throw new Error(`Expected Co-op victory title, got: ${coopTitle}`);
}
console.log(`✓ Tuyên bố Thắng Co-op chính xác: "${coopTitle}"`);

console.log('\n🎉 TẤT CẢ 7/7 BÀI KIỂM THỬ CHẾ ĐỘ 2 NGƯỜI CHƠI LOCAL ĐÃ VƯỢT QUA 100%!');
