# أبو الزهراء - VoIP App
## دليل تحميل وبناء التطبيق

---

## 📱 طرق تثبيت التطبيق

### الطريقة 1: كتطبيق PWA (أسهل - بدون حاسوب)
1. افتح رابط التطبيق في متصفح **Chrome** على هاتفك
2. ستظهر لك رسالة **"تثبيت التطبيق على جهازك"** في شاشة البداية
3. اضغط على الزر وسيتم تثبيته كتطبيق حقيقي على هاتفك
4. سيظهر التطبيق مع أيقونته في شاشة التطبيقات الرئيسية

> **ملاحظة**: على iPhone: افتح في Safari → اضغط على زر المشاركة → "إضافة إلى الشاشة الرئيسية"

---

### الطريقة 2: بناء تطبيق Android (.apk) باستخدام Capacitor

#### المتطلبات:
- Node.js 18 أو أحدث
- Android Studio (مع SDK 34)
- Java JDK 17

#### الخطوات:
```bash
# 1. استنساخ المشروع وفتحه
cd abuzahra-app

# 2. تثبيت المكتبات
npm install

# 3. بناء المشروع
npm run build

# 4. إضافة منصة Android
npx cap add android

# 5. نسخ الملفات إلى مشروع Android
npx cap sync android

# 6. فتح في Android Studio
npx cap open android
```

#### في Android Studio:
1. انتظر حتى تكتمل عملية Gradle Sync
2. اختر **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. ستجد ملف APK في: `android/app/build/outputs/apk/debug/app-debug.apk`

---

### الطريقة 3: بناء تطبيق iOS (.ipa)

#### المتطلبات:
- macOS
- Xcode 15 أو أحدث
- CocoaPods

#### الخطوات:
```bash
# 1. تثبيت المكتبات
npm install

# 2. بناء المشروع
npm run build

# 3. إضافة منصة iOS
npx cap add ios

# 4. نسخ الملفات
npx cap sync ios

# 5. فتح في Xcode
npx cap open ios
```

#### في Xcode:
1. اختر فريق التطوير في **Signing & Capabilities**
2. اختر **Product → Archive**
3. ثم **Distribute App** لبناء ملف IPA

---

### الطريقة 4: بناء عبر JeebHub

1. ارفع مجلد المشروع كاملاً إلى منصة JeebHub
2. ملف `jeebhub.json` يحتوي على جميع إعدادات البناء
3. اختر المنصة المستهدفة (Android / iOS / كلاهما)
4. اضغط "بناء" وانتظر النتيجة

---

## 🔧 إعدادات Twilio (للمكالمات الحقيقية)

لتفعيل مكالمات VoIP الحقيقية، أضف هذه المتغيرات في ملف `.env`:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret
TWILIO_TWIML_APP_SID=your_twiml_app_sid
TWILIO_PHONE_NUMBER=+1234567890
```

> **ملاحظة**: بدون هذه الإعدادات، التطبيق يعمل بشكل كامل (الرسائل، جهات الاتصال، الرصيد) لكن المكالمات ستكون محاكاة فقط.

---

## 📁 هيكل الملفات المهمة

```
abuzahra-app/
├── public/
│   ├── sw.js                    # Service Worker (PWA)
│   ├── manifest.json            # PWA Manifest
│   └── icons/                   # أيقونات التطبيق
│       ├── icon-72x72.png
│       ├── icon-96x96.png
│       ├── icon-128x128.png
│       ├── icon-144x144.png
│       ├── icon-152x152.png
│       ├── icon-192x192.png
│       ├── icon-384x384.png
│       ├── icon-512x512.png
│       ├── icon-maskable-192x192.png
│       ├── icon-maskable-512x512.png
│       └── apple-touch-icon.png
├── src/
│   ├── app/
│   │   ├── page.tsx             # الصفحة الرئيسية
│   │   ├── layout.tsx           # التخطيط الرئيسي
│   │   └── api/                 # واجهات API
│   └── ...
├── capacitor.config.ts          # إعدادات Capacitor
├── jeebhub.json                 # إعدادات JeebHub
├── prisma/
│   └── schema.prisma            # قاعدة البيانات
└── package.json
```

---

## ⚡ ميزات التطبيق

- ✅ تطبيق هجين (PWA + Native)
- ✅ دعم Android و iOS
- ✅ واجهة عربية RTL كاملة
- ✅ تسجيل دخول وتسجيل حساب
- ✅ لوحة اتصال كاملة
- ✅ جهات اتصال ومفضلة
- ✅ رسائل SMS
- ✅ سجل مكالمات
- ✅ شحن رصيد وتحويل
- ✅ كامل بدون اتصال (Offline)
- ✅ إشعارات Push
- ✅ أيقونة تطبيق مخصصة
