const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function fetchAPI<T>(path: string, revalidate = 300): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function settingsToRecord(settings: any[] | null): Record<string, string> {
  if (!settings || !Array.isArray(settings)) return {};
  const record: Record<string, string> = {};
  for (const s of settings) {
    record[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
  }
  return record;
}
