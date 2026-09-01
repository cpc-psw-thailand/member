# CPC–PSW Thailand — ระบบสมาชิก

เว็บระบบสมัครและบริหารจัดการสมาชิก สำหรับชมรมนักสังคมสงเคราะห์และนักจิตวิทยา ป.วิ.อาญา

- **ฐานข้อมูล**: Google ชีต
- **Backend/API**: Google Apps Script (`apps-script/Code.gs`)
- **หน้าเว็บ**: HTML/CSS/JS ล้วน ๆ โฮสต์บน GitHub Pages

## หน้าเว็บทั้งหมด

| ไฟล์ | หน้าที่ |
|---|---|
| `index.html` | หน้าแรก แนะนำระบบและชมรม |
| `register.html` | แบบฟอร์มสมัครสมาชิก |
| `status.html` | ตรวจสอบสถานะการสมัคร/สมาชิกภาพ |
| `admin.html` | หน้าเจ้าหน้าที่: ตรวจสอบ อนุมัติ ระงับสมาชิก |

## เริ่มต้นใช้งาน

ดูขั้นตอนละเอียดทั้งหมดใน **[SETUP.md](./SETUP.md)** — ต้องตั้งค่า Google ชีต + Apps Script ก่อน แล้วจึงใส่ URL ที่ได้ลงใน `assets/js/config.js` ก่อนอัปโหลดขึ้น GitHub

## โครงสร้างโปรเจกต์

```
cpc-psw-web/
├── index.html
├── register.html
├── status.html
├── admin.html
├── assets/
│   ├── css/style.css
│   ├── js/config.js      ← ใส่ Apps Script URL ที่นี่
│   ├── js/app.js
│   ├── js/register.js
│   ├── js/status.js
│   ├── js/admin.js
│   └── img/logo.png
├── apps-script/
│   └── Code.gs            ← วางในโปรเจกต์ Apps Script ของ Google ชีต
├── SETUP.md
└── README.md
```
