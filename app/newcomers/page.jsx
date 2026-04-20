'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import { Hotel, Utensils, ShoppingBag, Landmark, MapPin } from 'lucide-react'

const categories = ['All', 'Restaurant', 'Hotel', 'Landmarks', 'Shop']

const categoryIcons = {
  Restaurant: <Utensils size={40} className="text-red-500" />,
  Hotel: <Hotel size={40} className="text-blue-500" />,
  Landmarks: <Landmark size={40} className="text-green-500" />,
  Shop: <ShoppingBag size={40} className="text-yellow-500" />,
  Default: <MapPin size={40} className="text-gray-500" />,
}

const emptyForm = { name: '', category: 'Restaurant', address: '', location: '', contact: '', website: '' }

const NewcomersPage = () => {
  const { data: session } = useSession()
  const isAdmin = Array.isArray(session?.user?.roles) && session.user.roles.includes('admin')
  

  const [locations, setLocations] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [filteredLocations, setFilteredLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null) // { text, type: 'success' | 'error' }
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState(emptyForm)

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  // ---------------- GET API ----------------
  const fetchLocations = async () => {
    try {
      const url =
        selectedCategory === 'All'
          ? '/api/locations'
          : `/api/locations?category=${selectedCategory}`
      const res = await axios.get(url)
      setLocations(res.data.data || [])
    } catch {
      showMessage('Failed to fetch locations', 'error')
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [selectedCategory])

  // ---------------- FILTER + SEARCH ----------------
  useEffect(() => {
    const filtered = locations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredLocations(filtered)
  }, [searchQuery, locations])

  // ---------------- POST API ----------------
  const addLocation = async () => {
    if (!addForm.name || !addForm.category || !addForm.address || !addForm.location) {
      showMessage('Name, category, address and map link are required', 'error')
      return
    }
    setLoading(true)
    try {
      await axios.post('/api/locations', addForm)
      setAddForm(emptyForm)
      setShowAddForm(false)
      await fetchLocations()
      showMessage('Location added successfully')
    } catch {
      showMessage('Failed to add location', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ---------------- PUT API ----------------
  const updateLocation = async (id) => {
    setLoading(true)
    try {
      await axios.put(`/api/locations/${id}`, editForm)
      setEditingId(null)
      await fetchLocations()
      showMessage('Location updated successfully')
    } catch {
      showMessage('Failed to update location', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ---------------- DELETE API ----------------
  const deleteLocation = async (id) => {
    if (!confirm('Are you sure you want to delete this location?')) return
    setLoading(true)
    try {
      await axios.delete(`/api/locations/${id}`)
      await fetchLocations()
      showMessage('Location deleted successfully')
    } catch {
      showMessage('Failed to delete location', 'error')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (location) => {
    setEditingId(location._id)
    setEditForm({
      name: location.name,
      category: location.category,
      address: location.address,
      location: location.location,
      contact: location.contact || '',
      website: location.website || '',
    })
  }

  const formFields = (form, setForm) => (
    <div className="flex flex-col gap-2 mt-3">
      {[
        { key: 'name', placeholder: 'Name' },
        { key: 'address', placeholder: 'Address' },
        { key: 'location', placeholder: 'Map link (URL)' },
        { key: 'contact', placeholder: 'Contact (optional)' },
        { key: 'website', placeholder: 'Website (optional)' },
      ].map(({ key, placeholder }) => (
        <input
          key={key}
          value={form[key]}
          onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full p-2 border rounded text-sm dark:bg-gray-800 dark:text-white"
        />
      ))}
      <select
        value={form.category}
        onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
        className="w-full p-2 border rounded text-sm dark:bg-gray-800 dark:text-white"
      >
        {categories.filter((c) => c !== 'All').map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
        Explore Nearby Locations
      </h1>

      {/* Toast message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded text-center text-sm font-medium ${
            message.type === 'error'
              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search for a location..."
        className="w-full p-3 mb-6 border rounded-md dark:bg-gray-800 dark:text-white"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Category Filter */}
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        {categories.map((category) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-lg border ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Admin: Add Location */}
      {isAdmin && (
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm((prev) => !prev)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            {showAddForm ? 'Cancel' : '+ Add Location'}
          </button>
          {showAddForm && (
            <div className="mt-3 p-4 border rounded-lg dark:bg-gray-900">
              {formFields(addForm, setAddForm)}
              <button
                onClick={addLocation}
                disabled={loading}
                className="mt-3 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Location'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Locations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredLocations.length > 0 ? (
          filteredLocations.map((location) => (
            <div
              key={location._id}
              className="block p-5 border rounded-lg shadow-md bg-white dark:bg-gray-900 hover:scale-105 transition-all"
            >
              {/* Icon */}
              <div className="flex justify-center mb-3">
                {categoryIcons[location.category] || categoryIcons.Default}
              </div>

              {/* Info */}
              <h3 className="text-lg font-medium text-blue-600 text-center">
                {location.name}
              </h3>
              <p className="text-sm text-gray-600 text-center">{location.address}</p>

              {/* Map */}
              <button
                onClick={() => {
                  if (location.location) window.open(location.location, '_blank')
                }}
                className="mt-3 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                View on Map
              </button>

              {/* Admin Buttons */}
              {isAdmin && (
                <>
                  {editingId === location._id ? (
                    <div>
                      {formFields(editForm, setEditForm)}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => updateLocation(location._id)}
                          disabled={loading}
                          className="flex-1 bg-green-600 text-white py-1 rounded disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 bg-gray-400 text-white py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => startEdit(location)}
                        className="flex-1 bg-yellow-500 text-white py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteLocation(location._id)}
                        disabled={loading}
                        className="flex-1 bg-red-500 text-white py-1 rounded disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">No locations found.</p>
        )}
      </div>
    </div>
  )
}

export default NewcomersPage
