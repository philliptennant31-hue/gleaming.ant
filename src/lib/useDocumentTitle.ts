import { useEffect } from 'react'

/** Keep the document <title> in sync with the current page (SPA SEO/a11y). */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}
