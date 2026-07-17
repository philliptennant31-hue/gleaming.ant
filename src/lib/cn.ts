// Tiny classname joiner. Filters out falsy values so conditional
// classes stay readable at the call site.
export type ClassValue = string | number | false | null | undefined

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
