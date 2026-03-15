'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Hotel, Utensils, ShoppingBag, Landmark, MapPin } from 'lucide-react'

const categories = ['All', 'Restaurant', 'Hotel', 'Landmarks', 'Shop']

const categoryIcons = {
  Restaurant: <Utensils size={40} className="text-red-500" />,
  Hotel: <Hotel size={40} className="text-blue-500" />,
  Landmarks: <Landmark size={40} className="text-green-500" />,
  Shop: <ShoppingBag size={40} className="text-yellow-500" />,
  Default: <MapPin size={40} className="text-gray-500" />,
}

const NewcomersPage = () => {
  const [locations, setLocations] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [filteredLocations, setFilteredLocations] = useState([])

  // ---------------- GET API ----------------
  const fetchLocations = async () => {
    try {
      const url =
        selectedCategory === 'All'
          ? '/api/locations'
          : `/api/locations?category=${selectedCategory}`

      const res = await axios.get(url)
      setLocations(res.data.data || [])
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [selectedCategory])

  // ---------------- FILTER + SEARCH ----------------
  useEffect(() => {
    const filtered = locations
      .filter((location) => {
        return (
          location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.address.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })

    setFilteredLocations(filtered)
  }, [searchQuery, locations])

  // ---------------- POST API ----------------
  const addLocation = async (locationData) => {
    try {
      await axios.post('/api/locations', locationData)
      fetchLocations()
    } catch (error) {
      console.error('Error adding location:', error)
    }
  }

  // ---------------- PUT API ----------------
  const updateLocation = async (id, updatedData) => {
    try {
      await axios.put(`/api/locations/${id}`, updatedData)
      fetchLocations()
    } catch (error) {
      console.error('Error updating location:', error)
    }
  }

  // ---------------- DELETE API ----------------
  const deleteLocation = async (id) => {
    try {
      await axios.delete(`/api/locations/${id}`)
      fetchLocations()
    } catch (error) {
      console.error('Error deleting location:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
        Explore Nearby Locations
      </h1>

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

              <p className="text-sm text-gray-600 text-center">
                {location.address}
              </p>

              {/* Map */}
              <button
                onClick={() => {
                  if (location.location) {
                    window.open(location.location, '_blank')
                  }
                }}
                className="mt-3 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                View on Map
              </button>

              {/* Admin Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() =>
                    updateLocation(location._id, { name: location.name })
                  }
                  className="flex-1 bg-yellow-500 text-white py-1 rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteLocation(location._id)}
                  className="flex-1 bg-red-500 text-white py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">
            No locations found.
          </p>
        )}
      </div>
    </div>
  )
}

export default NewcomersPage