// Primary navigation, shared by the header and footer.
export interface NavItem {
  to: string
  label: string
}

export const PRIMARY_NAV: NavItem[] = [
  { to: '/services', label: 'Services' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/areas', label: 'Areas' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
]

export const INSTAGRAM_URL = 'https://www.instagram.com/gleaming.ant/'
