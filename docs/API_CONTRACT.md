# BU Lost & Found — API Contract (v1)

ข้อตกลงระหว่างหน้าเว็บ (`web/`) กับ backend (API Gateway + Lambda)
Type ฝั่งหน้าเว็บอยู่ที่ [`web/src/api/contract.ts`](../web/src/api/contract.ts) — **ถ้าแก้ตรงนี้ต้องแก้ไฟล์นั้นด้วย**

## หลักทั่วไป

| เรื่อง | ข้อตกลง |
|---|---|
| Base URL | API Gateway invoke URL เช่น `https://abc123.execute-api.ap-southeast-1.amazonaws.com/prod` (หน้าเว็บอ่านจาก `VITE_API_BASE_URL`) |
| Format | JSON ทั้ง request/response, `Content-Type: application/json` |
| เวลา | ISO 8601 UTC เช่น `2026-10-27T03:15:00.000Z` |
| ID | string มี prefix: `itm-` (ของที่เจอ), `lst-` (แจ้งหาย), `clm-` (คำขอรับคืน) |
| Auth | `Authorization: Bearer <token>` (Cognito ID token) — จำเป็นเฉพาะ `/admin/*` |
| CORS | ต้องอนุญาต origin ของเว็บ S3/CloudFront, methods `GET, POST, OPTIONS`, header `Authorization, Content-Type` |
| Error | HTTP status ตามตารางด้านล่าง + body `{ "error": { "code": "NOT_FOUND", "message": "ข้อความภาษาไทยที่แสดงให้ผู้ใช้ได้" } }` |

| Status | code | ใช้เมื่อ |
|---|---|---|
| 400 | `VALIDATION` | ข้อมูลไม่ครบ/ผิดรูปแบบ |
| 401 | `UNAUTHORIZED` | ไม่มี token / token หมดอายุ / login ผิด |
| 403 | `FORBIDDEN` | ไม่ใช่ role `guard` แต่เรียก `/admin/*` |
| 404 | `NOT_FOUND` | ไม่พบ id |
| 409 | `CONFLICT` | ของถูก claim ไปแล้ว / คืนไปแล้ว |
| 429 | `TOO_MANY_ATTEMPTS` | ตอบคำถามยืนยันผิดครบ 3 ครั้ง |

## Data shapes

```ts
type CategoryId = "electronics" | "wallet" | "card" | "keys" | "bag" | "bottle" | "clothing" | "other";
type FoundItemStatus = "available" | "claimed" | "returned";

interface FoundItem {            // ห้ามส่ง verificationAnswer ออกไปเด็ดขาด
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  foundLocationId: string;       // อ้างอิง GET /locations
  dropOffPointId: string;
  foundAt: string;
  reportedAt: string;
  imageUrl: string | null;       // URL รูปผ่าน CloudFront/S3
  status: FoundItemStatus;
  verificationQuestion: string;
}

interface Claim {
  id: string; itemId: string; itemTitle: string; itemCategory: CategoryId;
  claimantName: string; studentId: string; contact: string;
  dropOffPointId: string; pickupCode: string;          // 6 ตัว A-Z/2-9 ไม่มี I,O,0,1
  status: "verified" | "returned";
  createdAt: string; returnedAt: string | null;
}
```

## Endpoints

### `GET /locations`
จุดที่เจอ + จุดรับฝาก (เก็บเป็น JSON config ใน S3 หรือ DynamoDB ก็ได้)
```json
{
  "foundLocations": [{ "id": "loc-library", "name": "ห้องสมุด", "zone": "โซนกลาง" }],
  "dropOffPoints":  [{ "id": "drop-gate1", "name": "ป้อม รปภ. ประตู 1", "hours": "เปิด 24 ชั่วโมง", "phone": "02-000-0001" }]
}
```

### `GET /stats`
```json
{ "waiting": 10, "awaitingPickup": 1, "returnedThisMonth": 4 }
```

### `GET /items?q=&category=&locationId=&status=`
ทุก query param ไม่บังคับ · `q` ค้นใน title, description, ชื่อสถานที่ (ไม่สนตัวพิมพ์) · เรียงจาก `foundAt` ใหม่สุด
```json
{ "items": [FoundItem, ...] }
```

### `GET /items/{id}` → `FoundItem` · 404 ถ้าไม่พบ

### `POST /uploads` — ขอ presigned URL สำหรับอัปโหลดรูปตรงเข้า S3
```json
// request
{ "contentType": "image/jpeg" }
// response
{ "uploadUrl": "https://bucket.s3...&X-Amz-Signature=...", "imageKey": "uploads/2026/10/abc.jpg", "imageUrl": "https://dxxx.cloudfront.net/uploads/2026/10/abc.jpg" }
```
หน้าเว็บจะ `PUT` ไฟล์ไปที่ `uploadUrl` (header `Content-Type` ตรงกับที่ขอ) แล้วส่ง `imageKey` ไปใน `POST /items`
หน้าเว็บย่อรูปเหลือด้านยาวสุด 1280px (JPEG) ก่อนอัปโหลดแล้ว · bucket ต้องตั้ง CORS ให้ `PUT` จาก origin ของเว็บ

### `POST /items` — แจ้งเจอของ → `201 FoundItem`
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
Backend ตั้ง `status = "available"`, `reportedAt = now` · **หลังบันทึก** ให้หา lost report ที่ตรงกัน (หมวดเดียวกัน ± สถานที่เดียวกัน) แล้วส่ง LINE push หาเจ้าของ

### `POST /lost-reports` — แจ้งของหาย → `201`
```json
// request
{
  "title": "กระเป๋าสตางค์หนังสีน้ำตาล",
  "description": "มีบัตรนักศึกษาอยู่ข้างใน",
  "category": "wallet",
  "lastSeenLocationId": "loc-canteen",
  "lostAt": "2026-10-26T05:00:00.000Z",
  "contact": { "name": "ธนพล", "lineId": "thanaphon.j", "phone": "", "email": "" }
}
// response
{ "id": "lst-8f2a", "createdAt": "2026-10-27T03:20:00.000Z", "possibleMatches": [FoundItem, ...] }
```
`contact` ต้องมีอย่างน้อย 1 ช่องทางที่ไม่ว่าง · `possibleMatches` = ของสถานะ `available` ที่ตรงที่สุดไม่เกิน 3 ชิ้น
กติกาจับคู่ในตัว mock (ให้ backend ใช้แบบเดียวกันได้): หมวดตรง +2, สถานที่ตรง +1, คำในชื่อซ้ำกัน +1 ต่อคำ, ได้ ≥ 2 คะแนนถือว่าตรง

### `POST /claims` — กด "นี่ของฉัน" → `200`
```json
// request
{ "itemId": "itm-1003", "answer": "Honda", "claimantName": "ธนพล ใจดี", "studentId": "1650707093", "contact": "LINE: thanaphon.j" }
// response — ตอบถูก
{ "status": "verified", "claimId": "clm-91c", "pickupCode": "K7Q2MX", "dropOffPointId": "drop-gate2" }
// response — ตอบผิด
{ "status": "rejected", "attemptsLeft": 2 }
```
- เทียบคำตอบหลัง normalize: `lowercase`, ตัดช่องว่างทั้งหมด, NFC
- ถือว่าถูกถ้าเท่ากันพอดี **หรือ** คำตอบมีคำที่ถูกอยู่ข้างใน โดยความยาวไม่เกิน `2 × ความยาวคำตอบจริง + 4` (กันการพิมพ์ทุกคำที่เดาไว้รวมในครั้งเดียว)
- จำกัด 3 ครั้งต่อ (`itemId`, `studentId`) → ครั้งที่ 4 ตอบ 429
- ถ้าของไม่ใช่ `available` → 409
- ตอบถูก: ของเปลี่ยนเป็น `claimed`, สร้าง Claim, ส่ง LINE แจ้งรหัสรับของ

### `GET /admin/claims?status=verified` 🔒 guard → `{ "claims": [Claim, ...] }`

### `POST /admin/claims/{id}/return` 🔒 guard → `200 Claim`
ตั้ง claim เป็น `returned` + `returnedAt`, และของเป็น `returned` · 409 ถ้าคืนไปแล้ว

### `GET /admin/items/stale?days=30` 🔒 guard
ของ `available` ที่ `foundAt` เก่ากว่า `days` วัน เรียงจากค้างนานสุด
```json
{ "items": [{ ...FoundItem, "daysWaiting": 41 }] }
```

### `POST /auth/login`
```json
// request
{ "email": "guard@bu.ac.th", "password": "..." }
// response
{ "accessToken": "eyJ...", "user": { "email": "guard@bu.ac.th", "displayName": "เจ้าหน้าที่ รปภ. ประตู 1", "role": "guard" } }
```
ถ้าใช้ Cognito Hosted UI แทน endpoint นี้ ให้คุยกันก่อน เพราะหน้าเว็บต้องเปลี่ยนไปใช้ redirect flow
