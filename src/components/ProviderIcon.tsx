import type { AuthProvider } from "@/lib/types";
import { Icon } from "./Icon";

/** Brand marks for the sign-in buttons. Inline SVG so nothing is fetched. */
export function ProviderIcon({ provider, size = 20 }: { provider: AuthProvider; size?: number }) {
  if (provider === "google") {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.4-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.2-.1-2.4-.4-3.5z"
        />
      </svg>
    );
  }
  if (provider === "apple") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M16.4 12.7c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9C6.1 7 4.5 8 3.6 9.5c-1.9 3.2-.5 8 1.3 10.6.9 1.3 2 2.7 3.4 2.7 1.4-.1 1.9-.9 3.5-.9s2.1.9 3.5.9c1.5 0 2.4-1.3 3.3-2.6 1-1.5 1.5-3 1.5-3.1-.1 0-2.9-1.1-2.7-4.4zM14 5.4c.7-.9 1.2-2.1 1.1-3.4-1.1 0-2.4.7-3.1 1.6-.7.8-1.3 2-1.1 3.3 1.2.1 2.4-.6 3.1-1.5z" />
      </svg>
    );
  }
  if (provider === "kakao") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.7 1.8 5.1 4.5 6.5l-1.1 4.1c-.1.3.3.6.6.4l4.8-3.2c.4 0 .8.1 1.2.1 5.5 0 10-3.5 10-7.9S17.5 3 12 3z" />
      </svg>
    );
  }
  if (provider === "email") return <Icon name="mail" size={size} />;
  return <Icon name="person" size={size} />;
}
