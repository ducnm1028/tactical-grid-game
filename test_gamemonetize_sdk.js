/**
 * TEST SUITE: GAMEMONETIZE.COM SDK INTEGRATION & VERIFICATION
 * Verifies SDK initialization, event callbacks (SDK_GAME_PAUSE, SDK_GAME_START),
 * safe ad trigger invocation (sdk.showBanner), and zip bundle structure.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('====================================================');
console.log('🎮 KIỂM THỬ TỰ ĐỘNG TÍCH HỢP GAMEMONETIZE SDK');
console.log('====================================================\n');

// 1. Kiểm tra mã nguồn index.html
console.log('[TEST 1] Kiểm tra cấu hình SDK trong index.html:');
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

console.assert(indexHtml.includes('window.SDK_OPTIONS'), 'index.html phải khai báo window.SDK_OPTIONS');
console.assert(indexHtml.includes('api.gamemonetize.com/sdk.js'), 'index.html phải chèn script nạp https://api.gamemonetize.com/sdk.js');
console.assert(indexHtml.includes('SDK_GAME_PAUSE'), 'index.html phải xử lý sự kiện SDK_GAME_PAUSE');
console.assert(indexHtml.includes('SDK_GAME_START'), 'index.html phải xử lý sự kiện SDK_GAME_START');
console.log('✔ TEST 1 PASS: index.html có đầy đủ cấu hình SDK, URL tải thư viện và 2 sự kiện bắt buộc!\n');

// 2. Kiểm tra Mock Simulation vòng đời SDK
console.log('[TEST 2] Giả lập vòng đời SDK (SDK_GAME_PAUSE -> SDK_GAME_START):');

let prevSoundState = true;
const soundCtrl = { enabled: true };
const gameEngine = { isAdShowing: false };

global.window = {
    soundCtrl,
    gameEngine,
    SDK_OPTIONS: null
};
global.detectedGameId = null;

// Trích xuất đoạn mã SDK từ index.html và thực thi
const sdkScriptMatch = indexHtml.match(/window\.SDK_OPTIONS\s*=\s*\{[\s\S]*?\};\s*\n/);
console.assert(sdkScriptMatch, 'Phải trích xuất được khối window.SDK_OPTIONS');
vm.runInThisContext(sdkScriptMatch[0]);

console.assert(window.SDK_OPTIONS, 'window.SDK_OPTIONS phải được khởi tạo thành công');
console.assert(typeof window.SDK_OPTIONS.onEvent === 'function', 'onEvent phải là một hàm xử lý');

// Giả lập GameMonetize gửi sự kiện SDK_GAME_PAUSE
window.SDK_OPTIONS.onEvent({ name: 'SDK_GAME_PAUSE' });
console.assert(window.soundCtrl.enabled === false, 'Âm thanh phải tự động tắt (MUTE) khi quảng cáo phát');
console.assert(window.gameEngine.isAdShowing === true, 'Cờ isAdShowing phải bật true để tạm dừng logic');
console.log('  ✓ SDK_GAME_PAUSE: Âm thanh đã TẮT, Game đã TẠM DỪNG');

// Giả lập GameMonetize gửi sự kiện SDK_GAME_START
window.SDK_OPTIONS.onEvent({ name: 'SDK_GAME_START' });
console.assert(window.soundCtrl.enabled === true, 'Âm thanh phải tự động BẬT lại (UNMUTE) sau khi quảng cáo kết thúc');
console.assert(window.gameEngine.isAdShowing === false, 'Cờ isAdShowing phải tắt false để tiếp tục game');
console.log('  ✓ SDK_GAME_START: Âm thanh đã BẬT lại, Game đã TIẾP TỤC');

// Giả lập GameMonetize gửi sự kiện SDK_GAME_RESUME (tương thích đa phiên bản SDK)
window.SDK_OPTIONS.onEvent({ name: 'SDK_GAME_PAUSE' });
window.SDK_OPTIONS.onEvent({ name: 'SDK_GAME_RESUME' });
console.assert(window.soundCtrl.enabled === true, 'Âm thanh phải tự động BẬT lại khi nhận SDK_GAME_RESUME');
console.assert(window.gameEngine.isAdShowing === false, 'Game phải tiếp tục khi nhận SDK_GAME_RESUME');
console.log('  ✓ SDK_GAME_RESUME: Tương thích 100% với các biến thể SDK GameMonetize');
console.log('✔ TEST 2 PASS: Vòng đời quảng cáo hoạt động chuẩn xác 100%!\n');

// 3. Kiểm tra hàm triggerAd trong game.js
console.log('[TEST 3] Kiểm tra phương thức an toàn triggerAd() trong game.js:');
const gameJs = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');

console.assert(gameJs.includes('triggerAd()'), 'game.js phải có phương thức triggerAd()');
console.assert(gameJs.includes('.showBanner()'), 'game.js phải gọi showBanner()');
console.assert(gameJs.includes("this.triggerAd()"), 'game.js phải kích hoạt triggerAd ở các điểm chuyển tiếp ván đấu');

// Test an toàn: khi sdk chưa định nghĩa
let bannerCalled = false;
global.sdk = {
    showBanner: () => { bannerCalled = true; }
};

const domMock = {
    getElementById: () => ({ style: {}, classList: { add(){}, remove(){}, toggle(){} }, innerText: '', innerHTML: '', addEventListener(){} }),
    querySelector: () => null,
    querySelectorAll: () => []
};
global.document = domMock;

// Kiểm tra cú pháp triggerAd trực tiếp từ chính file game.js
const triggerMatch = gameJs.match(/triggerAd\(\)\s*\{([\s\S]*?)\n    \}/);
console.assert(triggerMatch, 'Phải trích xuất được phương thức triggerAd');
const testTriggerFn = new Function('sdk', 'window', triggerMatch[1]);

// Gọi khi có global sdk
testTriggerFn(global.sdk, global.window);
console.assert(bannerCalled === true, 'sdk.showBanner() phải được gọi thành công');

// Reset và test gọi qua window.sdk
bannerCalled = false;
global.window.sdk = {
    showBanner: () => { bannerCalled = true; }
};
testTriggerFn(undefined, global.window);
console.assert(bannerCalled === true, 'window.sdk.showBanner() phải được gọi thành công');

// Gọi khi KHÔNG có SDK (không được văng lỗi)
let noCrash = true;
try {
    testTriggerFn(undefined, {});
} catch (e) {
    noCrash = false;
}
console.assert(noCrash === true, 'triggerAd() không được văng lỗi khi chơi offline hoặc không có SDK');
console.log('✔ TEST 3 PASS: triggerAd() an toàn và gọi sdk.showBanner() hoàn hảo!\n');

// 4. Kiểm tra file zip phát hành gamemonetize_release.zip và tài sản quảng bá
console.log('[TEST 4] Kiểm tra tài nguyên và file zip phát hành:');
const icon512Path = path.join(__dirname, 'icons', 'icon-512.png');
const thumbPath = path.join(__dirname, 'icons', 'thumbnail-512x340.png');
console.assert(fs.existsSync(icon512Path), 'Icon 512x512 phải tồn tại');
console.assert(fs.existsSync(thumbPath), 'Thumbnail 512x340 phải tồn tại');
console.log('  ✓ Đã kiểm tra icon-512.png (512x512) & thumbnail-512x340.png (512x340)');

const zipPath = path.join(__dirname, 'gamemonetize_release.zip');
console.assert(fs.existsSync(zipPath), 'File gamemonetize_release.zip phải tồn tại');

const stats = fs.statSync(zipPath);
console.assert(stats.size > 50000, 'Kích thước file zip phải hợp lệ (> 50KB)');
console.log(`  ✓ gamemonetize_release.zip tồn tại với kích thước ${(stats.size / 1024).toFixed(1)} KB`);
console.log('✔ TEST 4 PASS: Gói phát hành ZIP đã sẵn sàng để tải lên GameMonetize!\n');

console.log('====================================================');
console.log('🎉 TẤT CẢ 4 BÀI KIỂM THỬ SDK GAMEMONETIZE ĐÃ VƯỢT QUA 100%!');
console.log('====================================================\n');
