import { isUniversityEmail } from "../contract";
import { ApiError } from "../errors";
import { messages } from "../../i18n/locale";

const GOOGLE_ISSUERS = ["accounts.google.com", "https://accounts.google.com"];

export interface GoogleIdentity {
  email: string;
  displayName: string;
}

interface GoogleClaims {
  iss?: string;
  aud?: string;
  exp?: number;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

function decodeClaims(idToken: string): GoogleClaims {
  const encodedClaims = idToken.split(".")[1];
  if (!encodedClaims) throw new ApiError("UNAUTHORIZED", messages().errors.googleSignInFailed, 401);
  try {
    const base64 = encodedClaims.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as GoogleClaims;
  } catch {
    throw new ApiError("UNAUTHORIZED", messages().errors.googleSignInFailed, 401);
  }
}

/**
 * Mock-only stand-in for the backend check: it reads the claims but cannot verify Google's signature,
 * so the real API must verify the token with Google's public keys before trusting any of this.
 */
export function readGoogleIdentity(idToken: string, clientId: string, now: Date): GoogleIdentity {
  const claims = decodeClaims(idToken);
  const failed = new ApiError("UNAUTHORIZED", messages().errors.googleSignInFailed, 401);
  if (!GOOGLE_ISSUERS.includes(claims.iss ?? "") || claims.aud !== clientId) throw failed;
  if (!claims.exp || claims.exp * 1000 <= now.getTime()) throw failed;
  if (!claims.email || claims.email_verified !== true) throw failed;
  const email = claims.email.trim().toLowerCase();
  if (!isUniversityEmail(email)) throw new ApiError("FORBIDDEN", messages().reportLost.emailNotUniversity, 403);
  return { email, displayName: claims.name?.trim() || email.split("@")[0] };
}
