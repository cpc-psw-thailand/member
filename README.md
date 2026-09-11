# CPC–PSW Thailand — ระบบสมาชิก

เว็บระบบสมัครและบริหารจัดการสมาชิก สำหรับชมรมนักสังคมสงเคราะห์และนักจิตวิทยา ป.วิ.อาญา

- **ฐานข้อมูล**: Google ชีต
- **Backend/API**: Google Apps Script (`apps-script/Code.gs`)
- **หน้าเว็บ**: HTML/CSS/JS ล้วน ๆ โฮสต์บน GitHub Pages

## หน้าเว็บทั้งหมด

| ไฟล์ | หน้าที่ |
|---|---|
| `index.html` | หน้าแรก แนะนำระบบและชมรม |
| `news.html` | ข่าวประชาสัมพันธ์ (รายการ + รายละเอียด) |
| `register.html` | แบบฟอร์มสมัครสมาชิก |
| `status.html` | ตรวจสอบสถานะการสมัคร/สมาชิกภาพ |
| `admin.html` | หน้าเจ้าหน้าที่: ตรวจสอบ อนุมัติ ระงับสมาชิก จัดการข่าวสาร |

## เริ่มต้นใช้งาน

ดูขั้นตอนละเอียดทั้งหมดใน **[SETUP.md](./SETUP.md)** — ต้องตั้งค่า Google ชีต + Apps Script ก่อน แล้วจึงใส่ URL ที่ได้ลงใน `config.js` ก่อนอัปโหลดขึ้น GitHub

## โครงสร้างโปรเจกต์

```
cpc-psw-web/                (ทุกไฟล์ต้องอยู่ที่ root ของ repo — ห้ามมีโฟลเดอร์ย่อยคั่น)
├── index.html
├── news.html
├── register.html
├── status.html
├── admin.html
├── style.css
├── config.js               ← ใส่ Apps Script URL ที่นี่
├── app.js
├── index.js
├── news.js
├── register.js
├── status.js
├── admin.js
├── thai-address-data.json  ← ข้อมูลจังหวัด/อำเภอ/ตำบล/รหัสไปรษณีย์ สำหรับฟอร์มที่อยู่
├── logo.png
├── apps-script/
│   └── Code.gs              ← วางในโปรเจกต์ Apps Script ของ Google ชีต (ไม่ต้องอัปขึ้นเว็บ)
├── SETUP.md
└── README.md
```
