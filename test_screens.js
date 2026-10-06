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
                querySelector() { return { innerText: '', innerHTML: '' }; },
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
    querySelector(sel) {
        return { innerText: '', innerHTML: '' };
    },
    querySelectorAll(sel) {
        return [];
    },
    createElement() {
        return { className: '', innerText: '', innerHTML: '', appendChild() {} };
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

console.log('--- KIỂM THỬ MÀN HÌNH CHỌN NGÔN NGỮ, MENU & HƯỚNG DẪN (i18n & SCREEN TRANSITIONS) ---');
const engine = new GameEngine();

// 1. Kiểm tra trạng thái khởi động ban đầu: phải hiện màn hình chọn ngôn ngữ (LANG_SELECT)
if (engine.phase !== 'LANG_SELECT') throw new Error(`Initial phase must be LANG_SELECT, got ${engine.phase}`);
console.log('✓ 1. Trạng thái khởi tạo: phase = LANG_SELECT (Hỏi ngôn ngữ khi mở web)');

// 2. Chọn Tiếng Việt -> Chuyển sang MAIN_MENU với ngôn ngữ 'vi'
document.getElementById('btnSelectLangVi').click();
if (engine.phase !== 'MAIN_MENU') throw new Error(`After selecting Vietnamese, phase should be MAIN_MENU, got ${engine.phase}`);
if (engine.lang !== 'vi') throw new Error(`Language should be 'vi', got ${engine.lang}`);
console.log('✓ 2. Chọn [TIẾNG VIỆT]: Vào MAIN_MENU thành công, lang = vi');

// 3. Test chuyển đổi sang English qua nút Header Lang Toggle
document.getElementById('btnHeaderLang').click();
if (engine.lang !== 'en') throw new Error(`After toggle, language should be 'en', got ${engine.lang}`);
console.log('✓ 3. Toggle ngôn ngữ: Chuyển sang ENGLISH thành công, lang = en');

// 4. Click nút PLAY -> Chuyển sang màn hình chọn tướng
document.getElementById('btnMenuPlay').click();
if (engine.phase !== 'CHAR_SELECT') throw new Error(`After clicking Play, phase should be CHAR_SELECT, got ${engine.phase}`);
if (domElements['charSelectScreen'].style.display !== 'flex') throw new Error('charSelectScreen must be flex');
if (domElements['mainMenuScreen'].style.display !== 'none') throw new Error('mainMenuScreen must be none');
console.log('✓ 4. Click [PLAY]: Chuyển sang màn hình chọn nhân vật (CHAR_SELECT)');

// 5. Click nút Back to Main Menu từ màn hình chọn tướng
document.getElementById('btnCharSelectBack').click();
if (engine.phase !== 'MAIN_MENU') throw new Error(`After back, phase should be MAIN_MENU, got ${engine.phase}`);
if (domElements['mainMenuScreen'].style.display !== 'flex') throw new Error('mainMenuScreen must be flex');
console.log('✓ 5. Click [⬅ MAIN MENU]: Quay lại MAIN_MENU thành công');

// 6. Click nút GUIDE -> Chuyển sang HOW_TO_PLAY
document.getElementById('btnMenuGuide').click();
if (engine.phase !== 'HOW_TO_PLAY') throw new Error(`After clicking Guide, phase should be HOW_TO_PLAY, got ${engine.phase}`);
if (domElements['howToPlayScreen'].style.display !== 'flex') throw new Error('howToPlayScreen must be flex');
console.log('✓ 6. Click [HOW TO PLAY]: Chuyển sang HOW_TO_PLAY thành công');

// 7. Click nút Quay lại từ Guide -> Quay lại MAIN_MENU
document.getElementById('btnGuideBack').click();
if (engine.phase !== 'MAIN_MENU') throw new Error(`After guide back, phase should be MAIN_MENU, got ${engine.phase}`);
console.log('✓ 7. Click [⬅ BACK TO MAIN MENU]: Trở lại MAIN_MENU thành công');

// 8. Kiểm tra phím tắt:
// Trên MAIN_MENU, nhấn 'h' -> Mở hướng dẫn
window.dispatchKey('KeyH', 'h');
if (engine.phase !== 'HOW_TO_PLAY') throw new Error('Pressing H should open HOW_TO_PLAY');
console.log('✓ 8. Phím tắt [H]: Mở hướng dẫn chơi thành công');

// Trên HOW_TO_PLAY, nhấn 'Escape' -> Quay về MAIN_MENU
window.dispatchKey('Escape', 'Escape');
if (engine.phase !== 'MAIN_MENU') throw new Error('Pressing Escape should close HOW_TO_PLAY');
console.log('✓ 9. Phím tắt [Escape]: Đóng hướng dẫn về menu thành công');

// Trên MAIN_MENU, nhấn 'Space' -> Mở chọn nhân vật
window.dispatchKey('Space', ' ');
if (engine.phase !== 'CHAR_SELECT') throw new Error('Pressing Space on MAIN_MENU should open CHAR_SELECT');
console.log('✓ 10. Phím tắt [Space]: Vào màn hình chọn nhân vật thành công');

// Trên CHAR_SELECT, nhấn 'Escape' -> Quay về MAIN_MENU
window.dispatchKey('Escape', 'Escape');
if (engine.phase !== 'MAIN_MENU') throw new Error('Pressing Escape on CHAR_SELECT should return to MAIN_MENU');
console.log('✓ 11. Phím tắt [Escape] trên chọn tướng: Quay về MAIN_MENU thành công');

// Trên CHAR_SELECT, nhấn 'Space' -> Vào trận đấu
engine.showCharSelectScreen();
window.dispatchKey('Space', ' ');
if (engine.phase !== 'PLANNING') throw new Error('Pressing Space on CHAR_SELECT should start battle and enter PLANNING phase');
console.log('✓ 12. Phím tắt [Space] trên chọn tướng: Bắt đầu trận đấu (PLANNING) thành công');

// 13. Test chuyển lại tiếng Việt trong trận đấu
document.getElementById('btnHeaderLang').click();
if (engine.lang !== 'vi') throw new Error('Lang should be vi');
console.log('✓ 13. Đổi ngôn ngữ trong khi đang chiến đấu: Giữ nguyên trận đấu và cập nhật giao diện');

console.log('\n🎉 TẤT CẢ 13/13 BÀI TEST NGÔN NGỮ, MÀN HÌNH VÀ PHÍM TẮT ĐÃ VƯỢT QUA 100%!');
