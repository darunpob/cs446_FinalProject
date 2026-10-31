import { describe, expect, it } from "vitest";
import { findNumberBoxes, unturnBox } from "../src/api/mock/cardNumberMask";
import type { OcrWord } from "../src/api/mock/cardNumberMask";

const wordAt = (text: string, x0: number): OcrWord => ({ text, bbox: { x0, y0: 10, x1: x0 + 40, y1: 30 } });
const boxesFor = (...texts: string[]) => findNumberBoxes([texts.map((text, index) => wordAt(text, index * 50))]).map((box) => box.x0);

describe("card number detection", () => {
  it("finds a student ID, even inside a longer word or misread by OCR", () => {
    expect(boxesFor("BANGKOK", "1660702067")).toEqual([50]);
    expect(boxesFor("ID:1660702067")).toEqual([0]);
    expect(boxesFor("l66O702O67")).toEqual([0]);
  });

  it("finds numbers OCR split into short groups", () => {
    expect(boxesFor("1", "2345", "67890", "12", "3")).toEqual([0, 50, 100, 150, 200]);
    expect(boxesFor("166", "070", "206")).toEqual([0, 50, 100]);
  });

  it("leaves ordinary text and short numbers alone", () => {
    expect(boxesFor("BANGKOK", "UNIVERSITY", "ISBN", "BOSS")).toEqual([]);
    expect(boxesFor("Room", "12", "Floor", "3")).toEqual([]);
  });
});

describe("mapping boxes back from a turned photo", () => {
  const box = { x0: 10, y0: 20, x1: 30, y1: 25 };

  it("undoes a clockwise turn", () => {
    expect(unturnBox(box, 90, 100, 200)).toEqual({ x0: 20, y0: 170, x1: 25, y1: 190 });
  });

  it("undoes a counter-clockwise turn", () => {
    expect(unturnBox(box, 270, 100, 200)).toEqual({ x0: 75, y0: 10, x1: 80, y1: 30 });
  });

  it("keeps an upright box as it is", () => {
    expect(unturnBox(box, 0, 100, 200)).toEqual(box);
  });
});
