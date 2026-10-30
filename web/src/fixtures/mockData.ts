/**
 * All mock data for USE_MOCK mode lives here. Nothing in this file ships when USE_MOCK is false.
 * Edit place names and drop-off points to match the real campus before the pilot.
 */
import type { CampusDirectory, CategoryId, FoundItemStatus, UserRole } from "../api/contract";

export const campusDirectoryFixture: CampusDirectory = {
  foundLocations: [
    { id: "loc-a1", name: "อาคาร A1", zone: "โซนอาคารเรียน" },
    { id: "loc-a5", name: "อาคาร A5", zone: "โซนอาคารเรียน" },
    { id: "loc-b2", name: "อาคาร B2", zone: "โซนอาคารเรียน" },
    { id: "loc-b6", name: "อาคาร B6", zone: "โซนอาคารเรียน" },
    { id: "loc-library", name: "ห้องสมุด", zone: "โซนกลาง" },
    { id: "loc-canteen", name: "โรงอาหาร", zone: "โซนกลาง" },
    { id: "loc-plaza", name: "ลานกิจกรรม", zone: "โซนกลาง" },
    { id: "loc-gym", name: "สนามกีฬา / ยิม", zone: "โซนกีฬา" },
    { id: "loc-parking", name: "ลานจอดรถ", zone: "โซนรอบนอก" },
    { id: "loc-shuttle", name: "จุดรอรถรับส่ง", zone: "โซนรอบนอก" },
    { id: "loc-dorm", name: "หอพัก", zone: "โซนรอบนอก" },
  ],
  dropOffPoints: [
    { id: "drop-gate1", name: "ป้อม รปภ. ประตู 1", hours: "เปิด 24 ชั่วโมง", phone: "02-000-0001" },
    { id: "drop-gate2", name: "ป้อม รปภ. ประตู 2", hours: "06:00 – 22:00 น.", phone: "02-000-0002" },
    { id: "drop-library", name: "เคาน์เตอร์ห้องสมุด", hours: "08:30 – 20:00 น.", phone: "02-000-0003" },
    { id: "drop-student", name: "สำนักงานกิจการนักศึกษา", hours: "จ.–ศ. 08:30 – 16:30 น.", phone: "02-000-0004" },
  ],
};

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
  aiLabels: string[];
  /** Set on sample finds sent privately to a sample notice; such items stay off the public board. */
  answersLostReportId?: string;
}

export const foundItemSeeds: FoundItemSeed[] = [
  {
    id: "itm-1001", title: "iPhone 15 เคสสีม่วงใส", category: "electronics",
    description: "เจอวางอยู่บนโต๊ะแถวหลัง หน้าจอล็อกอยู่ แบตยังเหลือ",
    foundLocationId: "loc-library", dropOffPointId: "drop-library", daysAgo: 0, hour: 10, status: "available",
    verificationQuestion: "รูปพื้นหลังหน้าจอล็อกเป็นรูปอะไร", verificationAnswer: "แมว",
    aiLabels: ["Mobile Phone", "Electronics", "Purple", "Phone Case"],
  },
  {
    id: "itm-1002", title: "กระเป๋าสตางค์หนังสีน้ำตาล", category: "wallet",
    description: "กระเป๋าสตางค์ใบสั้น มีบัตรอยู่ข้างใน ไม่มีเงินสด",
    foundLocationId: "loc-canteen", dropOffPointId: "drop-gate1", daysAgo: 1, hour: 12, status: "available",
    verificationQuestion: "ในกระเป๋ามีบัตรของธนาคารอะไร", verificationAnswer: "กสิกร",
    aiLabels: ["Wallet", "Leather", "Accessories"],
  },
  {
    id: "itm-1003", title: "พวงกุญแจรถมอเตอร์ไซค์ + พวงตุ๊กตาหมี", category: "keys",
    description: "กุญแจ 2 ดอก มีพวงกุญแจตุ๊กตาหมีสีขาว",
    foundLocationId: "loc-parking", dropOffPointId: "drop-gate2", daysAgo: 2, hour: 17, status: "available",
    verificationQuestion: "กุญแจเป็นรถยี่ห้ออะไร", verificationAnswer: "honda",
    aiLabels: ["Key", "Keychain", "Teddy Bear"],
  },
  {
    id: "itm-1004", title: "บัตรนักศึกษา", category: "card",
    description: "บัตรนักศึกษาคณะเทคโนโลยีสารสนเทศ ชื่อขึ้นต้นด้วย ธ.",
    foundLocationId: "loc-a5", dropOffPointId: "drop-student", daysAgo: 3, hour: 9, status: "claimed",
    verificationQuestion: "รหัสนักศึกษา 4 ตัวท้ายคืออะไร", verificationAnswer: "7093",
    aiLabels: ["ID Cards", "Document", "Text"],
  },
  {
    id: "itm-1005", title: "ขวดน้ำเก็บความเย็นสีเขียวมิ้นต์", category: "bottle",
    description: "ขวดน้ำขนาด 32oz มีสติกเกอร์ติดหลายอัน",
    foundLocationId: "loc-gym", dropOffPointId: "drop-gate1", daysAgo: 4, hour: 19, status: "available",
    verificationQuestion: "มีสติกเกอร์รูปอะไรบนขวด", verificationAnswer: "ไดโนเสาร์",
    aiLabels: ["Bottle", "Water Bottle", "Sticker"],
  },
  {
    id: "itm-1006", title: "AirPods Pro (เฉพาะเคส)", category: "electronics",
    description: "เคสชาร์จสีขาว มีรอยขีดข่วนด้านหลัง ไม่มีหูฟังข้างใน",
    foundLocationId: "loc-b2", dropOffPointId: "drop-gate1", daysAgo: 6, hour: 14, status: "available",
    verificationQuestion: "เคสมีการสลักชื่อหรือข้อความอะไรไหม", verificationAnswer: "mint",
    aiLabels: ["Electronics", "Headphones", "Case"],
  },
  {
    id: "itm-1007", title: "เสื้อแจ็กเก็ตยีนส์", category: "clothing",
    description: "แจ็กเก็ตยีนส์สีฟ้าอ่อน ไซซ์ M ทิ้งไว้บนเก้าอี้",
    foundLocationId: "loc-plaza", dropOffPointId: "drop-student", daysAgo: 9, hour: 16, status: "available",
    verificationQuestion: "ในกระเป๋าเสื้อมีอะไรอยู่", verificationAnswer: "ใบเสร็จ",
    aiLabels: ["Jacket", "Denim", "Clothing"],
  },
  {
    id: "itm-1008", title: "กระเป๋าเป้สีดำ", category: "bag",
    description: "เป้สีดำ มีโน้ตบุ๊กและหนังสือเรียนอยู่ข้างใน",
    foundLocationId: "loc-shuttle", dropOffPointId: "drop-gate2", daysAgo: 12, hour: 8, status: "returned",
    verificationQuestion: "โน้ตบุ๊กข้างในเป็นยี่ห้ออะไร", verificationAnswer: "asus",
    aiLabels: ["Backpack", "Bag", "Laptop"],
  },
  {
    id: "itm-1009", title: "แว่นสายตากรอบดำ", category: "other",
    description: "แว่นกรอบสี่เหลี่ยมสีดำ อยู่ในซองผ้าสีเทา",
    foundLocationId: "loc-a1", dropOffPointId: "drop-library", daysAgo: 18, hour: 11, status: "available",
    verificationQuestion: "ซองแว่นเป็นของร้านอะไร", verificationAnswer: "ท็อปเจริญ",
    aiLabels: ["Glasses", "Accessories", "Case"],
  },
  {
    id: "itm-1010", title: "ร่มพับสีกรมท่า", category: "other",
    description: "ร่มพับ 3 ตอน ด้ามจับมีรอยเทปพัน",
    foundLocationId: "loc-b6", dropOffPointId: "drop-gate1", daysAgo: 34, hour: 15, status: "available",
    verificationQuestion: "ด้ามจับพันเทปสีอะไร", verificationAnswer: "แดง",
    aiLabels: ["Umbrella", "Navy"],
  },
  {
    id: "itm-1011", title: "เครื่องคิดเลขวิทยาศาสตร์ Casio", category: "electronics",
    description: "Casio fx-991 มีชื่อเขียนด้วยปากกาเมจิกด้านหลัง",
    foundLocationId: "loc-a5", dropOffPointId: "drop-student", daysAgo: 41, hour: 13, status: "available",
    verificationQuestion: "ชื่อที่เขียนด้านหลังคืออะไร", verificationAnswer: "ploy",
    aiLabels: ["Calculator", "Electronics", "Text"],
  },
  {
    id: "itm-1012", title: "กระเป๋าผ้าลายแมว", category: "bag",
    description: "กระเป๋าผ้าสีครีม ลายแมวสีส้ม ข้างในมีสมุดโน้ต",
    foundLocationId: "loc-dorm", dropOffPointId: "drop-gate2", daysAgo: 57, hour: 20, status: "available",
    verificationQuestion: "สมุดโน้ตในกระเป๋าเป็นวิชาอะไร", verificationAnswer: "cs446",
    aiLabels: ["Tote Bag", "Cat", "Handbag"],
  },
  {
    id: "itm-1101", title: "ซองใส่บัตร มีบัตรนักศึกษา", category: "card",
    description: "ซองพลาสติกใส ข้างในมีบัตรนักศึกษาและบัตร ATM",
    foundLocationId: "loc-gym", dropOffPointId: "drop-gate1", daysAgo: 1, hour: 18, status: "available",
    verificationQuestion: "", verificationAnswer: "", aiLabels: ["ID Cards", "Wallet"], answersLostReportId: "lst-9003",
  },
  {
    id: "itm-1102", title: "กระติกน้ำสแตนเลสสีเขียว", category: "bottle",
    description: "กระติกสีเขียวเข้ม ฝาสีดำ มีรอยบุบที่ก้น",
    foundLocationId: "loc-a5", dropOffPointId: "drop-student", daysAgo: 2, hour: 10, status: "claimed",
    verificationQuestion: "", verificationAnswer: "", aiLabels: ["Bottle", "Steel"], answersLostReportId: "lst-9004",
  },
];

/** Sample owner and finder of the sample notices. Neither can sign in; they only make the board look lived-in. */
export const SAMPLE_OWNER_EMAIL = "sample.owner@bumail.net";
export const SAMPLE_FINDER_EMAIL = "sample.finder@bumail.net";

export interface LostReportSeed {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  lastSeenLocationId: string;
  daysAgo: number;
  hour: number;
  /** Paid and held from the start; 0 = no reward. */
  rewardAmount: number;
  /** Set on sample history: the notice was closed this many days ago by a guard-confirmed return. */
  returnedDaysAgo?: number;
}

export const lostReportSeeds: LostReportSeed[] = [
  {
    id: "lst-9001", title: "แว่นสายตากรอบทอง ในซองหนังสีน้ำตาล", category: "other",
    description: "ลืมไว้แถวโต๊ะอ่านหนังสือชั้น 2 ซองมีกระดุมแม่เหล็ก", lastSeenLocationId: "loc-library", daysAgo: 1, hour: 15, rewardAmount: 0,
  },
  {
    id: "lst-9002", title: "AirPods Pro เคสสีขาว สติกเกอร์แมวดำ", category: "electronics",
    description: "น่าจะหล่นตอนกินข้าวกลางวัน", lastSeenLocationId: "loc-canteen", daysAgo: 2, hour: 12, rewardAmount: 200,
  },
  {
    id: "lst-9003", title: "ซองใส่บัตรนักศึกษา + บัตร ATM", category: "card",
    description: "ซองพลาสติกใส หายหลังเล่นแบดที่ยิม", lastSeenLocationId: "loc-gym", daysAgo: 3, hour: 17, rewardAmount: 100,
  },
  {
    id: "lst-9004", title: "กระติกน้ำสแตนเลส สีเขียวเข้ม", category: "bottle",
    description: "ฝาสีดำ มีรอยบุบที่ก้น", lastSeenLocationId: "loc-a5", daysAgo: 4, hour: 9, rewardAmount: 0,
  },
  {
    id: "lst-9005", title: "ร่มพับสีกรมท่า ด้ามพันเทปแดง", category: "other",
    description: "ลืมไว้หน้าห้องเรียนตอนฝนหยุด", lastSeenLocationId: "loc-b6", daysAgo: 6, hour: 14, rewardAmount: 0, returnedDaysAgo: 2,
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
  /** Set when the claim is a notice owner confirming a find sent to that notice. */
  lostReportId?: string;
  ownerEmail?: string;
}

export const pendingClaimSeeds: ClaimSeed[] = [
  {
    id: "clm-2001", itemId: "itm-1004", claimantName: "ธนพล ใจดี", studentId: "1650707093",
    contact: "LINE: thanaphon.j", pickupCode: "K7Q2MX", hoursAgo: 5,
  },
  {
    id: "clm-2101", itemId: "itm-1102", claimantName: "เจ้าของประกาศตัวอย่าง", studentId: "",
    contact: SAMPLE_OWNER_EMAIL, pickupCode: "M4TZ8P", hoursAgo: 20, lostReportId: "lst-9004", ownerEmail: SAMPLE_OWNER_EMAIL,
  },
];

export interface DemoAccount {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}

export const demoAccounts: DemoAccount[] = [
  { email: "guard@bu.ac.th", password: "guard1234", displayName: "เจ้าหน้าที่ รปภ. ประตู 1", role: "guard" },
  { email: "student@bumail.net", password: "student1234", displayName: "นักศึกษาทดลอง", role: "student" },
];

/** Stand-in for Amazon Rekognition DetectLabels: what the mock "detects" when a photo is uploaded. */
export const simulatedAiLabels: Record<CategoryId, string[]> = {
  electronics: ["Electronics", "Mobile Phone", "Screen"],
  wallet: ["Wallet", "Accessories", "Leather"],
  card: ["ID Cards", "Document", "Text"],
  keys: ["Key", "Keychain", "Metal"],
  bag: ["Bag", "Backpack", "Accessories"],
  bottle: ["Bottle", "Water Bottle", "Plastic"],
  clothing: ["Clothing", "Apparel", "Fabric"],
  other: ["Object", "Accessories"],
};
