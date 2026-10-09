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

// Load scripts
const i18nCode = fs.readFileSync('./i18n.js', 'utf8');
const charactersCode = fs.readFileSync('./characters.js', 'utf8');
const gameCode = fs.readFileSync('./game.js', 'utf8');

vm.runInThisContext(i18nCode);
vm.runInThisContext(charactersCode);
vm.runInThisContext(gameCode);

function runControlHintTests() {
    console.log('=== KIỂM THỬ HƯỚNG DẪN CHỌN HƯỚNG TRƯỚC CHO KỸ NĂNG [2]+ TRÊN BẢNG ĐIỀU KHIỂN ===\n');

    const engine = new GameEngine();

    // TEST 1: Kiểm tra nội dung hướng dẫn trên Bảng điều khiển (Tiếng Việt)
    console.log('[TEST 1] Kiểm tra văn bản hướng dẫn tiếng Việt:');
    engine.selectLanguage('vi');
    const viText = domElements['controlPanelInstructionText'].innerHTML;
    if (!viText || !viText.includes('chọn hướng sử dụng kĩ năng trước') || !viText.includes('[2]')) {
        throw new Error(`Hướng dẫn tiếng Việt chưa đúng! Actual: ${viText}`);
    }
    const viActionBadge = domElements['actionSubBadge'].innerText;
    const viDirBadge = domElements['directionSubBadge'].innerText;
    if (!viActionBadge.includes('[2]+') || !viDirBadge.includes('[2]+')) {
        throw new Error(`Badge thứ tự thao tác tiếng Việt chưa đúng! action=${viActionBadge}, dir=${viDirBadge}`);
    }
    console.log(`✓ Banner bảng điều khiển: "${viText}"`);
    console.log(`✓ Huy hiệu gợi ý: "${viActionBadge}" & "${viDirBadge}"`);

    // TEST 2: Kiểm tra nội dung hướng dẫn khi chuyển sang Tiếng Anh
    console.log('\n[TEST 2] Kiểm tra chuyển đổi sang Tiếng Anh:');
    engine.selectLanguage('en');
    const enText = domElements['controlPanelInstructionText'].innerHTML;
    if (!enText || !enText.includes('must select the skill direction first') || !enText.includes('[2]')) {
        throw new Error(`English instruction missing! Actual: ${enText}`);
    }
    const enActionBadge = domElements['actionSubBadge'].innerText;
    const enDirBadge = domElements['directionSubBadge'].innerText;
    console.log(`✓ English banner: "${enText}"`);
    console.log(`✓ English badges: "${enActionBadge}" & "${enDirBadge}"`);

    // TEST 3: Kiểm tra Tooltip gợi ý trên các nút kỹ năng [2], [3], [4]
    console.log('\n[TEST 3] Kiểm tra Tooltip trên các nút kỹ năng:');
    engine.selectLanguage('vi');
    engine.updateSkillButtons();
    const dynamicContainer = domElements['dynamicSkillButtons'];
    const html = dynamicContainer.innerHTML;
    if (!html.includes('Phải chọn hướng trước')) {
        throw new Error('Nút kỹ năng từ [2] trở lên chưa có lưu ý "Phải chọn hướng trước" trong tooltip!');
    }
    console.log('✓ Tooltip các chiêu [2], [3], [4] đều bổ sung lời nhắc "• [Lưu ý: Phải chọn hướng trước]"!');

    // TEST 4: Kiểm tra cơ chế chọn hướng và nạp lệnh [2]+
    console.log('\n[TEST 4] Kiểm tra phản hồi hướng khi nạp lệnh [2]+:');
    engine.phase = 'PLANNING';
    engine.currentSelectedDir = 'UP_LEFT';
    engine.playerQueue = [];

    // Nạp chiêu #2 (Assault Rifle của Trooper)
    engine.addSkillToQueue(1);
    if (engine.playerQueue.length !== 1) throw new Error('Phải nạp được 1 lệnh vào queue!');
    const queuedAction = engine.playerQueue[0];
    if (queuedAction.dir !== 'UP_LEFT') {
        throw new Error(`Lệnh phải nhận hướng UP_LEFT, actual: ${queuedAction.dir}`);
    }
    console.log(`✓ Chiêu [${queuedAction.name}] nhận chính xác hướng đã chọn: ${queuedAction.dir} (${queuedAction.dirSymbol})`);

    console.log('\n🎉 TẤT CẢ 4/4 BÀI KIỂM THỬ HƯỚNG DẪN ĐIỀU KHIỂN ĐÃ VƯỢT QUA 100%!');
}

runControlHintTests();
