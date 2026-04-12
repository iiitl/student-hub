'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  PlusCircle,
  Search,
  X,
  Trash2,
  CheckCircle,
  Loader2,
  ImageIcon,
  ChevronDown,
  Tag,
  Phone,
  Clock,
  AlertCircle,
  Package,
  Mail,
  Edit,
  MessageCircle,
} from 'lucide-react'
import Image from 'next/image'

/**
 * Marketplace page — OLX-inspired buy & sell for the college community.
 *
 * • Lists only unsold products (GET /api/products)
 * • Authenticated users can create a listing (POST /api/products)
 * • Sellers can mark their listing as sold (PATCH /api/products/:id/sold)
 * • Sellers can delete their listing (DELETE /api/products/:id)
 * • Search, sort-by-price/date, and pagination are supported.
 */

const TITLE_MAX = 40
const DESC_MAX = 1000
const CONTACT_MAX = 200

// ─── helpers ────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

// ─── component ──────────────────────────────────────────────────────────────
const Marketplace = () => {
  const { data: session, status: authStatus } = useSession()

  // Products state
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
  })

  // Filters
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    phone: '',
    email: '',
    quantity: 1,
    bulk_discounts: [],
    image: null,
  })
  const [formErrors, setFormErrors] = useState({})

  // Edit state
  const [editingProduct, setEditingProduct] = useState(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    price: '',
    phone: '',
    email: '',
    quantity: 1,
    bulk_discounts: [],
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  // Action state (sold / delete)
  const [actionLoading, setActionLoading] = useState({})
  const [soldPromptId, setSoldPromptId] = useState(null)
  const [soldQuantityValue, setSoldQuantityValue] = useState(1)
  const [toast, setToast] = useState(null)
  
  // Toolbar filters
  const [myListingsOnly, setMyListingsOnly] = useState(false)

  // Detailed view & comments
  const [detailedProduct, setDetailedProduct] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [commentLoading, setCommentLoading] = useState(false)
  const [qtyToBuy, setQtyToBuy] = useState(1)
  const [showOffers, setShowOffers] = useState(false)
  const [deletePromptId, setDeletePromptId] = useState(null)
  const [showCommentsPanel, setShowCommentsPanel] = useState(false)

  // ── pre-fill email from session ──────────────────────────────────────────
  useEffect(() => {
    if (session?.user?.email) {
      setFormData((prev) => ({ ...prev, email: prev.email || session.user.email }))
    }
  }, [session])

  // ── debounce search ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // ── disable body scroll when modals open ─────────────────────────────────
  useEffect(() => {
    if (showCreate || editingProduct || detailedProduct || soldPromptId || deletePromptId) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [showCreate, editingProduct, detailedProduct, soldPromptId, deletePromptId])

  // ── fetch products ───────────────────────────────────────────────────────
  const fetchProducts = useCallback(
    async (page = 1) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '20',
          sortBy,
          sortOrder,
        })
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
        if (myListingsOnly && session?.user?.id) params.set('seller', session.user.id)

        const res = await fetch(`/api/products?${params}`)
        const data = await res.json()
        if (res.ok) {
          setProducts(data.products || [])
          setPagination(data.pagination || { page: 1, totalPages: 1, total: 0, hasNext: false })
        }
      } catch {
        showToast('Failed to load products', 'error')
      } finally {
        setLoading(false)
      }
    },
    [sortBy, sortOrder, debouncedSearch, myListingsOnly, session?.user?.id]
  )

  useEffect(() => {
    fetchProducts(1)
  }, [fetchProducts])

  // ── toast helper ─────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── form helpers ─────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      setFormErrors((prev) => ({
        ...prev,
        image: 'Only PNG, JPEG, WebP, or GIF allowed',
      }))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormErrors((prev) => ({ ...prev, image: 'Image must be under 10 MB' }))
      return
    }
    setFormData((prev) => ({ ...prev, image: file }))
    setFormErrors((prev) => ({ ...prev, image: '' }))
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      phone: '',
      email: session?.user?.email || '',
      quantity: 1,
      bulk_discounts: [],
      image: null,
    })
    setFormErrors({})
    setImagePreview(null)
    setCreateError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── validate ─────────────────────────────────────────────────────────────
  const validate = () => {
    const err = {}
    if (!formData.title.trim()) err.title = 'Title is required'
    else if (formData.title.trim().length > TITLE_MAX)
      err.title = `Max ${TITLE_MAX} characters`
    if (!formData.description.trim()) err.description = 'Description is required'
    else if (formData.description.trim().length > DESC_MAX)
      err.description = `Max ${DESC_MAX} characters`
    if (!formData.price) err.price = 'Price is required'
    else if (isNaN(formData.price) || Number(formData.price) < 0)
      err.price = 'Enter a valid price'
    if (!formData.quantity || isNaN(formData.quantity) || Number(formData.quantity) < 1)
      err.quantity = 'Quantity must be at least 1'
    if (!formData.phone.trim()) err.phone = 'Phone number is required'
    else if (!/^\d{10}$/.test(formData.phone.trim()))
      err.phone = 'Enter a valid 10-digit phone number'
    if (!formData.email.trim()) err.email = 'Email is required'
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim()))
      err.email = 'Enter a valid email address'
    if (!formData.image) err.image = 'Product image is required'
    
    if (formData.bulk_discounts.some(d => d.discount_per_item <= 0)) {
      err.bulk_discounts = 'Bulk discounts must have a discount greater than 0'
    } else if (Number(formData.price) > 0 && formData.bulk_discounts.some(d => d.discount_per_item >= Number(formData.price))) {
      err.bulk_discounts = 'Discount cannot be greater than or equal to the price'
    } else {
      const qs = new Set(formData.bulk_discounts.map(d => Number(d.min_quantity)))
      if (qs.size !== formData.bulk_discounts.length) {
        err.bulk_discounts = 'Each bulk rule must have a unique quantity'
      }
    }
    
    setFormErrors(err)
    return Object.keys(err).length === 0
  }

  // ── create listing ───────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault()
    if (!validate()) {
      setCreateError('Please fix the errors highlighted below before submitting.')
      return
    }
    setCreating(true)
    setCreateError('')

    const contactInfo = `Phone: ${formData.phone.trim()} | Email: ${formData.email.trim()}`

    const fd = new FormData()
    fd.append('title', formData.title.trim())
    fd.append('description', formData.description.trim())
    fd.append('price', formData.price)
    fd.append('quantity', formData.quantity)
    fd.append('bulk_discounts', JSON.stringify(formData.bulk_discounts.filter(d => d.min_quantity > 0 && d.discount_per_item > 0)))
    fd.append('contact_info', contactInfo)
    fd.append('image', formData.image)

    try {
      const res = await fetch('/api/products', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to create listing')
      showToast('Listing created successfully!')
      resetForm()
      setShowCreate(false)
      fetchProducts(1)
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreating(false)
    }
  }

  // ── edit listing ─────────────────────────────────────────────────────────
  const openEditModal = (product) => {
    let phone = ''
    let email = ''
    if (product.contact_info) {
      const parts = product.contact_info.split(' | ')
      if (parts.length === 2 && parts[0].startsWith('Phone: ') && parts[1].startsWith('Email: ')) {
        phone = parts[0].replace('Phone: ', '').trim()
        email = parts[1].replace('Email: ', '').trim()
      } else {
        phone = product.contact_info
      }
    }
    setEditFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      quantity: product.quantity || 1,
      bulk_discounts: product.bulk_discounts || [],
      phone,
      email,
    })
    setEditingProduct(product)
    setEditError('')
  }

  const closeEditModal = () => {
    setEditingProduct(null)
    setEditError('')
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    
    // Quick validation
    const err = {}
    if (!editFormData.title.trim()) err.title = 'Title is required'
    else if (editFormData.title.trim().length > TITLE_MAX) err.title = `Max ${TITLE_MAX} characters`
    if (!editFormData.description.trim()) err.description = 'Description is required'
    else if (editFormData.description.trim().length > DESC_MAX) err.description = `Max ${DESC_MAX} characters`
    if (!editFormData.price) err.price = 'Price is required'
    else if (isNaN(editFormData.price) || Number(editFormData.price) < 0) err.price = 'Enter a valid price'
    if (!editFormData.phone.trim()) err.phone = 'Phone number is required'
    else if (!/^\d{10}$/.test(editFormData.phone.trim())) err.phone = 'Enter a valid 10-digit phone number'
    if (!editFormData.email.trim()) err.email = 'Email is required'
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(editFormData.email.trim())) err.email = 'Enter a valid email address'
    if (!editFormData.quantity || isNaN(editFormData.quantity) || Number(editFormData.quantity) < 1) err.quantity = 'Quantity must be at least 1'
    if (editFormData.bulk_discounts.some(d => d.discount_per_item <= 0)) {
      err.bulk_discounts = 'Bulk discounts must have a discount greater than 0'
    } else if (Number(editFormData.price) > 0 && editFormData.bulk_discounts.some(d => d.discount_per_item >= Number(editFormData.price))) {
      err.bulk_discounts = 'Discount cannot be greater than or equal to the price'
    } else {
      const qs = new Set(editFormData.bulk_discounts.map(d => Number(d.min_quantity)))
      if (qs.size !== editFormData.bulk_discounts.length) {
        err.bulk_discounts = 'Each bulk rule must have a unique quantity'
      }
    }
    
    if (Object.keys(err).length > 0) {
      setEditError(Object.values(err)[0])
      return
    }

    setEditLoading(true)
    setEditError('')

    const contactInfo = `Phone: ${editFormData.phone.trim()} | Email: ${editFormData.email.trim()}`

    try {
      const res = await fetch(`/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editFormData.title.trim(),
          description: editFormData.description.trim(),
          price: Number(editFormData.price),
          quantity: Number(editFormData.quantity),
          bulk_discounts: editFormData.bulk_discounts.filter(d => d.min_quantity > 0 && d.discount_per_item > 0),
          contact_info: contactInfo
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to update listing')
      
      showToast('Listing updated successfully!')
      closeEditModal()
      fetchProducts(pagination.page)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  // ── mark as sold (removes from listing like OLX) ─────────────────────────
  const handleMarkSold = async (id, show_when_sold = false, quantity_to_sell = 1) => {
    setSoldPromptId(null)
    setActionLoading((prev) => ({ ...prev, [id]: 'sold' }))
    try {
      const res = await fetch(`/api/products/${id}/sold`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_when_sold, sold_quantity: quantity_to_sell })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed')
      
      const product = products.find(p => p._id === id);
      const remaining = product.quantity - quantity_to_sell;

      if (remaining <= 0) {
        if (show_when_sold) {
          setProducts(prev => prev.map(p => p._id === id ? { ...p, is_sold: true, show_when_sold: true, quantity: 0 } : p))
          showToast('Marked as sold (Kept Visible)')
        } else {
          setProducts((prev) => prev.filter((p) => p._id !== id))
          setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }))
          showToast('Marked as sold and removed from marketplace')
        }
      } else {
        setProducts(prev => prev.map(p => p._id === id ? { ...p, quantity: remaining } : p))
        showToast(`Successfully sold ${quantity_to_sell} items.`)
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }))
    }
  }

  // ── mark as available again (for seller) ─────────────────────────────────
  const handleMarkAvailable = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: 'available' }))
    try {
      const res = await fetch(`/api/products/${id}/available`, { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed')
      setProducts((prev) => prev.map((p) => (p._id === id ? data.product : p)))
      showToast('Listing marked as available again')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }))
    }
  }

  // ── delete listing ───────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: 'delete' }))
    setDeletePromptId(null)
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed')
      setProducts((prev) => prev.filter((p) => p._id !== id))
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }))
      showToast('Listing deleted')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }))
    }
  }

  // ── handle comments ──────────────────────────────────────────────────────
  const handlePostComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !detailedProduct) return
    setCommentLoading(true)

    try {
      const res = await fetch(`/api/products/${detailedProduct._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: commentText,
          offerPrice: offerPrice ? Number(offerPrice) : undefined,
          parentCommentId: replyingTo || undefined
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      setDetailedProduct(data.product)
      setProducts(prev => prev.map(p => p._id === data.product._id ? data.product : p))
      setCommentText('')
      setOfferPrice('')
      setReplyingTo(null)
      showToast('Comment posted', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setCommentLoading(false)
    }
  }

  // ── ownership check ──────────────────────────────────────────────────────
  const isOwner = (product) => {
    if (!session?.user) return false
    const seller = product.seller
    if (!seller) return false
    // seller can be populated object or plain id string
    const sellerId = typeof seller === 'object' ? seller._id : seller
    // session.user may have id or _id
    return (
      sellerId === session.user.id ||
      sellerId === session.user._id ||
      sellerId === session.user.email // fallback match
    )
  }

  // ─── render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--marketplace-bg, #f2f4f5)' }}>
      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all animate-slide-in ${
            toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.message}
          <button onClick={() => setToast(null)} aria-label="Dismiss notification" className="ml-2 opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Hero / Header ─────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #002f34 0%, #00505a 50%, #007a85 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-teal-300 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-cyan-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <Package size={36} className="text-teal-300" />
                Campus Marketplace
              </h1>
              <p className="text-teal-200/80 mt-1 text-sm sm:text-base">
                Buy & sell within your college community
              </p>
            </div>
            {authStatus === 'authenticated' && (
              <button
                id="create-listing-btn"
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm shadow-lg transition-all duration-200 hover:scale-[1.04] active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #23e5db, #17b8b0)',
                  color: '#002f34',
                }}
              >
                <PlusCircle size={18} />
                Sell an Item
              </button>
            )}
          </div>

          {/* ── Search + Filters ──────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                id="marketplace-search"
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-teal-400/60 transition-all text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  id="marketplace-sort"
                  value={`${sortBy}:${sortOrder}`}
                  onChange={(e) => {
                    const [sb, so] = e.target.value.split(':')
                    setSortBy(sb)
                    setSortOrder(so)
                  }}
                  className="appearance-none px-4 py-3 pr-10 rounded-xl bg-white/10 backdrop-blur text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-teal-400/60 text-sm cursor-pointer"
                >
                  <option value="created_at:-1" className="text-gray-900">Newest first</option>
                  <option value="created_at:1" className="text-gray-900">Oldest first</option>
                  <option value="price:1" className="text-gray-900">Price: Low to High</option>
                  <option value="price:-1" className="text-gray-900">Price: High to Low</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" />
              </div>

              {session?.user?.id && (
                <button
                  onClick={() => setMyListingsOnly(!myListingsOnly)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    myListingsOnly
                      ? 'bg-teal-500 border-teal-400 text-[#002f34] shadow-md'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  <Tag size={16} /> <span className="hidden sm:inline">{myListingsOnly ? 'All Listings' : 'My Listings'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Products Grid ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Results count */}
        {!loading && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-medium uppercase tracking-wider">
            {pagination.total} {pagination.total === 1 ? 'listing' : 'listings'} available
          </p>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 size={40} className="animate-spin text-teal-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading marketplace…</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Tag size={32} className="text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
              No listings found
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              {debouncedSearch
                ? `No products match "${debouncedSearch}". Try a different search.`
                : 'Be the first to list something on the marketplace!'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => {
                const owner = isOwner(product)
                const busy = actionLoading[product._id]
                return (
                  <div
                    key={product._id}
                    className={`group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 border border-gray-200/60 dark:border-gray-800 ${
                      product.is_sold ? 'opacity-75 grayscale-[30%]' : 'hover:shadow-xl'
                    }`}
                  >
                    {/* Image (Click to view details) */}
                    <div 
                      className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 overflow-hidden cursor-pointer"
                      onClick={() => setDetailedProduct(product)}
                    >
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={40} className="text-gray-300 dark:text-gray-600" />
                        </div>
                      )}

                      {/* SOLD OUT Overlay */}
                      {product.is_sold && (
                        <div className="absolute inset-0 z-10 bg-black/30 flex items-center justify-center backdrop-blur-[1px]">
                          <div className="bg-red-600/90 text-white px-6 py-2 border-2 border-red-700 font-black tracking-widest text-lg shadow-2xl transform -rotate-12 rounded">
                            SOLD OUT
                          </div>
                        </div>
                      )}

                      {/* Price badge */}
                      <span
                        className="absolute bottom-2 left-2 px-3 py-1 rounded-lg text-sm font-bold shadow-lg z-20"
                        style={{ background: '#002f34', color: '#fff' }}
                      >
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-snug">
                        {product.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 mb-1">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          Qty: {product.quantity || 1}
                        </span>
                        {product.bulk_discounts?.length > 0 && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                            Bulk Discounts
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Seller + time */}
                      <div className="flex flex-col gap-1.5 mt-3 text-[11px] text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-800/20 p-2 rounded-lg">
                        <div className="flex items-center justify-between gap-2">
                           <span className="flex items-center gap-1.5 truncate">
                             <Phone size={10} className="shrink-0 text-teal-600 dark:text-teal-400" />
                             <span className="truncate">{product.contact_info.includes(' | ') ? product.contact_info.split(' | ')[0].replace('Phone: ', '') : product.contact_info}</span>
                           </span>
                           <span className="flex items-center gap-1 shrink-0 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded shadow-sm border border-gray-100 dark:border-gray-700 max-w-[40%]">
                             <Clock size={10} className="text-gray-400" />
                             <span className="truncate">{timeAgo(product.created_at)}</span>
                           </span>
                        </div>
                        {product.contact_info.includes(' | ') && (
                           <span className="flex items-center gap-1.5 truncate">
                             <Mail size={10} className="shrink-0 text-teal-600 dark:text-teal-400" />
                             <span className="truncate">{product.contact_info.split(' | ')[1].replace('Email: ', '')}</span>
                           </span>
                        )}
                      </div>

                      {product.seller && typeof product.seller === 'object' && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 truncate">
                          by {product.seller.name || product.seller.email}
                        </p>
                      )}
                      
                      {/* Owner actions — OLX style */}
                      {owner && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                          {product.is_sold ? (
                            <>
                              <button
                                disabled={!!busy}
                                onClick={() => handleMarkAvailable(product._id)}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 disabled:opacity-50"
                              >
                                {busy === 'available' ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <CheckCircle size={12} />
                                )}
                                Mark Available
                              </button>
                              <button
                                id={`delete-btn-${product._id}`}
                                disabled={!!busy}
                                onClick={() => setDeletePromptId(product._id)}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 disabled:opacity-50"
                              >
                                {busy === 'delete' ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Trash2 size={12} />
                                )}
                                Delete
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                id={`edit-btn-${product._id}`}
                                disabled={!!busy}
                                onClick={() => openEditModal(product)}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 disabled:opacity-50"
                              >
                                <Edit size={12} />
                                Edit
                              </button>
                              <button
                                id={`sold-btn-${product._id}`}
                                disabled={!!busy}
                                onClick={() => { setSoldPromptId(product._id); setSoldQuantityValue(1); }}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/50 disabled:opacity-50"
                              >
                                {busy === 'sold' ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <CheckCircle size={12} />
                                )}
                                Sold
                              </button>
                              <button
                                id={`delete-btn-${product._id}`}
                                disabled={!!busy}
                                onClick={() => setDeletePromptId(product._id)}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 disabled:opacity-50"
                              >
                                {busy === 'delete' ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Trash2 size={12} />
                                )}
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Pagination ──────────────────────────────────────────────── */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-10">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchProducts(pagination.page - 1)}
                  className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-all"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  disabled={!pagination.hasNext}
                  onClick={() => fetchProducts(pagination.page + 1)}
                  className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Create Listing Modal ──────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-t-3xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Sell an Item
              </h2>
              <button
                onClick={() => {
                  resetForm()
                  setShowCreate(false)
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {createError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                  <AlertCircle size={16} />
                  {createError}
                </div>
              )}

              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Image <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-colors overflow-hidden ${
                    formErrors.image
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-700 hover:border-teal-400 bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative aspect-video">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover rounded-2xl"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                        <p className="text-white text-sm font-medium">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                      <ImageIcon size={32} className="mb-2" />
                      <p className="text-sm font-medium">Click to upload</p>
                      <p className="text-xs mt-0.5">PNG, JPEG, WebP, GIF • Max 10 MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                {formErrors.image && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {formErrors.image}
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="listing-title"
                  type="text"
                  name="title"
                  maxLength={TITLE_MAX}
                  placeholder="e.g. Casio FX-991EX Calculator"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all ${
                    formErrors.title
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-gray-300 dark:border-gray-700 focus:ring-teal-400/60'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {formErrors.title ? (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle size={12} /> {formErrors.title}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-gray-400">
                    {formData.title.length}/{TITLE_MAX}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="listing-description"
                  name="description"
                  maxLength={DESC_MAX}
                  rows={3}
                  placeholder="Describe your item, its condition, and any details buyers should know"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all resize-none ${
                    formErrors.description
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-gray-300 dark:border-gray-700 focus:ring-teal-400/60'
                  }`}
                />
                {formErrors.description && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {formErrors.description}
                  </p>
                )}
              </div>

              {/* Price & Quantity & Bulk Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="listing-price"
                    type="number"
                    name="price"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all ${
                      formErrors.price
                        ? 'border-red-400 focus:ring-red-300'
                        : 'border-gray-300 dark:border-gray-700 focus:ring-teal-400/60'
                    }`}
                  />
                  {formErrors.price && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {formErrors.price}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Available Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="listing-quantity"
                    type="number"
                    name="quantity"
                    min="1"
                    step="1"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all ${
                      formErrors.quantity
                        ? 'border-red-400 focus:ring-red-300'
                        : 'border-gray-300 dark:border-gray-700 focus:ring-teal-400/60'
                    }`}
                  />
                  {formErrors.quantity && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {formErrors.quantity}
                    </p>
                  )}
                </div>
              </div>

              {/* Bulk Discounts builder */}
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Tag size={14} /> Bulk Discounts <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                  </label>
                  {formData.bulk_discounts.length < 10 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          bulk_discounts: [...p.bulk_discounts, { min_quantity: 2, discount_per_item: 0 }],
                        }))
                      }
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 transition"
                    >
                      + Add Rule
                    </button>
                  )}
                </div>
                {formErrors.bulk_discounts && (
                  <p className="text-red-500 text-xs mt-1 mb-2 flex items-center gap-1">
                    <AlertCircle size={12} /> {formErrors.bulk_discounts}
                  </p>
                )}
                {formData.bulk_discounts.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-10">Buy &ge;</span>
                    <input
                      type="number"
                      className="w-16 px-2 py-1.5 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                      min="2"
                      value={d.min_quantity}
                      onChange={(e) => {
                        const n = [...formData.bulk_discounts]
                        n[i].min_quantity = Number(e.target.value)
                        setFormData((p) => ({ ...p, bulk_discounts: n }))
                      }}
                    />
                    <span className="text-xs text-gray-500 whitespace-nowrap">items, get ₹</span>
                    <input
                      type="number"
                      className="flex-1 px-2 py-1.5 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                      min="0"
                      value={d.discount_per_item === 0 ? '' : d.discount_per_item}
                      onChange={(e) => {
                        const n = [...formData.bulk_discounts]
                        n[i].discount_per_item = e.target.value === '' ? 0 : Number(e.target.value)
                        setFormData((p) => ({ ...p, bulk_discounts: n }))
                      }}
                    />
                    <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:inline">off/item</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          bulk_discounts: p.bulk_discounts.filter((_, idx) => idx !== i),
                        }))
                      }
                      className="p-2 text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors rounded-lg ml-2 border border-red-100 dark:border-red-900/30 shadow-sm flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {formData.bulk_discounts.length === 0 && (
                  <p className="text-xs text-gray-400">Offer a discount per item when buyers purchase multiple units.</p>
                )}
              </div>

              {/* Contact — 2-column: Phone + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <span className="flex items-center gap-1"><Phone size={13} /> Phone</span>
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    id="listing-phone"
                    type="tel"
                    name="phone"
                    maxLength={10}
                    placeholder="10-digit number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all ${
                      formErrors.phone
                        ? 'border-red-400 focus:ring-red-300'
                        : 'border-gray-300 dark:border-gray-700 focus:ring-teal-400/60'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {formErrors.phone}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <span className="flex items-center gap-1"><Mail size={13} /> Email</span>
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    id="listing-email"
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all ${
                      formErrors.email
                        ? 'border-red-400 focus:ring-red-300'
                        : 'border-gray-300 dark:border-gray-700 focus:ring-teal-400/60'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {formErrors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                id="submit-listing-btn"
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #002f34, #00505a)',
                  color: '#fff',
                }}
              >
                {creating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <PlusCircle size={18} />
                )}
                {creating ? 'Posting…' : 'Post Listing'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Listing Modal ──────────────────────────────────────────── */}
      {editingProduct && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Form Details */}
            <div className="w-full md:w-3/5 overflow-y-auto overflow-x-hidden border-r border-gray-100 dark:border-gray-800">
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Edit Listing
                </h2>
                <button
                  onClick={closeEditModal}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors md:hidden"
                  aria-label="Close modal"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-6 space-y-5">
                {editError && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                    <AlertCircle size={16} />
                    {editError}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={TITLE_MAX}
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    maxLength={DESC_MAX}
                    rows={4}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition-all resize-none"
                  />
                </div>

                {/* Price & Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editFormData.price}
                      onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition-all"
                    />
                  </div>
                  
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Available Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={editFormData.quantity}
                      onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition-all"
                    />
                  </div>
                </div>

                {/* Bulk Discounts builder */}
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Tag size={14} /> Bulk Discounts <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                    </label>
                    {editFormData.bulk_discounts.length < 10 && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditFormData((p) => ({
                            ...p,
                            bulk_discounts: [...p.bulk_discounts, { min_quantity: 2, discount_per_item: 0 }],
                          }))
                        }
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition"
                      >
                        + Add Rule
                      </button>
                    )}
                  </div>
                  {editFormData.bulk_discounts.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-10">Buy &ge;</span>
                      <input
                        type="number"
                        className="w-16 px-2 py-1.5 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                        min="2"
                        value={d.min_quantity}
                        onChange={(e) => {
                          const n = [...editFormData.bulk_discounts]
                          n[i].min_quantity = Number(e.target.value)
                          setEditFormData((p) => ({ ...p, bulk_discounts: n }))
                        }}
                      />
                      <span className="text-xs text-gray-500 whitespace-nowrap">items, get ₹</span>
                      <input
                        type="number"
                        className="flex-1 px-2 py-1.5 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                        min="0"
                        value={d.discount_per_item === 0 ? '' : d.discount_per_item}
                        onChange={(e) => {
                          const n = [...editFormData.bulk_discounts]
                          n[i].discount_per_item = e.target.value === '' ? 0 : Number(e.target.value)
                          setEditFormData((p) => ({ ...p, bulk_discounts: n }))
                        }}
                      />
                      <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:inline">off/item</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditFormData((p) => ({
                            ...p,
                            bulk_discounts: p.bulk_discounts.filter((_, idx) => idx !== i),
                          }))
                        }
                        className="p-2 text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors rounded-lg ml-2 border border-red-100 dark:border-red-900/30 shadow-sm flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {editFormData.bulk_discounts.length === 0 && (
                    <p className="text-xs text-gray-400">Offer a discount per item when buyers purchase multiple units.</p>
                  )}
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <span className="flex items-center gap-1"><Phone size={13} /> Phone</span>
                      <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <span className="flex items-center gap-1"><Mail size={13} /> Email</span>
                      <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition-all"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={editLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  {editLoading ? 'Saving changes…' : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* Right: Image */}
            <div className="hidden md:flex w-2/5 bg-gray-50 dark:bg-gray-800 flex-col relative overflow-y-auto">
              {/* Close button on desktop */}
              <button
                onClick={closeEditModal}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 backdrop-blur shadow-sm transition-colors"
                aria-label="Close modal"
              >
                <X size={20} className="text-gray-700 dark:text-gray-300" />
              </button>
              
              <div className="p-6 flex-1 flex flex-col justify-center">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg border border-gray-200/60 dark:border-gray-700/60">
                  {editingProduct.image_url ? (
                    <Image
                      src={editingProduct.image_url}
                      alt={editingProduct.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                      <ImageIcon size={64} className="text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                </div>
                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4 leading-relaxed px-4">
                  Image editing is not available. To change the image, you must delete this listing and create a new one.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sold Prompt Modal ─────────────────────────────────────────────── */}
      {soldPromptId && (() => {
        const product = products.find(p => p._id === soldPromptId);
        if (!product) return null;
        
        const isPartialSale = product.quantity > 1 && soldQuantityValue < product.quantity;

        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col gap-6 text-center">
              <div>
                <div className="mx-auto w-16 h-16 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-full flex flex-col items-center justify-center mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {product.quantity > 1 ? 'Sell Items' : 'Mark as Sold'}
                </h3>
                {product.quantity > 1 && (
                  <div className="mt-4 text-left">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity to sell (Max: {product.quantity})
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      max={product.quantity}
                      value={soldQuantityValue}
                      onChange={(e) => setSoldQuantityValue(Math.min(product.quantity, Math.max(1, Number(e.target.value))))}
                      className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm"
                    />
                  </div>
                )}
                {!isPartialSale ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
                    Congratulations on selling out! Would you like to completely hide this listing, or keep it visible with a "SOLD OUT" badge?
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
                    This will reduce your available inventory by {soldQuantityValue}. The listing will remain active until quantity reaches 0.
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                {!isPartialSale ? (
                  <>
                    <button
                      onClick={() => handleMarkSold(soldPromptId, true, soldQuantityValue)}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition"
                    >
                      Keep Visible (Sold Out Badge)
                    </button>
                    <button
                      onClick={() => handleMarkSold(soldPromptId, false, soldQuantityValue)}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition"
                    >
                      Hide Completely
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleMarkSold(soldPromptId, false, soldQuantityValue)}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition"
                  >
                    Confirm Sale
                  </button>
                )}
                <button
                  onClick={() => setSoldPromptId(null)}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Custom Delete Prompt ────────────────────────────────────────── */}
      {deletePromptId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setDeletePromptId(null)}>
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-xl p-6 animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 mx-auto">
              <AlertCircle size={24} className="text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">Delete Listing?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Are you sure you want to delete this listing permanently? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletePromptId(null)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletePromptId)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detailed View Modal ─────────────────────────────────────────── */}
      {detailedProduct && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm lg:p-8" onClick={() => setDetailedProduct(null)}>
          <div
            className={`relative w-full ${showCommentsPanel ? 'max-w-[95vw]' : 'max-w-4xl'} bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[90vh] transition-all duration-300`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left/Top Area: Image */}
            <div className={`w-full ${showCommentsPanel ? 'md:w-[40%]' : 'md:w-[50%]'} bg-gray-100 dark:bg-gray-950 flex flex-col relative h-[40vh] md:h-full overflow-y-auto transition-all duration-300`}>
              {/* Image Header */}
              <div className="relative w-full aspect-[4/3] md:aspect-auto md:min-h-full flex-shrink-0 bg-black/5 dark:bg-white/5 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800">
                {detailedProduct.image_url ? (
                  <Image src={detailedProduct.image_url} alt={detailedProduct.title} fill className="object-contain" />
                ) : (
                  <ImageIcon size={64} className="text-gray-300 dark:text-gray-600" />
                )}
                {detailedProduct.is_sold && (
                  <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-red-600/90 text-white px-8 py-3 border-4 border-red-700 font-black tracking-widest text-3xl shadow-2xl transform -rotate-12 rounded">
                      SOLD OUT
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setDetailedProduct(null)}
                  className="absolute top-4 left-4 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors md:hidden z-20"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

              {/* Right/Bottom Area: Details & Comments */}
              <div className={`w-full ${showCommentsPanel ? 'md:w-[30%]' : 'md:w-[50%]'} flex flex-col h-[60vh] md:h-full bg-white dark:bg-gray-900 break-words min-w-0 transition-all duration-300 border-r border-gray-100 dark:border-gray-800 overflow-y-auto`}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <div className="flex justify-between items-start gap-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                      {detailedProduct.title}
                    </h2>
                    <div className="flex items-center gap-2">
                       <button onClick={() => setShowCommentsPanel(!showCommentsPanel)} className="hidden md:flex items-center gap-2 p-2 text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-400 rounded-full transition shrink-0" title="Toggle Comments">
                         <MessageCircle size={20} />
                       </button>
                       <button onClick={() => setDetailedProduct(null)} className="hidden md:block p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition dark:hover:bg-gray-800 dark:hover:text-gray-200 shrink-0">
                         <X size={24} />
                       </button>
                    </div>
                  </div>

                  {(() => {
                     let finalPrice = detailedProduct.price * qtyToBuy;
                     if (detailedProduct.bulk_discounts?.length > 0) {
                        const applicableDiscount = detailedProduct.bulk_discounts
                           .filter(d => d.min_quantity <= qtyToBuy)
                           .reduce((max, d) => Math.max(max, d.discount_per_item), 0);
                        finalPrice -= (applicableDiscount * qtyToBuy);
                     }

                     return (
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3 sm:justify-between">
                           <div className="flex flex-col">
                              <span className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">
                                {detailedProduct.quantity > 1 ? 'Total Cost' : 'Price'}
                              </span>
                              <p className="text-4xl font-extrabold text-[#002f34] dark:text-teal-400 leading-none">
                                {formatPrice(finalPrice)}
                              </p>
                              {finalPrice < detailedProduct.price * qtyToBuy && (
                                <p className="text-sm font-semibold text-green-600 mt-1 dark:text-green-400 line-through opacity-80">
                                  {formatPrice(detailedProduct.price * qtyToBuy)}
                                </p>
                              )}
                           </div>

                           {detailedProduct.quantity > 1 && (
                             <div className="flex items-center flex-wrap gap-2 mt-2 sm:mt-0">
                               <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                 Select Quantity:
                               </label>
                               <input 
                                 type="number" 
                                 min="1" 
                                 max={detailedProduct.quantity}
                                 value={qtyToBuy}
                                 onChange={(e) => setQtyToBuy(Math.min(detailedProduct.quantity, Math.max(1, Number(e.target.value))))}
                                 className="w-16 px-2 py-1 text-sm border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 font-bold"
                               />
                               <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg">
                                 (Max {detailedProduct.quantity})
                               </span>
                               {detailedProduct.bulk_discounts?.length > 0 && (
                                 <button onClick={() => setShowOffers(!showOffers)} className="ml-1 flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold text-xs uppercase tracking-wide hover:underline cursor-pointer">
                                   <Tag size={14} /> {showOffers ? 'Hide Offer' : 'View Offer'}
                                 </button>
                               )}
                             </div>
                           )}
                        </div>
                     );
                  })()}

                  <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5"><Clock size={16} /> Posted {timeAgo(detailedProduct.created_at)}</span>
                    </div>
                  </div>

                  {showOffers && detailedProduct.bulk_discounts?.length > 0 && detailedProduct.quantity > 1 && (
                    <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-2xl space-y-2 relative overflow-hidden">
                      <h4 className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                        <Tag size={14} /> Bulk Discounts available
                      </h4>
                      {detailedProduct.bulk_discounts.map((bd, i) => {
                         const isAvailable = bd.min_quantity <= detailedProduct.quantity;
                         return (
                           <div key={i} className={`flex justify-between items-center text-sm ${isAvailable ? 'text-orange-900 dark:text-orange-200' : 'text-gray-400 dark:text-gray-500 opacity-60'}`}>
                             <span className={`font-bold border-b border-dashed ${isAvailable ? 'border-orange-400' : 'border-gray-400'}`}>
                               Only ₹{detailedProduct.price - bd.discount_per_item} / item
                             </span>
                             <span>for {bd.min_quantity} or more items</span>
                           </div>
                         );
                      })}
                    </div>
                  )}
                  
                  <p className="mt-6 text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {detailedProduct.description}
                  </p>

                {detailedProduct.contact_info && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/80 rounded-2xl flex flex-col gap-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-1">Contact Seller</p>
                    {detailedProduct.contact_info.includes(' | ') ? (
                      <>
                        <div className="flex items-center gap-3 text-sm font-medium text-gray-800 dark:text-gray-200"><Phone size={16} className="text-teal-600"/> {detailedProduct.contact_info.split(' | ')[0].replace('Phone: ', '')}</div>
                        <div className="flex items-center gap-3 text-sm font-medium text-gray-800 dark:text-gray-200"><Mail size={16} className="text-teal-600"/> {detailedProduct.contact_info.split(' | ')[1].replace('Email: ', '')}</div>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{detailedProduct.contact_info}</p>
                    )}
                  </div>
                )}
              </div>

              </div>

              {/* Comments Panel */}
              <div className={`w-full ${showCommentsPanel ? 'md:w-[30%] block' : 'md:hidden'} flex flex-col h-[50vh] md:h-full min-h-0 bg-gray-50 dark:bg-gray-900/50 transition-all duration-300 relative`}>
                
                {/* Comments Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    Comments & Offers
                    <span className="text-sm font-normal text-gray-500 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {detailedProduct.comments?.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0) || 0}
                    </span>
                  </h3>
                  {/* Close button for mobile inside comments panel */}
                  <button onClick={() => setShowCommentsPanel(false)} className="md:hidden p-2 text-gray-400 hover:bg-gray-200 rounded-full">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-6">
                  {(!detailedProduct.comments || detailedProduct.comments.length === 0) && (
                    <div className="text-center py-10 text-gray-400">
                      <p className="text-sm">No comments yet. Be the first to start a conversation!</p>
                    </div>
                  )}

                  {detailedProduct.comments?.map(comment => (
                    <div key={comment._id} className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex-shrink-0 overflow-hidden">
                        {comment.user?.image ? (
                          <Image src={comment.user.image} width={40} height={40} alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-teal-700 font-bold">
                            {comment.user?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{comment.user?.name || 'Unknown'}</span>
                            <span className="text-xs text-gray-500">{timeAgo(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">{comment.text}</p>
                          {comment.offerPrice && (
                            <div className="mt-2 inline-flex border border-teal-200 bg-teal-50 dark:bg-teal-900/30 dark:border-teal-800 px-3 py-1.5 rounded-lg items-center gap-2">
                              <Tag size={14} className="text-teal-600 dark:text-teal-400"/>
                              <span className="text-xs font-semibold text-teal-800 dark:text-teal-300">Offered: {formatPrice(comment.offerPrice)}</span>
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => setReplyingTo(comment._id)} 
                          className="text-xs font-semibold text-gray-500 mt-2 hover:text-teal-600 transition tracking-wide px-1"
                        >
                          REPLY
                        </button>

                        {/* Replies */}
                        {comment.replies?.length > 0 && (
                          <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                            {comment.replies.map(reply => (
                              <div key={reply._id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 overflow-hidden">
                                  {reply.user?.image ? (
                                    <Image src={reply.user.image} width={32} height={32} alt="" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-blue-700 font-bold text-xs">
                                      {reply.user?.name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="bg-white dark:bg-gray-800 py-2.5 px-4 rounded-xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">{reply.user?.name || 'Unknown'}</span>
                                      <span className="text-[10px] text-gray-500">{timeAgo(reply.createdAt)}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap">{reply.text}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              {session?.user ? (
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-gray-900">
                  {replyingTo && (
                    <div className="flex items-center justify-between text-xs bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg mb-3">
                      <span className="text-gray-600 dark:text-gray-300 font-medium tracking-wide">
                        Replying to comment
                      </span>
                      <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                    </div>
                  )}
                  <form onSubmit={handlePostComment} className="flex flex-col gap-2">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={replyingTo ? "Write a reply..." : "Ask a question or leave a comment..."}
                      className="w-full text-sm bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none h-[80px]"
                      required
                    />
                    {!replyingTo && (
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-gray-500">Offer Price (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={offerPrice}
                            onChange={(e) => setOfferPrice(e.target.value)}
                            placeholder="Optional"
                            className="text-sm px-3 py-1.5 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg border-none focus:ring-2 focus:ring-teal-500 focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={commentLoading}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition shadow-md disabled:opacity-50"
                        >
                          {commentLoading ? <Loader2 size={16} className="animate-spin" /> : 'Post'}
                        </button>
                      </div>
                    )}
                    {replyingTo && (
                      <div className="flex justify-end mt-1">
                        <button
                          type="submit"
                          disabled={commentLoading}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition shadow-md disabled:opacity-50"
                        >
                          {commentLoading ? <Loader2 size={16} className="animate-spin" /> : 'Reply'}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              ) : (
                <div className="p-6 border-t border-gray-200 dark:border-gray-800 text-center bg-gray-50 dark:bg-gray-900/50">
                  <p className="text-sm text-gray-500 mb-2">Login to ask questions or make offers.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-in animation ────────────────────────────────────────────── */}

      <style jsx global>{`
        :root {
          --marketplace-bg: #f2f4f5;
        }
        .dark {
          --marketplace-bg: #0f1114;
        }
        @keyframes slide-in {
          from {
            transform: translateX(100%) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  )
}

export default Marketplace
