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
        id: 'fireman',
        name: 'Fire man',
        name_en: 'Fire man',
        title: 'Hỏa Binh & Kiểm Soát Vùng Cháy',
        title_en: 'Pyro Trooper & Fire Hazard Specialist',
        description: 'Vũ khí Gattling Fire (15 DMG, tầm 5, gây cháy 3 lượt, -5 HP/lượt, không cộng dồn). Kỹ năng Thùng Dầu (tầm 6, nổ 3x3 sớm nếu chạm vật thể, dính dầu sẽ bốc cháy khi nhận bất kỳ sát thương nào). Đại Bác Lửa (15 DMG, tầm 5, nổ 3x3 sớm nếu chạm vật thể, tạo Vùng Cháy tồn tại 2 lượt, thiêu đốt kẻ địch đi qua).',
        description_en: 'Weapon: Gattling Fire (15 DMG, range 5, burns for 3 turns, -5 HP/turn, non-stacking). Skill 1: Oil Barrel (range 6, 3x3 blast on impact, oiled enemies burn upon taking damage from any source). Skill 2: Fire Cannon (15 DMG, range 5, 3x3 blast on impact, creates a Fire Zone lasting 2 turns burning any enemy passing through).',
        avatar: '🔥',
        themeColor: '#ea580c',
        secondaryColor: '#f97316',
        maxHp: 100,
        moveBudget: 2,
        isUnlocked: true,
        skills: [
            {
                slot: 1,
                id: 'FIREMAN_MOVE',
                name: 'Lộ Trình',
                name_en: 'Route',
                icon: '👟',
                hotkey: '1 / M',
                type: 'PATH_MOVE',
                maxSteps: 2,
                power: 0,
                desc: 'Di chuyển tự do tối đa 2 bước theo mọi hướng',
                desc_en: 'Free movement up to 2 steps in all directions',
                color: '#ea580c'
            },
            {
                slot: 2,
                id: 'FIREMAN_GATTLING_FIRE',
                name: 'Gattling Fire',
                name_en: 'Gattling Fire',
                icon: '🔥',
                hotkey: '2 / J',
                type: 'RANGED_LINE',
                range: 5,
                power: 15,
                burnTurns: 3,
                burnDmg: 5,
                desc: 'Bắn súng lửa tầm xa 5 ô (15 Sát thương). Gây cháy 3 lượt (-5 HP/lượt, không cộng dồn)',
                desc_en: 'Fires flaming rounds up to 5 tiles (15 DMG). Inflicts Burn for 3 turns (-5 HP/turn, non-stacking)',
                color: '#f97316'
            },
            {
                slot: 3,
                id: 'FIREMAN_OIL_BARREL',
                name: 'Thùng Dầu',
                name_en: 'Oil Barrel',
                icon: '🛢️',
                hotkey: '3 / K',
                type: 'OIL_BARREL',
                range: 6,
                power: 0,
                aoeRadius: 1,
                cooldown: 3,
                desc: 'Ném Thùng Dầu tầm 6 ô nổ 3x3 (0 DMG, Hồi: 3L). Nổ sớm nếu chạm vật thể/địch. Kẻ địch dính dầu sẽ bốc cháy khi nhận sát thương từ mọi nguồn',
                desc_en: 'Launches Oil Barrel up to 6 tiles detonating 3x3 on impact (0 DMG, CD: 3T). Drenched enemies ignite upon receiving damage from any source',
                color: '#d97706'
            },
            {
                slot: 4,
                id: 'FIREMAN_FIRE_CANNON',
                name: 'Đại Bác Lửa',
                name_en: 'Fire Cannon',
                icon: '💥',
                hotkey: '4 / L',
                type: 'FIRE_CANNON',
                range: 5,
                power: 15,
                aoeRadius: 1,
                fireZoneDuration: 2,
                cooldown: 4,
                desc: 'Bắn Đại Bác Lửa tầm 5 ô nổ 3x3 (15 DMG, Hồi: 4L). Nổ sớm nếu chạm vật thể/địch. Tạo Vùng Cháy trong 2 lượt, thiêu đốt kẻ địch đi qua',
                desc_en: 'Fires Fire Cannon up to 5 tiles detonating 3x3 on impact (15 DMG, CD: 4T). Creates a Fire Zone lasting 2 turns, burning enemies passing through',
                color: '#dc2626'
            }
        ]
    },
    {
        id: 'engie',
        name: 'Engie (Kỹ Sư Cơ Khí)',
        name_en: 'Engie (Combat Engineer)',
        title: 'Bậc Thầy Kiến Trúc & Công Nghệ Dịch Chuyển',
        title_en: 'Master of Sentry Architecture & Teleportation',
        description: 'Vũ khí Súng Bắn Thanh Sắt (15 DMG, tầm 5). Kỹ năng Xây Sentry tự động (50 HP, 10 DMG, quét 11x11, Hồi 2L). Mở Cổng Dịch Chuyển (60 HP, tầm 5), đưa đồng minh đến cổng ra tức thì.',
        description_en: 'Equipped with Iron Rod Gun (15 DMG, range 5). Deploys Auto-Sentry (50 HP, 10 DMG, 11x11 zone, CD 2T). Deploys Teleporter (60 HP, range 5), warping allies instantly.',
        avatar: '🔧',
        themeColor: '#f59e0b',
        secondaryColor: '#fbbf24',
        maxHp: 100,
        moveBudget: 2,
        isUnlocked: true,
        skills: [
            {
                slot: 1,
                id: 'ENGIE_MOVE',
                name: 'Lộ Trình',
                name_en: 'Route',
                icon: '👟',
                hotkey: '1 / M',
                type: 'PATH_MOVE',
                maxSteps: 2,
                power: 0,
                desc: 'Di chuyển tự do tối đa 2 bước theo mọi hướng',
                desc_en: 'Free movement up to 2 steps in all directions',
                color: '#f59e0b'
            },
            {
                slot: 2,
                id: 'ENGIE_NAILGUN',
                name: 'Súng Thanh Sắt',
                name_en: 'Iron Rod Gun',
                icon: '🔩',
                hotkey: '2 / J',
                type: 'RANGED_LINE',
                range: 5,
                power: 15,
                desc: 'Bắn thanh sắt tầm xa 5 ô (15 Sát thương)',
                desc_en: 'Fires high-velocity iron rods up to 5 tiles (15 DMG)',
                color: '#fbbf24'
            },
            {
                slot: 3,
                id: 'ENGIE_SENTRY',
                name: 'Xây Sentry',
                name_en: 'Deploy Sentry',
                icon: '🤖',
                hotkey: '3 / K',
                type: 'DEPLOY_SENTRY',
                range: 1,
                power: 10,
                sentryHp: 50,
                sentryRange: 5,
                cooldown: 2,
                desc: 'Xây Sentry tự động phía trước (50 HP, 10 DMG, Hồi: 2L). Tự động nã đạn vào kẻ địch gần nhất trong phạm vi 11x11',
                desc_en: 'Deploys an Auto-Sentry ahead (50 HP, 10 DMG, CD: 2T). Automatically fires at nearest enemy in 11x11 zone',
                color: '#ea580c'
            },
            {
                slot: 4,
                id: 'ENGIE_TELEPORTER',
                name: 'Cổng Dịch Chuyển',
                name_en: 'Teleporter',
                icon: '🌀',
                hotkey: '4 / L',
                type: 'DEPLOY_TELEPORTER',
                range: 5,
                portalHp: 60,
                cooldown: 3,
                desc: 'Tạo cổng vào tại chỗ và cổng ra tại đích phạm vi 5 (60 HP, Hồi: 3L). Mọi đồng minh khi đến ô cổng vào sẽ lập tức xuất hiện tại cổng ra',
                desc_en: 'Creates an Entrance portal at current tile and Exit portal up to 5 tiles (60 HP, CD: 3T). Any ally reaching Entrance instantly warps to Exit',
                color: '#06b6d4'
            }
        ]
    },
    {
        id: 'snipeman',
        name: 'Snipeman (Xạ Thủ Bắn Tỉa)',
        name_en: 'Snipeman (Sniper Specialist)',
        title: 'Bậc Thầy Ngắm Bắn Tầm Xa & Hỗ Trợ Tầm Nhiệt',
        title_en: 'Master of Long-Range Marksmanship & Thermal Support',
        description: 'Vũ khí Súng Tỉa: Lần 1 ngắm bắn (giảm 1 bước di chuyển), Lần 2 bắn (25-50 DMG tầm 6, khoảng cách càng xa sát thương càng tăng). Chiêu 1: Phát Bắn Hủy Diệt (+30% DMG & xuyên thấu, Hồi: 3L). Chiêu 2: Tầm Nhìn Dò Nhiệt (+1 phạm vi cho toàn đội lần dùng kế tiếp, Hồi: 4L).',
        description_en: 'Equipped with Sniper Rifle: 1st tap scopes in (reduces 1 movement step), 2nd tap fires (25-50 DMG up to 6 tiles, damage scales with distance). Skill 1: Destructive Shot (+30% DMG & pierces all enemies, CD: 3T). Skill 2: Thermal Vision (+1 range to all allies on next ability, CD: 4T).',
        avatar: '🎯',
        themeColor: '#6366f1',
        secondaryColor: '#818cf8',
        maxHp: 100,
        moveBudget: 2,
        isUnlocked: true,
        skills: [
            {
                slot: 1,
                id: 'SNIPER_MOVE',
                name: 'Lộ Trình',
                name_en: 'Route',
                icon: '👟',
                hotkey: '1 / M',
                type: 'PATH_MOVE',
                maxSteps: 2,
                power: 0,
                desc: 'Di chuyển tự do tối đa 2 bước (khi đang ngắm bắn chỉ di chuyển tối đa 1 bước)',
                desc_en: 'Free movement up to 2 steps (limited to 1 step while scoped)',
                color: '#6366f1'
            },
            {
                slot: 2,
                id: 'SNIPER_RIFLE',
                name: 'Súng Tỉa',
                name_en: 'Sniper Rifle',
                icon: '🎯',
                hotkey: '2 / J',
                type: 'SNIPER_WEAPON',
                range: 6,
                minPower: 25,
                maxPower: 50,
                desc: 'Lần bấm 1: Ngắm bắn (mất 1 bước di chuyển). Lần bấm 2: Bắn tỉa tầm 6 (25-30-35-40-45-50 DMG tỉ lệ thuận cự ly xa)',
                desc_en: '1st tap: Aim/Scope (lose 1 move step). 2nd tap: Fire sniper shot range 6 (25-50 DMG scales with distance)',
                color: '#818cf8'
            },
            {
                slot: 3,
                id: 'SNIPER_DESTRUCTIVE',
                name: 'Phát Bắn Hủy Diệt',
                name_en: 'Destructive Shot',
                icon: '⚡',
                hotkey: '3 / K',
                type: 'BUFF_DESTRUCTIVE',
                cooldown: 3,
                dmgBonusPercent: 30,
                desc: 'Cường hóa phát súng tỉa tiếp theo: +30% sát thương và bắn xuyên thấu toàn bộ kẻ địch trên đường đạn (Hồi: 3L)',
                desc_en: 'Empowers next sniper shot: +30% DMG and pierces through all enemies along bullet path (CD: 3T)',
                color: '#ec4899'
            },
            {
                slot: 4,
                id: 'SNIPER_THERMAL',
                name: 'Tầm Nhìn Dò Nhiệt',
                name_en: 'Thermal Vision',
                icon: '🔭',
                hotkey: '4 / L',
                type: 'BUFF_THERMAL',
                cooldown: 4,
                rangeBonus: 1,
                desc: 'Kích hoạt tầm nhiệt: Toàn bộ đồng đội được cộng +1 phạm vi cho lần thi triển vũ khí/kỹ năng kế tiếp (Hồi: 4L)',
                desc_en: 'Activates thermal scan: All allies gain +1 range for their next weapon/ability cast (CD: 4T)',
                color: '#06b6d4'
            }
        ]
    },
    {
        id: 'hat_boom_man',
        name: 'Hat Boom Man (Chuyên Gia Pháo & Mũ Bom)',
        name_en: 'Hat Boom Man (Cannonier & Bomb Hat)',
        title: 'Bậc Thầy Nòng Xe Tăng & Nhảy Bật Miễn Nhiễm',
        title_en: 'Master of Tank Cannons & Invulnerable Leaps',
        description: 'Vũ khí Nòng Xe Tăng: Lần 1 ngắm bắn (giảm 1 bước di chuyển), Lần 2 bắn (15-45 DMG tầm 6 theo khoảng cách, nổ 3x3 gây 10 DMG xung quanh trừ tâm). Chiêu 1: Cú Bật Nhảy 2 ô miễn nhiễm mọi sát thương (Hồi: 2L). Chiêu 2: Phát Bắn Rối Loạn (+30% DMG & nổ 5x5, Hồi: 3L).',
        description_en: 'Equipped with Tank Cannon: 1st tap scopes (loses 1 move step), 2nd tap fires (15-45 DMG up to 6 tiles scales with distance, 3x3 blast deals 10 splash DMG except center). Skill 1: Invulnerable Leap 2 tiles (CD: 2T). Skill 2: Chaos Shot (+30% DMG & 5x5 explosion, CD: 3T).',
        avatar: '🎩',
        themeColor: '#e11d48',
        secondaryColor: '#fb7185',
        maxHp: 100,
        moveBudget: 2,
        isUnlocked: true,
        skills: [
            {
                slot: 1,
                id: 'BOOM_MOVE',
                name: 'Lộ Trình',
                name_en: 'Route',
                icon: '👟',
                hotkey: '1 / M',
                type: 'PATH_MOVE',
                maxSteps: 2,
                power: 0,
                desc: 'Di chuyển tự do tối đa 2 bước (khi đang ngắm bắn chỉ di chuyển tối đa 1 bước)',
                desc_en: 'Free movement up to 2 steps (limited to 1 step while scoped)',
                color: '#e11d48'
            },
            {
                slot: 2,
                id: 'TANK_CANNON',
                name: 'Nòng Xe Tăng',
                name_en: 'Tank Cannon',
                icon: '🎯',
                hotkey: '2 / J',
                type: 'TANK_WEAPON',
                range: 6,
                minPower: 15,
                maxPower: 45,
                desc: 'Lần bấm 1: Ngắm bắn (mất 1 bước di chuyển). Lần bấm 2: Bắn đại bác tầm 6 (15-20-30-35-40-45 DMG theo cự ly, nổ 3x3 gây 10 DMG xung quanh trừ tâm)',
                desc_en: '1st tap: Aim/Scope (lose 1 move step). 2nd tap: Fire cannon range 6 (15-45 DMG scales with distance, 3x3 blast deals 10 splash DMG except center)',
                color: '#fb7185'
            },
            {
                slot: 3,
                id: 'BOOM_LEAP',
                name: 'Cú Bật Nhảy',
                name_en: 'Invulnerable Leap',
                icon: '🦘',
                hotkey: '3 / K',
                type: 'BOOM_LEAP',
                range: 2,
                cooldown: 2,
                desc: 'Tạo cú bật nhảy phạm vi 2 ô vượt địa hình và miễn nhiễm hoàn toàn mọi sát thương nhận phải trong nhịp nhảy (Hồi: 2L)',
                desc_en: 'Performs an invulnerable leap up to 2 tiles across obstacles, immune to all incoming damage during leap (CD: 2T)',
                color: '#f59e0b'
            },
            {
                slot: 4,
                id: 'BOOM_CHAOS_SHOT',
                name: 'Phát Bắn Rối Loạn',
                name_en: 'Chaos Shot',
                icon: '🌀',
                hotkey: '4 / L',
                type: 'BUFF_CHAOS_SHOT',
                cooldown: 3,
                dmgBonusPercent: 30,
                aoeRadius: 2,
                desc: 'Cường hóa phát bắn tiếp theo với sát thương +30% và biến phạm vi nổ thành 5x5 cực đại (Hồi: 3L)',
                desc_en: 'Empowers next cannon shot: +30% direct damage and expands blast radius to a massive 5x5 zone (CD: 3T)',
                color: '#a855f7'
            }
        ]
    },
    {
        id: 'fake_savior',
        name: 'Fake Savior (Kẻ Cứu Rỗi Giả Tạo)',
        name_en: 'Fake Savior (False Prophet)',
        title: 'Thao Túng Lực Tâm Linh & Chiêu Hồn Thây Ma',
        title_en: 'Telekinetic Puppeteer & Undead Summoner',
        description: 'Vũ khí Revolver: Sát thương 25, tầm bắn 4 ô. Chiêu 1: Telekinesis (Kiểm soát địch gần nhất trong 5x5, hất văng 3 ô ngược hướng di chuyển; đẩy tiếp kẻ địch khác trên đường văng; gây 20 DMG nếu 1 người, 30 DMG nếu nhiều người). Chiêu 2: Necromancy (Triệu hồi 2 thây ma CPU 40 HP, chỉ có duy nhất 1 lệnh tấn công 35 DMG ở vùng 3x3 vào 1 kẻ địch ngẫu nhiên).',
        description_en: 'Revolver: 25 DMG, range 4. Skill 1: Telekinesis (Controls closest enemy in 5x5, knocks back 3 tiles opposite to their move direction; chains push to collateral enemies; deals 20 DMG to solo target or 30 DMG each to multiple targets). Skill 2: Necromancy (Summons 2 CPU zombies with 40 HP, each having only 1 attack command dealing 35 DMG in 3x3 to a single random enemy).',
        avatar: '🪬',
        themeColor: '#8b5cf6',
        secondaryColor: '#a78bfa',
        maxHp: 100,
        moveBudget: 2,
        isUnlocked: true,
        skills: [
            {
                slot: 1,
                id: 'SAVIOR_MOVE',
                name: 'Lộ Trình',
                name_en: 'Route',
                icon: '👟',
                hotkey: '1 / M',
                type: 'PATH_MOVE',
                maxSteps: 2,
                power: 0,
                desc: 'Di chuyển tự do tối đa 2 bước theo mọi hướng',
                desc_en: 'Free movement up to 2 steps in all directions',
                color: '#8b5cf6'
            },
            {
                slot: 2,
                id: 'SAVIOR_REVOLVER',
                name: 'Revolver',
                name_en: 'Revolver',
                icon: '🔫',
                hotkey: '2 / J',
                type: 'REVOLVER',
                range: 4,
                power: 25,
                desc: 'Bắn súng ổ xoay tầm xa 4 ô theo 8 hướng (25 Sát thương)',
                desc_en: 'Fires heavy cylinder revolver up to 4 tiles in 8 directions (25 Damage)',
                color: '#ec4899'
            },
            {
                slot: 3,
                id: 'SAVIOR_TELEKINESIS',
                name: 'Telekinesis',
                name_en: 'Telekinesis',
                icon: '🔮',
                hotkey: '3 / K',
                type: 'TELEKINESIS',
                range: 2,
                power: 20,
                comboPower: 30,
                knockback: 3,
                cooldown: 3,
                desc: 'Khống chế kẻ địch gần nhất trong 5x5, hất văng 3 ô ngược hướng di chuyển. Nếu chạm kẻ địch khác thì đẩy tiếp 3 ô. Gây 20 DMG nếu 1 mục tiêu, 30 DMG mỗi người nếu nhiều mục tiêu (Hồi: 3L)',
                desc_en: 'Controls closest enemy in 5x5, knocks back 3 tiles opposite to their movement. Chains 3-tile push to collateral enemies. Deals 20 DMG to solo target or 30 DMG each to multiple targets (CD: 3T)',
                color: '#c084fc'
            },
            {
                slot: 4,
                id: 'SAVIOR_NECROMANCY',
                name: 'Necromancy',
                name_en: 'Necromancy',
                icon: '🧟',
                hotkey: '4 / L',
                type: 'NECROMANCY',
                cooldown: 4,
                zombieHp: 40,
                zombiePower: 35,
                desc: 'Triệu hồi 2 thây ma CPU (40 HP) kề bên. Thây ma chỉ có duy nhất 1 lệnh tấn công gây 35 DMG ở phạm vi 3x3 vào 1 kẻ địch ngẫu nhiên (Hồi: 4L)',
                desc_en: 'Summons 2 CPU zombies (40 HP) adjacent. Each zombie has only 1 attack command dealing 35 DMG in a 3x3 radius to a single random enemy (CD: 4T)',
                color: '#10b981'
            }
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
