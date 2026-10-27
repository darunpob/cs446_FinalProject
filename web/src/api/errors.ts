export type ApiErrorCode =
  | "NOT_FOUND"
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "TOO_MANY_ATTEMPTS"
  | "NETWORK"
  | "SERVER";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly httpStatus: number;

  constructor(code: ApiErrorCode, message: string, httpStatus = 0) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

const CODE_BY_STATUS: Record<number, ApiErrorCode> = {
  400: "VALIDATION",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "TOO_MANY_ATTEMPTS",
};

export function codeForStatus(httpStatus: number): ApiErrorCode {
  return CODE_BY_STATUS[httpStatus] ?? "SERVER";
}

export function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
}
