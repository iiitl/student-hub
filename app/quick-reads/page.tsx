'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Edit,
  ClipboardList,
  Send,
  X,
  Eye,
  FileEdit,
  Save,
} from 'lucide-react'

// Custom markdown renderers for proper styling (GitHub-like)
type MarkdownComponentProps = React.HTMLAttributes<HTMLElement> & {
  node?: unknown
  inline?: boolean
  href?: string
}

const markdownComponents = {
  code({
    node,
    inline,
    className,
    children,
    ...props
  }: MarkdownComponentProps) {
    if (inline) {
      return (
        <code
          className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-1.5 py-0.5 mx-0.5 rounded-sm font-mono text-[0.85em]"
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code
        className="font-mono text-[0.85em] text-gray-900 dark:text-gray-100"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre({ node, children, ...props }: MarkdownComponentProps) {
    return (
      <pre
        className="bg-gray-50 dark:bg-gray-800/50 p-4 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 mb-4"
        {...props}
      >
        {children}
      </pre>
    )
  },
  p({ node, children, ...props }: MarkdownComponentProps) {
    return (
      <p className="mb-2 leading-relaxed" {...props}>
        {children}
      </p>
    )
  },
  a({ node, href, children, ...props }: MarkdownComponentProps) {
    return (
      <a
        href={href}
        className="text-blue-600 dark:text-blue-400 no-underline border-b border-blue-600 dark:border-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:border-blue-800 dark:hover:border-blue-300"
        {...props}
      >
        {children}
      </a>
    )
  },
  h1({ node, children, ...props }: MarkdownComponentProps) {
    return (
      <h1 className="text-2xl font-bold mb-2 mt-4 text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </h1>
    )
  },
  h2({ node, children, ...props }: MarkdownComponentProps) {
    return (
      <h2 className="text-xl font-bold mb-1.5 mt-3 text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </h2>
    )
  },
  h3({ node, children, ...props }: MarkdownComponentProps) {
    return (
      <h3 className="text-lg font-bold mb-1 mt-2 text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </h3>
    )
  },
  blockquote({ node, children, ...props }: MarkdownComponentProps) {
    return (
      <blockquote
        className="border-l-4 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 pl-4 my-2"
        {...props}
      >
        {children}
      </blockquote>
    )
  },
}

type CategoryType = {
  _id: string
  name: string
  content: string
  visibility: 'public' | 'college_only'
  order: number
}

type PendingChange = {
  id: string
  changeType: 'add' | 'edit' | 'delete'
  targetType: 'category'
  targetCategoryId?: string
  proposedData: {
    categoryName?: string
    oldContent?: string
    newContent?: string
    visibility?: 'public' | 'college_only'
  }
}

let localIdCounter = 0
const nextLocalId = () => `local_${Date.now()}_${++localIdCounter}`

export default function QuickReads() {
  const { data: session } = useSession()

  // Data
  const [categories, setCategories] = useState<CategoryType[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  // Auth
  const [canManage, setCanManage] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Editor
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editVisibility, setEditVisibility] = useState<
    'public' | 'college_only'
  >('public')
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Staging (non-admin)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [localCategories, setLocalCategories] = useState<
    {
      id: string
      name: string
      content: string
      visibility: 'public' | 'college_only'
    }[]
  >([])
  const [localContentEdits, setLocalContentEdits] = useState<
    Record<string, { content: string; visibility: 'public' | 'college_only' }>
  >({})
  const [deletedCategoryIds, setDeletedCategoryIds] = useState<Set<string>>(
    new Set()
  )

  // Toast
  const [toast, setToast] = useState<string | null>(null)
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false)
  const [isStagingOpen, setIsStagingOpen] = useState(false)

  // Category modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [catNameInput, setCatNameInput] = useState('')
  const [catVisibilityInput, setCatVisibilityInput] = useState<
    'public' | 'college_only'
  >('public')

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 5000)
  }

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/quick_read_categories')
        const data = await res.json()
        if (data.success && data.categories.length > 0) {
          setCategories(data.categories)
          const saved = localStorage.getItem('quickReadsCategory')
          const valid =
            saved && data.categories.some((c: CategoryType) => c.name === saved)
          setActiveCategory(valid ? saved : data.categories[0].name)
        }
      } catch (err) {
        console.error('Failed to load categories', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCategories()
  }, [])

  // Auth check
  useEffect(() => {
    let isMounted = true
    const checkRoles = async () => {
      try {
        const res = await fetch('/api/user/roles')
        if (res.ok) {
          const data = await res.json()
          const isSuperAdmin = data.email === 'technicalclub@iiitl.ac.in'
          const hasAdminRole =
            Array.isArray(data.roles) && data.roles.includes('admin')
          if (isMounted) {
            setCanManage(isSuperAdmin || hasAdminRole)
            setIsLoggedIn(true)
          }
        } else if (isMounted && session?.user) {
          const isSuperSession =
            session.user.email === 'technicalclub@iiitl.ac.in'
          const hasAdminSession =
            Array.isArray(session.user.roles) &&
            session.user.roles.includes('admin')
          setCanManage(isSuperSession || hasAdminSession)
          setIsLoggedIn(true)
        }
      } catch {
        if (isMounted && session?.user) {
          setIsLoggedIn(true)
        }
      }
    }
    if (session?.user) checkRoles()
    else {
      setCanManage(false)
      setIsLoggedIn(false)
    }
    return () => {
      isMounted = false
    }
  }, [session])

  const handleCategoryChange = useCallback((name: string) => {
    setActiveCategory(name)
    localStorage.setItem('quickReadsCategory', name)
    setIsEditing(false)
    setShowPreview(false)
  }, [])

  // Computed
  const allCategories = [
    ...categories.filter((c) => !deletedCategoryIds.has(c._id)),
    ...localCategories.map((lc) => ({
      _id: lc.id,
      name: lc.name,
      content: lc.content,
      visibility: lc.visibility,
      order: 999,
    })),
  ]

  const activeData = allCategories.find((c) => c.name === activeCategory)
  const isLocalCategory = (name: string) =>
    localCategories.some((lc) => lc.name === name)

  // Get the effective content (local edits take priority)
  const getContent = () => {
    if (localContentEdits[activeCategory] !== undefined) {
      return localContentEdits[activeCategory].content
    }
    return activeData?.content || ''
  }

  const getVisibility = () => {
    if (localContentEdits[activeCategory] !== undefined) {
      return localContentEdits[activeCategory].visibility
    }
    return activeData?.visibility || 'public'
  }

  // ---- Editor actions ----
  const startEditing = () => {
    setEditContent(getContent())
    setEditVisibility(getVisibility())
    setIsEditing(true)
    setShowPreview(false)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setShowPreview(false)
  }

  // Admin: save directly
  const adminSaveContent = async () => {
    if (!activeData) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/quick_read_categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeData._id,
          content: editContent,
          visibility: editVisibility,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to save')

      setCategories((prev) =>
        prev.map((c) =>
          c._id === activeData._id
            ? { ...c, content: editContent, visibility: editVisibility }
            : c
        )
      )
      setIsEditing(false)
      showToast('Content saved successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error saving')
    } finally {
      setIsSaving(false)
    }
  }

  // Non-admin: stage content edit
  const stageContentEdit = () => {
    if (!activeData) return
    const oldContent = activeData.content || ''
    const oldVisibility = activeData.visibility || 'public'
    const isLocal = isLocalCategory(activeCategory)

    if (isLocal) {
      // Update local category content directly
      setLocalCategories((prev) =>
        prev.map((lc) =>
          lc.name === activeCategory
            ? { ...lc, content: editContent, visibility: editVisibility }
            : lc
        )
      )
      // Update the pending add change
      setPendingChanges((prev) =>
        prev.map((pc) =>
          pc.proposedData?.categoryName === activeCategory &&
          pc.changeType === 'add'
            ? {
                ...pc,
                proposedData: {
                  ...pc.proposedData,
                  newContent: editContent,
                  visibility: editVisibility,
                },
              }
            : pc
        )
      )
    } else {
      // Stage an edit for an existing category
      setLocalContentEdits((prev) => ({
        ...prev,
        [activeCategory]: { content: editContent, visibility: editVisibility },
      }))

      // Remove existing edit for this category if any
      setPendingChanges((prev) =>
        prev.filter(
          (pc) =>
            !(
              pc.targetCategoryId === activeData._id && pc.changeType === 'edit'
            )
        )
      )

      const changeId = nextLocalId()
      setPendingChanges((prev) => [
        ...prev,
        {
          id: changeId,
          changeType: 'edit',
          targetType: 'category',
          targetCategoryId: activeData._id,
          proposedData: {
            categoryName: activeCategory,
            oldContent,
            newContent: editContent,
            visibility: editVisibility,
          },
        },
      ])
    }

    setIsEditing(false)
    showToast('Content edit staged. Click "Propose Changes" to submit.')
  }

  const handleSaveContent = canManage ? adminSaveContent : stageContentEdit

  // ---- Category actions ----
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    const name = catNameInput.trim()
    if (!name) return

    if (canManage) {
      // Admin: create immediately
      const createCategory = async () => {
        try {
          const res = await fetch('/api/quick_read_categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, visibility: catVisibilityInput }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.message || 'Failed')
          setCategories((prev) => [...prev, data.category])
          handleCategoryChange(data.category.name)
          setIsCategoryModalOpen(false)
        } catch (err) {
          alert(err instanceof Error ? err.message : 'Error')
        }
      }
      createCategory()
    } else {
      // Non-admin: stage
      const localId = nextLocalId()
      setLocalCategories((prev) => [
        ...prev,
        { id: localId, name, content: '', visibility: catVisibilityInput },
      ])
      setPendingChanges((prev) => [
        ...prev,
        {
          id: localId,
          changeType: 'add',
          targetType: 'category',
          proposedData: {
            categoryName: name,
            newContent: '',
            visibility: catVisibilityInput,
          },
        },
      ])
      handleCategoryChange(name)
      setIsCategoryModalOpen(false)
      showToast('Category staged. You can now edit its content.')
    }
  }

  const handleDeleteCategory = (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return

    if (canManage) {
      const doDelete = async () => {
        try {
          const res = await fetch(`/api/quick_read_categories?id=${id}`, {
            method: 'DELETE',
          })
          if (!res.ok) throw new Error('Failed')
          const newCats = categories.filter((c) => c._id !== id)
          setCategories(newCats)
          if (activeCategory === name) {
            handleCategoryChange(newCats.length > 0 ? newCats[0].name : '')
          }
        } catch {
          alert('Error deleting category')
        }
      }
      doDelete()
    } else {
      const isLocal = id.startsWith('local_')
      if (isLocal) {
        setLocalCategories((prev) => prev.filter((lc) => lc.id !== id))
        setPendingChanges((prev) => prev.filter((pc) => pc.id !== id))
        if (activeCategory === name) {
          const remaining = allCategories.filter((c) => c._id !== id)
          handleCategoryChange(remaining.length > 0 ? remaining[0].name : '')
        }
        showToast('Staged category removed.')
      } else {
        setDeletedCategoryIds((prev) => new Set(prev).add(id))
        const changeId = nextLocalId()
        setPendingChanges((prev) => [
          ...prev,
          {
            id: changeId,
            changeType: 'delete',
            targetType: 'category',
            targetCategoryId: id,
            proposedData: { categoryName: name },
          },
        ])
        if (activeCategory === name) {
          const remaining = allCategories.filter((c) => c._id !== id)
          handleCategoryChange(remaining.length > 0 ? remaining[0].name : '')
        }
        showToast('Category delete staged.')
      }
    }
  }

  // ---- Batch submit ----
  const submitBatch = async () => {
    if (pendingChanges.length === 0) return
    setIsSubmittingBatch(true)
    try {
      const changes = pendingChanges.map((pc) => ({
        changeType: pc.changeType,
        targetType: pc.targetType,
        targetCategoryId: pc.targetCategoryId,
        proposedData: pc.proposedData,
      }))

      const res = await fetch('/api/proposed-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed')

      // Clear staging
      setPendingChanges([])
      setLocalCategories([])
      setLocalContentEdits({})
      setDeletedCategoryIds(new Set())
      setIsStagingOpen(false)

      // Re-fetch
      const catRes = await fetch('/api/quick_read_categories')
      const catData = await catRes.json()
      if (catData.success) {
        setCategories(catData.categories)
        if (catData.categories.length > 0) {
          const saved = localStorage.getItem('quickReadsCategory')
          const valid =
            saved &&
            catData.categories.some((c: CategoryType) => c.name === saved)
          setActiveCategory(valid ? saved : catData.categories[0].name)
        }
      }

      showToast(data.message)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setIsSubmittingBatch(false)
    }
  }

  const clearStaging = () => {
    if (!confirm('Discard all staged changes?')) return
    setPendingChanges([])
    setLocalCategories([])
    setLocalContentEdits({})
    setDeletedCategoryIds(new Set())
    showToast('All staged changes discarded.')
  }

  const content = getContent()

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-[100] max-w-sm animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-yellow-50 dark:bg-zinc-950 border border-yellow-200 dark:border-yellow-600/50 text-yellow-900 dark:text-yellow-50 px-4 py-3 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(234,179,8,0.1)] flex items-start gap-3 backdrop-blur-md">
            <div className="bg-yellow-100 dark:bg-yellow-500/20 p-1 rounded-md shrink-0 mt-0.5">
              <ClipboardList className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
            </div>
            <p className="text-sm font-medium leading-relaxed mt-0.5">{toast}</p>
            <button
              onClick={() => setToast(null)}
              aria-label="Close toast"
              className="ml-auto text-yellow-600 dark:text-yellow-500 hover:text-yellow-800 dark:hover:text-yellow-300 mt-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Quick Reads
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Curated resources for various domains.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canManage && (
            <Link
              href="/proposed-changes"
              className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors"
            >
              <ClipboardList className="h-4 w-4" /> Proposed Changes
            </Link>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-border pb-4">
        {allCategories.map((category) => (
          <div key={category._id} className="group relative flex items-center">
            <button
              onClick={() => handleCategoryChange(category.name)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category.name
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {category.name}
              {isLocalCategory(category.name) && (
                <span className="ml-1.5 text-[10px] bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-bold">
                  STAGED
                </span>
              )}
            </button>
            {isLoggedIn && (
              <div className="absolute -top-2 -right-2 hidden group-hover:flex bg-background border rounded shadow-sm z-10 p-0.5">
                <button
                  onClick={() =>
                    handleDeleteCategory(category._id, category.name)
                  }
                  className="p-1 hover:text-red-600 dark:hover:text-red-400"
                  title="Delete Category"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        ))}

        {isLoggedIn && (
          <button
            onClick={() => {
              setCatNameInput('')
              setCatVisibilityInput('public')
              setIsCategoryModalOpen(true)
            }}
            className="px-4 py-2 flex items-center gap-1 rounded-full text-sm font-medium border border-dashed border-gray-400 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Category
          </button>
        )}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !activeCategory || allCategories.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">
            No categories yet
          </h3>
          <p className="text-sm mt-2">Create a category to get started.</p>
        </div>
      ) : isEditing ? (
        /* Markdown Editor */
        <div className="border rounded-xl overflow-hidden bg-card">
          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 ${
                  !showPreview
                    ? 'bg-background shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileEdit className="h-4 w-4" /> Edit
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 ${
                  showPreview
                    ? 'bg-background shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className="h-4 w-4" /> Preview
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 border-r pr-4">
                <label className="text-sm font-medium text-muted-foreground">
                  Visibility:
                </label>
                <select
                  value={editVisibility}
                  onChange={(e) =>
                    setEditVisibility(
                      e.target.value as 'public' | 'college_only'
                    )
                  }
                  className="text-sm bg-background border border-input rounded-md px-2 py-1"
                  aria-label="Visibility setting"
                >
                  <option value="public">Public</option>
                  <option value="college_only">College Only</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelEditing}
                  className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveContent}
                  disabled={isSaving}
                  className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {canManage ? 'Save' : 'Stage Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* Editor / Preview pane */}
          {showPreview ? (
            <div className="max-w-none min-h-[400px] p-6 bg-white dark:bg-background text-gray-900 dark:text-gray-100">
              {editContent ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {editContent}
                </ReactMarkdown>
              ) : (
                <p className="italic text-gray-500 dark:text-gray-400">
                  Nothing to preview.
                </p>
              )}
            </div>
          ) : (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[400px] p-6 font-mono text-sm bg-background resize-y focus:outline-none"
              placeholder="Write your markdown content here...&#10;&#10;# Heading&#10;## Subheading&#10;- List item&#10;- Another item&#10;&#10;```code block```&#10;&#10;[Link text](https://example.com)"
            />
          )}

          {!canManage && (
            <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-700 text-xs text-yellow-700 dark:text-yellow-300">
              Your changes will be staged locally. Click &quot;Propose
              Changes&quot; when ready to submit for review.
            </div>
          )}
        </div>
      ) : (
        /* Markdown Viewer */
        <div className="border rounded-xl bg-card overflow-hidden">
          {/* Viewer toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">
                {activeCategory} / README.md
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  getVisibility() === 'college_only'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                }`}
              >
                {getVisibility() === 'college_only' ? 'College Only' : 'Public'}
              </span>
            </div>
            {isLoggedIn && (
              <button
                onClick={startEditing}
                className="px-3 py-1.5 text-sm border rounded-md hover:bg-background flex items-center gap-1.5 transition-colors"
              >
                <Edit className="h-4 w-4" />{' '}
                {canManage ? 'Edit' : 'Edit (propose)'}
              </button>
            )}
          </div>

          {/* Rendered content */}
          <div className="max-w-none min-h-[300px] p-6 bg-white dark:bg-background text-gray-900 dark:text-gray-100">
            {getVisibility() === 'college_only' &&
            !session?.user?.email?.endsWith('@iiitl.ac.in') &&
            !canManage ? (
              <div className="flex flex-col items-center justify-center h-[250px] m-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <div className="bg-amber-300 dark:bg-amber-700 p-4 rounded-full mb-4 text-amber-800 dark:text-amber-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Restricted Access</h3>
                <p className="text-sm max-w-[300px] text-center">
                  This file is marked as <strong>College Only</strong>. You must
                  be logged in with a valid @iiitl.ac.in email address to view
                  its contents.
                </p>
              </div>
            ) : content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">
                  This file is empty.{' '}
                  {isLoggedIn && 'Click Edit to add content.'}
                </p>
              </div>
            )}
          </div>

          {localContentEdits[activeCategory] !== undefined && (
            <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-700 text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
              <ClipboardList className="h-3 w-3" />
              You have staged edits for this file.
            </div>
          )}
        </div>
      )}

      {/* Floating Propose Changes button (non-admin) */}
      {!canManage && isLoggedIn && pendingChanges.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          {isStagingOpen && (
            <div className="bg-background border rounded-xl shadow-2xl p-4 w-80 max-h-96 overflow-y-auto animate-in slide-in-from-bottom-2 fade-in duration-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">
                  Staged Changes ({pendingChanges.length})
                </h3>
                <button
                  onClick={() => setIsStagingOpen(false)}
                  className="p-1 hover:bg-muted rounded"
                  title="Close staged changes panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 mb-4">
                {pendingChanges.map((pc) => (
                  <div
                    key={pc.id}
                    className="flex items-center gap-2 text-xs p-2 bg-muted rounded-md"
                  >
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        pc.changeType === 'add'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : pc.changeType === 'edit'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {pc.changeType.toUpperCase()}
                    </span>
                    <span className="truncate flex-1 text-muted-foreground">
                      {pc.proposedData?.categoryName || 'category'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearStaging}
                  className="flex-1 px-3 py-2 text-xs border rounded-md hover:bg-muted text-red-600"
                >
                  Discard All
                </button>
                <button
                  onClick={submitBatch}
                  disabled={isSubmittingBatch}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmittingBatch ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Submit
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsStagingOpen(!isStagingOpen)}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-green-700 transition-all hover:scale-105"
          >
            <Send className="h-5 w-5" />
            Propose Changes ({pendingChanges.length})
          </button>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Create Category</h2>
              {!canManage && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md text-sm text-yellow-700 dark:text-yellow-300">
                  This category will be staged locally. You can edit its content
                  before submitting.
                </div>
              )}
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      value={catNameInput}
                      onChange={(e) => setCatNameInput(e.target.value)}
                      className="w-full p-2 rounded-md border bg-background"
                      placeholder="e.g. Machine Learning"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Visibility
                    </label>
                    <select
                      value={catVisibilityInput}
                      onChange={(e) =>
                        setCatVisibilityInput(
                          e.target.value as 'public' | 'college_only'
                        )
                      }
                      className="w-full p-2 rounded-md border bg-background"
                      aria-label="Category visibility setting"
                    >
                      <option value="public">Public (Anyone can view)</option>
                      <option value="college_only">
                        College Only (@iiitl.ac.in required)
                      </option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-4 py-2 rounded-md border hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {canManage ? 'Create' : 'Stage Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
