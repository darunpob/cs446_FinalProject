import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_PHOTOS, TITLE_MAX_LENGTH } from "../src/api/contract";
import type { NewFoundItem, NewLostReport } from "../src/api/contract";
import { MockLostFoundApi } from "../src/api/mock/mockClient";
import { openMockDatabase } from "../src/api/mock/mockDatabase";
import type { CardNumberMasker } from "../src/api/mock/cardNumberMask";

function worldWithImages(imageKeys: string[]) {
  const now = () => new Date("2026-10-29T10:00:00+07:00");
  const database = openMockDatabase(null, now);
  imageKeys.forEach((imageKey) => { database.db.images[imageKey] = `data:image/jpeg;base64,${imageKey}`; });
  let token: string | null = null;
  const api = new MockLostFoundApi({ database, now, latencyMs: 0, getAccessToken: () => token });
  const signIn = async () => { token = (await api.login("student@bumail.net", "student1234")).accessToken; };
  return { api, signIn };
}

const foundPhone: NewFoundItem = {
  title: "iPhone 15 Pro Max Natural Titanium", description: "", category: "electronics",
  foundLocationId: "loc-library", dropOffPointId: "drop-library", foundAt: "2026-10-29T01:00:00.000Z",
  imageKeys: [], verificationQuestion: "รูปพื้นหลังเป็นอะไร", verificationAnswer: "แมว",
};

const lostPhone: NewLostReport = {
  title: "iPhone 15", description: "เคสใสมีรอยร้าวที่มุม", category: "electronics", lastSeenLocationId: "loc-library",
  lostAt: "2026-10-28T09:00:00.000Z", imageKeys: [], studentId: "",
  contact: { name: "A", lineId: "", phone: "", email: "student@bumail.net" }, rewardAmount: 0,
};

describe("photos on notices", () => {
  it("keeps every uploaded photo of a found item in order, cover first", async () => {
    const { api, signIn } = worldWithImages(["img-a", "img-b", "img-c"]);
    await signIn();
    const created = await api.createFoundItem({ ...foundPhone, imageKeys: ["img-a", "img-b", "img-c"] });
    expect(created.imageUrls).toHaveLength(3);
    expect(created.imageUrl).toBe(created.imageUrls[0]);
    expect(created.imageUrls[2]).toContain("img-c");
  });

  it("rejects more photos than a notice can hold", async () => {
    const keys = Array.from({ length: MAX_PHOTOS + 1 }, (_, index) => `img-${index}`);
    const { api, signIn } = worldWithImages(keys);
    await signIn();
    await expect(api.createFoundItem({ ...foundPhone, imageKeys: keys })).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("shows a lost report's photos and description on the public board", async () => {
    const { api, signIn } = worldWithImages(["img-lost"]);
    await signIn();
    const { id } = await api.createLostReport({ ...lostPhone, imageKeys: ["img-lost"] });
    const notice = (await api.listOpenLostReports()).find((candidate) => candidate.id === id);
    if (!notice) throw new Error("expected the new notice on the board");
    expect(notice.imageUrls).toEqual(["data:image/jpeg;base64,img-lost"]);
    expect(notice.description).toBe(lostPhone.description);
  });

  it("rejects titles longer than a notice card can show", async () => {
    const { api, signIn } = worldWithImages([]);
    await signIn();
    const longTitle = "W".repeat(TITLE_MAX_LENGTH + 1);
    await expect(api.createFoundItem({ ...foundPhone, title: longTitle })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(api.createLostReport({ ...lostPhone, title: longTitle })).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("card numbers in uploaded photos", () => {
  const photo = new Blob(["original"], { type: "image/jpeg" });

  class BlobReader {
    result = "";
    onload = () => {};
    onerror = () => {};
    readAsDataURL(blob: Blob) {
      void blob.text().then((content) => {
        this.result = `data:${blob.type};base64,${btoa(content)}`;
        this.onload();
      });
    }
  }

  beforeEach(() => vi.stubGlobal("FileReader", BlobReader));
  afterEach(() => vi.unstubAllGlobals());

  function worldWithMasker(maskCardNumbers: CardNumberMasker) {
    const now = () => new Date("2026-10-29T10:00:00+07:00");
    const database = openMockDatabase(null, now);
    let token: string | null = null;
    const api = new MockLostFoundApi({ database, now, latencyMs: 0, getAccessToken: () => token, maskCardNumbers });
    return { api, database, signIn: async () => { token = (await api.login("student@bumail.net", "student1234")).accessToken; } };
  }

  it("stores the masked photo and flags the item", async () => {
    const { api, signIn } = worldWithMasker(async () => ({ photo: new Blob(["masked"], { type: "image/jpeg" }), masked: true }));
    await signIn();
    const { imageKey, imageUrl } = await api.uploadImage(photo);
    expect(atob(imageUrl.split(",")[1])).toBe("masked");
    expect(await api.createFoundItem({ ...foundPhone, imageKeys: [imageKey] })).toMatchObject({ cardNumberMasked: true, imageUrls: [imageUrl] });
  });

  it("does not flag a photo without a number", async () => {
    const { api, signIn } = worldWithMasker(async (original) => ({ photo: original, masked: false }));
    await signIn();
    const { imageKey } = await api.uploadImage(photo);
    expect(await api.createFoundItem({ ...foundPhone, imageKeys: [imageKey] })).toMatchObject({ cardNumberMasked: false });
  });

  it("never stores a photo it could not scan", async () => {
    const { api, database, signIn } = worldWithMasker(async () => { throw new Error("OCR unavailable"); });
    await signIn();
    await expect(api.uploadImage(photo)).rejects.toMatchObject({ code: "SERVER" });
    expect(database.db.images).toEqual({});
  });
});
