import { TreeNode } from '@/types/notes'

export const notesTree: TreeNode[] = [
  {
    name: 'Semester 2',
    type: 'folder',
    children: [
      {
        name: 'DS',
        type: 'folder',
        children: [
          {
            name: 'Stacks and Queues',
            type: 'note',
            noteType: 'pdf',
            id: 'ds1',
          },
        ],
      },
      {
        name: 'OOPS',
        type: 'folder',
        children: [
          {
            name: 'Inheritance',
            type: 'note',
            noteType: 'pdf',
            id: 'oops1',
          },
        ],
      },
      {
        name: 'COA',
        type: 'folder',
        children: [
          {
            name: 'Instruction Formats',
            type: 'note',
            noteType: 'pdf',
            id: 'coa1',
          },
        ],
      },
      {
        name: 'WDA',
        type: 'folder',
        children: [
          {
            name: 'HTML Basics',
            type: 'note',
            noteType: 'pdf',
            id: 'wda1',
          },
        ],
      },
    ],
  },
]

export type NoteContent = {
  title: string
  type: 'pdf'
  url: string
  updatedAt: string
}

export const notesContent: { [id: string]: NoteContent } = {
  ds1: {
    title: 'Stacks and Queues',
    type: 'pdf',
    url: '/docs/sample1.pdf',
    updatedAt: '2025-06-20',
  },
  oops1: {
    title: 'Inheritance',
    type: 'pdf',
    url: '/docs/sample2.pdf',
    updatedAt: '2025-06-19',
  },
  coa1: {
    title: 'Instruction Formats',
    type: 'pdf',
    url: '/docs/sample3.pdf',
    updatedAt: '2025-06-18',
  },
  wda1: {
    title: 'HTML Basics',
    type: 'pdf',
    url: '/docs/sample4.pdf',
    updatedAt: '2025-06-17',
  },
}
