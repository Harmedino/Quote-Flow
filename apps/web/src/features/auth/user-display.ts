function words(name: string): string[] {
  return name.trim().split(/\s+/).filter(Boolean);
}

/** The first word of a person's name, for greetings. */
export function firstName(name: string): string {
  return words(name)[0] ?? '';
}

/** Up to two initials, from the first and last words of a name, e.g. "Amina Bello Yusuf" → "AY". */
export function initials(name: string): string {
  const parts = words(name);
  const first = parts[0];
  const last = parts.length > 1 ? parts.at(-1) : undefined;
  return [first, last]
    .map((word) => (word ? (Array.from(word)[0] ?? '') : ''))
    .join('')
    .toLocaleUpperCase();
}
