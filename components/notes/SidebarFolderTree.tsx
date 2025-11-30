'use client'

import { useState } from 'react'
import { notesTree } from '@/data/mock_notes'
import { ChevronDown, ChevronRight, FileText, Folder } from 'lucide-react'
import { TreeNode } from '@/types/notes'

interface SidebarProps {
  data?: TreeNode[]
  onNoteClick: (noteId: string | null) => void
  activeNoteId: string | null
}

const SidebarFolderTree = ({
  data = notesTree,
  onNoteClick,
  activeNoteId,
}: SidebarProps) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleFolder = (name: string) => {
    const newSet = new Set(expanded)
    if (newSet.has(name)) {
      newSet.delete(name)
    } else {
      newSet.add(name)
    }
    setExpanded(newSet)
  }

  const renderTree = (nodes: TreeNode[], depth = 0) => {
    return (
      <ul className="ml-2 space-y-1">
        {nodes.map((node) => (
          <li
            key={`${node.type}-${node.name}-${depth}-${node.type === 'note' ? node.id : ''}`}
            className="text-sm"
          >
            {node.type === 'folder' ? (
              <div>
                <button
                  onClick={() => toggleFolder(node.name)}
                  className="flex items-center gap-2 px-2 py-1 w-full hover:bg-muted rounded"
                >
                  {expanded.has(node.name) ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                  <Folder size={16} />
                  <span>{node.name}</span>
                </button>
                {expanded.has(node.name) &&
                  node.children &&
                  renderTree(node.children, depth + 1)}
              </div>
            ) : (
              <button
                onClick={() =>
                  node.id &&
                  onNoteClick(activeNoteId === node.id ? null : node.id)
                }
                className={`flex items-center gap-2 px-2 py-1 pl-6 w-full rounded transition-colors ${
                  activeNoteId === node.id
                    ? 'bg-primary text-white'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <FileText size={16} />
                <span>{node.name}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    )
  }

  return <div className="w-full">{renderTree(data)}</div>
}

export default SidebarFolderTree
