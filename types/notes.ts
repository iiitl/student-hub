export type TreeNode =
  | {
      name: string
      type: 'folder'
      children: TreeNode[]
    }
  | {
      name: string
      type: 'note'
      noteType: 'text' | 'pdf' | 'code' | 'todo'
      id: string
    }
