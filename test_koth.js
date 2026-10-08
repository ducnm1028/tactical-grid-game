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

function runKothTests() {
    console.log('=== KIỂM THỬ CHẾ ĐỘ KING OF THE HILL 5x5 & HỒI SINH 2 LƯỢT ===\n');

    const engine = new GameEngine();

    // TEST 1: Phân định chế độ chơi (1v1 là DUEL, >=2v2 là KOTH)
    console.log('[TEST 1] Phân định chế độ chơi:');
    engine.applyTeamPreset('1v1');
    if (engine.gameMode !== 'DUEL') throw new Error(`1v1 phải là DUEL, thực tế: ${engine.gameMode}`);
    console.log(`✓ 1v1 kích hoạt chế độ DUEL (Sinh tử truyền thống, không hồi sinh, không chiếm cứ điểm)`);

    engine.applyTeamPreset('2v2');
    if (engine.gameMode !== 'KOTH') throw new Error(`2v2 phải là KOTH, thực tế: ${engine.gameMode}`);
    console.log(`✓ 2v2 kích hoạt chế độ KOTH (King of the Hill)`);

    engine.applyTeamPreset('5v5');
    if (engine.gameMode !== 'KOTH') throw new Error(`5v5 phải là KOTH, thực tế: ${engine.gameMode}`);
    console.log(`✓ 5v5 kích hoạt chế độ KOTH (King of the Hill)`);

    // TEST 2: Kiểm tra vị trí và phạm vi Cứ Điểm 5x5
    console.log('\n[TEST 2] Phạm vi Cứ Điểm 5x5 [cols 8..12, rows 1..5]:');
    const kz = engine.kothZone;
    if (kz.minX !== 8 || kz.maxX !== 12 || kz.minY !== 1 || kz.maxY !== 5) {
        throw new Error(`Khu vực cứ điểm không đúng 5x5 tâm bản đồ: ${JSON.stringify(kz)}`);
    }
    if (!engine.isInCaptureZone(8, 1) || !engine.isInCaptureZone(12, 5) || !engine.isInCaptureZone(10, 3)) {
        throw new Error('isInCaptureZone sai lệch cho các ô biên và tâm của cứ điểm!');
    }
    if (engine.isInCaptureZone(7, 3) || engine.isInCaptureZone(13, 3) || engine.isInCaptureZone(10, 0) || engine.isInCaptureZone(10, 6)) {
        throw new Error('isInCaptureZone sai lệch cho các ô ngoài cứ điểm!');
    }
    console.log('✓ Cứ Điểm 5x5 định vị chính xác ở tâm bản đồ (cols 8..12, rows 1..5)');

    // TEST 3: Cơ chế tích lũy trạng thái Cứ Điểm (Hill Scale) và Tranh chấp
    console.log('\n[TEST 3] Cơ chế tích lũy trạng thái Cứ Điểm & Tranh chấp:');
    engine.applyTeamPreset('2v2');
    engine.startBattle();
    if (engine.hillScale !== 0) throw new Error('Trạng thái cứ điểm ban đầu phải là 0 (Trung lập)!');

    // Đặt Blue trong vùng, Red ngoài vùng
    engine.blueTeam[0].x = 10; engine.blueTeam[0].y = 3; engine.blueTeam[0].hp = 100;
    engine.blueTeam[1].x = 2;  engine.blueTeam[1].y = 1; engine.blueTeam[1].hp = 100;
    engine.redTeam[0].x = 17; engine.redTeam[0].y = 3; engine.redTeam[0].hp = 100;
    engine.redTeam[1].x = 17; engine.redTeam[1].y = 1; engine.redTeam[1].hp = 100;

    // Lượt 1: Blue không tranh chấp -> status +1
    engine.finishTurn();
    if (engine.hillScale !== 1) throw new Error(`Lượt 1: hillScale phải là 1, thực tế: ${engine.hillScale}`);
    console.log(`✓ Lượt 1: Đội Xanh đơn độc trong cứ điểm -> Trạng thái tăng lên +1 (Chiếm 1/2)`);

    // Lượt 2: Blue tiếp tục chiếm -> status +2 (Chiếm cứ điểm thành công, bắt đầu ghi điểm)
    engine.finishTurn();
    if (engine.hillScale !== 2) throw new Error(`Lượt 2: hillScale phải là 2, thực tế: ${engine.hillScale}`);
    if (engine.blueScore !== 1) throw new Error(`Lượt 2: Blue phải ghi được 1 điểm khi status = 2, thực tế: ${engine.blueScore}`);
    console.log(`✓ Lượt 2: Đội Xanh tiếp tục giữ cứ điểm -> Trạng thái đạt +2 (Đã chiếm) & ghi +1 Điểm (Tổng: ${engine.blueScore})`);

    // Lượt 3: Red tiến vào cứ điểm -> Tranh chấp! (Cả 2 đội đều có người)
    engine.redTeam[0].x = 11; engine.redTeam[0].y = 3; // Red vào zone
    const prevScale = engine.hillScale;
    const prevScore = engine.blueScore;
    engine.finishTurn();
    if (engine.hillScale !== prevScale) throw new Error(`Tranh chấp mà hillScale bị đổi: ${engine.hillScale}`);
    console.log(`✓ Lượt 3: Đội Đỏ tiến vào tranh chấp -> Trạng thái bị khóa (freeze ở ${engine.hillScale}/2)`);

    // TEST 4: Cơ chế hồi sinh sau 2 lượt khi chết (Áp dụng cho mọi nhân vật trong KOTH)
    console.log('\n[TEST 4] Cơ chế Hồi sinh sau 2 lượt:');
    engine.applyTeamPreset('2v2');
    engine.startBattle();

    // Giết 1 nhân vật Đội Đỏ (redTeam[1])
    const victim = engine.redTeam[1];
    engine.applyDamage(victim, 200);
    if (victim.hp !== 0 || !victim.isDead || victim.respawnTurns !== 2) {
        throw new Error(`Nhân vật chết không được gán isDead=true và respawnTurns=2! Actual: hp=${victim.hp}, isDead=${victim.isDead}, turns=${victim.respawnTurns}`);
    }
    console.log(`✓ Nhân vật ${victim.name} bị hạ gục -> respawnTurns = 2, isDead = true`);

    // Hết Lượt 1: respawnTurns giảm về 1
    engine.finishTurn();
    if (victim.respawnTurns !== 1 || victim.hp !== 0) {
        throw new Error(`Sau 1 lượt respawnTurns phải giảm về 1! Actual: ${victim.respawnTurns}`);
    }
    console.log(`✓ Sau 1 lượt: respawnTurns còn 1`);

    // Hết Lượt 2: Tái sinh đầy máu tại căn cứ
    engine.finishTurn();
    if (victim.respawnTurns !== 0 || victim.hp !== victim.maxHp || victim.isDead) {
        throw new Error(`Sau 2 lượt nhân vật phải hồi sinh với full HP! Actual: hp=${victim.hp}/${victim.maxHp}, isDead=${victim.isDead}`);
    }
    console.log(`✓ Sau 2 lượt: ${victim.name} HỒI SINH thành công với ${victim.hp}/${victim.maxHp} HP tại căn cứ (${victim.x}, ${victim.y})!`);

    // TEST 5: Cơ chế Người chơi hy sinh và chờ hồi sinh
    console.log('\n[TEST 5] Người chơi hy sinh và cơ chế Hàng đợi Chờ Hồi Sinh:');
    engine.applyTeamPreset('2v2');
    engine.startBattle();
    engine.applyDamage(engine.player, 200);
    if (!engine.player.isDead || engine.player.respawnTurns !== 2) {
        throw new Error('Người chơi chết không kích hoạt trạng thái hồi sinh!');
    }

    // Kết thúc lượt để sang PLANNING mới
    engine.finishTurn();
    if (engine.phase !== 'PLANNING') throw new Error('Phase phải là PLANNING!');
    if (engine.playerQueue.length !== 4) throw new Error('Hàng đợi người chơi chết phải được tự động điền 4 lệnh chờ!');
    console.log(`✓ Người chơi hy sinh: Hàng đợi tự động điền 4 lệnh chờ hồi sinh (#${engine.player.respawnTurns}L)`);

    // TEST 6: Điều kiện Thắng (15 Điểm) & Cơ chế Overtime (Bù giờ khi còn đối thủ ở cứ điểm)
    console.log('\n[TEST 6] Điều kiện Chiến thắng 15 Điểm & Cơ chế Overtime:');
    engine.applyTeamPreset('2v2');
    engine.startBattle();

    // Giả lập Đội Xanh đạt 14 điểm và đang giữ cứ điểm (hillScale = 2)
    engine.blueScore = 14;
    engine.hillScale = 2;
    engine.blueTeam[0].x = 10; engine.blueTeam[0].y = 3; engine.blueTeam[0].hp = 100;
    engine.redTeam[0].x = 11;  engine.redTeam[0].y = 3;  engine.redTeam[0].hp = 100; // Địch còn trong cứ điểm!

    // Hết lượt: Blue đạt 15 điểm, nhưng Red vẫn ở trong cứ điểm -> OVERTIME!
    engine.finishTurn();
    if (engine.blueScore !== 15) throw new Error(`BlueScore phải là 15, actual: ${engine.blueScore}`);
    if (engine.phase === 'GAMEOVER') throw new Error('Không được kết thúc game khi còn địch ở cứ điểm! Phải kích hoạt Overtime!');
    if (!engine.inOvertime) throw new Error('inOvertime phải bằng true!');
    console.log(`✓ Đội Xanh đạt 15 điểm nhưng Đội Đỏ vẫn có người tại Cứ Điểm -> Kích hoạt OVERTIME 🔥! Trận đấu tiếp tục!`);

    // Đuổi Đội Đỏ ra khỏi cứ điểm (hoặc tiêu diệt)
    engine.redTeam[0].x = 18; engine.redTeam[0].y = 3; // Ra khỏi zone
    engine.redTeam[1].x = 18; engine.redTeam[1].y = 1;
    engine.finishTurn();

    if (engine.phase !== 'GAMEOVER') throw new Error('Khi Cứ Điểm sạch bóng đối thủ và đạt >= 15 điểm, game phải kết thúc!');
    const victoryTitle = domElements['modalTitle'].innerText;
    if (!victoryTitle || !victoryTitle.includes('CHIẾN THẮNG')) {
        throw new Error(`Modal title phải là chiến thắng! Actual: ${victoryTitle}`);
    }
    console.log(`✓ Cứ Điểm được quét sạch bóng đối thủ -> ĐỘI XANH CHIẾN THẮNG CHÍNH THỨC! [${victoryTitle}]`);

    console.log('\n🎉 TẤT CẢ 6/6 BÀI KIỂM THỬ CHẾ ĐỘ KING OF THE HILL & RESPAWN ĐÃ VƯỢT QUA 100%!');
}

runKothTests();
