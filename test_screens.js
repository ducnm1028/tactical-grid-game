const fs = require('fs');
const vm = require('vm');

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
    querySelectorAll() { return []; },
    createElement() { return { className: '', innerText: '', innerHTML: '', appendChild() {} }; }
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

vm.runInThisContext(fs.readFileSync('characters.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('audio.js', 'utf8'));
global.window.soundCtrl = new SoundController();
vm.runInThisContext(fs.readFileSync('game.js', 'utf8'));

console.log('--- KIỂM THỬ MÀN HÌNH CHÍNH & HƯỚNG DẪN (SCREEN TRANSITIONS & HOTKEYS) ---');
const engine = new GameEngine();

// 1. Kiểm tra trạng thái khởi động ban đầu
if (engine.phase !== 'MAIN_MENU') throw new Error(`Initial phase must be MAIN_MENU, got ${engine.phase}`);
console.log('✓ 1. Trạng thái khởi tạo: phase = MAIN_MENU');

// 2. Click nút CHƠI -> Chuyển sang màn hình chọn tướng
document.getElementById('btnMenuPlay').click();
if (engine.phase !== 'CHAR_SELECT') throw new Error(`After clicking Play, phase should be CHAR_SELECT, got ${engine.phase}`);
if (domElements['charSelectScreen'].style.display !== 'flex') throw new Error('charSelectScreen must be flex');
if (domElements['mainMenuScreen'].style.display !== 'none') throw new Error('mainMenuScreen must be none');
console.log('✓ 2. Click [CHƠI]: Chuyển sang chọn nhân vật thành công');

// 3. Click nút Quay lại Menu chính từ màn hình chọn tướng
document.getElementById('btnCharSelectBack').click();
if (engine.phase !== 'MAIN_MENU') throw new Error(`After back, phase should be MAIN_MENU, got ${engine.phase}`);
if (domElements['mainMenuScreen'].style.display !== 'flex') throw new Error('mainMenuScreen must be flex');
console.log('✓ 3. Click [⬅ MENU CHÍNH] từ chọn nhân vật: Quay lại MAIN_MENU thành công');

// 4. Click nút HƯỚNG DẪN -> Chuyển sang màn hình hướng dẫn
document.getElementById('btnMenuGuide').click();
if (engine.phase !== 'HOW_TO_PLAY') throw new Error(`After clicking Guide, phase should be HOW_TO_PLAY, got ${engine.phase}`);
if (domElements['howToPlayScreen'].style.display !== 'flex') throw new Error('howToPlayScreen must be flex');
console.log('✓ 4. Click [HƯỚNG DẪN]: Chuyển sang HOW_TO_PLAY thành công');

// 5. Click nút Quay lại từ Hướng dẫn -> Quay lại MAIN_MENU
document.getElementById('btnGuideBack').click();
if (engine.phase !== 'MAIN_MENU') throw new Error(`After guide back, phase should be MAIN_MENU, got ${engine.phase}`);
console.log('✓ 5. Click [⬅ QUAY LẠI MENU CHÍNH]: Trở lại MAIN_MENU thành công');

// 6. Kiểm tra phím tắt:
// Trên MAIN_MENU, nhấn 'h' -> Mở hướng dẫn
window.dispatchKey('KeyH', 'h');
if (engine.phase !== 'HOW_TO_PLAY') throw new Error('Pressing H should open HOW_TO_PLAY');
console.log('✓ 6. Phím tắt [H]: Mở hướng dẫn chơi thành công');

// Trên HOW_TO_PLAY, nhấn 'Escape' -> Quay về MAIN_MENU
window.dispatchKey('Escape', 'Escape');
if (engine.phase !== 'MAIN_MENU') throw new Error('Pressing Escape should close HOW_TO_PLAY');
console.log('✓ 7. Phím tắt [Escape]: Đóng hướng dẫn về menu thành công');

// Trên MAIN_MENU, nhấn 'Space' -> Mở chọn nhân vật
window.dispatchKey('Space', ' ');
if (engine.phase !== 'CHAR_SELECT') throw new Error('Pressing Space on MAIN_MENU should open CHAR_SELECT');
console.log('✓ 8. Phím tắt [Space]: Vào màn hình chọn nhân vật thành công');

// Trên CHAR_SELECT, nhấn 'Escape' -> Quay về MAIN_MENU
window.dispatchKey('Escape', 'Escape');
if (engine.phase !== 'MAIN_MENU') throw new Error('Pressing Escape on CHAR_SELECT should return to MAIN_MENU');
console.log('✓ 9. Phím tắt [Escape] trên chọn tướng: Quay về MAIN_MENU thành công');

// Trên CHAR_SELECT, nhấn 'Space' -> Vào trận đấu
engine.showCharSelectScreen();
window.dispatchKey('Space', ' ');
if (engine.phase !== 'PLANNING') throw new Error('Pressing Space on CHAR_SELECT should start battle and enter PLANNING phase');
console.log('✓ 10. Phím tắt [Space] trên chọn tướng: Bắt đầu trận đấu (PLANNING) thành công');

console.log('\n🎉 TẤT CẢ 10/10 TEST MÀN HÌNH VÀ PHÍM TẮT ĐÃ VƯỢT QUA 100%!');
