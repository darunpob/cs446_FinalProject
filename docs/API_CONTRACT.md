# BU Lost & Found — API Contract (v2)

ข้อตกลงระหว่างหน้าเว็บ (`web/`) กับ backend
Type ฝั่งหน้าเว็บอยู่ที่ [`web/src/api/contract.ts`](../web/src/api/contract.ts) — **ถ้าแก้เอกสารนี้ต้องแก้ไฟล์นั้นด้วย**

> ⚠️ **กฎข้อเดียวที่ห้ามพลาด:** `verificationAnswer` (คำตอบที่ถูกของคำถามยืนยัน) เก็บไว้ในฐานข้อมูลเท่านั้น
> **ห้ามส่งกลับไปในทุก response** ไม่ว่า endpoint ไหน — backend เป็นคนตรวจคำตอบที่ `POST /api/items/{id}/claims` เอง

## 0. Backend แบบไหนก็ได้ — path เหมือนกัน

หน้าเว็บสนใจแค่ path และรูปแบบ JSON ในเอกสารนี้ ทีมเลือก backend แบบใดแบบหนึ่ง (**ยังต้องตกลงกัน**):

| | A. Serverless | B. EC2 |
|---|---|---|
| Compute | API Gateway (HTTP API) + Lambda | ALB + EC2 Auto Scaling group |
| ฐานข้อมูล | DynamoDB | RDS (MySQL / PostgreSQL) |
| CloudFront ส่ง `/api/*` ไปที่ | API Gateway | ALB |
| ข้อดี | ไม่ต้องคอยเปิด/ปิดเครื่องใน Learner Lab | ตรงกับ service ที่อาจารย์ไฮไลต์ |

ส่วนที่ใช้ร่วมกันทั้งสองแบบ: S3 (รูป + หน้าเว็บ), CloudFront, Amazon Rekognition, การแจ้งเตือนทางอีเมล (ข้อ 2)

**Region: `us-east-1`** (AWS Academy Learner Lab ใช้ได้แค่ `us-east-1` และ `us-west-2`)

## 1. สรุป endpoint

| Method | Path | ใช้ที่หน้า | Auth |
|---|---|---|---|
| GET | `/api/locations` | ทุกฟอร์ม (dropdown จุดที่เจอ / จุดรับฝาก) | – |
| GET | `/api/stats` | หน้าแรก (3 กล่องตัวเลข), หน้า รปภ. | – |
| GET | `/api/items?q=&category=&location=&status=` | หน้าแรก | – |
| GET | `/api/items/{id}` | หน้ารายละเอียด | – |
| POST | `/api/uploads` | แจ้งเจอของ (ขอ presigned URL รูป) | – |
| POST | `/api/items` | แจ้งเจอของ | – |
| POST | `/api/lost-reports` | แจ้งของหาย | – |
| POST | `/api/items/{id}/claims` | ปุ่ม "นี่ของฉัน" | – |
| GET | `/api/admin/claims?status=verified` | หน้า รปภ. แท็บ "รอส่งคืน" | 🔒 guard |
| POST | `/api/admin/claims/{claimId}/return` | หน้า รปภ. ปุ่ม "ยืนยันคืนแล้ว" | 🔒 guard |
| GET | `/api/admin/items/stale?days=30` | หน้า รปภ. แท็บ "ของค้างนาน" | 🔒 guard |
| POST | `/api/auth/login` | หน้าเข้าสู่ระบบ | – |
| POST | `/api/line/webhook` | LINE Platform เรียก (ไม่ใช่หน้าเว็บ) — ไม่บังคับ ดูข้อ 2 | ลายเซ็น LINE |

## 2. การแจ้งเตือน

**อีเมลเป็นช่องทางหลัก** (ฟอร์มแจ้งของหายบังคับกรอกอีเมลแล้ว)
- **SNS:** สร้าง topic เดียว แล้ว subscribe อีเมลผู้แจ้งด้วย filter policy `{"reportId": ["lst-xxxx"]}` ตอน publish ใส่ message attribute `reportId` · ผู้แจ้งต้องกดลิงก์ยืนยันในอีเมลครั้งแรกก่อนถึงจะได้รับ
- **SES:** ส่งตรงได้ แต่ในโหมด sandbox ส่งได้เฉพาะอีเมลที่ verify แล้ว (ใช้ได้ตอน demo ถ้า verify อีเมลของกลุ่มไว้ก่อน)

**LINE เป็นช่องทางเสริม — ใช้ LINE ID ที่ผู้ใช้พิมพ์ส่งข้อความไม่ได้**
LINE Messaging API ส่ง push ได้เฉพาะ `userId` (ขึ้นต้นด้วย `U…`) ของคนที่แอด LINE OA เป็นเพื่อนแล้วเท่านั้น จึงใช้ขั้นตอนนี้:
1. หน้ายืนยันการแจ้งของหายแสดงปุ่มหรือ QR "เพิ่มเพื่อน LINE" (ตั้ง `VITE_LINE_OA_URL` ใน `web/.env*`)
2. ผู้ใช้แอดเพื่อนแล้วพิมพ์รหัสแจ้ง เช่น `lst-8f2a` ในแชท
3. LINE เรียก `POST /api/line/webhook` → backend ตรวจ header `x-line-signature` → ผูก `event.source.userId` กับ lost report นั้น
4. เมื่อมีของที่ตรงกัน ส่ง push ไปที่ `userId` นั้นเพิ่มจากอีเมล

`contact.lineId` และ `contact.phone` ในฟอร์มมีไว้ให้ รปภ. ติดต่อกลับด้วยมือเท่านั้น

## 3. AI: Amazon Rekognition

ทำหลังรับ `POST /api/items` ที่มี `imageKey` (sync ใน handler หรือ async ผ่าน S3 event ก็ได้):
1. **`DetectLabels`** กับรูปใน S3 → เก็บชื่อ label ภาษาอังกฤษ 5 อันดับแรก (confidence ≥ 80) ลง `aiLabels` · หน้าเว็บแสดงเป็นชิป "แท็กจาก AI" และ `q` ค้นใน `aiLabels` ด้วย
2. **ถ้าเป็นบัตร** (`category = "card"` หรือ labels มี `ID Cards` / `Document`) → **`DetectText`** → หาเลข 10 หลักด้วย `/\b\d{10}\b/`
3. เอาเลขที่ได้ไปหา lost report ที่ `studentId` ตรงกันและยังไม่ปิด → ส่งอีเมล (และ LINE ถ้าผูกไว้) หาเจ้าของทันที: "มีคนเจอบัตรของคุณ ฝากไว้ที่ …"
4. **ห้าม**เก็บเลขที่อ่านได้ลงฟิลด์สาธารณะ (`title`, `description`, `aiLabels`) และห้ามส่งออกใน response — ใช้จับคู่ภายใน backend เท่านั้น

ถ้า Rekognition ยังวิเคราะห์ไม่เสร็จ ให้ตอบ `aiLabels: []` ไปก่อน หน้าเว็บรองรับแล้ว

## 4. หลักทั่วไป

| เรื่อง | ข้อตกลง |
|---|---|
| Base path | ทุก endpoint ขึ้นต้นด้วย `/api` · ถ้า CloudFront ไม่ได้ส่ง `/api/*` ไป backend ให้ใส่ URL เต็มใน `web/.env.aws` เช่น `https://abc123.execute-api.us-east-1.amazonaws.com/prod/api` หรือ `https://<alb-dns>.us-east-1.elb.amazonaws.com/api` |
| Format | JSON ทั้ง request/response, `Content-Type: application/json` |
| เวลา | ISO 8601 UTC เช่น `2026-10-27T03:15:00.000Z` |
| ID | string มี prefix: `itm-` (ของที่เจอ), `lst-` (แจ้งหาย), `clm-` (คำขอรับคืน) |
| Auth | `Authorization: Bearer <token>` — จำเป็นเฉพาะ `/api/admin/*` และต้องเป็น role `guard` |
| CORS | อนุญาต origin ของ CloudFront และ `https://cs446finalproject.vercel.app`, methods `GET, POST, OPTIONS`, headers `Authorization, Content-Type` |
| Error | HTTP status ตามตาราง + body `{ "error": { "code": "NOT_FOUND", "message": "ข้อความที่แสดงให้ผู้ใช้ได้" } }` — หน้าเว็บแสดง `message` ตรง ๆ |

| Status | code | ใช้เมื่อ |
|---|---|---|
| 400 | `VALIDATION` | ข้อมูลไม่ครบ / ผิดรูปแบบ |
| 401 | `UNAUTHORIZED` | ไม่มี token / token หมดอายุ / login ผิด |
| 403 | `FORBIDDEN` | ไม่ใช่ `guard` แต่เรียก `/api/admin/*` |
| 404 | `NOT_FOUND` | ไม่พบ id |
| 409 | `CONFLICT` | ของถูกเคลมไปแล้ว / คืนไปแล้ว |
| 429 | `TOO_MANY_ATTEMPTS` | ตอบคำถามยืนยันผิดเกินกำหนด (ดู claims) |

## 5. Data shapes

```ts
type CategoryId = "electronics" | "wallet" | "card" | "keys" | "bag" | "bottle" | "clothing" | "other";
type FoundItemStatus = "available" | "claimed" | "returned";

interface FoundItem {            // ไม่มี verificationAnswer — ดูกฎด้านบน
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  foundLocationId: string;       // อ้างอิง id จาก GET /api/locations
  dropOffPointId: string;
  foundAt: string;
  reportedAt: string;
  imageUrl: string | null;       // URL รูปผ่าน CloudFront/S3
  status: FoundItemStatus;
  verificationQuestion: string;
  aiLabels: string[];            // Rekognition DetectLabels, อังกฤษ, ไม่เกิน 5 · [] ถ้ายังไม่มี
}

interface Claim {
  id: string;
  itemId: string;
  itemTitle: string;
  itemCategory: CategoryId;
  claimantName: string;
  studentId: string;
  contact: string;
  dropOffPointId: string;
  pickupCode: string;            // 6 ตัว จาก A-Z และ 2-9 (ไม่มี I, O, 0, 1)
  status: "verified" | "returned";
  createdAt: string;
  returnedAt: string | null;
}
```

## 6. รายละเอียด endpoint

### `GET /api/locations`
จุดที่เจอ + จุดรับฝาก (เก็บเป็น JSON ใน S3 หรือตารางในฐานข้อมูลก็ได้)
```json
{
  "foundLocations": [{ "id": "loc-library", "name": "ห้องสมุด", "zone": "โซนกลาง" }],
  "dropOffPoints":  [{ "id": "drop-gate1", "name": "ป้อม รปภ. ประตู 1", "hours": "เปิด 24 ชั่วโมง", "phone": "02-000-0001" }]
}
```

### `GET /api/stats`
```json
{ "waiting": 10, "awaitingPickup": 1, "returnedThisMonth": 4 }
```
`waiting` = ของสถานะ `available` · `awaitingPickup` = claim สถานะ `verified` · `returnedThisMonth` = ของที่คืนในเดือนปัจจุบัน

### `GET /api/items?q=&category=&location=&status=`
ทุก param ไม่บังคับ
- `q` ค้นใน title, description, ชื่อสถานที่ และ `aiLabels` (ไม่สนตัวพิมพ์เล็ก/ใหญ่, ทุกคำต้องเจอ)
- `category` = `CategoryId` · `location` = id ของจุดที่เจอ · `status` = `available` | `claimed` | `returned`
- เรียงจาก `foundAt` ใหม่สุด
```json
{ "items": [FoundItem, ...] }
```

### `GET /api/items/{id}` → `FoundItem` · 404 ถ้าไม่พบ

### `POST /api/uploads` — ขอลิงก์อัปโหลดรูปตรงเข้า S3
```json
// request
{ "contentType": "image/jpeg" }
// response
{
  "uploadUrl": "https://<bucket>.s3.us-east-1.amazonaws.com/uploads/abc.jpg?X-Amz-Signature=...",
  "imageKey": "uploads/2026/10/abc.jpg",
  "imageUrl": "https://dxxxx.cloudfront.net/uploads/2026/10/abc.jpg"
}
```
1. หน้าเว็บย่อรูปให้ด้านยาวสุดไม่เกิน 1280px (JPEG) ก่อน
2. หน้าเว็บ `PUT` ไฟล์ไปที่ `uploadUrl` พร้อม header `Content-Type` ตรงกับที่ขอ
3. หน้าเว็บส่ง `imageKey` ไปใน `POST /api/items`

bucket ต้องตั้ง CORS ให้ `PUT` จาก origin ของเว็บได้ · presigned URL อายุ 5 นาทีก็พอ

### `POST /api/items` — แจ้งเจอของ → `201 FoundItem`
```json
{
  "title": "iPhone 15 เคสสีม่วงใส",
  "description": "เจอบนโต๊ะแถวหลัง",
  "category": "electronics",
  "foundLocationId": "loc-library",
  "dropOffPointId": "drop-library",
  "foundAt": "2026-10-27T03:00:00.000Z",
  "imageKey": "uploads/2026/10/abc.jpg",
  "verificationQuestion": "รูปพื้นหลังหน้าจอล็อกเป็นรูปอะไร",
  "verificationAnswer": "แมว"
}
```
- `imageKey` เป็น `null` ได้ (ไม่มีรูป)
- backend ตั้ง `status = "available"`, `reportedAt = now`, `aiLabels` ตามข้อ 3
- response คือ `FoundItem` **ที่ไม่มี** `verificationAnswer`
- หลังบันทึก: หา lost report ที่ตรงกัน (กติกาจับคู่ด้านล่าง + บัตรนักศึกษาจากข้อ 3) แล้วแจ้งเตือนตามข้อ 2

### `POST /api/lost-reports` — แจ้งของหาย → `201`
```json
// request
{
  "title": "บัตรนักศึกษา",
  "description": "อยู่ในซองใสสีฟ้า",
  "category": "card",
  "lastSeenLocationId": "loc-canteen",
  "lostAt": "2026-10-26T05:00:00.000Z",
  "studentId": "1650707093",
  "contact": { "name": "ธนพล", "email": "thanaphon.j@bumail.net", "lineId": "thanaphon.j", "phone": "" }
}
// response
{ "id": "lst-8f2a", "createdAt": "2026-10-27T03:20:00.000Z", "possibleMatches": [FoundItem, ...] }
```
- **`contact.email` บังคับ** (ช่องทางแจ้งเตือน) · `lineId`, `phone` ไม่บังคับ ส่งมาเป็น `""` ถ้าไม่กรอก
- `studentId` ไม่บังคับ (`""` ได้) — หน้าเว็บให้กรอกเฉพาะหมวด `card` / `wallet` · ถ้ามีต้องเป็นเลข 10 หลัก
- `possibleMatches` = ของสถานะ `available` ที่ตรงที่สุด ไม่เกิน 3 ชิ้น
- **กติกาจับคู่** (เหมือนใน mock): หมวดตรง +2, สถานที่ตรง +1, คำในชื่อซ้ำกัน +1 ต่อคำ → ได้ ≥ 2 คะแนนถือว่าตรง เรียงคะแนนมากไปน้อย
- ถ้าใช้ SNS: subscribe อีเมลตอนนี้เลย (ข้อ 2)

### `POST /api/items/{id}/claims` — ปุ่ม "นี่ของฉัน" → `200`
```json
// request
{ "answer": "Honda", "claimantName": "ธนพล ใจดี", "studentId": "1650707093", "contact": "LINE: thanaphon.j" }

// response — ตอบถูก
{ "status": "verified", "claimId": "clm-91c", "pickupCode": "K7Q2MX", "dropOffPointId": "drop-gate2" }

// response — ตอบผิด (ยัง 200 ไม่ใช่ error)
{ "status": "rejected", "attemptsLeft": 2 }
```
วิธีตรวจคำตอบ (ทำใน backend เท่านั้น):
1. normalize ทั้งสองฝั่ง: NFC → lowercase → ลบช่องว่างทั้งหมด
2. ถูกถ้า **เท่ากันพอดี** หรือ **คำตอบมีคำที่ถูกอยู่ข้างใน** และยาวไม่เกิน `2 × ความยาวคำตอบจริง + 4` (กันการพิมพ์ทุกคำที่เดาไว้รวมกันครั้งเดียว)
3. **จำกัด 2 ชั้น** ผิดเกินชั้นใดชั้นหนึ่ง → ตอบ `429`
   - 3 ครั้งต่อคู่ (`itemId`, `studentId`)
   - **6 ครั้งต่อของ 1 ชิ้น รวมทุกรหัสนักศึกษา** (กันการเปลี่ยนรหัสไปเรื่อย ๆ เพื่อเดาต่อ)
   - `attemptsLeft` = ค่าที่น้อยกว่าระหว่างสองชั้น

เงื่อนไขอื่น: ของไม่ใช่ `available` → `409` · ตอบถูก → ของเปลี่ยนเป็น `claimed` และสร้าง Claim · รหัสรับของแสดงบนหน้าจอ (หน้าเว็บบอกให้แคปหน้าจอเก็บไว้) — ไม่ต้องส่งทาง LINE

### `GET /api/admin/claims?status=verified` 🔒
```json
{ "claims": [Claim, ...] }
```

### `POST /api/admin/claims/{claimId}/return` 🔒 → `200 Claim`
ตั้ง claim เป็น `returned` + `returnedAt = now`, ตั้งของเป็น `returned` · `409` ถ้าคืนไปแล้ว

### `GET /api/admin/items/stale?days=30` 🔒
ของ `available` ที่ `foundAt` เก่ากว่า `days` วัน เรียงจากค้างนานสุด
```json
{ "items": [{ "id": "itm-1012", "title": "...", "daysWaiting": 57, "...": "ฟิลด์อื่นเหมือน FoundItem" }] }
```

### `POST /api/auth/login`
```json
// request
{ "email": "guard@bu.ac.th", "password": "..." }
// response
{ "accessToken": "eyJ...", "user": { "email": "guard@bu.ac.th", "displayName": "เจ้าหน้าที่ รปภ. ประตู 1", "role": "guard" } }
```
ถ้าจะใช้ Cognito Hosted UI แทน endpoint นี้ ให้คุยกับฝั่งหน้าเว็บก่อน เพราะต้องเปลี่ยนเป็น redirect flow

## 7. ทดสอบกับหน้าเว็บ

```bash
cd web
# แก้ VITE_API_BASE / VITE_LINE_OA_URL ใน .env.aws ถ้าจำเป็น
npm run build:aws   # ได้ dist/ ที่เรียก API จริง ไม่มี mock data / บัญชีทดลอง
```
ระหว่างพัฒนา หน้าเว็บใช้ mock ที่ทำตามเอกสารนี้ (ยกเว้นการส่งอีเมล/LINE และ Rekognition ที่จำลองด้วย label ตามหมวด) ดูพฤติกรรมอ้างอิงได้ที่ `web/src/api/mock/mockClient.ts`
