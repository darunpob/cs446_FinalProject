import type { CategoryId, FoundItemStatus } from "../../api/contract";

interface PlaceText {
  name: string;
  zone: string;
}

interface DropOffText {
  name: string;
  hours: string;
}

/** Text around a highlighted value: `{before} <strong>value</strong> {after}`. */
interface Around {
  before: string;
  after: string;
}

export interface Messages {
  common: {
    backHome: string;
    loading: string;
    retry: string;
    close: string;
    optional: string;
    cancel: string;
    language: string;
  };
  nav: {
    found: string;
    reportLost: string;
    guard: string;
    reportFound: string;
    account: string;
    login: string;
    logout: string;
    mainMenu: string;
    mobileMenu: string;
    homeLabel: string;
  };
  footer: { credit: string; mockData: string; resetMock: string };
  theme: { toLight: string; toDark: string };
  notFound: { title: string; description: string };
  pageError: { title: string; description: string };
  categories: Record<CategoryId, string>;
  status: Record<FoundItemStatus, string>;
  time: { justNow: string; clockSuffix: string };
  directory: {
    unknownPlace: string;
    /** Overrides for place / drop-off names served by the API; empty means use the API text as-is. */
    places: Partial<Record<string, PlaceText>>;
    dropOffs: Partial<Record<string, DropOffText>>;
  };
  home: {
    liveBadge: string;
    heroTitle: string;
    heroHighlight: string;
    heroLead: string;
    searchLabel: string;
    searchPlaceholder: string;
    statWaiting: string;
    statAwaiting: string;
    statReturned: string;
    categoryGroup: string;
    all: string;
    locationLabel: string;
    allLocations: string;
    statusGroup: string;
    scopeOpen: string;
    resultCount: Around;
    clearFilters: string;
    emptyTitle: string;
    emptyDescription: string;
    listLabel: string;
  };
  item: {
    noImage: string;
    back: string;
    stepsTitle: string;
    claimSteps: string[];
    claimedMessage: string;
    returnedMessage: string;
    claimButton: string;
    foundPlace: string;
    foundTime: string;
    droppedAt: string;
    unspecified: string;
    notFoundTitle: string;
    viewAll: string;
    aiLabelsTitle: string;
    aiLabelsHint: string;
  };
  claim: {
    answerRequired: string;
    nameRequired: string;
    studentIdInvalid: string;
    contactRequired: string;
    title: string;
    titleVerified: string;
    questionFromFinder: string;
    wrongAnswer: (attemptsLeft: number) => string;
    answerLabel: string;
    answerHint: string;
    nameLabel: string;
    studentIdLabel: string;
    contactLabel: string;
    contactHint: string;
    submit: string;
    pickupCode: string;
    dropOffFallback: string;
    pickupBefore: string;
    pickupStrong: string;
    pickupAfter: string;
    done: string;
  };
  photo: {
    onlyImages: string;
    tooLarge: string;
    pickLabel: string;
    previewAlt: string;
    change: string;
    remove: string;
    dropHere: string;
    formats: string;
    choose: string;
  };
  reportFound: {
    eyebrow: string;
    title: string;
    description: string;
    step1Title: string;
    step1Description: string;
    titleLabel: string;
    titlePlaceholder: string;
    categoryLabel: string;
    descriptionLabel: string;
    descriptionHint: string;
    step2Title: string;
    locationLabel: string;
    locationPlaceholder: string;
    timeLabel: string;
    step3Title: string;
    step3Description: string;
    dropOffGroup: string;
    step4Title: string;
    step4Description: string;
    questionLabel: string;
    questionPlaceholder: string;
    questionIdeas: string[];
    answerLabel: string;
    answerHint: string;
    submitting: string;
    submit: string;
    tipsTitle: string;
    tips: [string, string, string];
    successTitle: string;
    successLead: string;
    itemRef: string;
    viewPost: string;
    reportAnother: string;
    timeRequired: string;
    timeInFuture: string;
    titleTooShort: string;
    categoryRequired: string;
    locationRequired: string;
    dropOffRequired: string;
    questionTooShort: string;
    answerRequired: string;
  };
  reportLost: {
    eyebrow: string;
    title: string;
    description: string;
    step1Title: string;
    whatLabel: string;
    whatPlaceholder: string;
    featuresLabel: string;
    featuresHint: string;
    step2Title: string;
    whereLabel: string;
    whenLabel: string;
    step3Title: string;
    step3Description: string;
    nameLabel: string;
    phoneLabel: string;
    emailLabel: string;
    submitting: string;
    submit: string;
    receiptTitle: string;
    receiptNumber: string;
    receiptLead: string;
    mightBeYours: string;
    noMatches: string;
    checkBack: string;
    emailRequired: string;
    phoneInvalid: string;
    emailInvalid: string;
    titleTooShort: string;
    locationRequired: string;
    timeRequired: string;
    nameRequired: string;
    studentIdLabel: string;
    studentIdHint: string;
    studentIdInvalid: string;
    lineIdLabel: string;
    lineIdHint: string;
    lineTitle: string;
    lineBody: (reportId: string) => string;
    lineButton: string;
    lineQrAlt: string;
    confirmEmailTitle: string;
    confirmEmailBody: (email: string) => string;
    emailHint: string;
    emailNotUniversity: string;
  };
  login: {
    demoAccounts: string;
    roleGuard: string;
    roleStudent: string;
    guardTitle: string;
    title: string;
    guardSubtitle: string;
    subtitle: string;
    email: string;
    password: string;
  };
  admin: {
    eyebrow: string;
    greeting: (name: string) => string;
    metricAwaiting: string;
    metricWaiting: string;
    metricStale: (days: number) => string;
    metricReturned: string;
    tabReturns: string;
    tabStale: string;
    confirmedAgo: (relative: string) => string;
    confirmArmed: string;
    confirm: string;
    emptyReturnsTitle: string;
    emptyReturnsDescription: string;
    lookupPlaceholder: string;
    lookupLabel: string;
    noLookupMatch: (lookup: string) => string;
    staleEmptyTitle: string;
    staleEmptyDescription: string;
    staleNote: (days: number) => string;
    foundAtPlace: (place: string, date: string) => string;
    days: (count: number) => string;
  };
  errors: {
    unknown: string;
    network: string;
    httpFailed: (status: number) => string;
    uploadFailed: string;
    readPhotoFailed: string;
    required: (field: string) => string;
    badLogin: string;
    itemNotFound: string;
    alreadyClaimed: string;
    tooManyAttempts: string;
    claimNotFound: string;
    alreadyReturned: string;
    fields: { itemTitle: string; question: string; answer: string; lostWhat: string; reporterName: string };
  };
}

export const th: Messages = {
  common: {
    backHome: "กลับหน้าแรก",
    loading: "กำลังโหลด",
    retry: "ลองอีกครั้ง",
    close: "ปิด",
    optional: "ไม่บังคับ",
    cancel: "ยกเลิก",
    language: "ภาษา",
  },
  nav: {
    found: "ของที่เจอ",
    reportLost: "แจ้งของหาย",
    guard: "แผง รปภ.",
    reportFound: "แจ้งเจอของ",
    account: "บัญชี",
    login: "เข้าสู่ระบบ",
    logout: "ออกจากระบบ",
    mainMenu: "เมนูหลัก",
    mobileMenu: "เมนูมือถือ",
    homeLabel: "BU Lost & Found หน้าแรก",
  },
  footer: {
    credit: "BU Lost & Found · โปรเจกต์ CS446 Cloud Computing · มหาวิทยาลัยกรุงเทพ",
    mockData: "ข้อมูลจำลอง",
    resetMock: "รีเซ็ตข้อมูลตัวอย่าง",
  },
  theme: { toLight: "เปลี่ยนเป็นธีมสว่าง", toDark: "เปลี่ยนเป็นธีมมืด" },
  notFound: { title: "ไม่พบหน้านี้", description: "ลิงก์อาจไม่ถูกต้อง หรือหน้านี้ถูกย้ายไปแล้ว" },
  pageError: { title: "หน้านี้มีปัญหา", description: "ลองรีเฟรชหน้า หรือกลับไปหน้าแรก หากยังเกิดซ้ำ โปรดแจ้งทีมพัฒนา" },
  categories: {
    electronics: "อิเล็กทรอนิกส์",
    wallet: "กระเป๋าสตางค์",
    card: "บัตร / เอกสาร",
    keys: "กุญแจ",
    bag: "กระเป๋า",
    bottle: "ขวดน้ำ / แก้ว",
    clothing: "เสื้อผ้า",
    other: "อื่น ๆ",
  },
  status: { available: "รอเจ้าของ", claimed: "ยืนยันแล้ว รอรับ", returned: "คืนแล้ว" },
  time: { justNow: "เมื่อสักครู่", clockSuffix: " น." },
  directory: { unknownPlace: "ไม่ระบุสถานที่", places: {}, dropOffs: {} },
  home: {
    liveBadge: "อัปเดตแบบเรียลไทม์จากจุดรับฝากทั่วแคมปัส",
    heroTitle: "ของหาย?",
    heroHighlight: "เช็กตรงนี้ก่อน",
    heroLead: "รวมของที่มีคนเก็บได้ในมหาวิทยาลัยไว้ที่เดียว ค้นหา ยืนยันความเป็นเจ้าของ แล้วไปรับคืนที่จุดรับฝากได้เลย",
    searchLabel: "ค้นหาของที่เจอ",
    searchPlaceholder: "ลองพิมพ์ เช่น iPhone, กุญแจ, กระเป๋าสตางค์",
    statWaiting: "ชิ้นที่รอเจ้าของ",
    statAwaiting: "ยืนยันแล้ว รอมารับ",
    statReturned: "คืนเจ้าของแล้วเดือนนี้",
    categoryGroup: "หมวดหมู่",
    all: "ทั้งหมด",
    locationLabel: "จุดที่เจอ",
    allLocations: "ทุกจุดที่เจอ",
    statusGroup: "สถานะ",
    scopeOpen: "รอเจ้าของ",
    resultCount: { before: "พบ", after: "รายการ" },
    clearFilters: "ล้างตัวกรอง",
    emptyTitle: "ยังไม่พบของที่ตรงกับที่ค้นหา",
    emptyDescription: "ลองเปลี่ยนคำค้นหรือตัวกรอง หรือฝากแจ้งของหายไว้ เมื่อมีคนเจอของที่ตรงกันเราจะแจ้งเตือนผ่าน LINE",
    listLabel: "รายการของที่เจอ",
  },
  item: {
    noImage: "ไม่มีรูป",
    back: "กลับไปหน้ารายการ",
    stepsTitle: "ขั้นตอนรับของคืน",
    claimSteps: [
      "ตอบคำถามยืนยันที่ผู้เก็บได้ตั้งไว้",
      "รับรหัสรับของ (แคปหน้าจอเก็บไว้)",
      "ไปที่จุดรับฝาก แสดงรหัสพร้อมบัตรนักศึกษา",
    ],
    claimedMessage: "มีผู้ยืนยันความเป็นเจ้าของแล้ว กำลังรอมารับที่จุดรับฝาก",
    returnedMessage: "ของชิ้นนี้คืนเจ้าของเรียบร้อยแล้ว",
    claimButton: "นี่ของฉัน",
    foundPlace: "จุดที่เจอ",
    foundTime: "เวลาที่เจอ",
    droppedAt: "ฝากไว้ที่",
    unspecified: "ไม่ระบุ",
    notFoundTitle: "ไม่พบรายการนี้",
    viewAll: "ดูของที่เจอทั้งหมด",
    aiLabelsTitle: "แท็กจาก AI",
    aiLabelsHint: "Amazon Rekognition วิเคราะห์จากรูปอัตโนมัติ",
  },
  claim: {
    answerRequired: "กรุณาตอบคำถามยืนยัน",
    nameRequired: "กรุณากรอกชื่อ-นามสกุล",
    studentIdInvalid: "รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก",
    contactRequired: "กรุณากรอกช่องทางติดต่อ",
    title: "ยืนยันว่านี่คือของคุณ",
    titleVerified: "ยืนยันสำเร็จ 🎉",
    questionFromFinder: "คำถามยืนยันจากผู้เก็บได้",
    wrongAnswer: (attemptsLeft) => `คำตอบยังไม่ตรง เหลือโอกาสอีก ${attemptsLeft} ครั้ง`,
    answerLabel: "คำตอบของคุณ",
    answerHint: "ตอบสั้น ๆ ตามที่จำได้ ระบบไม่สนตัวพิมพ์เล็ก/ใหญ่",
    nameLabel: "ชื่อ-นามสกุล",
    studentIdLabel: "รหัสนักศึกษา",
    contactLabel: "ช่องทางติดต่อ",
    contactHint: "LINE ID, เบอร์โทร หรืออีเมล",
    submit: "ส่งคำตอบ",
    pickupCode: "รหัสรับของของคุณ",
    dropOffFallback: "จุดรับฝาก",
    pickupBefore: "แสดงรหัสนี้พร้อม",
    pickupStrong: "บัตรนักศึกษา",
    pickupAfter: "ให้เจ้าหน้าที่ที่จุดรับฝาก แนะนำให้แคปหน้าจอเก็บไว้",
    done: "เรียบร้อย",
  },
  photo: {
    onlyImages: "รองรับเฉพาะไฟล์รูปภาพ",
    tooLarge: "ไฟล์ใหญ่เกิน 15 MB",
    pickLabel: "เลือกรูปถ่าย",
    previewAlt: "ตัวอย่างรูปที่เลือก",
    change: "เปลี่ยนรูป",
    remove: "ลบรูป",
    dropHere: "ถ่ายรูปหรือลากรูปมาวางที่นี่",
    formats: "JPG, PNG หรือ HEIC ไม่เกิน 15 MB · ระบบจะย่อขนาดให้อัตโนมัติ",
    choose: "เลือกรูป",
  },
  reportFound: {
    eyebrow: "แจ้งเจอของ",
    title: "เจอของใครทำหาย? ช่วยส่งคืนกัน",
    description: "กรอกข้อมูลไม่ถึง 2 นาที ระบบจะประกาศให้ทั้งมหาวิทยาลัยเห็น และแจ้งเตือนคนที่แจ้งของหายที่ตรงกันผ่าน LINE",
    step1Title: "เจออะไร",
    step1Description: "รูปช่วยให้เจ้าของจำของตัวเองได้เร็วขึ้นมาก",
    titleLabel: "ชื่อสิ่งของ",
    titlePlaceholder: "เช่น iPhone เคสสีม่วง, กุญแจรถ Honda",
    categoryLabel: "หมวดหมู่",
    descriptionLabel: "รายละเอียดเพิ่มเติม",
    descriptionHint: "บอกลักษณะทั่วไป แต่เก็บจุดสังเกตเฉพาะไว้ตั้งเป็นคำถามยืนยัน",
    step2Title: "เจอที่ไหน เมื่อไร",
    locationLabel: "จุดที่เจอ",
    locationPlaceholder: "เลือกอาคาร / พื้นที่",
    timeLabel: "เวลาที่เจอ",
    step3Title: "นำไปฝากไว้ที่ไหน",
    step3Description: "เลือกจุดรับฝากที่สะดวกที่สุด เจ้าของจะมารับที่นี่",
    dropOffGroup: "จุดรับฝาก",
    step4Title: "ตั้งคำถามยืนยันความเป็นเจ้าของ",
    step4Description: "ป้องกันคนแอบอ้าง — คนที่กด “นี่ของฉัน” ต้องตอบให้ถูกก่อน",
    questionLabel: "คำถาม",
    questionPlaceholder: "เช่น มีสติกเกอร์รูปอะไรอยู่บนเคส",
    questionIdeas: ["สีของเคส / ปลอก คืออะไร", "มีสติกเกอร์หรือพวงกุญแจรูปอะไร", "ข้างในมีอะไรอยู่บ้าง", "รูปพื้นหลังหน้าจอล็อกคืออะไร"],
    answerLabel: "คำตอบที่ถูกต้อง",
    answerHint: "เก็บเป็นความลับ ไม่แสดงบนหน้าเว็บ",
    submitting: "กำลังบันทึก",
    submit: "ประกาศของที่เจอ",
    tipsTitle: "เคล็ดลับเล็ก ๆ",
    tips: [
      "ถ่ายรูปให้เห็นตัวของชัด ๆ แต่ไม่ต้องโชว์ข้อมูลส่วนตัว เช่น เลขบัตร",
      "อย่าใส่รายละเอียดที่เป็นคำตอบของคำถามยืนยันในคำอธิบาย",
      "นำของไปฝากที่จุดรับฝากที่เลือกภายในวันเดียวกัน",
    ],
    successTitle: "ขอบคุณที่ช่วยเหลือ!",
    successLead: "ประกาศขึ้นระบบแล้ว อย่าลืมนำของไปฝากที่",
    itemRef: "รหัสรายการ",
    viewPost: "ดูประกาศ",
    reportAnother: "แจ้งชิ้นต่อไป",
    timeRequired: "ระบุเวลาที่เจอ",
    timeInFuture: "เวลาที่เจอต้องไม่อยู่ในอนาคต",
    titleTooShort: "บอกชื่อสิ่งของสั้น ๆ อย่างน้อย 3 ตัวอักษร",
    categoryRequired: "เลือกหมวดหมู่",
    locationRequired: "เลือกจุดที่เจอ",
    dropOffRequired: "เลือกจุดที่จะนำของไปฝาก",
    questionTooShort: "ตั้งคำถามที่เจ้าของตัวจริงเท่านั้นจะตอบได้",
    answerRequired: "ใส่คำตอบที่ถูกต้อง (เจ้าของจะไม่เห็นช่องนี้)",
  },
  reportLost: {
    eyebrow: "แจ้งของหาย",
    title: "บอกเราว่าหายอะไร เดี๋ยวช่วยตามให้",
    description: "ระบบจะเทียบกับของที่มีคนแจ้งเจอทันที และเฝ้าดูรายการใหม่ ๆ ให้ เมื่อเจอของที่น่าจะใช่จะส่งแจ้งเตือนหาคุณ",
    step1Title: "หายอะไร",
    whatLabel: "สิ่งที่หาย",
    whatPlaceholder: "เช่น กระเป๋าสตางค์หนังสีน้ำตาล",
    featuresLabel: "ลักษณะเด่น",
    featuresHint: "สี ยี่ห้อ ขนาด หรือของที่อยู่ข้างใน",
    step2Title: "หายแถวไหน",
    whereLabel: "บริเวณที่น่าจะหาย",
    whenLabel: "เห็นครั้งล่าสุดเมื่อ",
    step3Title: "ติดต่อคุณทางไหน",
    step3Description: "ใส่อีเมลเพื่อรับแจ้งเตือนเมื่อมีคนเจอของที่ตรงกัน ส่วน LINE ID และเบอร์โทรไว้ให้ รปภ. ติดต่อกลับ",
    nameLabel: "ชื่อ",
    phoneLabel: "เบอร์โทร",
    emailLabel: "อีเมล",
    submitting: "กำลังส่ง",
    submit: "แจ้งของหาย",
    receiptTitle: "รับเรื่องแล้ว เราช่วยจับตาให้",
    receiptNumber: "หมายเลขแจ้ง",
    receiptLead: "เมื่อมีคนแจ้งเจอของที่ใกล้เคียง ระบบจะส่งอีเมลแจ้งคุณทันที",
    mightBeYours: "อาจเป็นของคุณ",
    noMatches: "ยังไม่มีของที่ตรงกันตอนนี้",
    checkBack: "ลองกลับมาดูหน้ารายการเป็นระยะ หรือรอรับแจ้งเตือนได้เลย",
    emailRequired: "ใส่อีเมลเพื่อรับแจ้งเตือน",
    phoneInvalid: "เบอร์โทรไม่ถูกต้อง",
    emailInvalid: "อีเมลไม่ถูกต้อง",
    titleTooShort: "บอกว่าหายอะไร อย่างน้อย 3 ตัวอักษร",
    locationRequired: "เลือกบริเวณที่น่าจะหาย",
    timeRequired: "ระบุเวลาโดยประมาณ",
    nameRequired: "กรอกชื่อของคุณ",
    studentIdLabel: "รหัสนักศึกษา",
    studentIdHint: "ถ้าบัตรนักศึกษาหาย ใส่ไว้ เมื่อมีคนถ่ายรูปบัตรของคุณ AI จะจับคู่และแจ้งคุณอัตโนมัติ",
    studentIdInvalid: "รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก",
    lineIdLabel: "LINE ID",
    lineIdHint: "ไว้ให้ รปภ. ติดต่อกลับ",
    lineTitle: "รับแจ้งเตือนทาง LINE ด้วย",
    lineBody: (reportId) => `เพิ่มเพื่อน LINE ของเรา แล้วพิมพ์ ${reportId} ในแชท เพื่อผูกการแจ้งนี้กับ LINE ของคุณ`,
    lineButton: "เพิ่มเพื่อน LINE",
    lineQrAlt: "QR code เพิ่มเพื่อน LINE Official Account",
    confirmEmailTitle: "สำคัญ: ยืนยันอีเมลก่อน 1 ครั้ง",
    confirmEmailBody: (email) => `เราส่งอีเมลจาก "BU Lost & Found" ไปที่ ${email} แล้ว กดลิงก์ Confirm subscription ในอีเมลนั้น ไม่อย่างนั้นจะไม่ได้รับแจ้งเตือน (ถ้าไม่เจอ ลองดูในโฟลเดอร์สแปม)`,
    emailHint: "ใช้อีเมลมหาวิทยาลัย @bumail.net (บุคลากรใช้ @bu.ac.th)",
    emailNotUniversity: "ต้องเป็นอีเมลมหาวิทยาลัย @bumail.net หรือ @bu.ac.th",
  },
  login: {
    demoAccounts: "บัญชีทดลอง (โหมดข้อมูลจำลอง)",
    roleGuard: "รปภ.",
    roleStudent: "นักศึกษา",
    guardTitle: "สำหรับเจ้าหน้าที่ รปภ.",
    title: "เข้าสู่ระบบ",
    guardSubtitle: "หน้านี้ต้องเข้าสู่ระบบด้วยบัญชีเจ้าหน้าที่",
    subtitle: "ใช้อีเมลมหาวิทยาลัย @bumail.net",
    email: "อีเมล",
    password: "รหัสผ่าน",
  },
  admin: {
    eyebrow: "แผงควบคุม รปภ.",
    greeting: (name) => `สวัสดี, ${name}`,
    metricAwaiting: "รอเจ้าของมารับ",
    metricWaiting: "ของที่ยังไม่มีเจ้าของ",
    metricStale: (days) => `ค้างเกิน ${days} วัน`,
    metricReturned: "คืนแล้วเดือนนี้",
    tabReturns: "รอส่งคืน",
    tabStale: "ของค้างนาน",
    confirmedAgo: (relative) => `ยืนยันเมื่อ ${relative}`,
    confirmArmed: "ตรวจบัตรแล้ว ยืนยัน",
    confirm: "ยืนยันคืนแล้ว",
    emptyReturnsTitle: "ไม่มีรายการรอส่งคืน",
    emptyReturnsDescription: "เมื่อมีคนตอบคำถามยืนยันถูก รายการจะขึ้นที่นี่พร้อมรหัสรับของ",
    lookupPlaceholder: "ค้นหารหัสรับของ / รหัสนักศึกษา",
    lookupLabel: "ค้นหาคำขอรับคืน",
    noLookupMatch: (lookup) => `ไม่พบรายการที่ตรงกับ “${lookup}”`,
    staleEmptyTitle: "ไม่มีของค้างนาน",
    staleEmptyDescription: "ของทุกชิ้นได้รับการติดตามเรียบร้อย",
    staleNote: (days) => `ของที่ไม่มีเจ้าของมารับเกิน ${days} วัน ให้ส่งต่อฝ่ายอาคารสถานที่ตามระเบียบ`,
    foundAtPlace: (place, date) => `เจอที่ ${place} · ${date}`,
    days: (count) => `${count} วัน`,
  },
  errors: {
    unknown: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
    network: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองตรวจสอบอินเทอร์เน็ต",
    httpFailed: (status) => `คำขอล้มเหลว (HTTP ${status})`,
    uploadFailed: "อัปโหลดรูปไม่สำเร็จ",
    readPhotoFailed: "อ่านไฟล์รูปไม่สำเร็จ",
    required: (field) => `กรุณากรอก${field}`,
    badLogin: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    itemNotFound: "ไม่พบรายการนี้ อาจถูกลบไปแล้ว",
    alreadyClaimed: "มีผู้ยืนยันความเป็นเจ้าของรายการนี้แล้ว",
    tooManyAttempts: "ตอบผิดครบจำนวนครั้งแล้ว กรุณาติดต่อ รปภ. ที่จุดรับฝากโดยตรง",
    claimNotFound: "ไม่พบคำขอรับคืนนี้",
    alreadyReturned: "รายการนี้ยืนยันการคืนไปแล้ว",
    fields: { itemTitle: "ชื่อสิ่งของ", question: "คำถามยืนยัน", answer: "คำตอบยืนยัน", lostWhat: "สิ่งที่หาย", reporterName: "ชื่อผู้แจ้ง" },
  },
};
