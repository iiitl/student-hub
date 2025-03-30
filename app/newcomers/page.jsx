'use client'

import React, { useState, useEffect } from 'react'
import { Hotel, Utensils, ShoppingBag, Landmark, MapPin } from 'lucide-react'
import locationData from '../../data/nearby_data.json'

const categories = ['All', 'Restaurant', 'Hotel', 'Landmarks', 'Shop']

const categoryIcons = {
  Restaurant: <Utensils size={40} className="text-red-500" />,
  Hotel: <Hotel size={40} className="text-blue-500" />,
  Landmarks: <Landmark size={40} className="text-green-500" />,
  Shop: <ShoppingBag size={40} className="text-yellow-500" />,
  Default: <MapPin size={40} className="text-gray-500" />, // Fallback icon
}

const NewcomersPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [filteredLocations, setFilteredLocations] = useState([])

  useEffect(() => {
    const filtered = locationData.locations.filter((location) => {
      return (
        (selectedCategory === 'All' ||
          location.category.trim() === selectedCategory) &&
        (location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.address.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    })
    setFilteredLocations(filtered)
  }, [searchQuery, selectedCategory])

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
        Explore Nearby Locations
      </h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search for a location..."
        className="w-full p-3 mb-6 border rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Category Filter */}
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        {categories.map((category) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 transition-all ${
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

      {/* Locations List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredLocations.length > 0 ? (
          filteredLocations.map((location, index) => (
            <div
              key={index}
              className="block p-5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105 hover:shadow-lg"
            >
              {/* Icon Based on Category */}
              <div className="flex justify-center mb-3">
                {categoryIcons[location.category] || categoryIcons['Default']}
              </div>

              {/* Details */}
              <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-2 text-center">
                {location.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                {location.address}
              </p>

              {/* View on Map Button */}
              <button
                onClick={() => {
                  if (location.map_link) {
                    window.open(
                      location.map_link,
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                }}
                aria-label={`View ${location.name.trim()} on map`}
                disabled={!location.map_link}
                className="mt-3 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
              >
                View on Map
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 col-span-full">
            No locations found.
          </p>
        )}
      </div>
    </div>
  )
}

export default NewcomersPage
