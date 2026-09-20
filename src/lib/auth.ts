import type { AuthProvider, User } from "./types.ts";

/**
 * Sign-in for the web MVP.
 *
 * There is no backend yet, so every provider resolves to a local profile and
 * nothing leaves the device (deck "Local-first MVP"). The shape is the one a
 * real adapter will return, so swapping in NextAuth / Firebase Auth later is
 * a one-file change: replace `signInWith` and keep `User` as-is.
 *
 *   google → NextAuth GoogleProvider (needs GOOGLE_CLIENT_ID/SECRET)
 *   apple  → Sign in with Apple (needs an Apple Services ID)
 *   kakao  → Kakao Login REST (needs a Kakao app key)
 */

const MOCK_LATENCY_MS = 650;

const MOCK_PROFILES: Record<Exclude<AuthProvider, "email" | "guest">, Pick<User, "name" | "email">> = {
  google: { name: "하은", email: "haeun@gmail.com" },
  apple: { name: "하은", email: "haeun@privaterelay.appleid.com" },
  kakao: { name: "하은", email: "haeun@kakao.com" },
};

function newId(provider: AuthProvider) {
  return `${provider}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface SignInOptions {
  /** Required for the email provider. */
  email?: string;
  /** Optional display name (email / guest). */
  name?: string;
}

/** Resolves with a `User` after a short, provider-like delay. */
export async function signInWith(provider: AuthProvider, options: SignInOptions = {}): Promise<User> {
  await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS));
  const signedInAt = new Date().toISOString();

  if (provider === "guest") {
    return { id: newId(provider), provider, name: options.name?.trim() || "게스트", signedInAt };
  }
  if (provider === "email") {
    const email = options.email?.trim().toLowerCase() ?? "";
    if (!isValidEmail(email)) throw new Error("이메일 주소를 확인해 주세요");
    const name = options.name?.trim() || email.split("@")[0];
    return { id: newId(provider), provider, name, email, signedInAt };
  }
  const profile = MOCK_PROFILES[provider];
  return { id: newId(provider), provider, ...profile, signedInAt };
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}
