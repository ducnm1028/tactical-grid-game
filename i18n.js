/**
 * CHRONO CLASH: INTERNATIONALIZATION (i18n) ENGINE
 * Supports Tiếng Việt (vi) and English (en)
 */

const I18N_DICTIONARY = {
    vi: {
        // App Title & Header
        appTitle: "Chrono Clash - WEGO Tactics 20x7",
        headerTitle: "Chrono Clash: WEGO 20x7",
        headerSubtitle: "Game Chiến thuật Bàn cờ Lượt đồng thời • Nhập 4 hành động",
        btnHeaderMenu: "🏠 Menu Chính",
        btnHeaderGuide: "📖 Hướng Dẫn",
        btnOpenCharSelect: "👤 Đổi Tướng",
        btnHeaderLang: "🌐 English",
        soundOn: "🔊 Âm thanh: BẬT",
        soundOff: "🔇 Âm thanh: TẮT",

        // Language Select Screen
        langBadge: "CHỌN NGÔN NGỮ • LANGUAGE SELECTION",
        langTitle: "CHRONO CLASH",
        langSubtitle: "Chọn ngôn ngữ của bạn để bắt đầu • Choose your language to begin",
        langCardViTitle: "TIẾNG VIỆT",
        langCardViSub: "Giao diện, cẩm nang & chiến thuật Tiếng Việt",
        langCardEnTitle: "ENGLISH",
        langCardEnSub: "English interface, rules & tactical guide",
        langHint: "Bạn có thể chuyển đổi ngôn ngữ bất kỳ lúc nào qua nút 🌐 trên thanh tiêu đề.",

        // Main Menu Screen
        menuBadge: "TACTICAL WEGO PROTOCOL • 20x7",
        menuTitle: "CHRONO CLASH",
        menuTagline: "CHIẾN THUẬT LƯỢT ĐỒNG THỜI • BÀN CỜ 20x7",
        menuDescription: "Lập kế hoạch bí mật 4 hành động, dự đoán hướng đi của đối thủ và giải phóng các chiêu thức đặc sắc trên đấu trường lưới.",
        btnMenuPlay: "CHƠI",
        btnMenuPlaySub: "Chọn Chiến Binh & Tham Chiến",
        btnMenuGuide: "HƯỚNG DẪN",
        btnMenuGuideSub: "Luật Chơi WEGO & Tuyệt Kỹ Tướng",
        pillWego: "⚡ WEGO 4 Lệnh / Lượt",
        pillChars: "👥 4 Tướng Đặc Sắc",
        pillRoute: "👟 Lập Lộ Trình Tự Do",
        pillCpu: "🤖 Trí Tuệ Nhân Tạo CPU",
        menuHint: "Nhấn [SPACE] hoặc [ENTER] để vào Chơi • Nhấn [H] để xem Hướng dẫn",

        // Top HUD
        playerBadgeSuffix: "[BẠN]",
        cpuBadgeSuffix: "[CPU]",
        currentFacing: "Hướng hiện tại:",
        cpuStatusLabel: "Trạng thái:",
        cpuStatusThinking: "ĐANG TÍNH TOÁN",
        cpuStatusReady: "SẴN SÀNG",
        cpuStatusDefeated: "BỊ ĐÁNH BẠI",
        cpuStatusStealthed: "TÀNG HÌNH",
        turnPrefix: "LƯỢT",
        phasePlanning: "LẬP KẾ HOẠCH",
        phaseResolving: "GIẢI QUYẾT",

        // Minimap
        minimapTitle: "Toàn cảnh 20x7",

        // Action Queues
        playerQueueTitle: "Hàng đợi lệnh của Bạn (4 Hành động)",
        cpuQueueTitle: "Lệnh bí mật của CPU (Giải mã khi thực thi)",
        secretTag: "BÍ MẬT",
        slotEmpty: "Trống",
        slotSecret: "Bí mật",
        combatLogTitle: "Nhật ký chiến trường",
        combatLogInit: "Trận đấu bắt đầu! Hãy lên 4 lệnh cho nhân vật.",

        // Path Planner Notice
        pathPlannerNotice: "Đang vẽ Lộ trình: {steps} / {maxSteps} bước",
        pathPlannerSubtext: "Nhấn phím hướng (WASD/QEZC) để vẽ đường đi • Bấm [1]/[Space] để chốt lộ trình • [⌫] lùi 1 bước",
        btnFinishPath: "Chốt Lệnh [Space]",

        // Hotkey Guide
        actionGroupLabel: "Thêm Hành động:",
        directionGroupLabel: "Hướng (8 Hướng):",
        btnUndo: "<b>[⌫/Backspace]</b> Xóa 1",
        btnClear: "<b>[Esc]</b> Hủy hết",
        btnCommitPrefix: "<b>[SPACE]</b> THỰC THI",

        // Directions
        dirUp: "Lên",
        dirDown: "Dưới",
        dirLeft: "Trái",
        dirRight: "Phải",
        dirUpLeft: "Lên-Trái",
        dirUpRight: "Lên-Phải",
        dirDownLeft: "Dưới-Trái",
        dirDownRight: "Dưới-Phải",

        // Character Select Screen
        charSelectHeaderTitle: "CHỌN CHIẾN BINH CỦA BẠN",
        charSelectHeaderSub: "Mỗi nhân vật sở hữu phong cách chiến đấu và 4 chiêu thức độc nhất",
        moveBudgetLabel: "⚡ Hạn mức di chuyển: <b>{budget} bước/lệnh</b>",
        cpuSelectLabel: "🎯 ĐỐI THỦ CPU:",
        cpuOptRandom: "🎲 Ngẫu Nhiên",
        btnCharSelectBack: "⬅ MENU CHÍNH",
        btnStartBattle: "VÀO TRẬN ĐẤU (SPACE / ENTER)",

        // Game Over Modal
        modalVictoryTitle: "CHIẾN THẮNG!",
        modalVictoryDesc: "Bạn đã đánh bại Sentinel của CPU!",
        modalDefeatTitle: "THẤT BẠI!",
        modalDefeatDesc: "Nhân vật của bạn đã bị tiêu diệt!",
        modalDrawTitle: "HÒA NHAU!",
        modalDrawDesc: "Cả hai chiến binh cùng gục ngã trên đấu trường!",
        restartBtnText: "Chơi Lại Ván Mới (Enter)",

        // How To Play Modal
        guideMainTitle: "📖 CẨM NANG CHIẾN THUẬT CHRONO CLASH",
        guideMainSub: "Nắm vững cơ chế WEGO, điều khiển lộ trình và làm chủ 4 chiến binh đặc nhiệm",
        btnGuideBack: "⬅ QUAY LẠI MENU CHÍNH",
        btnGuidePlay: "VÀO CHỌN TƯỚNG & CHIẾN 🚀",

        // How To Play Sections
        guideSec1Title: "1. CƠ CHẾ LƯỢT ĐỒNG THỜI (WEGO SYSTEM)",
        guideSec1Desc: "Khác với cờ theo lượt truyền thống, ở <b>Chrono Clash</b> cả 2 bên cùng lúc hành động theo cơ chế thời gian thực đồng thời:",
        guideSec1Phase1Title: "Lập Kế Hoạch Bí Mật",
        guideSec1Phase1Desc: "Bạn và CPU cùng nạp đúng <b>4 hành động</b> vào hàng đợi của mình mà đối phương không nhìn thấy.",
        guideSec1Phase2Title: "Khóa Lệnh & Thực Thi",
        guideSec1Phase2Desc: "Nhấn <b>[SPACE]</b> để chốt. Trận đấu bắt đầu pha phân xử hành động.",
        guideSec1Phase3Title: "Phân Xử Đồng Thời",
        guideSec1Phase3Desc: "Cả hai bên cùng kích hoạt bước #1, tiếp đến bước #2, #3, và #4. Đạn bay và di chuyển va chạm nhau trên bàn cờ.",
        guideSec1Tip: "💡 <b>Mẹo vàng:</b> Chìa khóa chiến thắng nằm ở việc <i>\"dự đoán trước bước đi của CPU\"</i> để đón đầu đường đạn hoặc né khỏi vùng nguy hiểm!",

        guideSec2Title: "2. DI CHUYỂN & VẼ LỘ TRÌNH (PATH PLANNING)",
        guideSec2Desc: "Bạn không bị gò bó đi từng ô thẳng đơn điệu, mà có thể tự do uốn lượn đường đi:",
        guideSec2Li1: "Bấm phím <b>[1]</b> (Lộ trình di chuyển) để kích hoạt chế độ vẽ đường.",
        guideSec2Li2: "Dùng các phím hướng <b>W, A, S, D</b> (hoặc phím chéo <b>Q, E, Z, C</b>) để nối từng bước chân.",
        guideSec2Li3: "Số bước đi tối đa phụ thuộc vào từng nhân vật (VD: <b>Trooper</b> 2 bước, <b>Hookman</b> 3 bước, <b>Smoke Guy khi hút thuốc</b> tăng thêm 1 bước).",
        guideSec2Li4: "Bấm <b>[Space]</b> hoặc <b>[1]</b> để chốt lộ trình vào hàng đợi. Bấm <b>[⌫ Backspace]</b> nếu muốn lùi lại 1 bước vẽ.",

        guideSec3Title: "3. BẢNG PHÍM TẮT & THAO TÁC TRẬN ĐẤU",
        hk1Desc: "Di chuyển / Vẽ lộ trình tự do",
        hk2Desc: "Vũ khí chính (Bắn súng / Móc kéo / Đòn đánh cơ bản)",
        hk3Desc: "Kỹ năng phụ (Lựu đạn hẹn giờ / Adrenaline / Thuốc lá / Nhảy lướt)",
        hk4Desc: "Chiêu cuối tối thượng (Tên lửa 3x3 / Súng bắn bom / Kiếm gắn tay)",
        hkDirDesc: "Xoay 8 hướng bắn hoặc hướng di chuyển",
        hkSpaceDesc: "Chốt lộ trình di chuyển / THỰC THI 4 LỆNH khi đã đầy",
        hkBackDesc: "Xóa 1 hành động gần nhất trong hàng đợi",
        hkEscDesc: "Hủy toàn bộ 4 hành động để lập kế hoạch lại",

        guideSec4Title: "4. HỒ SƠ 4 CHIẾN BINH ĐẶC NHIỆM",
        guideSec5Title: "5. CHIẾN THUẬT SINH TỒN ĐỈNH CAO",
        tip1Title: "🧱 Tận dụng chướng ngại vật",
        tip1Desc: "Đạn súng trường không thể xuyên qua đá hay vật thể. Hãy di chuyển nép sau góc khuất để bảo toàn HP.",
        tip2Title: "💥 Tránh bán kính nổ 3x3",
        tip2Desc: "Lựu đạn, Tên lửa và Súng bắn bom đều nổ diện rộng 3x3. Quan sát cảnh báo màu đỏ trên bàn cờ để chạy kịp trước khi nổ.",
        tip3Title: "⏳ Quản lý Đạn dược & Hồi chiêu",
        tip3Desc: "Các chiêu thức lớn đều có số đạn giới hạn hoặc số lượt hồi chiêu. Hãy phối hợp đòn đánh thường xen kẽ."
    },

    en: {
        // App Title & Header
        appTitle: "Chrono Clash - WEGO Tactics 20x7",
        headerTitle: "Chrono Clash: WEGO 20x7",
        headerSubtitle: "Simultaneous Turn-Based Grid Tactics • Queue 4 Actions",
        btnHeaderMenu: "🏠 Main Menu",
        btnHeaderGuide: "📖 Guide",
        btnOpenCharSelect: "👤 Heroes",
        btnHeaderLang: "🌐 Tiếng Việt",
        soundOn: "🔊 Sound: ON",
        soundOff: "🔇 Sound: OFF",

        // Language Select Screen
        langBadge: "LANGUAGE SELECTION • CHỌN NGÔN NGỮ",
        langTitle: "CHRONO CLASH",
        langSubtitle: "Choose your language to begin • Chọn ngôn ngữ của bạn để bắt đầu",
        langCardViTitle: "TIẾNG VIỆT",
        langCardViSub: "Giao diện, cẩm nang & chiến thuật Tiếng Việt",
        langCardEnTitle: "ENGLISH",
        langCardEnSub: "English interface, rules & tactical guide",
        langHint: "You can switch languages anytime using the 🌐 button in the header.",

        // Main Menu Screen
        menuBadge: "TACTICAL WEGO PROTOCOL • 20x7",
        menuTitle: "CHRONO CLASH",
        menuTagline: "SIMULTANEOUS TURN-BASED GRID TACTICS • 20x7",
        menuDescription: "Secretly plan 4 actions, anticipate your enemy's moves, and unleash lethal operative abilities on the cybernetic grid.",
        btnMenuPlay: "PLAY",
        btnMenuPlaySub: "Select Operative & Deploy",
        btnMenuGuide: "HOW TO PLAY",
        btnMenuGuideSub: "WEGO Rules & Hero Abilities",
        pillWego: "⚡ WEGO 4 Commands / Turn",
        pillChars: "👥 4 Unique Operatives",
        pillRoute: "👟 Freeform Route Drawing",
        pillCpu: "🤖 Adaptive AI Sentinel",
        menuHint: "Press [SPACE] or [ENTER] to Play • Press [H] for How To Play",

        // Top HUD
        playerBadgeSuffix: "[YOU]",
        cpuBadgeSuffix: "[CPU]",
        currentFacing: "Current Facing:",
        cpuStatusLabel: "Status:",
        cpuStatusThinking: "CALCULATING",
        cpuStatusReady: "READY",
        cpuStatusDefeated: "DEFEATED",
        cpuStatusStealthed: "STEALTHED",
        turnPrefix: "TURN",
        phasePlanning: "PLANNING PHASE",
        phaseResolving: "RESOLVING",

        // Minimap
        minimapTitle: "Overview 20x7",

        // Action Queues
        playerQueueTitle: "Your Action Queue (4 Actions)",
        cpuQueueTitle: "CPU Secret Commands (Decoded on resolve)",
        secretTag: "SECRET",
        slotEmpty: "Empty",
        slotSecret: "Secret",
        combatLogTitle: "Combat Log",
        combatLogInit: "Battle commenced! Program 4 tactical actions.",

        // Path Planner Notice
        pathPlannerNotice: "Drawing Route: {steps} / {maxSteps} steps",
        pathPlannerSubtext: "Press direction keys (WASD/QEZC) to draw • Press [1]/[Space] to lock route • [⌫] undo step",
        btnFinishPath: "Lock Route [Space]",

        // Hotkey Guide
        actionGroupLabel: "Add Action:",
        directionGroupLabel: "Direction (8-Way):",
        btnUndo: "<b>[⌫/Backspace]</b> Undo 1",
        btnClear: "<b>[Esc]</b> Clear All",
        btnCommitPrefix: "<b>[SPACE]</b> EXECUTE",

        // Directions
        dirUp: "Up",
        dirDown: "Down",
        dirLeft: "Left",
        dirRight: "Right",
        dirUpLeft: "Up-Left",
        dirUpRight: "Up-Right",
        dirDownLeft: "Down-Left",
        dirDownRight: "Down-Right",

        // Character Select Screen
        charSelectHeaderTitle: "SELECT YOUR OPERATIVE",
        charSelectHeaderSub: "Each hero commands a distinct combat doctrine and 4 unique skills",
        moveBudgetLabel: "⚡ Move budget: <b>{budget} steps/action</b>",
        cpuSelectLabel: "🎯 CPU OPPONENT:",
        cpuOptRandom: "🎲 Random",
        btnCharSelectBack: "⬅ MAIN MENU",
        btnStartBattle: "DEPLOY TO BATTLE (SPACE / ENTER)",

        // Game Over Modal
        modalVictoryTitle: "VICTORY!",
        modalVictoryDesc: "You destroyed the CPU Sentinel!",
        modalDefeatTitle: "DEFEAT!",
        modalDefeatDesc: "Your operative was eliminated in combat!",
        modalDrawTitle: "DRAW!",
        modalDrawDesc: "Both combatants fell in mutual destruction!",
        restartBtnText: "Rematch (Enter)",

        // How To Play Modal
        guideMainTitle: "📖 CHRONO CLASH TACTICAL FIELD MANUAL",
        guideMainSub: "Master WEGO resolution, freeform movement routing, and 4 specialized operatives",
        btnGuideBack: "⬅ BACK TO MAIN MENU",
        btnGuidePlay: "CHOOSE HERO & DEPLOY 🚀",

        // How To Play Sections
        guideSec1Title: "1. SIMULTANEOUS RESOLUTION (WEGO SYSTEM)",
        guideSec1Desc: "Unlike standard turn-based games, <b>Chrono Clash</b> executes moves in simultaneous real-time phases:",
        guideSec1Phase1Title: "Secret Planning",
        guideSec1Phase1Desc: "Both you and the CPU secretly queue exactly <b>4 actions</b> without seeing the opponent's choices.",
        guideSec1Phase2Title: "Commit & Lock",
        guideSec1Phase2Desc: "Press <b>[SPACE]</b> to lock your queue and begin simultaneous action resolution.",
        guideSec1Phase3Title: "Parallel Execution",
        guideSec1Phase3Desc: "Both sides resolve step #1, then #2, #3, and #4 together. Projectiles and maneuvers clash on the grid.",
        guideSec1Tip: "💡 <b>Pro Tip:</b> Victory hinges on <i>\"predicting enemy movement\"</i> to lead your shots or dodge lethal AoE blasts!",

        guideSec2Title: "2. FREEFORM MOVEMENT (PATH PLANNING)",
        guideSec2Desc: "You are never locked into rigid straight steps; bend and weave your route freely:",
        guideSec2Li1: "Press <b>[1]</b> (Route Movement) to activate path drawing mode.",
        guideSec2Li2: "Use direction keys <b>W, A, S, D</b> (or diagonals <b>Q, E, Z, C</b>) to link steps one by one.",
        guideSec2Li3: "Maximum steps depend on your hero (e.g. <b>Trooper</b> 2 steps, <b>Hookman</b> 3 steps, <b>Smoke Guy with Cigarette</b> +1 step).",
        guideSec2Li4: "Press <b>[Space]</b> or <b>[1]</b> to lock the route into your queue. Press <b>[⌫ Backspace]</b> to undo 1 step.",

        guideSec3Title: "3. HOTKEYS & CONTROLS REFERENCE",
        hk1Desc: "Move / Freeform Route Planning",
        hk2Desc: "Primary Weapon (Rifle / Silenced Pistol / Energy Blaster)",
        hk3Desc: "Secondary Skill (Timed Grenade / Adrenaline / Cigarette / Leap)",
        hk4Desc: "Ultimate Ability (3x3 Rocket / Bomb Launcher / Arm Blade)",
        hkDirDesc: "Aim 8-way attack or facing direction",
        hkSpaceDesc: "Lock route / EXECUTE 4 ACTIONS when full",
        hkBackDesc: "Undo last queued action",
        hkEscDesc: "Clear all 4 actions to replan",

        guideSec4Title: "4. THE 4 SPECIAL OPERATIVES",
        guideSec5Title: "5. ADVANCED SURVIVAL TACTICS",
        tip1Title: "🧱 Utilize Obstacles & Cover",
        tip1Desc: "Rifle rounds cannot penetrate solid rocks. Weave behind cover to protect your HP pool.",
        tip2Title: "💥 Beware 3x3 Blast Radii",
        tip2Desc: "Grenades, Rockets, and Bomb Launchers inflict devastating 3x3 damage. Watch red ground telegraphs to evade in time.",
        tip3Title: "⏳ Manage Ammo & Cooldowns",
        tip3Desc: "Heavy ultimates have limited ammo or cooldown turns. Weave basic attacks to keep momentum."
    }
};

let currentLanguage = 'vi';

function getLanguage() {
    return currentLanguage;
}

function setLanguage(lang) {
    if (lang === 'vi' || lang === 'en') {
        currentLanguage = lang;
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem('chrono_clash_lang', lang);
            } catch (e) {}
        }
    }
    return currentLanguage;
}

function t(key, params = {}) {
    const dict = I18N_DICTIONARY[currentLanguage] || I18N_DICTIONARY.vi;
    let str = dict[key] !== undefined ? dict[key] : (I18N_DICTIONARY.vi[key] || key);
    if (params && typeof params === 'object') {
        for (const [k, v] of Object.entries(params)) {
            str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        }
    }
    return str;
}

// Export for Node.js test environment if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        I18N_DICTIONARY,
        getLanguage,
        setLanguage,
        t
    };
}
