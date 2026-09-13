// Per-device UI preferences (localStorage — no server round-trip needed).
export const PER_PAGE_KEY = "st_per_page";
export const PER_PAGE_VALUES = ["10", "20", "50"] as const;

export function getDefaultPerPage(): string {
  if (typeof window === "undefined") return "10";
  const v = window.localStorage.getItem(PER_PAGE_KEY);
  return v === "20" || v === "50" ? v : "10";
}

export function setDefaultPerPage(v: string) {
  if (v === "20" || v === "50" || v === "10") {
    window.localStorage.setItem(PER_PAGE_KEY, v);
  }
}
