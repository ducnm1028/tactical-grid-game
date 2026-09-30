/**
 * CHRONO CLASH: CHARACTER & SKILL DATABASE
 * Hệ thống định nghĩa nhân vật và bộ kỹ năng dạng Modular.
 * Bạn có thể dễ dàng bổ sung thêm nhân vật mới bất kỳ lúc nào bằng cách thêm vào mảng CHARACTERS_DATABASE bên dưới!
 */

const CHARACTERS_DATABASE = [
    {
        id: 'trooper',
        name: 'Trooper (Chiến Binh Xạ Thủ)',
        title: 'Xạ Thủ Hỏa Lực & Kiểm Soát Khu Vực',
        description: 'Sở hữu Súng trường bắn xa 5 ô (20 DMG), Lựu đạn hẹn giờ 2 lượt nổ 3x3 (50 DMG) và Tên lửa diện rộng (30 DMG).',
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
                icon: '👟',
                hotkey: '1 / M',
                type: 'PATH_MOVE',
                maxSteps: 2,
                power: 0,
                desc: 'Di chuyển tự do tối đa 2 bước theo mọi hướng',
                color: '#10b981'
            },
            {
                slot: 2,
                id: 'TROOPER_RIFLE',
                name: 'Assault Rifle',
                icon: '🔫',
                hotkey: '2 / J',
                type: 'RANGED_LINE',
                range: 5,
                power: 20,
                desc: 'Bắn thẳng/chéo 5 ô (20 Sát thương)',
                color: '#34d399'
            },
            {
                slot: 3,
                id: 'TROOPER_GRENADE',
                name: 'Lựu Đạn',
                icon: '💣',
                hotkey: '3 / K',
                type: 'GRENADE',
                range: 5,
                power: 50,
                fuse: 2,
                cooldown: 3,
                aoeRadius: 1,
                desc: 'Ném 5 ô, nổ 3x3 sau 2 lượt (50 DMG, Hồi: 3L)',
                color: '#f59e0b'
            },
            {
                slot: 4,
                id: 'TROOPER_ROCKET',
                name: 'Tên Lửa',
                icon: '🚀',
                hotkey: '4 / L',
                type: 'ROCKET',
                range: 6,
                power: 30,
                cooldown: 4,
                aoeRadius: 1,
                desc: 'Bắn tên lửa 6 ô nổ ngay 3x3 quanh đích, nổ sớm tại chỗ nếu va chạm địch trên đường bay (30 DMG, Hồi: 4L)',
                color: '#ef4444'
            }
        ]
    },
    {
        id: 'hookman',
        name: 'Hookman (Kẻ Săn Mồi)',
        title: 'Sát Thủ Bóng Đêm & Súng Giảm Thanh',
        description: 'Tàng hình ngoài phạm vi 7x7. Vũ khí Silence Pistol (15-20 DMG), Ống tiêm Adrenaline (+15 HP, +20% DMG) và Móc Kéo 2 nhịp.',
        avatar: '🪝',
        themeColor: '#8b5cf6',
        secondaryColor: '#a78bfa',
        maxHp: 90,
        moveBudget: 3,
        stealthRadius: 3, // Nằm ngoài phạm vi 7x7 (dx > 3 hoặc dy > 3) sẽ tàng hình
        isUnlocked: true,
        skills: [
            {
                slot: 1,
                id: 'HOOKMAN_MOVE',
                name: 'Lộ Trình',
                icon: '👟',
                hotkey: '1 / M',
                type: 'PATH_MOVE',
                maxSteps: 3,
                power: 0,
                desc: 'Di chuyển tự do tối đa 3 bước uốn lượn',
                color: '#8b5cf6'
            },
            {
                slot: 2,
                id: 'HOOKMAN_PISTOL',
                name: 'Silence Pistol',
                icon: '🎯',
                hotkey: '2 / J',
                type: 'RANGED_VARIABLE',
                range: 5,
                minPower: 15,
                maxPower: 20,
                desc: 'Bắn súng giảm thanh tầm xa 5 ô (15 - 20 Sát thương)',
                color: '#a78bfa'
            },
            {
                slot: 3,
                id: 'HOOKMAN_ADRENALINE',
                name: 'Ống Tiêm Adrenaline',
                icon: '💉',
                hotkey: '3 / K',
                type: 'BUFF_HEAL',
                healPerTurn: 5,
                duration: 3,
                totalHeal: 15,
                dmgBonusPercent: 20,
                cooldown: 3,
                desc: 'Hồi 5 HP/lượt trong 3 lượt (tổng 15 HP), Sát thương tăng +20%. Hồi: 3L',
                color: '#10b981'
            },
            {
                slot: 4,
                id: 'HOOKMAN_HOOK',
                name: 'Móc Kéo',
                icon: '🪝',
                hotkey: '4 / L',
                type: 'HOOK_PULL',
                range: 5,
                power: 15,
                pullSteps: 1,
                delayedPullSteps: 2,
                cooldown: 4,
                desc: 'Bắn móc 5 ô gây 15 DMG, kéo địch 1 ô. Hết lượt sau kéo tiếp 2 ô rồi mới hồi chiêu 4L',
                color: '#ef4444'
            }
        ]
    },
    {
        id: 'smoke_guy',
        name: 'Smoke Guy',
        title: 'Hỏa Lực Khói Thuốc & Súng Phóng Bom',
        description: 'Vũ khí Combat Rifle (18 DMG, tầm 5). Kỹ năng Thuốc lá (+30% DMG, +1 Tốc độ trong 2 lượt, hết hiệu lực mới hồi 3L). Súng bắn bom 2 viên (30 DMG, tầm 6, nổ 3x3, nổ sớm nếu chạm địch trên đường bay, bắn hết 2 viên mới hồi 4L).',
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
                icon: '👟',
                hotkey: '1 / M',
                type: 'PATH_MOVE',
                maxSteps: 2,
                power: 0,
                desc: 'Di chuyển tự do tối đa 2 bước (hoặc 3 bước khi đang hút thuốc)',
                color: '#f97316'
            },
            {
                slot: 2,
                id: 'SMOKE_RIFLE',
                name: 'Combat Rifle',
                icon: '🔫',
                hotkey: '2 / J',
                type: 'RANGED_LINE',
                range: 5,
                power: 18,
                desc: 'Bắn súng trường tầm xa 5 ô (18 Sát thương, tăng lên 23 khi hút thuốc)',
                color: '#fb923c'
            },
            {
                slot: 3,
                id: 'SMOKE_CIGARETTE',
                name: 'Thuốc Lá',
                icon: '🚬',
                hotkey: '3 / K',
                type: 'BUFF_SMOKE',
                duration: 2,
                dmgBonusPercent: 30,
                moveBonus: 1,
                cooldown: 3,
                desc: 'Hút thuốc: Tăng +30% Sát thương và +1 Bước di chuyển trong 2 lượt. Hết hiệu lực mới hồi chiêu 3L',
                color: '#eab308'
            },
            {
                slot: 4,
                id: 'SMOKE_BOMB_LAUNCHER',
                name: 'Súng Bắn Bom',
                icon: '💥',
                hotkey: '4 / L',
                type: 'BOMB_LAUNCHER',
                maxAmmo: 2,
                range: 6,
                power: 30,
                cooldown: 4,
                aoeRadius: 1,
                desc: 'Súng bắn bom (2 viên): Tầm 6 ô nổ 3x3 (30 DMG), nổ sớm tại chỗ nếu va chạm địch trên đường bay. Bắn hết 2 viên mới hồi chiêu 4L',
                color: '#ef4444'
            }
        ]
    },
    {
        id: 'razor',
        name: 'Razor',
        title: 'Kiếm Sĩ Công Nghệ & Đột Kích Siêu Thanh',
        description: 'Vũ khí Pulse Rifle (25 DMG, tầm 4). Kỹ năng Nhảy Đột Kích 3 ô không bị cản trở, giảm 25% sát thương nhận phải (nhảy thêm 2 bước nếu ô đích có địch/vật thể). Kiếm Gắn Tay (60 DMG) chém quét hình chữ nhật 3x2 trong 4 hướng chính, có 2 lượt dùng trước khi hồi chiêu.',
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
                icon: '👟',
                hotkey: '1 / M',
                type: 'PATH_MOVE',
                maxSteps: 2,
                power: 0,
                desc: 'Di chuyển tự do tối đa 2 bước theo mọi hướng',
                color: '#06b6d4'
            },
            {
                slot: 2,
                id: 'RAZOR_PULSE_RIFLE',
                name: 'Pulse Rifle',
                icon: '🔫',
                hotkey: '2 / J',
                type: 'RANGED_LINE',
                range: 4,
                power: 25,
                desc: 'Bắn súng trường xung điện tầm xa 4 ô (25 Sát thương)',
                color: '#22d3ee'
            },
            {
                slot: 3,
                id: 'RAZOR_LEAP',
                name: 'Nhảy Đột Kích',
                icon: '🦘',
                hotkey: '3 / K',
                type: 'LEAP',
                range: 3,
                leapExtra: 2,
                damageReductionPercent: 25,
                cooldown: 3,
                desc: 'Nhảy 3 ô xuyên vật thể, giảm 25% sát thương nhận phải. Nếu đích có địch/vật thể thì nhảy thêm 2 bước nữa. Hồi: 3L',
                color: '#38bdf8'
            },
            {
                slot: 4,
                id: 'RAZOR_BLADE',
                name: 'Kiếm Gắn Tay',
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
                color: '#06b6d4'
            }
        ]
    },
    {
        id: 'placeholder_4',
        name: '[+] Đang Chờ Thiết Kế',
        title: 'Nhân vật sắp ra mắt #5',
        description: 'Ô trống sẵn sàng để tạo thêm chiến binh mới theo phong cách bạn muốn.',
        avatar: '❓',
        themeColor: '#64748b',
        secondaryColor: '#475569',
        maxHp: 100,
        isUnlocked: false,
        skills: [
            { slot: 1, name: 'Chiêu 1', icon: '🔒', type: 'CUSTOM', desc: 'Chưa mở khóa' },
            { slot: 2, name: 'Chiêu 2', icon: '🔒', type: 'CUSTOM', desc: 'Chưa mở khóa' },
            { slot: 3, name: 'Chiêu 3', icon: '🔒', type: 'CUSTOM', desc: 'Chưa mở khóa' },
            { slot: 4, name: 'Chiêu 4', icon: '🔒', type: 'CUSTOM', desc: 'Chưa mở khóa' }
        ]
    }
];

// Helper truy xuất dữ liệu nhân vật
function getCharacterById(id) {
    return CHARACTERS_DATABASE.find(c => c.id === id) || CHARACTERS_DATABASE[0];
}

function getAllCharacters() {
    return CHARACTERS_DATABASE;
}
