import { cookies } from "next/headers";
import { LANG_COOKIE, parseLang, t, type AppLang, type MessageKey } from "@/i18n/messages";

export { LANG_COOKIE, parseLang, t };
export type { AppLang, MessageKey };

export async function getRequestLang(): Promise<AppLang> {
  try {
    const store = await cookies();
    return parseLang(store.get(LANG_COOKIE)?.value);
  } catch {
    return "fr";
  }
}
