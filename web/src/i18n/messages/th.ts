import type { CategoryId, FinderRewardStatus, FindStage, FoundItemStatus, LostNoticeProgress, LostReportStatus } from "../../api/contract";

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
    lostBoard: string;
    myReports: string;
    reportMenu: string;
    reportLostHint: string;
    reportFoundHint: string;
    myFinds: string;
    myFindsHint: string;
    myReportsHint: string;
    accountHint: string;
    accountMenu: string;
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
    cardMasked: string;
    photosLabel: string;
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
    ticketSaved: string;
    ticketSavedLink: string;
  };
  photo: {
    onlyImages: string;
    tooLarge: string;
    pickLabel: string;
    previewAlt: (position: number) => string;
    removeAt: (position: number) => string;
    viewerLabel: string;
    openViewer: (count: number) => string;
    previous: string;
    next: string;
    zoomIn: string;
    zoomOut: string;
    counter: (position: number, total: number) => string;
    cover: string;
    addMore: string;
    limit: (max: number) => string;
    dropHere: string;
    formats: (max: number) => string;
    choose: string;
  };
  reportFound: {
    title: string;
    description: string;
    step1Title: string;
    step1Description: string;
    titleLabel: string;
    titlePlaceholder: string;
    categoryLabel: string;
    descriptionLabel: string;
    descriptionHint: string;
    cardMaskNote: string;
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
    prefillNote: string;
    privateNote: string;
    sentTitle: string;
    sentLead: string;
    viewMyFinds: string;
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
    title: string;
    description: string;
    step1Title: string;
    whatLabel: string;
    whatPlaceholder: string;
    featuresLabel: string;
    featuresHint: string;
    photosLabel: string;
    photosHint: string;
    submitAndPay: (amount: number) => string;
    submittingToPay: string;
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
    myReportsLink: string;
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
    noAccount: string;
    registerLink: string;
    or: string;
    googleHint: string;
    googleUnavailable: string;
  };
  register: {
    title: string;
    subtitle: string;
    nameLabel: string;
    passwordHint: (min: number) => string;
    confirmLabel: string;
    passwordMismatch: string;
    submit: string;
    haveAccount: string;
    loginLink: string;
  };
  account: {
    title: string;
    subtitle: string;
    profileTitle: string;
    profileDescription: string;
    nameLabel: string;
    emailLocked: string;
    studentIdHint: string;
    save: string;
    saved: string;
    passwordTitle: string;
    currentPassword: string;
    newPassword: string;
    changePassword: string;
    passwordChanged: string;
    myReportsTitle: string;
    myReportsDescription: string;
    myReportsOpen: string;
  };
  myReports: {
    title: string;
    subtitle: string;
    newReport: string;
    claimsTitle: string;
    claimsHint: string;
    claimWaiting: string;
    claimReturned: string;
    reportsTitle: string;
    emptyTitle: string;
    emptyDescription: string;
    status: Record<LostReportStatus, string>;
    lostAtPlace: (place: string, date: string) => string;
    closedAgo: (relative: string) => string;
    matchesTitle: (count: number) => string;
    noMatchesYet: string;
    cancelReport: string;
    confirmCancel: string;
    keepOpen: string;
    submissionsTitle: (count: number) => string;
    submissionsHint: string;
    foundOn: (date: string) => string;
    lostVsFound: (lost: string, found: string) => string;
    samePlace: string;
    submittedAgo: (relative: string) => string;
    answerBy: (date: string) => string;
    pickupBy: (date: string) => string;
    confirmMine: string;
    confirmMineArmed: string;
    declineNotMine: string;
    declineArmed: string;
    confirmedNote: string;
    previous: string;
    next: string;
    slideLabel: (index: number, total: number) => string;
    selfFoundNote: (refund: number, fee: number) => string;
    selfFoundNoteNoReward: string;
  };
  myFinds: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyDescription: string;
    browseBoard: string;
    stage: Record<FindStage, string>;
    answersNotice: (title: string) => string;
    dropOffAt: (place: string) => string;
    rewardLine: (net: number) => string;
    rewardStatus: Record<FinderRewardStatus, string>;
  };
  lostBoard: {
    title: string;
    subtitle: string;
    privacyNote: string;
    lostNear: (place: string) => string;
    iFoundIt: string;
    emptyTitle: string;
    emptyDescription: string;
    listLabel: string;
    morePhotos: (count: number) => string;
    searchLabel: string;
    searchPlaceholder: string;
    locationLabel: string;
    allLocations: string;
    statSearching: string;
    statFound: string;
    noMatchTitle: string;
    noMatchDescription: string;
    expiryNote: (days: number) => string;
    progress: Record<LostNoticeProgress, string>;
    statAwaiting: string;
    scopeOpen: string;
  };
  reward: {
    sectionTitle: string;
    sectionDescription: string;
    none: string;
    customLabel: string;
    amount: (baht: number) => string;
    breakdown: (fee: number, net: number) => string;
    ruleRefund: (days: number) => string;
    ruleBoard: string;
    ruleCap: (max: number) => string;
    testModeNote: string;
    payNow: string;
    payPrompt: (amount: number) => string;
    payPromptBody: string;
    status: { awaiting_payment: string; held: string; pending_payout: string; paid_out: string; refunded: string; voided: string };
    heldUntil: (date: string) => string;
    paidNotice: string;
    boardBadge: string;
    tabPayouts: string;
    payoutsEmptyTitle: string;
    payoutsEmptyDescription: string;
    payoutsNote: string;
    payoutAmounts: (gross: number, fee: number, net: number) => string;
    payoutConfirm: string;
    payoutConfirmArmed: string;
    refundedAmount: (refund: number, fee: number) => string;
    checkoutTitle: string;
    checkoutFor: (title: string) => string;
    cardNumber: string;
    expiry: string;
    cvc: string;
    payButton: (amount: number) => string;
    testCardsTitle: string;
    testCardOk: string;
    testCardDeclined: string;
    checkoutGone: string;
    backToReports: string;
  };
  admin: {
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
    googleSignInFailed: string;
    itemNotFound: string;
    alreadyClaimed: string;
    tooManyAttempts: string;
    claimNotFound: string;
    alreadyReturned: string;
    passwordTooShort: (min: number) => string;
    emailTaken: string;
    wrongCurrentPassword: string;
    sessionExpired: string;
    lostReportNotFound: string;
    lostReportClosed: string;
    reportAwaitingPickup: string;
    reportHasSubmissions: string;
    submissionNotFound: string;
    submissionAlreadyConfirmed: string;
    declinedOwnFind: string;
    rewardInvalid: (min: number, max: number) => string;
    tooLong: (field: string, max: number) => string;
    titleTooLong: (max: number) => string;
    tooManyPhotos: (max: number) => string;
    rewardNotPayable: string;
    payoutNotFound: string;
    payoutDone: string;
    lostReportLinkInvalid: string;
    checkoutNotFound: string;
    cardDeclined: string;
    testCardOnly: string;
    fields: { itemTitle: string; question: string; answer: string; lostWhat: string; reporterName: string; displayName: string; description: string };
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
    lostBoard: "ประกาศตามหา",
    myReports: "ของที่ฉันแจ้งหาย",
    reportMenu: "แจ้ง",
    reportLostHint: "ทำของหาย ประกาศตามหาและตั้งรางวัลได้",
    reportFoundHint: "เก็บของได้ ประกาศให้เจ้าของมารับ",
    myFinds: "ของที่ฉันเจอ",
    myFindsHint: "ติดตามของที่คุณเก็บได้และรางวัล",
    myReportsHint: "ประกาศตามหาและของที่มีคนส่งมาให้",
    accountHint: "โปรไฟล์และรหัสผ่าน",
    accountMenu: "เมนูบัญชี",
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
    cardMasked: "ปิดเลขบัตรแล้ว",
    photosLabel: "รูปทั้งหมด",
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
    ticketSaved: "รหัสนี้เก็บไว้ในบัญชีแล้ว เปิดดูอีกครั้งได้ที่",
    ticketSavedLink: "ของที่ฉันแจ้งหาย",
  },
  photo: {
    onlyImages: "รองรับเฉพาะไฟล์รูปภาพ",
    tooLarge: "ไฟล์ใหญ่เกิน 15 MB",
    pickLabel: "เลือกรูปถ่าย",
    previewAlt: (position) => `รูปที่ ${position}`,
    removeAt: (position) => `ลบรูปที่ ${position}`,
    viewerLabel: "ดูรูป",
    openViewer: (count) => `ดูรูปทั้งหมด ${count} รูป`,
    previous: "รูปก่อนหน้า",
    next: "รูปถัดไป",
    zoomIn: "ซูมเข้า",
    zoomOut: "ซูมออก",
    counter: (position, total) => `${position} / ${total}`,
    cover: "รูปปก",
    addMore: "เพิ่มรูป",
    limit: (max) => `ใส่รูปได้สูงสุด ${max} รูป`,
    dropHere: "ถ่ายรูปหรือลากรูปมาวางที่นี่",
    formats: (max) => `JPG, PNG หรือ HEIC ไม่เกิน 15 MB ต่อรูป สูงสุด ${max} รูป · ระบบจะย่อขนาดให้อัตโนมัติ`,
    choose: "เลือกรูป",
  },
  reportFound: {
    title: "เจอของใครทำหาย? ช่วยส่งคืนกัน",
    description: "กรอกข้อมูลไม่ถึง 2 นาที ระบบจะประกาศให้ทั้งมหาวิทยาลัยเห็น และแจ้งเตือนคนที่แจ้งของหายที่ตรงกันผ่าน LINE",
    step1Title: "เจออะไร",
    step1Description: "รูปช่วยให้เจ้าของจำของตัวเองได้เร็วขึ้นมาก",
    titleLabel: "ชื่อสิ่งของ",
    titlePlaceholder: "เช่น iPhone เคสสีม่วง, กุญแจรถ Honda",
    categoryLabel: "หมวดหมู่",
    descriptionLabel: "รายละเอียดเพิ่มเติม",
    descriptionHint: "บอกลักษณะทั่วไป แต่เก็บจุดสังเกตเฉพาะไว้ตั้งเป็นคำถามยืนยัน",
    cardMaskNote: "ถ้าในรูปเห็นเลขบัตร ระบบจะตรวจและปิดเลขบัตรให้อัตโนมัติก่อนแสดงบนหน้าเว็บ",
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
    prefillNote: "กรอกชื่อ หมวด และบริเวณจากประกาศตามหาไว้ให้แล้ว แก้ให้ตรงกับของที่คุณเก็บได้จริง",
    privateNote: "ของที่ส่งจากประกาศนี้จะไม่ขึ้นบอร์ดสาธารณะ เจ้าของประกาศเห็นคนเดียว และระบบจะส่งอีเมลแจ้งให้ ไม่ต้องตั้งคำถามยืนยัน",
    sentTitle: "ส่งให้เจ้าของประกาศแล้ว",
    sentLead: "เราส่งอีเมลแจ้งเจ้าของแล้ว อย่าลืมนำของไปฝากที่",
    viewMyFinds: "ดูของที่ฉันเจอ",
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
    title: "บอกเราว่าหายอะไร เดี๋ยวช่วยตามให้",
    description: "ระบบจะเทียบกับของที่มีคนแจ้งเจอทันที และเฝ้าดูรายการใหม่ ๆ ให้ เมื่อเจอของที่น่าจะใช่จะส่งแจ้งเตือนหาคุณ",
    step1Title: "หายอะไร",
    whatLabel: "สิ่งที่หาย",
    whatPlaceholder: "เช่น กระเป๋าสตางค์หนังสีน้ำตาล",
    featuresLabel: "ลักษณะเด่น",
    featuresHint: "สี ยี่ห้อ ขนาด — ข้อความนี้แสดงบนบอร์ดประกาศตามหา อย่าใส่จุดสังเกตลับที่ใช้ยืนยันความเป็นเจ้าของ",
    photosLabel: "รูปของที่หาย",
    photosHint: "รูปที่เคยถ่ายไว้ช่วยให้คนเก็บได้จำของได้ง่ายขึ้น รูปจะแสดงบนบอร์ดประกาศตามหา",
    submitAndPay: (amount) => `แจ้งของหายและชำระรางวัล ${amount} บาท`,
    submittingToPay: "กำลังไปหน้าชำระเงิน",
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
    myReportsLink: "ดูของที่ฉันแจ้งหาย",
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
    noAccount: "ยังไม่มีบัญชี?",
    registerLink: "สมัครสมาชิก",
    or: "หรือ",
    googleHint: "Google ใช้ได้เฉพาะบัญชี @bumail.net และ @bu.ac.th",
    googleUnavailable: "โหลดปุ่มเข้าสู่ระบบด้วย Google ไม่ได้ ใช้อีเมลและรหัสผ่านแทนได้",
  },
  register: {
    title: "สมัครสมาชิก",
    subtitle: "สร้างบัญชีด้วยอีเมลมหาวิทยาลัย แจ้งของหายครั้งต่อไปไม่ต้องกรอกชื่อและอีเมลซ้ำ",
    nameLabel: "ชื่อ-นามสกุล",
    passwordHint: (min) => `อย่างน้อย ${min} ตัวอักษร`,
    confirmLabel: "ยืนยันรหัสผ่าน",
    passwordMismatch: "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
    submit: "สร้างบัญชี",
    haveAccount: "มีบัญชีอยู่แล้ว?",
    loginLink: "เข้าสู่ระบบ",
  },
  account: {
    title: "บัญชีของฉัน",
    subtitle: "แก้ไขชื่อ ช่องทางติดต่อ และรหัสผ่านของคุณ",
    profileTitle: "ข้อมูลส่วนตัว",
    profileDescription: "รปภ. ใช้ข้อมูลนี้ติดต่อกลับเมื่อเจอของของคุณ",
    nameLabel: "ชื่อที่แสดง",
    emailLocked: "อีเมลใช้เข้าสู่ระบบ เปลี่ยนไม่ได้",
    studentIdHint: "ตัวเลข 10 หลัก ใช้จับคู่เมื่อมีคนเจอบัตรนักศึกษาของคุณ",
    save: "บันทึกข้อมูล",
    saved: "บันทึกข้อมูลแล้ว",
    passwordTitle: "เปลี่ยนรหัสผ่าน",
    currentPassword: "รหัสผ่านปัจจุบัน",
    newPassword: "รหัสผ่านใหม่",
    changePassword: "เปลี่ยนรหัสผ่าน",
    passwordChanged: "เปลี่ยนรหัสผ่านแล้ว",
    myReportsTitle: "ของที่ฉันแจ้งหาย",
    myReportsDescription: "ติดตามประกาศ ดูของที่อาจตรงกัน และเปิดรหัสรับของย้อนหลัง",
    myReportsOpen: "เปิดดู",
  },
  myReports: {
    title: "ของที่ฉันแจ้งหาย",
    subtitle: "ประกาศของคุณ ของที่อาจตรงกัน (คำนวณใหม่ทุกครั้งที่เปิดหน้านี้) และรหัสรับของทั้งหมดอยู่ที่นี่",
    newReport: "แจ้งของหายเพิ่ม",
    claimsTitle: "รหัสรับของ",
    claimsHint: "แสดงรหัสนี้พร้อมบัตรนักศึกษาที่จุดรับฝาก",
    claimWaiting: "รอรับที่จุดรับฝาก",
    claimReturned: "รับของแล้ว",
    reportsTitle: "ประกาศของฉัน",
    emptyTitle: "ยังไม่มีประกาศของหาย",
    emptyDescription: "เมื่อแจ้งของหาย รายการจะขึ้นที่นี่พร้อมของที่อาจตรงกัน",
    status: { searching: "กำลังตามหา", found: "ได้คืนแล้ว", cancelled: "ยกเลิก", expired: "หมดอายุ" },
    lostAtPlace: (place, date) => `หายที่ ${place} · ${date}`,
    closedAgo: (relative) => `ปิดประกาศ ${relative}`,
    matchesTitle: (count) => `ของที่อาจตรงกัน ${count} ชิ้น`,
    noMatchesYet: "ยังไม่มีของที่ตรงกัน ลองกลับมาดูใหม่ภายหลัง",
    cancelReport: "ยกเลิกประกาศ",
    confirmCancel: "ยืนยันยกเลิก",
    keepOpen: "ยังตามหาอยู่",
    submissionsTitle: (count) => `มีคนส่งของที่อาจเป็นของคุณมา ${count} ชิ้น`,
    submissionsHint: "เห็นเฉพาะคุณเท่านั้น ถ้าใช่ของคุณ กด “นี่ของฉัน” เพื่อรับรหัสไปรับของ ถ้าไม่ใช่ ของชิ้นนั้นจะย้ายไปขึ้นบอร์ดของที่เจอแทน",
    foundOn: (date) => `เจอเมื่อ ${date}`,
    lostVsFound: (lost, found) => `หายที่ ${lost} · เจอที่ ${found}`,
    samePlace: "จุดเดียวกับที่หาย",
    submittedAgo: (relative) => `ส่งมาเมื่อ ${relative}`,
    answerBy: (date) => `ตอบภายใน ${date} ไม่งั้นของจะขึ้นบอร์ดของที่เจอ`,
    pickupBy: (date) => `ไปรับภายใน ${date} ไม่งั้นรหัสรับของจะถูกยกเลิก และของจะกลับมารอคุณตอบใหม่`,
    confirmMine: "นี่ของฉัน",
    confirmMineArmed: "ยืนยัน นี่ของฉัน",
    declineNotMine: "ไม่ใช่ของฉัน",
    declineArmed: "ยืนยัน ไม่ใช่ของฉัน",
    confirmedNote: "คุณยืนยันของแล้ว ใช้รหัสรับของด้านบนไปรับที่จุดฝาก พอ รปภ. ยืนยันคืนของ ประกาศจะปิดเองและรางวัลจะโอนให้คนเก็บได้",
    previous: "ก่อนหน้า",
    next: "ถัดไป",
    slideLabel: (index, total) => `ชิ้นที่ ${index} จาก ${total}`,
    selfFoundNote: (refund, fee) => `หาเจอเองแล้ว? กดยกเลิกประกาศ ไม่ต้องจ่ายรางวัลให้ใคร ระบบคืนเงิน ${refund} บาท (หักค่าธรรมเนียม ${fee} บาท)`,
    selfFoundNoteNoReward: "หาเจอเองแล้ว หรือไม่ต้องการตามหาต่อ กดยกเลิกประกาศได้เลย",
  },
  myFinds: {
    title: "ของที่ฉันเจอ",
    subtitle: "ติดตามว่าของที่คุณเก็บได้ถึงมือเจ้าของหรือยัง และรางวัลอยู่ขั้นไหน",
    emptyTitle: "ยังไม่มีของที่คุณแจ้งเจอ",
    emptyDescription: "เก็บของได้ใช่ไหม? ลองดูบอร์ดประกาศตามหาว่ามีใครกำลังหาอยู่",
    browseBoard: "ดูประกาศตามหา",
    stage: { posted: "ขึ้นบอร์ดแล้ว รอเจ้าของ", sent: "ส่งให้เจ้าของประกาศแล้ว รอยืนยัน", confirmed: "เจ้าของยืนยันแล้ว รอมารับ", returned: "เจ้าของรับของแล้ว" },
    answersNotice: (title) => `ตอบประกาศ “${title}”`,
    dropOffAt: (place) => `ฝากไว้ที่ ${place}`,
    rewardLine: (net) => `รางวัล ${net} บาท (หักค่าธรรมเนียมแล้ว)`,
    rewardStatus: { promised: "ได้เมื่อเจ้าของรับของ", pending_payout: "รอโอนรางวัล", paid_out: "โอนรางวัลแล้ว", forfeited: "ไม่ได้รับรางวัล" },
  },
  lostBoard: {
    title: "ประกาศตามหา",
    subtitle: "ของที่เพื่อน ๆ กำลังตามหาอยู่ ถ้าคุณเก็บได้ กด “ฉันเจอของชิ้นนี้” แล้วแจ้งเจอของตามปกติ ระบบจะแจ้งเจ้าของให้เอง",
    privacyNote: "บอร์ดนี้แสดงชื่อของ รายละเอียด รูป บริเวณที่หาย และวันที่ ไม่แสดงรหัสนักศึกษาหรือช่องทางติดต่อของเจ้าของ",
    lostNear: (place) => `หายแถว ${place}`,
    iFoundIt: "ฉันเจอของชิ้นนี้",
    emptyTitle: "ยังไม่มีใครตามหาของ",
    emptyDescription: "เมื่อมีคนแจ้งของหาย ประกาศจะขึ้นที่นี่",
    listLabel: "รายการประกาศตามหา",
    morePhotos: (count) => `+${count} รูป`,
    searchLabel: "ค้นหาประกาศตามหา",
    searchPlaceholder: "ลองพิมพ์ เช่น AirPods, บัตรนักศึกษา, ร่ม",
    locationLabel: "จุดที่หาย",
    allLocations: "ทุกจุดที่หาย",
    statSearching: "ประกาศที่กำลังตามหา",
    statFound: "ได้ของคืนแล้วเดือนนี้",
    noMatchTitle: "ไม่พบประกาศที่ตรงกับที่ค้นหา",
    noMatchDescription: "ลองเปลี่ยนคำค้น หมวดหมู่ หรือจุดที่หาย",
    expiryNote: (days) => `ประกาศที่เกิน ${days} วันจะถูกลบโดยอัตโนมัติ`,
    progress: { searching: "ยังไม่เจอ", found: "เจอแล้ว", awaiting_pickup: "ยืนยันแล้ว รอรับ", returned: "คืนแล้ว" },
    statAwaiting: "ยืนยันแล้ว รอมารับ",
    scopeOpen: "ยังไม่เจอ",
  },
  reward: {
    sectionTitle: "ตั้งรางวัลให้คนเก็บได้",
    sectionDescription: "ไม่บังคับ เงินจะถูกพักไว้ในระบบ และปล่อยให้คนเก็บได้หลัง รปภ. ยืนยันว่าคืนของแล้วเท่านั้น",
    none: "ไม่ตั้งรางวัล",
    customLabel: "จำนวนอื่น (บาท)",
    amount: (baht) => `${baht.toLocaleString("th-TH")} บาท`,
    breakdown: (fee, net) => `คนเก็บได้จะได้รับ ${net} บาท (หักค่าธรรมเนียม ${fee} บาท)`,
    ruleRefund: (days) => `ถ้ายกเลิกประกาศ หรือครบ ${days} วันแล้วยังไม่มีใครเจอ ระบบคืนเงินให้ (หักค่าธรรมเนียม)`,
    ruleBoard: "บอร์ดสาธารณะโชว์แค่ป้าย “มีรางวัล” ไม่บอกจำนวนเงิน",
    ruleCap: (max) => `ตั้งได้สูงสุด ${max} บาท`,
    testModeNote: "โหมดทดสอบ: ใช้บัตรทดสอบเท่านั้น ไม่มีการตัดเงินจริง",
    payNow: "ชำระรางวัล",
    payPrompt: (amount) => `ชำระรางวัล ${amount} บาท เพื่อเปิดใช้งาน`,
    payPromptBody: "หลังชำระแล้ว ประกาศของคุณจะขึ้นป้าย “มีรางวัล” บนบอร์ดประกาศตามหา",
    status: { awaiting_payment: "รอชำระเงิน", held: "พักเงินไว้แล้ว", pending_payout: "รอโอนให้คนเก็บได้", paid_out: "โอนให้คนเก็บได้แล้ว", refunded: "คืนเงินแล้ว", voided: "ยกเลิกรางวัล" },
    heldUntil: (date) => `ถ้ายังไม่มีใครเจอ จะคืนเงินอัตโนมัติวันที่ ${date}`,
    paidNotice: "ชำระเงินแล้ว รางวัลถูกพักไว้ในระบบ ถ้าสถานะยังไม่เปลี่ยน รอสักครู่แล้วรีเฟรช",
    boardBadge: "มีรางวัล",
    tabPayouts: "รอโอนรางวัล",
    payoutsEmptyTitle: "ไม่มีรางวัลรอโอน",
    payoutsEmptyDescription: "เมื่อ รปภ. ยืนยันคืนของที่มีรางวัล รายการจะขึ้นที่นี่",
    payoutsNote: "โหมดทดสอบ: ไม่มีการโอนเงินจริง กดยืนยันหลังบันทึกการโอนแล้ว",
    payoutAmounts: (gross, fee, net) => `${gross} − ค่าธรรมเนียม ${fee} = โอน ${net} บาท`,
    payoutConfirm: "ยืนยันโอนแล้ว",
    payoutConfirmArmed: "โอนแล้ว ยืนยัน",
    refundedAmount: (refund, fee) => `คืนเงินให้คุณ ${refund} บาท (หักค่าธรรมเนียม ${fee} บาท)`,
    checkoutTitle: "ชำระรางวัล",
    checkoutFor: (title) => `รางวัลสำหรับประกาศ “${title}”`,
    cardNumber: "หมายเลขบัตร",
    expiry: "วันหมดอายุ (ดด/ปป)",
    cvc: "CVC",
    payButton: (amount) => `จ่าย ${amount} บาท`,
    testCardsTitle: "บัตรทดสอบ (แตะเพื่อกรอก)",
    testCardOk: "ชำระสำเร็จ",
    testCardDeclined: "บัตรถูกปฏิเสธ",
    checkoutGone: "ลิงก์ชำระเงินนี้ใช้ไม่ได้แล้ว อาจชำระไปแล้วหรือประกาศถูกปิด",
    backToReports: "กลับไปที่ของที่ฉันแจ้งหาย",
  },
  admin: {
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
    googleSignInFailed: "ยืนยันตัวตนกับ Google ไม่สำเร็จ ลองใหม่อีกครั้ง",
    itemNotFound: "ไม่พบรายการนี้ อาจถูกลบไปแล้ว",
    alreadyClaimed: "มีผู้ยืนยันความเป็นเจ้าของรายการนี้แล้ว",
    tooManyAttempts: "ตอบผิดครบจำนวนครั้งแล้ว กรุณาติดต่อ รปภ. ที่จุดรับฝากโดยตรง",
    claimNotFound: "ไม่พบคำขอรับคืนนี้",
    alreadyReturned: "รายการนี้ยืนยันการคืนไปแล้ว",
    passwordTooShort: (min) => `รหัสผ่านต้องมีอย่างน้อย ${min} ตัวอักษร`,
    emailTaken: "อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทน",
    wrongCurrentPassword: "รหัสผ่านปัจจุบันไม่ถูกต้อง",
    sessionExpired: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง",
    lostReportNotFound: "ไม่พบประกาศนี้",
    lostReportClosed: "ประกาศนี้ปิดไปแล้ว",
    reportAwaitingPickup: "คุณยืนยันของชิ้นหนึ่งไปแล้ว รอรับของก่อน ยังยกเลิกประกาศไม่ได้",
    reportHasSubmissions: "มีของที่คนส่งมาให้คุณรอคำตอบอยู่ กด “นี่ของฉัน” หรือ “ไม่ใช่ของฉัน” ก่อนยกเลิกประกาศ",
    submissionNotFound: "ไม่พบของที่ส่งมา หรือถูกจัดการไปแล้ว",
    submissionAlreadyConfirmed: "คุณยืนยันของจากประกาศนี้ไปแล้ว",
    declinedOwnFind: "ของชิ้นนี้ถูกส่งมาที่ประกาศของคุณ และคุณแจ้งว่าไม่ใช่ของคุณแล้ว ถ้าเปลี่ยนใจ ติดต่อ รปภ. ที่จุดฝาก",
    rewardInvalid: (min, max) => `รางวัลต้องเป็นจำนวนเต็ม ${min}–${max} บาท`,
    tooLong: (field, max) => `${field}ยาวเกิน ${max} ตัวอักษร`,
    titleTooLong: (max) => `ชื่อยาวได้ไม่เกิน ${max} ตัวอักษร`,
    tooManyPhotos: (max) => `ใส่รูปได้สูงสุด ${max} รูป`,
    rewardNotPayable: "ประกาศนี้ไม่มีรางวัลที่รอชำระ",
    payoutNotFound: "ไม่พบรายการรางวัลนี้",
    payoutDone: "รางวัลนี้ยืนยันการโอนไปแล้ว",
    lostReportLinkInvalid: "เลือกได้เฉพาะประกาศที่ยังเปิดอยู่ของคุณเอง",
    checkoutNotFound: "ลิงก์ชำระเงินนี้ใช้ไม่ได้แล้ว",
    cardDeclined: "บัตรถูกปฏิเสธ ลองใช้บัตรอื่น",
    testCardOnly: "โหมดทดสอบรับเฉพาะบัตรทดสอบ 4242 4242 4242 4242",
    fields: { itemTitle: "ชื่อสิ่งของ", question: "คำถามยืนยัน", answer: "คำตอบยืนยัน", lostWhat: "สิ่งที่หาย", reporterName: "ชื่อผู้แจ้ง", displayName: "ชื่อ", description: "รายละเอียด" },
  },
};
