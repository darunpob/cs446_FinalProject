import type { Worker } from "tesseract.js";

/**
 * Stands in for the backend's Rekognition DetectText step (docs/API_CONTRACT.md §3), which the mock site has no server
 * for: tesseract.js reads the photo in the browser, so the same rules run before the photo is stored.
 */
export interface TextBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrWord {
  text: string;
  bbox: TextBox;
}

export interface MaskedPhoto {
  photo: Blob;
  masked: boolean;
}

export type CardNumberMasker = (photo: Blob) => Promise<MaskedPhoto>;

type QuarterTurn = 0 | 90 | 270;

const MIN_DIGIT_RUN = 4;
const MIN_READ_DIGITS = 3;
const MIN_SPLIT_NUMBER_DIGITS = 9;
const MIN_BOX_PADDING_PX = 4;
const BOX_PADDING_RATIO = 0.25;
const JPEG_QUALITY = 0.82;

/** A card can be photographed sideways, and OCR only reads text that is roughly upright. */
const SCAN_TURNS: QuarterTurn[] = [0, 90, 270];

const LOOKALIKE_DIGITS: Record<string, string> = { O: "0", o: "0", D: "0", I: "1", l: "1", "|": "1", S: "5", B: "8", Z: "2" };

function readAsDigits(text: string): string {
  return text.replace(/[\s.\-–_]/g, "").replace(/[OoDIl|SBZ]/g, (letter) => LOOKALIKE_DIGITS[letter]);
}

function isNumberWord(word: OcrWord): boolean {
  const realDigits = word.text.replace(/\D/g, "").length;
  return realDigits >= MIN_READ_DIGITS && new RegExp(`\\d{${MIN_DIGIT_RUN},}`).test(readAsDigits(word.text));
}

function isDigitsOnly(word: OcrWord): boolean {
  return /^\d+$/.test(readAsDigits(word.text));
}

/** "1 2345 67890 12 3" and "166 070 2067" reach OCR as short words: only the whole line shows they form one number. */
function splitNumberWords(line: OcrWord[]): OcrWord[] {
  const digitWords = line.filter(isDigitsOnly);
  const digitCount = digitWords.reduce((total, word) => total + readAsDigits(word.text).length, 0);
  return digitCount >= MIN_SPLIT_NUMBER_DIGITS ? digitWords : [];
}

export function findNumberBoxes(lines: OcrWord[][]): TextBox[] {
  return lines.flatMap((line) => {
    const splitNumber = splitNumberWords(line);
    return line.filter((word) => isNumberWord(word) || splitNumber.includes(word)).map((word) => word.bbox);
  });
}

/** Maps a box read from a photo turned clockwise by `turn` back onto the original of the given size. */
export function unturnBox(box: TextBox, turn: QuarterTurn, width: number, height: number): TextBox {
  if (turn === 90) return { x0: box.y0, y0: height - box.x1, x1: box.y1, y1: height - box.x0 };
  if (turn === 270) return { x0: width - box.y1, y0: box.x0, x1: width - box.y0, y1: box.x1 };
  return box;
}

function padBox(box: TextBox): TextBox {
  const padding = Math.max(MIN_BOX_PADDING_PX, (box.y1 - box.y0) * BOX_PADDING_RATIO);
  return { x0: box.x0 - padding, y0: box.y0 - padding, x1: box.x1 + padding, y1: box.y1 + padding };
}

let ocrWorker: Promise<Worker> | null = null;

function openOcrWorker(): Promise<Worker> {
  ocrWorker ??= import("tesseract.js").then(({ createWorker }) => createWorker("eng"));
  ocrWorker.catch(() => { ocrWorker = null; });
  return ocrWorker;
}

function requireContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  return context;
}

function turnedCopy(source: HTMLCanvasElement, turn: QuarterTurn): HTMLCanvasElement {
  if (turn === 0) return source;
  const turned = document.createElement("canvas");
  turned.width = source.height;
  turned.height = source.width;
  const context = requireContext(turned);
  context.translate(turned.width / 2, turned.height / 2);
  context.rotate((turn * Math.PI) / 180);
  context.drawImage(source, -source.width / 2, -source.height / 2);
  return turned;
}

async function readWordLines(worker: Worker, canvas: HTMLCanvasElement): Promise<OcrWord[][]> {
  const { data } = await worker.recognize(canvas, {}, { blocks: true });
  return (data.blocks ?? []).flatMap((block) => block.paragraphs.flatMap((paragraph) => paragraph.lines.map((line) => line.words)));
}

async function scanForNumbers(worker: Worker, canvas: HTMLCanvasElement): Promise<TextBox[]> {
  for (const turn of SCAN_TURNS) {
    const boxes = findNumberBoxes(await readWordLines(worker, turnedCopy(canvas, turn)));
    if (boxes.length > 0) return boxes.map((box) => unturnBox(box, turn, canvas.width, canvas.height));
  }
  return [];
}

function exportJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))), "image/jpeg", JPEG_QUALITY);
  });
}

export const maskCardNumbersInBrowser: CardNumberMasker = async (photo) => {
  const bitmap = await createImageBitmap(photo);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = requireContext(canvas);
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const boxes = await scanForNumbers(await openOcrWorker(), canvas);
  if (boxes.length === 0) return { photo, masked: false };
  context.fillStyle = "#111";
  boxes.map(padBox).forEach(({ x0, y0, x1, y1 }) => context.fillRect(x0, y0, x1 - x0, y1 - y0));
  return { photo: await exportJpeg(canvas), masked: true };
};
