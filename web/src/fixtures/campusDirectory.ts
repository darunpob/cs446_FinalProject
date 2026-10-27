import type { CampusDirectory } from "../api/contract";

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
