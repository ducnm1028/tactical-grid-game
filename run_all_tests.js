/**
 * Master Test Runner: Runs all 7 test suites for Chrono Clash
 */
const { execSync } = require('child_process');

const testFiles = [
    'test_control_hint.js',
    'test_cpu_characters.js',
    'test_koth.js',
    'test_screens.js',
    'test_team_battle.js',
    'test_two_player_mode.js',
    'test_fireman.js',
    'test_engie.js',
    'test_snipeman.js',
    'test_hat_boom_man.js'
];

console.log('====================================================');
console.log('🚀 CHRONO CLASH - CHẠY TẤT CẢ 10 TEST SUITES');
console.log('====================================================\n');

let totalPassed = 0;
for (const file of testFiles) {
    console.log(`\n▶ ĐANG CHẠY SUITE: ${file}`);
    try {
        const output = execSync(`node ${file}`, { stdio: 'pipe' }).toString();
        console.log(output);
        totalPassed++;
    } catch (err) {
        console.error(`❌ THẤT BẠI TẠI SUITE: ${file}`);
        if (err.stdout) console.log(err.stdout.toString());
        if (err.stderr) console.error(err.stderr.toString());
        process.exit(1);
    }
}

console.log('====================================================');
console.log(`🎉 TẤT CẢ ${totalPassed}/${testFiles.length} TEST SUITES ĐÃ VƯỢT QUA 100%!`);
console.log('====================================================');
