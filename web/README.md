# BU Lost & Found — Web

หน้าเว็บ React + TypeScript + Tailwind ที่ build เป็นไฟล์ static สำหรับวางบน Amazon S3 static website hosting (Learner Lab ไม่ให้ใช้ CloudFront)

## รันในเครื่อง

```bash
cd web
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (vitest)
npm run build      # ได้โฟลเดอร์ dist/
```

## สลับข้อมูลจำลอง ↔ API จริง

ทุกหน้าดึงข้อมูลผ่านไฟล์เดียวคือ [`src/api/client.ts`](src/api/client.ts) ซึ่งมีค่า 2 ตัว:

| ค่า | ตั้งที่ | ความหมาย |
|---|---|---|
| `USE_MOCK` | `VITE_USE_MOCK` | `true` = ใช้ข้อมูลจำลองจาก [`src/fixtures/mockData.ts`](src/fixtures/mockData.ts) (ไฟล์เดียว), `false` = เรียก API จริง |
| `API_BASE` | `VITE_API_BASE` | ค่าเริ่มต้น `/api` · ตอน deploy จริงใส่ `http://<ALB DNS>/api` ใน `.env.aws` (build จะไม่ผ่านถ้ายังเป็นค่า `REPLACE-WITH-ALB-DNS`) |
| `LINE_OA_URL` | `VITE_LINE_OA_URL` | ลิงก์เพิ่มเพื่อน LINE OA (เช่น `https://lin.ee/...`) — ว่างไว้ = ไม่แสดงการ์ด LINE ในหน้ายืนยันแจ้งของหาย |

| คำสั่ง | อ่านค่าจาก | ใช้ทำอะไร |
|---|---|---|
| `npm run build` | `.env` (mock) | Vercel, เดโมให้ รปภ. ดู |
| `npm run build:aws` | `.env.aws` (API จริง) | ส่งขึ้น S3 static website วัน demo — **ไม่มี mock data และกล่องบัญชีทดลองติดไปใน bundle** |

ในโหมดจำลอง สิ่งที่กรอกจะเก็บใน localStorage ของเบราว์เซอร์ (กด "รีเซ็ตข้อมูลตัวอย่าง" ที่ footer เพื่อล้าง)

บัญชีทดลองในโหมดจำลอง:

| อีเมล | รหัสผ่าน | role |
|---|---|---|
| `guard@bu.ac.th` | `guard1234` | รปภ. (เข้าหน้า `/admin` ได้) |
| `student@bumail.net` | `student1234` | นักศึกษา |

Endpoint ทั้งหมดอยู่ใน [`../docs/API_CONTRACT.md`](../docs/API_CONTRACT.md)

## อัปโหลดขึ้น S3 (วัน demo)

ใช้ HashRouter (`/#/items/...`) จึงไม่ต้องตั้ง redirect/error document พิเศษ และ asset ใช้ path แบบ relative (`base: "./"`)

```bash
# 1) แก้ VITE_API_BASE ใน .env.aws เป็น http://<ALB DNS>/api
# 2) backend ต้องเปิด CORS ให้ http://<bucket-name>.s3-website-us-east-1.amazonaws.com (ดู docs/API_CONTRACT.md ข้อ 0 และ 4)
npm run build:aws
aws s3 sync dist/ s3://<bucket-name>/ --delete
# เปิดเว็บที่ http://<bucket-name>.s3-website-us-east-1.amazonaws.com (เป็น HTTP ไม่ใช่ HTTPS)
```

หรืออัปโหลดเนื้อหาในโฟลเดอร์ `dist/` ทั้งหมด (ไม่ใช่ตัวโฟลเดอร์) ผ่าน S3 Console แล้วเปิด Static website hosting โดยตั้ง index document = `index.html` · ต้องปิด Block Public Access ของ bucket และใส่ bucket policy ให้ `s3:GetObject` แบบสาธารณะ

ต้องเปิดผ่าน **website endpoint** (`…s3-website-…amazonaws.com`, HTTP) ไม่ใช่ลิงก์ object (`…s3.amazonaws.com`, HTTPS) — หน้า HTTPS เรียก ALB ที่เป็น HTTP ไม่ได้ (mixed content)

## โครงสร้าง

```
src/
  api/            client.ts (USE_MOCK / API_BASE), contract.ts (type ที่ตกลงกับ backend),
                  httpClient.ts (API จริง), mock/ (backend จำลองที่ทำตาม contract)
  fixtures/       mockData.ts — ข้อมูลจำลองทั้งหมด: สถานที่, ของที่เจอ, บัญชีทดลอง
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
