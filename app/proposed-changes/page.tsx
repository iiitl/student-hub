'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import {
  Check,
  X,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

type ProposalChange = {
  _id: string
  changeType: 'add' | 'edit' | 'delete'
  targetType: 'category'
  proposedData?: {
    categoryName?: string
    oldContent?: string
    newContent?: string
  }
}

type Batch = {
  batchId: string
  proposedBy: { name: string; email: string } | null
  createdAt: string
  changes: ProposalChange[]
}

const changeTypeBadge = {
  add: {
    label: 'Add',
    color:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    icon: Plus,
  },
  edit: {
    label: 'Edit',
    color:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    icon: Edit,
  },
  delete: {
    label: 'Delete',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    icon: Trash2,
  },
}

// GitHub-style side-by-side diff viewer
function DiffViewer({
  oldContent,
  newContent,
}: {
  oldContent: string
  newContent: string
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null // Avoid hydration mismatch

  return (
    <div className="border border-border rounded-lg overflow-hidden text-sm">
      <ReactDiffViewer
        oldValue={oldContent || ''}
        newValue={newContent || ''}
        splitView={true}
        useDarkTheme={true}
        compareMethod={DiffMethod.WORDS}
        styles={{
          variables: {
            dark: {
              diffViewerBackground: '#09090b', // zinc-950, very black
              addedBackground: 'rgba(22, 101, 52, 0.4)', // clear green
              removedBackground: 'rgba(153, 27, 27, 0.4)', // clear red
              wordAddedBackground: 'rgba(21, 128, 61, 0.6)',
              wordRemovedBackground: 'rgba(185, 28, 28, 0.6)',
              addedGutterBackground: 'rgba(22, 101, 52, 0.5)',
              removedGutterBackground: 'rgba(153, 27, 27, 0.5)',
              gutterBackground: '#18181b', // zinc-900
              emptyLineBackground: '#09090b',
            },
          },
        }}
      />
    </div>
  )
}

export default function ProposedChanges() {
  const { data: session } = useSession()
  const [batches, setBatches] = useState<Batch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [canAccess, setCanAccess] = useState(false)
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const checkAccess = async () => {
      try {
        const res = await fetch('/api/user/roles')
        if (res.ok) {
          const data = await res.json()
          const isSuperAdmin = data.email === 'technicalclub@iiitl.ac.in'
          const hasAdminRole =
            Array.isArray(data.roles) && data.roles.includes('admin')
          if (isMounted) setCanAccess(isSuperAdmin || hasAdminRole)
        }
      } catch {
        // ignore
      }
    }
    if (session?.user) checkAccess()
    return () => {
      isMounted = false
    }
  }, [session])

  useEffect(() => {
    if (!canAccess) return
    const fetchBatches = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/proposed-changes?status=pending')
        const data = await res.json()
        if (data.success) {
          setBatches(data.batches)
        } else {
          setError(data.message)
        }
      } catch {
        setError('Failed to load proposals')
      } finally {
        setIsLoading(false)
      }
    }
    fetchBatches()
  }, [canAccess])

  const handleBatchAction = async (
    batchId: string,
    action: 'approve' | 'reject'
  ) => {
    setActionLoading(batchId)
    try {
      const body: Record<string, string> = { batchId, action }
      if (action === 'reject' && rejectNote) body.reviewNote = rejectNote

      const res = await fetch('/api/proposed-changes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      setBatches((prev) => prev.filter((b) => b.batchId !== batchId))
      setRejectingId(null)
      setRejectNote('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  if (!canAccess) {
    return (
      <div className="container mx-auto p-8 max-w-4xl text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground mt-2">
          Only admins can view proposed changes.
        </p>
        <Link
          href="/quick-reads"
          className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Quick Reads
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <div className="mb-8">
        <Link
          href="/quick-reads"
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Quick Reads
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Proposed Changes
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review batches of changes submitted by users.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center h-64 text-red-500 bg-red-500/10 rounded-lg p-6">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p>{error}</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">
            All caught up!
          </h3>
          <p className="text-sm mt-2">No pending proposals to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => {
            const isExpanded = expandedBatch === batch.batchId
            return (
              <div
                key={batch.batchId}
                className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
              >
                {/* Batch header */}
                <div
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() =>
                    setExpandedBatch(isExpanded ? null : batch.batchId)
                  }
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-bold">
                        {batch.changes.length} change
                        {batch.changes.length !== 1 ? 's' : ''}
                      </span>
                      <div className="flex gap-1">
                        {(['add', 'edit', 'delete'] as const).map((type) => {
                          const count = batch.changes.filter(
                            (c) => c.changeType === type
                          ).length
                          if (count === 0) return null
                          const badge = changeTypeBadge[type]
                          return (
                            <span
                              key={type}
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${badge.color}`}
                            >
                              {count} {badge.label}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      By{' '}
                      <span className="font-medium">
                        {batch.proposedBy?.name || 'Unknown'}
                      </span>{' '}
                      ({batch.proposedBy?.email}) ·{' '}
                      {new Date(batch.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {rejectingId === batch.batchId ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          placeholder="Reason (optional)"
                          className="p-2 text-sm border rounded-md bg-background w-48"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleBatchAction(batch.batchId, 'reject')
                            }
                            disabled={actionLoading === batch.batchId}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                          >
                            {actionLoading === batch.batchId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Reject All'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(null)
                              setRejectNote('')
                            }}
                            className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            handleBatchAction(batch.batchId, 'approve')
                          }
                          disabled={actionLoading === batch.batchId}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === batch.batchId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Approve All
                        </button>
                        <button
                          onClick={() => setRejectingId(batch.batchId)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <X className="h-4 w-4" /> Reject All
                        </button>
                      </>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded: show each change with diff */}
                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border">
                    {batch.changes.map((change, idx) => {
                      const badge = changeTypeBadge[change.changeType]
                      const BadgeIcon = badge.icon
                      const hasDiff =
                        change.proposedData?.oldContent !== undefined ||
                        change.proposedData?.newContent !== undefined

                      return (
                        <div key={change._id || idx} className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}
                            >
                              <BadgeIcon className="h-3 w-3" />
                              {badge.label}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              Category
                            </span>
                            {change.proposedData?.categoryName && (
                              <span className="text-sm font-semibold">
                                {change.proposedData.categoryName} / README.md
                              </span>
                            )}
                          </div>

                          {/* Diff view for content changes */}
                          {hasDiff && change.changeType !== 'delete' && (
                            <DiffViewer
                              oldContent={change.proposedData?.oldContent || ''}
                              newContent={change.proposedData?.newContent || ''}
                            />
                          )}

                          {change.changeType === 'delete' && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-700 dark:text-red-300">
                              This category and its content will be permanently
                              deleted.
                            </div>
                          )}

                          {change.changeType === 'add' && !hasDiff && (
                            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-700 dark:text-green-300">
                              New empty category will be created.
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
