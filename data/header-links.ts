// Define types for the header links structure
export type HeaderLink = {
  name: string
  url: string
}

export type HeaderLinkGroup = {
  name: string
  items: HeaderLink[]
}

export type HeaderLinkItem = HeaderLink | HeaderLinkGroup

// Grouped links for dropdown navigation
export const headerLinks: HeaderLinkItem[] = [
  { name: 'Quick Reads', url: '/quick-reads' },
  {
    name: 'Study Material',
    items: [
      { name: 'Notes', url: '/notes' },
      { name: 'Question Papers', url: '/papers' },
    ],
  },
  { name: 'Marketplace', url: '/marketplace' },
  { name: 'Chat', url: '/chat' },
  {
    name: 'Community',
    items: [
      { name: 'Newcomers', url: '/newcomers' },
      { name: 'Contributors', url: '/contributors' },
    ],
  },
]

// Utility function to check if a link is a group
export function isLinkGroup(link: HeaderLinkItem): link is HeaderLinkGroup {
  return 'items' in link
}
