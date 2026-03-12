'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  Edit,
} from 'lucide-react'

// Types
type QuickRead = {
  _id: string
  title: string
  description?: string
  url: string
  category: string
  source?: string
  uploadedBy?: { name: string; email: string }
}

type CategoryType = {
  _id: string
  name: string
  order: number
}

export default function QuickReads() {
  const { data: session } = useSession()

  // States
  const [categories, setCategories] = useState<CategoryType[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [cache, setCache] = useState<Record<string, QuickRead[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Authorization checking
  const [canManage, setCanManage] = useState(false)

  // Fetch categories on load
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/quick_read_categories')
        const data = await res.json()
        if (data.success && data.categories.length > 0) {
          setCategories(data.categories)

          const savedCategory = localStorage.getItem('quickReadsCategory')
          const isValidSaved =
            savedCategory &&
            data.categories.some((c: CategoryType) => c.name === savedCategory)

          setActiveCategory(
            isValidSaved ? savedCategory : data.categories[0].name
          )
        }
      } catch (err) {
        console.error('Failed to load categories', err)
      }
    }
    fetchCategories()
  }, [])

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    localStorage.setItem('quickReadsCategory', category)
  }

  // Fetch live roles to guarantee admins have access without relogging
  useEffect(() => {
    let isMounted = true
    const checkLiveRoles = async () => {
      try {
        const res = await fetch('/api/user/roles')
        if (res.ok) {
          const data = await res.json()
          const isSuperAdmin = data.email === 'technicalclub@iiitl.ac.in'
          const hasAdminRole =
            Array.isArray(data.roles) && data.roles.includes('admin')
          if (isMounted) {
            setCanManage(isSuperAdmin || hasAdminRole)
          }
        } else {
          fallbackAuth()
        }
      } catch (e) {
        fallbackAuth()
      }
    }

    const fallbackAuth = () => {
      if (isMounted && session?.user) {
        const isSuperSession =
          session.user.email === 'technicalclub@iiitl.ac.in'
        const hasAdminSession =
          Array.isArray(session.user.roles) &&
          session.user.roles.includes('admin')
        setCanManage(isSuperSession || hasAdminSession)
      }
    }

    if (session?.user) {
      checkLiveRoles()
    } else {
      setCanManage(false)
    }

    return () => {
      isMounted = false
    }
  }, [session])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    source: 'StudentHub',
  })

  // Category Management states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isCatEditMode, setIsCatEditMode] = useState(false)
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [catNameInput, setCatNameInput] = useState('')
  const [isCatSubmitting, setIsCatSubmitting] = useState(false)

  const currentData = cache[activeCategory]

  const fetchCategoryData = useCallback(
    async (category: string) => {
      if (!category) return
      if (cache[category]) return

      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `/api/quick-reads?category=${encodeURIComponent(category)}`
        )
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch quick reads')
        }

        setCache((prev) => ({ ...prev, [category]: data.quickReads || [] }))
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        )
      } finally {
        setIsLoading(false)
      }
    },
    [cache]
  )

  useEffect(() => {
    fetchCategoryData(activeCategory)
  }, [activeCategory, fetchCategoryData])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault() // prevent navigating to external link
    if (!confirm('Are you sure you want to delete this Quick Read?')) return

    try {
      const res = await fetch(`/api/quick-reads?id=${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete')
      }

      setCache((prev) => {
        const newCache = { ...prev }
        newCache[activeCategory] = newCache[activeCategory].filter(
          (item) => item._id !== id
        )
        return newCache
      })
    } catch (err) {
      alert('Error deleting item')
      console.error(err)
    }
  }

  const handleEdit = (item: QuickRead, e: React.MouseEvent) => {
    e.preventDefault()
    setIsEditMode(true)
    setEditingId(item._id)
    setFormData({
      title: item.title,
      description: item.description || '',
      url: item.url,
      source: item.source || 'StudentHub',
    })
    setIsModalOpen(true)
  }

  const openAddModal = () => {
    setIsEditMode(false)
    setEditingId(null)
    setFormData({ title: '', description: '', url: '', source: 'StudentHub' })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const method = isEditMode ? 'PATCH' : 'POST'
      const bodyPayload = isEditMode
        ? { id: editingId, ...formData, category: activeCategory }
        : { ...formData, category: activeCategory }

      const res = await fetch('/api/quick-reads', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save quick read')
      }

      setCache((prev) => {
        const newCache = { ...prev }
        if (isEditMode && editingId) {
          const index = newCache[activeCategory].findIndex(
            (item) => item._id === editingId
          )
          if (index !== -1) {
            const updatedList = [...newCache[activeCategory]]
            updatedList[index] = data.quickRead
            newCache[activeCategory] = updatedList
          }
        } else {
          newCache[activeCategory] = [
            data.quickRead,
            ...(newCache[activeCategory] || []),
          ]
        }
        return newCache
      })

      setIsModalOpen(false)
      setIsEditMode(false)
      setEditingId(null)
      setFormData({ title: '', description: '', url: '', source: 'StudentHub' })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error saving quick read')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Category Handlers
  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCatSubmitting(true)

    try {
      const method = isCatEditMode ? 'PATCH' : 'POST'
      const payload = isCatEditMode
        ? { id: editingCatId, newName: catNameInput }
        : { name: catNameInput }

      const res = await fetch('/api/quick_read_categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.message || 'Failed')

      if (isCatEditMode) {
        setCategories((prev) =>
          prev.map((c) => (c._id === data.category._id ? data.category : c))
        )
        // If we edited the active category name, switch to new name
        if (
          activeCategory ===
          categories.find((c) => c._id === editingCatId)?.name
        ) {
          handleCategoryChange(data.category.name)
          setCache((prev) => {
            const newC = { ...prev }
            if (newC[activeCategory]) {
              newC[data.category.name] = newC[activeCategory].map((item) => ({
                ...item,
                category: data.category.name,
              }))
            }
            return newC
          })
        }
      } else {
        setCategories((prev) => [...prev, data.category])
        if (categories.length === 0) handleCategoryChange(data.category.name)
      }

      setIsCategoryModalOpen(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error')
    } finally {
      setIsCatSubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the category "${name}"? This will delete ALL resources inside it.`
      )
    )
      return
    try {
      const res = await fetch(`/api/quick_read_categories?id=${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')

      const newCats = categories.filter((c) => c._id !== id)
      setCategories(newCats)
      if (activeCategory === name) {
        handleCategoryChange(newCats.length > 0 ? newCats[0].name : '')
      }
    } catch (err) {
      alert('Error deleting category')
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Quick Reads
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Curated resources for various domains.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Resource to {activeCategory}
          </button>
        )}
      </div>

      {/* Categories / Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-border pb-4">
        {categories.map((category) => (
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
            </button>
            {canManage && (
              <div className="absolute -top-2 -right-2 hidden group-hover:flex bg-background border rounded shadow-sm z-10 p-0.5">
                <button
                  onClick={() => {
                    setIsCatEditMode(true)
                    setEditingCatId(category._id)
                    setCatNameInput(category.name)
                    setIsCategoryModalOpen(true)
                  }}
                  className="p-1 hover:text-yellow-600 dark:hover:text-yellow-400"
                  title="Rename Category"
                >
                  <Edit className="h-3 w-3" />
                </button>
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

        {canManage && (
          <button
            onClick={() => {
              setIsCatEditMode(false)
              setCatNameInput('')
              setIsCategoryModalOpen(true)
            }}
            className="px-4 py-2 flex items-center gap-1 rounded-full text-sm font-medium border border-dashed border-gray-400 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Category
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {isLoading && !currentData ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-64 text-red-500 bg-red-500/10 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-bold">Failed to load content</h3>
            <p>{error}</p>
          </div>
        ) : !currentData || currentData.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">
              No content available
            </h3>
            <p className="text-sm mt-2">
              Check back later for new resources in the {activeCategory}{' '}
              category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentData.map((item) => (
              <a
                key={item._id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col justify-between p-6 rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {item.source || 'Resource'}
                    </span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {item.uploadedBy
                      ? `Added by ${item.uploadedBy.name}`
                      : 'Community Shared'}
                  </p>

                  {canManage && (
                    <div className="flex items-center gap-1 z-10">
                      <button
                        onClick={(e) => handleEdit(item, e)}
                        className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-500/10 p-2 rounded-full transition-colors"
                        aria-label="Edit resource"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(item._id, e)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-500/10 p-2 rounded-full transition-colors"
                        aria-label="Delete resource"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {isEditMode ? 'Edit Quick Read' : 'Add Quick Read'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category (Target)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={activeCategory}
                    className="w-full bg-muted text-muted-foreground p-2 rounded-md border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full p-2 rounded-md border bg-background"
                    placeholder="e.g. Master Next.js API Routes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    className="w-full p-2 rounded-md border bg-background"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full p-2 rounded-md border bg-background h-24 resize-none"
                    placeholder="Briefly describe what this resource is about..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Source/Platform
                  </label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) =>
                      setFormData({ ...formData, source: e.target.value })
                    }
                    className="w-full p-2 rounded-md border bg-background"
                    placeholder="e.g. Medium, GitHub, YouTube"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-md border hover:bg-muted"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isEditMode ? (
                      'Save Changes'
                    ) : (
                      'Save Resource'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Admin Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {isCatEditMode ? 'Rename Category' : 'Create Category'}
              </h2>
              <form onSubmit={handleCatSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    value={catNameInput}
                    onChange={(e) => setCatNameInput(e.target.value)}
                    className="w-full p-2 rounded-md border bg-background"
                    placeholder="e.g. Artificial Intelligence"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-4 py-2 rounded-md border hover:bg-muted"
                    disabled={isCatSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCatSubmitting}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isCatSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Save Category'
                    )}
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
