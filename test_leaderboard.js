/**
 * Test Suite: Leaderboard & Match Statistics for Crazy Warfare
 */
const fs = require('fs');
const vm = require('vm');

// Mock browser DOM and environment
const domElements = {};
global.document = {
    getElementById(id) {
        if (!domElements[id]) {
            domElements[id] = {
                id,
                style: {},
                classList: {
                    classes: new Set(),
                    add(c) { this.classes.add(c); },
                    remove(c) { this.classes.delete(c); },
                    toggle(c, force) {
                        if (force === undefined) {
                            if (this.classes.has(c)) this.classes.delete(c);
                            else this.classes.add(c);
                        } else if (force) this.classes.add(c);
                        else this.classes.delete(c);
                    },
                    contains(c) { return this.classes.has(c); }
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

const localStore = {};
global.localStorage = {
    getItem(key) { return localStore[key] || null; },
    setItem(key, val) { localStore[key] = String(val); },
    removeItem(key) { delete localStore[key]; },
    clear() { Object.keys(localStore).forEach(k => delete localStore[k]); }
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

console.log('=== BẮT ĐẦU KIỂM THỬ HỆ THỐNG LEADERBOARD & THỐNG KÊ VÁN ĐẤU ===\n');

const engine = new GameEngine();

// --- TEST 1: Khởi tạo Unit Stats ---
console.log('--- TEST 1: Khởi tạo Unit Stats khi bắt đầu trận ---');
const trooperChar = getCharacterById('trooper');
const unitA = engine.createUnit('test_blue_0', 'BLUE', 0, trooperChar, true, 'Player Trooper');
const unitB = engine.createUnit('test_red_0', 'RED', 0, trooperChar, false, 'CPU Trooper');

if (!unitA.stats || typeof unitA.stats !== 'object') throw new Error('Unit stats object not initialized!');
if (unitA.stats.kills !== 0 || unitA.stats.deaths !== 0 || unitA.stats.damageDealt !== 0 || unitA.stats.damageTaken !== 0) {
    throw new Error('Initial unit stats must all be 0!');
}
console.log('✔ TEST 1 PASSED: Unit stats khởi tạo đầy đủ 0 (kills, deaths, damageDealt, damageTaken, healing, hillPoints, score).');

// --- TEST 2: Ghi nhận Sát thương và Mạng Hạ Gục ---
console.log('\n--- TEST 2: Ghi nhận Sát thương & Mạng hạ gục qua applyDamage ---');
engine.applyDamage(unitB, 40, unitA);
if (unitB.hp !== 60) throw new Error(`Expected unitB HP 60, got ${unitB.hp}`);
if (unitB.stats.damageTaken !== 40) throw new Error(`Expected damageTaken 40, got ${unitB.stats.damageTaken}`);
if (unitA.stats.damageDealt !== 40) throw new Error(`Expected damageDealt 40, got ${unitA.stats.damageDealt}`);
if (unitA.stats.kills !== 0) throw new Error('UnitA should not have kills yet');

// Hạ gục mục tiêu
engine.applyDamage(unitB, 70, unitA);
if (unitB.hp !== 0) throw new Error(`Expected unitB HP 0, got ${unitB.hp}`);
if (unitB.stats.deaths !== 1) throw new Error(`Expected unitB deaths 1, got ${unitB.stats.deaths}`);
if (unitA.stats.kills !== 1) throw new Error(`Expected unitA kills 1, got ${unitA.stats.kills}`);
if (unitA.stats.damageDealt !== 100) throw new Error(`Expected total damageDealt 100, got ${unitA.stats.damageDealt}`);
console.log('✔ TEST 2 PASSED: Sát thương và Kills/Deaths ghi nhận tuyệt đối chính xác.');

// --- TEST 3: Ghi nhận Hồi Phục Sinh Lực (Healing) ---
console.log('\n--- TEST 3: Ghi nhận Hồi máu Adrenaline ---');
unitA.hp = 70;
unitA.buffs = { adrenaline: { turnsLeft: 2, healPerTurn: 5, dmgBonusPercent: 20 } };
const healAmount = Math.min(5, unitA.maxHp - unitA.hp);
unitA.hp += healAmount;
unitA.stats.healing += healAmount;
if (unitA.hp !== 75) throw new Error('HP after heal should be 75');
if (unitA.stats.healing !== 5) throw new Error(`Healing stats should be 5, got ${unitA.stats.healing}`);
console.log('✔ TEST 3 PASSED: Chỉ số hồi máu (Healing) tích lũy chính xác.');

// --- TEST 4: Công thức Tính Điểm (Score Calculation) ---
console.log('\n--- TEST 4: Công thức tính điểm tổng hợp (calculateUnitScore) ---');
// unitA: 1 Kill (100) + 100 DMG (100) + 5 Heal * 0.8 (4) + Alive (50) - 0 Deaths = 254 Điểm
const scoreA = engine.calculateUnitScore(unitA);
if (scoreA !== 254) throw new Error(`Expected score 254, got ${scoreA}`);

// unitB: 0 Kills (0) + 0 DMG (0) + 0 Heal (0) + Dead (0) - 1 Death (20) -> min 0
const scoreB = engine.calculateUnitScore(unitB);
if (scoreB !== 0) throw new Error(`Expected score 0, got ${scoreB}`);
console.log('✔ TEST 4 PASSED: Công thức tính điểm chuẩn xác (Kills, DMG, Heal, Alive, Death penalty).');

// --- TEST 5: Bảng Xếp Hạng & Chỉ Định MVP ---
console.log('\n--- TEST 5: Sắp xếp Thứ hạng và Vinh danh MVP ---');
engine.blueTeam = [unitA];
engine.redTeam = [unitB];
const lb = engine.getMatchLeaderboard();
if (lb.length !== 2) throw new Error(`Expected 2 units in leaderboard, got ${lb.length}`);
if (lb[0].unit !== unitA || lb[0].rank !== 1 || !lb[0].isMvp) throw new Error('UnitA should be Rank 1 and MVP');
if (lb[1].unit !== unitB || lb[1].rank !== 2 || lb[1].isMvp) throw new Error('UnitB should be Rank 2 and not MVP');
console.log(`✔ TEST 5 PASSED: Thứ hạng chính xác: #1 ${lb[0].name} (Score: ${lb[0].score}, MVP) vs #2 ${lb[1].name} (Score: ${lb[1].score}).`);

// --- TEST 6: Thống Kê Tổng Hợp Đội (Team Stats) ---
console.log('\n--- TEST 6: Thống kê tổng hợp Đội (getTeamStats) ---');
const teamStats = engine.getTeamStats();
if (teamStats.blue.score !== 254 || teamStats.blue.kills !== 1 || teamStats.blue.damageDealt !== 100) {
    throw new Error('Blue team stats mismatch');
}
if (teamStats.red.score !== 0 || teamStats.red.kills !== 0 || teamStats.red.damageDealt !== 0) {
    throw new Error('Red team stats mismatch');
}
console.log('✔ TEST 6 PASSED: Tổng hợp chỉ số Đội Xanh vs Đội Đỏ chính xác.');

// --- TEST 7: Phím Tắt TAB & Đóng Mở Bảng Xếp Hạng Trực Tiếp ---
console.log('\n--- TEST 7: Phím tắt TAB và Thao tác đóng mở In-Match Leaderboard ---');
engine.phase = 'PLANNING';
engine.isLeaderboardOpen = false;

// Nhấn Tab để mở
window.dispatchKey('Tab');
if (!engine.isLeaderboardOpen) throw new Error('Pressing Tab should open in-match leaderboard');
if (domElements['inMatchLeaderboardModal'].style.display !== 'flex') {
    throw new Error('inMatchLeaderboardModal should have display: flex');
}

// Nhấn Escape để đóng
window.dispatchKey('Escape');
if (engine.isLeaderboardOpen) throw new Error('Pressing Escape should close leaderboard');
if (domElements['inMatchLeaderboardModal'].style.display !== 'none') {
    throw new Error('inMatchLeaderboardModal should have display: none');
}

// Nhấn Tab lần nữa để bật lại
window.dispatchKey('Tab');
if (!engine.isLeaderboardOpen) throw new Error('Pressing Tab should re-open leaderboard');

// Nhấn Tab lần thứ hai để tắt
window.dispatchKey('Tab');
if (engine.isLeaderboardOpen) throw new Error('Pressing Tab second time should toggle leaderboard off');
console.log('✔ TEST 7 PASSED: Phím tắt [Tab] toggle mở/đóng và [Escape] đóng hoạt động hoàn hảo.');

// --- TEST 8: Lưu Trữ Lịch Sử Ván Đấu & Kỷ Lục (Hall of Fame) ---
console.log('\n--- TEST 8: Lưu trữ lịch sử ván đấu & Thống kê Kỷ lục (Hall of Fame) ---');
localStorage.clear();
engine.player = unitA;
engine.turn = 4;
engine.gameMode = 'DUEL';

const savedRecord = engine.saveMatchRecord();
if (!savedRecord || savedRecord.score !== 254 || savedRecord.kills !== 1) {
    throw new Error('Saved match record invalid');
}

const history = engine.getMatchHistory();
if (history.length !== 1 || history[0].score !== 254) {
    throw new Error('History retrieval failed');
}

const hofStats = engine.getHallOfFameStats();
if (hofStats.totalMatches !== 1) throw new Error(`Expected 1 total match, got ${hofStats.totalMatches}`);
if (hofStats.highestScore !== 254) throw new Error(`Expected highestScore 254, got ${hofStats.highestScore}`);
if (hofStats.mostKills !== 1) throw new Error(`Expected mostKills 1, got ${hofStats.mostKills}`);
if (hofStats.mostDamage !== 100) throw new Error(`Expected mostDamage 100, got ${hofStats.mostDamage}`);
if (hofStats.winRate !== 100) throw new Error(`Expected winRate 100%, got ${hofStats.winRate}`);

// Xóa lịch sử
engine.clearHallOfFameHistory();
const emptyHistory = engine.getMatchHistory();
if (emptyHistory.length !== 0) throw new Error('History should be empty after clear');
console.log('✔ TEST 8 PASSED: Lưu trữ lịch sử đấu, kỷ lục cá nhân và xóa lịch sử hoạt động hoàn hảo.');

// --- TEST 9: Kiểm tra Đa Ngôn Ngữ (i18n) cho Bảng Xếp Hạng ---
console.log('\n--- TEST 9: Kiểm tra Từ điển Đa Ngôn Ngữ (i18n) Leaderboard ---');
setLanguage('vi');
if (!t('btnHeaderLeaderboard').includes('Bảng Xếp Hạng')) throw new Error('Missing Vietnamese btnHeaderLeaderboard');
if (!t('lbMvpTitle').includes('MVP')) throw new Error('Missing Vietnamese lbMvpTitle');
if (!t('hofTitle').includes('KỶ LỤC')) throw new Error('Missing Vietnamese hofTitle');

setLanguage('en');
if (!t('btnHeaderLeaderboard').includes('Leaderboard')) throw new Error('Missing English btnHeaderLeaderboard');
if (!t('lbMvpTitle').includes('MVP')) throw new Error('Missing English lbMvpTitle');
if (!t('hofTitle').includes('HALL OF FAME')) throw new Error('Missing English hofTitle');
console.log('✔ TEST 9 PASSED: Toàn bộ từ khóa Bảng xếp hạng hỗ trợ song ngữ Tiếng Việt & English 100%.');

console.log('\n====================================================');
console.log('🎉 TẤT CẢ 9/9 BÀI KIỂM THỬ LEADERBOARD ĐÃ VƯỢT QUA 100%!');
console.log('====================================================');
