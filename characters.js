/**
 * CHRONO CLASH: CHARACTER & SKILL DATABASE
 * Modular character definitions with Bilingual (VI / EN) Support.
 */

const CHARACTERS_DATABASE = [
    {
        id: 'trooper',
        name: 'Trooper (Chiến Binh Xạ Thủ)',
        name_en: 'Trooper (Assault Gunner)',
        title: 'Xạ Thủ Hỏa Lực & Kiểm Soát Khu Vực',
        title_en: 'Firepower Specialist & Area Denial',
        description: 'Sở hữu Súng trường bắn xa 5 ô (20 DMG), Lựu đạn hẹn giờ 2 lượt nổ 3x3 (50 DMG) và Tên lửa diện rộng (30 DMG).',
        description_en: 'Equipped with an Assault Rifle (20 DMG, range 5), timed 3x3 Frag Grenade (50 DMG), and 3x3 Rocket Artillery (30 DMG).',
        avatar: '🪖',
        themeColor: '#10b981',
        secondaryColor: '#34d399',
        maxHp: 100,
        moveBudget: 2,
        isUnlocked: true,
        skills: [
            {
                slot: 1,
                id: 'TROOPER_MOVE',
                name: 'Lộ Trình',
                name_en: 'Route',
                icon: '👟',
                hotkey: '1 / M',
                type: 'PATH_MOVE',
                maxSteps: 2,
                power: 0,
                desc: 'Di chuyển tự do tối đa 2 bước theo mọi hướng',
                desc_en: 'Free movement up to 2 steps in all directions',
                color: '#10b981'
            },
            {
                slot: 2,
                id: 'TROOPER_RIFLE',
                name: 'Assault Rifle',
                name_en: 'Assault Rifle',
                icon: '🔫',
                hotkey: '2 / J',
                type: 'RANGED_LINE',
                range: 5,
                power: 20,
                desc: 'Bắn thẳng/chéo 5 ô (20 Sát thương)',
                desc_en: 'Direct/diagonal shot up to 5 tiles (20 Damage)',
                color: '#34d399'
            },
            {
                slot: 3,
                id: 'TROOPER_GRENADE',
                name: 'Lựu Đạn',
                name_en: 'Frag Grenade',
                icon: '💣',
                hotkey: '3 / K',
                type: 'GRENADE',
                range: 5,
                power: 50,
                fuse: 2,
                cooldown: 3,
                aoeRadius: 1,
                desc: 'Ném 5 ô, nổ 3x3 sau 2 lượt (50 DMG, Hồi: 3L)',
                desc_en: 'Toss 5 tiles, detonates 3x3 after 2 turns (50 DMG, CD: 3T)',
                color: '#f59e0b'
            },
            {
                slot: 4,
                id: 'TROOPER_ROCKET',
                name: 'Tên Lửa',
                name_en: 'Rocket',
                icon: '🚀',
                hotkey: '4 / L',
                type: 'ROCKET',
                range: 6,
                power: 30,
                cooldown: 4,
                aoeRadius: 1,
                desc: 'Bắn tên lửa 6 ô nổ ngay 3x3 quanh đích, nổ sớm tại chỗ nếu va chạm địch trên đường bay (30 DMG, Hồi: 4L)',
                desc_en: 'Fires 6-tile rocket detonating 3x3; explodes on impact if intercepted (30 DMG, CD: 4T)',
                color: '#ef4444'
            }
        ]
    },
    {
        id: 'hookman',
        name: 'Hookman (Kẻ Săn Mồi)',
        name_en: 'Hookman (Predator)',
        title: 'Sát Thủ Bóng Đêm & Súng Giảm Thanh',
        title_en: 'Shadow Assassin & Silenced Precision',
        description: 'Tàng hình ngoài phạm vi 7x7. Vũ khí Silence Pistol (15-20 DMG), Ống tiêm Adrenaline (+15 HP, +20% DMG) và Móc Kéo 2 nhịp.',
        description_en: 'Invisible beyond 7x7 radius. Silenced Pistol (15-20 DMG), Adrenaline (+15 HP, +20% DMG), and 2-phase grappling hook.',
        avatar: '🪝',
        themeColor: '#8b5cf6',
        secondaryColor: '#a78bfa',
        maxHp: 90,
        moveBudget: 3,
        stealthRadius: 3,
        isUnlocked: true,
        skills: [
            {
                slot: 1,
                id: 'HOOKMAN_MOVE',
                name: 'Lộ Trình',
                name_en: 'Route',
                icon: '👟',
                hotkey: '1 / M',
                type: 'PATH_MOVE',
                maxSteps: 3,
                power: 0,
                desc: 'Di chuyển tự do tối đa 3 bước uốn lượn',
                desc_en: 'Free movement up to 3 nimble steps',
                color: '#8b5cf6'
            },
            {
                slot: 2,
                id: 'HOOKMAN_PISTOL',
                name: 'Silence Pistol',
                name_en: 'Silence Pistol',
                icon: '🎯',
                hotkey: '2 / J',
                type: 'RANGED_VARIABLE',
                range: 5,
                minPower: 15,
                maxPower: 20,
                desc: 'Bắn súng giảm thanh tầm xa 5 ô (15 - 20 Sát thương)',
                desc_en: 'Silenced precision shot up to 5 tiles (15 - 20 Damage)',
                color: '#a78bfa'
            },
            {
                slot: 3,
                id: 'HOOKMAN_ADRENALINE',
                name: 'Ống Tiêm Adrenaline',
                name_en: 'Adrenaline Stim',
                icon: '💉',
                hotkey: '3 / K',
                type: 'BUFF_HEAL',
                healPerTurn: 5,
                duration: 3,
                totalHeal: 15,
                dmgBonusPercent: 20,
                cooldown: 3,
                desc: 'Hồi 5 HP/lượt trong 3 lượt (tổng 15 HP), Sát thương tăng +20%. Hồi: 3L',
                desc_en: 'Heals 5 HP/turn for 3 turns (15 HP total), +20% Damage. CD: 3T',
                color: '#10b981'
            },
            {
                slot: 4,
                id: 'HOOKMAN_HOOK',
                name: 'Móc Kéo',
                name_en: 'Grappling Hook',
                icon: '🪝',
                hotkey: '4 / L',
                type: 'HOOK_PULL',
                range: 5,
                power: 15,
                pullSteps: 1,
                delayedPullSteps: 2,
                cooldown: 4,
                desc: 'Bắn móc 5 ô gây 15 DMG, kéo địch 1 ô. Hết lượt sau kéo tiếp 2 ô rồi mới hồi chiêu 4L',
                desc_en: 'Hook 5 tiles (15 DMG), pulls 1 tile. Pulls 2 more tiles at next turn end then CD: 4T',
                color: '#ef4444'
            }
        ]
    },
    {
        id: 'smoke_guy',
        name: 'Smoke Guy',
        name_en: 'Smoke Guy',
        title: 'Hỏa Lực Khói Thuốc & Súng Phóng Bom',
        title_en: 'Demolitionist & Smoke Tactics',
        description: 'Vũ khí Combat Rifle (18 DMG, tầm 5). Kỹ năng Thuốc lá (+30% DMG, +1 Tốc độ trong 2 lượt, hết hiệu lực mới hồi 3L). Súng bắn bom 2 viên (30 DMG, tầm 6, nổ 3x3, nổ sớm nếu chạm địch trên đường bay, bắn hết 2 viên mới hồi 4L).',
        description_en: 'Combat Rifle (18 DMG, range 5). Cigarette (+30% DMG, +1 Move for 2 turns). 2-round Bomb Launcher (30 DMG, range 6, 3x3 burst, impact trigger, CD 4T).',
        avatar: '🚬',
        themeColor: '#f97316',
        secondaryColor: '#fb923c',
        maxHp: 100,
        moveBudget: 2,
        isUnlocked: true,
        skills: [
            {
                slot: 1,
                id: 'SMOKE_MOVE',
                name: 'Lộ Trình',
                name_en: 'Route',
                icon: '👟',
                hotkey: '1 / M',
                type: 'PATH_MOVE',
                maxSteps: 2,
                power: 0,
                desc: 'Di chuyển tự do tối đa 2 bước (hoặc 3 bước khi đang hút thuốc)',
                desc_en: 'Free movement up to 2 steps (or 3 steps while smoking)',
                color: '#f97316'
            },
            {
                slot: 2,
                id: 'SMOKE_RIFLE',
                name: 'Combat Rifle',
                name_en: 'Combat Rifle',
                icon: '🔫',
                hotkey: '2 / J',
                type: 'RANGED_LINE',
                range: 5,
                power: 18,
                desc: 'Bắn súng trường tầm xa 5 ô (18 Sát thương, tăng lên 23 khi hút thuốc)',
                desc_en: 'Rifle shot up to 5 tiles (18 Damage, boosted to 23 while smoking)',
                color: '#fb923c'
            },
            {
                slot: 3,
                id: 'SMOKE_CIGARETTE',
                name: 'Thuốc Lá',
                name_en: 'Cigarette',
                icon: '🚬',
                hotkey: '3 / K',
                type: 'BUFF_SMOKE',
                duration: 2,
                dmgBonusPercent: 30,
                moveBonus: 1,
                cooldown: 3,
                desc: 'Hút thuốc: Tăng +30% Sát thương và +1 Bước di chuyển trong 2 lượt. Hết hiệu lực mới hồi chiêu 3L',
                desc_en: 'Smoke: +30% Damage and +1 Movement step for 2 turns. CD: 3T after expiry',
                color: '#eab308'
            },
            {
                slot: 4,
                id: 'SMOKE_BOMB_LAUNCHER',
                name: 'Súng Bắn Bom',
                name_en: 'Bomb Launcher',
                icon: '💥',
                hotkey: '4 / L',
                type: 'BOMB_LAUNCHER',
                maxAmmo: 2,
                range: 6,
                power: 30,
                cooldown: 4,
                aoeRadius: 1,
                desc: 'Súng bắn bom (2 viên): Tầm 6 ô nổ 3x3 (30 DMG), nổ sớm tại chỗ nếu va chạm địch trên đường bay. Bắn hết 2 viên mới hồi chiêu 4L',
                desc_en: 'Bomb Launcher (2 ammo): Range 6, 3x3 blast (30 DMG), impact detonation on collision. CD: 4T after 2 shots',
                color: '#ef4444'
            }
        ]
    },
    {
        id: 'razor',
        name: 'Razor',
        name_en: 'Razor',
        title: 'Kiếm Sĩ Công Nghệ & Đột Kích Siêu Thanh',
        title_en: 'Cyberblade & Supersonic Striker',
        description: 'Vũ khí Pulse Rifle (25 DMG, tầm 4). Kỹ năng Nhảy Đột Kích 3 ô không bị cản trở, giảm 25% sát thương nhận phải (nhảy thêm 2 bước nếu ô đích có địch/vật thể). Kiếm Gắn Tay (60 DMG) chém quét hình chữ nhật 3x2 trong 4 hướng chính, có 2 lượt dùng trước khi hồi chiêu.',
        description_en: 'Pulse Rifle (25 DMG, range 4). Unhindered Leap (range 3) with 25% damage reduction (+2 bonus steps if occupied). Arm Blade (60 DMG) sweeps 3x2 rectangle (2 uses before CD).',
        avatar: '⚡',
        themeColor: '#06b6d4',
        secondaryColor: '#22d3ee',
        maxHp: 100,
        moveBudget: 2,
        isUnlocked: true,
        skills: [
            {
                slot: 1,
                id: 'RAZOR_MOVE',
                name: 'Lộ Trình',
                name_en: 'Route',
                icon: '👟',
                hotkey: '1 / M',
                type: 'PATH_MOVE',
                maxSteps: 2,
                power: 0,
                desc: 'Di chuyển tự do tối đa 2 bước theo mọi hướng',
                desc_en: 'Free movement up to 2 steps in all directions',
                color: '#06b6d4'
            },
            {
                slot: 2,
                id: 'RAZOR_PULSE_RIFLE',
                name: 'Pulse Rifle',
                name_en: 'Pulse Rifle',
                icon: '🔫',
                hotkey: '2 / J',
                type: 'RANGED_LINE',
                range: 4,
                power: 25,
                desc: 'Bắn súng trường xung điện tầm xa 4 ô (25 Sát thương)',
                desc_en: 'Energy rifle shot up to 4 tiles (25 Damage)',
                color: '#22d3ee'
            },
            {
                slot: 3,
                id: 'RAZOR_LEAP',
                name: 'Nhảy Đột Kích',
                name_en: 'Assault Leap',
                icon: '🦘',
                hotkey: '3 / K',
                type: 'LEAP',
                range: 3,
                leapExtra: 2,
                damageReductionPercent: 25,
                cooldown: 3,
                desc: 'Nhảy 3 ô xuyên vật thể, giảm 25% sát thương nhận phải. Nếu đích có địch/vật thể thì nhảy thêm 2 bước nữa. Hồi: 3L',
                desc_en: 'Leap 3 tiles across obstacles with 25% damage mitigation. Bounds +2 extra tiles if landing occupied. CD: 3T',
                color: '#38bdf8'
            },
            {
                slot: 4,
                id: 'RAZOR_BLADE',
                name: 'Kiếm Gắn Tay',
                name_en: 'Arm Blade',
                icon: '🗡️',
                hotkey: '4 / L',
                type: 'RECT_SLASH',
                maxAmmo: 2,
                rangeForward: 2,
                widthPerp: 3,
                power: 60,
                cooldown: 4,
                cardinalOnly: true,
                desc: 'Chém quét hình chữ nhật 3x2 trong 4 hướng chính (60 DMG). Có 2 lượt dùng trước khi hồi chiêu 4L',
                desc_en: 'Sweeping 3x2 slash in 4 cardinal directions (60 DMG). 2 uses before CD: 4T',
                color: '#06b6d4'
            }
        ]
    },
    {
        id: 'placeholder_4',
        name: '[+] Đang Chờ Thiết Kế',
        name_en: '[+] Coming Soon',
        title: 'Nhân vật sắp ra mắt #5',
        title_en: 'Upcoming Operative #5',
        description: 'Ô trống sẵn sàng để tạo thêm chiến binh mới theo phong cách bạn muốn.',
        description_en: 'Slot reserved for upcoming community-designed operative.',
        avatar: '❓',
        themeColor: '#64748b',
        secondaryColor: '#475569',
        maxHp: 100,
        isUnlocked: false,
        skills: [
            { slot: 1, name: 'Chiêu 1', name_en: 'Skill 1', icon: '🔒', type: 'CUSTOM', desc: 'Chưa mở khóa', desc_en: 'Locked' },
            { slot: 2, name: 'Chiêu 2', name_en: 'Skill 2', icon: '🔒', type: 'CUSTOM', desc: 'Chưa mở khóa', desc_en: 'Locked' },
            { slot: 3, name: 'Chiêu 3', name_en: 'Skill 3', icon: '🔒', type: 'CUSTOM', desc: 'Chưa mở khóa', desc_en: 'Locked' },
            { slot: 4, name: 'Chiêu 4', name_en: 'Skill 4', icon: '🔒', type: 'CUSTOM', desc: 'Chưa mở khóa', desc_en: 'Locked' }
        ]
    }
];

// Helper functions for bilingual support
function getCharName(char, lang = (typeof getLanguage === 'function' ? getLanguage() : 'vi')) {
    if (!char) return '';
    return (lang === 'en' && char.name_en) ? char.name_en : char.name;
}

function getCharTitle(char, lang = (typeof getLanguage === 'function' ? getLanguage() : 'vi')) {
    if (!char) return '';
    return (lang === 'en' && char.title_en) ? char.title_en : char.title;
}

function getCharDesc(char, lang = (typeof getLanguage === 'function' ? getLanguage() : 'vi')) {
    if (!char) return '';
    return (lang === 'en' && char.description_en) ? char.description_en : char.description;
}

function getSkillName(skill, lang = (typeof getLanguage === 'function' ? getLanguage() : 'vi')) {
    if (!skill) return '';
    return (lang === 'en' && skill.name_en) ? skill.name_en : skill.name;
}

function getSkillDesc(skill, lang = (typeof getLanguage === 'function' ? getLanguage() : 'vi')) {
    if (!skill) return '';
    return (lang === 'en' && skill.desc_en) ? skill.desc_en : skill.desc;
}

// Helper truy xuất dữ liệu nhân vật
function getCharacterById(id) {
    return CHARACTERS_DATABASE.find(c => c.id === id) || CHARACTERS_DATABASE[0];
}

function getAllCharacters() {
    return CHARACTERS_DATABASE;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CHARACTERS_DATABASE,
        getCharName,
        getCharTitle,
        getCharDesc,
        getSkillName,
        getSkillDesc,
        getCharacterById,
        getAllCharacters
    };
}
