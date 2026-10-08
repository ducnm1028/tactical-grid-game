/**
 * CHRONO CLASH: WEGO TACTICS 20x7
 * Simultaneous Turn-Based Action Queue Engine
 * Features: Modular Characters, Path-based Movement, Ranged Weapons, Cooldowns & 3x3 AoE Explosions
 */

// --- Hằng số & Cấu hình ---
const GRID_COLS = 20;
const GRID_ROWS = 7;
const CELL_SIZE = 64; // Kích thước mỗi ô trên Canvas

const DIRECTIONS = {
    UP:         { name: 'UP',         dx:  0, dy: -1, symbol: '↑', label: 'Lên', label_en: 'Up' },
    DOWN:       { name: 'DOWN',       dx:  0, dy:  1, symbol: '↓', label: 'Dưới', label_en: 'Down' },
    LEFT:       { name: 'LEFT',       dx: -1, dy:  0, symbol: '←', label: 'Trái', label_en: 'Left' },
    RIGHT:      { name: 'RIGHT',      dx:  1, dy:  0, symbol: '→', label: 'Phải', label_en: 'Right' },
    UP_LEFT:    { name: 'UP_LEFT',    dx: -1, dy: -1, symbol: '↖', label: 'Lên-Trái', label_en: 'Up-Left' },
    UP_RIGHT:   { name: 'UP_RIGHT',   dx:  1, dy: -1, symbol: '↗', label: 'Lên-Phải', label_en: 'Up-Right' },
    DOWN_LEFT:  { name: 'DOWN_LEFT',  dx: -1, dy:  1, symbol: '↙', label: 'Dưới-Trái', label_en: 'Down-Left' },
    DOWN_RIGHT: { name: 'DOWN_RIGHT', dx:  1, dy:  1, symbol: '↘', label: 'Dưới-Phải', label_en: 'Down-Right' }
};

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');

        this.resizeCanvas();

        this.turn = 1;
        this.lang = (typeof getLanguage === 'function') ? getLanguage() : 'vi';
        this.phase = 'LANG_SELECT'; // 'LANG_SELECT' | 'MAIN_MENU' | 'CHAR_SELECT' | 'HOW_TO_PLAY' | 'PLANNING' | 'RESOLVING' | 'GAMEOVER'
        this.previousPhaseBeforeGuide = 'MAIN_MENU';
        this.currentStep = -1;

        // Nhân vật được chọn mặc định
        this.selectedCharacter = getCharacterById('trooper');

        // Trạng thái vẽ Lộ trình Di chuyển (Path Planning Mode)
        this.isBuildingPath = false;
        this.activePath = []; // [{ dir, dx, dy, symbol, x, y }]
        this.activePathMaxSteps = 2;

        // Hệ thống Hồi chiêu, Đạn dược & Vật thể mặt đất (Ground Hazards / Lựu đạn)
        this.cooldowns = {}; // { [skillId]: turnsLeft }
        this.skillAmmo = {}; // { [skillId]: currentAmmo }
        this.groundHazards = []; // [{ id, type: 'GRENADE', x, y, turnsLeft: 2, power: 50, aoeRadius: 1 }]

        // Trạng thái Lộ diện khi trúng đạn (Hookman Stealth Break)
        this.playerRevealedTurns = 0;
        this.cpuRevealedTurns = 0;

        // Hệ thống Buff & Trạng thái hiệu ứng (Adrenaline, Cigarette, Tether)
        this.playerBuffs = {
            adrenaline: { turnsLeft: 0, healPerTurn: 5, dmgBonusPercent: 20 },
            cigarette: { turnsLeft: 0, dmgBonusPercent: 30, moveBonus: 1 }
        };
        this.activeHookTethers = []; // [{ source, target, turnsUntilPull, pullDist, skillId, cdAfterPull }]

        // Quản lý Chế độ Đội hình & Bổ sung CPU (Tối đa 5 người mỗi đội)
        this.blueTeamSize = 1;
        this.redTeamSize = 1;
        this.currentTeamPreset = '1v1';
        this.gameMode = 'DUEL'; // 'DUEL' (1v1) hoặc 'KOTH' (King of the Hill khi >= 2 người / đội)
        this.kothZone = { minX: 8, maxX: 12, minY: 1, maxY: 5 }; // Khu vực Cứ Điểm 5x5 ở giữa bản đồ 20x7
        this.hillScale = 0; // -2 (Đỏ chiếm), -1 (Đỏ đang chiếm), 0 (Trung lập), +1 (Xanh đang chiếm), +2 (Xanh chiếm)
        this.blueScore = 0;
        this.redScore = 0;
        this.SCORE_LIMIT = 15;
        this.inOvertime = false;
        this.RESPAWN_TURNS = 2;
        this.blueTeam = [];
        this.redTeam = [];

        // Nhân vật Người chơi (Được gán tham chiếu tới blueTeam[0])
        this.player = {
            x: 2,
            y: 3,
            renderX: 2,
            renderY: 3,
            dir: 'RIGHT',
            hp: 100,
            maxHp: 100,
            shieldDir: null,
            state: 'IDLE',
            color: '#10b981',
            name: 'Trooper',
            avatar: '🪖'
        };

        // Nhân vật CPU (Được gán tham chiếu tới redTeam[0])
        this.cpu = {
            x: 17,
            y: 3,
            renderX: 17,
            renderY: 3,
            dir: 'LEFT',
            hp: 100,
            maxHp: 100,
            shieldDir: null,
            state: 'IDLE',
            color: '#ff3366',
            name: 'SENTINEL',
            avatar: '🤖'
        };

        // Camera viewport
        this.cameraX = 0;
        this.targetCameraX = 0;

        // Hàng đợi 4 lệnh
        this.playerQueue = [];
        this.cpuQueue = [];
        this.currentSelectedDir = 'RIGHT';

        // Quản lý Nhân vật CPU
        this.selectedCpuOption = 'random';
        this.cpuCharacter = null;
        this.cpuCooldowns = {};
        this.cpuSkillAmmo = {};
        this.cpuBuffs = {
            adrenaline: { turnsLeft: 0, healPerTurn: 5, dmgBonusPercent: 20 },
            cigarette: { turnsLeft: 0, dmgBonusPercent: 30, moveBonus: 1 }
        };
        this.cpuRevealedTurns = 0;

        // Hiệu ứng hạt & chữ bay
        this.floatingTexts = [];
        this.particles = [];

        this.setupTeams();
        this.initCharacterSelectUI();
        this.initTeamModeUI();
        this.initMenuAndGuideUI();
        this.bindEvents();
        this.applyLanguageToUI();
        this.updateCamera(true);

        // Vòng lặp vẽ liên tục 60 FPS
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.renderLoop(t));
    }

    resizeCanvas() {
        this.canvas.width = 960;
        this.canvas.height = GRID_ROWS * CELL_SIZE; // 7 * 64 = 448
    }

    // --- Màn hình Chọn Nhân vật (Character Selection) ---
    initCharacterSelectUI() {
        const container = document.getElementById('charGridContainer');
        if (!container) return;
        const characters = getAllCharacters();
        const lang = this.lang || 'vi';

        container.innerHTML = characters.map(char => {
            const isUnlocked = char.isUnlocked;
            const isSelected = char.id === this.selectedCharacter.id;
            const cName = getCharName(char, lang);
            const cTitle = getCharTitle(char, lang);
            const cDesc = getCharDesc(char, lang);

            const skillsHtml = char.skills.map(s => `
                <div class="preview-skill-item">
                    <span class="ps-icon">${s.icon}</span>
                    <span class="ps-name">${getSkillName(s, lang)}</span>
                    <span class="ps-key">${s.hotkey || ''}</span>
                </div>
            `).join('');

            return `
                <div class="char-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}" 
                     data-char-id="${char.id}">
                    <div class="char-avatar-box">${char.avatar}</div>
                    <div class="char-name">${cName}</div>
                    <div class="char-title">${cTitle}</div>
                    <div class="char-desc">${cDesc}</div>
                    <div style="font-size:0.75rem; color:#f59e0b; margin-bottom:8px;">
                        ${t('moveBudgetLabel', { budget: char.moveBudget || 3 })}
                    </div>
                    <div class="char-skills-preview">
                        ${skillsHtml}
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.char-card').forEach(card => {
            card.addEventListener('click', () => {
                const charId = card.getAttribute('data-char-id');
                const char = getCharacterById(charId);
                if (char && char.isUnlocked) {
                    this.selectedCharacter = char;
                    container.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    this.updateTeamRosterPreviews();
                    if (window.soundCtrl) window.soundCtrl.playSelect();
                } else {
                    this.addCombatLog(lang === 'en' ? 'This operative slot is pending design!' : 'Ô nhân vật này đang chờ ý tưởng thiết kế từ bạn!', 'system');
                    if (window.soundCtrl) window.soundCtrl.playUndo();
                }
            });
        });

        const cpuOptBtns = document.querySelectorAll('#cpuSelectOptions .cpu-opt-btn');
        cpuOptBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const cpuChar = btn.getAttribute('data-cpuchar');
                this.selectedCpuOption = cpuChar;
                cpuOptBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateTeamRosterPreviews();
                if (window.soundCtrl) window.soundCtrl.playSelect();
            });
        });

        const startBtn = document.getElementById('btnStartBattle');
        if (startBtn) startBtn.onclick = () => this.startBattle();
    }

    // --- Khởi tạo Giao diện Chế độ Đội hình (Tối đa 5 người mỗi đội) ---
    initTeamModeUI() {
        const presets = ['1v1', '2v2', '3v3', '4v4', '5v5'];
        presets.forEach(p => {
            const btn = document.getElementById(`btnPreset${p}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.applyTeamPreset(p);
                    if (window.soundCtrl) window.soundCtrl.playSelect();
                });
            }
        });

        const blueBtns = document.querySelectorAll('#blueTeamSizeSelectors .team-size-btn');
        blueBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sz = parseInt(btn.getAttribute('data-size'), 10) || 1;
                this.setBlueTeamSize(sz);
                if (window.soundCtrl) window.soundCtrl.playSelect();
            });
        });

        const redBtns = document.querySelectorAll('#redTeamSizeSelectors .team-size-btn');
        redBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sz = parseInt(btn.getAttribute('data-size'), 10) || 1;
                this.setRedTeamSize(sz);
                if (window.soundCtrl) window.soundCtrl.playSelect();
            });
        });

        this.updateTeamModeUI();
    }

    applyTeamPreset(preset) {
        this.currentTeamPreset = preset;
        const num = parseInt(preset[0], 10) || 1;
        this.blueTeamSize = num;
        this.redTeamSize = num;
        this.gameMode = (this.blueTeamSize === 1 && this.redTeamSize === 1) ? 'DUEL' : 'KOTH';
        this.setupTeams();
        this.updateTeamModeUI();
    }

    setBlueTeamSize(size) {
        this.blueTeamSize = Math.max(1, Math.min(5, size));
        if (this.blueTeamSize === this.redTeamSize) {
            this.currentTeamPreset = `${this.blueTeamSize}v${this.blueTeamSize}`;
        } else {
            this.currentTeamPreset = 'custom';
        }
        this.gameMode = (this.blueTeamSize === 1 && this.redTeamSize === 1) ? 'DUEL' : 'KOTH';
        this.setupTeams();
        this.updateTeamModeUI();
    }

    setRedTeamSize(size) {
        this.redTeamSize = Math.max(1, Math.min(5, size));
        if (this.blueTeamSize === this.redTeamSize) {
            this.currentTeamPreset = `${this.blueTeamSize}v${this.blueTeamSize}`;
        } else {
            this.currentTeamPreset = 'custom';
        }
        this.gameMode = (this.blueTeamSize === 1 && this.redTeamSize === 1) ? 'DUEL' : 'KOTH';
        this.setupTeams();
        this.updateTeamModeUI();
    }

    updateTeamModeUI() {
        if (typeof document === 'undefined' || !document.getElementById) return;

        this.gameMode = (this.blueTeamSize === 1 && this.redTeamSize === 1) ? 'DUEL' : 'KOTH';

        const presets = ['1v1', '2v2', '3v3', '4v4', '5v5'];
        presets.forEach(p => {
            const btn = document.getElementById(`btnPreset${p}`);
            if (btn) btn.classList.toggle('active', this.currentTeamPreset === p);
        });

        const blueBtns = document.querySelectorAll('#blueTeamSizeSelectors .team-size-btn');
        blueBtns.forEach(btn => {
            const sz = parseInt(btn.getAttribute('data-size'), 10);
            btn.classList.toggle('active', sz === this.blueTeamSize);
        });

        const redBtns = document.querySelectorAll('#redTeamSizeSelectors .team-size-btn');
        redBtns.forEach(btn => {
            const sz = parseInt(btn.getAttribute('data-size'), 10);
            btn.classList.toggle('active', sz === this.redTeamSize);
        });

        const blueCount = document.getElementById('blueTeamCountPill');
        if (blueCount) {
            blueCount.innerText = t('teamCountFormat', { count: this.blueTeamSize });
        }
        const redCount = document.getElementById('redTeamCountPill');
        if (redCount) {
            redCount.innerText = t('teamCountFormat', { count: this.redTeamSize });
        }

        const modeBadge = document.getElementById('modeObjectiveBadge');
        const modeDesc = document.getElementById('modeObjectiveDesc');
        if (modeBadge && modeDesc) {
            if (this.gameMode === 'DUEL') {
                modeBadge.innerText = t('modeDuelName');
                modeDesc.innerText = t('duelObjectiveDesc');
            } else {
                modeBadge.innerText = t('modeKothName');
                modeDesc.innerText = t('kothObjectiveDesc');
            }
        }

        this.updateTeamRosterPreviews();
    }

    updateTeamRosterPreviews() {
        if (typeof document === 'undefined' || !document.getElementById) return;

        const blueList = document.getElementById('blueRosterList');
        const redList = document.getElementById('redRosterList');
        if (!blueList || !redList) return;

        const unlockedChars = CHARACTERS_DATABASE.filter(c => c.isUnlocked);
        const pChar = this.selectedCharacter || getCharacterById('trooper');
        const otherChars = unlockedChars.filter(c => c.id !== pChar.id);
        const allyPool = otherChars.length > 0 ? otherChars : unlockedChars;

        // Blue Team Roster
        let blueHtml = `
            <div class="team-roster-chip is-player" title="${getCharName(pChar, this.lang)} (100 HP)">
                <span>👑 ${pChar.avatar}</span>
                <span>${getCharName(pChar, this.lang)}</span>
                <span style="color: #34d399; font-size: 0.68rem;">[${this.lang === 'en' ? 'YOU' : 'BẠN'}]</span>
            </div>
        `;
        for (let i = 1; i < this.blueTeamSize; i++) {
            const allyChar = allyPool[(i - 1) % allyPool.length];
            blueHtml += `
                <div class="team-roster-chip is-ally" title="${getCharName(allyChar, this.lang)} (${allyChar.maxHp} HP)">
                    <span>🤖 ${allyChar.avatar}</span>
                    <span>${getCharName(allyChar, this.lang)}</span>
                    <span style="color: #38bdf8; font-size: 0.65rem;">+CPU</span>
                </div>
            `;
        }
        blueList.innerHTML = blueHtml;

        // Red Team Roster
        let cLeaderChar = getCharacterById(this.selectedCpuOption);
        if (!cLeaderChar) cLeaderChar = unlockedChars[0];

        let redHtml = `
            <div class="team-roster-chip is-enemy" title="${getCharName(cLeaderChar, this.lang)} (${cLeaderChar.maxHp} HP)">
                <span>🎯 ${cLeaderChar.avatar}</span>
                <span>${getCharName(cLeaderChar, this.lang)}</span>
                <span style="color: #fb7185; font-size: 0.65rem;">${this.lang === 'en' ? 'LEADER' : 'CHỦ LỰC'}</span>
            </div>
        `;
        for (let j = 1; j < this.redTeamSize; j++) {
            const enemyChar = unlockedChars[j % unlockedChars.length];
            redHtml += `
                <div class="team-roster-chip is-enemy" title="${getCharName(enemyChar, this.lang)} (${enemyChar.maxHp} HP)">
                    <span>🤖 ${enemyChar.avatar}</span>
                    <span>${getCharName(enemyChar, this.lang)}</span>
                    <span style="color: #fb7185; font-size: 0.65rem;">CPU ${j + 1}</span>
                </div>
            `;
        }
        redList.innerHTML = redHtml;
    }

    // --- Tọa độ Xuất phát 20x7 cho Đội hình Tối đa 5 người ---
    getTeamSpawnPosition(team, index) {
        const blueSpawns = [
            { x: 2, y: 3 }, // Vị trí trung tâm
            { x: 2, y: 1 }, // Cánh trên
            { x: 2, y: 5 }, // Cánh dưới
            { x: 1, y: 2 }, // Hậu quân trên
            { x: 1, y: 4 }  // Hậu quân dưới
        ];
        const redSpawns = [
            { x: 17, y: 3 }, // Vị trí trung tâm
            { x: 17, y: 1 }, // Cánh trên
            { x: 17, y: 5 }, // Cánh dưới
            { x: 18, y: 2 }, // Hậu quân trên
            { x: 18, y: 4 }  // Hậu quân dưới
        ];
        return team === 'BLUE' ? blueSpawns[index % 5] : redSpawns[index % 5];
    }

    isInCaptureZone(x, y) {
        return x >= this.kothZone.minX && x <= this.kothZone.maxX &&
               y >= this.kothZone.minY && y <= this.kothZone.maxY;
    }

    getRespawnPosition(team, index) {
        const defaultSpawn = this.getTeamSpawnPosition(team, index);
        const allLiving = [...(this.blueTeam || []), ...(this.redTeam || [])].filter(u => u.hp > 0 && !u.isDead);
        if (!allLiving.some(u => u.x === defaultSpawn.x && u.y === defaultSpawn.y)) {
            return defaultSpawn;
        }
        const minCol = team === 'BLUE' ? 0 : 15;
        const maxCol = team === 'BLUE' ? 4 : 19;
        for (let offset = 0; offset <= 4; offset++) {
            for (let r = 0; r < GRID_ROWS; r++) {
                const col = team === 'BLUE' ? minCol + offset : maxCol - offset;
                if (!allLiving.some(u => u.x === col && u.y === r)) {
                    return { x: col, y: r };
                }
            }
        }
        return defaultSpawn;
    }

    createUnit(id, team, index, charObj, isPlayer = false, customName = null) {
        const spawn = this.getTeamSpawnPosition(team, index);
        const unit = {
            id,
            team,
            index,
            isPlayer,
            isCpu: !isPlayer,
            charId: charObj.id,
            character: charObj,
            name: customName || (isPlayer ? getCharName(charObj, this.lang) : `${team === 'BLUE' ? (this.lang === 'en' ? 'Ally' : 'Đồng minh') : (this.lang === 'en' ? 'Enemy' : 'Kẻ địch')} ${getCharName(charObj, this.lang)}`),
            avatar: charObj.avatar,
            color: isPlayer ? charObj.themeColor : (team === 'BLUE' ? '#38bdf8' : '#f43f5e'),
            charThemeColor: charObj.themeColor,
            hp: charObj.maxHp,
            maxHp: charObj.maxHp,
            x: spawn.x,
            y: spawn.y,
            renderX: spawn.x,
            renderY: spawn.y,
            dir: team === 'BLUE' ? 'RIGHT' : 'LEFT',
            shieldDir: null,
            state: 'IDLE',
            moveBudget: charObj.moveBudget || 2,
            stealthRadius: charObj.stealthRadius || 0,
            revealedTurns: 0,
            cooldowns: {},
            skillAmmo: {},
            buffs: {
                adrenaline: { turnsLeft: 0, healPerTurn: 5, dmgBonusPercent: 20 },
                cigarette: { turnsLeft: 0, dmgBonusPercent: 30, moveBonus: 1 }
            },
            queue: [],
            alive: true,
            isDead: false,
            respawnTurns: 0
        };
        charObj.skills.forEach(s => {
            if (s.maxAmmo) unit.skillAmmo[s.id] = s.maxAmmo;
        });
        return unit;
    }

    setupTeams() {
        const unlockedChars = CHARACTERS_DATABASE.filter(c => c.isUnlocked);
        const blueSize = Math.max(1, Math.min(5, this.blueTeamSize || 1));
        const redSize = Math.max(1, Math.min(5, this.redTeamSize || 1));
        this.gameMode = (blueSize === 1 && redSize === 1) ? 'DUEL' : 'KOTH';

        // 1. Blue Team
        this.blueTeam = [];
        const pChar = this.selectedCharacter || getCharacterById('trooper');
        const pUnit = this.createUnit('blue_0', 'BLUE', 0, pChar, true, getCharName(pChar, this.lang));
        this.blueTeam.push(pUnit);

        const otherChars = unlockedChars.filter(c => c.id !== pChar.id);
        const allyPool = otherChars.length > 0 ? otherChars : unlockedChars;
        for (let i = 1; i < blueSize; i++) {
            const allyChar = allyPool[(i - 1) % allyPool.length];
            const allyUnit = this.createUnit(`blue_${i}`, 'BLUE', i, allyChar, false);
            this.blueTeam.push(allyUnit);
        }

        // 2. Red Team
        this.redTeam = [];
        let cLeaderChar = this.cpuCharacter;
        if (!cLeaderChar) {
            if (this.selectedCpuOption && this.selectedCpuOption !== 'random') {
                cLeaderChar = getCharacterById(this.selectedCpuOption);
            }
            if (!cLeaderChar) cLeaderChar = unlockedChars[0];
            this.cpuCharacter = cLeaderChar;
        }

        const cLeaderUnit = this.createUnit('red_0', 'RED', 0, cLeaderChar, false, `${this.lang === 'en' ? 'Sentinel' : 'Thủ lĩnh'} [${getCharName(cLeaderChar, this.lang)}]`);
        this.redTeam.push(cLeaderUnit);

        for (let j = 1; j < redSize; j++) {
            const enemyChar = unlockedChars[j % unlockedChars.length];
            const enemyUnit = this.createUnit(`red_${j}`, 'RED', j, enemyChar, false);
            this.redTeam.push(enemyUnit);
        }

        // Đồng bộ các tham chiếu tương thích ngược (Backward compatibility)
        this.player = this.blueTeam[0];
        this.cpu = this.redTeam[0];
        this.cooldowns = this.player.cooldowns;
        this.skillAmmo = this.player.skillAmmo;
        this.playerBuffs = this.player.buffs;
        this.cpuCooldowns = this.cpu.cooldowns;
        this.cpuSkillAmmo = this.cpu.skillAmmo;
        this.cpuBuffs = this.cpu.buffs;
        this.playerRevealedTurns = this.player.revealedTurns;
        this.cpuRevealedTurns = this.cpu.revealedTurns;
        this.activePathMaxSteps = this.player.moveBudget;
    }

    // --- Khởi tạo Giao diện Màn hình Chính, Hướng dẫn & Ngôn ngữ ---
    initMenuAndGuideUI() {
        const btnVi = document.getElementById('btnSelectLangVi');
        if (btnVi) {
            btnVi.addEventListener('click', () => this.selectLanguage('vi'));
        }

        const btnEn = document.getElementById('btnSelectLangEn');
        if (btnEn) {
            btnEn.addEventListener('click', () => this.selectLanguage('en'));
        }

        const btnHeaderLang = document.getElementById('btnHeaderLang');
        if (btnHeaderLang) {
            btnHeaderLang.addEventListener('click', () => this.toggleLanguage());
        }

        const btnPlay = document.getElementById('btnMenuPlay');
        if (btnPlay) {
            btnPlay.addEventListener('click', () => this.showCharSelectScreen());
        }

        const btnGuide = document.getElementById('btnMenuGuide');
        if (btnGuide) {
            btnGuide.addEventListener('click', () => this.showHowToPlayScreen());
        }

        const btnCloseGuideX = document.getElementById('btnCloseGuideX');
        if (btnCloseGuideX) {
            btnCloseGuideX.addEventListener('click', () => this.closeHowToPlayScreen());
        }

        const btnGuideBack = document.getElementById('btnGuideBack');
        if (btnGuideBack) {
            btnGuideBack.addEventListener('click', () => this.closeHowToPlayScreen());
        }

        const btnGuidePlay = document.getElementById('btnGuidePlay');
        if (btnGuidePlay) {
            btnGuidePlay.addEventListener('click', () => this.showCharSelectScreen());
        }

        const btnCharSelectBack = document.getElementById('btnCharSelectBack');
        if (btnCharSelectBack) {
            btnCharSelectBack.addEventListener('click', () => this.showMainMenuScreen());
        }

        const btnHeaderMenu = document.getElementById('btnHeaderMenu');
        if (btnHeaderMenu) {
            btnHeaderMenu.addEventListener('click', () => this.showMainMenuScreen());
        }

        const btnHeaderGuide = document.getElementById('btnHeaderGuide');
        if (btnHeaderGuide) {
            btnHeaderGuide.addEventListener('click', () => this.showHowToPlayScreen());
        }
    }

    showLanguageSelectScreen() {
        this.cancelPathPlanning();
        this.phase = 'LANG_SELECT';
        const langScreen = document.getElementById('languageSelectScreen');
        const menu = document.getElementById('mainMenuScreen');
        const charSel = document.getElementById('charSelectScreen');
        const guide = document.getElementById('howToPlayScreen');
        if (langScreen) langScreen.style.display = 'flex';
        if (menu) menu.style.display = 'none';
        if (charSel) charSel.style.display = 'none';
        if (guide) guide.style.display = 'none';
        if (window.soundCtrl) window.soundCtrl.playSelect();
    }

    selectLanguage(lang) {
        if (typeof setLanguage === 'function') {
            setLanguage(lang);
        }
        this.lang = lang;
        const langScreen = document.getElementById('languageSelectScreen');
        if (langScreen) langScreen.style.display = 'none';
        this.applyLanguageToUI();
        if (window.soundCtrl) window.soundCtrl.playSelect();
        this.showMainMenuScreen();
    }

    toggleLanguage() {
        const nextLang = (this.lang === 'vi') ? 'en' : 'vi';
        if (typeof setLanguage === 'function') {
            setLanguage(nextLang);
        }
        this.lang = nextLang;
        this.applyLanguageToUI();
        if (window.soundCtrl) window.soundCtrl.playSelect();
    }

    showMainMenuScreen() {
        this.cancelPathPlanning();
        this.phase = 'MAIN_MENU';
        const langScreen = document.getElementById('languageSelectScreen');
        const menu = document.getElementById('mainMenuScreen');
        const charSel = document.getElementById('charSelectScreen');
        const guide = document.getElementById('howToPlayScreen');
        if (langScreen) langScreen.style.display = 'none';
        if (menu) menu.style.display = 'flex';
        if (charSel) charSel.style.display = 'none';
        if (guide) guide.style.display = 'none';
        if (window.soundCtrl) window.soundCtrl.playSelect();
    }

    showCharSelectScreen() {
        this.cancelPathPlanning();
        this.phase = 'CHAR_SELECT';
        const langScreen = document.getElementById('languageSelectScreen');
        const menu = document.getElementById('mainMenuScreen');
        const charSel = document.getElementById('charSelectScreen');
        const guide = document.getElementById('howToPlayScreen');
        if (langScreen) langScreen.style.display = 'none';
        if (menu) menu.style.display = 'none';
        if (charSel) charSel.style.display = 'flex';
        if (guide) guide.style.display = 'none';
        if (window.soundCtrl) window.soundCtrl.playSelect();
    }

    showHowToPlayScreen() {
        this.cancelPathPlanning();
        if (this.phase !== 'HOW_TO_PLAY') {
            this.previousPhaseBeforeGuide = this.phase;
        }
        this.phase = 'HOW_TO_PLAY';
        const langScreen = document.getElementById('languageSelectScreen');
        const menu = document.getElementById('mainMenuScreen');
        const charSel = document.getElementById('charSelectScreen');
        const guide = document.getElementById('howToPlayScreen');
        if (langScreen) langScreen.style.display = 'none';
        if (menu) menu.style.display = 'none';
        if (charSel) charSel.style.display = 'none';
        if (guide) guide.style.display = 'flex';
        this.renderHowToPlayUI();
        if (window.soundCtrl) window.soundCtrl.playSelect();
    }

    closeHowToPlayScreen() {
        if (this.previousPhaseBeforeGuide === 'CHAR_SELECT') {
            this.showCharSelectScreen();
        } else if (this.previousPhaseBeforeGuide === 'PLANNING') {
            const guide = document.getElementById('howToPlayScreen');
            if (guide) guide.style.display = 'none';
            this.phase = 'PLANNING';
            if (window.soundCtrl) window.soundCtrl.playSelect();
        } else {
            this.showMainMenuScreen();
        }
    }

    startBattle() {
        const langScreen = document.getElementById('languageSelectScreen');
        const menu = document.getElementById('mainMenuScreen');
        const charSel = document.getElementById('charSelectScreen');
        const guide = document.getElementById('howToPlayScreen');
        if (langScreen) langScreen.style.display = 'none';
        if (menu) menu.style.display = 'none';
        if (charSel) charSel.style.display = 'none';
        if (guide) guide.style.display = 'none';
        this.applySelectedCharacter();
        this.applyCpuCharacter(this.selectedCpuOption);
        this.setupTeams();
        this.turn = 1;
        this.hillScale = 0;
        this.blueScore = 0;
        this.redScore = 0;
        this.inOvertime = false;
        this.phase = 'PLANNING';
        if (window.soundCtrl) window.soundCtrl.playCommit();
        const pName = getCharName(this.selectedCharacter, this.lang);
        const cName = getCharName(this.cpuCharacter, this.lang);
        if (this.gameMode === 'KOTH') {
            this.addCombatLog(this.lang === 'en'
                ? `👑 King of the Hill started! Squads: Blue (${this.blueTeamSize}) vs Red (${this.redTeamSize}). Hold the 5x5 Hill to reach 15 points!`
                : `👑 Chế độ Chiếm Cứ Điểm 5x5 bắt đầu! Đội hình: Xanh (${this.blueTeamSize}) vs Đỏ (${this.redTeamSize}). Chiếm giữ Cứ điểm để đạt 15 điểm!`, 'system');
        } else {
            this.addCombatLog(this.lang === 'en'
                ? `⚔️ 1v1 Classic Duel started! Eliminate your opponent to win!`
                : `⚔️ Đấu tay đôi 1v1 sinh tử bắt đầu! Tiêu diệt đối thủ để chiến thắng!`, 'system');
        }
        this.updateHUD();
        this.updateQueueDisplay();
    }

    applyLanguageToUI() {
        if (typeof document === 'undefined' || !document.querySelector) return;
        const lang = this.lang || 'vi';
        document.title = t('appTitle');

        // Header
        const subElem = document.querySelector('.title-container .subtitle');
        if (subElem) subElem.innerText = t('headerSubtitle');

        const btnLang = document.getElementById('btnHeaderLang');
        if (btnLang) btnLang.innerText = lang === 'vi' ? '🌐 English' : '🌐 Tiếng Việt';

        const btnMenu = document.getElementById('btnHeaderMenu');
        if (btnMenu) btnMenu.innerText = t('btnHeaderMenu');

        const btnGuide = document.getElementById('btnHeaderGuide');
        if (btnGuide) btnGuide.innerText = t('btnHeaderGuide');

        const btnChar = document.getElementById('btnOpenCharSelect');
        if (btnChar) btnChar.innerText = t('btnOpenCharSelect');

        const soundBtn = document.getElementById('soundToggleBtn');
        if (soundBtn) {
            soundBtn.innerText = (window.soundCtrl && window.soundCtrl.enabled) ? t('soundOn') : t('soundOff');
        }

        // Main Menu
        const menuBadge = document.querySelector('.menu-badge');
        if (menuBadge) menuBadge.innerText = t('menuBadge');

        const menuTitle = document.querySelector('.menu-title');
        if (menuTitle) menuTitle.innerText = t('menuTitle');

        const menuTag = document.querySelector('.menu-tagline');
        if (menuTag) menuTag.innerText = t('menuTagline');

        const menuDesc = document.querySelector('.menu-description');
        if (menuDesc) menuDesc.innerText = t('menuDescription');

        const playMain = document.querySelector('#btnMenuPlay .btn-main-text');
        if (playMain) playMain.innerText = t('btnMenuPlay');
        const playSub = document.querySelector('#btnMenuPlay .btn-sub-text');
        if (playSub) playSub.innerText = t('btnMenuPlaySub');

        const guideMain = document.querySelector('#btnMenuGuide .btn-main-text');
        if (guideMain) guideMain.innerText = t('btnMenuGuide');
        const guideSub = document.querySelector('#btnMenuGuide .btn-sub-text');
        if (guideSub) guideSub.innerText = t('btnMenuGuideSub');

        const pills = document.querySelectorAll('.menu-feature-pills .pill');
        if (pills && pills.length >= 4) {
            pills[0].innerText = t('pillWego');
            pills[1].innerText = t('pillChars');
            pills[2].innerText = t('pillRoute');
            pills[3].innerText = t('pillCpu');
        }

        const menuHint = document.querySelector('.menu-footer-hint');
        if (menuHint) {
            menuHint.innerHTML = lang === 'en'
                ? `Press <kbd class="kbd-hint">SPACE</kbd> or <kbd class="kbd-hint">ENTER</kbd> to Play • Press <kbd class="kbd-hint">H</kbd> for Guide`
                : `Nhấn <kbd class="kbd-hint">SPACE</kbd> hoặc <kbd class="kbd-hint">ENTER</kbd> để vào Chơi • Nhấn <kbd class="kbd-hint">H</kbd> để xem Hướng dẫn`;
        }

        // Character Select Screen
        const csTitle = document.querySelector('.char-select-header h2');
        if (csTitle) csTitle.innerText = t('charSelectHeaderTitle');
        const csSub = document.querySelector('.char-select-header p');
        if (csSub) csSub.innerText = t('charSelectHeaderSub');

        const cpuLabel = document.querySelector('.cpu-select-label');
        if (cpuLabel) cpuLabel.innerText = t('cpuSelectLabel');

        const randomBtn = document.querySelector('#cpuSelectOptions [data-cpuchar="random"]');
        if (randomBtn) randomBtn.innerText = t('cpuOptRandom');

        const csBack = document.getElementById('btnCharSelectBack');
        if (csBack) csBack.innerText = t('btnCharSelectBack');

        const csStart = document.getElementById('btnStartBattle');
        if (csStart) csStart.innerText = t('btnStartBattle');

        // Team Battle Mode Section
        const tSecTitle = document.getElementById('teamModeSectionTitle');
        if (tSecTitle) tSecTitle.innerText = t('teamModeTitle');
        const tSecSub = document.getElementById('teamModeSectionSub');
        if (tSecSub) tSecSub.innerText = t('teamModeSub');

        const tBlueTitle = document.getElementById('teamBlueBoxTitle');
        if (tBlueTitle) tBlueTitle.innerText = t('labelTeamBlue');
        const tRedTitle = document.getElementById('teamRedBoxTitle');
        if (tRedTitle) tRedTitle.innerText = t('labelTeamRed');

        const p1 = document.getElementById('btnPreset1v1'); if (p1) p1.innerText = t('preset1v1');
        const p2 = document.getElementById('btnPreset2v2'); if (p2) p2.innerText = t('preset2v2');
        const p3 = document.getElementById('btnPreset3v3'); if (p3) p3.innerText = t('preset3v3');
        const p4 = document.getElementById('btnPreset4v4'); if (p4) p4.innerText = t('preset4v4');
        const p5 = document.getElementById('btnPreset5v5'); if (p5) p5.innerText = t('preset5v5');

        const bBtns = document.querySelectorAll('#blueTeamSizeSelectors .team-size-btn');
        bBtns.forEach(b => {
            const sz = parseInt(b.getAttribute('data-size'), 10);
            if (sz === 1) b.innerText = t('sizeBtnSolo');
            else b.innerText = t('sizeBtnPlusCpu', { size: sz, cpu: sz - 1 });
        });
        const rBtns = document.querySelectorAll('#redTeamSizeSelectors .team-size-btn');
        rBtns.forEach(b => {
            const sz = parseInt(b.getAttribute('data-size'), 10);
            b.innerText = t('sizeBtnCpuOnly', { size: sz });
        });

        this.updateTeamModeUI();

        // Minimap
        const mmTitle = document.querySelector('.minimap-title');
        if (mmTitle) mmTitle.innerText = t('minimapTitle');

        // Queues & Logs
        const pQTitle = document.querySelector('.queue-row:first-child .queue-label span:first-child');
        if (pQTitle) pQTitle.innerText = t('playerQueueTitle');

        const cQTitle = document.querySelector('.queue-row:last-child .queue-label span:first-child');
        if (cQTitle) cQTitle.innerText = t('cpuQueueTitle');

        const cQSecret = document.querySelector('.queue-row:last-child .queue-label span:last-child');
        if (cQSecret) cQSecret.innerText = t('secretTag');

        const logTitle = document.querySelector('.log-title');
        if (logTitle) logTitle.innerText = t('combatLogTitle');

        // Hotkey bar labels
        const actLabel = document.querySelector('#actionButtonsGroup .hotkey-group-label');
        if (actLabel) actLabel.innerText = t('actionGroupLabel');

        const dirLabel = document.querySelector('#directionButtonsGroup .hotkey-group-label');
        if (dirLabel) dirLabel.innerText = t('directionGroupLabel');

        const btnUndo = document.getElementById('btnUndo');
        if (btnUndo) btnUndo.innerHTML = t('btnUndo');

        const btnClear = document.getElementById('btnClear');
        if (btnClear) btnClear.innerHTML = t('btnClear');

        const finishPathBtn = document.getElementById('btnFinishPath');
        if (finishPathBtn) finishPathBtn.innerText = t('btnFinishPath');

        // Re-render dynamic elements
        this.initCharacterSelectUI();
        this.renderHowToPlayUI();
        this.updateHUD();
        this.updateQueueDisplay();
        this.updateSkillButtons();
    }

    renderHowToPlayUI() {
        const guideModal = document.querySelector('#howToPlayScreen .guide-modal-container');
        if (!guideModal) return;

        const lang = this.lang || 'vi';
        const chars = getAllCharacters().filter(c => c.isUnlocked);

        const charCardsHtml = chars.map(c => {
            const cName = getCharName(c, lang);
            const cSub = `${getCharTitle(c, lang)} • ${c.maxHp} HP`;
            const skillsList = c.skills.map(s => {
                const sName = getSkillName(s, lang);
                const sDesc = getSkillDesc(s, lang);
                return `<li><b>${s.icon} ${sName}:</b> ${sDesc}</li>`;
            }).join('');

            return `
                <div class="cg-card">
                    <div class="cg-header">
                        <span class="cg-avatar">${c.avatar}</span>
                        <div>
                            <h4 class="cg-name" style="color: ${c.themeColor};">${cName.toUpperCase()}</h4>
                            <div class="cg-sub">${cSub}</div>
                        </div>
                    </div>
                    <ul class="cg-skills">
                        ${skillsList}
                    </ul>
                </div>
            `;
        }).join('');

        guideModal.innerHTML = `
            <div class="guide-header">
                <div class="guide-header-text">
                    <h2>${t('guideMainTitle')}</h2>
                    <p>${t('guideMainSub')}</p>
                </div>
                <button id="btnCloseGuideX" class="guide-close-btn" title="Close">✕</button>
            </div>

            <div class="guide-scroll-body">
                <!-- Section 1 -->
                <div class="guide-section-card">
                    <div class="section-card-title">
                        <span class="sec-icon">⚡</span>
                        <span>${t('guideSec1Title')}</span>
                    </div>
                    <div class="section-card-body">
                        <p>${t('guideSec1Desc')}</p>
                        <div class="guide-steps-grid">
                            <div class="g-step-box">
                                <span class="g-step-badge">${lang === 'en' ? 'Phase 1' : 'Pha 1'}</span>
                                <b>${t('guideSec1Phase1Title')}</b>
                                <span>${t('guideSec1Phase1Desc')}</span>
                            </div>
                            <div class="g-step-box">
                                <span class="g-step-badge">${lang === 'en' ? 'Phase 2' : 'Pha 2'}</span>
                                <b>${t('guideSec1Phase2Title')}</b>
                                <span>${t('guideSec1Phase2Desc')}</span>
                            </div>
                            <div class="g-step-box">
                                <span class="g-step-badge">${lang === 'en' ? 'Phase 3' : 'Pha 3'}</span>
                                <b>${t('guideSec1Phase3Title')}</b>
                                <span>${t('guideSec1Phase3Desc')}</span>
                            </div>
                        </div>
                        <div class="guide-callout tip">
                            ${t('guideSec1Tip')}
                        </div>
                    </div>
                </div>

                <!-- Section 2 -->
                <div class="guide-section-card">
                    <div class="section-card-title">
                        <span class="sec-icon">👟</span>
                        <span>${t('guideSec2Title')}</span>
                    </div>
                    <div class="section-card-body">
                        <p>${t('guideSec2Desc')}</p>
                        <ul class="guide-list">
                            <li>${t('guideSec2Li1')}</li>
                            <li>${t('guideSec2Li2')}</li>
                            <li>${t('guideSec2Li3')}</li>
                            <li>${t('guideSec2Li4')}</li>
                        </ul>
                    </div>
                </div>

                <!-- Section 3 -->
                <div class="guide-section-card">
                    <div class="section-card-title">
                        <span class="sec-icon">⌨️</span>
                        <span>${t('guideSec3Title')}</span>
                    </div>
                    <div class="section-card-body">
                        <div class="hotkey-table-grid">
                            <div class="hk-row"><span class="hk-key">[1]</span><span class="hk-desc">${t('hk1Desc')}</span></div>
                            <div class="hk-row"><span class="hk-key">[2]</span><span class="hk-desc">${t('hk2Desc')}</span></div>
                            <div class="hk-row"><span class="hk-key">[3]</span><span class="hk-desc">${t('hk3Desc')}</span></div>
                            <div class="hk-row"><span class="hk-key">[4]</span><span class="hk-desc">${t('hk4Desc')}</span></div>
                            <div class="hk-row"><span class="hk-key">WASD / QEZC</span><span class="hk-desc">${t('hkDirDesc')}</span></div>
                            <div class="hk-row"><span class="hk-key">[Space]</span><span class="hk-desc">${t('hkSpaceDesc')}</span></div>
                            <div class="hk-row"><span class="hk-key">[⌫ Backspace]</span><span class="hk-desc">${t('hkBackDesc')}</span></div>
                            <div class="hk-row"><span class="hk-key">[Esc]</span><span class="hk-desc">${t('hkEscDesc')}</span></div>
                        </div>
                    </div>
                </div>

                <!-- Section 4 -->
                <div class="guide-section-card">
                    <div class="section-card-title">
                        <span class="sec-icon">👥</span>
                        <span>${t('guideSec4Title')}</span>
                    </div>
                    <div class="section-card-body">
                        <div class="char-guide-cards">
                            ${charCardsHtml}
                        </div>
                    </div>
                </div>

                <!-- Section 5 -->
                <div class="guide-section-card">
                    <div class="section-card-title">
                        <span class="sec-icon">🛡️</span>
                        <span>${t('guideSec5Title')}</span>
                    </div>
                    <div class="section-card-body">
                        <div class="strategy-tips-grid">
                            <div class="tip-card">
                                <b>${t('tip1Title')}</b>
                                <span>${t('tip1Desc')}</span>
                            </div>
                            <div class="tip-card">
                                <b>${t('tip2Title')}</b>
                                <span>${t('tip2Desc')}</span>
                            </div>
                            <div class="tip-card">
                                <b>${t('tip3Title')}</b>
                                <span>${t('tip3Desc')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="guide-footer">
                <button id="btnGuideBack" class="guide-btn-secondary">${t('btnGuideBack')}</button>
                <button id="btnGuidePlay" class="guide-btn-primary">${t('btnGuidePlay')}</button>
            </div>
        `;

        // Re-bind modal buttons
        const closeX = document.getElementById('btnCloseGuideX');
        if (closeX) closeX.addEventListener('click', () => this.closeHowToPlayScreen());

        const guideBack = document.getElementById('btnGuideBack');
        if (guideBack) guideBack.addEventListener('click', () => this.closeHowToPlayScreen());

        const guidePlay = document.getElementById('btnGuidePlay');
        if (guidePlay) guidePlay.addEventListener('click', () => this.showCharSelectScreen());
    }

    applyCpuCharacter(cpuChoice = 'random') {
        const unlockedChars = CHARACTERS_DATABASE.filter(c => c.isUnlocked);
        let chosenChar = null;
        if (cpuChoice && cpuChoice !== 'random') {
            chosenChar = getCharacterById(cpuChoice);
        }
        if (!chosenChar || !chosenChar.isUnlocked) {
            chosenChar = unlockedChars[Math.floor(Math.random() * unlockedChars.length)];
        }
        this.cpuCharacter = chosenChar;
        this.setupTeams();

        const cpuBadge = document.getElementById('cpuNameBadge');
        if (cpuBadge) {
            cpuBadge.innerText = `${chosenChar.avatar} ${this.cpu.name.toUpperCase()} [CPU]`;
            cpuBadge.style.color = chosenChar.themeColor;
        }
        this.updateTeamRosterPreviews();
    }

    applySelectedCharacter() {
        const char = this.selectedCharacter || getCharacterById('trooper');
        this.selectedCharacter = char;
        this.setupTeams();
        this.groundHazards = [];
        this.activeHookTethers = [];

        const pBadge = document.getElementById('playerNameBadge');
        if (pBadge) {
            pBadge.innerText = `${char.name.toUpperCase()} [${this.lang === 'en' ? 'YOU' : 'BẠN'}]`;
        }
        this.updateSkillButtons();
        this.updateTeamRosterPreviews();
    }

    updateSkillButtons() {
        const char = this.selectedCharacter;
        const skillContainer = document.getElementById('dynamicSkillButtons');
        if (!skillContainer) return;

        if (this.gameMode === 'KOTH' && this.player && this.player.hp <= 0) {
            skillContainer.innerHTML = `
                <div style="padding: 10px; color: #f43f5e; font-weight: bold; background: rgba(244,63,94,0.12); border: 1px dashed #f43f5e; border-radius: 6px; width: 100%; text-align: center;">
                    ${t('respawnNoticeText', { turns: this.player.respawnTurns })}
                </div>
            `;
            return;
        }

        skillContainer.innerHTML = char.skills.map((s, idx) => {
            const cd = this.cooldowns[s.id] || 0;
            const isCooldown = cd > 0;
            const isTethered = this.activeHookTethers && this.activeHookTethers.some(t => t.skillId === s.id && t.source === 'PLAYER');
            const isAdrenalineActive = s.id === 'HOOKMAN_ADRENALINE' && this.playerBuffs && this.playerBuffs.adrenaline.turnsLeft > 0;
            const isCigaretteActive = s.id === 'SMOKE_CIGARETTE' && this.playerBuffs && this.playerBuffs.cigarette && this.playerBuffs.cigarette.turnsLeft > 0;

            let statusLabel = '';
            let isAmmoEmpty = false;

            if (s.maxAmmo) {
                const totalAmmo = this.skillAmmo[s.id] !== undefined ? this.skillAmmo[s.id] : s.maxAmmo;
                const queuedCount = this.playerQueue.filter(act => act.skillId === s.id).length;
                const availableAmmo = Math.max(0, totalAmmo - queuedCount);
                if (isCooldown) {
                    statusLabel = `<span class="cd-tag">[Hồi: ${cd}L]</span>`;
                } else {
                    const ammoText = s.type === 'RECT_SLASH' ? 'DÙNG' : 'ĐẠN';
                    const tagBg = availableAmmo > 0 ? (s.color || '#f97316') : '#ef4444';
                    statusLabel = `<span class="cd-tag" style="background:${tagBg}; color:white;">[${ammoText}: ${availableAmmo}/${s.maxAmmo}]</span>`;
                }
                if (availableAmmo <= 0) {
                    isAmmoEmpty = true;
                }
            } else if (isTethered) {
                statusLabel = `<span class="cd-tag" style="background:#ef4444; color:white;">[DÂY CĂNG]</span>`;
            } else if (isAdrenalineActive) {
                statusLabel = `<span class="cd-tag" style="background:#10b981; color:white;">[+20% DMG: ${this.playerBuffs.adrenaline.turnsLeft}L]</span>`;
            } else if (isCigaretteActive) {
                statusLabel = `<span class="cd-tag" style="background:#eab308; color:black; font-weight:bold;">[ĐANG HÚT: ${this.playerBuffs.cigarette.turnsLeft}L]</span>`;
            } else if (isCooldown) {
                statusLabel = `<span class="cd-tag">[Hồi: ${cd}L]</span>`;
            }

            const isBlocked = isCooldown || isTethered || isCigaretteActive || isAmmoEmpty;

            return `
                <button class="key-badge ${isBlocked ? 'cooldown' : ''}" 
                        data-skill-idx="${idx}" 
                        style="border-color: ${isBlocked ? '#ef4444' : (s.color || '#475569')}" 
                        title="${s.desc} ${isCooldown ? `(Đang hồi ${cd} lượt)` : (isTethered ? '(Dây móc đang găm vào đối thủ, cuối lượt sau sẽ giật 2 ô)' : '')}">
                    <b>[${idx + 1}]</b> ${s.icon} ${s.name}${statusLabel}
                </button>
            `;
        }).join('');

        skillContainer.querySelectorAll('button[data-skill-idx]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-skill-idx'), 10);
                this.addSkillToQueue(idx);
            });
        });
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));

        document.getElementById('btnOpenCharSelect').addEventListener('click', () => {
            this.showCharSelectScreen();
        });

        // 8 Nút chọn hướng trên giao diện
        document.querySelectorAll('.key-badge[data-key]').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.getAttribute('data-key');
                this.handleDirectionInput(key);
            });
        });

        document.getElementById('btnUndo').addEventListener('click', () => this.undoAction());
        document.getElementById('btnClear').addEventListener('click', () => this.clearQueue());
        document.getElementById('btnCommit').addEventListener('click', () => this.commitTurn());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('btnFinishPath').addEventListener('click', () => this.finishActivePath());

        const soundBtn = document.getElementById('soundToggleBtn');
        soundBtn.addEventListener('click', () => {
            if (window.soundCtrl) {
                window.soundCtrl.enabled = !window.soundCtrl.enabled;
                soundBtn.innerText = window.soundCtrl.enabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
            }
        });
    }

    // --- Tính toán vị trí mô phỏng tiếp theo trong hàng đợi hiện tại ---
    getSimulatedPlayerPos() {
        let sx = this.player.x;
        let sy = this.player.y;
        for (const act of this.playerQueue) {
            if (act.type === 'PATH_MOVE' && act.path && act.path.length > 0) {
                const lastNode = act.path[act.path.length - 1];
                sx = lastNode.x;
                sy = lastNode.y;
            } else if (act.type === 'DASH') {
                const d = DIRECTIONS[act.dir];
                sx = Math.max(0, Math.min(GRID_COLS - 1, sx + d.dx * (act.range || 2)));
                sy = Math.max(0, Math.min(GRID_ROWS - 1, sy + d.dy * (act.range || 2)));
            } else if (act.type === 'LEAP') {
                const d = DIRECTIONS[act.dir];
                let lx = sx + d.dx * (act.range || 3);
                let ly = sy + d.dy * (act.range || 3);
                lx = Math.max(0, Math.min(GRID_COLS - 1, lx));
                ly = Math.max(0, Math.min(GRID_ROWS - 1, ly));
                const hasEnemy = (this.cpu.x === lx && this.cpu.y === ly);
                const hasHazard = this.groundHazards.some(h => h.x === lx && h.y === ly);
                if (hasEnemy || hasHazard) {
                    lx = Math.max(0, Math.min(GRID_COLS - 1, lx + d.dx * (act.leapExtra || 2)));
                    ly = Math.max(0, Math.min(GRID_ROWS - 1, ly + d.dy * (act.leapExtra || 2)));
                }
                sx = lx;
                sy = ly;
            }
        }
        return { x: sx, y: sy };
    }

    getPathStartPos() {
        return this.getSimulatedPlayerPos();
    }

    // --- Xử lý vẽ Lộ trình Di chuyển (Path Movement) ---
    startPathPlanning() {
        if (this.phase !== 'PLANNING') return;
        if (this.gameMode === 'KOTH' && this.player && this.player.hp <= 0) return;
        if (this.playerQueue.length >= 4) {
            this.addCombatLog('Hàng đợi đã đầy 4 lệnh! Nhấn [SPACE] để thực thi.', 'system');
            return;
        }

        this.isBuildingPath = true;
        this.activePath = [];
        const isCigaretteActive = (this.playerBuffs && this.playerBuffs.cigarette && this.playerBuffs.cigarette.turnsLeft > 0) ||
                                  this.playerQueue.some(act => act.skillId === 'SMOKE_CIGARETTE');
        this.activePathMaxSteps = (this.selectedCharacter.moveBudget || 2) + (isCigaretteActive ? 1 : 0);

        this.updatePathNoticeUI();
        if (window.soundCtrl) window.soundCtrl.playSelect();
        this.addCombatLog(`Vẽ lộ trình (tối đa ${this.activePathMaxSteps} bước): Nhấn phím hướng để nối bước!`, 'system');
    }

    updatePathNoticeUI() {
        const notice = document.getElementById('pathPlannerNotice');
        const countText = document.getElementById('pathStepCount');
        if (this.isBuildingPath) {
            notice.style.display = 'flex';
            countText.innerText = `Đang vẽ Lộ trình: ${this.activePath.length} / ${this.activePathMaxSteps} bước`;
        } else {
            notice.style.display = 'none';
        }
    }

    appendStepToActivePath(dirKey) {
        if (!this.isBuildingPath) return;

        const d = DIRECTIONS[dirKey];
        if (!d) return;

        const startPos = this.getPathStartPos();
        const tipX = this.activePath.length === 0 ? startPos.x : this.activePath[this.activePath.length - 1].x;
        const tipY = this.activePath.length === 0 ? startPos.y : this.activePath[this.activePath.length - 1].y;

        const nextX = tipX + d.dx;
        const nextY = tipY + d.dy;

        if (nextX < 0 || nextX >= GRID_COLS || nextY < 0 || nextY >= GRID_ROWS) {
            this.addFloatingText('CHẠM BIÊN!', tipX, tipY, '#cbd5e1');
            if (window.soundCtrl) window.soundCtrl.playUndo();
            return;
        }

        this.activePath.push({
            dir: dirKey,
            dx: d.dx,
            dy: d.dy,
            symbol: d.symbol,
            label: d.label,
            x: nextX,
            y: nextY
        });

        this.currentSelectedDir = dirKey;
        this.highlightSelectedDirButton();

        if (window.soundCtrl) window.soundCtrl.playMove();
        this.updatePathNoticeUI();

        if (this.activePath.length >= this.activePathMaxSteps) {
            this.finishActivePath();
        }
    }

    finishActivePath() {
        if (!this.isBuildingPath) return;

        if (this.activePath.length === 0) {
            this.cancelPathPlanning();
            return;
        }

        const action = {
            skillId: this.selectedCharacter.skills[0].id,
            type: 'PATH_MOVE',
            name: `Lộ Trình (${this.activePath.length}b)`,
            icon: '👟',
            path: [...this.activePath],
            dir: this.activePath[this.activePath.length - 1].dir,
            dirSymbol: this.activePath.map(p => p.symbol).join(' '),
            color: this.selectedCharacter.themeColor
        };

        this.playerQueue.push(action);
        this.isBuildingPath = false;
        this.activePath = [];
        this.updatePathNoticeUI();

        if (window.soundCtrl) window.soundCtrl.playCommit();
        this.updateQueueDisplay();
        this.addCombatLog(`Đã nạp [${action.name}: ${action.dirSymbol}] vào hàng đợi!`, 'system');

        if (this.playerQueue.length === 4) {
            this.addCombatLog('Đã nạp đủ 4 lệnh. Bấm [SPACE] để BẮT ĐẦU ĐẤU!', 'system');
        }
    }

    cancelPathPlanning() {
        this.isBuildingPath = false;
        this.activePath = [];
        this.updatePathNoticeUI();
    }

    handleDirectionInput(key) {
        const keyMap = {
            'w': 'UP', 'arrowup': 'UP', 'numpad8': 'UP',
            's': 'DOWN', 'arrowdown': 'DOWN', 'numpad2': 'DOWN',
            'a': 'LEFT', 'arrowleft': 'LEFT', 'numpad4': 'LEFT',
            'd': 'RIGHT', 'arrowright': 'RIGHT', 'numpad6': 'RIGHT',
            'q': 'UP_LEFT', 'numpad7': 'UP_LEFT',
            'e': 'UP_RIGHT', 'numpad9': 'UP_RIGHT',
            'z': 'DOWN_LEFT', 'numpad1': 'DOWN_LEFT',
            'c': 'DOWN_RIGHT', 'numpad3': 'DOWN_RIGHT'
        };
        const dir = keyMap[key.toLowerCase()];
        if (!dir) return;

        if (this.isBuildingPath) {
            this.appendStepToActivePath(dir);
        } else {
            this.currentSelectedDir = dir;
            this.player.dir = dir;
            if (window.soundCtrl) window.soundCtrl.playSelect();
            this.highlightSelectedDirButton();
            this.updateHUD();
        }
    }

    highlightSelectedDirButton() {
        document.querySelectorAll('.key-badge[data-key]').forEach(btn => {
            const k = btn.getAttribute('data-key');
            const map = {
                'w': 'UP', 's': 'DOWN', 'a': 'LEFT', 'd': 'RIGHT',
                'q': 'UP_LEFT', 'e': 'UP_RIGHT', 'z': 'DOWN_LEFT', 'c': 'DOWN_RIGHT'
            };
            if (map[k] === this.currentSelectedDir) {
                btn.style.borderColor = '#00f2fe';
                btn.style.boxShadow = '0 0 10px rgba(0, 242, 254, 0.4)';
            } else {
                btn.style.borderColor = '#475569';
                btn.style.boxShadow = 'none';
            }
        });
    }

    handleKeyDown(e) {
        if (this.phase === 'LANG_SELECT') {
            if (e.code === 'Digit1' || e.key === '1' || e.key === 'v' || e.key === 'V') {
                e.preventDefault();
                this.selectLanguage('vi');
            } else if (e.code === 'Digit2' || e.key === '2' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
                this.selectLanguage('en');
            } else if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                this.selectLanguage('vi');
            }
            return;
        }

        if (this.phase === 'MAIN_MENU') {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                this.showCharSelectScreen();
            } else if (e.key === 'h' || e.key === 'H') {
                e.preventDefault();
                this.showHowToPlayScreen();
            }
            return;
        }

        if (this.phase === 'HOW_TO_PLAY') {
            if (e.code === 'Escape') {
                e.preventDefault();
                this.closeHowToPlayScreen();
            } else if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                this.showCharSelectScreen();
            }
            return;
        }

        if (this.phase === 'CHAR_SELECT') {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                this.startBattle();
            } else if (e.code === 'Escape') {
                e.preventDefault();
                this.showMainMenuScreen();
            }
            return;
        }

        if (this.phase === 'GAMEOVER') {
            if (e.code === 'Enter' || e.code === 'Space') {
                this.restartGame();
            }
            return;
        }

        const key = e.key.toLowerCase();

        // 1. Phím chọn hành động: 1, 2, 3, 4 hoặc M, J, K, L
        if (key === '1' || key === 'm') {
            e.preventDefault();
            this.addSkillToQueue(0);
            return;
        }
        if (key === '2' || key === 'j') {
            e.preventDefault();
            this.addSkillToQueue(1);
            return;
        }
        if (key === '3' || key === 'k') {
            e.preventDefault();
            this.addSkillToQueue(2);
            return;
        }
        if (key === '4' || key === 'l') {
            e.preventDefault();
            this.addSkillToQueue(3);
            return;
        }

        // 2. Phím chọn hướng
        if (['w', 'a', 's', 'd', 'q', 'e', 'z', 'c', 
             'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
             'numpad7', 'numpad8', 'numpad9', 'numpad4', 'numpad6', 'numpad1', 'numpad2', 'numpad3'].includes(key)) {
            e.preventDefault();
            this.handleDirectionInput(key);
            return;
        }

        // 3. Phím xóa lùi: Backspace
        if (e.code === 'Backspace') {
            e.preventDefault();
            if (this.isBuildingPath) {
                if (this.activePath.length > 0) {
                    this.activePath.pop();
                    if (window.soundCtrl) window.soundCtrl.playUndo();
                    this.updatePathNoticeUI();
                } else {
                    this.cancelPathPlanning();
                }
            } else {
                this.undoAction();
            }
            return;
        }

        // 4. Phím Hủy hết: Escape
        if (e.code === 'Escape') {
            e.preventDefault();
            if (this.isBuildingPath) {
                this.cancelPathPlanning();
            } else {
                this.clearQueue();
            }
            return;
        }

        // 5. Phím Khóa lệnh / Chốt lộ trình: Space hoặc Enter
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            if (this.isBuildingPath) {
                this.finishActivePath();
            } else if (this.playerQueue.length === 4 && this.phase === 'PLANNING') {
                this.commitTurn();
            }
        }
    }

    addSkillToQueue(skillIndex) {
        if (this.phase !== 'PLANNING') return;
        if (this.gameMode === 'KOTH' && this.player && this.player.hp <= 0) return;
        const skill = this.selectedCharacter.skills[skillIndex];
        if (!skill) return;

        // Nếu đang trong chế độ vẽ lộ trình mà nhấn chiêu khác -> Chốt lộ trình hiện tại trước
        if (this.isBuildingPath) {
            if (this.activePath.length > 0) {
                this.finishActivePath();
            } else {
                this.cancelPathPlanning();
            }
        }

        // Kỹ năng chưa hoàn thiện (CUSTOM / Chưa thiết kế)
        if (skill.type === 'CUSTOM') {
            this.addFloatingText('CHƯA THIẾT KẾ!', this.player.x, this.player.y, '#f59e0b');
            this.addCombatLog(`Chiêu [${skill.name}] hiện đang chờ ý tưởng thiết kế từ bạn!`, 'system');
            if (window.soundCtrl) window.soundCtrl.playUndo();
            return;
        }

        // Kỹ năng Di chuyển theo Lộ trình (PATH_MOVE)
        if (skill.type === 'PATH_MOVE') {
            this.startPathPlanning();
            return;
        }

        // Kiểm tra Dây Móc đang găm (Active Tether)
        if (this.activeHookTethers && this.activeHookTethers.some(t => t.skillId === skill.id && t.source === 'PLAYER')) {
            this.addFloatingText('ĐANG TRÓI DÂY!', this.player.x, this.player.y, '#ef4444');
            this.addCombatLog(`[${skill.name}] đang duy trì dây móc găm vào mục tiêu, cuối lượt sau sẽ giật kéo tiếp!`, 'hit');
            if (window.soundCtrl) window.soundCtrl.playUndo();
            return;
        }

        // Kiểm tra Hồi chiêu (Cooldown)
        if (this.cooldowns[skill.id] && this.cooldowns[skill.id] > 0) {
            this.addFloatingText(`HỒI CHIÊU (${this.cooldowns[skill.id]}L)!`, this.player.x, this.player.y, '#f87171');
            this.addCombatLog(`[${skill.name}] đang hồi chiêu! Còn ${this.cooldowns[skill.id]} lượt nữa.`, 'hit');
            if (window.soundCtrl) window.soundCtrl.playUndo();
            return;
        }

        // Kiểm tra đạn/lượt dùng của kỹ năng có cơ số đạn (Ammo)
        if (skill.maxAmmo) {
            const currentAmmo = this.skillAmmo[skill.id] !== undefined ? this.skillAmmo[skill.id] : skill.maxAmmo;
            const queuedCount = this.playerQueue.filter(act => act.skillId === skill.id).length;
            if (queuedCount >= currentAmmo) {
                const emptyWord = skill.type === 'RECT_SLASH' ? 'HẾT LƯỢT DÙNG!' : 'HẾT ĐẠN!';
                const unitWord = skill.type === 'RECT_SLASH' ? 'lượt sử dụng' : 'viên đạn';
                this.addFloatingText(emptyWord, this.player.x, this.player.y, '#f87171');
                this.addCombatLog(`[${skill.name}] chỉ còn ${currentAmmo} ${unitWord}!`, 'hit');
                if (window.soundCtrl) window.soundCtrl.playUndo();
                return;
            }
        }

        // Kiểm tra kỹ năng chỉ được dùng 4 hướng chính (Trái, Phải, Trên, Dưới)
        if (skill.cardinalOnly) {
            const cardinalDirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
            if (!cardinalDirs.includes(this.currentSelectedDir)) {
                const snapMap = {
                    'UP_LEFT': 'UP',
                    'UP_RIGHT': 'RIGHT',
                    'DOWN_LEFT': 'LEFT',
                    'DOWN_RIGHT': 'DOWN'
                };
                const snapped = snapMap[this.currentSelectedDir] || 'RIGHT';
                this.currentSelectedDir = snapped;
                this.highlightSelectedDirButton();
                this.addFloatingText(`HƯỚNG: ${DIRECTIONS[snapped].label}`, this.player.x, this.player.y, '#06b6d4');
                this.addCombatLog(`⚠️ [${skill.name}] chỉ có thể vung theo 4 hướng chính! Tự động chuyển sang hướng [${DIRECTIONS[snapped].label}]!`, 'system');
            }
        }

        // Kiểm tra Thuốc Lá đang hút
        if (skill.id === 'SMOKE_CIGARETTE' && this.playerBuffs && this.playerBuffs.cigarette && this.playerBuffs.cigarette.turnsLeft > 0) {
            this.addFloatingText('ĐANG HÚT THUỐC!', this.player.x, this.player.y, '#eab308');
            this.addCombatLog(`[${skill.name}] đang duy trì hiệu lực (+30% DMG & +1 Tốc độ), không thể dùng đè!`, 'hit');
            if (window.soundCtrl) window.soundCtrl.playUndo();
            return;
        }

        // Kỹ năng có hồi chiêu thông thường chỉ được dùng tối đa 1 lần trong 1 lượt (ngoại trừ kỹ năng có maxAmmo)
        if (!skill.maxAmmo && skill.cooldown && skill.cooldown > 0) {
            const alreadyQueued = this.playerQueue.some(act => act.skillId === skill.id);
            if (alreadyQueued) {
                this.addFloatingText(`ĐÃ CHỌN TRONG LƯỢT!`, this.player.x, this.player.y, '#f87171');
                this.addCombatLog(`[${skill.name}] có hồi chiêu, chỉ được dùng tối đa 1 lần mỗi lượt!`, 'hit');
                if (window.soundCtrl) window.soundCtrl.playUndo();
                return;
            }
        }

        if (this.playerQueue.length >= 4) {
            this.addCombatLog('Hàng đợi đã đầy (4/4)! Nhấn [SPACE] để thực thi.', 'system');
            return;
        }

        const action = {
            skillId: skill.id,
            type: skill.type,
            name: skill.name,
            icon: skill.icon,
            dir: this.currentSelectedDir,
            dirSymbol: DIRECTIONS[this.currentSelectedDir].symbol,
            range: skill.range !== undefined ? skill.range : 1,
            power: skill.power !== undefined ? skill.power : 25,
            minPower: skill.minPower,
            maxPower: skill.maxPower,
            maxAmmo: skill.maxAmmo,
            pullSteps: skill.pullSteps,
            delayedPullSteps: skill.delayedPullSteps,
            leapExtra: skill.leapExtra,
            damageReductionPercent: skill.damageReductionPercent,
            rangeForward: skill.rangeForward,
            widthPerp: skill.widthPerp,
            cardinalOnly: skill.cardinalOnly,
            duration: skill.duration,
            healPerTurn: skill.healPerTurn,
            dmgBonusPercent: skill.dmgBonusPercent,
            moveBonus: skill.moveBonus,
            fuse: skill.fuse,
            cooldown: skill.cooldown,
            aoeRadius: skill.aoeRadius,
            color: skill.color || '#38bdf8'
        };

        this.playerQueue.push(action);
        if (window.soundCtrl) window.soundCtrl.playSelect();

        this.updateQueueDisplay();

        if (this.playerQueue.length === 4) {
            this.addCombatLog('Đã nạp đủ 4 lệnh. Bấm [SPACE] để BẮT ĐẦU ĐẤU!', 'system');
        }
    }

    undoAction() {
        if (this.phase !== 'PLANNING') return;
        if (this.gameMode === 'KOTH' && this.player && this.player.hp <= 0) return;
        if (this.playerQueue.length > 0) {
            this.playerQueue.pop();
            if (window.soundCtrl) window.soundCtrl.playUndo();
            this.updateQueueDisplay();
        }
    }

    clearQueue() {
        if (this.phase !== 'PLANNING') return;
        if (this.gameMode === 'KOTH' && this.player && this.player.hp <= 0) return;
        this.cancelPathPlanning();
        if (this.playerQueue.length > 0) {
            this.playerQueue = [];
            if (window.soundCtrl) window.soundCtrl.playUndo();
            this.updateQueueDisplay();
        }
    }

    updateQueueDisplay() {
        for (let i = 0; i < 4; i++) {
            const slot = document.getElementById(`p-slot-${i}`);
            if (i < this.playerQueue.length) {
                const act = this.playerQueue[i];
                slot.className = 'queue-slot filled';
                slot.innerHTML = `
                    <span class="slot-step-num">#${i + 1}</span>
                    <span class="slot-icon">${act.icon}</span>
                    <span class="slot-name">${act.name}</span>
                    <span class="slot-dir" style="letter-spacing: 2px;">${act.dirSymbol}</span>
                `;
            } else {
                slot.className = 'queue-slot';
                slot.innerHTML = `
                    <span class="slot-step-num">#${i + 1}</span>
                    <span class="slot-icon">?</span>
                    <span class="slot-name">${t('slotEmpty')}</span>
                `;
            }
        }

        const commitBtn = document.getElementById('btnCommit');
        const countText = document.getElementById('queueCountText');
        countText.innerText = `${this.playerQueue.length} / 4`;

        const isPlayerDead = this.gameMode === 'KOTH' && this.player && this.player.hp <= 0;

        if (this.playerQueue.length === 4 && this.phase === 'PLANNING') {
            commitBtn.disabled = false;
            if (isPlayerDead) {
                commitBtn.innerHTML = `<span>${this.lang === 'en' ? 'WAITING RESPAWN' : 'SẴN SÀNG (CHỜ HỒI SINH)'} ⏳</span>`;
            } else {
                commitBtn.innerHTML = `<span>${t('btnCommitPrefix')} (4/4) 🚀</span>`;
            }
            commitBtn.style.animation = 'pulse 1s infinite alternate';
        } else {
            commitBtn.disabled = true;
            commitBtn.innerHTML = `<span>${t('btnCommitPrefix')} (${this.playerQueue.length}/4)</span>`;
            commitBtn.style.animation = 'none';
        }

        this.updateSkillButtons();
    }

    updateHUD() {
        const pFill = document.getElementById('playerHpFill');
        const pText = document.getElementById('playerHpText');
        const pPct = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
        pFill.style.width = `${pPct}%`;
        pText.innerText = `${Math.round(this.player.hp)} / ${this.player.maxHp} HP`;

        const cFill = document.getElementById('cpuHpFill');
        const cText = document.getElementById('cpuHpText');
        const cPct = Math.max(0, (this.cpu.hp / this.cpu.maxHp) * 100);
        cFill.style.width = `${cPct}%`;
        cText.innerText = `${Math.round(this.cpu.hp)} / ${this.cpu.maxHp} HP`;

        const playerBadge = document.getElementById('playerNameBadge');
        if (playerBadge && this.selectedCharacter) {
            playerBadge.innerText = `${getCharName(this.selectedCharacter, this.lang).toUpperCase()} ${t('playerBadgeSuffix')}`;
        }

        const cpuBadge = document.getElementById('cpuNameBadge');
        if (cpuBadge && this.cpuCharacter) {
            cpuBadge.innerText = `${this.cpu.avatar} ${getCharName(this.cpuCharacter, this.lang).toUpperCase()} ${t('cpuBadgeSuffix')}`;
            cpuBadge.style.color = this.cpu.color;
        }

        // Render Roster Bars & Score
        const pRoster = document.getElementById('playerTeamRosterBar');
        if (pRoster && this.blueTeam && this.blueTeam.length > 0) {
            pRoster.innerHTML = this.blueTeam.map(u => {
                let statusDisplay = `${Math.round(u.hp)} HP`;
                let chipClass = 'team-hud-chip alive';
                if (u.hp <= 0) {
                    if (this.gameMode === 'KOTH' && u.respawnTurns > 0) {
                        statusDisplay = t('respawningTag', { turns: u.respawnTurns });
                        chipClass = 'team-hud-chip respawning';
                    } else {
                        statusDisplay = this.lang === 'en' ? 'K.O' : 'HẠ';
                        chipClass = 'team-hud-chip dead';
                    }
                }
                return `
                    <div class="${chipClass}" title="${u.name}: ${u.hp > 0 ? Math.round(u.hp) + '/' + u.maxHp + ' HP' : statusDisplay}">
                        <span>${u.avatar}</span>
                        <span>${u.isPlayer ? (this.lang === 'en' ? 'You' : 'Bạn') : (u.character ? u.character.name.split(' (')[0] : u.name)}</span>
                        <span style="color: ${u.hp > 0 ? '#34d399' : (u.respawnTurns > 0 ? '#f59e0b' : '#f87171')}; font-weight:800;">${statusDisplay}</span>
                    </div>
                `;
            }).join('');
        }

        const cRoster = document.getElementById('cpuTeamRosterBar');
        if (cRoster && this.redTeam && this.redTeam.length > 0) {
            cRoster.innerHTML = this.redTeam.map(u => {
                let statusDisplay = `${Math.round(u.hp)} HP`;
                let chipClass = 'team-hud-chip alive';
                if (u.hp <= 0) {
                    if (this.gameMode === 'KOTH' && u.respawnTurns > 0) {
                        statusDisplay = t('respawningTag', { turns: u.respawnTurns });
                        chipClass = 'team-hud-chip respawning';
                    } else {
                        statusDisplay = this.lang === 'en' ? 'K.O' : 'HẠ';
                        chipClass = 'team-hud-chip dead';
                    }
                }
                return `
                    <div class="${chipClass}" title="${u.name}: ${u.hp > 0 ? Math.round(u.hp) + '/' + u.maxHp + ' HP' : statusDisplay}">
                        <span>${u.avatar}</span>
                        <span>${u.character ? u.character.name.split(' (')[0] : u.name}</span>
                        <span style="color: ${u.hp > 0 ? '#fb7185' : (u.respawnTurns > 0 ? '#f59e0b' : '#f87171')}; font-weight:800;">${statusDisplay}</span>
                    </div>
                `;
            }).join('');
        }

        const scoreElem = document.getElementById('teamScoreDisplay');
        if (scoreElem && this.blueTeam && this.redTeam) {
            const blueAlive = this.blueTeam.filter(u => u.hp > 0).length;
            const redAlive = this.redTeam.filter(u => u.hp > 0).length;
            scoreElem.innerText = `🔵 ${blueAlive} ${this.lang === 'en' ? 'Alive' : 'Sống'} vs 🔴 ${redAlive} ${this.lang === 'en' ? 'Alive' : 'Sống'}`;
        }

        // KOTH HUD Banner & Overtime
        const kothBanner = document.getElementById('kothScoreBanner');
        if (kothBanner) {
            if (this.gameMode === 'KOTH') {
                kothBanner.style.display = 'flex';
                const bScore = document.getElementById('kothBlueScoreText');
                const rScore = document.getElementById('kothRedScoreText');
                const hBadge = document.getElementById('kothHillStatusBadge');
                const otBadge = document.getElementById('kothOvertimeBadge');

                if (bScore) bScore.innerText = `🔵 ${this.blueScore}/15`;
                if (rScore) rScore.innerText = `🔴 ${this.redScore}/15`;

                if (hBadge) {
                    let hillText = t('kothHillNeutral');
                    let badgeClass = 'koth-hill-badge';
                    if (this.hillScale === 2) {
                        hillText = t('kothHillCapturedBlue');
                        badgeClass += ' blue-held';
                    } else if (this.hillScale === 1) {
                        hillText = t('kothHillCapturingBlue', { status: 1 });
                        badgeClass += ' blue-capping';
                    } else if (this.hillScale === -1) {
                        hillText = t('kothHillCapturingRed', { status: 1 });
                        badgeClass += ' red-capping';
                    } else if (this.hillScale === -2) {
                        hillText = t('kothHillCapturedRed');
                        badgeClass += ' red-held';
                    }
                    hBadge.innerText = hillText;
                    hBadge.className = badgeClass;
                }

                if (otBadge) {
                    otBadge.style.display = this.inOvertime ? 'inline-block' : 'none';
                    if (this.inOvertime) {
                        otBadge.innerText = t('kothOvertimeBadge');
                    }
                }
            } else {
                kothBanner.style.display = 'none';
            }
        }

        // Thông báo Người chơi đang chờ hồi sinh
        const respawnNotice = document.getElementById('playerRespawnNotice');
        if (respawnNotice) {
            if (this.gameMode === 'KOTH' && this.player && this.player.hp <= 0) {
                respawnNotice.style.display = 'flex';
                const respText = document.getElementById('playerRespawnNoticeText');
                if (respText) respText.innerText = t('respawnNoticeText', { turns: this.player.respawnTurns });
            } else {
                respawnNotice.style.display = 'none';
            }
        }

        document.getElementById('turnDisplay').innerText = `${t('turnPrefix')} ${this.turn}`;
        const phaseElem = document.getElementById('phaseDisplay');
        if (this.phase === 'PLANNING') {
            phaseElem.innerText = t('phasePlanning');
            phaseElem.style.color = '#38bdf8';
        } else if (this.phase === 'RESOLVING') {
            phaseElem.innerText = this.lang === 'en' ? `RESOLVING: STEP ${this.currentStep + 1}/4` : `GIẢI QUYẾT: BƯỚC ${this.currentStep + 1}/4`;
            phaseElem.style.color = '#f59e0b';
        } else if (this.phase === 'CHAR_SELECT') {
            phaseElem.innerText = t('charSelectHeaderTitle');
            phaseElem.style.color = '#a855f7';
        } else if (this.phase === 'LANG_SELECT') {
            phaseElem.innerText = t('langBadge');
            phaseElem.style.color = '#38bdf8';
        } else {
            phaseElem.innerText = this.lang === 'en' ? 'GAME OVER' : 'KẾT THÚC';
            phaseElem.style.color = '#f43f5e';
        }

        const d = DIRECTIONS[this.currentSelectedDir];
        const dLabel = this.lang === 'en' ? (d.label_en || d.label) : d.label;
        document.getElementById('currentDirText').innerText = `${dLabel} (${d.symbol})`;
    }

    addCombatLog(msg, type = 'normal') {
        const log = document.getElementById('combatLog');
        const div = document.createElement('div');
        div.className = `log-entry ${type}`;
        div.innerText = msg;
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
    }

    isOutside7x7(posA, posB) {
        if (!posA || !posB) return false;
        return Math.abs(posA.x - posB.x) > 3 || Math.abs(posA.y - posB.y) > 3;
    }

    isPlayerStealthed() {
        const isHookman = this.player.charId === 'hookman' || (this.selectedCharacter && this.selectedCharacter.id === 'hookman');
        if (!isHookman) return false;
        if (this.playerRevealedTurns > 0) return false;
        return this.isOutside7x7(this.player, this.cpu);
    }

    isCpuStealthed() {
        const isHookman = this.cpu.charId === 'hookman' || (this.cpu.name && this.cpu.name.includes('Hookman'));
        if (!isHookman) return false;
        if (this.cpuRevealedTurns > 0) return false;
        return this.isOutside7x7(this.cpu, this.player);
    }

    getAlignedRangedDirection(fromX, fromY, toX, toY, maxRange = 5) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        if (dy === 0 && Math.abs(dx) > 0 && Math.abs(dx) <= maxRange) {
            return dx > 0 ? 'RIGHT' : 'LEFT';
        }
        if (dx === 0 && Math.abs(dy) > 0 && Math.abs(dy) <= maxRange) {
            return dy > 0 ? 'DOWN' : 'UP';
        }
        if (Math.abs(dx) === Math.abs(dy) && Math.abs(dx) > 0 && Math.abs(dx) <= maxRange) {
            if (dx > 0 && dy > 0) return 'DOWN_RIGHT';
            if (dx > 0 && dy < 0) return 'UP_RIGHT';
            if (dx < 0 && dy > 0) return 'DOWN_LEFT';
            if (dx < 0 && dy < 0) return 'UP_LEFT';
        }
        return null;
    }

    // --- CPU AI Engine với Logic Chiến Thuật Riêng Biệt Cho Từng Nhân Vật ---
    getCpuBlindFireDir(simX, simY) {
        const allDirs = ['LEFT', 'UP_LEFT', 'DOWN_LEFT', 'UP', 'DOWN', 'RIGHT', 'UP_RIGHT', 'DOWN_RIGHT'];
        const validDirs = allDirs.filter(d => {
            const dObj = DIRECTIONS[d];
            const cx = simX + dObj.dx * 2;
            const cy = simY + dObj.dy * 2;
            return cx >= 0 && cx < GRID_COLS && cy >= 0 && cy < GRID_ROWS;
        });
        const preferredDirs = validDirs.filter(d => DIRECTIONS[d].dx < 0);
        const candidateDirs = (preferredDirs.length > 0 && Math.random() < 0.75) ? preferredDirs : validDirs;
        return candidateDirs[Math.floor(Math.random() * candidateDirs.length)] || 'LEFT';
    }

    createCpuPathMove(simX, simY, targetX, targetY, maxSteps = 2, away = false) {
        const path = [];
        let currX = simX, currY = simY;
        let dir = 'LEFT';

        for (let s = 0; s < maxSteps; s++) {
            const curDx = targetX - currX;
            const curDy = targetY - currY;
            if (!away && Math.abs(curDx) + Math.abs(curDy) <= 1 && s > 0) break;
            if (away && Math.abs(curDx) + Math.abs(curDy) === 0) break;

            const stepDir = away ? this.getDirectionAway(curDx, curDy, currX, currY) : this.getDirectionTowards(curDx, curDy);
            const dObj = DIRECTIONS[stepDir];
            currX = Math.max(0, Math.min(GRID_COLS - 1, currX + dObj.dx));
            currY = Math.max(0, Math.min(GRID_ROWS - 1, currY + dObj.dy));
            path.push({ dir: stepDir, x: currX, y: currY, symbol: dObj.symbol });
        }
        if (path.length > 0) dir = path[path.length - 1].dir;

        return {
            type: 'PATH_MOVE',
            name: `Lộ Trình (${path.length}b)`,
            icon: '👟',
            path: path,
            dir: dir,
            dirSymbol: path.map(p => p.symbol).join(' '),
            power: 0,
            range: 1
        };
    }

    generateCpuQueue() {
        return this.generateCpuQueueForUnit(this.cpu);
    }

    generateCpuQueueForUnit(unit) {
        const queue = [];
        let simX = unit.x;
        let simY = unit.y;

        const charId = (unit.character && unit.character.id) || unit.charId || 'trooper';
        const simCooldowns = { ...unit.cooldowns };
        const simSkillAmmo = { ...unit.skillAmmo };
        const simBuffs = {
            adrenaline: { turnsLeft: (unit.buffs && unit.buffs.adrenaline) ? unit.buffs.adrenaline.turnsLeft : 0 },
            cigarette: { turnsLeft: (unit.buffs && unit.buffs.cigarette) ? unit.buffs.cigarette.turnsLeft : 0 }
        };

        const opposingTeam = unit.team === 'BLUE' ? this.redTeam : this.blueTeam;
        const livingOpponents = opposingTeam.filter(e => e.hp > 0);

        for (let i = 0; i < 4; i++) {
            let target = null;
            let minDist = 999;
            for (const opp of livingOpponents) {
                const d = Math.abs(opp.x - simX) + Math.abs(opp.y - simY);
                if (d < minDist) {
                    minDist = d;
                    target = opp;
                }
            }

            let targetX = (unit.team === 'BLUE' ? 15 : 4);
            let targetY = 3;
            let targetInvisible = false;

            if (this.gameMode === 'KOTH') {
                const opponentsInZone = livingOpponents.filter(opp => this.isInCaptureZone(opp.x, opp.y));
                if (opponentsInZone.length > 0) {
                    let minZDist = 999;
                    for (const opp of opponentsInZone) {
                        const d = Math.abs(opp.x - simX) + Math.abs(opp.y - simY);
                        if (d < minZDist) {
                            minZDist = d;
                            target = opp;
                        }
                    }
                } else if (!this.isInCaptureZone(simX, simY) && minDist > 2) {
                    target = null;
                    targetX = 10;
                    targetY = 3;
                }
            }

            if (target) {
                targetX = target.x;
                targetY = target.y;
                if (target.charId === 'hookman' && target.stealthRadius > 0 && target.revealedTurns <= 0) {
                    if (this.isOutside7x7(simX, simY, target.x, target.y)) {
                        targetInvisible = true;
                        targetX = 10;
                        targetY = 3;
                    }
                }
            }

            const dx = targetX - simX;
            const dy = targetY - simY;
            const dist = Math.abs(dx) + Math.abs(dy);

            let action = null;
            if (charId === 'trooper') {
                action = this.generateCpuActionTrooper(i, simX, simY, dx, dy, dist, targetInvisible, simCooldowns, simSkillAmmo, simBuffs);
            } else if (charId === 'hookman') {
                action = this.generateCpuActionHookman(i, simX, simY, dx, dy, dist, targetInvisible, simCooldowns, simSkillAmmo, simBuffs);
            } else if (charId === 'smoke_guy') {
                action = this.generateCpuActionSmokeGuy(i, simX, simY, dx, dy, dist, targetInvisible, simCooldowns, simSkillAmmo, simBuffs);
            } else if (charId === 'razor') {
                action = this.generateCpuActionRazor(i, simX, simY, dx, dy, dist, targetInvisible, simCooldowns, simSkillAmmo, simBuffs);
            } else {
                action = this.generateCpuActionTrooper(i, simX, simY, dx, dy, dist, targetInvisible, simCooldowns, simSkillAmmo, simBuffs);
            }

            // Cập nhật vị trí mô phỏng
            if (action.type === 'PATH_MOVE' && action.path && action.path.length > 0) {
                const lastStep = action.path[action.path.length - 1];
                simX = lastStep.x;
                simY = lastStep.y;
            } else if (action.type === 'LEAP') {
                const lD = DIRECTIONS[action.dir];
                let destX = Math.max(0, Math.min(GRID_COLS - 1, simX + lD.dx * (action.range || 3)));
                let destY = Math.max(0, Math.min(GRID_ROWS - 1, simY + lD.dy * (action.range || 3)));
                const hasObstacle = livingOpponents.some(e => e.x === destX && e.y === destY) || this.groundHazards.some(h => h.x === destX && h.y === destY);
                if (hasObstacle) {
                    destX = Math.max(0, Math.min(GRID_COLS - 1, destX + lD.dx * 2));
                    destY = Math.max(0, Math.min(GRID_ROWS - 1, destY + lD.dy * 2));
                }
                simX = destX;
                simY = destY;
            }

            queue.push(action);
        }

        return queue;
    }

    generateCpuActionTrooper(stepIdx, simX, simY, dx, dy, dist, playerInvisible, simCooldowns, simSkillAmmo, simBuffs) {
        if (playerInvisible) {
            const shouldBlindFire = (stepIdx === 1 || stepIdx === 3 || Math.random() < 0.45);
            if (shouldBlindFire) {
                const bDir = this.getCpuBlindFireDir(simX, simY);
                if (!simCooldowns['TROOPER_ROCKET'] && Math.random() < 0.35) {
                    simCooldowns['TROOPER_ROCKET'] = 4;
                    return {
                        type: 'ROCKET',
                        skillId: 'TROOPER_ROCKET',
                        name: 'Bắn Bừa Tên Lửa',
                        icon: '🚀',
                        dir: bDir,
                        dirSymbol: DIRECTIONS[bDir].symbol,
                        power: 30,
                        range: 6,
                        cooldown: 4,
                        aoeRadius: 1,
                        isBlindFire: true
                    };
                }
                return {
                    type: 'RANGED_LINE',
                    skillId: 'TROOPER_RIFLE',
                    name: 'Bắn Bừa Bãi',
                    icon: '🔫',
                    dir: bDir,
                    dirSymbol: DIRECTIONS[bDir].symbol,
                    power: 20,
                    range: 5,
                    isBlindFire: true
                };
            }
            return this.createCpuPathMove(simX, simY, 10, 3, 2, false);
        }

        const alignedDir6 = this.getAlignedRangedDirection(simX, simY, this.player.x, this.player.y, 6);
        const alignedDir5 = this.getAlignedRangedDirection(simX, simY, this.player.x, this.player.y, 5);

        // 1. Tên lửa tầm 6 (Rocket)
        if (!simCooldowns['TROOPER_ROCKET'] && alignedDir6 && dist >= 2) {
            simCooldowns['TROOPER_ROCKET'] = 4;
            return {
                type: 'ROCKET',
                skillId: 'TROOPER_ROCKET',
                name: 'Tên Lửa',
                icon: '🚀',
                dir: alignedDir6,
                dirSymbol: DIRECTIONS[alignedDir6].symbol,
                power: 30,
                range: 6,
                cooldown: 4,
                aoeRadius: 1
            };
        }

        // 2. Lựu đạn hẹn giờ (Grenade)
        if (!simCooldowns['TROOPER_GRENADE'] && dist <= 5 && dist >= 2 && Math.random() < 0.65) {
            simCooldowns['TROOPER_GRENADE'] = 3;
            const gDir = this.getDirectionTowards(dx, dy);
            return {
                type: 'GRENADE',
                skillId: 'TROOPER_GRENADE',
                name: 'Lựu Đạn',
                icon: '💣',
                dir: gDir,
                dirSymbol: DIRECTIONS[gDir].symbol,
                power: 50,
                range: 5,
                cooldown: 3,
                fuse: 2,
                aoeRadius: 1,
                targetX: this.player.x,
                targetY: this.player.y
            };
        }

        // 3. Assault Rifle tầm 5
        if (alignedDir5 && Math.random() < 0.75) {
            return {
                type: 'RANGED_LINE',
                skillId: 'TROOPER_RIFLE',
                name: 'Assault Rifle',
                icon: '🔫',
                dir: alignedDir5,
                dirSymbol: DIRECTIONS[alignedDir5].symbol,
                power: 20,
                range: 5
            };
        }

        // 4. Nếu quá gần (dist <= 1)
        if (dist <= 1) {
            if (Math.random() < 0.35) {
                const sDir = this.getDirectionTowards(dx, dy);
                return { type: 'SHIELD', name: 'Khiên', icon: '🛡️', dir: sDir, dirSymbol: DIRECTIONS[sDir].symbol, power: 0, range: 1 };
            }
            return this.createCpuPathMove(simX, simY, this.player.x, this.player.y, 2, true);
        }

        // 5. Di chuyển duy trì cự ly tầm trung (3-4 ô)
        const shouldRetreat = (dist < 3);
        return this.createCpuPathMove(simX, simY, this.player.x, this.player.y, 2, shouldRetreat);
    }

    generateCpuActionHookman(stepIdx, simX, simY, dx, dy, dist, playerInvisible, simCooldowns, simSkillAmmo, simBuffs) {
        // 1. Tiêm Adrenaline
        if (!simCooldowns['HOOKMAN_ADRENALINE'] && simBuffs.adrenaline.turnsLeft <= 0) {
            if (this.cpu.hp <= 75 || dist <= 5 || Math.random() < 0.3) {
                simCooldowns['HOOKMAN_ADRENALINE'] = 3;
                simBuffs.adrenaline.turnsLeft = 3;
                return {
                    type: 'BUFF_HEAL',
                    skillId: 'HOOKMAN_ADRENALINE',
                    name: 'Adrenaline',
                    icon: '💉',
                    dir: 'LEFT',
                    dirSymbol: '⚡',
                    power: 0,
                    duration: 3,
                    cooldown: 3
                };
            }
        }

        if (playerInvisible) {
            const shouldBlindFire = (stepIdx === 1 || stepIdx === 3 || Math.random() < 0.45);
            if (shouldBlindFire) {
                const bDir = this.getCpuBlindFireDir(simX, simY);
                return {
                    type: 'RANGED_VARIABLE',
                    skillId: 'HOOKMAN_PISTOL',
                    name: 'Bắn Bừa Bãi',
                    icon: '🔫',
                    dir: bDir,
                    dirSymbol: DIRECTIONS[bDir].symbol,
                    minPower: 15,
                    maxPower: 20,
                    range: 5,
                    isBlindFire: true
                };
            }
            // Hookman di chuyển tuần tra với budget = 3
            return this.createCpuPathMove(simX, simY, 10, 3, 3, false);
        }

        const alignedDir6 = this.getAlignedRangedDirection(simX, simY, this.player.x, this.player.y, 6);
        const alignedDir5 = this.getAlignedRangedDirection(simX, simY, this.player.x, this.player.y, 5);

        // 2. Móc Kéo (Hook Pull)
        const isTethered = this.activeHookTethers && this.activeHookTethers.some(t => t.source === 'CPU');
        if (!simCooldowns['HOOKMAN_HOOK'] && !isTethered && alignedDir6 && dist >= 2 && Math.random() < 0.8) {
            return {
                type: 'HOOK_PULL',
                skillId: 'HOOKMAN_HOOK',
                name: 'Móc Kéo',
                icon: '🪝',
                dir: alignedDir6,
                dirSymbol: DIRECTIONS[alignedDir6].symbol,
                power: 15,
                range: 6,
                cooldown: 4
            };
        }

        // 3. Silence Pistol
        if (alignedDir5 && Math.random() < 0.7) {
            return {
                type: 'RANGED_VARIABLE',
                skillId: 'HOOKMAN_PISTOL',
                name: 'Silence Pistol',
                icon: '🔫',
                dir: alignedDir5,
                dirSymbol: DIRECTIONS[alignedDir5].symbol,
                minPower: 15,
                maxPower: 20,
                range: 5
            };
        }

        // 4. Nếu quá gần (dist <= 1)
        if (dist <= 1) {
            if (Math.random() < 0.3) {
                const sDir = this.getDirectionTowards(dx, dy);
                return { type: 'SHIELD', name: 'Khiên', icon: '🛡️', dir: sDir, dirSymbol: DIRECTIONS[sDir].symbol, power: 0, range: 1 };
            }
            return this.createCpuPathMove(simX, simY, this.player.x, this.player.y, 3, true);
        }

        // 5. Di chuyển lẩn khuất (Hookman có 3 bước di chuyển)
        return this.createCpuPathMove(simX, simY, this.player.x, this.player.y, 3, false);
    }

    generateCpuActionSmokeGuy(stepIdx, simX, simY, dx, dy, dist, playerInvisible, simCooldowns, simSkillAmmo, simBuffs) {
        // 1. Châm Thuốc Lá
        if (!simCooldowns['SMOKE_CIGARETTE'] && simBuffs.cigarette.turnsLeft <= 0 && Math.random() < 0.75) {
            simBuffs.cigarette.turnsLeft = 2;
            return {
                type: 'BUFF_SMOKE',
                skillId: 'SMOKE_CIGARETTE',
                name: 'Thuốc Lá',
                icon: '🚬',
                dir: 'LEFT',
                dirSymbol: '🔥',
                power: 0,
                duration: 2,
                cooldown: 3
            };
        }

        const bombAmmo = simSkillAmmo['SMOKE_BOMB_LAUNCHER'] !== undefined ? simSkillAmmo['SMOKE_BOMB_LAUNCHER'] : 2;

        if (playerInvisible) {
            const shouldBlindFire = (stepIdx === 1 || stepIdx === 3 || Math.random() < 0.45);
            if (shouldBlindFire) {
                const bDir = this.getCpuBlindFireDir(simX, simY);
                if (!simCooldowns['SMOKE_BOMB_LAUNCHER'] && bombAmmo > 0 && Math.random() < 0.4) {
                    simSkillAmmo['SMOKE_BOMB_LAUNCHER'] = bombAmmo - 1;
                    if (simSkillAmmo['SMOKE_BOMB_LAUNCHER'] === 0) {
                        simCooldowns['SMOKE_BOMB_LAUNCHER'] = 4;
                    }
                    return {
                        type: 'BOMB_LAUNCHER',
                        skillId: 'SMOKE_BOMB_LAUNCHER',
                        name: 'Bắn Bừa Bom Pháo',
                        icon: '💣',
                        dir: bDir,
                        dirSymbol: DIRECTIONS[bDir].symbol,
                        power: 30,
                        range: 6,
                        cooldown: 4,
                        aoeRadius: 1,
                        isBlindFire: true
                    };
                }
                return {
                    type: 'RANGED_LINE',
                    skillId: 'SMOKE_RIFLE',
                    name: 'Bắn Bừa Bãi',
                    icon: '🔫',
                    dir: bDir,
                    dirSymbol: DIRECTIONS[bDir].symbol,
                    power: 18,
                    range: 5,
                    isBlindFire: true
                };
            }
            const moveBudget = simBuffs.cigarette.turnsLeft > 0 ? 3 : 2;
            return this.createCpuPathMove(simX, simY, 10, 3, moveBudget, false);
        }

        const alignedDir6 = this.getAlignedRangedDirection(simX, simY, this.player.x, this.player.y, 6);
        const alignedDir5 = this.getAlignedRangedDirection(simX, simY, this.player.x, this.player.y, 5);

        // 2. Súng Bắn Bom (2 viên đạn)
        if (!simCooldowns['SMOKE_BOMB_LAUNCHER'] && bombAmmo > 0 && alignedDir6 && dist >= 2) {
            simSkillAmmo['SMOKE_BOMB_LAUNCHER'] = bombAmmo - 1;
            if (simSkillAmmo['SMOKE_BOMB_LAUNCHER'] === 0) {
                simCooldowns['SMOKE_BOMB_LAUNCHER'] = 4;
            }
            return {
                type: 'BOMB_LAUNCHER',
                skillId: 'SMOKE_BOMB_LAUNCHER',
                name: 'Súng Bắn Bom',
                icon: '💣',
                dir: alignedDir6,
                dirSymbol: DIRECTIONS[alignedDir6].symbol,
                power: 30,
                range: 6,
                cooldown: 4,
                aoeRadius: 1
            };
        }

        // 3. Combat Rifle
        if (alignedDir5 && Math.random() < 0.75) {
            return {
                type: 'RANGED_LINE',
                skillId: 'SMOKE_RIFLE',
                name: 'Combat Rifle',
                icon: '🔫',
                dir: alignedDir5,
                dirSymbol: DIRECTIONS[alignedDir5].symbol,
                power: 18,
                range: 5
            };
        }

        // 4. Nếu quá gần (dist <= 1)
        const moveBudget = simBuffs.cigarette.turnsLeft > 0 ? 3 : 2;
        if (dist <= 1) {
            if (Math.random() < 0.35) {
                const sDir = this.getDirectionTowards(dx, dy);
                return { type: 'SHIELD', name: 'Khiên', icon: '🛡️', dir: sDir, dirSymbol: DIRECTIONS[sDir].symbol, power: 0, range: 1 };
            }
            return this.createCpuPathMove(simX, simY, this.player.x, this.player.y, moveBudget, true);
        }

        // 5. Di chuyển
        return this.createCpuPathMove(simX, simY, this.player.x, this.player.y, moveBudget, false);
    }

    generateCpuActionRazor(stepIdx, simX, simY, dx, dy, dist, playerInvisible, simCooldowns, simSkillAmmo, simBuffs) {
        const bladeAmmo = simSkillAmmo['RAZOR_BLADE'] !== undefined ? simSkillAmmo['RAZOR_BLADE'] : 2;

        if (!playerInvisible && !simCooldowns['RAZOR_BLADE'] && bladeAmmo > 0) {
            // 1. Kiểm tra Kiếm Gắn Tay (3x2 trong 4 hướng chính)
            const cardinalDirs = ['RIGHT', 'LEFT', 'UP', 'DOWN'];
            for (const cDir of cardinalDirs) {
                const slashTiles = this.getRectSlashTiles(simX, simY, cDir);
                if (slashTiles.some(t => t.x === this.player.x && t.y === this.player.y)) {
                    simSkillAmmo['RAZOR_BLADE'] = bladeAmmo - 1;
                    if (simSkillAmmo['RAZOR_BLADE'] === 0) {
                        simCooldowns['RAZOR_BLADE'] = 4;
                    }
                    return {
                        type: 'RECT_SLASH',
                        skillId: 'RAZOR_BLADE',
                        name: 'Kiếm Gắn Tay',
                        icon: '🗡️',
                        dir: cDir,
                        dirSymbol: DIRECTIONS[cDir].symbol,
                        power: 60,
                        cooldown: 4
                    };
                }
            }
        }

        if (playerInvisible) {
            const shouldBlindFire = (stepIdx === 1 || stepIdx === 3 || Math.random() < 0.45);
            if (shouldBlindFire) {
                const bDir = this.getCpuBlindFireDir(simX, simY);
                return {
                    type: 'RANGED_LINE',
                    skillId: 'RAZOR_PULSE_RIFLE',
                    name: 'Bắn Bừa Bãi',
                    icon: '⚡',
                    dir: bDir,
                    dirSymbol: DIRECTIONS[bDir].symbol,
                    power: 25,
                    range: 4,
                    isBlindFire: true
                };
            }
            return this.createCpuPathMove(simX, simY, 10, 3, 2, false);
        }

        // 2. Nhảy Đột Kích (Leap tầm 3)
        if (!simCooldowns['RAZOR_LEAP'] && dist >= 3 && dist <= 6 && Math.random() < 0.75) {
            simCooldowns['RAZOR_LEAP'] = 3;
            const leapDir = this.getDirectionTowards(dx, dy);
            return {
                type: 'LEAP',
                skillId: 'RAZOR_LEAP',
                name: 'Nhảy Đột Kích',
                icon: '🦘',
                dir: leapDir,
                dirSymbol: DIRECTIONS[leapDir].symbol,
                range: 3,
                leapExtra: 2,
                cooldown: 3
            };
        }

        // 3. Pulse Rifle tầm 4
        const alignedDir4 = this.getAlignedRangedDirection(simX, simY, this.player.x, this.player.y, 4);
        if (alignedDir4 && Math.random() < 0.7) {
            return {
                type: 'RANGED_LINE',
                skillId: 'RAZOR_PULSE_RIFLE',
                name: 'Pulse Rifle',
                icon: '⚡',
                dir: alignedDir4,
                dirSymbol: DIRECTIONS[alignedDir4].symbol,
                power: 25,
                range: 4
            };
        }

        // 4. Nếu quá gần (dist <= 1)
        if (dist <= 1) {
            if (Math.random() < 0.3) {
                const sDir = this.getDirectionTowards(dx, dy);
                return { type: 'SHIELD', name: 'Khiên', icon: '🛡️', dir: sDir, dirSymbol: DIRECTIONS[sDir].symbol, power: 0, range: 1 };
            }
            return this.createCpuPathMove(simX, simY, this.player.x, this.player.y, 2, true);
        }

        // 5. Di chuyển áp sát
        return this.createCpuPathMove(simX, simY, this.player.x, this.player.y, 2, false);
    }

    getDirectionTowards(dx, dy) {
        if (dx !== 0 && dy !== 0 && Math.random() < 0.6) {
            if (dx > 0 && dy < 0) return 'UP_RIGHT';
            if (dx > 0 && dy > 0) return 'DOWN_RIGHT';
            if (dx < 0 && dy < 0) return 'UP_LEFT';
            if (dx < 0 && dy > 0) return 'DOWN_LEFT';
        }
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'RIGHT' : 'LEFT';
        } else if (dy !== 0) {
            return dy > 0 ? 'DOWN' : 'UP';
        }
        return dx > 0 ? 'RIGHT' : 'LEFT';
    }

    getDirectionAway(dx, dy, x, y) {
        if (dx !== 0 && dy !== 0 && Math.random() < 0.5) {
            const diagX = dx > 0 ? -1 : 1;
            const diagY = dy > 0 ? -1 : 1;
            const targetX = x + diagX;
            const targetY = y + diagY;
            if (targetX >= 0 && targetX < GRID_COLS && targetY >= 0 && targetY < GRID_ROWS) {
                if (diagX > 0 && diagY < 0) return 'UP_RIGHT';
                if (diagX > 0 && diagY > 0) return 'DOWN_RIGHT';
                if (diagX < 0 && diagY < 0) return 'UP_LEFT';
                if (diagX < 0 && diagY > 0) return 'DOWN_LEFT';
            }
        }
        const oppX = dx > 0 ? 'LEFT' : 'RIGHT';
        if (oppX === 'LEFT' && x === 0) return y < 3 ? 'DOWN' : 'UP';
        if (oppX === 'RIGHT' && x === GRID_COLS - 1) return y < 3 ? 'DOWN' : 'UP';
        return oppX;
    }

    // --- Khóa lệnh & Thực thi lượt đồng thời ---
    commitTurn() {
        if (this.phase !== 'PLANNING' || this.playerQueue.length !== 4) return;

        this.cancelPathPlanning();
        this.phase = 'RESOLVING';
        if (window.soundCtrl) window.soundCtrl.playCommit();
        this.addCombatLog(`--- [${this.lang === 'en' ? 'TURN' : 'LƯỢT'} ${this.turn}] ${this.lang === 'en' ? 'EXECUTION LOCKED' : 'KHÓA LỆNH THỰC THI'} ---`, 'system');

        // 1. Đặt hồi chiêu cho các kỹ năng được chọn của Người chơi
        for (const act of this.playerQueue) {
            if (act.cooldown && act.type !== 'HOOK_PULL' && act.type !== 'BUFF_SMOKE' && act.type !== 'BOMB_LAUNCHER' && act.type !== 'RECT_SLASH') {
                this.cooldowns[act.skillId] = act.cooldown;
            }
        }
        this.player.queue = [...this.playerQueue];

        // 2. Sinh hàng đợi hành động cho toàn bộ Đồng minh CPU Đội Xanh
        for (let i = 1; i < this.blueTeam.length; i++) {
            const ally = this.blueTeam[i];
            if (ally.hp > 0) {
                ally.queue = this.generateCpuQueueForUnit(ally);
                for (const act of ally.queue) {
                    if (act.cooldown && act.type !== 'HOOK_PULL' && act.type !== 'BUFF_SMOKE' && act.type !== 'BOMB_LAUNCHER' && act.type !== 'RECT_SLASH') {
                        ally.cooldowns[act.skillId] = act.cooldown;
                    }
                }
            } else {
                ally.queue = [];
            }
        }

        // 3. Sinh hàng đợi hành động cho toàn bộ Kẻ địch CPU Đội Đỏ
        for (let j = 0; j < this.redTeam.length; j++) {
            const enemy = this.redTeam[j];
            if (enemy.hp > 0) {
                enemy.queue = this.generateCpuQueueForUnit(enemy);
                for (const act of enemy.queue) {
                    if (act.cooldown && act.type !== 'HOOK_PULL' && act.type !== 'BUFF_SMOKE' && act.type !== 'BOMB_LAUNCHER' && act.type !== 'RECT_SLASH') {
                        enemy.cooldowns[act.skillId] = act.cooldown;
                    }
                }
            } else {
                enemy.queue = [];
            }
        }

        this.cpuQueue = (this.cpu && this.cpu.queue) ? this.cpu.queue : [];

        for (let i = 0; i < 4; i++) {
            const slot = document.getElementById(`c-slot-${i}`);
            if (slot) {
                slot.className = 'queue-slot';
                slot.innerHTML = `<span class="slot-step-num">#${i + 1}</span><span class="slot-icon">🔒</span><span class="slot-name">${this.lang === 'en' ? 'Secret' : 'Bí mật'}</span>`;
            }
        }

        this.updateHUD();
        this.currentStep = 0;
        this.executeResolutionStep(0);
    }

    async executeResolutionStep(stepIndex) {
        if (stepIndex >= 4) {
            this.finishTurn();
            return;
        }

        // Đồng bộ hàng đợi với playerQueue và cpuQueue
        if (this.player && this.playerQueue && (!this.player.queue || this.player.queue.length === 0 || this.player.queue !== this.playerQueue)) {
            this.player.queue = this.playerQueue;
        }
        if (this.cpu && this.cpuQueue && (!this.cpu.queue || this.cpu.queue.length === 0 || this.cpu.queue !== this.cpuQueue)) {
            this.cpu.queue = this.cpuQueue;
        }

        this.currentStep = stepIndex;
        this.updateHUD();

        for (let i = 0; i < 4; i++) {
            const pSlot = document.getElementById(`p-slot-${i}`);
            const cSlot = document.getElementById(`c-slot-${i}`);
            if (pSlot) pSlot.classList.toggle('active-step', i === stepIndex);
            if (cSlot) cSlot.classList.toggle('active-step', i === stepIndex);
        }

        const pAct = this.playerQueue[stepIndex];
        const cAct = (this.cpu && this.cpu.queue && this.cpu.queue[stepIndex]) ? this.cpu.queue[stepIndex] : null;

        // Giải mã lệnh CPU chủ lực cho giao diện
        const cSlot = document.getElementById(`c-slot-${stepIndex}`);
        if (cSlot && cAct) {
            cSlot.className = 'queue-slot filled active-step';
            cSlot.innerHTML = `
                <span class="slot-step-num">#${stepIndex + 1}</span>
                <span class="slot-icon">${cAct.icon}</span>
                <span class="slot-name">${cAct.name}</span>
                <span class="slot-dir" style="letter-spacing: 2px;">${cAct.dirSymbol || ''}</span>
            `;
        }

        // Lấy danh sách toàn bộ chiến binh còn sống
        const allAlive = [...this.blueTeam, ...this.redTeam].filter(u => u.hp > 0);

        // Đặt lại trạng thái Khiên và hướng nhìn
        for (const unit of allAlive) {
            unit.shieldDir = null;
            const act = unit.queue ? unit.queue[stepIndex] : null;
            if (act && act.dir) {
                unit.dir = act.dir;
            }
        }

        // --- BƯỚC 1: Xử lý Khiên chắn (Shield Resolution) ---
        for (const unit of allAlive) {
            const act = unit.queue ? unit.queue[stepIndex] : null;
            if (act && act.type === 'SHIELD') {
                unit.shieldDir = act.dir;
                this.createShieldSpark(unit.x, unit.y, unit.color);
                this.addFloatingText(this.lang === 'en' ? 'SHIELD!' : 'KHIÊN!', unit.x, unit.y, unit.team === 'BLUE' ? '#38bdf8' : '#f43f5e');
                if (unit.isPlayer && window.soundCtrl) window.soundCtrl.playShield();
            }
        }

        await this.delay(180);

        // --- BƯỚC 2: Xử lý Nhảy Đột Kích (Leap Resolution) ---
        for (const unit of allAlive) {
            if (unit.hp <= 0) continue;
            const act = unit.queue ? unit.queue[stepIndex] : null;
            if (act && act.type === 'LEAP') {
                const uD = DIRECTIONS[act.dir];
                const startX = unit.x;
                const startY = unit.y;
                let destX = Math.max(0, Math.min(GRID_COLS - 1, startX + uD.dx * (act.range || 3)));
                let destY = Math.max(0, Math.min(GRID_ROWS - 1, startY + uD.dy * (act.range || 3)));

                const hasObstacle = allAlive.some(o => o !== unit && o.hp > 0 && o.x === destX && o.y === destY) ||
                                    this.groundHazards.some(h => h.x === destX && h.y === destY);
                let extraJump = false;
                if (hasObstacle) {
                    extraJump = true;
                    destX = Math.max(0, Math.min(GRID_COLS - 1, destX + uD.dx * (act.leapExtra || 2)));
                    destY = Math.max(0, Math.min(GRID_ROWS - 1, destY + uD.dy * (act.leapExtra || 2)));
                }

                if (window.soundCtrl && (unit.isPlayer || allAlive.length <= 4)) window.soundCtrl.playLeap();
                this.createLeapArc(startX, startY, destX, destY, unit.charThemeColor || unit.color);
                unit.x = destX;
                unit.y = destY;

                if (extraJump) {
                    this.addFloatingText(this.lang === 'en' ? '🦘 OBSTACLE! EXTRA 2 STEPS!' : '🦘 ĐÍCH CÓ VẬT THỂ/ĐỊCH! NHẢY THÊM 2 BƯỚC!', destX, destY, '#06b6d4');
                    this.addCombatLog(`Nhịp #${stepIndex + 1}: ${unit.name} [${act.name}] phát hiện vật thể/địch, nhảy tiếp 2 bước tới (${destX}, ${destY})!`, 'buff');
                } else {
                    this.addFloatingText(this.lang === 'en' ? '🦘 LEAP 3 TILES!' : '🦘 NHẢY 3 Ô!', destX, destY, '#06b6d4');
                    this.addCombatLog(`Nhịp #${stepIndex + 1}: ${unit.name} [${act.name}] vượt địa hình tới (${destX}, ${destY})!`, 'system');
                }
            }
        }

        // --- BƯỚC 3: Di chuyển Vi mô Đồng thời (Sub-tick Simultaneous Movement: PATH_MOVE & DASH) ---
        const movers = [];
        for (const unit of allAlive) {
            if (unit.hp <= 0) continue;
            const act = unit.queue ? unit.queue[stepIndex] : null;
            if (!act) continue;

            let subSteps = [];
            if (act.type === 'PATH_MOVE' && act.path) {
                subSteps = act.path;
            } else if (act.type === 'DASH') {
                const d = DIRECTIONS[act.dir];
                subSteps = [{ x: unit.x + d.dx * 2, y: unit.y + d.dy * 2, dir: act.dir }];
            }

            if (subSteps.length > 0) {
                movers.push({ unit, subSteps, act });
            }
        }

        const maxSubSteps = movers.reduce((max, m) => Math.max(max, m.subSteps.length), 0);

        for (let sub = 0; sub < maxSubSteps; sub++) {
            const nextPositions = new Map();
            for (const m of movers) {
                if (m.unit.hp <= 0) continue;
                if (sub < m.subSteps.length) {
                    const step = m.subSteps[sub];
                    const nx = Math.max(0, Math.min(GRID_COLS - 1, step.x));
                    const ny = Math.max(0, Math.min(GRID_ROWS - 1, step.y));
                    nextPositions.set(m.unit, { nx, ny, dir: step.dir || m.unit.dir, moving: true });
                } else {
                    nextPositions.set(m.unit, { nx: m.unit.x, ny: m.unit.y, dir: m.unit.dir, moving: false });
                }
            }

            // Kiểm tra va chạm đối đầu trực diện (Head-on collision: đổi chỗ cho nhau)
            for (let i = 0; i < movers.length; i++) {
                for (let j = i + 1; j < movers.length; j++) {
                    const uA = movers[i].unit;
                    const uB = movers[j].unit;
                    if (uA.team === uB.team) continue;
                    const pA = nextPositions.get(uA);
                    const pB = nextPositions.get(uB);
                    if (pA && pB && pA.moving && pB.moving && pA.nx === uB.x && pA.ny === uB.y && pB.nx === uA.x && pB.ny === uA.y) {
                        if (window.soundCtrl) window.soundCtrl.playClash();
                        const midX = (uA.x + uB.x) / 2;
                        const midY = (uA.y + uB.y) / 2;
                        this.createClashBurst(midX, midY);
                        this.addFloatingText(this.lang === 'en' ? 'HEAD-ON CLASH!' : 'ĐÂM NHAU!', midX, midY, '#fbbf24');
                        this.addCombatLog(`Nhịp #${stepIndex + 1}: ${uA.name} và ${uB.name} đâm trực diện! Dội lùi và mất 5 HP!`, 'clash');
                        this.applyDamage(uA, 5);
                        this.applyDamage(uB, 5);
                        pA.nx = uA.x; pA.ny = uA.y; pA.moving = false;
                        pB.nx = uB.x; pB.ny = uB.y; pB.moving = false;
                    }
                }
            }

            // Kiểm tra tranh chấp ô (Tile Contention: nhiều đơn vị cùng bước vào 1 ô)
            const tileClaims = new Map();
            for (const [unit, pos] of nextPositions.entries()) {
                if (!pos.moving) continue;
                const key = `${pos.nx},${pos.ny}`;
                if (!tileClaims.has(key)) tileClaims.set(key, []);
                tileClaims.get(key).push(unit);
            }

            for (const [key, claimants] of tileClaims.entries()) {
                if (claimants.length > 1) {
                    const [cx, cy] = key.split(',').map(Number);
                    if (window.soundCtrl) window.soundCtrl.playClash();
                    this.createClashBurst(cx, cy);
                    this.addFloatingText(this.lang === 'en' ? 'CLASH!' : 'VA CHẠM!', cx, cy, '#fbbf24');
                    this.addCombatLog(`Nhịp #${stepIndex + 1}: Nhiều đơn vị cùng lao vào ô (${cx}, ${cy}) -> DỘI LÙI!`, 'clash');
                    for (const u of claimants) {
                        this.applyDamage(u, 5);
                        const pos = nextPositions.get(u);
                        pos.nx = u.x; pos.ny = u.y; pos.moving = false;
                    }
                }
            }

            // Áp dụng di chuyển thực tế
            for (const [unit, pos] of nextPositions.entries()) {
                if (!pos.moving) continue;
                const isBlockedByStationary = allAlive.some(other => {
                    if (other === unit || other.hp <= 0) return false;
                    const otherPos = nextPositions.get(other);
                    const destX = otherPos ? otherPos.nx : other.x;
                    const destY = otherPos ? otherPos.ny : other.y;
                    return destX === pos.nx && destY === pos.ny && otherPos && !otherPos.moving;
                });

                if (isBlockedByStationary) {
                    this.addFloatingText(this.lang === 'en' ? 'BLOCKED!' : 'BỊ CHẶN!', unit.x, unit.y, '#cbd5e1');
                } else {
                    unit.x = pos.nx;
                    unit.y = pos.ny;
                    unit.dir = pos.dir;
                    if (unit.isPlayer && window.soundCtrl) window.soundCtrl.playMove();
                }
            }

            await this.delay(200);
        }

        await this.delay(120);

        // --- BƯỚC 4: Thực thi Tấn công & Kỹ năng (Attacks & Abilities) ---
        for (const actor of allAlive) {
            if (actor.hp <= 0) continue;
            const act = actor.queue ? actor.queue[stepIndex] : null;
            if (!act || act.type === 'SHIELD' || act.type === 'PATH_MOVE' || act.type === 'DASH' || act.type === 'LEAP') continue;

            await this.resolveUnitAttack(actor, act, stepIndex);
        }

        this.updateHUD();

        if (this.gameMode === 'DUEL') {
            const blueAliveCount = this.blueTeam.filter(u => u.hp > 0).length;
            const redAliveCount = this.redTeam.filter(u => u.hp > 0).length;

            if (blueAliveCount === 0 || redAliveCount === 0) {
                this.handleGameOver();
                return;
            }
        }

        await this.delay(450);
        this.executeResolutionStep(stepIndex + 1);
    }

    async resolveUnitAttack(actor, act, stepIndex) {
        const opposingTeam = (actor.team === 'BLUE') ? this.redTeam : this.blueTeam;
        const livingOpponents = opposingTeam.filter(u => u.hp > 0);
        const allLivingUnits = [...this.blueTeam, ...this.redTeam].filter(u => u.hp > 0);

        // Tính Buff sát thương của actor
        const hasAdrenaline = (actor.buffs && actor.buffs.adrenaline && actor.buffs.adrenaline.turnsLeft > 0);
        const hasCigarette = (actor.buffs && actor.buffs.cigarette && actor.buffs.cigarette.turnsLeft > 0);
        let dmgMult = 1.0;
        let buffTag = '';
        if (hasAdrenaline) {
            dmgMult *= 1.2;
            buffTag += ' (+20% Adrenaline)';
        }
        if (hasCigarette) {
            dmgMult *= 1.3;
            buffTag += ' (+30% Thuốc Lá)';
        }
        const hasBuffDmg = hasAdrenaline || hasCigarette;

        if (act.type === 'ATTACK') {
            const uD = DIRECTIONS[act.dir];
            const attackRange = act.range || 1;
            const targetX = actor.x + uD.dx * attackRange;
            const targetY = actor.y + uD.dy * attackRange;
            this.createSlashEffect(targetX, targetY, actor.charThemeColor || actor.color);

            const target = livingOpponents.find(u => u.x === targetX && u.y === targetY);
            if (target) {
                if (target.shieldDir) {
                    if (window.soundCtrl && (actor.isPlayer || target.isPlayer)) window.soundCtrl.playShield();
                    this.addFloatingText(this.lang === 'en' ? 'BLOCKED!' : 'CHẶN ĐƯỢC!', target.x, target.y, '#60a5fa');
                    this.addCombatLog(`Nhịp #${stepIndex + 1}: ${actor.name} chém ${target.name} bị Khiên chặn đứng! (0 DMG)`, 'block');
                } else {
                    if (window.soundCtrl && (actor.isPlayer || target.isPlayer)) window.soundCtrl.playHit();
                    let dmg = act.power || 25;
                    if (hasBuffDmg) dmg = Math.round(dmg * dmgMult);
                    const targetAct = target.queue ? target.queue[stepIndex] : null;
                    if (targetAct && targetAct.type === 'LEAP') dmg = Math.round(dmg * 0.75);

                    this.applyDamage(target, dmg);
                    this.createHitSparks(target.x, target.y, target.color);
                    this.addFloatingText(`-${dmg} HP!`, target.x, target.y, '#f87171');
                    this.addCombatLog(`Nhịp #${stepIndex + 1}: [${act.name}] ${actor.name} ĐÁNH TRÚNG ${target.name}! (-${dmg} HP${buffTag})`, 'hit');

                    if (target.charId === 'hookman') {
                        target.revealedTurns = 2;
                        if (target.isPlayer) this.playerRevealedTurns = 2;
                        this.addFloatingText(this.lang === 'en' ? 'REVEALED!' : 'HIỆN HÌNH!', target.x, target.y, '#f43f5e');
                    }
                }
            } else {
                if (window.soundCtrl && actor.isPlayer) window.soundCtrl.playAttack();
                this.addFloatingText(this.lang === 'en' ? 'MISS!' : 'HỤT!', targetX, targetY, '#94a3b8');
            }
        }
        else if (act.type === 'RANGED_LINE' || act.type === 'RANGED_VARIABLE') {
            const uD = DIRECTIONS[act.dir];
            const maxRange = act.range || 5;
            if (act.skillId === 'RAZOR_PULSE_RIFLE') {
                if (window.soundCtrl && (actor.isPlayer || livingOpponents.some(o => o.isPlayer))) window.soundCtrl.playPulseRifle();
            } else if (act.type === 'RANGED_VARIABLE') {
                if (window.soundCtrl && (actor.isPlayer || livingOpponents.some(o => o.isPlayer))) window.soundCtrl.playSilencedPistol();
            } else {
                if (window.soundCtrl && (actor.isPlayer || livingOpponents.some(o => o.isPlayer))) window.soundCtrl.playRifleShot();
            }

            let hit = false;
            let endX = actor.x + uD.dx * maxRange;
            let endY = actor.y + uD.dy * maxRange;

            for (let r = 1; r <= maxRange; r++) {
                const cx = actor.x + uD.dx * r;
                const cy = actor.y + uD.dy * r;
                if (cx < 0 || cx >= GRID_COLS || cy < 0 || cy >= GRID_ROWS) break;

                endX = cx;
                endY = cy;

                const target = livingOpponents.find(u => u.x === cx && u.y === cy);
                if (target) {
                    hit = true;
                    if (target.shieldDir) {
                        if (window.soundCtrl && (actor.isPlayer || target.isPlayer)) window.soundCtrl.playShield();
                        this.addFloatingText(this.lang === 'en' ? 'BLOCKED BULLET!' : 'CHẶN ĐƯỢC ĐẠN!', target.x, target.y, '#60a5fa');
                        this.addCombatLog(`Nhịp #${stepIndex + 1}: ${target.name} giương Khiên chặn loạt đạn ${act.name} từ ${actor.name}!`, 'block');
                    } else {
                        if (window.soundCtrl && (actor.isPlayer || target.isPlayer)) window.soundCtrl.playHit();
                        let dmg = (act.type === 'RANGED_VARIABLE') 
                            ? Math.floor(Math.random() * ((act.maxPower || 20) - (act.minPower || 15) + 1)) + (act.minPower || 15)
                            : (act.power || 20);
                        if (hasBuffDmg) dmg = Math.round(dmg * dmgMult);
                        const targetAct = target.queue ? target.queue[stepIndex] : null;
                        if (targetAct && targetAct.type === 'LEAP') dmg = Math.round(dmg * 0.75);

                        this.applyDamage(target, dmg);
                        this.createHitSparks(target.x, target.y, target.color);
                        this.addFloatingText(`-${dmg} HP!`, target.x, target.y, '#f87171');
                        this.addCombatLog(`Nhịp #${stepIndex + 1}: [${act.name}] ${actor.name} BẮN TRÚNG ${target.name}! Gây ${dmg} sát thương${buffTag}!`, 'hit');

                        if (target.charId === 'hookman') {
                            target.revealedTurns = 2;
                            if (target.isPlayer) this.playerRevealedTurns = 2;
                            this.addFloatingText(this.lang === 'en' ? 'REVEALED!' : 'HIỆN HÌNH!', target.x, target.y, '#f43f5e');
                        }
                    }
                    break;
                }
            }

            let tracerColor = '#34d399';
            if (act.skillId === 'SMOKE_RIFLE') tracerColor = '#fb923c';
            else if (act.skillId === 'RAZOR_PULSE_RIFLE') tracerColor = '#06b6d4';
            else if (act.type === 'RANGED_VARIABLE') tracerColor = '#a78bfa';
            this.createBulletTracer(actor.x, actor.y, endX, endY, tracerColor);

            if (!hit) {
                this.addFloatingText(this.lang === 'en' ? 'MISS!' : 'ĐẠN TRƯỢT!', endX, endY, '#94a3b8');
            }
        }
        else if (act.type === 'BUFF_HEAL') {
            if (window.soundCtrl && actor.isPlayer) window.soundCtrl.playAdrenaline();
            if (!actor.buffs) actor.buffs = {};
            if (!actor.buffs.adrenaline) actor.buffs.adrenaline = { turnsLeft: 0, healPerTurn: 5, dmgBonusPercent: 20 };
            actor.buffs.adrenaline.turnsLeft = act.duration || 3;
            if (actor.isPlayer && this.playerBuffs) this.playerBuffs.adrenaline.turnsLeft = act.duration || 3;

            this.createBuffSparks(actor.x, actor.y, '#10b981');
            this.addFloatingText(this.lang === 'en' ? '💉 ADRENALINE! (+20% DMG)' : '💉 TIÊM ADRENALINE! (+20% DMG)', actor.x, actor.y, '#10b981');
            this.addCombatLog(`Nhịp #${stepIndex + 1}: ${actor.name} tiêm [Adrenaline]! Tăng +20% Sát thương và hồi 5 HP/lượt!`, 'hit');
            actor.cooldowns[act.skillId] = act.cooldown || 3;
        }
        else if (act.type === 'BUFF_SMOKE') {
            if (window.soundCtrl && actor.isPlayer) window.soundCtrl.playCigarette();
            if (!actor.buffs) actor.buffs = {};
            if (!actor.buffs.cigarette) actor.buffs.cigarette = { turnsLeft: 0, dmgBonusPercent: 30, moveBonus: 1 };
            actor.buffs.cigarette.turnsLeft = act.duration || 2;
            if (actor.isPlayer && this.playerBuffs) this.playerBuffs.cigarette.turnsLeft = act.duration || 2;

            this.createBuffSparks(actor.x, actor.y, '#f97316');
            this.addFloatingText(this.lang === 'en' ? '🚬 SMOKING! (+30% DMG & +1 SPEED)' : '🚬 HÚT THUỐC! (+30% DMG & +1 BƯỚC)', actor.x, actor.y, '#f97316');
            this.addCombatLog(`Nhịp #${stepIndex + 1}: ${actor.name} châm [Thuốc Lá]! Tăng +30% Sát thương và +1 Tốc độ di chuyển!`, 'hit');
        }
        else if (act.type === 'HOOK_PULL') {
            const uD = DIRECTIONS[act.dir];
            const maxRange = act.range || 5;
            if (window.soundCtrl && (actor.isPlayer || livingOpponents.some(o => o.isPlayer))) window.soundCtrl.playHookThrow();

            let hit = false;
            let endX = actor.x + uD.dx * maxRange;
            let endY = actor.y + uD.dy * maxRange;

            for (let r = 1; r <= maxRange; r++) {
                const cx = actor.x + uD.dx * r;
                const cy = actor.y + uD.dy * r;
                if (cx < 0 || cx >= GRID_COLS || cy < 0 || cy >= GRID_ROWS) break;

                endX = cx;
                endY = cy;

                const target = livingOpponents.find(u => u.x === cx && u.y === cy);
                if (target) {
                    hit = true;
                    if (target.shieldDir) {
                        if (window.soundCtrl && (actor.isPlayer || target.isPlayer)) window.soundCtrl.playShield();
                        this.addFloatingText(this.lang === 'en' ? 'BLOCKED HOOK!' : 'KHIÊN CHẶN MÓC!', target.x, target.y, '#60a5fa');
                        this.addCombatLog(`Nhịp #${stepIndex + 1}: ${target.name} giương Khiên chặn đứng Móc Kéo từ ${actor.name}!`, 'block');
                    } else {
                        if (window.soundCtrl && (actor.isPlayer || target.isPlayer)) window.soundCtrl.playHit();
                        let dmg = act.power || 15;
                        if (hasBuffDmg) dmg = Math.round(dmg * dmgMult);
                        this.applyDamage(target, dmg);
                        this.createHitSparks(target.x, target.y, '#ef4444');

                        const pullX = Math.max(0, Math.min(GRID_COLS - 1, target.x - uD.dx));
                        const pullY = Math.max(0, Math.min(GRID_ROWS - 1, target.y - uD.dy));
                        if (pullX !== actor.x || pullY !== actor.y) {
                            target.x = pullX;
                            target.y = pullY;
                            if (window.soundCtrl && (actor.isPlayer || target.isPlayer)) window.soundCtrl.playHookPull();
                        }

                        this.addFloatingText(`-${dmg} HP & KÉO 1 Ô!`, target.x, target.y, '#ef4444');
                        this.addCombatLog(`Nhịp #${stepIndex + 1}: [Móc Kéo] ${actor.name} GĂM TRÚNG ${target.name}! (-${dmg} HP${buffTag}) và kéo lại gần 1 ô!`, 'hit');

                        this.activeHookTethers = this.activeHookTethers.filter(t => t.sourceId !== actor.id);
                        this.activeHookTethers.push({
                            sourceId: actor.id,
                            targetId: target.id,
                            source: actor.isPlayer ? 'PLAYER' : 'CPU',
                            target: target.isPlayer ? 'PLAYER' : 'CPU',
                            sourceUnit: actor,
                            targetUnit: target,
                            turnsUntilPull: 1,
                            pullDist: 2,
                            skillId: act.skillId,
                            cdAfterPull: act.cooldown || 4
                        });
                        this.addCombatLog(`🪝 Dây móc đã găm chặt vào ${target.name}! Hết lượt sau sẽ bị giật kéo thêm 2 ô!`, 'clash');
                    }
                    break;
                }
            }

            this.createHookChainEffect(actor.x, actor.y, endX, endY);
            if (!hit) {
                this.addFloatingText(this.lang === 'en' ? 'HOOK MISSED!' : 'MÓC HỤT!', endX, endY, '#94a3b8');
                actor.cooldowns[act.skillId] = act.cooldown || 4;
            }
        }
        else if (act.type === 'ROCKET' || act.type === 'BOMB_LAUNCHER') {
            const isBombLauncher = (act.type === 'BOMB_LAUNCHER');
            const uD = DIRECTIONS[act.dir];
            const maxRange = act.range || 6;

            if (isBombLauncher) {
                if (window.soundCtrl && (actor.isPlayer || livingOpponents.some(o => o.isPlayer))) window.soundCtrl.playBombLauncher();
                const curAmmo = actor.skillAmmo[act.skillId] !== undefined ? actor.skillAmmo[act.skillId] : 2;
                const remAmmo = Math.max(0, curAmmo - 1);
                actor.skillAmmo[act.skillId] = remAmmo;
                if (actor.isPlayer && this.skillAmmo) this.skillAmmo[act.skillId] = remAmmo;
                if (actor === this.cpu && this.cpuSkillAmmo) this.cpuSkillAmmo[act.skillId] = remAmmo;
                if (remAmmo === 0) {
                    actor.cooldowns[act.skillId] = act.cooldown || 4;
                    if (actor.isPlayer && this.cooldowns) this.cooldowns[act.skillId] = act.cooldown || 4;
                    if (actor === this.cpu && this.cpuCooldowns) this.cpuCooldowns[act.skillId] = act.cooldown || 4;
                    this.addCombatLog(`⚠️ ${actor.name} [Súng Bắn Bom] hết đạn! Hồi chiêu 4 lượt để nạp đạn!`, 'system');
                }
            } else {
                if (window.soundCtrl && (actor.isPlayer || livingOpponents.some(o => o.isPlayer))) window.soundCtrl.playRocketLaunch();
            }

            let targetX = actor.x + uD.dx * maxRange;
            let targetY = actor.y + uD.dy * maxRange;

            for (let r = 1; r <= maxRange; r++) {
                const cx = actor.x + uD.dx * r;
                const cy = actor.y + uD.dy * r;
                if (cx < 0 || cx >= GRID_COLS || cy < 0 || cy >= GRID_ROWS) break;

                targetX = cx;
                targetY = cy;

                const hitUnit = livingOpponents.find(u => u.x === cx && u.y === cy);
                if (hitUnit) break;
            }

            targetX = Math.max(0, Math.min(GRID_COLS - 1, targetX));
            targetY = Math.max(0, Math.min(GRID_ROWS - 1, targetY));

            this.createRocketTrail(actor.x, actor.y, targetX, targetY, isBombLauncher ? '#f97316' : '#ef4444');
            await this.delay(180);

            if (window.soundCtrl) window.soundCtrl.playExplosion();
            this.createExplosionBurst(targetX, targetY, 40);

            this.addFloatingText('💥 NỔ 3x3!', targetX, targetY, isBombLauncher ? '#f97316' : '#ef4444');
            this.addCombatLog(`Nhịp #${stepIndex + 1}: ${actor.name} bắn [${act.name}] phát nổ 3x3 tại (${targetX}, ${targetY})!`, 'clash');

            let baseDmg = act.power || 30;
            if (hasBuffDmg) baseDmg = Math.round(baseDmg * dmgMult);

            for (const u of allLivingUnits) {
                if (Math.abs(u.x - targetX) <= 1 && Math.abs(u.y - targetY) <= 1) {
                    const uAct = u.queue ? u.queue[stepIndex] : null;
                    let uDmg = (u === actor) ? (act.power || 30) : baseDmg;
                    if (uAct && uAct.type === 'LEAP') uDmg = Math.round(uDmg * 0.75);

                    this.applyDamage(u, uDmg);
                    this.createHitSparks(u.x, u.y, u.color);
                    this.addFloatingText(`-${uDmg} HP!`, u.x, u.y, '#f87171');
                    this.addCombatLog(`💥 Vụ nổ ${act.name} trúng ${u.name}! (-${uDmg} HP)!`, 'hit');

                    if (u.charId === 'hookman') {
                        u.revealedTurns = 2;
                        if (u.isPlayer) this.playerRevealedTurns = 2;
                    }
                }
            }
        }
        else if (act.type === 'GRENADE') {
            const uD = DIRECTIONS[act.dir];
            const maxRange = act.range || 5;
            let targetX = (act.targetX !== undefined) ? act.targetX : actor.x + uD.dx * maxRange;
            let targetY = (act.targetY !== undefined) ? act.targetY : actor.y + uD.dy * maxRange;

            if (act.targetX === undefined) {
                for (let r = 1; r <= maxRange; r++) {
                    const cx = actor.x + uD.dx * r;
                    const cy = actor.y + uD.dy * r;
                    if (livingOpponents.some(u => u.x === cx && u.y === cy)) {
                        targetX = cx; targetY = cy;
                        break;
                    }
                }
            }

            targetX = Math.max(0, Math.min(GRID_COLS - 1, targetX));
            targetY = Math.max(0, Math.min(GRID_ROWS - 1, targetY));

            this.createGrenadeArc(actor.x, actor.y, targetX, targetY);
            if (window.soundCtrl && (actor.isPlayer || livingOpponents.some(o => o.isPlayer))) window.soundCtrl.playGrenadeTick();

            this.groundHazards.push({
                id: Date.now() + Math.random(),
                type: 'GRENADE',
                x: targetX,
                y: targetY,
                turnsLeft: 2,
                power: act.power || 50,
                aoeRadius: 1,
                owner: actor.isPlayer ? 'PLAYER' : 'CPU',
                ownerId: actor.id,
                ownerName: actor.name
            });

            this.addFloatingText('💣 LỰU ĐẠN (ĐẾM 2 LƯỢT)!', targetX, targetY, '#f59e0b');
            this.addCombatLog(`Nhịp #${stepIndex + 1}: ${actor.name} ném lựu đạn tới (${targetX}, ${targetY})! Sẽ nổ 3x3 sau 2 lượt!`, 'clash');
        }
        else if (act.type === 'RECT_SLASH') {
            if (window.soundCtrl && (actor.isPlayer || livingOpponents.some(o => o.isPlayer))) window.soundCtrl.playCyberBladeSlash();

            const curAmmo = actor.skillAmmo[act.skillId] !== undefined ? actor.skillAmmo[act.skillId] : 2;
            const remAmmo = Math.max(0, curAmmo - 1);
            actor.skillAmmo[act.skillId] = remAmmo;
            if (actor.isPlayer && this.skillAmmo) this.skillAmmo[act.skillId] = remAmmo;
            if (actor === this.cpu && this.cpuSkillAmmo) this.cpuSkillAmmo[act.skillId] = remAmmo;

            if (remAmmo === 0) {
                actor.cooldowns[act.skillId] = act.cooldown || 4;
                if (actor.isPlayer && this.cooldowns) this.cooldowns[act.skillId] = act.cooldown || 4;
                if (actor === this.cpu && this.cpuCooldowns) this.cpuCooldowns[act.skillId] = act.cooldown || 4;
                this.addCombatLog(`⚠️ ${actor.name} [Kiếm Gắn Tay] dùng hết 2 lượt! Bắt đầu hồi chiêu 4 lượt!`, 'system');
            }

            const slashTiles = this.getRectSlashTiles(actor.x, actor.y, act.dir);
            this.createRectSlashEffect(slashTiles, actor.charThemeColor || '#06b6d4');
            await this.delay(220);

            let hitAny = false;
            for (const target of livingOpponents) {
                if (slashTiles.some(t => t.x === target.x && t.y === target.y)) {
                    hitAny = true;
                    if (target.shieldDir) {
                        if (window.soundCtrl && (actor.isPlayer || target.isPlayer)) window.soundCtrl.playShield();
                        this.addFloatingText(this.lang === 'en' ? 'BLOCKED BLADE!' : 'CHẶN ĐỨNG KIẾM!', target.x, target.y, '#60a5fa');
                        this.addCombatLog(`Nhịp #${stepIndex + 1}: ${target.name} giương Khiên chặn đứng Kiếm Gắn Tay từ ${actor.name}! (0 DMG)`, 'block');
                    } else {
                        if (window.soundCtrl && (actor.isPlayer || target.isPlayer)) window.soundCtrl.playHit();
                        let dmg = act.power || 60;
                        if (hasBuffDmg) dmg = Math.round(dmg * dmgMult);
                        const targetAct = target.queue ? target.queue[stepIndex] : null;
                        if (targetAct && targetAct.type === 'LEAP') dmg = Math.round(dmg * 0.75);

                        this.applyDamage(target, dmg);
                        this.createHitSparks(target.x, target.y, '#06b6d4');
                        this.addFloatingText(`-${dmg} HP!`, target.x, target.y, '#f87171');
                        this.addCombatLog(`Nhịp #${stepIndex + 1}: 🗡️ [Kiếm Gắn Tay] ${actor.name} CHÉM QUÉT 3x2 TRÚNG ${target.name}! (-${dmg} HP${buffTag})!`, 'hit');

                        if (target.charId === 'hookman') {
                            target.revealedTurns = 2;
                            if (target.isPlayer) this.playerRevealedTurns = 2;
                            this.addFloatingText(this.lang === 'en' ? 'REVEALED!' : 'HIỆN HÌNH!', target.x, target.y, '#f43f5e');
                        }
                    }
                }
            }

            if (!hitAny) {
                this.addFloatingText(this.lang === 'en' ? 'MISS!' : 'CHÉM HỤT!', actor.x, actor.y, '#94a3b8');
            }
        }
    }

    finishTurn() {
        this.addCombatLog(`${this.lang === 'en' ? 'Completed Turn' : 'Hoàn thành Lượt'} ${this.turn}!`, 'system');

        const allUnits = [...this.blueTeam, ...this.redTeam];

        // 0 & 1 & 2 & 3. Cập nhật trạng thái từng đấu thủ còn sống
        for (const unit of allUnits) {
            if (unit.hp <= 0) continue;

            // 0. Giảm thời gian lộ diện của Hookman
            if (unit.revealedTurns > 0) {
                unit.revealedTurns--;
                if (unit.isPlayer) this.playerRevealedTurns = unit.revealedTurns;
                if (unit.revealedTurns === 0) {
                    this.addCombatLog(`👁️ ${unit.name} đã xóa sạch dấu vết, có thể tàng hình trở lại nếu ngoài 7x7!`, 'system');
                }
            }

            // 1. Hồi phục máu Adrenaline cuối mỗi lượt (+5 HP, kéo dài 3 lượt)
            if (unit.buffs && unit.buffs.adrenaline && unit.buffs.adrenaline.turnsLeft > 0) {
                const healAmount = Math.min(5, unit.maxHp - unit.hp);
                unit.hp += healAmount;
                unit.buffs.adrenaline.turnsLeft--;
                if (unit.isPlayer && this.playerBuffs) this.playerBuffs.adrenaline.turnsLeft = unit.buffs.adrenaline.turnsLeft;

                if (unit.isPlayer && window.soundCtrl) window.soundCtrl.playSelect();
                this.createBuffSparks(unit.x, unit.y, '#10b981');
                this.addFloatingText(`+${healAmount} HP (ADRENALINE)`, unit.x, unit.y, '#10b981');
                this.addCombatLog(`💉 Cuối lượt: ${unit.name} Adrenaline hồi phục +${healAmount} HP! (Còn ${unit.buffs.adrenaline.turnsLeft}L)`, 'hit');
            }

            // 2. Giảm thời gian hồi chiêu
            for (const skillId in unit.cooldowns) {
                if (unit.cooldowns[skillId] > 0) {
                    unit.cooldowns[skillId]--;
                    if (unit.cooldowns[skillId] === 0) {
                        if (skillId === 'SMOKE_BOMB_LAUNCHER') {
                            unit.skillAmmo['SMOKE_BOMB_LAUNCHER'] = 2;
                            if (unit.isPlayer && this.skillAmmo) this.skillAmmo['SMOKE_BOMB_LAUNCHER'] = 2;
                            this.addCombatLog(`🔄 ${unit.name} [Súng Bắn Bom] nạp lại đầy đủ 2/2 viên đạn!`, 'system');
                        } else if (skillId === 'RAZOR_BLADE') {
                            unit.skillAmmo['RAZOR_BLADE'] = 2;
                            if (unit.isPlayer && this.skillAmmo) this.skillAmmo['RAZOR_BLADE'] = 2;
                            this.addCombatLog(`🔄 ${unit.name} [Kiếm Gắn Tay] nạp lại đầy đủ 2/2 lượt chém!`, 'system');
                        } else {
                            this.addCombatLog(`✨ ${unit.name} Kỹ năng [${skillId}] đã hồi chiêu xong!`, 'system');
                        }
                    }
                }
            }

            // 3. Giảm thời gian Buff Thuốc Lá (Smoke guy: +30% DMG, +1 Bước trong 2 lượt)
            if (unit.buffs && unit.buffs.cigarette && unit.buffs.cigarette.turnsLeft > 0) {
                unit.buffs.cigarette.turnsLeft--;
                if (unit.isPlayer && this.playerBuffs) this.playerBuffs.cigarette.turnsLeft = unit.buffs.cigarette.turnsLeft;
                if (unit.buffs.cigarette.turnsLeft === 0) {
                    unit.cooldowns['SMOKE_CIGARETTE'] = 3;
                    this.addCombatLog(`⏳ Khói [Thuốc Lá] của ${unit.name} đã tàn, bắt đầu hồi chiêu 3 lượt!`, 'system');
                }
            }
        }

        // 4. Kích hoạt kéo Dây Móc Hookman (Hết lượt sau kéo 2 ô)
        const remainingTethers = [];
        for (const tether of this.activeHookTethers) {
            const hooker = tether.sourceUnit || (tether.source === 'PLAYER' ? this.player : this.cpu);
            const victim = tether.targetUnit || (tether.target === 'CPU' ? this.cpu : this.player);

            if (tether.turnsUntilPull <= 0) {
                if (hooker && victim && hooker.hp > 0 && victim.hp > 0) {
                    let pulledSteps = 0;
                    for (let s = 0; s < (tether.pullDist || 2); s++) {
                        const stepDx = Math.sign(hooker.x - victim.x);
                        const stepDy = Math.sign(hooker.y - victim.y);
                        if (stepDx === 0 && stepDy === 0) break;

                        const nextVx = Math.max(0, Math.min(GRID_COLS - 1, victim.x + stepDx));
                        const nextVy = Math.max(0, Math.min(GRID_ROWS - 1, victim.y + stepDy));
                        if (nextVx === hooker.x && nextVy === hooker.y) break;

                        victim.x = nextVx;
                        victim.y = nextVy;
                        pulledSteps++;
                    }

                    if (window.soundCtrl) window.soundCtrl.playHookPull();
                    this.createHitSparks(victim.x, victim.y, '#ef4444');
                    this.addFloatingText(`🪝 GIẬT MÓC ${pulledSteps} Ô!`, victim.x, victim.y, '#ef4444');
                    this.addCombatLog(`💥 HẾT LƯỢT SAU: Dây xích siết mạnh, giật ${victim.name} lại gần ${pulledSteps} ô!`, 'clash');

                    hooker.cooldowns[tether.skillId] = tether.cdAfterPull || 4;
                    this.addCombatLog(`⏳ [Móc Kéo] của ${hooker.name} đã hoàn tất chuỗi kéo, hồi chiêu 4 lượt!`, 'system');
                }
            } else {
                tether.turnsUntilPull--;
                this.addCombatLog(`🪝 Dây móc vẫn đang găm chặt vào ${victim ? victim.name : 'đối thủ'}, sẽ siết kéo vào cuối lượt sau!`, 'system');
                remainingTethers.push(tether);
            }
        }
        this.activeHookTethers = remainingTethers;

        // 5. Kích hoạt đếm lùi lựu đạn hẹn giờ
        const detonatedHazards = [];
        this.groundHazards.forEach(h => {
            h.turnsLeft--;
            if (h.turnsLeft <= 0) {
                detonatedHazards.push(h);
            }
        });

        detonatedHazards.forEach(h => {
            if (window.soundCtrl) window.soundCtrl.playExplosion();
            this.createExplosionBurst(h.x, h.y, 45);
            this.addFloatingText('💥 BÙM! LỰU ĐẠN NỔ (50 DMG)!', h.x, h.y, '#ef4444');
            this.addCombatLog(`💥 LỰU ĐẠN TẠI (${h.x}, ${h.y}) PHÁT NỔ! Quét sạch khu vực 3x3 với 50 sát thương!`, 'clash');

            for (const u of allUnits) {
                if (u.hp > 0 && Math.abs(u.x - h.x) <= 1 && Math.abs(u.y - h.y) <= 1) {
                    this.applyDamage(u, h.power);
                    this.createHitSparks(u.x, u.y, u.color);
                    this.addFloatingText(`-${h.power} HP! (LỰU ĐẠN)`, u.x, u.y, '#f87171');
                    this.addCombatLog(`➔ ${u.name} dính trọn vụ nổ Lựu Đạn! Mất ${h.power} HP!`, 'hit');

                    if (u.charId === 'hookman') {
                        u.revealedTurns = 2;
                        if (u.isPlayer) this.playerRevealedTurns = 2;
                        this.addFloatingText(this.lang === 'en' ? 'REVEALED!' : 'HIỆN HÌNH!', u.x, u.y, '#f43f5e');
                    }
                }
            }
        });

        this.groundHazards = this.groundHazards.filter(h => h.turnsLeft > 0);

        // 6. Xử lý Hồi sinh trong Chế độ KOTH (Áp dụng cho tất cả nhân vật sau 2 lượt)
        if (this.gameMode === 'KOTH') {
            for (const u of allUnits) {
                if (u.hp <= 0) {
                    if (u.respawnTurns > 0) {
                        u.respawnTurns--;
                    }
                    if (u.respawnTurns <= 0) {
                        u.hp = u.maxHp;
                        u.isDead = false;
                        u.alive = true;
                        const spawnPos = this.getRespawnPosition(u.team, u.index);
                        u.x = spawnPos.x;
                        u.y = spawnPos.y;
                        u.renderX = spawnPos.x;
                        u.renderY = spawnPos.y;
                        u.revealedTurns = 0;
                        for (const sId in u.cooldowns) {
                            u.cooldowns[sId] = 0;
                        }
                        if (u.character && u.character.skills) {
                            u.character.skills.forEach(s => {
                                if (s.maxAmmo) u.skillAmmo[s.id] = s.maxAmmo;
                            });
                        }
                        this.addCombatLog(t('respawnLogMsg', { name: u.name }), 'system');
                        this.addFloatingText('✨ HỒI SINH!', u.x, u.y, '#10b981');
                        this.createBuffSparks(u.x, u.y, '#10b981');
                        if (u.isPlayer && window.soundCtrl) window.soundCtrl.playSelect();
                    }
                }
            }
        }

        // 7. Đánh giá Cứ Điểm 5x5 & Tích lũy Điểm Chế độ KOTH
        if (this.gameMode === 'KOTH') {
            const blueInZone = this.blueTeam.filter(u => u.hp > 0 && this.isInCaptureZone(u.x, u.y)).length;
            const redInZone = this.redTeam.filter(u => u.hp > 0 && this.isInCaptureZone(u.x, u.y)).length;

            if (blueInZone > 0 && redInZone === 0) {
                // Đội Xanh chiếm mà không có đối thủ tranh chấp
                if (this.hillScale < 2) {
                    this.hillScale++;
                    this.addCombatLog(
                        this.hillScale === 2
                            ? (this.lang === 'en' ? '🚩 BLUE SQUAD CAPTURED THE 5x5 HILL! (+1 Point/Turn)' : '🚩 ĐỘI XANH ĐÃ CHIẾM ĐƯỢC CỨ ĐIỂM 5x5! (+1 Điểm/Lượt)')
                            : (this.lang === 'en' ? `🚩 Blue capturing the Hill (${this.hillScale}/2)` : `🚩 Đội Xanh đang tiến chiếm cứ điểm! (Trạng thái: ${this.hillScale}/2)`),
                        'hit'
                    );
                }
            } else if (redInZone > 0 && blueInZone === 0) {
                // Đội Đỏ chiếm mà không có đối thủ tranh chấp
                if (this.hillScale > -2) {
                    this.hillScale--;
                    this.addCombatLog(
                        this.hillScale === -2
                            ? (this.lang === 'en' ? '🚩 RED SQUAD CAPTURED THE 5x5 HILL! (+1 Point/Turn)' : '🚩 ĐỘI ĐỎ ĐÃ CHIẾM ĐƯỢC CỨ ĐIỂM 5x5! (+1 Điểm/Lượt)')
                            : (this.lang === 'en' ? `🚩 Red capturing the Hill (${Math.abs(this.hillScale)}/2)` : `🚩 Đội Đỏ đang tiến chiếm cứ điểm! (Trạng thái: ${Math.abs(this.hillScale)}/2)`),
                        'clash'
                    );
                }
            } else if (blueInZone > 0 && redInZone > 0) {
                this.addCombatLog(
                    this.lang === 'en'
                        ? `⚔️ CONTESTED! Both teams have units on the Hill (${blueInZone} Blue vs ${redInZone} Red)! Status frozen!`
                        : `⚔️ TRANH CHẤP! Cả 2 đội đều có người tại Cứ Điểm (${blueInZone} Xanh vs ${redInZone} Đỏ)! Trạng thái bị khóa!`,
                    'system'
                );
            }

            // Ghi 1 điểm cho mỗi lượt khi status đạt số 2 (hoặc -2 cho Red)
            if (this.hillScale === 2) {
                this.blueScore++;
                this.addFloatingText('+1 ĐIỂM!', 10, 3, '#38bdf8');
                this.addCombatLog(
                    this.lang === 'en'
                        ? `⭐ Blue controls the Hill: +1 Point! (${this.blueScore}/${this.SCORE_LIMIT})`
                        : `⭐ Đội Xanh kiểm soát Cứ Điểm: +1 Điểm! (${this.blueScore}/${this.SCORE_LIMIT})`,
                    'system'
                );
            } else if (this.hillScale === -2) {
                this.redScore++;
                this.addFloatingText('+1 ĐIỂM!', 10, 3, '#f43f5e');
                this.addCombatLog(
                    this.lang === 'en'
                        ? `⭐ Red controls the Hill: +1 Point! (${this.redScore}/${this.SCORE_LIMIT})`
                        : `⭐ Đội Đỏ kiểm soát Cứ Điểm: +1 Điểm! (${this.redScore}/${this.SCORE_LIMIT})`,
                    'system'
                );
            }

            // Kiểm tra Điều kiện Thắng & Overtime
            const blueReached = this.blueScore >= this.SCORE_LIMIT;
            const redReached = this.redScore >= this.SCORE_LIMIT;

            if (blueReached && !redReached) {
                if (redInZone > 0 || this.hillScale !== 2) {
                    this.inOvertime = true;
                    this.addCombatLog(t('kothOvertimeNotice'), 'clash');
                } else {
                    this.handleGameOver('BLUE_KOTH');
                    return;
                }
            } else if (redReached && !blueReached) {
                if (blueInZone > 0 || this.hillScale !== -2) {
                    this.inOvertime = true;
                    this.addCombatLog(t('kothOvertimeNotice'), 'clash');
                } else {
                    this.handleGameOver('RED_KOTH');
                    return;
                }
            } else if (blueReached && redReached) {
                if (this.hillScale === 2 && redInZone === 0) {
                    this.handleGameOver('BLUE_KOTH');
                    return;
                } else if (this.hillScale === -2 && blueInZone === 0) {
                    this.handleGameOver('RED_KOTH');
                    return;
                } else {
                    this.inOvertime = true;
                    this.addCombatLog(t('kothOvertimeNotice'), 'clash');
                }
            }
        } else {
            // Chế độ DUEL 1v1
            const blueAliveCount = this.blueTeam.filter(u => u.hp > 0).length;
            const redAliveCount = this.redTeam.filter(u => u.hp > 0).length;

            if (blueAliveCount === 0 || redAliveCount === 0) {
                this.handleGameOver();
                return;
            }
        }

        this.turn++;
        this.phase = 'PLANNING';
        this.currentStep = -1;
        this.cpuQueue = [];
        for (const u of allUnits) {
            u.shieldDir = null;
        }

        if (this.gameMode === 'KOTH' && this.player && this.player.hp <= 0) {
            const respawnLabel = t('respawningTag', { turns: this.player.respawnTurns });
            this.playerQueue = [
                { type: 'WAIT', name: respawnLabel, icon: '💀', desc: 'Đang chờ hồi sinh' },
                { type: 'WAIT', name: respawnLabel, icon: '💀', desc: 'Đang chờ hồi sinh' },
                { type: 'WAIT', name: respawnLabel, icon: '💀', desc: 'Đang chờ hồi sinh' },
                { type: 'WAIT', name: respawnLabel, icon: '💀', desc: 'Đang chờ hồi sinh' }
            ];
        } else {
            this.playerQueue = [];
        }

        for (let i = 0; i < 4; i++) {
            const pSlot = document.getElementById(`p-slot-${i}`);
            const cSlot = document.getElementById(`c-slot-${i}`);
            if (pSlot) pSlot.classList.remove('active-step');
            if (cSlot) {
                cSlot.classList.remove('active-step');
                cSlot.className = 'queue-slot';
                cSlot.innerHTML = `<span class="slot-step-num">#${i + 1}</span><span class="slot-icon">🔒</span><span class="slot-name">${this.lang === 'en' ? 'Secret' : 'Bí mật'}</span>`;
            }
        }

        if (this.player) {
            this.cooldowns = this.player.cooldowns;
            this.skillAmmo = this.player.skillAmmo;
            this.playerBuffs = this.player.buffs;
        }
        if (this.cpu) {
            this.cpuCooldowns = this.cpu.cooldowns;
            this.cpuSkillAmmo = this.cpu.skillAmmo;
            this.cpuBuffs = this.cpu.buffs;
        }

        this.updateSkillButtons();
        this.updateQueueDisplay();
        this.updateHUD();
    }

    applyDamage(entity, amount) {
        entity.hp = Math.max(0, entity.hp - amount);
        if (entity.hp === 0 && this.gameMode === 'KOTH' && !entity.isDead) {
            entity.isDead = true;
            entity.alive = false;
            entity.respawnTurns = this.RESPAWN_TURNS;
            this.addCombatLog(`💀 ${entity.name} ${this.lang === 'en' ? 'was eliminated! Respawning in 2 turns...' : 'đã hy sinh! Hồi sinh sau 2 lượt...'}`, 'clash');
            this.addFloatingText('💀 K.O! (RESPAWN 2L)', entity.x, entity.y, '#f43f5e');
        }
    }

    handleGameOver(kothWinner = null) {
        this.phase = 'GAMEOVER';
        const modal = document.getElementById('gameModal');
        const title = document.getElementById('modalTitle');
        const desc = document.getElementById('modalDesc');

        if (this.gameMode === 'KOTH') {
            const blueAlive = this.blueTeam.filter(u => u.hp > 0).length;
            const redAlive = this.redTeam.filter(u => u.hp > 0).length;
            const isBlueVictory = kothWinner === 'BLUE_KOTH' || (kothWinner === null && (this.blueScore > this.redScore || (redAlive === 0 && blueAlive > 0)));
            if (isBlueVictory) {
                title.innerText = t('modalVictoryKothTitle');
                title.className = 'modal-title victory';
                desc.innerText = t('modalVictoryKothDesc');
                if (window.soundCtrl) window.soundCtrl.playVictory();
            } else {
                title.innerText = t('modalDefeatKothTitle');
                title.className = 'modal-title defeat';
                desc.innerText = t('modalDefeatKothDesc');
                if (window.soundCtrl) window.soundCtrl.playDefeat();
            }
        } else {
            const blueAlive = this.blueTeam.filter(u => u.hp > 0).length;
            const redAlive = this.redTeam.filter(u => u.hp > 0).length;

            if (blueAlive === 0 && redAlive === 0) {
                title.innerText = t('modalDrawTitle');
                title.className = 'modal-title clash';
                desc.innerText = t('modalDrawDesc');
            } else if (redAlive === 0) {
                title.innerText = t('modalVictoryTitle');
                title.className = 'modal-title victory';
                desc.innerText = this.lang === 'en'
                    ? `VICTORY! You eliminated your rival on Turn ${this.turn}!`
                    : `CHIẾN THẮNG! Bạn đã hạ gục đối thủ ở Lượt ${this.turn}!`;
                if (window.soundCtrl) window.soundCtrl.playVictory();
            } else {
                title.innerText = t('modalDefeatTitle');
                title.className = 'modal-title defeat';
                desc.innerText = this.lang === 'en'
                    ? `DEFEAT! You were eliminated on Turn ${this.turn}. Adjust your tactics!`
                    : `THẤT BẠI! Bạn đã bị hạ gục ở Lượt ${this.turn}. Hãy thử lại!`;
                if (window.soundCtrl) window.soundCtrl.playDefeat();
            }
        }

        modal.style.display = 'flex';
        this.updateHUD();
    }

    restartGame() {
        const modal = document.getElementById('gameModal');
        if (modal) modal.style.display = 'none';
        this.turn = 1;
        this.phase = 'PLANNING';
        this.currentStep = -1;
        this.cancelPathPlanning();
        this.setupTeams();
        this.hillScale = 0;
        this.blueScore = 0;
        this.redScore = 0;
        this.inOvertime = false;

        this.groundHazards = [];
        this.playerRevealedTurns = 0;
        this.cpuRevealedTurns = 0;
        this.activeHookTethers = [];

        this.playerQueue = [];
        this.cpuQueue = [];
        this.floatingTexts = [];
        this.particles = [];

        const logElem = document.getElementById('combatLog');
        if (logElem) {
            logElem.innerHTML = `<div class="log-entry system">${this.lang === 'en' ? 'New squad battle commenced!' : 'Trận đại chiến đội hình mới đã bắt đầu!'}</div>`;
        }
        this.addCombatLog(this.lang === 'en'
            ? `Squad Battle: Blue Team (${this.blueTeamSize} units) vs Red Team (${this.redTeamSize} units)!`
            : `Đại chiến Đội hình: Đội Xanh (${this.blueTeamSize} người) vs Đội Đỏ (${this.redTeamSize} người)!`, 'system');

        this.updateSkillButtons();
        this.updateHUD();
        this.updateQueueDisplay();
        this.updateCamera(true);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // --- Tính toán phạm vi hình chữ nhật 3x2 của Kiếm Gắn Tay (Razor) ---
    getRectSlashTiles(fromX, fromY, dir) {
        const tiles = [];
        const validDir = ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(dir) ? dir : 'RIGHT';

        if (validDir === 'RIGHT') {
            // Xa 2 ô theo trục X (+1, +2), Rộng 3 ô theo trục Y (-1, 0, +1)
            for (let dx = 1; dx <= 2; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const tx = fromX + dx;
                    const ty = fromY + dy;
                    if (tx >= 0 && tx < GRID_COLS && ty >= 0 && ty < GRID_ROWS) {
                        tiles.push({ x: tx, y: ty });
                    }
                }
            }
        } else if (validDir === 'LEFT') {
            // Xa 2 ô theo trục X (-1, -2), Rộng 3 ô theo trục Y (-1, 0, +1)
            for (let dx = -1; dx >= -2; dx--) {
                for (let dy = -1; dy <= 1; dy++) {
                    const tx = fromX + dx;
                    const ty = fromY + dy;
                    if (tx >= 0 && tx < GRID_COLS && ty >= 0 && ty < GRID_ROWS) {
                        tiles.push({ x: tx, y: ty });
                    }
                }
            }
        } else if (validDir === 'UP') {
            // Xa 2 ô theo trục Y (-1, -2), Rộng 3 ô theo trục X (-1, 0, +1)
            for (let dy = -1; dy >= -2; dy--) {
                for (let dx = -1; dx <= 1; dx++) {
                    const tx = fromX + dx;
                    const ty = fromY + dy;
                    if (tx >= 0 && tx < GRID_COLS && ty >= 0 && ty < GRID_ROWS) {
                        tiles.push({ x: tx, y: ty });
                    }
                }
            }
        } else if (validDir === 'DOWN') {
            // Xa 2 ô theo trục Y (+1, +2), Rộng 3 ô theo trục X (-1, 0, +1)
            for (let dy = 1; dy <= 2; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const tx = fromX + dx;
                    const ty = fromY + dy;
                    if (tx >= 0 && tx < GRID_COLS && ty >= 0 && ty < GRID_ROWS) {
                        tiles.push({ x: tx, y: ty });
                    }
                }
            }
        }
        return tiles;
    }

    createLeapArc(x1, y1, x2, y2, color = '#06b6d4') {
        const cx1 = x1 * CELL_SIZE + CELL_SIZE / 2;
        const cy1 = y1 * CELL_SIZE + CELL_SIZE / 2;
        const cx2 = x2 * CELL_SIZE + CELL_SIZE / 2;
        const cy2 = y2 * CELL_SIZE + CELL_SIZE / 2;
        const steps = 24;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const arcY = -Math.sin(t * Math.PI) * 45;
            this.particles.push({
                x: cx1 + (cx2 - cx1) * t + (Math.random() - 0.5) * 6,
                y: cy1 + (cy2 - cy1) * t + arcY + (Math.random() - 0.5) * 6,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                color: Math.random() > 0.4 ? color : '#ffffff',
                size: Math.random() * 4 + 2,
                life: 0.38,
                maxLife: 0.38
            });
        }
    }

    createRectSlashEffect(tiles, color = '#06b6d4') {
        for (const t of tiles) {
            const cx = t.x * CELL_SIZE + CELL_SIZE / 2;
            const cy = t.y * CELL_SIZE + CELL_SIZE / 2;
            for (let i = 0; i < 8; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 8 + 3;
                this.particles.push({
                    x: cx + (Math.random() - 0.5) * 28,
                    y: cy + (Math.random() - 0.5) * 28,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: Math.random() > 0.3 ? color : '#e0f2fe',
                    size: Math.random() * 4 + 2,
                    life: 0.32,
                    maxLife: 0.32
                });
            }
        }
    }

    // --- Hiệu ứng đồ họa & hạt ---
    createSlashEffect(gridX, gridY, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: gridX * CELL_SIZE + CELL_SIZE / 2 + (Math.random() - 0.5) * 40,
                y: gridY * CELL_SIZE + CELL_SIZE / 2 + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                color: color,
                size: Math.random() * 4 + 2,
                life: 0.28,
                maxLife: 0.28
            });
        }
    }

    createBulletTracer(x1, y1, x2, y2, color) {
        const cx1 = x1 * CELL_SIZE + CELL_SIZE / 2;
        const cy1 = y1 * CELL_SIZE + CELL_SIZE / 2;
        const cx2 = x2 * CELL_SIZE + CELL_SIZE / 2;
        const cy2 = y2 * CELL_SIZE + CELL_SIZE / 2;
        const dist = Math.hypot(cx2 - cx1, cy2 - cy1);
        const steps = Math.max(8, Math.floor(dist / 14));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            this.particles.push({
                x: cx1 + (cx2 - cx1) * t + (Math.random() - 0.5) * 4,
                y: cy1 + (cy2 - cy1) * t + (Math.random() - 0.5) * 4,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                color: color,
                size: Math.random() * 3 + 2,
                life: 0.22,
                maxLife: 0.22
            });
        }
    }

    createRocketTrail(x1, y1, x2, y2, color) {
        const cx1 = x1 * CELL_SIZE + CELL_SIZE / 2;
        const cy1 = y1 * CELL_SIZE + CELL_SIZE / 2;
        const cx2 = x2 * CELL_SIZE + CELL_SIZE / 2;
        const cy2 = y2 * CELL_SIZE + CELL_SIZE / 2;
        const steps = 18;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            this.particles.push({
                x: cx1 + (cx2 - cx1) * t + (Math.random() - 0.5) * 10,
                y: cy1 + (cy2 - cy1) * t + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: Math.random() > 0.5 ? '#f59e0b' : color,
                size: Math.random() * 5 + 3,
                life: 0.35,
                maxLife: 0.35
            });
        }
    }

    createExplosionBurst(gridX, gridY, count = 40) {
        const cx = gridX * CELL_SIZE + CELL_SIZE / 2;
        const cy = gridY * CELL_SIZE + CELL_SIZE / 2;
        const colors = ['#ef4444', '#f59e0b', '#fbbf24', '#ffffff'];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 14 + 4;
            this.particles.push({
                x: cx + (Math.random() - 0.5) * 20,
                y: cy + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 7 + 3,
                life: 0.55,
                maxLife: 0.55
            });
        }
    }

    createGrenadeArc(x1, y1, x2, y2) {
        const cx1 = x1 * CELL_SIZE + CELL_SIZE / 2;
        const cy1 = y1 * CELL_SIZE + CELL_SIZE / 2;
        const cx2 = x2 * CELL_SIZE + CELL_SIZE / 2;
        const cy2 = y2 * CELL_SIZE + CELL_SIZE / 2;
        for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            const arcY = -Math.sin(t * Math.PI) * 35;
            this.particles.push({
                x: cx1 + (cx2 - cx1) * t,
                y: cy1 + (cy2 - cy1) * t + arcY,
                vx: 0,
                vy: 0,
                color: '#f59e0b',
                size: 3.5,
                life: 0.4,
                maxLife: 0.4
            });
        }
    }

    createHookChainEffect(x1, y1, x2, y2) {
        const startX = x1 * CELL_SIZE + CELL_SIZE / 2;
        const startY = y1 * CELL_SIZE + CELL_SIZE / 2;
        const endX = x2 * CELL_SIZE + CELL_SIZE / 2;
        const endY = y2 * CELL_SIZE + CELL_SIZE / 2;
        const dist = Math.hypot(endX - startX, endY - startY);
        const steps = Math.max(6, Math.floor(dist / 14));

        for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            const px = startX + (endX - startX) * progress;
            const py = startY + (endY - startY) * progress;
            this.particles.push({
                x: px,
                y: py,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                color: '#ef4444',
                size: 3,
                life: 0.35,
                maxLife: 0.35
            });
        }
    }

    createBuffSparks(gridX, gridY, color = '#10b981') {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: gridX * CELL_SIZE + CELL_SIZE / 2 + (Math.random() - 0.5) * 36,
                y: gridY * CELL_SIZE + CELL_SIZE / 2 + (Math.random() - 0.5) * 36,
                vx: (Math.random() - 0.5) * 4,
                vy: -(Math.random() * 6 + 3), // Bay lên trên
                color: color,
                size: Math.random() * 4 + 2,
                life: 0.45,
                maxLife: 0.45
            });
        }
    }

    createHitSparks(gridX, gridY, color) {
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 3;
            this.particles.push({
                x: gridX * CELL_SIZE + CELL_SIZE / 2,
                y: gridY * CELL_SIZE + CELL_SIZE / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: Math.random() > 0.4 ? color : '#ffffff',
                size: Math.random() * 5 + 2,
                life: 0.45,
                maxLife: 0.45
            });
        }
    }

    createShieldSpark(gridX, gridY, color) {
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            this.particles.push({
                x: gridX * CELL_SIZE + CELL_SIZE / 2 + Math.cos(angle) * 25,
                y: gridY * CELL_SIZE + CELL_SIZE / 2 + Math.sin(angle) * 25,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                color: color,
                size: 3,
                life: 0.35,
                maxLife: 0.35
            });
        }
    }

    createClashBurst(gridX, gridY) {
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 11 + 4;
            this.particles.push({
                x: gridX * CELL_SIZE + CELL_SIZE / 2,
                y: gridY * CELL_SIZE + CELL_SIZE / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#fbbf24',
                size: Math.random() * 6 + 2,
                life: 0.5,
                maxLife: 0.5
            });
        }
    }

    addFloatingText(text, gridX, gridY, color = '#ffffff') {
        this.floatingTexts.push({
            text: text,
            x: gridX * CELL_SIZE + CELL_SIZE / 2,
            y: gridY * CELL_SIZE + 16,
            color: color,
            life: 0.8,
            maxLife: 0.8
        });
    }

    updateCamera(instant = false) {
        const playerScreenX = this.player.renderX * CELL_SIZE + CELL_SIZE / 2;
        const halfCanvasWidth = this.canvas.width / 2;
        const totalWorldWidth = GRID_COLS * CELL_SIZE;

        this.targetCameraX = Math.max(0, Math.min(totalWorldWidth - this.canvas.width, playerScreenX - halfCanvasWidth));

        if (instant) {
            this.cameraX = this.targetCameraX;
        } else {
            this.cameraX += (this.targetCameraX - this.cameraX) * 0.12;
        }
    }

    renderLoop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        if (this.blueTeam) {
            for (const u of this.blueTeam) {
                u.renderX += (u.x - u.renderX) * 0.2;
                u.renderY += (u.y - u.renderY) * 0.2;
            }
        }
        if (this.redTeam) {
            for (const u of this.redTeam) {
                u.renderX += (u.x - u.renderX) * 0.2;
                u.renderY += (u.y - u.renderY) * 0.2;
            }
        }

        this.updateCamera();

        this.renderWorld(dt);
        this.renderMinimap();

        requestAnimationFrame((t) => this.renderLoop(t));
    }

    renderWorld(dt) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();
        ctx.translate(-this.cameraX, 0);

        // 1. Vẽ lưới ô cờ 20x7
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const x = c * CELL_SIZE;
                const y = r * CELL_SIZE;

                ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(15, 23, 42, 0.7)' : 'rgba(11, 19, 36, 0.7)';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

                ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

                ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
                ctx.font = '10px monospace';
                ctx.fillText(`${c},${r}`, x + 4, y + 14);
            }
        }

        // 1.5 Vẽ Khu Vực Chiếm Cứ Điểm 5x5 (King of the Hill)
        if (this.gameMode === 'KOTH') {
            const kz = this.kothZone;
            const zX = kz.minX * CELL_SIZE;
            const zY = kz.minY * CELL_SIZE;
            const zW = (kz.maxX - kz.minX + 1) * CELL_SIZE;
            const zH = (kz.maxY - kz.minY + 1) * CELL_SIZE;

            ctx.save();
            let zoneBg = 'rgba(245, 158, 11, 0.08)';
            let borderColor = 'rgba(245, 158, 11, 0.8)';
            let statusText = this.lang === 'en' ? 'NEUTRAL (0/2)' : 'TRUNG LẬP (0/2)';

            if (this.hillScale === 2) {
                zoneBg = 'rgba(56, 189, 248, 0.22)';
                borderColor = 'rgba(56, 189, 248, 0.95)';
                statusText = this.lang === 'en' ? 'BLUE ZONE (2/2) [+1/T]' : 'ĐỘI XANH KIỂM SOÁT (2/2) [+1/L]';
            } else if (this.hillScale === 1) {
                zoneBg = 'rgba(56, 189, 248, 0.12)';
                borderColor = 'rgba(56, 189, 248, 0.7)';
                statusText = this.lang === 'en' ? 'BLUE CAPTURING (1/2)' : 'ĐỘI XANH ĐANG CHIẾM (1/2)';
            } else if (this.hillScale === -1) {
                zoneBg = 'rgba(244, 63, 94, 0.12)';
                borderColor = 'rgba(244, 63, 94, 0.7)';
                statusText = this.lang === 'en' ? 'RED CAPTURING (1/2)' : 'ĐỘI ĐỎ ĐANG CHIẾM (1/2)';
            } else if (this.hillScale === -2) {
                zoneBg = 'rgba(244, 63, 94, 0.22)';
                borderColor = 'rgba(244, 63, 94, 0.95)';
                statusText = this.lang === 'en' ? 'RED ZONE (2/2) [+1/T]' : 'ĐỘI ĐỎ KIỂM SOÁT (2/2) [+1/L]';
            }

            ctx.fillStyle = zoneBg;
            ctx.fillRect(zX, zY, zW, zH);

            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.strokeRect(zX, zY, zW, zH);
            ctx.setLineDash([]);

            ctx.fillStyle = borderColor;
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`🚩 ${statusText}`, zX + zW / 2, zY + 18);
            ctx.restore();
        }

        // 2. Vẽ các Quả Lựu đạn trên mặt đất (Ground Hazards & Vùng 3x3)
        this.groundHazards.forEach(h => {
            const hx = h.x * CELL_SIZE;
            const hy = h.y * CELL_SIZE;
            const aoeX = (h.x - 1) * CELL_SIZE;
            const aoeY = (h.y - 1) * CELL_SIZE;
            const aoeSize = 3 * CELL_SIZE;

            ctx.save();
            ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
            ctx.fillRect(aoeX, aoeY, aoeSize, aoeSize);
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(aoeX, aoeY, aoeSize, aoeSize);

            ctx.setLineDash([]);
            ctx.font = '22px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💣', hx + CELL_SIZE / 2, hy + CELL_SIZE / 2 - 4);

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(hx + CELL_SIZE / 2 + 10, hy + CELL_SIZE / 2 + 10, 9, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(`${h.turnsLeft}L`, hx + CELL_SIZE / 2 + 10, hy + CELL_SIZE / 2 + 10);
            ctx.restore();
        });

        // 3. Vẽ Lộ trình đã nạp trong hàng đợi
        this.renderQueuedPaths();

        // 4. Vẽ Lộ trình đang vẽ (Active Path)
        if (this.isBuildingPath) {
            this.renderActivePath();
        }

        // 5. Highlight ô mục tiêu
        if (this.phase === 'PLANNING' && !this.isBuildingPath) {
            const d = DIRECTIONS[this.currentSelectedDir];
            const targetX = this.player.x + d.dx;
            const targetY = this.player.y + d.dy;
            if (targetX >= 0 && targetX < GRID_COLS && targetY >= 0 && targetY < GRID_ROWS) {
                ctx.fillStyle = 'rgba(0, 242, 254, 0.15)';
                ctx.fillRect(targetX * CELL_SIZE, targetY * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.strokeStyle = this.player.color;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(targetX * CELL_SIZE + 2, targetY * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
            }
        }

        // 6. Vẽ toàn bộ Chiến binh (Hệ thống Tàng hình 7x7 của Hookman cho cả Đội Xanh & Đội Đỏ)
        const livingBlues = this.blueTeam ? this.blueTeam.filter(u => u.hp > 0) : [this.player];
        const livingReds = this.redTeam ? this.redTeam.filter(u => u.hp > 0) : [this.cpu];

        // Vẽ Đội Xanh
        for (const u of livingBlues) {
            const isHookman = u.charId === 'hookman';
            const isStealth = isHookman && u.revealedTurns <= 0 && livingReds.every(r => this.isOutside7x7(u, r));
            const isRevealed = isHookman && u.revealedTurns > 0;
            const tag = u.isPlayer ? `${u.name} [${this.lang === 'en' ? 'YOU' : 'BẠN'}]` : u.name;
            this.drawFighter(u, u.isPlayer ? u.color : '#38bdf8', tag, isStealth, isRevealed, u.revealedTurns);
        }

        // Vẽ Đội Đỏ
        for (const u of livingReds) {
            const isHookman = u.charId === 'hookman';
            const isStealth = isHookman && u.revealedTurns <= 0 && livingBlues.every(b => this.isOutside7x7(u, b));
            const isRevealed = isHookman && u.revealedTurns > 0;
            if (!isStealth) {
                this.drawFighter(u, '#f43f5e', u.name, false, isRevealed, u.revealedTurns);
            }
        }

        // Vẽ Dây Móc đang găm nối
        if (this.activeHookTethers && this.activeHookTethers.length > 0) {
            this.activeHookTethers.forEach(tether => {
                const hooker = tether.sourceUnit || (tether.source === 'PLAYER' ? this.player : this.cpu);
                const victim = tether.targetUnit || (tether.target === 'CPU' ? this.cpu : this.player);
                if (hooker && victim && hooker.hp > 0 && victim.hp > 0) {
                    ctx.save();
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2.5;
                    ctx.setLineDash([8, 6]);
                    ctx.beginPath();
                    ctx.moveTo(hooker.renderX * CELL_SIZE + CELL_SIZE / 2, hooker.renderY * CELL_SIZE + CELL_SIZE / 2);
                    ctx.lineTo(victim.renderX * CELL_SIZE + CELL_SIZE / 2, victim.renderY * CELL_SIZE + CELL_SIZE / 2);
                    ctx.stroke();

                    const midX = ((hooker.renderX + victim.renderX) / 2) * CELL_SIZE + CELL_SIZE / 2;
                    const midY = ((hooker.renderY + victim.renderY) / 2) * CELL_SIZE + CELL_SIZE / 2;
                    ctx.setLineDash([]);
                    ctx.font = '16px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🪝', midX, midY);
                    ctx.restore();
                }
            });
        }

        // 7. Hạt hiệu ứng
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // 8. Chữ bay
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= 38 * dt;
            ft.life -= dt;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }
            ctx.save();
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.globalAlpha = Math.min(1, ft.life / (ft.maxLife * 0.4));
            ctx.fillStyle = '#000000';
            ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }

        ctx.restore();
    }

    renderActivePath() {
        const ctx = this.ctx;
        const startPos = this.getPathStartPos();

        let prevX = startPos.x * CELL_SIZE + CELL_SIZE / 2;
        let prevY = startPos.y * CELL_SIZE + CELL_SIZE / 2;

        ctx.save();
        ctx.strokeStyle = this.player.color;
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);

        this.activePath.forEach((step, idx) => {
            const currX = step.x * CELL_SIZE + CELL_SIZE / 2;
            const currY = step.y * CELL_SIZE + CELL_SIZE / 2;

            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(currX, currY);
            ctx.stroke();

            ctx.save();
            ctx.fillStyle = this.player.color;
            ctx.shadowColor = this.player.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(currX, currY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${idx + 1}`, currX, currY - 14);

            prevX = currX;
            prevY = currY;
        });

        ctx.restore();
    }

    renderQueuedPaths() {
        const ctx = this.ctx;
        let startX = this.player.x;
        let startY = this.player.y;

        ctx.save();
        for (const act of this.playerQueue) {
            if (act.type === 'PATH_MOVE' && act.path) {
                let px = startX * CELL_SIZE + CELL_SIZE / 2;
                let py = startY * CELL_SIZE + CELL_SIZE / 2;

                ctx.save();
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
                ctx.lineWidth = 3;
                ctx.setLineDash([4, 4]);

                for (const pNode of act.path) {
                    const nx = pNode.x * CELL_SIZE + CELL_SIZE / 2;
                    const ny = pNode.y * CELL_SIZE + CELL_SIZE / 2;

                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(nx, ny);
                    ctx.stroke();

                    ctx.fillStyle = '#38bdf8';
                    ctx.beginPath();
                    ctx.arc(nx, ny, 4, 0, Math.PI * 2);
                    ctx.fill();

                    px = nx;
                    py = ny;
                }
                ctx.restore();

                if (act.path.length > 0) {
                    const last = act.path[act.path.length - 1];
                    startX = last.x;
                    startY = last.y;
                }
            } else if (act.type === 'DASH') {
                const d = DIRECTIONS[act.dir];
                const destX = Math.max(0, Math.min(GRID_COLS - 1, startX + d.dx * (act.range || 2)));
                const destY = Math.max(0, Math.min(GRID_ROWS - 1, startY + d.dy * (act.range || 2)));

                const px = startX * CELL_SIZE + CELL_SIZE / 2;
                const py = startY * CELL_SIZE + CELL_SIZE / 2;
                const nx = destX * CELL_SIZE + CELL_SIZE / 2;
                const ny = destY * CELL_SIZE + CELL_SIZE / 2;

                ctx.save();
                ctx.strokeStyle = 'rgba(251, 146, 60, 0.55)';
                ctx.lineWidth = 3;
                ctx.setLineDash([6, 3]);
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(nx, ny);
                ctx.stroke();

                ctx.fillStyle = '#fb923c';
                ctx.beginPath();
                ctx.arc(nx, ny, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                startX = destX;
                startY = destY;
            } else if (act.type === 'LEAP') {
                const d = DIRECTIONS[act.dir];
                let destX = Math.max(0, Math.min(GRID_COLS - 1, startX + d.dx * (act.range || 3)));
                let destY = Math.max(0, Math.min(GRID_ROWS - 1, startY + d.dy * (act.range || 3)));

                const px = startX * CELL_SIZE + CELL_SIZE / 2;
                const py = startY * CELL_SIZE + CELL_SIZE / 2;
                const nx = destX * CELL_SIZE + CELL_SIZE / 2;
                const ny = destY * CELL_SIZE + CELL_SIZE / 2;

                ctx.save();
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.55)';
                ctx.lineWidth = 3;
                ctx.setLineDash([6, 3]);
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.quadraticCurveTo((px + nx) / 2, (py + ny) / 2 - 25, nx, ny);
                ctx.stroke();

                ctx.fillStyle = '#06b6d4';
                ctx.beginPath();
                ctx.arc(nx, ny, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                startX = destX;
                startY = destY;
            }
        }
        ctx.restore();
    }

    drawFighter(fighter, color, tag, isStealth = false, isRevealed = false, revealedTurns = 0) {
        const ctx = this.ctx;
        const cx = fighter.renderX * CELL_SIZE + CELL_SIZE / 2;
        const cy = fighter.renderY * CELL_SIZE + CELL_SIZE / 2;

        ctx.save();
        ctx.translate(cx, cy);

        // Kiểm tra Buff Thuốc Lá (Smoke guy)
        const hasCigaretteBuff = (fighter.buffs && fighter.buffs.cigarette && fighter.buffs.cigarette.turnsLeft > 0);

        // Nếu ở trạng thái Tàng hình (Stealth)
        if (isStealth) {
            ctx.globalAlpha = 0.55;
            ctx.save();
            ctx.strokeStyle = '#a78bfa';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 28, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            tag = `${tag} [ẨN 7x7]`;
        } else if (isRevealed) {
            ctx.save();
            ctx.strokeStyle = '#f43f5e';
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 28, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            tag = `${tag} [BỊ LỘ: ${revealedTurns}L]`;
        }

        if (hasCigaretteBuff) {
            ctx.save();
            ctx.strokeStyle = 'rgba(251, 146, 60, 0.6)';
            ctx.setLineDash([3, 5]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 28, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            tag = `${tag} [🚬]`;
        }

        // Hiệu ứng phát sáng
        const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, 26);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = isStealth ? 0.3 : 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = isStealth ? 0.6 : 1.0;

        // Thân nhân vật
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Biểu tượng Avatar ở giữa
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fighter.avatar || '⚔️', 0, 1);

        // Hướng nhìn (8 hướng)
        const d = DIRECTIONS[fighter.dir];
        const angle = Math.atan2(d.dy, d.dx);
        const arrowDist = 24;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 11, Math.sin(angle) * 11);
        ctx.lineTo(Math.cos(angle) * arrowDist, Math.sin(angle) * arrowDist);
        ctx.stroke();

        // Khiên chắn
        if (fighter.shieldDir) {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, 24, angle - Math.PI / 3, angle + Math.PI / 3);
            ctx.stroke();
        }

        // Thanh máu Mini trên đầu nhân vật
        const barW = 32;
        const barH = 4;
        const hpRatio = Math.max(0, Math.min(1, fighter.hp / fighter.maxHp));
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(-barW / 2, -32, barW, barH);
        ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : (hpRatio > 0.25 ? '#f59e0b' : '#ef4444');
        ctx.fillRect(-barW / 2, -32, barW * hpRatio, barH);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-barW / 2, -32, barW, barH);

        // Tên tag
        ctx.font = 'bold 8.5px sans-serif';
        ctx.fillStyle = isStealth ? '#c084fc' : (isRevealed ? '#f43f5e' : (hasCigaretteBuff ? '#fb923c' : '#f8fafc'));
        ctx.textAlign = 'center';
        ctx.fillText(tag, 0, -23);

        ctx.restore();
    }

    renderMinimap() {
        const mCtx = this.minimapCtx;
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;
        const cellW = w / GRID_COLS;
        const cellH = h / GRID_ROWS;

        mCtx.clearRect(0, 0, w, h);

        mCtx.fillStyle = '#030712';
        mCtx.fillRect(0, 0, w, h);

        const vpX = (this.cameraX / (GRID_COLS * CELL_SIZE)) * w;
        const vpW = (this.canvas.width / (GRID_COLS * CELL_SIZE)) * w;
        mCtx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        mCtx.fillRect(vpX, 0, vpW, h);
        mCtx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        mCtx.lineWidth = 1;
        mCtx.strokeRect(vpX, 0, vpW, h);

        // Vẽ Cứ Điểm 5x5 trên Minimap nếu ở chế độ KOTH
        if (this.gameMode === 'KOTH') {
            const kz = this.kothZone;
            const mzX = kz.minX * cellW;
            const mzY = kz.minY * cellH;
            const mzW = (kz.maxX - kz.minX + 1) * cellW;
            const mzH = (kz.maxY - kz.minY + 1) * cellH;

            let mColor = 'rgba(245, 158, 11, 0.25)';
            let mBorder = '#f59e0b';
            if (this.hillScale === 2) {
                mColor = 'rgba(56, 189, 248, 0.35)';
                mBorder = '#38bdf8';
            } else if (this.hillScale === -2) {
                mColor = 'rgba(244, 63, 94, 0.35)';
                mBorder = '#f43f5e';
            }

            mCtx.fillStyle = mColor;
            mCtx.fillRect(mzX, mzY, mzW, mzH);
            mCtx.strokeStyle = mBorder;
            mCtx.lineWidth = 1;
            mCtx.strokeRect(mzX, mzY, mzW, mzH);
        }

        // Vẽ bom trên minimap
        mCtx.fillStyle = '#ef4444';
        this.groundHazards.forEach(hz => {
            mCtx.fillRect(hz.x * cellW - 1, hz.y * cellH - 1, 3, 3);
        });

        // Vẽ toàn bộ chiến binh Đội Xanh
        if (this.blueTeam) {
            this.blueTeam.filter(u => u.hp > 0).forEach(u => {
                mCtx.fillStyle = u.isPlayer ? u.color : '#38bdf8';
                mCtx.beginPath();
                mCtx.arc((u.x + 0.5) * cellW, (u.y + 0.5) * cellH, 3.5, 0, Math.PI * 2);
                mCtx.fill();
            });
        }

        // Vẽ toàn bộ chiến binh Đội Đỏ (trừ tàng hình)
        if (this.redTeam) {
            const livingBlues = this.blueTeam ? this.blueTeam.filter(u => u.hp > 0) : [this.player];
            this.redTeam.filter(u => u.hp > 0).forEach(u => {
                const isHookman = u.charId === 'hookman';
                const isStealth = isHookman && u.revealedTurns <= 0 && livingBlues.every(b => this.isOutside7x7(u, b));
                if (!isStealth) {
                    mCtx.fillStyle = '#f43f5e';
                    mCtx.beginPath();
                    mCtx.arc((u.x + 0.5) * cellW, (u.y + 0.5) * cellH, 3.5, 0, Math.PI * 2);
                    mCtx.fill();
                }
            });
        }
    }
}

// Khởi tạo Game
window.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new GameEngine();
});
