// Shared styling for form controls (Input, Textarea, Select) so every field
// looks and focuses identically.
export const fieldBase =
  'w-full rounded-[10px] border bg-white px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink-soft/55 transition-[border-color,box-shadow] focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-teal focus:ring-teal/25 disabled:opacity-60'

export const fieldNormal = 'border-ink/15 hover:border-ink/25'
export const fieldError = 'border-danger focus:border-danger focus:ring-danger/25'

export const fieldLabel = 'text-sm font-semibold text-ink'
