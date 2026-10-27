# BU Lost & Found — Web

หน้าเว็บ React + TypeScript + Tailwind ที่ build เป็นไฟล์ static สำหรับวางบน Amazon S3 (+ CloudFront)

## รันในเครื่อง

```bash
cd web
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (vitest)
npm run build      # ได้โฟลเดอร์ dist/
```

ถ้าไม่ได้ตั้ง `VITE_API_BASE_URL` เว็บจะใช้ **ข้อมูลจำลอง** จาก `src/fixtures/` และเก็บสิ่งที่กรอกไว้ใน localStorage ของเบราว์เซอร์ (กด "รีเซ็ตข้อมูลตัวอย่าง" ที่ footer เพื่อล้าง)

บัญชีทดลองในโหมดจำลอง:

| อีเมล | รหัสผ่าน | role |
|---|---|---|
| `guard@bu.ac.th` | `guard1234` | รปภ. (เข้าหน้า `/admin` ได้) |
| `student@bumail.net` | `student1234` | นักศึกษา |

## เปลี่ยนไปใช้ API จริง

```bash
cp .env.example .env
# แก้ VITE_API_BASE_URL=https://xxxx.execute-api.ap-southeast-1.amazonaws.com/prod
npm run build
```

Endpoint ทั้งหมดอยู่ใน [`../docs/API_CONTRACT.md`](../docs/API_CONTRACT.md)

## อัปโหลดขึ้น S3

ใช้ HashRouter (`/#/items/...`) จึงไม่ต้องตั้ง redirect/error document พิเศษ และ asset ใช้ path แบบ relative (`base: "./"`)

```bash
aws s3 sync dist/ s3://<bucket-name>/ --delete
```

หรืออัปโหลดเนื้อหาในโฟลเดอร์ `dist/` ทั้งหมด (ไม่ใช่ตัวโฟลเดอร์) ผ่าน S3 Console แล้วเปิด Static website hosting โดยตั้ง index document = `index.html`

## โครงสร้าง

```
src/
  api/            contract.ts (type ที่ตกลงกับ backend), httpClient.ts (API จริง), mock/ (backend จำลอง)
  fixtures/       ข้อมูลจำลอง: สถานที่, ของที่เจอ, บัญชีทดลอง
  features/
    items/        หน้าแรก, รายละเอียด, dialog "นี่ของฉัน"
    report-found/ หน้าแจ้งเจอของ (อัปโหลดรูป + ย่อรูปก่อนส่ง)
    report-lost/  หน้าแจ้งของหาย + ของที่อาจตรงกัน
    admin/        หน้า รปภ.: ยืนยันคืนของ, ของค้างนาน
    auth/         login, session, route guard
    catalog/      หมวดหมู่, สถานที่, รูปแบบวันที่ภาษาไทย
  design-system/  ปุ่ม, ฟอร์ม, การ์ด, dialog
  layout/         header, mobile tab bar, footer
```
