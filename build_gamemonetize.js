/**
 * BUILD & PACKAGING SCRIPT FOR GAMEMONETIZE.COM
 * Automatically creates a clean release zip with index.html at root level,
 * validates gameId configuration, and runs SDK compliance verification.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('📦 TỰ ĐỘNG ĐÓNG GÓI BẢN PHÁT HÀNH CHO GAMEMONETIZE.COM');
console.log('====================================================\n');

const projectDir = __dirname;
const indexHtmlPath = path.join(projectDir, 'index.html');
const zipOutputPath = path.join(projectDir, 'gamemonetize_release.zip');

// 1. Kiểm tra mã Game ID
const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
const idMatch = indexContent.match(/gameId:\s*["']([^"']+)["']/);
const currentGameId = idMatch ? idMatch[1] : null;

if (!currentGameId || currentGameId === 'your_game_id_here') {
    console.warn('⚠️  CẢNH BÁO: gameId hiện tại vẫn đang là placeholder: "your_game_id_here"!');
    console.warn('👉 Hãy lấy Game ID thực tế từ GameMonetize Dashboard và điền vào dòng 20 trong file index.html.\n');
} else {
    console.log(`✅ Game ID đã cấu hình: [${currentGameId}]\n`);
}

// 2. Danh sách các file & thư mục cần đóng gói trực tiếp vào root của zip
const filesToInclude = [
    'index.html',
    'game.js',
    'characters.js',
    'i18n.js',
    'audio.js',
    'style.css',
    'manifest.json',
    'sw.js',
    'icons'
];

console.log('📁 Đang đóng gói các file vào thư mục gốc của file ZIP:');
filesToInclude.forEach(f => console.log('   - ' + f));

// 3. Sử dụng PowerShell nén file không hiển thị progress buffer
const psCommand = `
$ProgressPreference = 'SilentlyContinue'
Set-Location -Path '${projectDir}'
Compress-Archive -Path ${filesToInclude.join(', ')} -DestinationPath '${zipOutputPath}' -Force
`;

try {
    execSync(`powershell -ExecutionPolicy Bypass -Command "${psCommand.replace(/\n/g, '; ')}"`, { stdio: 'inherit' });
    console.log('\n✔ Đã tạo thành công: ' + zipOutputPath);
} catch (err) {
    console.error('❌ Lỗi nén file ZIP:', err.message);
    process.exit(1);
}

// 4. Kiểm tra cấu trúc file zip vừa tạo
console.log('\n🔍 Đang kiểm tra tính hợp lệ của file ZIP:');
const checkScript = `
$ProgressPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('${zipOutputPath}')
$hasIndex = $false
foreach ($e in $zip.Entries) {
    if ($e.FullName -eq 'index.html') { $hasIndex = $true }
}
$zip.Dispose()
if (-not $hasIndex) { exit 1 }
`;

try {
    execSync(`powershell -ExecutionPolicy Bypass -Command "${checkScript.replace(/\n/g, '; ')}"`);
    const stats = fs.statSync(zipOutputPath);
    console.log(`✔ Xác nhận: "index.html" nằm chuẩn xác tại gốc ZIP! Dung lượng: ${(stats.size / 1024).toFixed(1)} KB`);
} catch (e) {
    console.error('❌ LỖI: Không tìm thấy index.html ở thư mục gốc của file zip!');
    process.exit(1);
}

// 5. Chạy test suite kiểm tra SDK
console.log('\n🧪 Đang chạy kiểm thử tích hợp SDK:');
try {
    execSync('node test_gamemonetize_sdk.js', { stdio: 'inherit', cwd: projectDir });
} catch (e) {
    console.error('❌ Kiểm thử SDK thất bại!');
    process.exit(1);
}

console.log('====================================================');
console.log('🎉 ĐÓNG GÓI HOÀN TẤT! HÃY TẢI FILE SAU LÊN GAMEMONETIZE:');
console.log(`👉 ${zipOutputPath}`);
console.log('====================================================\n');
