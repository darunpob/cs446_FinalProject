import type { CategoryId, FoundItemStatus } from "../api/contract";

export interface FoundItemSeed {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  foundLocationId: string;
  dropOffPointId: string;
  daysAgo: number;
  hour: number;
  status: FoundItemStatus;
  verificationQuestion: string;
  verificationAnswer: string;
}

export const foundItemSeeds: FoundItemSeed[] = [
  {
    id: "itm-1001", title: "iPhone 15 เคสสีม่วงใส", category: "electronics",
    description: "เจอวางอยู่บนโต๊ะแถวหลัง หน้าจอล็อกอยู่ แบตยังเหลือ",
    foundLocationId: "loc-library", dropOffPointId: "drop-library", daysAgo: 0, hour: 10, status: "available",
    verificationQuestion: "รูปพื้นหลังหน้าจอล็อกเป็นรูปอะไร", verificationAnswer: "แมว",
  },
  {
    id: "itm-1002", title: "กระเป๋าสตางค์หนังสีน้ำตาล", category: "wallet",
    description: "กระเป๋าสตางค์ใบสั้น มีบัตรอยู่ข้างใน ไม่มีเงินสด",
    foundLocationId: "loc-canteen", dropOffPointId: "drop-gate1", daysAgo: 1, hour: 12, status: "available",
    verificationQuestion: "ในกระเป๋ามีบัตรของธนาคารอะไร", verificationAnswer: "กสิกร",
  },
  {
    id: "itm-1003", title: "พวงกุญแจรถมอเตอร์ไซค์ + พวงตุ๊กตาหมี", category: "keys",
    description: "กุญแจ 2 ดอก มีพวงกุญแจตุ๊กตาหมีสีขาว",
    foundLocationId: "loc-parking", dropOffPointId: "drop-gate2", daysAgo: 2, hour: 17, status: "available",
    verificationQuestion: "กุญแจเป็นรถยี่ห้ออะไร", verificationAnswer: "honda",
  },
  {
    id: "itm-1004", title: "บัตรนักศึกษา", category: "card",
    description: "บัตรนักศึกษาคณะเทคโนโลยีสารสนเทศ ชื่อขึ้นต้นด้วย ธ.",
    foundLocationId: "loc-a5", dropOffPointId: "drop-student", daysAgo: 3, hour: 9, status: "claimed",
    verificationQuestion: "รหัสนักศึกษา 4 ตัวท้ายคืออะไร", verificationAnswer: "7093",
  },
  {
    id: "itm-1005", title: "ขวดน้ำเก็บความเย็นสีเขียวมิ้นต์", category: "bottle",
    description: "ขวดน้ำขนาด 32oz มีสติกเกอร์ติดหลายอัน",
    foundLocationId: "loc-gym", dropOffPointId: "drop-gate1", daysAgo: 4, hour: 19, status: "available",
    verificationQuestion: "มีสติกเกอร์รูปอะไรบนขวด", verificationAnswer: "ไดโนเสาร์",
  },
  {
    id: "itm-1006", title: "AirPods Pro (เฉพาะเคส)", category: "electronics",
    description: "เคสชาร์จสีขาว มีรอยขีดข่วนด้านหลัง ไม่มีหูฟังข้างใน",
    foundLocationId: "loc-b2", dropOffPointId: "drop-gate1", daysAgo: 6, hour: 14, status: "available",
    verificationQuestion: "เคสมีการสลักชื่อหรือข้อความอะไรไหม", verificationAnswer: "mint",
  },
  {
    id: "itm-1007", title: "เสื้อแจ็กเก็ตยีนส์", category: "clothing",
    description: "แจ็กเก็ตยีนส์สีฟ้าอ่อน ไซซ์ M ทิ้งไว้บนเก้าอี้",
    foundLocationId: "loc-plaza", dropOffPointId: "drop-student", daysAgo: 9, hour: 16, status: "available",
    verificationQuestion: "ในกระเป๋าเสื้อมีอะไรอยู่", verificationAnswer: "ใบเสร็จ",
  },
  {
    id: "itm-1008", title: "กระเป๋าเป้สีดำ", category: "bag",
    description: "เป้สีดำ มีโน้ตบุ๊กและหนังสือเรียนอยู่ข้างใน",
    foundLocationId: "loc-shuttle", dropOffPointId: "drop-gate2", daysAgo: 12, hour: 8, status: "returned",
    verificationQuestion: "โน้ตบุ๊กข้างในเป็นยี่ห้ออะไร", verificationAnswer: "asus",
  },
  {
    id: "itm-1009", title: "แว่นสายตากรอบดำ", category: "other",
    description: "แว่นกรอบสี่เหลี่ยมสีดำ อยู่ในซองผ้าสีเทา",
    foundLocationId: "loc-a1", dropOffPointId: "drop-library", daysAgo: 18, hour: 11, status: "available",
    verificationQuestion: "ซองแว่นเป็นของร้านอะไร", verificationAnswer: "ท็อปเจริญ",
  },
  {
    id: "itm-1010", title: "ร่มพับสีกรมท่า", category: "other",
    description: "ร่มพับ 3 ตอน ด้ามจับมีรอยเทปพัน",
    foundLocationId: "loc-b6", dropOffPointId: "drop-gate1", daysAgo: 34, hour: 15, status: "available",
    verificationQuestion: "ด้ามจับพันเทปสีอะไร", verificationAnswer: "แดง",
  },
  {
    id: "itm-1011", title: "เครื่องคิดเลขวิทยาศาสตร์ Casio", category: "electronics",
    description: "Casio fx-991 มีชื่อเขียนด้วยปากกาเมจิกด้านหลัง",
    foundLocationId: "loc-a5", dropOffPointId: "drop-student", daysAgo: 41, hour: 13, status: "available",
    verificationQuestion: "ชื่อที่เขียนด้านหลังคืออะไร", verificationAnswer: "ploy",
  },
  {
    id: "itm-1012", title: "กระเป๋าผ้าลายแมว", category: "bag",
    description: "กระเป๋าผ้าสีครีม ลายแมวสีส้ม ข้างในมีสมุดโน้ต",
    foundLocationId: "loc-dorm", dropOffPointId: "drop-gate2", daysAgo: 57, hour: 20, status: "available",
    verificationQuestion: "สมุดโน้ตในกระเป๋าเป็นวิชาอะไร", verificationAnswer: "cs446",
  },
];

export interface ClaimSeed {
  id: string;
  itemId: string;
  claimantName: string;
  studentId: string;
  contact: string;
  pickupCode: string;
  hoursAgo: number;
}

export const pendingClaimSeeds: ClaimSeed[] = [
  {
    id: "clm-2001", itemId: "itm-1004", claimantName: "ธนพล ใจดี", studentId: "1650707093",
    contact: "LINE: thanaphon.j", pickupCode: "K7Q2MX", hoursAgo: 5,
  },
];
