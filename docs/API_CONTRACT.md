# BU Lost & Found — API Contract (v4)

> **มีอะไรใหม่ใน v4 (ฝั่ง backend ต้องทำ):**
> 1. `POST /api/lost-reports` **เปลี่ยนเป็น 🔒 ต้องล็อกอิน** — เจ้าของรายงานอ่านจาก JWT ห้ามใช้ `contact.email` ในฟอร์ม
> 2. เพิ่ม `GET /api/lost-reports/mine` 🔒, `POST /api/lost-reports/{id}/close` 🔒 และบอร์ดสาธารณะ `GET /api/lost-reports`
> 3. `POST /api/items/{id}/claims` ถ้ามี token ให้บันทึกเจ้าของ claim ด้วย (ยังไม่บังคับล็อกอิน)
> 4. schema: `lost_reports` เพิ่ม `owner_email` + index, เปลี่ยน `status` เป็น `searching/found/cancelled`, เพิ่ม `closed_at` · `claims` เพิ่ม `owner_email` + index — SQL สำหรับแก้ตารางเดิมอยู่ท้ายข้อ 7

ข้อตกลงระหว่างหน้าเว็บ (`web/`) กับ backend
Type ฝั่งหน้าเว็บอยู่ที่ [`web/src/api/contract.ts`](../web/src/api/contract.ts) — **ถ้าแก้เอกสารนี้ต้องแก้ไฟล์นั้นด้วย**

> ⚠️ **กฎข้อเดียวที่ห้ามพลาด:** `verificationAnswer` (คำตอบที่ถูกของคำถามยืนยัน) เก็บไว้ในฐานข้อมูลเท่านั้น
> **ห้ามส่งกลับไปในทุก response** ไม่ว่า endpoint ไหน — backend เป็นคนตรวจคำตอบที่ `POST /api/items/{id}/claims` เอง

## 0. สถาปัตยกรรม (ตกลงแล้ว: แบบ B)

```mermaid
graph LR
  U[ผู้ใช้ / รปภ.] -->|HTTPS| CF[CloudFront]
  CF -->|/*| S3W[S3: หน้าเว็บ dist/]
  CF -->|/api/*| ALB[Application Load Balancer]
  ALB --> ASG[EC2 Auto Scaling group<br/>2 AZ]
  ASG --> RDS[(RDS MySQL)]
  ASG -->|presigned URL| S3I[S3: รูปของที่เจอ]
  U -->|PUT รูปตรง| S3I
  ASG --> REK[Rekognition]
  ASG --> SNS[SNS → อีเมล]
  LINE[LINE Platform] -.->|webhook ไม่บังคับ| CF
```

| ส่วน | ใช้อะไร | หมายเหตุ |
|---|---|---|
| หน้าเว็บ | S3 + CloudFront | `npm run build:aws` แล้วอัปโหลด `web/dist/` |
| API | ALB → EC2 Auto Scaling (min 1, desired 2, max 3, กระจาย 2 AZ) | target group health check `GET /api/health` |
| ฐานข้อมูล | RDS MySQL 8 (`db.t3.micro`) | อยู่ private subnet, security group เปิด 3306 ให้ SG ของ EC2 เท่านั้น — schema ข้อ 7 |
| รูป | S3 (bucket แยกจากหน้าเว็บ) + presigned URL | ผ่าน CloudFront ได้ถ้าต้องการ |
| AI | Rekognition `DetectLabels`, `DetectText` | ข้อ 3 |
| อีเมล | SNS | ข้อ 2 |

**ทำไม CloudFront ต้องส่ง `/api/*` ไป ALB:** ALB ใน Learner Lab ไม่มี HTTPS (ใช้ ACM ต้องมีโดเมน) หน้าเว็บที่เปิดผ่าน HTTPS เรียก `http://…elb.amazonaws.com` ตรง ๆ ไม่ได้ (mixed content) ให้สร้าง behavior `/api/*` → origin = ALB (origin protocol HTTP), cache policy `CachingDisabled`, origin request policy `AllViewerExceptHostHeader`, allowed methods ทั้งหมด (GET…DELETE) — หน้าเว็บกับ API จะอยู่ origin เดียวกันและไม่ต้องตั้ง CORS ฝั่ง API

**Learner Lab (AWS Academy):**
- Region **`us-east-1`** เท่านั้น (หรือ `us-west-2`)
- สร้าง IAM role เองไม่ได้ → launch template ของ EC2 ใช้ instance profile **`LabInstanceProfile`** แล้ว AWS SDK บนเครื่องจะได้สิทธิ์ S3 / SNS / Rekognition เอง ไม่ต้องใส่ access key ในโค้ด
- ปิด lab แล้ว resource อาจถูกหยุด → ก่อน demo ให้ start lab แล้วเช็กว่า EC2, RDS และ target health เป็นปกติ

**Service ที่นับคะแนนได้ (ไม่นับสีม่วง):** EC2, EC2 Auto Scaling, Elastic Load Balancing, RDS, S3, CloudFront, EBS (ดิสก์ของ EC2), Rekognition, SNS

## 1. สรุป endpoint

| Method | Path | ใช้ที่หน้า | Auth |
|---|---|---|---|
| GET | `/api/health` | ALB health check | – |
| GET | `/api/locations` | ทุกฟอร์ม (dropdown จุดที่เจอ / จุดรับฝาก) | – |
| GET | `/api/stats` | หน้าแรก (3 กล่องตัวเลข), หน้า รปภ. | – |
| GET | `/api/items?q=&category=&location=&status=` | หน้าแรก | – |
| GET | `/api/items/{id}` | หน้ารายละเอียด | – |
| POST | `/api/uploads` | แจ้งเจอของ (ขอ presigned URL รูป) | – |
| POST | `/api/items` | แจ้งเจอของ | – |
| POST | `/api/lost-reports` | แจ้งของหาย | 🔒 ทุก role (**ใหม่ใน v4**) |
| GET | `/api/lost-reports/mine` | หน้า "ของที่ฉันแจ้งหาย" | 🔒 ทุก role |
| POST | `/api/lost-reports/{id}/close` | หน้า "ของที่ฉันแจ้งหาย" ปุ่ม "ได้ของคืนแล้ว / ยกเลิกประกาศ" | 🔒 เจ้าของรายงาน |
| GET | `/api/lost-reports` | หน้า "ประกาศตามหา" (บอร์ดสาธารณะ) | – |
| POST | `/api/items/{id}/claims` | ปุ่ม "นี่ของฉัน" | – (ถ้ามี token จะผูก claim กับบัญชี) |
| GET | `/api/admin/claims?status=verified` | หน้า รปภ. แท็บ "รอส่งคืน" | 🔒 guard |
| POST | `/api/admin/claims/{claimId}/return` | หน้า รปภ. ปุ่ม "ยืนยันคืนแล้ว" | 🔒 guard |
| GET | `/api/admin/items/stale?days=30` | หน้า รปภ. แท็บ "ของค้างนาน" | 🔒 guard |
| POST | `/api/auth/login` | หน้าเข้าสู่ระบบ | – |
| POST | `/api/auth/register` | หน้าสมัครสมาชิก | – |
| GET | `/api/me` | หน้าบัญชีของฉัน | 🔒 ทุก role |
| PUT | `/api/me` | หน้าบัญชีของฉัน ปุ่ม "บันทึกข้อมูล" | 🔒 ทุก role |
| POST | `/api/me/password` | หน้าบัญชีของฉัน ปุ่ม "เปลี่ยนรหัสผ่าน" | 🔒 ทุก role |
| POST | `/api/line/webhook` | LINE Platform เรียก (ไม่ใช่หน้าเว็บ) — ไม่บังคับ ดูข้อ 2 | ลายเซ็น LINE |

## 2. การแจ้งเตือนทางอีเมล: Amazon SNS (ตกลงแล้ว)

**ทำไมไม่ใช้ SES:** SES ใน Learner Lab อยู่โหมด sandbox ส่งได้เฉพาะอีเมลที่ verify ไว้ก่อน ใช้กับผู้ใช้จริงไม่ได้ ส่วน SNS ส่งหาอีเมลใดก็ได้หลังผู้รับกดยืนยันครั้งแรก

**ออกแบบ: 1 topic ต่อ 1 อีเมล** ผู้ใช้กดยืนยันแค่ครั้งแรกครั้งเดียว แจ้งของหายกี่ครั้งก็ใช้ topic เดิม

1. **ตอน `POST /api/lost-reports`**
   ```js
   // topic name ต้องเป็น A-Z a-z 0-9 - _ ≤ 256 ตัว จึงใช้ hash ของอีเมล
   const name = "lostfound-" + sha256(email.toLowerCase()).slice(0, 32);
   const { TopicArn } = await sns.createTopic({ Name: name, Attributes: { DisplayName: "BU Lost & Found" } }); // ชื่อซ้ำ = ได้ topic เดิม
   await sns.subscribe({ TopicArn, Protocol: "email", Endpoint: email });                                   // อีเมลเดิมที่ยืนยันแล้ว = ไม่ส่งซ้ำ
   // เก็บ TopicArn ลง lost_reports.sns_topic_arn
   ```
   `DisplayName` ทำให้ชื่อผู้ส่งเป็น "BU Lost & Found" — หน้าเว็บบอกผู้ใช้ให้มองหาชื่อนี้และกด **Confirm subscription** (มีกล่องเตือนในหน้ายืนยันแล้ว)
2. **ตอนมีของที่ตรงกัน** (หลัง `POST /api/items` หรือจาก Rekognition ข้อ 3)
   ```js
   await sns.publish({
     TopicArn: report.sns_topic_arn,
     Subject: "มีคนแจ้งเจอของที่อาจเป็นของคุณ",   // ≤ 100 ตัวอักษร
     Message: `${item.title}\nฝากไว้ที่: ${dropOff.name} (${dropOff.hours})\nดูรายละเอียด: https://<cloudfront-domain>/#/items/${item.id}`,
   });
   ```
3. **ปิดเรื่อง** (คืนของแล้ว หรือเจ้าของกดปิดเองที่ `POST /api/lost-reports/{id}/close`) → `lost_reports.status` เป็น `'found'` หรือ `'cancelled'` แล้วไม่ต้อง publish อีก ไม่ต้องลบ topic · publish เฉพาะรายงานที่ `status = 'searching'`

**LINE (ไม่บังคับ):** ส่ง push ได้เฉพาะ `userId` ของคนที่แอด LINE OA แล้ว — ผู้ใช้แอดเพื่อนจากการ์ดในหน้ายืนยัน แล้วพิมพ์รหัสแจ้ง เช่น `lst-8f2a` ในแชท → LINE เรียก `POST /api/line/webhook` → ตรวจ `x-line-signature` → บันทึก `event.source.userId` ลง `lost_reports.line_user_id` → ตอนมีของตรงกันส่ง push เพิ่มจากอีเมล · `contact.lineId`, `contact.phone` ในฟอร์มมีไว้ให้ รปภ. ติดต่อกลับเท่านั้น

## 3. AI: Amazon Rekognition

ทำใน handler ของ `POST /api/items` ทันทีหลังบันทึก (ถ้ามี `imageKey`) — ใช้เวลาราว 1 วินาที:
1. **`DetectLabels`** (`Image.S3Object` = bucket รูป + `imageKey`, `MaxLabels: 5`, `MinConfidence: 80`) → เก็บชื่อ label ภาษาอังกฤษลง `ai_labels` · หน้าเว็บแสดงเป็นชิป "แท็กจาก AI" และ `q` ค้นใน `aiLabels` ด้วย
2. **ถ้าเป็นบัตร** (`category = "card"` หรือ labels มี `ID Cards` / `Document`) → **`DetectText`** → หาเลข 10 หลักด้วย `/\b\d{10}\b/`
3. หา `lost_reports` ที่ `student_id` ตรงกันและ `status = 'searching'` → publish SNS (ข้อ 2) "มีคนเจอบัตรของคุณ ฝากไว้ที่ …"
4. **ห้าม**เก็บเลขที่อ่านได้ลงฟิลด์สาธารณะ (`title`, `description`, `ai_labels`) และห้ามส่งออกใน response

ถ้า Rekognition error ให้บันทึกของต่อไปตามปกติด้วย `aiLabels: []` (log error ไว้) — อย่าให้การแจ้งเจอของล้มเพราะ AI

## 4. หลักทั่วไป

| เรื่อง | ข้อตกลง |
|---|---|
| Base path | ทุก endpoint ขึ้นต้นด้วย `/api` (ALB ส่งต่อทั้ง path ไป EC2 — แอปต้อง mount route ที่ `/api`) |
| Format | JSON ทั้ง request/response, `Content-Type: application/json` |
| เวลา | ISO 8601 UTC เช่น `2026-10-27T03:15:00.000Z` (เก็บใน RDS เป็น UTC `DATETIME`) |
| ID | string มี prefix: `itm-` (ของที่เจอ), `lst-` (แจ้งหาย), `clm-` (คำขอรับคืน) |
| Auth | `Authorization: Bearer <token>` — จำเป็นสำหรับ `/api/admin/*` (ต้องเป็น role `guard`), `/api/me*`, `POST /api/lost-reports`, `/api/lost-reports/mine` และ `/api/lost-reports/{id}/close` (role ใดก็ได้) · `POST /api/items/{id}/claims` รับ token แบบไม่บังคับ |
| CORS | ไม่ต้องตั้งสำหรับ API (origin เดียวกันผ่าน CloudFront) · **bucket รูปต้องตั้ง CORS** ให้ `PUT` จาก `https://<cloudfront-domain>` |
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
  imageUrl: string | null;       // URL รูปที่เปิดได้จากเบราว์เซอร์ (CloudFront หรือ presigned GET)
  status: FoundItemStatus;
  verificationQuestion: string;
  aiLabels: string[];            // Rekognition DetectLabels, อังกฤษ, ไม่เกิน 5 · [] ถ้าไม่มีรูป
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

type LostReportStatus = "searching" | "found" | "cancelled";   // DB: lost_reports.status

interface MyLostReport {          // เห็นเฉพาะเจ้าของรายงาน
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  lastSeenLocationId: string;
  lostAt: string;
  createdAt: string;
  status: LostReportStatus;
  closedAt: string | null;
  possibleMatches: FoundItem[];   // คำนวณใหม่ทุกครั้งที่เรียก · [] ถ้า status ไม่ใช่ "searching"
}

interface MyClaim {               // claim ที่ทำตอนล็อกอินอยู่ — ให้เจ้าของเปิดดูรหัสรับของซ้ำได้
  claimId: string;
  itemId: string;
  itemTitle: string;
  itemCategory: CategoryId;
  pickupCode: string;
  dropOffPointId: string;
  status: "verified" | "returned";
  createdAt: string;
}

interface PublicLostReport {      // บอร์ดสาธารณะ — มีแค่ 5 ฟิลด์นี้เท่านั้น
  id: string;
  title: string;
  category: CategoryId;
  lastSeenLocationId: string;
  lostAt: string;
}
```

## 6. รายละเอียด endpoint

### `GET /api/health`
```json
{ "ok": true }
```
ตอบ 200 เมื่อแอปพร้อมและต่อ RDS ได้ (`SELECT 1`) — ALB ใช้ตัดเครื่องที่เสียออกจาก Auto Scaling group

### `GET /api/locations`
จาก `SELECT * FROM locations`
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
`waiting` = ของสถานะ `available` · `awaitingPickup` = claim สถานะ `verified` · `returnedThisMonth` = ของที่ `returned_at` อยู่ในเดือนปัจจุบัน

### `GET /api/items?q=&category=&location=&status=`
ทุก param ไม่บังคับ
- `q` ค้นใน title, description, ชื่อสถานที่ และ `ai_labels` (ไม่สนตัวพิมพ์เล็ก/ใหญ่, ทุกคำต้องเจอ — ใช้ `LIKE` ต่อคำได้)
- `category` = `CategoryId` · `location` = id ของจุดที่เจอ · `status` = `available` | `claimed` | `returned`
- เรียงจาก `found_at` ใหม่สุด
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
  "uploadUrl": "https://<image-bucket>.s3.us-east-1.amazonaws.com/uploads/2026/10/abc.jpg?X-Amz-Signature=...",
  "imageKey": "uploads/2026/10/abc.jpg",
  "imageUrl": "https://<cloudfront-domain>/uploads/2026/10/abc.jpg"
}
```
1. หน้าเว็บย่อรูปให้ด้านยาวสุดไม่เกิน 1280px (JPEG) ก่อน
2. หน้าเว็บ `PUT` ไฟล์ไปที่ `uploadUrl` พร้อม header `Content-Type` ตรงกับที่ขอ
3. หน้าเว็บส่ง `imageKey` ไปใน `POST /api/items`

presigned URL อายุ 5 นาทีก็พอ · ยอมรับเฉพาะ `contentType` ที่ขึ้นต้นด้วย `image/`

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
- หลังบันทึก: หา lost report ที่ตรงกัน (กติกาจับคู่ด้านล่าง + บัตรนักศึกษาจากข้อ 3) แล้ว publish SNS ตามข้อ 2

### `POST /api/lost-reports` 🔒 — แจ้งของหาย → `201`
**ต้องล็อกอิน (ใหม่ใน v4)** — ไม่มี token → `401` · บันทึก `owner_email` = email ใน JWT **ห้ามใช้ `contact.email`** (นั่นคืออีเมลที่ใช้รับแจ้งเตือน SNS ซึ่งอาจไม่ใช่อีเมลบัญชี และใครจะพิมพ์อะไรก็ได้)
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
// response 201
{ "id": "lst-8f2a", "createdAt": "2026-10-27T03:20:00.000Z", "possibleMatches": [FoundItem, ...] }
```
- **`contact.email` บังคับ และต้องเป็นอีเมลมหาวิทยาลัย** — ส่วนหลัง `@` ต้องเท่ากับ `bumail.net` หรือ `bu.ac.th` พอดี (ไม่สนตัวพิมพ์เล็ก/ใหญ่) ไม่ใช่แค่ลงท้าย เช่น `x@bumail.net.evil.com` ต้องถูกปฏิเสธ · ไม่ผ่าน → `400 VALIDATION` (หน้าเว็บตรวจแล้ว แต่ backend ต้องตรวจซ้ำ)
- `lineId`, `phone` ไม่บังคับ ส่งมาเป็น `""` ถ้าไม่กรอก
- `studentId` ไม่บังคับ (`""` ได้) — หน้าเว็บให้กรอกเฉพาะหมวด `card` / `wallet` · ถ้ามีต้องเป็นเลข 10 หลัก
- `possibleMatches` = ของสถานะ `available` ที่ตรงที่สุด ไม่เกิน 3 ชิ้น
- **กติกาจับคู่** (เหมือนใน mock): หมวดตรง +2, สถานที่ตรง +1, คำในชื่อซ้ำกัน +1 ต่อคำ → ได้ ≥ 2 คะแนนถือว่าตรง เรียงคะแนนมากไปน้อย
- สร้าง topic + subscribe อีเมลตามข้อ 2 **ก่อนตอบกลับ** · ถ้า SNS error ให้บันทึกรายงานต่อไปได้ (log error ไว้)

### `GET /api/lost-reports/mine` 🔒 — หน้า "ของที่ฉันแจ้งหาย" → `200`
อ่าน email จาก JWT แล้ว `SELECT ... FROM lost_reports WHERE owner_email = ? ORDER BY created_at DESC` (ใช้ index `idx_lost_owner`)
```json
{
  "reports": [MyLostReport, ...],
  "claims":  [MyClaim, ...]
}
```
- **`possibleMatches` ต้องคำนวณใหม่ทุกครั้งที่เรียก** ด้วยกติกาจับคู่เดียวกับตอนแจ้ง — ห้ามเอารายการเดิมที่เก็บไว้ตอน `POST` เพราะมีของเจอเข้ามาเพิ่มเรื่อย ๆ · รายงานที่ `status` ไม่ใช่ `searching` ให้ส่ง `[]`
- `claims` = `SELECT ... FROM claims JOIN found_items ... WHERE claims.owner_email = ? ORDER BY created_at DESC` — หน้าเว็บโชว์รหัสรับของและจุดรับฝากให้ดูซ้ำได้ (เดิมโชว์ครั้งเดียวใน dialog ถ้าปิดไปก็หายเลย)
- `possibleMatches` เป็น `FoundItem` → **ห้ามมี `verificationAnswer`**

### `POST /api/lost-reports/{id}/close` 🔒 — ปุ่ม "ได้ของคืนแล้ว / ยกเลิกประกาศ" → `200 MyLostReport`
```json
{ "reason": "found" }       // หรือ "cancelled"
```
```sql
UPDATE lost_reports SET status = ?, closed_at = NOW()
WHERE id = ? AND owner_email = ? AND status = 'searching'
```
- `reason` ไม่ใช่ `found` / `cancelled` → `400`
- **ไม่พบ id หรือคนเรียกไม่ใช่เจ้าของ → `404`** (ห้ามตอบ 403 เพราะจะบอกใบ้ว่ามี id นี้อยู่จริง)
- ปิดไปแล้ว → `409`
- response คือรายงานหลังปิด (`possibleMatches: []`) · หลังปิดแล้วไม่ต้อง publish SNS ให้รายงานนี้อีก

### `GET /api/lost-reports` — บอร์ด "ประกาศตามหา" (สาธารณะ) → `200`
```json
{ "reports": [{ "id": "lst-8f2a", "title": "บัตรนักศึกษา", "category": "card", "lastSeenLocationId": "loc-canteen", "lostAt": "2026-10-26T05:00:00.000Z" }] }
```
- เฉพาะ `status = 'searching'` เรียงจาก `lost_at` ใหม่สุด
- ⚠️ **SELECT แค่ 5 คอลัมน์นี้เท่านั้น** ห้ามส่ง `description`, `student_id`, `contact_*`, `owner_email` เด็ดขาด — ถ้าเจ้าของเขียนว่า "กระเป๋ามีสติกเกอร์โดราเอมอน" แล้วคนเก็บได้ตั้งคำถามยืนยันว่า "บนกระเป๋ามีสติกเกอร์อะไร" มิจฉาชีพแค่เปิดบอร์ดก็ได้คำตอบไปเคลมของทันที
- ปุ่ม "ฉันเจอของชิ้นนี้" ในหน้าเว็บพาไปหน้าแจ้งเจอของ (`/report-found?title=&category=&location=`) — ไม่มีช่องทางติดต่อเจ้าของโดยตรง backend ไม่ต้องทำอะไรเพิ่ม

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
   - 3 ครั้งต่อคู่ (`itemId`, `studentId`) — ตาราง `claim_attempts`
   - **6 ครั้งต่อของ 1 ชิ้น รวมทุกรหัสนักศึกษา** — `SUM(failed_count) WHERE item_id = ?`
   - `attemptsLeft` = ค่าที่น้อยกว่าระหว่างสองชั้น

ตอบถูก → ใช้ transaction: `UPDATE found_items SET status='claimed' WHERE id=? AND status='available'` (ถ้าแถวที่แก้ = 0 → `409`) แล้ว `INSERT` claim · รหัสรับของแสดงบนหน้าจอ (หน้าเว็บบอกให้แคปหน้าจอเก็บไว้)

**token ไม่บังคับ:** ถ้ามี `Authorization` และ token ถูกต้อง ให้ใส่ `claims.owner_email` = email ใน JWT (ไม่มี token → `NULL`) เพื่อให้ `GET /api/lost-reports/mine` แสดงรหัสรับของซ้ำได้ · token ผิด/หมดอายุ ให้ถือว่าไม่มี token (อย่าตอบ 401 ที่ endpoint นี้)

### `GET /api/admin/claims?status=verified` 🔒
```json
{ "claims": [Claim, ...] }
```

### `POST /api/admin/claims/{claimId}/return` 🔒 → `200 Claim`
transaction: claim → `returned` + `returned_at = now`, ของ → `returned` + `returned_at`, lost report ที่เกี่ยวข้อง (ถ้ามี) → `status = 'found'`, `closed_at = now` · `409` ถ้าคืนไปแล้ว

### `GET /api/admin/items/stale?days=30` 🔒
ของ `available` ที่ `found_at` เก่ากว่า `days` วัน เรียงจากค้างนานสุด
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
ตรวจรหัสผ่านกับ `users.password_hash` (bcrypt) แล้วออก JWT อายุ 8 ชั่วโมง (เก็บ secret ใน environment ของ EC2 ไม่ใช่ในโค้ด)

### `POST /api/auth/register` → `201 Session`
```json
// request
{ "email": "somchai.k@bumail.net", "password": "at-least-8", "displayName": "สมชาย ใจดี" }
// response: เหมือน /api/auth/login (สมัครแล้วเข้าสู่ระบบให้เลย)
```
- อีเมลต้องเป็นโดเมนมหาวิทยาลัย (`bumail.net`, `bu.ac.th`) เก็บเป็นตัวพิมพ์เล็ก · รหัสผ่าน ≥ 8 ตัว · `displayName` ห้ามว่าง → ไม่ผ่าน `400`
- อีเมลซ้ำ → `409 CONFLICT`
- role เป็น `student` เสมอ (บัญชี `guard` สร้างด้วย SQL โดยผู้ดูแลเท่านั้น ห้ามรับ `role` จาก request)

### `GET /api/me` 🔒 → `200 UserProfile`
อ่าน email จาก JWT ไม่รับจาก query
```json
{ "email": "somchai.k@bumail.net", "displayName": "สมชาย ใจดี", "role": "student", "studentId": "", "phone": "", "lineId": "" }
```

### `PUT /api/me` 🔒 → `200 UserProfile`
```json
{ "displayName": "สมชาย ใจดี", "studentId": "1650707093", "phone": "0812345678", "lineId": "somchai.k" }
```
แก้ email / role ไม่ได้ · `studentId` ว่าง หรือเลข 10 หลัก · `phone` ว่าง หรือ `^0\d{8,9}$` (ตัดช่องว่าง/ขีดออกก่อนตรวจ) · ไม่ผ่าน → `400`

### `POST /api/me/password` 🔒 → `200 { "ok": true }`
```json
{ "currentPassword": "...", "newPassword": "at-least-8" }
```
`currentPassword` ผิด → `400 VALIDATION` (ไม่ใช่ 401 เพื่อไม่ให้หน้าเว็บพาผู้ใช้ออกจากระบบ) · รหัสใหม่สั้นกว่า 8 → `400`

ทุก endpoint 🔒: ไม่มี token / token หมดอายุ / ไม่พบผู้ใช้ → `401` แล้วหน้าเว็บจะออกจากระบบให้

## 7. RDS schema (MySQL 8)

```sql
CREATE TABLE locations (
  id         VARCHAR(32)  PRIMARY KEY,
  kind       ENUM('found', 'dropoff') NOT NULL,
  name       VARCHAR(100) NOT NULL,
  zone       VARCHAR(100) NULL,          -- เฉพาะ kind = 'found'
  hours      VARCHAR(100) NULL,          -- เฉพาะ kind = 'dropoff'
  phone      VARCHAR(30)  NULL
);

CREATE TABLE found_items (
  id                    VARCHAR(32)  PRIMARY KEY,
  title                 VARCHAR(200) NOT NULL,
  description           TEXT         NOT NULL,
  category              VARCHAR(20)  NOT NULL,
  found_location_id     VARCHAR(32)  NOT NULL REFERENCES locations(id),
  drop_off_point_id     VARCHAR(32)  NOT NULL REFERENCES locations(id),
  found_at              DATETIME     NOT NULL,
  reported_at           DATETIME     NOT NULL,
  image_key             VARCHAR(255) NULL,
  status                ENUM('available', 'claimed', 'returned') NOT NULL DEFAULT 'available',
  verification_question VARCHAR(255) NOT NULL,
  verification_answer   VARCHAR(255) NOT NULL,   -- ห้าม SELECT ไปใส่ response
  ai_labels             JSON         NOT NULL,
  returned_at           DATETIME     NULL,
  INDEX idx_items_status_found (status, found_at)
);

CREATE TABLE lost_reports (
  id                    VARCHAR(32)  PRIMARY KEY,
  title                 VARCHAR(200) NOT NULL,
  description           TEXT         NOT NULL,
  category              VARCHAR(20)  NOT NULL,
  last_seen_location_id VARCHAR(32)  NOT NULL REFERENCES locations(id),
  lost_at               DATETIME     NOT NULL,
  student_id            CHAR(10)     NULL,
  contact_name          VARCHAR(100) NOT NULL,
  contact_email         VARCHAR(254) NOT NULL,
  contact_line_id       VARCHAR(50)  NOT NULL DEFAULT '',
  contact_phone         VARCHAR(20)  NOT NULL DEFAULT '',
  owner_email           VARCHAR(254) NOT NULL REFERENCES users(email),  -- จาก JWT ไม่ใช่ contact_email
  sns_topic_arn         VARCHAR(255) NULL,
  line_user_id          VARCHAR(64)  NULL,
  status                ENUM('searching', 'found', 'cancelled') NOT NULL DEFAULT 'searching',
  created_at            DATETIME     NOT NULL,
  closed_at             DATETIME     NULL,
  INDEX idx_lost_owner (owner_email, created_at),
  INDEX idx_lost_student (student_id, status),
  INDEX idx_lost_category (category, status),
  INDEX idx_lost_board (status, lost_at)
);

CREATE TABLE claims (
  id             VARCHAR(32)  PRIMARY KEY,
  item_id        VARCHAR(32)  NOT NULL REFERENCES found_items(id),
  claimant_name  VARCHAR(100) NOT NULL,
  student_id     CHAR(10)     NOT NULL,
  contact        VARCHAR(200) NOT NULL,
  pickup_code    CHAR(6)      NOT NULL,
  owner_email    VARCHAR(254) NULL,          -- จาก JWT ถ้าเคลมตอนล็อกอินอยู่
  status         ENUM('verified', 'returned') NOT NULL DEFAULT 'verified',
  created_at     DATETIME     NOT NULL,
  returned_at    DATETIME     NULL,
  INDEX idx_claims_status (status),
  INDEX idx_claims_owner (owner_email, created_at)
);

CREATE TABLE claim_attempts (
  item_id      VARCHAR(32) NOT NULL,
  student_id   CHAR(10)    NOT NULL,
  failed_count INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (item_id, student_id)
);

CREATE TABLE users (
  email         VARCHAR(254) PRIMARY KEY,
  password_hash VARCHAR(100) NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  role          ENUM('student', 'guard') NOT NULL DEFAULT 'student',
  student_id    CHAR(10)     NOT NULL DEFAULT '',
  phone         VARCHAR(20)  NOT NULL DEFAULT '',
  line_id       VARCHAR(50)  NOT NULL DEFAULT '',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
**แก้ตารางที่สร้างไว้แล้วจาก v3 → v4** (รายงานเก่าที่ไม่มีเจ้าของ ลบทิ้งหรือใส่บัญชีทดสอบก่อนเพิ่ม `NOT NULL`):
```sql
ALTER TABLE lost_reports
  ADD COLUMN owner_email VARCHAR(254) NULL AFTER contact_phone,
  ADD COLUMN closed_at   DATETIME     NULL AFTER created_at,
  MODIFY status ENUM('open', 'closed', 'searching', 'found', 'cancelled') NOT NULL DEFAULT 'searching';
UPDATE lost_reports SET status = IF(status = 'closed', 'found', 'searching');
UPDATE lost_reports SET owner_email = contact_email WHERE owner_email IS NULL;   -- เฉพาะข้อมูลทดสอบเก่า
ALTER TABLE lost_reports
  MODIFY owner_email VARCHAR(254) NOT NULL,
  MODIFY status ENUM('searching', 'found', 'cancelled') NOT NULL DEFAULT 'searching',
  ADD INDEX idx_lost_owner (owner_email, created_at),
  ADD INDEX idx_lost_board (status, lost_at);

ALTER TABLE claims
  ADD COLUMN owner_email VARCHAR(254) NULL AFTER pickup_code,
  ADD INDEX idx_claims_owner (owner_email, created_at);
```
> ถ้าย้ายไปใช้ DynamoDB ภายหลัง: ทำ GSI partition key = `ownerEmail`, sort key = `createdAt` บนตาราง lost reports และ claims แทน index ข้างบน

ข้อมูลตั้งต้นของ `locations` คัดลอกจาก `campusDirectoryFixture` ใน [`web/src/fixtures/mockData.ts`](../web/src/fixtures/mockData.ts) ได้เลย (แก้ชื่อให้ตรงกับมหาวิทยาลัยจริง)

## 8. ทดสอบกับหน้าเว็บ

```bash
cd web
# ใส่ VITE_LINE_OA_URL ใน .env.aws ถ้ามี LINE OA
npm run build:aws   # ได้ dist/ ที่เรียก /api จริง ไม่มี mock data / บัญชีทดลอง
aws s3 sync dist/ s3://<web-bucket>/ --delete
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```
ระหว่างพัฒนา หน้าเว็บใช้ mock ที่ทำตามเอกสารนี้ (ยกเว้นการส่งอีเมล/LINE และ Rekognition ที่จำลองด้วย label ตามหมวด) ดูพฤติกรรมอ้างอิงได้ที่ `web/src/api/mock/mockClient.ts`
