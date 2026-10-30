# HƯỚNG DẪN CÀI ĐẶT & BUILD PHIÊN BẢN ANDROID & IOS
## Breakers Combine!: WEGO 20x7 Tactical Grid Game

Dự án đã được tích hợp đầy đủ công nghệ **PWA (Progressive Web App)** và **Capacitor Mobile SDK** để chạy hoàn hảo trên cả **Android** và **iOS**.

---

## CÁCH 1: Cài đặt và Chơi trực tiếp dưới dạng App (PWA) - Không cần qua App Store
*Phương thức này hoạt động ngay lập tức trên mọi điện thoại Android và iPhone/iPad mà không cần cài đặt phần mềm lập trình nào.*

### 📱 Trên iOS (iPhone / iPad - Safari):
1. Mở trang web game bằng trình duyệt **Safari**.
2. Nhấn vào biểu tượng **Chia sẻ (Share)** ở thanh công cụ dưới đáy màn hình (hình ô vuông có mũi tên chỉ lên).
3. Cuộn xuống và chọn **"Thêm vào MH chính" (Add to Home Screen)**.
4. Đặt tên app (mặc định: `Breakers Combine!`) và nhấn **Thêm (Add)**.
5. Biểu tượng game sẽ xuất hiện trên màn hình chính như một app Native:
   * Chạy toàn màn hình (Standalone, không còn thanh địa chỉ Safari).
   * Tương thích tai thỏ / Dynamic Island (Safe-area cover).
   * **Chơi được Offline 100% không cần kết nối mạng** nhờ Service Worker (`sw.js`).

### 🤖 Trên Android (Chrome / Samsung Internet):
1. Mở trang web game trên trình duyệt **Chrome**.
2. Nhấn vào biểu tượng **3 chấm (Menu)** ở góc trên bên phải.
3. Chọn **"Cài đặt ứng dụng" (Install app)** hoặc **"Thêm vào Màn hình chính" (Add to Home Screen)**.
4. Xác nhận cài đặt. Game sẽ được cài như một ứng dụng Android độc lập với icon logo riêng và chơi offline mượt mà.

---

## CÁCH 2: Xuất bản thành Native App (File .APK cho Android & Project Xcode cho iOS)
*Dành cho lập trình viên muốn build file APK cài đặt thủ công hoặc đăng lên Google Play Store & Apple App Store.*

Dự án đã có sẵn cấu hình `package.json` và `capacitor.config.json`.

### 1. Cài đặt Capacitor CLI (chạy 1 lần):
```bash
npm install
```

### 2. Tạo Project Native cho Android:
```bash
# Thêm nền tảng Android
npx cap add android

# Đồng bộ tài nguyên web vào Android
npx cap sync android

# Mở project trong Android Studio để build file APK / AAB
npx cap open android
```
> *Trong Android Studio: Chọn **Build > Build Bundle(s) / APK(s) > Build APK(s)** để xuất file `.apk` cài lên điện thoại Android.*

### 3. Tạo Project Native cho iOS (Yêu cầu máy tính macOS & Xcode):
```bash
# Thêm nền tảng iOS
npx cap add ios

# Đồng bộ tài nguyên web vào iOS
npx cap sync ios

# Mở project trong Xcode
npx cap open ios
```
> *Trong Xcode: Cắm iPhone hoặc chọn máy ảo iOS Simulator, bấm nút **Play (Run)** để chạy game trực tiếp.*

---

## CÁC TÍNH NĂNG TỐI ƯU DI ĐỘNG ĐÃ TÍCH HỢP TRONG GAME:
1. **Virtual D-Pad 3x3**: 8 nút hướng tự động co giãn thành cụm phím điều hướng 3x3 hình chữ nhật dễ bấm với ngón cái trên màn hình cảm ứng.
2. **Touch Pan / Vuốt Canvas**: Người chơi có thể vuốt ngón tay trên màn hình để di chuyển góc nhìn (Camera Pan) toàn cảnh 20x7.
3. **Minimap Tap**: Chạm vào bất kỳ vị trí nào trên bản đồ nhỏ (Minimap) để camera lập tức nhảy đến khu vực đó.
4. **Cảnh báo Xoay màn hình (Rotate Screen Notice)**: Khi cầm dọc điện thoại, màn hình sẽ hiển thị hoạt ảnh điện thoại xoay ngang thân thiện, tự động ẩn khi xoay ngang máy.
5. **Tự động mở khóa Âm thanh (Web Audio Unlock)**: Chạm lần đầu tiên trên màn hình sẽ kích hoạt hệ thống âm thanh tổng hợp mà không bị Safari/Chrome chặn.
6. **Safe-Area Inset**: Bảo đảm giao diện không bị che khuất bởi tai thỏ, viền cong hoặc Dynamic Island của iPhone.
