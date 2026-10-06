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

        // Nhân vật Người chơi
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

        // Nhân vật CPU
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

        this.initCharacterSelectUI();
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
                if (window.soundCtrl) window.soundCtrl.playSelect();
            });
        });

        const startBtn = document.getElementById('btnStartBattle');
        if (startBtn) startBtn.onclick = () => this.startBattle();
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
        this.phase = 'PLANNING';
        if (window.soundCtrl) window.soundCtrl.playCommit();
        const pName = getCharName(this.selectedCharacter, this.lang);
        const cName = getCharName(this.cpuCharacter, this.lang);
        this.addCombatLog(this.lang === 'en' ? `Operative [${pName}] deployed to the arena!` : `Chiến binh [${pName}] bước vào đấu trường!`, 'system');
        this.addCombatLog(this.lang === 'en' ? `CPU Sentinel took identity of [${cName}]!` : `Đối thủ CPU nhập vai [${cName}]!`, 'system');
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
        this.cpu.charId = chosenChar.id;
        this.cpu.name = chosenChar.name.split(' (')[0];
        this.cpu.avatar = chosenChar.avatar;
        this.cpu.color = chosenChar.themeColor;
        this.cpu.maxHp = chosenChar.maxHp;
        this.cpu.hp = chosenChar.maxHp;
        this.cpu.moveBudget = chosenChar.moveBudget || 2;
        this.cpu.stealthRadius = chosenChar.stealthRadius || 0;
        this.cpuCooldowns = {};
        this.cpuSkillAmmo = {};
        chosenChar.skills.forEach(s => {
            if (s.maxAmmo) this.cpuSkillAmmo[s.id] = s.maxAmmo;
        });
        this.cpuRevealedTurns = 0;
        this.cpuBuffs = {
            adrenaline: { turnsLeft: 0, healPerTurn: 5, dmgBonusPercent: 20 },
            cigarette: { turnsLeft: 0, dmgBonusPercent: 30, moveBonus: 1 }
        };

        const cpuBadge = document.getElementById('cpuNameBadge');
        if (cpuBadge) {
            cpuBadge.innerText = `${chosenChar.avatar} ${this.cpu.name.toUpperCase()} [CPU]`;
            cpuBadge.style.color = chosenChar.themeColor;
        }
    }

    applySelectedCharacter() {
        const char = this.selectedCharacter;
        this.player.charId = char.id;
        this.player.name = char.name;
        this.player.avatar = char.avatar;
        this.player.color = char.themeColor;
        this.player.maxHp = char.maxHp;
        this.player.hp = char.maxHp;
        this.player.moveBudget = char.moveBudget || 2;
        this.player.stealthRadius = char.stealthRadius || 0;
        this.activePathMaxSteps = char.moveBudget || 2;
        this.cooldowns = {};
        this.skillAmmo = {};
        char.skills.forEach(s => {
            if (s.maxAmmo) this.skillAmmo[s.id] = s.maxAmmo;
        });
        this.groundHazards = [];
        this.playerRevealedTurns = 0;
        this.cpuRevealedTurns = 0;
        this.playerBuffs = {
            adrenaline: { turnsLeft: 0, healPerTurn: 5, dmgBonusPercent: 20 },
            cigarette: { turnsLeft: 0, dmgBonusPercent: 30, moveBonus: 1 }
        };
        this.activeHookTethers = [];

        document.getElementById('playerNameBadge').innerText = `${char.name.toUpperCase()} [BẠN]`;
        this.updateSkillButtons();
    }

    updateSkillButtons() {
        const char = this.selectedCharacter;
        const skillContainer = document.getElementById('dynamicSkillButtons');
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
        if (this.playerQueue.length > 0) {
            this.playerQueue.pop();
            if (window.soundCtrl) window.soundCtrl.playUndo();
            this.updateQueueDisplay();
        }
    }

    clearQueue() {
        if (this.phase !== 'PLANNING') return;
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

        if (this.playerQueue.length === 4 && this.phase === 'PLANNING') {
            commitBtn.disabled = false;
            commitBtn.innerHTML = `<span>${t('btnCommitPrefix')} (4/4) 🚀</span>`;
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
        const queue = [];
        let simX = this.cpu.x;
        let simY = this.cpu.y;

        const charId = (this.cpuCharacter && this.cpuCharacter.id) || this.cpu.charId || 'trooper';
        const playerInvisible = this.isPlayerStealthed();

        const simCooldowns = { ...this.cpuCooldowns };
        const simSkillAmmo = { ...this.cpuSkillAmmo };
        const simBuffs = {
            adrenaline: { turnsLeft: (this.cpuBuffs && this.cpuBuffs.adrenaline) ? this.cpuBuffs.adrenaline.turnsLeft : 0 },
            cigarette: { turnsLeft: (this.cpuBuffs && this.cpuBuffs.cigarette) ? this.cpuBuffs.cigarette.turnsLeft : 0 }
        };

        for (let i = 0; i < 4; i++) {
            let targetX = this.player.x;
            let targetY = this.player.y;
            if (playerInvisible) {
                targetX = 10;
                targetY = 3;
            }

            const dx = targetX - simX;
            const dy = targetY - simY;
            const dist = Math.abs(dx) + Math.abs(dy);

            let action = null;
            if (charId === 'trooper') {
                action = this.generateCpuActionTrooper(i, simX, simY, dx, dy, dist, playerInvisible, simCooldowns, simSkillAmmo, simBuffs);
            } else if (charId === 'hookman') {
                action = this.generateCpuActionHookman(i, simX, simY, dx, dy, dist, playerInvisible, simCooldowns, simSkillAmmo, simBuffs);
            } else if (charId === 'smoke_guy') {
                action = this.generateCpuActionSmokeGuy(i, simX, simY, dx, dy, dist, playerInvisible, simCooldowns, simSkillAmmo, simBuffs);
            } else if (charId === 'razor') {
                action = this.generateCpuActionRazor(i, simX, simY, dx, dy, dist, playerInvisible, simCooldowns, simSkillAmmo, simBuffs);
            } else {
                action = this.generateCpuActionTrooper(i, simX, simY, dx, dy, dist, playerInvisible, simCooldowns, simSkillAmmo, simBuffs);
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
                const hasObstacle = (this.player.x === destX && this.player.y === destY) || this.groundHazards.some(h => h.x === destX && h.y === destY);
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
        this.addCombatLog(`--- [LƯỢT ${this.turn}] KHÓA LỆNH THỰC THI ---`, 'system');

        // Đặt hồi chiêu cho các kỹ năng được chọn (ngoại trừ HOOK_PULL, BUFF_SMOKE, BOMB_LAUNCHER và RECT_SLASH có quy tắc hồi chiêu riêng)
        for (const act of this.playerQueue) {
            if (act.cooldown && act.type !== 'HOOK_PULL' && act.type !== 'BUFF_SMOKE' && act.type !== 'BOMB_LAUNCHER' && act.type !== 'RECT_SLASH') {
                this.cooldowns[act.skillId] = act.cooldown;
            }
        }

        this.cpuQueue = this.generateCpuQueue();

        // Đặt hồi chiêu cho các kỹ năng CPU được chọn (ngoại trừ HOOK_PULL, BUFF_SMOKE, BOMB_LAUNCHER và RECT_SLASH)
        for (const act of this.cpuQueue) {
            if (act.cooldown && act.type !== 'HOOK_PULL' && act.type !== 'BUFF_SMOKE' && act.type !== 'BOMB_LAUNCHER' && act.type !== 'RECT_SLASH') {
                this.cpuCooldowns[act.skillId] = act.cooldown;
            }
        }

        for (let i = 0; i < 4; i++) {
            const slot = document.getElementById(`c-slot-${i}`);
            slot.className = 'queue-slot';
            slot.innerHTML = `<span class="slot-step-num">#${i + 1}</span><span class="slot-icon">🔒</span><span class="slot-name">Bí mật</span>`;
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

        this.currentStep = stepIndex;
        this.updateHUD();

        for (let i = 0; i < 4; i++) {
            document.getElementById(`p-slot-${i}`).classList.toggle('active-step', i === stepIndex);
            document.getElementById(`c-slot-${i}`).classList.toggle('active-step', i === stepIndex);
        }

        const pAct = this.playerQueue[stepIndex];
        const cAct = this.cpuQueue[stepIndex];

        // Giải mã lệnh CPU
        const cSlot = document.getElementById(`c-slot-${stepIndex}`);
        cSlot.className = 'queue-slot filled active-step';
        cSlot.innerHTML = `
            <span class="slot-step-num">#${stepIndex + 1}</span>
            <span class="slot-icon">${cAct.icon}</span>
            <span class="slot-name">${cAct.name}</span>
            <span class="slot-dir" style="letter-spacing: 2px;">${cAct.dirSymbol}</span>
        `;

        this.player.dir = pAct.dir || this.player.dir;
        this.cpu.dir = cAct.dir || this.cpu.dir;

        this.player.shieldDir = null;
        this.cpu.shieldDir = null;

        // BƯỚC 1: Xử lý Khiên
        if (pAct.type === 'SHIELD') {
            this.player.shieldDir = pAct.dir;
            this.createShieldSpark(this.player.x, this.player.y, this.player.color);
            if (window.soundCtrl) window.soundCtrl.playShield();
            this.addFloatingText('KHIÊN!', this.player.x, this.player.y, '#38bdf8');
        }
        if (cAct.type === 'SHIELD') {
            this.cpu.shieldDir = cAct.dir;
            this.createShieldSpark(this.cpu.x, this.cpu.y, '#ff3366');
            this.addFloatingText('KHIÊN!', this.cpu.x, this.cpu.y, '#ff3366');
        }

        await this.delay(180);

        // BƯỚC 2: Di chuyển (Sub-tick Simultaneous Movement hoặc LEAP)
        if (pAct.type === 'LEAP') {
            const pD = DIRECTIONS[pAct.dir];
            const startX = this.player.x;
            const startY = this.player.y;
            let destX = startX + pD.dx * (pAct.range || 3);
            let destY = startY + pD.dy * (pAct.range || 3);
            destX = Math.max(0, Math.min(GRID_COLS - 1, destX));
            destY = Math.max(0, Math.min(GRID_ROWS - 1, destY));

            const hasEnemy = (this.cpu.x === destX && this.cpu.y === destY);
            const hasHazard = this.groundHazards.some(h => h.x === destX && h.y === destY);
            let extraJump = false;
            if (hasEnemy || hasHazard) {
                extraJump = true;
                destX = Math.max(0, Math.min(GRID_COLS - 1, destX + pD.dx * (pAct.leapExtra || 2)));
                destY = Math.max(0, Math.min(GRID_ROWS - 1, destY + pD.dy * (pAct.leapExtra || 2)));
            }

            if (window.soundCtrl) window.soundCtrl.playLeap();
            this.createLeapArc(startX, startY, destX, destY, '#06b6d4');
            this.player.x = destX;
            this.player.y = destY;

            if (extraJump) {
                this.addFloatingText('🦘 ĐÍCH CÓ VẬT THỂ/ĐỊCH! NHẢY THÊM 2 BƯỚC!', destX, destY, '#06b6d4');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: Razor [Nhảy Đột Kích] phát hiện vật thể/kẻ thù tại ô đích, lập tức nhảy tiếp 2 bước tới (${destX}, ${destY})!`, 'buff');
            } else {
                this.addFloatingText('🦘 NHẢY 3 Ô!', destX, destY, '#06b6d4');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: Razor [Nhảy Đột Kích] 3 ô vượt địa hình an toàn tới (${destX}, ${destY})!`, 'system');
            }
        }

        if (cAct.type === 'LEAP') {
            const cD = DIRECTIONS[cAct.dir];
            const startX = this.cpu.x;
            const startY = this.cpu.y;
            let destX = startX + cD.dx * (cAct.range || 3);
            let destY = startY + cD.dy * (cAct.range || 3);
            destX = Math.max(0, Math.min(GRID_COLS - 1, destX));
            destY = Math.max(0, Math.min(GRID_ROWS - 1, destY));

            const hasPlayer = (this.player.x === destX && this.player.y === destY);
            const hasHazard = this.groundHazards.some(h => h.x === destX && h.y === destY);
            let extraJump = false;
            if (hasPlayer || hasHazard) {
                extraJump = true;
                destX = Math.max(0, Math.min(GRID_COLS - 1, destX + cD.dx * (cAct.leapExtra || 2)));
                destY = Math.max(0, Math.min(GRID_ROWS - 1, destY + cD.dy * (cAct.leapExtra || 2)));
            }

            if (window.soundCtrl) window.soundCtrl.playLeap();
            this.createLeapArc(startX, startY, destX, destY, '#ff3366');
            this.cpu.x = destX;
            this.cpu.y = destY;
        }

        const pSubSteps = pAct.type === 'PATH_MOVE' && pAct.path ? pAct.path : 
                         (pAct.type === 'DASH' ? [{ x: this.player.x + DIRECTIONS[pAct.dir].dx * 2, y: this.player.y + DIRECTIONS[pAct.dir].dy * 2, dir: pAct.dir }] : []);
        
        const cSubSteps = cAct.type === 'PATH_MOVE' && cAct.path ? cAct.path :
                         (cAct.type === 'DASH' ? [{ x: this.cpu.x + DIRECTIONS[cAct.dir].dx * 2, y: this.cpu.y + DIRECTIONS[cAct.dir].dy * 2, dir: cAct.dir }] : []);

        const maxSubSteps = Math.max(pSubSteps.length, cSubSteps.length);

        for (let sub = 0; sub < maxSubSteps; sub++) {
            let pNextX = this.player.x;
            let pNextY = this.player.y;
            let cNextX = this.cpu.x;
            let cNextY = this.cpu.y;

            let pMoving = false;
            let cMoving = false;

            if (sub < pSubSteps.length) {
                pNextX = Math.max(0, Math.min(GRID_COLS - 1, pSubSteps[sub].x));
                pNextY = Math.max(0, Math.min(GRID_ROWS - 1, pSubSteps[sub].y));
                this.player.dir = pSubSteps[sub].dir || this.player.dir;
                pMoving = true;
            }

            if (sub < cSubSteps.length) {
                cNextX = Math.max(0, Math.min(GRID_COLS - 1, cSubSteps[sub].x));
                cNextY = Math.max(0, Math.min(GRID_ROWS - 1, cSubSteps[sub].y));
                this.cpu.dir = cSubSteps[sub].dir || this.cpu.dir;
                cMoving = true;
            }

            if (pMoving && cMoving && pNextX === cNextX && pNextY === cNextY) {
                if (window.soundCtrl) window.soundCtrl.playClash();
                this.createClashBurst(pNextX, pNextY);
                this.addFloatingText('VA CHẠM!', pNextX, pNextY, '#fbbf24');
                this.addCombatLog(`Nhịp #${stepIndex + 1} (Bước ${sub + 1}): Va chạm cùng lao vào ô (${pNextX}, ${pNextY}) -> DỘI LÙI!`, 'clash');
                this.applyDamage(this.player, 5);
                this.applyDamage(this.cpu, 5);
                break;
            } else if (pMoving && cMoving && pNextX === this.cpu.x && pNextY === this.cpu.y && cNextX === this.player.x && cNextY === this.player.y) {
                if (window.soundCtrl) window.soundCtrl.playClash();
                const midX = (this.player.x + this.cpu.x) / 2;
                const midY = (this.player.y + this.cpu.y) / 2;
                this.createClashBurst(midX, midY);
                this.addFloatingText('ĐÂM NHAU!', midX, midY, '#fbbf24');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: Cắt ngang đâm trực diện! Cả hai dội lùi.`, 'clash');
                this.applyDamage(this.player, 5);
                this.applyDamage(this.cpu, 5);
                break;
            } else {
                if (pMoving) {
                    if (pNextX === this.cpu.x && pNextY === this.cpu.y && !cMoving) {
                        this.addFloatingText('BỊ CHẶN!', this.player.x, this.player.y, '#cbd5e1');
                    } else {
                        this.player.x = pNextX;
                        this.player.y = pNextY;
                        if (window.soundCtrl) window.soundCtrl.playMove();
                    }
                }
                if (cMoving) {
                    if (cNextX === this.player.x && cNextY === this.player.y && !pMoving) {
                        this.addFloatingText('BỊ CHẶN!', this.cpu.x, this.cpu.y, '#cbd5e1');
                    } else {
                        this.cpu.x = cNextX;
                        this.cpu.y = cNextY;
                    }
                }
            }

            await this.delay(200);
        }

        if (this.player.x === this.cpu.x && this.player.y === this.cpu.y) {
            if (window.soundCtrl) window.soundCtrl.playClash();
            this.createClashBurst(this.player.x, this.player.y);
            this.addFloatingText('VA CHẠM ĐÈ Ô!', this.player.x, this.player.y, '#fbbf24');
            this.addCombatLog(`Nhịp #${stepIndex + 1}: Hai đấu thủ đè cùng ô (${this.player.x}, ${this.player.y}) -> dội lùi!`, 'clash');
            const fallbackDir = pAct.type === 'LEAP' ? DIRECTIONS[pAct.dir] : DIRECTIONS['LEFT'];
            this.player.x = Math.max(0, Math.min(GRID_COLS - 1, this.player.x - fallbackDir.dx));
            this.player.y = Math.max(0, Math.min(GRID_ROWS - 1, this.player.y - fallbackDir.dy));
            this.applyDamage(this.player, 5);
            this.applyDamage(this.cpu, 5);
        }

        await this.delay(120);

        // BƯỚC 3: Tấn công (Attack / Ranged / Rocket / Grenade Resolution)
        let playerHitTarget = false;
        let cpuHitTarget = false;

        // --- 3.1 Player Actions ---
        const hasAdrenaline = (this.playerBuffs && this.playerBuffs.adrenaline && this.playerBuffs.adrenaline.turnsLeft > 0);
        const hasCigarette = (this.playerBuffs && this.playerBuffs.cigarette && this.playerBuffs.cigarette.turnsLeft > 0);
        let pDmgMult = 1.0;
        let buffTag = '';
        if (hasAdrenaline) {
            pDmgMult *= 1.2;
            buffTag += ' (+20% Adrenaline)';
        }
        if (hasCigarette) {
            pDmgMult *= 1.3;
            buffTag += ' (+30% Thuốc Lá)';
        }
        const hasBuffDmg = hasAdrenaline || hasCigarette;

        if (pAct.type === 'ATTACK') {
            const pD = DIRECTIONS[pAct.dir];
            const attackRange = pAct.range || 1;
            const targetX = this.player.x + pD.dx * attackRange;
            const targetY = this.player.y + pD.dy * attackRange;
            this.createSlashEffect(targetX, targetY, this.player.color);

            if (this.cpu.x === targetX && this.cpu.y === targetY) {
                playerHitTarget = true;
                if (this.cpu.shieldDir) {
                    if (window.soundCtrl) window.soundCtrl.playShield();
                    this.addFloatingText('CHẶN ĐƯỢC!', this.cpu.x, this.cpu.y, '#60a5fa');
                    this.addCombatLog(`Nhịp #${stepIndex + 1}: ${pAct.name} bị Khiên CPU chặn đứng! (0 DMG)`, 'block');
                } else {
                    if (window.soundCtrl) window.soundCtrl.playHit();
                    let dmg = pAct.power || 25;
                    if (hasBuffDmg) dmg = Math.round(dmg * pDmgMult);
                    this.applyDamage(this.cpu, dmg);
                    this.createHitSparks(this.cpu.x, this.cpu.y, '#ff3366');
                    this.addFloatingText(`-${dmg} HP!`, this.cpu.x, this.cpu.y, '#f87171');
                    this.addCombatLog(`Nhịp #${stepIndex + 1}: [${pAct.name}] TRÚNG CPU! (-${dmg} HP${buffTag})`, 'hit');
                }
            } else {
                if (window.soundCtrl) window.soundCtrl.playAttack();
                this.addFloatingText('HỤT!', targetX, targetY, '#94a3b8');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: ${pAct.name} vào ô trống (${targetX}, ${targetY}) -> Hụt!`, 'miss');
            }
        } 
        else if (pAct.type === 'RANGED_LINE') {
            // Súng trường (Assault Rifle / Combat Rifle / Pulse Rifle): Bắn thẳng/chéo tới 4-5 ô
            const pD = DIRECTIONS[pAct.dir];
            const maxRange = pAct.range || 5;
            if (pAct.skillId === 'RAZOR_PULSE_RIFLE') {
                if (window.soundCtrl) window.soundCtrl.playPulseRifle();
            } else {
                if (window.soundCtrl) window.soundCtrl.playRifleShot();
            }

            let hit = false;
            let endX = this.player.x + pD.dx * maxRange;
            let endY = this.player.y + pD.dy * maxRange;

            for (let r = 1; r <= maxRange; r++) {
                const checkX = this.player.x + pD.dx * r;
                const checkY = this.player.y + pD.dy * r;
                if (checkX < 0 || checkX >= GRID_COLS || checkY < 0 || checkY >= GRID_ROWS) break;

                endX = checkX;
                endY = checkY;

                if (this.cpu.x === checkX && this.cpu.y === checkY) {
                    hit = true;
                    if (this.cpu.shieldDir) {
                        if (window.soundCtrl) window.soundCtrl.playShield();
                        this.addFloatingText('CHẶN ĐƯỢC ĐẠN!', this.cpu.x, this.cpu.y, '#60a5fa');
                        this.addCombatLog(`Nhịp #${stepIndex + 1}: CPU giương Khiên chặn loạt đạn ${pAct.name}!`, 'block');
                    } else {
                        if (window.soundCtrl) window.soundCtrl.playHit();
                        let dmg = pAct.power || 20;
                        if (hasBuffDmg) dmg = Math.round(dmg * pDmgMult);
                        if (cAct.type === 'LEAP') dmg = Math.round(dmg * 0.75);
                        this.applyDamage(this.cpu, dmg);
                        this.createHitSparks(this.cpu.x, this.cpu.y, '#ff3366');
                        this.addFloatingText(`-${dmg} HP!`, this.cpu.x, this.cpu.y, '#f87171');
                        this.addCombatLog(`Nhịp #${stepIndex + 1}: [${pAct.name}] BẮN TRÚNG CPU! Gây ${dmg} sát thương${buffTag}!`, 'hit');
                    }
                    break;
                }
            }

            let tracerColor = '#34d399';
            if (pAct.skillId === 'SMOKE_RIFLE') tracerColor = '#fb923c';
            else if (pAct.skillId === 'RAZOR_PULSE_RIFLE') tracerColor = '#06b6d4';
            this.createBulletTracer(this.player.x, this.player.y, endX, endY, tracerColor);
            if (!hit) {
                this.addFloatingText('ĐẠN TRƯỢT!', endX, endY, '#94a3b8');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: Đạn [${pAct.name}] bắn qua không gian!`, 'miss');
            }
        }
        else if (pAct.type === 'RANGED_VARIABLE') {
            // Súng giảm thanh Silence Pistol: Bắn thẳng/chéo tới 5 ô, sát thương ngẫu nhiên 15 - 20 DMG
            const pD = DIRECTIONS[pAct.dir];
            const maxRange = pAct.range || 5;
            if (window.soundCtrl) window.soundCtrl.playSilencedPistol();

            let hit = false;
            let endX = this.player.x + pD.dx * maxRange;
            let endY = this.player.y + pD.dy * maxRange;

            for (let r = 1; r <= maxRange; r++) {
                const checkX = this.player.x + pD.dx * r;
                const checkY = this.player.y + pD.dy * r;
                if (checkX < 0 || checkX >= GRID_COLS || checkY < 0 || checkY >= GRID_ROWS) break;

                endX = checkX;
                endY = checkY;

                if (this.cpu.x === checkX && this.cpu.y === checkY) {
                    hit = true;
                    playerHitTarget = true;
                    if (this.cpu.shieldDir) {
                        if (window.soundCtrl) window.soundCtrl.playShield();
                        this.addFloatingText('CHẶN ĐƯỢC!', this.cpu.x, this.cpu.y, '#60a5fa');
                        this.addCombatLog(`Nhịp #${stepIndex + 1}: CPU giương Khiên chặn đạn Silence Pistol!`, 'block');
                    } else {
                        if (window.soundCtrl) window.soundCtrl.playHit();
                        const minD = pAct.minPower !== undefined ? pAct.minPower : 15;
                        const maxD = pAct.maxPower !== undefined ? pAct.maxPower : 20;
                        let dmg = Math.floor(Math.random() * (maxD - minD + 1)) + minD;
                        if (hasBuffDmg) dmg = Math.round(dmg * pDmgMult);
                        this.applyDamage(this.cpu, dmg);
                        this.createHitSparks(this.cpu.x, this.cpu.y, '#a78bfa');
                        this.addFloatingText(`-${dmg} HP! (LÉN)`, this.cpu.x, this.cpu.y, '#c084fc');
                        this.addCombatLog(`Nhịp #${stepIndex + 1}: Silence Pistol BẮN LÉN TRÚNG CPU! Gây ${dmg} sát thương${buffTag}!`, 'hit');
                    }
                    break;
                }
            }

            this.createBulletTracer(this.player.x, this.player.y, endX, endY, '#a78bfa');
            if (!hit) {
                this.addFloatingText('ĐẠN LƯỚT QUA!', endX, endY, '#94a3b8');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: Tiếng súng giảm thanh rít nhẹ trong không gian!`, 'miss');
            }
        }
        else if (pAct.type === 'BUFF_HEAL') {
            // Ống tiêm Adrenaline: Hồi 15 HP trong 3 lượt (5 HP/lượt), Sát thương +20%, Cooldown 3 lượt
            if (window.soundCtrl) window.soundCtrl.playAdrenaline();
            this.playerBuffs.adrenaline.turnsLeft = pAct.duration || 3;
            this.createBuffSparks(this.player.x, this.player.y, '#10b981');
            this.addFloatingText('💉 TIÊM ADRENALINE! (+20% DMG)', this.player.x, this.player.y, '#10b981');
            this.addCombatLog(`Nhịp #${stepIndex + 1}: Bạn tiêm [Ống Tiêm Adrenaline]! Tăng +20% Sát thương và hồi 5 HP/lượt trong 3 lượt!`, 'hit');
            this.cooldowns[pAct.skillId] = pAct.cooldown || 3;
        }
        else if (pAct.type === 'BUFF_SMOKE') {
            // Thuốc Lá: Tăng +30% DMG, +1 Bước di chuyển trong 2 lượt (lượt hiện tại và lượt sau)
            if (window.soundCtrl) window.soundCtrl.playCigarette();
            this.playerBuffs.cigarette.turnsLeft = pAct.duration || 2;
            this.createBuffSparks(this.player.x, this.player.y, '#f97316');
            this.addFloatingText('🚬 HÚT THUỐC! (+30% DMG & +1 BƯỚC)', this.player.x, this.player.y, '#f97316');
            this.addCombatLog(`Nhịp #${stepIndex + 1}: Bạn châm [Thuốc Lá]! Tăng +30% Sát thương và +1 Tốc độ di chuyển trong 2 lượt!`, 'hit');
        }
        else if (pAct.type === 'HOOK_PULL') {
            // Móc Kéo: Sát thương 15, kéo 1 ô ngay. Hết lượt sau kéo 2 ô rồi mới hồi chiêu 4 lượt!
            const pD = DIRECTIONS[pAct.dir];
            const maxRange = pAct.range || 5;
            if (window.soundCtrl) window.soundCtrl.playHookThrow();

            let hit = false;
            let endX = this.player.x + pD.dx * maxRange;
            let endY = this.player.y + pD.dy * maxRange;

            for (let r = 1; r <= maxRange; r++) {
                const checkX = this.player.x + pD.dx * r;
                const checkY = this.player.y + pD.dy * r;
                if (checkX < 0 || checkX >= GRID_COLS || checkY < 0 || checkY >= GRID_ROWS) break;

                endX = checkX;
                endY = checkY;

                if (this.cpu.x === checkX && this.cpu.y === checkY) {
                    hit = true;
                    playerHitTarget = true;
                    if (this.cpu.shieldDir) {
                        if (window.soundCtrl) window.soundCtrl.playShield();
                        this.addFloatingText('KHIÊN CHẶN MÓC!', this.cpu.x, this.cpu.y, '#60a5fa');
                        this.addCombatLog(`Nhịp #${stepIndex + 1}: CPU giương Khiên chặn đứng lưỡi Móc Kéo! (0 DMG & Không bị kéo)`, 'block');
                    } else {
                        if (window.soundCtrl) window.soundCtrl.playHit();
                        let dmg = pAct.power || 15;
                        if (hasBuffDmg) dmg = Math.round(dmg * pDmgMult);

                        this.applyDamage(this.cpu, dmg);
                        this.createHitSparks(this.cpu.x, this.cpu.y, '#ef4444');

                        // Kéo CPU lại gần Hookman 1 ô
                        const pullX = Math.max(0, Math.min(GRID_COLS - 1, this.cpu.x - pD.dx));
                        const pullY = Math.max(0, Math.min(GRID_ROWS - 1, this.cpu.y - pD.dy));
                        if (pullX !== this.player.x || pullY !== this.player.y) {
                            this.cpu.x = pullX;
                            this.cpu.y = pullY;
                            if (window.soundCtrl) window.soundCtrl.playHookPull();
                        }

                        this.addFloatingText(`-${dmg} HP & KÉO 1 Ô!`, this.cpu.x, this.cpu.y, '#ef4444');
                        this.addCombatLog(`Nhịp #${stepIndex + 1}: [Móc Kéo] GĂM TRÚNG CPU! Gây ${dmg} DMG${buffTag} và kéo CPU lại gần 1 ô!`, 'hit');

                        // Găm dây móc: Hết lượt sau kéo 2 ô rồi mới kích hoạt hồi chiêu 4 lượt
                        this.activeHookTethers = this.activeHookTethers.filter(t => t.source !== 'PLAYER');
                        this.activeHookTethers.push({
                            source: 'PLAYER',
                            target: 'CPU',
                            turnsUntilPull: 1,
                            pullDist: 2,
                            skillId: pAct.skillId,
                            cdAfterPull: pAct.cooldown || 4
                        });
                        this.addCombatLog(`🪝 Dây móc đã găm chặt vào CPU! Hết lượt sau sẽ bị giật kéo thêm 2 ô trước khi hồi chiêu!`, 'clash');
                    }
                    break;
                }
            }

            this.createHookChainEffect(this.player.x, this.player.y, endX, endY);
            if (!hit) {
                this.addFloatingText('MÓC HỤT!', endX, endY, '#94a3b8');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: Lưỡi Móc Kéo phóng vào không trung!`, 'miss');
                this.cooldowns[pAct.skillId] = pAct.cooldown || 4;
            }
        }
        else if (pAct.type === 'ROCKET') {
            // Tên lửa diện rộng: Bay tới 6 ô và nổ ngay khu vực 3x3 quanh đích, NỔ SỚM TẠI CHỖ nếu va chạm địch trên đường bay
            const pD = DIRECTIONS[pAct.dir];
            const maxRange = pAct.range || 6;
            if (window.soundCtrl) window.soundCtrl.playRocketLaunch();

            let targetX = this.player.x + pD.dx * maxRange;
            let targetY = this.player.y + pD.dy * maxRange;
            let earlyImpact = false;

            // Kiểm tra va chạm đối thủ trên đường bay từ ô 1 đến maxRange
            for (let r = 1; r <= maxRange; r++) {
                const cx = this.player.x + pD.dx * r;
                const cy = this.player.y + pD.dy * r;
                if (cx < 0 || cx >= GRID_COLS || cy < 0 || cy >= GRID_ROWS) break;

                targetX = cx;
                targetY = cy;

                if (this.cpu.x === cx && this.cpu.y === cy) {
                    earlyImpact = true;
                    break;
                }
            }

            targetX = Math.max(0, Math.min(GRID_COLS - 1, targetX));
            targetY = Math.max(0, Math.min(GRID_ROWS - 1, targetY));

            this.createRocketTrail(this.player.x, this.player.y, targetX, targetY, '#ef4444');
            await this.delay(180);

            if (window.soundCtrl) window.soundCtrl.playExplosion();
            this.createExplosionBurst(targetX, targetY, 40);

            if (earlyImpact) {
                this.addFloatingText('💥 VA CHẠM NỔ 3x3!', targetX, targetY, '#ef4444');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: 💥 VA CHẠM TRỰC DIỆN! Tên lửa đâm sầm vào CPU trên đường bay, phát nổ 3x3 ngay tại chỗ!`, 'clash');
            } else {
                this.addFloatingText('💥 TÊN LỬA NỔ 3x3!', targetX, targetY, '#ef4444');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: Tên lửa bay đến điểm đích và phát nổ 3x3!`, 'system');
            }

            let dmg = pAct.power || 30;
            if (hasBuffDmg) dmg = Math.round(dmg * pDmgMult);

            // Gây sát thương diện rộng 3x3
            if (Math.abs(this.cpu.x - targetX) <= 1 && Math.abs(this.cpu.y - targetY) <= 1) {
                this.applyDamage(this.cpu, dmg);
                this.createHitSparks(this.cpu.x, this.cpu.y, '#ff3366');
                this.addFloatingText(`-${dmg} HP!`, this.cpu.x, this.cpu.y, '#f87171');
                this.addCombatLog(`💥 Vụ nổ Tên lửa trúng CPU! (-${dmg} HP${buffTag})`, 'hit');
            }
            if (Math.abs(this.player.x - targetX) <= 1 && Math.abs(this.player.y - targetY) <= 1) {
                this.applyDamage(this.player, pAct.power || 30);
                this.createHitSparks(this.player.x, this.player.y, '#00f2fe');
                this.addFloatingText(`-${pAct.power || 30} HP! (DÍNH TÊN LỬA)`, this.player.x, this.player.y, '#f87171');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: Bạn tự dính vụ nổ Tên lửa của mình! Mất ${pAct.power || 30} HP!`, 'hit');
            }
        }
        else if (pAct.type === 'BOMB_LAUNCHER') {
            // Súng bắn bom: 2 viên đạn lưu trữ, tầm 6 ô nổ 3x3 quanh đích, NỔ SỚM TẠI CHỖ nếu chạm địch trên đường bay
            const pD = DIRECTIONS[pAct.dir];
            const maxRange = pAct.range || 6;
            if (window.soundCtrl) window.soundCtrl.playBombLauncher();

            // Tiêu hao 1 viên đạn
            const currentAmmo = this.skillAmmo[pAct.skillId] !== undefined ? this.skillAmmo[pAct.skillId] : 2;
            const remainingAmmo = Math.max(0, currentAmmo - 1);
            this.skillAmmo[pAct.skillId] = remainingAmmo;

            if (remainingAmmo === 0) {
                this.cooldowns[pAct.skillId] = pAct.cooldown || 4;
                this.addCombatLog(`⚠️ Súng Bắn Bom đã bắn hết cả 2 viên! Bắt đầu hồi chiêu 4 lượt để nạp đạn!`, 'system');
            } else {
                this.addCombatLog(`[Súng Bắn Bom] còn lại ${remainingAmmo}/2 viên trong nòng!`, 'system');
            }

            let targetX = this.player.x + pD.dx * maxRange;
            let targetY = this.player.y + pD.dy * maxRange;
            let earlyImpact = false;

            // Kiểm tra va chạm địch trên đường bay từ ô 1 đến maxRange
            for (let r = 1; r <= maxRange; r++) {
                const cx = this.player.x + pD.dx * r;
                const cy = this.player.y + pD.dy * r;
                if (cx < 0 || cx >= GRID_COLS || cy < 0 || cy >= GRID_ROWS) break;

                targetX = cx;
                targetY = cy;

                if (this.cpu.x === cx && this.cpu.y === cy) {
                    earlyImpact = true;
                    break;
                }
            }

            targetX = Math.max(0, Math.min(GRID_COLS - 1, targetX));
            targetY = Math.max(0, Math.min(GRID_ROWS - 1, targetY));

            this.createRocketTrail(this.player.x, this.player.y, targetX, targetY, '#f97316');
            await this.delay(180);

            if (window.soundCtrl) window.soundCtrl.playExplosion();
            this.createExplosionBurst(targetX, targetY, 40);

            if (earlyImpact) {
                this.addFloatingText('💥 VA CHẠM NỔ 3x3!', targetX, targetY, '#f97316');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: 💥 VA CHẠM TRỰC DIỆN! Quả bom đâm sầm vào CPU trên đường bay, phát nổ 3x3 ngay tại chỗ!`, 'clash');
            } else {
                this.addFloatingText('💥 BOM PHÓNG NỔ 3x3!', targetX, targetY, '#f97316');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: Quả bom bay đến điểm đích và phát nổ 3x3!`, 'system');
            }

            let dmg = pAct.power || 30;
            if (hasBuffDmg) dmg = Math.round(dmg * pDmgMult);

            // Gây sát thương diện rộng 3x3
            if (Math.abs(this.cpu.x - targetX) <= 1 && Math.abs(this.cpu.y - targetY) <= 1) {
                this.applyDamage(this.cpu, dmg);
                this.createHitSparks(this.cpu.x, this.cpu.y, '#ff3366');
                this.addFloatingText(`-${dmg} HP!`, this.cpu.x, this.cpu.y, '#f87171');
                this.addCombatLog(`💥 Vụ nổ Súng Bắn Bom trúng CPU! (-${dmg} HP${buffTag})`, 'hit');
            }
            if (Math.abs(this.player.x - targetX) <= 1 && Math.abs(this.player.y - targetY) <= 1) {
                this.applyDamage(this.player, pAct.power || 30);
                this.createHitSparks(this.player.x, this.player.y, '#f97316');
                this.addFloatingText(`-${pAct.power || 30} HP! (DÍNH BOM)`, this.player.x, this.player.y, '#f87171');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: Bạn tự dính vụ nổ bom của mình! Mất ${pAct.power || 30} HP!`, 'hit');
            }
        }
        else if (pAct.type === 'GRENADE') {
            // Lựu đạn hẹn giờ 2 lượt, nổ 3x3
            const pD = DIRECTIONS[pAct.dir];
            const maxRange = pAct.range || 5;

            let targetX = this.player.x + pD.dx * maxRange;
            let targetY = this.player.y + pD.dy * maxRange;

            for (let r = 1; r <= maxRange; r++) {
                const cx = this.player.x + pD.dx * r;
                const cy = this.player.y + pD.dy * r;
                if (this.cpu.x === cx && this.cpu.y === cy) {
                    targetX = cx; targetY = cy;
                    break;
                }
            }

            targetX = Math.max(0, Math.min(GRID_COLS - 1, targetX));
            targetY = Math.max(0, Math.min(GRID_ROWS - 1, targetY));

            this.createGrenadeArc(this.player.x, this.player.y, targetX, targetY);
            if (window.soundCtrl) window.soundCtrl.playGrenadeTick();

            this.groundHazards.push({
                id: Date.now() + Math.random(),
                type: 'GRENADE',
                x: targetX,
                y: targetY,
                turnsLeft: 2,
                power: pAct.power || 50,
                aoeRadius: 1,
                owner: 'PLAYER'
            });

            this.addFloatingText('💣 LỰU ĐẠN (ĐẾM 2 LƯỢT)!', targetX, targetY, '#f59e0b');
            this.addCombatLog(`Nhịp #${stepIndex + 1}: Ném lựu đạn tới (${targetX}, ${targetY})! Sẽ phát nổ 3x3 sau 2 lượt!`, 'clash');
        }
        else if (pAct.type === 'RECT_SLASH') {
            // Kiếm Gắn Tay: Chém quét hình chữ nhật 3x2 trong 4 hướng chính (Trái, Phải, Trên, Dưới), 60 DMG
            if (window.soundCtrl) window.soundCtrl.playCyberBladeSlash();

            // Quản lý cơ số 2 lượt dùng (Ammo)
            const currentAmmo = this.skillAmmo[pAct.skillId] !== undefined ? this.skillAmmo[pAct.skillId] : 2;
            const remainingAmmo = Math.max(0, currentAmmo - 1);
            this.skillAmmo[pAct.skillId] = remainingAmmo;

            if (remainingAmmo === 0) {
                this.cooldowns[pAct.skillId] = pAct.cooldown || 4;
                this.addCombatLog(`⚠️ [Kiếm Gắn Tay] đã dùng hết cả 2 lượt! Bắt đầu hồi chiêu 4 lượt để tích tụ năng lượng!`, 'system');
            } else {
                this.addCombatLog(`[Kiếm Gắn Tay] còn lại ${remainingAmmo}/2 lượt sử dụng trong nòng năng lượng!`, 'system');
            }

            // Tính 6 ô hình chữ nhật 3x2
            const slashTiles = this.getRectSlashTiles(this.player.x, this.player.y, pAct.dir);
            this.createRectSlashEffect(slashTiles, '#06b6d4');
            await this.delay(220);

            // Kiểm tra trúng CPU
            const isCpuHit = slashTiles.some(t => t.x === this.cpu.x && t.y === this.cpu.y);

            if (isCpuHit) {
                playerHitTarget = true;
                if (this.cpu.shieldDir) {
                    if (window.soundCtrl) window.soundCtrl.playShield();
                    this.addFloatingText('CHẶN ĐỨNG KIẾM!', this.cpu.x, this.cpu.y, '#60a5fa');
                    this.addCombatLog(`Nhịp #${stepIndex + 1}: CPU giương Khiên chặn đứng đường kiếm 3x2 của Razor! (0 DMG)`, 'block');
                } else {
                    if (window.soundCtrl) window.soundCtrl.playHit();
                    let dmg = pAct.power || 60;
                    if (hasBuffDmg) dmg = Math.round(dmg * pDmgMult);
                    if (cAct.type === 'LEAP') dmg = Math.round(dmg * 0.75);

                    this.applyDamage(this.cpu, dmg);
                    this.createHitSparks(this.cpu.x, this.cpu.y, '#06b6d4');
                    this.addFloatingText(`-${dmg} HP!`, this.cpu.x, this.cpu.y, '#f87171');
                    this.addCombatLog(`Nhịp #${stepIndex + 1}: 🗡️ [Kiếm Gắn Tay] CHÉM QUÉT HÌNH CHỮ NHẬT 3x2 TRÚNG CPU! Gây ${dmg} DMG${buffTag}!`, 'hit');
                }
            } else {
                this.addFloatingText('CHÉM HỤT!', this.player.x, this.player.y, '#94a3b8');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: [Kiếm Gắn Tay] quét qua 6 ô không khí (${DIRECTIONS[pAct.dir].label})!`, 'miss');
            }
        }

        // --- 3.2 CPU Actions ---
        const cpuHasAdrenaline = (this.cpuBuffs && this.cpuBuffs.adrenaline && this.cpuBuffs.adrenaline.turnsLeft > 0);
        const cpuHasCigarette = (this.cpuBuffs && this.cpuBuffs.cigarette && this.cpuBuffs.cigarette.turnsLeft > 0);
        let cDmgMult = 1.0;
        let cpuBuffTag = '';
        if (cpuHasAdrenaline) {
            cDmgMult *= 1.2;
            cpuBuffTag += ' (+20% Adrenaline)';
        }
        if (cpuHasCigarette) {
            cDmgMult *= 1.3;
            cpuBuffTag += ' (+30% Thuốc Lá)';
        }
        const cpuHasBuffDmg = cpuHasAdrenaline || cpuHasCigarette;

        if (cAct.type === 'ATTACK') {
            const cD = DIRECTIONS[cAct.dir];
            const attackRange = cAct.range || 1;
            const targetX = this.cpu.x + cD.dx * attackRange;
            const targetY = this.cpu.y + cD.dy * attackRange;
            this.createSlashEffect(targetX, targetY, '#ff3366');

            if (this.player.x === targetX && this.player.y === targetY) {
                cpuHitTarget = true;
                if (this.player.shieldDir) {
                    if (window.soundCtrl) window.soundCtrl.playShield();
                    this.addFloatingText('CHẶN ĐỨNG!', this.player.x, this.player.y, '#38bdf8');
                    this.addCombatLog(`Nhịp #${stepIndex + 1}: CPU tấn công nhưng bạn giương Khiên chặn thành công!`, 'block');
                } else {
                    if (window.soundCtrl) window.soundCtrl.playHit();
                    let dmg = cAct.power || 25;
                    if (cpuHasBuffDmg) dmg = Math.round(dmg * cDmgMult);
                    if (pAct.type === 'LEAP') {
                        dmg = Math.round(dmg * 0.75);
                        this.addFloatingText(`-${dmg} HP! (GIẢM 25%)`, this.player.x, this.player.y, '#f87171');
                        this.addCombatLog(`🛡️ [Nhảy Đột Kích] Giảm 25% sát thương nhận phải trên đường đi! (Chỉ nhận ${dmg} DMG)`, 'buff');
                    } else {
                        this.addFloatingText(`-${dmg} HP!`, this.player.x, this.player.y, '#f87171');
                    }
                    this.applyDamage(this.player, dmg);
                    this.createHitSparks(this.player.x, this.player.y, this.player.color);
                    this.addCombatLog(`Nhịp #${stepIndex + 1}: CPU ĐÁNH TRÚNG BẠN! Mất ${dmg} HP${cpuBuffTag}!`, 'hit');

                    const playerIsHookman = this.player.charId === 'hookman' || (this.selectedCharacter && this.selectedCharacter.id === 'hookman');
                    if (playerIsHookman) {
                        this.playerRevealedTurns = 2;
                        this.addFloatingText('HIỆN HÌNH!', this.player.x, this.player.y, '#f43f5e');
                        this.addCombatLog(`💥 Hookman bị đánh trúng! Hiện nguyên hình và không thể tàng hình tới hết lượt sau!`, 'clash');
                    }
                }
            } else {
                this.addFloatingText('CPU HỤT!', targetX, targetY, '#94a3b8');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: CPU đánh hụt vì bạn đã né tránh!`, 'miss');
            }
        }
        else if (cAct.type === 'RANGED_LINE' || cAct.type === 'RANGED_VARIABLE') {
            const cD = DIRECTIONS[cAct.dir];
            const maxRange = cAct.range || 5;
            if (cAct.skillId === 'RAZOR_PULSE_RIFLE') {
                if (window.soundCtrl) window.soundCtrl.playPulseRifle();
            } else if (cAct.type === 'RANGED_VARIABLE') {
                if (window.soundCtrl) window.soundCtrl.playSilencedPistol();
            } else {
                if (window.soundCtrl) window.soundCtrl.playRifleShot();
            }

            let hit = false;
            let endX = this.cpu.x + cD.dx * maxRange;
            let endY = this.cpu.y + cD.dy * maxRange;

            for (let r = 1; r <= maxRange; r++) {
                const checkX = this.cpu.x + cD.dx * r;
                const checkY = this.cpu.y + cD.dy * r;
                if (checkX < 0 || checkX >= GRID_COLS || checkY < 0 || checkY >= GRID_ROWS) break;

                endX = checkX;
                endY = checkY;

                if (this.player.x === checkX && this.player.y === checkY) {
                    hit = true;
                    cpuHitTarget = true;
                    if (this.player.shieldDir) {
                        if (window.soundCtrl) window.soundCtrl.playShield();
                        this.addFloatingText('CHẶN ĐƯỢC!', this.player.x, this.player.y, '#38bdf8');
                        this.addCombatLog(`Nhịp #${stepIndex + 1}: Bạn giương Khiên chặn loạt đạn tầm xa của CPU!`, 'block');
                        const playerIsHookman = this.player.charId === 'hookman' || (this.selectedCharacter && this.selectedCharacter.id === 'hookman');
                        if (playerIsHookman) {
                            this.playerRevealedTurns = 2;
                            this.addFloatingText('HIỆN HÌNH!', this.player.x, this.player.y, '#f43f5e');
                            this.addCombatLog(`💥 Hookman giương Khiên chặn đạn nhưng vị trí đã bị lộ! Không thể tàng hình tới hết lượt sau!`, 'clash');
                        }
                    } else {
                        if (window.soundCtrl) window.soundCtrl.playHit();
                        let dmg = cAct.power || 20;
                        if (cAct.type === 'RANGED_VARIABLE') {
                            const minD = cAct.minPower !== undefined ? cAct.minPower : 15;
                            const maxD = cAct.maxPower !== undefined ? cAct.maxPower : 20;
                            dmg = Math.floor(Math.random() * (maxD - minD + 1)) + minD;
                        }
                        if (cpuHasBuffDmg) dmg = Math.round(dmg * cDmgMult);
                        if (pAct.type === 'LEAP') {
                            dmg = Math.round(dmg * 0.75);
                            this.addFloatingText(`-${dmg} HP! (GIẢM 25%)`, this.player.x, this.player.y, '#f87171');
                            this.addCombatLog(`🛡️ [Nhảy Đột Kích] Giảm 25% sát thương nhận phải trên đường đi! (Chỉ nhận ${dmg} DMG)`, 'buff');
                        } else {
                            this.addFloatingText(`-${dmg} HP!`, this.player.x, this.player.y, '#f87171');
                        }
                        this.applyDamage(this.player, dmg);
                        this.createHitSparks(this.player.x, this.player.y, this.player.color);

                        const playerIsHookman = this.player.charId === 'hookman' || (this.selectedCharacter && this.selectedCharacter.id === 'hookman');
                        if (playerIsHookman) {
                            this.playerRevealedTurns = 2;
                            this.addFloatingText('HIỆN HÌNH!', this.player.x, this.player.y, '#f43f5e');
                            if (cAct.isBlindFire) {
                                this.addCombatLog(`🎯 ĐẠN BẮN BỪA VÔ TÌNH TRÚNG HOOKMAN! Gây ${dmg} DMG${cpuBuffTag}! Hookman hiện nguyên hình và không thể tàng hình tới hết lượt sau!`, 'clash');
                            } else {
                                this.addCombatLog(`💥 Nhịp #${stepIndex + 1}: Hookman trúng đạn (-${dmg} HP${cpuBuffTag})! Hiện nguyên hình và không thể tàng hình tới hết lượt sau!`, 'clash');
                            }
                        } else {
                            this.addCombatLog(`Nhịp #${stepIndex + 1}: CPU bắn tầm xa TRÚNG BẠN! Mất ${dmg} HP${cpuBuffTag}!`, 'hit');
                        }
                    }
                    break;
                }
            }

            let tracerColor = '#ff3366';
            if (cAct.skillId === 'RAZOR_PULSE_RIFLE') tracerColor = '#06b6d4';
            else if (cAct.skillId === 'SMOKE_RIFLE') tracerColor = '#fb923c';
            else if (cAct.skillId === 'TROOPER_RIFLE') tracerColor = '#34d399';
            else if (cAct.type === 'RANGED_VARIABLE') tracerColor = '#a78bfa';

            this.createBulletTracer(this.cpu.x, this.cpu.y, endX, endY, tracerColor);
            if (!hit) {
                this.addFloatingText('ĐẠN TRƯỢT!', endX, endY, '#94a3b8');
                if (cAct.isBlindFire) {
                    this.addCombatLog(`Nhịp #${stepIndex + 1}: CPU bắn bừa bãi thăm dò bóng tối nhưng đạn không trúng ai!`, 'miss');
                } else {
                    this.addCombatLog(`Nhịp #${stepIndex + 1}: Đạn tầm xa của CPU bắn trượt!`, 'miss');
                }
            }
        }
        else if (cAct.type === 'BUFF_HEAL') {
            // Hookman: Ống Tiêm Adrenaline
            if (window.soundCtrl) window.soundCtrl.playAdrenaline();
            this.cpuBuffs.adrenaline.turnsLeft = cAct.duration || 3;
            this.createBuffSparks(this.cpu.x, this.cpu.y, '#10b981');
            this.addFloatingText('💉 TIÊM ADRENALINE! (+20% DMG)', this.cpu.x, this.cpu.y, '#10b981');
            this.addCombatLog(`Nhịp #${stepIndex + 1}: CPU [${this.cpu.name}] tiêm [Adrenaline]! Tăng +20% Sát thương và hồi 5 HP/lượt trong 3 lượt!`, 'hit');
            this.cpuCooldowns[cAct.skillId] = cAct.cooldown || 3;
        }
        else if (cAct.type === 'BUFF_SMOKE') {
            // Smoke Guy: Thuốc Lá
            if (window.soundCtrl) window.soundCtrl.playCigarette();
            this.cpuBuffs.cigarette.turnsLeft = cAct.duration || 2;
            this.createBuffSparks(this.cpu.x, this.cpu.y, '#f97316');
            this.addFloatingText('🚬 HÚT THUỐC! (+30% DMG & +1 BƯỚC)', this.cpu.x, this.cpu.y, '#f97316');
            this.addCombatLog(`Nhịp #${stepIndex + 1}: CPU [${this.cpu.name}] châm [Thuốc Lá]! Tăng +30% Sát thương và +1 Bước di chuyển trong 2 lượt!`, 'hit');
        }
        else if (cAct.type === 'HOOK_PULL') {
            // Hookman: Móc Kéo
            const cD = DIRECTIONS[cAct.dir];
            const maxRange = cAct.range || 6;
            if (window.soundCtrl) window.soundCtrl.playHookThrow();

            let hit = false;
            let endX = this.cpu.x + cD.dx * maxRange;
            let endY = this.cpu.y + cD.dy * maxRange;

            for (let r = 1; r <= maxRange; r++) {
                const checkX = this.cpu.x + cD.dx * r;
                const checkY = this.cpu.y + cD.dy * r;
                if (checkX < 0 || checkX >= GRID_COLS || checkY < 0 || checkY >= GRID_ROWS) break;

                endX = checkX;
                endY = checkY;

                if (this.player.x === checkX && this.player.y === checkY) {
                    hit = true;
                    cpuHitTarget = true;
                    if (this.player.shieldDir) {
                        if (window.soundCtrl) window.soundCtrl.playShield();
                        this.addFloatingText('KHIÊN CHẶN MÓC!', this.player.x, this.player.y, '#38bdf8');
                        this.addCombatLog(`Nhịp #${stepIndex + 1}: Bạn giương Khiên chặn đứng lưỡi Móc Kéo của CPU!`, 'block');
                    } else {
                        if (window.soundCtrl) window.soundCtrl.playHit();
                        let dmg = cAct.power || 15;
                        if (cpuHasBuffDmg) dmg = Math.round(dmg * cDmgMult);
                        if (pAct.type === 'LEAP') {
                            dmg = Math.round(dmg * 0.75);
                            this.addFloatingText(`-${dmg} HP! (GIẢM 25%)`, this.player.x, this.player.y, '#f87171');
                            this.addCombatLog(`🛡️ [Nhảy Đột Kích] Giảm 25% sát thương nhận phải! (Chỉ nhận ${dmg} DMG)`, 'buff');
                        } else {
                            this.addFloatingText(`-${dmg} HP & BỊ KÉO!`, this.player.x, this.player.y, '#ef4444');
                        }

                        this.applyDamage(this.player, dmg);
                        this.createHitSparks(this.player.x, this.player.y, this.player.color);

                        // Kéo Người chơi lại gần CPU 1 ô
                        const pullX = Math.max(0, Math.min(GRID_COLS - 1, this.player.x - cD.dx));
                        const pullY = Math.max(0, Math.min(GRID_ROWS - 1, this.player.y - cD.dy));
                        if (pullX !== this.cpu.x || pullY !== this.cpu.y) {
                            this.player.x = pullX;
                            this.player.y = pullY;
                            if (window.soundCtrl) window.soundCtrl.playHookPull();
                        }

                        this.addCombatLog(`Nhịp #${stepIndex + 1}: CPU [Móc Kéo] GĂM TRÚNG BẠN! Gây ${dmg} DMG${cpuBuffTag} và kéo bạn lại gần 1 ô!`, 'hit');

                        const playerIsHookman = this.player.charId === 'hookman' || (this.selectedCharacter && this.selectedCharacter.id === 'hookman');
                        if (playerIsHookman) {
                            this.playerRevealedTurns = 2;
                            this.addFloatingText('HIỆN HÌNH!', this.player.x, this.player.y, '#f43f5e');
                            this.addCombatLog(`💥 Hookman bị móc trúng! Hiện nguyên hình và không thể tàng hình tới hết lượt sau!`, 'clash');
                        }

                        // Găm dây móc: Hết lượt sau kéo 2 ô rồi mới kích hoạt hồi chiêu 4 lượt
                        this.activeHookTethers = this.activeHookTethers.filter(t => t.source !== 'CPU');
                        this.activeHookTethers.push({
                            source: 'CPU',
                            target: 'PLAYER',
                            turnsUntilPull: 1,
                            pullDist: 2,
                            skillId: cAct.skillId,
                            cdAfterPull: cAct.cooldown || 4
                        });
                        this.addCombatLog(`🪝 Dây móc của CPU đã găm chặt vào bạn! Hết lượt sau bạn sẽ bị giật kéo thêm 2 ô!`, 'clash');
                    }
                    break;
                }
            }

            this.createHookChainEffect(this.cpu.x, this.cpu.y, endX, endY);
            if (!hit) {
                this.addFloatingText('MÓC HỤT!', endX, endY, '#94a3b8');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: Móc Kéo của CPU bắn hụt!`, 'miss');
                this.cpuCooldowns[cAct.skillId] = cAct.cooldown || 4;
            }
        }
        else if (cAct.type === 'ROCKET') {
            // Trooper: Tên Lửa (tầm 6, nổ 3x3 quanh đích hoặc nổ sớm tại chỗ nếu va chạm)
            const cD = DIRECTIONS[cAct.dir];
            const maxRange = cAct.range || 6;
            if (window.soundCtrl) window.soundCtrl.playRocketLaunch();

            let targetX = this.cpu.x + cD.dx * maxRange;
            let targetY = this.cpu.y + cD.dy * maxRange;
            let earlyImpact = false;

            for (let r = 1; r <= maxRange; r++) {
                const cx = this.cpu.x + cD.dx * r;
                const cy = this.cpu.y + cD.dy * r;
                if (cx < 0 || cx >= GRID_COLS || cy < 0 || cy >= GRID_ROWS) break;

                targetX = cx;
                targetY = cy;

                if (this.player.x === cx && this.player.y === cy) {
                    earlyImpact = true;
                    break;
                }
            }

            targetX = Math.max(0, Math.min(GRID_COLS - 1, targetX));
            targetY = Math.max(0, Math.min(GRID_ROWS - 1, targetY));

            this.createRocketTrail(this.cpu.x, this.cpu.y, targetX, targetY, '#ef4444');
            await this.delay(180);

            if (window.soundCtrl) window.soundCtrl.playExplosion();
            this.createExplosionBurst(targetX, targetY, 40);

            if (earlyImpact) {
                this.addFloatingText('💥 VA CHẠM NỔ 3x3!', targetX, targetY, '#ef4444');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: 💥 VA CHẠM TRỰC DIỆN! Tên lửa CPU đâm sầm vào bạn trên đường bay, phát nổ 3x3 ngay tại chỗ!`, 'clash');
            } else {
                this.addFloatingText('💥 TÊN LỬA NỔ 3x3!', targetX, targetY, '#ef4444');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: Tên lửa của CPU bay đến điểm đích và phát nổ 3x3!`, 'system');
            }

            let dmg = cAct.power || 30;
            if (cpuHasBuffDmg) dmg = Math.round(dmg * cDmgMult);

            if (Math.abs(this.player.x - targetX) <= 1 && Math.abs(this.player.y - targetY) <= 1) {
                cpuHitTarget = true;
                let finalDmg = dmg;
                if (pAct.type === 'LEAP') {
                    finalDmg = Math.round(finalDmg * 0.75);
                    this.addFloatingText(`-${finalDmg} HP! (GIẢM 25%)`, this.player.x, this.player.y, '#f87171');
                    this.addCombatLog(`🛡️ [Nhảy Đột Kích] Giảm 25% sát thương nhận phải! (Chỉ nhận ${finalDmg} DMG)`, 'buff');
                } else {
                    this.addFloatingText(`-${finalDmg} HP!`, this.player.x, this.player.y, '#f87171');
                }
                this.applyDamage(this.player, finalDmg);
                this.createHitSparks(this.player.x, this.player.y, this.player.color);
                this.addCombatLog(`💥 Vụ nổ Tên lửa của CPU trúng BẠN! (-${finalDmg} HP${cpuBuffTag})`, 'hit');

                const playerIsHookman = this.player.charId === 'hookman' || (this.selectedCharacter && this.selectedCharacter.id === 'hookman');
                if (playerIsHookman) {
                    this.playerRevealedTurns = 2;
                    this.addFloatingText('HIỆN HÌNH!', this.player.x, this.player.y, '#f43f5e');
                    this.addCombatLog(`💥 Hookman bị trúng vụ nổ! Hiện nguyên hình và không thể tàng hình tới hết lượt sau!`, 'clash');
                }
            }
            if (Math.abs(this.cpu.x - targetX) <= 1 && Math.abs(this.cpu.y - targetY) <= 1) {
                this.applyDamage(this.cpu, cAct.power || 30);
                this.createHitSparks(this.cpu.x, this.cpu.y, '#ff3366');
                this.addFloatingText(`-${cAct.power || 30} HP! (TỰ DÍNH ĐÒN)`, this.cpu.x, this.cpu.y, '#f87171');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: CPU tự dính vụ nổ Tên lửa của mình! Mất ${cAct.power || 30} HP!`, 'hit');
            }
        }
        else if (cAct.type === 'BOMB_LAUNCHER') {
            // Smoke Guy: Súng Bắn Bom (2 viên đạn)
            const cD = DIRECTIONS[cAct.dir];
            const maxRange = cAct.range || 6;
            if (window.soundCtrl) window.soundCtrl.playBombLauncher();

            const currentAmmo = this.cpuSkillAmmo[cAct.skillId] !== undefined ? this.cpuSkillAmmo[cAct.skillId] : 2;
            const remainingAmmo = Math.max(0, currentAmmo - 1);
            this.cpuSkillAmmo[cAct.skillId] = remainingAmmo;

            if (remainingAmmo === 0) {
                this.cpuCooldowns[cAct.skillId] = cAct.cooldown || 4;
                this.addCombatLog(`⚠️ Súng Bắn Bom của CPU đã bắn hết cả 2 viên! Bắt đầu hồi chiêu 4 lượt!`, 'system');
            } else {
                this.addCombatLog(`[Súng Bắn Bom] của CPU còn lại ${remainingAmmo}/2 viên!`, 'system');
            }

            let targetX = this.cpu.x + cD.dx * maxRange;
            let targetY = this.cpu.y + cD.dy * maxRange;
            let earlyImpact = false;

            for (let r = 1; r <= maxRange; r++) {
                const cx = this.cpu.x + cD.dx * r;
                const cy = this.cpu.y + cD.dy * r;
                if (cx < 0 || cx >= GRID_COLS || cy < 0 || cy >= GRID_ROWS) break;

                targetX = cx;
                targetY = cy;

                if (this.player.x === cx && this.player.y === cy) {
                    earlyImpact = true;
                    break;
                }
            }

            targetX = Math.max(0, Math.min(GRID_COLS - 1, targetX));
            targetY = Math.max(0, Math.min(GRID_ROWS - 1, targetY));

            this.createRocketTrail(this.cpu.x, this.cpu.y, targetX, targetY, '#f97316');
            await this.delay(180);

            if (window.soundCtrl) window.soundCtrl.playExplosion();
            this.createExplosionBurst(targetX, targetY, 40);

            if (earlyImpact) {
                this.addFloatingText('💥 VA CHẠM NỔ 3x3!', targetX, targetY, '#f97316');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: 💥 VA CHẠM TRỰC DIỆN! Bom CPU đâm sầm vào bạn trên đường bay, phát nổ 3x3!`, 'clash');
            } else {
                this.addFloatingText('💥 BOM PHÓNG NỔ 3x3!', targetX, targetY, '#f97316');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: Quả bom của CPU bay đến điểm đích và phát nổ 3x3!`, 'system');
            }

            let dmg = cAct.power || 30;
            if (cpuHasBuffDmg) dmg = Math.round(dmg * cDmgMult);

            if (Math.abs(this.player.x - targetX) <= 1 && Math.abs(this.player.y - targetY) <= 1) {
                cpuHitTarget = true;
                let finalDmg = dmg;
                if (pAct.type === 'LEAP') {
                    finalDmg = Math.round(finalDmg * 0.75);
                    this.addFloatingText(`-${finalDmg} HP! (GIẢM 25%)`, this.player.x, this.player.y, '#f87171');
                    this.addCombatLog(`🛡️ [Nhảy Đột Kích] Giảm 25% sát thương nhận phải! (Chỉ nhận ${finalDmg} DMG)`, 'buff');
                } else {
                    this.addFloatingText(`-${finalDmg} HP!`, this.player.x, this.player.y, '#f87171');
                }
                this.applyDamage(this.player, finalDmg);
                this.createHitSparks(this.player.x, this.player.y, this.player.color);
                this.addCombatLog(`💥 Vụ nổ bom của CPU trúng BẠN! (-${finalDmg} HP${cpuBuffTag})`, 'hit');

                const playerIsHookman = this.player.charId === 'hookman' || (this.selectedCharacter && this.selectedCharacter.id === 'hookman');
                if (playerIsHookman) {
                    this.playerRevealedTurns = 2;
                    this.addFloatingText('HIỆN HÌNH!', this.player.x, this.player.y, '#f43f5e');
                    this.addCombatLog(`💥 Hookman bị trúng bom! Hiện nguyên hình và không thể tàng hình tới hết lượt sau!`, 'clash');
                }
            }
            if (Math.abs(this.cpu.x - targetX) <= 1 && Math.abs(this.cpu.y - targetY) <= 1) {
                this.applyDamage(this.cpu, cAct.power || 30);
                this.createHitSparks(this.cpu.x, this.cpu.y, '#ff3366');
                this.addFloatingText(`-${cAct.power || 30} HP! (TỰ DÍNH BOM)`, this.cpu.x, this.cpu.y, '#f87171');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: CPU tự dính vụ nổ bom của mình! Mất ${cAct.power || 30} HP!`, 'hit');
            }
        }
        else if (cAct.type === 'GRENADE') {
            // Trooper: Lựu Đạn hẹn giờ 2 lượt
            const cD = DIRECTIONS[cAct.dir];
            const maxRange = cAct.range || 5;

            let targetX = cAct.targetX !== undefined ? cAct.targetX : (this.cpu.x + cD.dx * maxRange);
            let targetY = cAct.targetY !== undefined ? cAct.targetY : (this.cpu.y + cD.dy * maxRange);

            targetX = Math.max(0, Math.min(GRID_COLS - 1, targetX));
            targetY = Math.max(0, Math.min(GRID_ROWS - 1, targetY));

            this.createGrenadeArc(this.cpu.x, this.cpu.y, targetX, targetY);
            if (window.soundCtrl) window.soundCtrl.playGrenadeTick();

            this.groundHazards.push({
                id: Date.now() + Math.random(),
                type: 'GRENADE',
                x: targetX,
                y: targetY,
                turnsLeft: 2,
                power: cAct.power || 50,
                aoeRadius: 1,
                owner: 'CPU'
            });

            this.addFloatingText('💣 LỰU ĐẠN CPU (2 LƯỢT)!', targetX, targetY, '#f59e0b');
            this.addCombatLog(`Nhịp #${stepIndex + 1}: CPU ném lựu đạn hẹn giờ tới (${targetX}, ${targetY})! Sẽ phát nổ 3x3 sau 2 lượt!`, 'clash');
        }
        else if (cAct.type === 'RECT_SLASH') {
            // Razor: Kiếm Gắn Tay (3x2 trong 4 hướng chính, 2 lượt dùng)
            if (window.soundCtrl) window.soundCtrl.playCyberBladeSlash();

            const currentAmmo = this.cpuSkillAmmo[cAct.skillId] !== undefined ? this.cpuSkillAmmo[cAct.skillId] : 2;
            const remainingAmmo = Math.max(0, currentAmmo - 1);
            this.cpuSkillAmmo[cAct.skillId] = remainingAmmo;

            if (remainingAmmo === 0) {
                this.cpuCooldowns[cAct.skillId] = cAct.cooldown || 4;
                this.addCombatLog(`⚠️ [Kiếm Gắn Tay] của CPU đã dùng hết cả 2 lượt! Bắt đầu hồi chiêu 4 lượt!`, 'system');
            } else {
                this.addCombatLog(`[Kiếm Gắn Tay] của CPU còn lại ${remainingAmmo}/2 lượt sử dụng!`, 'system');
            }

            const slashTiles = this.getRectSlashTiles(this.cpu.x, this.cpu.y, cAct.dir);
            this.createRectSlashEffect(slashTiles, '#ff3366');
            await this.delay(220);

            const isPlayerHit = slashTiles.some(t => t.x === this.player.x && t.y === this.player.y);
            if (isPlayerHit) {
                cpuHitTarget = true;
                if (this.player.shieldDir) {
                    if (window.soundCtrl) window.soundCtrl.playShield();
                    this.addFloatingText('CHẶN ĐỨNG!', this.player.x, this.player.y, '#38bdf8');
                    this.addCombatLog(`Nhịp #${stepIndex + 1}: Bạn giương Khiên chặn đứng đường kiếm 3x2 của CPU!`, 'block');
                } else {
                    if (window.soundCtrl) window.soundCtrl.playHit();
                    let dmg = cAct.power || 60;
                    if (cpuHasBuffDmg) dmg = Math.round(dmg * cDmgMult);
                    if (pAct.type === 'LEAP') {
                        dmg = Math.round(dmg * 0.75);
                        this.addFloatingText(`-${dmg} HP! (GIẢM 25%)`, this.player.x, this.player.y, '#f87171');
                        this.addCombatLog(`🛡️ [Nhảy Đột Kích] Giảm 25% sát thương nhận phải trên đường đi! (Chỉ nhận ${dmg} DMG)`, 'buff');
                    } else {
                        this.addFloatingText(`-${dmg} HP!`, this.player.x, this.player.y, '#f87171');
                    }
                    this.applyDamage(this.player, dmg);
                    this.createHitSparks(this.player.x, this.player.y, this.player.color);
                    this.addCombatLog(`Nhịp #${stepIndex + 1}: CPU chém Kiếm Gắn Tay TRÚNG BẠN! Mất ${dmg} HP${cpuBuffTag}!`, 'hit');

                    const playerIsHookman = this.player.charId === 'hookman' || (this.selectedCharacter && this.selectedCharacter.id === 'hookman');
                    if (playerIsHookman) {
                        this.playerRevealedTurns = 2;
                        this.addFloatingText('HIỆN HÌNH!', this.player.x, this.player.y, '#f43f5e');
                        this.addCombatLog(`💥 Hookman bị chém trúng! Hiện nguyên hình và không thể tàng hình tới hết lượt sau!`, 'clash');
                    }
                }
            } else {
                this.addFloatingText('CPU CHÉM HỤT!', this.cpu.x, this.cpu.y, '#94a3b8');
                this.addCombatLog(`Nhịp #${stepIndex + 1}: [Kiếm Gắn Tay] của CPU chém hụt vào không khí!`, 'miss');
            }
        }

        if (playerHitTarget && cpuHitTarget && !this.player.shieldDir && !this.cpu.shieldDir) {
            this.addCombatLog(`⚡ ĐÔI CÔNG (CROSS COUNTER)! Cả 2 cùng trúng đòn!`, 'clash');
        }

        this.updateHUD();

        if (this.player.hp <= 0 || this.cpu.hp <= 0) {
            this.handleGameOver();
            return;
        }

        await this.delay(450);
        this.executeResolutionStep(stepIndex + 1);
    }

    finishTurn() {
        this.addCombatLog(`Hoàn thành Lượt ${this.turn}!`, 'system');

        // 0. Giảm thời gian Hookman bị lộ diện (Revealed Turns)
        if (this.playerRevealedTurns > 0) {
            this.playerRevealedTurns--;
            if (this.playerRevealedTurns === 0) {
                this.addCombatLog(`👁️ Hookman đã xóa sạch dấu vết, có thể tàng hình lại nếu ở ngoài 7x7!`, 'system');
            }
        }
        if (this.cpuRevealedTurns > 0) {
            this.cpuRevealedTurns--;
        }

        // 1. Hồi phục máu Adrenaline cuối mỗi lượt (+5 HP, kéo dài 3 lượt)
        if (this.playerBuffs && this.playerBuffs.adrenaline && this.playerBuffs.adrenaline.turnsLeft > 0) {
            const healAmount = Math.min(5, this.player.maxHp - this.player.hp);
            this.player.hp += healAmount;
            this.playerBuffs.adrenaline.turnsLeft--;
            if (window.soundCtrl) window.soundCtrl.playSelect();
            this.createBuffSparks(this.player.x, this.player.y, '#10b981');
            this.addFloatingText(`+${healAmount} HP (ADRENALINE)`, this.player.x, this.player.y, '#10b981');
            this.addCombatLog(`💉 Cuối lượt: Adrenaline hồi phục +${healAmount} HP! (Còn ${this.playerBuffs.adrenaline.turnsLeft} lượt hiệu lực)`, 'hit');
            if (this.playerBuffs.adrenaline.turnsLeft === 0) {
                this.addCombatLog(`💉 Hiệu ứng tăng lực Adrenaline (+20% Sát thương) đã kết thúc!`, 'system');
            }
        }
        if (this.cpuBuffs && this.cpuBuffs.adrenaline && this.cpuBuffs.adrenaline.turnsLeft > 0) {
            const healAmount = Math.min(5, this.cpu.maxHp - this.cpu.hp);
            this.cpu.hp += healAmount;
            this.cpuBuffs.adrenaline.turnsLeft--;
            this.createBuffSparks(this.cpu.x, this.cpu.y, '#10b981');
            this.addFloatingText(`+${healAmount} HP (ADRENALINE)`, this.cpu.x, this.cpu.y, '#10b981');
            this.addCombatLog(`💉 Cuối lượt: CPU [${this.cpu.name}] Adrenaline hồi phục +${healAmount} HP! (Còn ${this.cpuBuffs.adrenaline.turnsLeft} lượt hiệu lực)`, 'hit');
            if (this.cpuBuffs.adrenaline.turnsLeft === 0) {
                this.addCombatLog(`💉 Hiệu ứng tăng lực Adrenaline của CPU [${this.cpu.name}] đã kết thúc!`, 'system');
            }
        }

        // 2. Giảm thời gian hồi chiêu
        for (const skillId in this.cooldowns) {
            if (this.cooldowns[skillId] > 0) {
                this.cooldowns[skillId]--;
                if (this.cooldowns[skillId] === 0) {
                    if (skillId === 'SMOKE_BOMB_LAUNCHER') {
                        this.skillAmmo['SMOKE_BOMB_LAUNCHER'] = 2;
                        this.addCombatLog(`🔄 Súng Bắn Bom đã hoàn tất hồi chiêu, nạp lại đầy đủ 2/2 viên đạn!`, 'system');
                    } else if (skillId === 'RAZOR_BLADE') {
                        this.skillAmmo['RAZOR_BLADE'] = 2;
                        this.addCombatLog(`🔄 Kiếm Gắn Tay đã hoàn tất hồi chiêu, nạp lại đầy đủ 2/2 lượt sử dụng!`, 'system');
                    } else {
                        this.addCombatLog(`✨ Kỹ năng [${skillId}] đã hồi chiêu xong, sẵn sàng sử dụng!`, 'system');
                    }
                }
            }
        }
        for (const skillId in this.cpuCooldowns) {
            if (this.cpuCooldowns[skillId] > 0) {
                this.cpuCooldowns[skillId]--;
                if (this.cpuCooldowns[skillId] === 0) {
                    if (skillId === 'SMOKE_BOMB_LAUNCHER') {
                        this.cpuSkillAmmo['SMOKE_BOMB_LAUNCHER'] = 2;
                        this.addCombatLog(`🔄 CPU [${this.cpu.name}] Súng Bắn Bom đã hồi chiêu xong, nạp lại 2/2 viên!`, 'system');
                    } else if (skillId === 'RAZOR_BLADE') {
                        this.cpuSkillAmmo['RAZOR_BLADE'] = 2;
                        this.addCombatLog(`🔄 CPU [${this.cpu.name}] Kiếm Gắn Tay đã hồi chiêu xong, nạp lại 2/2 lượt dùng!`, 'system');
                    } else {
                        this.addCombatLog(`✨ Kỹ năng [${skillId}] của CPU [${this.cpu.name}] đã hồi chiêu xong!`, 'system');
                    }
                }
            }
        }

        // 3. Giảm thời gian Buff Thuốc Lá (Smoke guy: +30% DMG, +1 Bước trong 2 lượt)
        if (this.playerBuffs && this.playerBuffs.cigarette && this.playerBuffs.cigarette.turnsLeft > 0) {
            this.playerBuffs.cigarette.turnsLeft--;
            if (this.playerBuffs.cigarette.turnsLeft === 0) {
                this.cooldowns['SMOKE_CIGARETTE'] = 3;
                this.addCombatLog(`⏳ Khói [Thuốc Lá] đã tàn, bắt đầu hồi chiêu 3 lượt!`, 'system');
            } else {
                this.addCombatLog(`🚬 Thuốc lá vẫn đang cháy rực, còn ${this.playerBuffs.cigarette.turnsLeft} lượt hiệu lực (+30% DMG, +1 Bước)!`, 'system');
            }
        }
        if (this.cpuBuffs && this.cpuBuffs.cigarette && this.cpuBuffs.cigarette.turnsLeft > 0) {
            this.cpuBuffs.cigarette.turnsLeft--;
            if (this.cpuBuffs.cigarette.turnsLeft === 0) {
                this.cpuCooldowns['SMOKE_CIGARETTE'] = 3;
                this.addCombatLog(`⏳ Khói [Thuốc Lá] của CPU [${this.cpu.name}] đã tàn, bắt đầu hồi chiêu 3 lượt!`, 'system');
            } else {
                this.addCombatLog(`🚬 Thuốc lá của CPU [${this.cpu.name}] vẫn đang cháy, còn ${this.cpuBuffs.cigarette.turnsLeft} lượt hiệu lực!`, 'system');
            }
        }

        // 4. Kích hoạt kéo Dây Móc Hookman (Hết lượt sau kéo 2 ô rồi mới kích hoạt hồi chiêu 4L)
        const remainingTethers = [];
        for (const tether of this.activeHookTethers) {
            if (tether.turnsUntilPull <= 0) {
                // Kích hoạt kéo 2 ô về phía người tung móc
                let victim = tether.target === 'CPU' ? this.cpu : this.player;
                let hooker = tether.source === 'PLAYER' ? this.player : this.cpu;

                let pulledSteps = 0;
                for (let s = 0; s < (tether.pullDist || 2); s++) {
                    const stepDx = Math.sign(hooker.x - victim.x);
                    const stepDy = Math.sign(hooker.y - victim.y);
                    if (stepDx === 0 && stepDy === 0) break;

                    const nextVx = Math.max(0, Math.min(GRID_COLS - 1, victim.x + stepDx));
                    const nextVy = Math.max(0, Math.min(GRID_ROWS - 1, victim.y + stepDy));

                    // Không kéo đè lên ô của người tung móc
                    if (nextVx === hooker.x && nextVy === hooker.y) break;

                    victim.x = nextVx;
                    victim.y = nextVy;
                    pulledSteps++;
                }

                if (window.soundCtrl) window.soundCtrl.playHookPull();
                this.createHitSparks(victim.x, victim.y, '#ef4444');
                this.addFloatingText(`🪝 GIẬT MÓC ${pulledSteps} Ô!`, victim.x, victim.y, '#ef4444');
                this.addCombatLog(`💥 HẾT LƯỢT SAU: Dây xích Hookman siết mạnh, giật ${tether.target} lại gần ${pulledSteps} ô!`, 'clash');

                // Kích hoạt Cooldown 4 lượt sau khi giật xong cho đúng bên tung móc!
                if (tether.source === 'CPU') {
                    this.cpuCooldowns[tether.skillId] = tether.cdAfterPull || 4;
                } else {
                    this.cooldowns[tether.skillId] = tether.cdAfterPull || 4;
                }
                this.addCombatLog(`⏳ [Móc Kéo] của ${tether.source === 'CPU' ? 'CPU' : 'bạn'} đã hoàn tất chuỗi kéo, bắt đầu hồi chiêu 4 lượt!`, 'system');
            } else {
                tether.turnsUntilPull--;
                this.addCombatLog(`🪝 Dây móc Hookman vẫn đang găm chặt vào ${tether.target}, sẽ siết kéo 2 ô vào cuối lượt sau!`, 'system');
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

        // Xử lý nổ lựu đạn (Lựa chọn A: Sát thương bất kỳ ai trong vùng 3x3)
        detonatedHazards.forEach(h => {
            if (window.soundCtrl) window.soundCtrl.playExplosion();
            this.createExplosionBurst(h.x, h.y, 45);
            this.addFloatingText('💥 BÙM! LỰU ĐẠN NỔ (50 DMG)!', h.x, h.y, '#ef4444');
            this.addCombatLog(`💥 LỰU ĐẠN TẠI (${h.x}, ${h.y}) PHÁT NỔ! Quét sạch khu vực 3x3 với 50 sát thương!`, 'clash');

            if (Math.abs(this.cpu.x - h.x) <= 1 && Math.abs(this.cpu.y - h.y) <= 1) {
                this.applyDamage(this.cpu, h.power);
                this.createHitSparks(this.cpu.x, this.cpu.y, '#ff3366');
                this.addFloatingText(`-${h.power} HP!`, this.cpu.x, this.cpu.y, '#f87171');
                this.addCombatLog(`➔ CPU dính trọn vụ nổ Lựu Đạn! Mất ${h.power} HP!`, 'hit');
            }

            if (Math.abs(this.player.x - h.x) <= 1 && Math.abs(this.player.y - h.y) <= 1) {
                this.applyDamage(this.player, h.power);
                this.createHitSparks(this.player.x, this.player.y, '#00f2fe');
                this.addFloatingText(`-${h.power} HP! (DÍNH BOM CỦA MÌNH)`, this.player.x, this.player.y, '#f87171');
                this.addCombatLog(`➔ BẠN TỰ BƯỚC VÀO VÙNG NỔ LỰU ĐẠN CỦA MÌNH! Mất ${h.power} HP!`, 'hit');

                const playerIsHookman = this.player.charId === 'hookman' || (this.selectedCharacter && this.selectedCharacter.id === 'hookman');
                if (playerIsHookman) {
                    this.playerRevealedTurns = 2;
                    this.addFloatingText('HIỆN HÌNH!', this.player.x, this.player.y, '#f43f5e');
                    this.addCombatLog(`💥 Vụ nổ làm Hookman hiện nguyên hình và không thể tàng hình tới hết lượt sau!`, 'clash');
                }
            }
        });

        this.groundHazards = this.groundHazards.filter(h => h.turnsLeft > 0);

        this.turn++;
        this.phase = 'PLANNING';
        this.currentStep = -1;
        this.playerQueue = [];
        this.cpuQueue = [];
        this.player.shieldDir = null;
        this.cpu.shieldDir = null;

        for (let i = 0; i < 4; i++) {
            document.getElementById(`p-slot-${i}`).classList.remove('active-step');
            document.getElementById(`c-slot-${i}`).classList.remove('active-step');
            const cSlot = document.getElementById(`c-slot-${i}`);
            cSlot.className = 'queue-slot';
            cSlot.innerHTML = `<span class="slot-step-num">#${i + 1}</span><span class="slot-icon">🔒</span><span class="slot-name">Bí mật</span>`;
        }

        this.updateSkillButtons();
        this.updateQueueDisplay();
        this.updateHUD();

        if (this.player.hp <= 0 || this.cpu.hp <= 0) {
            this.handleGameOver();
        }
    }

    applyDamage(entity, amount) {
        entity.hp = Math.max(0, entity.hp - amount);
    }

    handleGameOver() {
        this.phase = 'GAMEOVER';
        const modal = document.getElementById('gameModal');
        const title = document.getElementById('modalTitle');
        const desc = document.getElementById('modalDesc');

        const pName = getCharName(this.selectedCharacter, this.lang);
        const cName = getCharName(this.cpuCharacter, this.lang);

        if (this.player.hp <= 0 && this.cpu.hp <= 0) {
            title.innerText = t('modalDrawTitle');
            title.className = 'modal-title clash';
            desc.innerText = t('modalDrawDesc');
        } else if (this.cpu.hp <= 0) {
            title.innerText = t('modalVictoryTitle');
            title.className = 'modal-title victory';
            desc.innerText = this.lang === 'en'
                ? `Outstanding! [${pName}] eliminated the CPU Sentinel [${cName}] on Turn ${this.turn}!`
                : `Xuất sắc! [${pName}] đã đánh bại ${cName} của CPU ở Lượt ${this.turn}!`;
            if (window.soundCtrl) window.soundCtrl.playVictory();
        } else {
            title.innerText = t('modalDefeatTitle');
            title.className = 'modal-title defeat';
            desc.innerText = this.lang === 'en'
                ? `Your operative was eliminated by CPU Sentinel [${cName}]. Adjust your tactics for the next match!`
                : `Bạn đã bị ${cName} của CPU hạ gục. Hãy thử điều chỉnh chiến thuật ở ván sau!`;
            if (window.soundCtrl) window.soundCtrl.playDefeat();
        }

        modal.style.display = 'flex';
        this.updateHUD();
    }

    restartGame() {
        document.getElementById('gameModal').style.display = 'none';
        this.turn = 1;
        this.phase = 'PLANNING';
        this.currentStep = -1;
        this.cancelPathPlanning();
        this.applySelectedCharacter();
        this.applyCpuCharacter(this.selectedCpuOption);

        this.groundHazards = [];
        this.playerRevealedTurns = 0;
        this.cpuRevealedTurns = 0;
        this.activeHookTethers = [];

        this.player.x = 2;
        this.player.y = 3;
        this.player.renderX = 2;
        this.player.renderY = 3;
        this.player.dir = 'RIGHT';
        this.player.hp = this.player.maxHp;
        this.player.shieldDir = null;

        this.cpu.x = 17;
        this.cpu.y = 3;
        this.cpu.renderX = 17;
        this.cpu.renderY = 3;
        this.cpu.dir = 'LEFT';
        this.cpu.hp = this.cpu.maxHp;
        this.cpu.shieldDir = null;

        this.playerQueue = [];
        this.cpuQueue = [];
        this.floatingTexts = [];
        this.particles = [];

        document.getElementById('combatLog').innerHTML = '<div class="log-entry system">Trận đấu mới đã bắt đầu!</div>';
        this.addCombatLog(`Bạn: [${this.player.name}] vs CPU: [${this.cpu.name}]`, 'system');

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

        this.player.renderX += (this.player.x - this.player.renderX) * 0.2;
        this.player.renderY += (this.player.y - this.player.renderY) * 0.2;

        this.cpu.renderX += (this.cpu.x - this.cpu.renderX) * 0.2;
        this.cpu.renderY += (this.cpu.y - this.cpu.renderY) * 0.2;

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

        // 6. Vẽ Fighters (Hệ thống Tàng hình 7x7 của Hookman)
        const playerIsHookman = this.player.charId === 'hookman' || (this.selectedCharacter && this.selectedCharacter.id === 'hookman');
        const playerStealthActive = this.isPlayerStealthed();
        const playerRevealed = playerIsHookman && this.playerRevealedTurns > 0;

        const cpuIsHookman = this.cpu.charId === 'hookman' || (this.cpu.name && this.cpu.name.includes('Hookman'));
        const cpuStealthActive = this.isCpuStealthed();
        const cpuRevealed = cpuIsHookman && this.cpuRevealedTurns > 0;

        // Người chơi: Luôn nhìn thấy bản thân (hiển thị hiệu ứng tàng hình hoặc bị lộ nếu đang kích hoạt)
        this.drawFighter(this.player, this.player.color, `${this.player.name} [BẠN]`, playerStealthActive, playerRevealed, this.playerRevealedTurns);

        // CPU: Nếu CPU là Hookman và ngoài phạm vi 7x7 -> NGƯỜI CHƠI SẼ KHÔNG NHÌN THẤY!
        if (!cpuStealthActive) {
            this.drawFighter(this.cpu, this.cpu.color, `${this.cpu.name} [CPU]`, false, cpuRevealed, this.cpuRevealedTurns);
        }

        // Vẽ Dây Móc đang găm nối giữa người tung móc và nạn nhân (Active Hook Tether)
        if (this.activeHookTethers && this.activeHookTethers.length > 0) {
            this.activeHookTethers.forEach(tether => {
                const hooker = tether.source === 'PLAYER' ? this.player : this.cpu;
                const victim = tether.target === 'CPU' ? this.cpu : this.player;
                const canSeeVictim = !(cpuIsHookman && cpuStealthActive && tether.target === 'CPU');

                if (canSeeVictim) {
                    ctx.save();
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2.5;
                    ctx.setLineDash([8, 6]);
                    ctx.beginPath();
                    ctx.moveTo(hooker.renderX * CELL_SIZE + CELL_SIZE / 2, hooker.renderY * CELL_SIZE + CELL_SIZE / 2);
                    ctx.lineTo(victim.renderX * CELL_SIZE + CELL_SIZE / 2, victim.renderY * CELL_SIZE + CELL_SIZE / 2);
                    ctx.stroke();

                    // Biểu tượng móc xích ở giữa sợi dây căng
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
            ctx.setLineDash([]);
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = this.player.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(currX, currY, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${idx + 1}`, currX, currY);
            ctx.restore();

            prevX = currX;
            prevY = currY;
        });

        if (this.activePath.length > 0) {
            const last = this.activePath[this.activePath.length - 1];
            ctx.setLineDash([]);
            ctx.strokeStyle = this.player.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(last.x * CELL_SIZE + 4, last.y * CELL_SIZE + 4, CELL_SIZE - 8, CELL_SIZE - 8);
        }

        ctx.restore();
    }

    renderQueuedPaths() {
        const ctx = this.ctx;
        let startX = this.player.x;
        let startY = this.player.y;

        ctx.save();
        for (const act of this.playerQueue) {
            if (act.type === 'PATH_MOVE' && act.path && act.path.length > 0) {
                let px = startX * CELL_SIZE + CELL_SIZE / 2;
                let py = startY * CELL_SIZE + CELL_SIZE / 2;

                ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
                ctx.lineWidth = 3;
                ctx.setLineDash([4, 4]);

                for (const node of act.path) {
                    const nx = node.x * CELL_SIZE + CELL_SIZE / 2;
                    const ny = node.y * CELL_SIZE + CELL_SIZE / 2;
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(nx, ny);
                    ctx.stroke();
                    px = nx;
                    py = ny;
                }

                const lastNode = act.path[act.path.length - 1];
                startX = lastNode.x;
                startY = lastNode.y;
            } else if (act.type === 'LEAP') {
                const pD = DIRECTIONS[act.dir];
                let destX = startX + pD.dx * (act.range || 3);
                let destY = startY + pD.dy * (act.range || 3);
                destX = Math.max(0, Math.min(GRID_COLS - 1, destX));
                destY = Math.max(0, Math.min(GRID_ROWS - 1, destY));

                const hasEnemy = (this.cpu.x === destX && this.cpu.y === destY);
                const hasHazard = this.groundHazards.some(h => h.x === destX && h.y === destY);
                if (hasEnemy || hasHazard) {
                    destX = Math.max(0, Math.min(GRID_COLS - 1, destX + pD.dx * (act.leapExtra || 2)));
                    destY = Math.max(0, Math.min(GRID_ROWS - 1, destY + pD.dy * (act.leapExtra || 2)));
                }

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
        const hasCigaretteBuff = (fighter === this.player && this.playerBuffs && this.playerBuffs.cigarette && this.playerBuffs.cigarette.turnsLeft > 0);

        // Nếu ở trạng thái Tàng hình (Stealth)
        if (isStealth) {
            ctx.globalAlpha = 0.55;
            // Vòng hào quang tím tàng hình
            ctx.save();
            ctx.strokeStyle = '#a78bfa';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 28, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            tag = `${tag} [ẨN NẤP 7x7]`;
        } else if (isRevealed) {
            // Vòng cảnh báo đỏ lộ diện khi bị trúng đạn
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
            // Vòng khói thuốc bốc lên quanh người
            ctx.save();
            ctx.strokeStyle = 'rgba(251, 146, 60, 0.6)';
            ctx.setLineDash([3, 5]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 28, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            tag = `${tag} [🚬 +30% DMG]`;
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

        // Tên tag
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = isStealth ? '#c084fc' : (isRevealed ? '#f43f5e' : (hasCigaretteBuff ? '#fb923c' : '#f8fafc'));
        ctx.textAlign = 'center';
        ctx.fillText(tag, 0, -24);

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

        // Vẽ bom trên minimap
        mCtx.fillStyle = '#ef4444';
        this.groundHazards.forEach(hz => {
            mCtx.fillRect(hz.x * cellW - 1, hz.y * cellH - 1, 3, 3);
        });

        // Vẽ người chơi
        mCtx.fillStyle = this.player.color;
        mCtx.beginPath();
        mCtx.arc((this.player.x + 0.5) * cellW, (this.player.y + 0.5) * cellH, 3.5, 0, Math.PI * 2);
        mCtx.fill();

        // CPU: Chỉ vẽ chấm nếu CPU không ở trạng thái tàng hình
        const cpuStealthActive = this.isCpuStealthed();
        if (!cpuStealthActive) {
            mCtx.fillStyle = this.cpu.color;
            mCtx.beginPath();
            mCtx.arc((this.cpu.x + 0.5) * cellW, (this.cpu.y + 0.5) * cellH, 3.5, 0, Math.PI * 2);
            mCtx.fill();
        }
    }
}

// Khởi tạo Game
window.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new GameEngine();
});
