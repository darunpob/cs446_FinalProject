import { messages } from "../i18n/locale";
import { ApiError, codeForStatus } from "./errors";
import type {
  CampusDirectory,
  CampusStats,
  Claim,
  ClaimOutcome,
  FoundItem,
  FoundItemQuery,
  LostFoundApi,
  LostReportReceipt,
  NewClaim,
  NewFoundItem,
  NewLostReport,
  Session,
  StaleItem,
  UploadTicket,
} from "./contract";

type TokenSource = () => string | null;

interface ErrorBody {
  error?: { code?: string; message?: string };
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorBody;
    return body.error?.message ?? messages().errors.httpFailed(response.status);
  } catch (parseError) {
    console.warn("Error body was not JSON", parseError);
    return messages().errors.httpFailed(response.status);
  }
}

function toQueryString(query: FoundItemQuery): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, String(value));
  });
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export function createHttpApi(baseUrl: string, getAccessToken: TokenSource): LostFoundApi {
  const root = baseUrl.replace(/\/+$/, "");

  async function call<Body>(path: string, init: RequestInit = {}): Promise<Body> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body) headers.set("Content-Type", "application/json");
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    let response: Response;
    try {
      response = await fetch(`${root}${path}`, { ...init, headers });
    } catch (networkError) {
      console.error("Network failure", networkError);
      throw new ApiError("NETWORK", messages().errors.network);
    }
    if (!response.ok) {
      throw new ApiError(codeForStatus(response.status), await readErrorMessage(response), response.status);
    }
    return (await response.json()) as Body;
  }

  const post = <Body>(path: string, body: unknown) => call<Body>(path, { method: "POST", body: JSON.stringify(body) });

  return {
    getDirectory: () => call<CampusDirectory>("/locations"),
    getStats: () => call<CampusStats>("/stats"),
    listFoundItems: async (query) => (await call<{ items: FoundItem[] }>(`/items${toQueryString(query)}`)).items,
    getFoundItem: (itemId) => call<FoundItem>(`/items/${encodeURIComponent(itemId)}`),
    uploadImage: async (photo) => {
      const ticket = await post<UploadTicket>("/uploads", { contentType: photo.type || "image/jpeg" });
      const upload = await fetch(ticket.uploadUrl, { method: "PUT", body: photo, headers: { "Content-Type": photo.type } });
      if (!upload.ok) throw new ApiError("SERVER", messages().errors.uploadFailed, upload.status);
      return { imageKey: ticket.imageKey, imageUrl: ticket.imageUrl };
    },
    createFoundItem: (draft: NewFoundItem) => post<FoundItem>("/items", draft),
    createLostReport: (draft: NewLostReport) => post<LostReportReceipt>("/lost-reports", draft),
    submitClaim: ({ itemId, ...answerForm }: NewClaim) => post<ClaimOutcome>(`/items/${encodeURIComponent(itemId)}/claims`, answerForm),
    listPendingReturns: async () => (await call<{ claims: Claim[] }>("/admin/claims?status=verified")).claims,
    confirmReturn: (claimId) => post<Claim>(`/admin/claims/${encodeURIComponent(claimId)}/return`, {}),
    listStaleItems: async (minDays) => (await call<{ items: StaleItem[] }>(`/admin/items/stale?days=${minDays}`)).items,
    login: (email, password) => post<Session>("/auth/login", { email, password }),
  };
}
