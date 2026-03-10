'use client'

import { useState } from 'react'
import { notesTree } from '@/data/mock_notes'
import { ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react'
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

  const toggleFolder = (key: string) => {
    const newSet = new Set(expanded)
    if (newSet.has(key)) {
      newSet.delete(key)
    } else {
      newSet.add(key)
    }
    setExpanded(newSet)
  }

  const renderTree = (nodes: TreeNode[], depth = 0, parentKey = '') => {
    return (
      <ul className={`space-y-0.5 ${depth > 0 ? 'ml-3 border-l border-border pl-2' : ''}`}>
        {nodes.map((node) => {
          const nodeKey = `${parentKey}/${node.type}-${node.name}-${node.type === 'note' ? node.id : ''}`
          return (
            <li key={nodeKey}>
              {node.type === 'folder' ? (
                <div>
                  <button
                    onClick={() => toggleFolder(nodeKey)}
                    className="flex items-center gap-2 px-2 py-1.5 w-full rounded-md text-sm text-foreground hover:bg-muted transition-colors duration-150"
                  >
                    <ChevronRight
                      size={14}
                      className={`text-muted-foreground transition-transform duration-150 flex-shrink-0 ${expanded.has(nodeKey) ? 'rotate-90' : ''}`}
                    />
                    {expanded.has(nodeKey) ? (
                      <FolderOpen size={15} className="text-muted-foreground flex-shrink-0" />
                    ) : (
                      <Folder size={15} className="text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="truncate font-medium">{node.name}</span>
                  </button>
                  {expanded.has(nodeKey) && node.children && renderTree(node.children, depth + 1, nodeKey)}
                </div>
              ) : (
                <button
                  onClick={() =>
                    node.id &&
                    onNoteClick(activeNoteId === node.id ? null : node.id)
                  }
                  className={`flex items-center gap-2 px-2 py-1.5 w-full rounded-md text-sm transition-colors duration-150
                    ${activeNoteId === node.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                  <FileText size={14} className="flex-shrink-0" />
                  <span className="truncate">{node.name}</span>
                </button>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return <div className="w-full py-1">{renderTree(data)}</div>
}

export default SidebarFolderTree
