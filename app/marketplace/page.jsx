"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, ShoppingBag } from "lucide-react";
import marketplaceData from "../../data/marketplace_data.json";

const Marketplace = () => {
  const [listings, setListings] = useState([]);
  const [formData, setFormData] = useState({ 
    name: "", 
    description: "", 
    price: "", 
    seller: "", 
    contact: "", 
    location: "" 
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setListings(marketplaceData.listings);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user types
    if (errors[name]) {
      setErrors({...errors, [name]: ""});
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate all required fields
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.description) newErrors.description = "Description is required";
    if (!formData.price) newErrors.price = "Price is required";
    // if (!formData.seller) newErrors.seller = "Seller name is required";
    if (!formData.contact) newErrors.contact = "Contact number is required";
    // if (!formData.location) newErrors.location = "Location is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    // Generate a new ID based on the largest existing ID
    const newId = listings.length > 0 
      ? Math.max(...listings.map(item => item.id)) + 1 
      : 1;
      
    setListings([...listings, { ...formData, id: newId }]);
    setFormData({ name: "", description: "", price: "", seller: "", contact: "", location: "" });
    setErrors({});
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
        Student Marketplace
      </h1>
      {/* Form to List an Item */}
      <form onSubmit={handleSubmit} className="mb-6 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">List an Item for Sale</h2>
        <input
          type="text"
          name="name"
          placeholder="Item Name"
          className="w-full p-3 mb-3 border rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
          value={formData.name}
          onChange={handleInputChange}
        />
        {errors.name && <p className="text-red-500 text-sm mb-3">{errors.name}</p>}
        <textarea
          name="description"
          placeholder="Item Description"
          className="w-full p-3 mb-3 border rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
          value={formData.description}
          onChange={handleInputChange}
        ></textarea>
        {errors.description && <p className="text-red-500 text-sm mb-3">{errors.description}</p>}
        <input
          type="number"
          name="price"
          placeholder="Price"
          className="w-full p-3 mb-3 border rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
          value={formData.price}
          onChange={handleInputChange}
        />
        {errors.price && <p className="text-red-500 text-sm mb-3">{errors.price}</p>}
        {/* <input
          type="text"
          name="seller"
          placeholder="Your Name"
          className="w-full p-3 mb-3 border rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
          value={formData.seller}
          onChange={handleInputChange}
        />
        {errors.seller && <p className="text-red-500 text-sm mb-3">{errors.seller}</p>} */}
        <input
          type="tel"
          name="contact"
          placeholder="Contact Number"
          className="w-full p-3 mb-3 border rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
          value={formData.contact}
          onChange={handleInputChange}
        />
        {errors.contact && <p className="text-red-500 text-sm mb-3">{errors.contact}</p>}
        {/* <input
          type="text"
          name="location"
          placeholder="Your Location (Hostel/Apartment)"
          className="w-full p-3 mb-3 border rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
          value={formData.location}
          onChange={handleInputChange}
        />
        {errors.location && <p className="text-red-500 text-sm mb-3">{errors.location}</p>} */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex justify-center items-center gap-2"
        >
          <PlusCircle size={20} /> Add Listing
        </button>
      </form>
      {/* Listings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {listings.length > 0 ? (
          listings.map((item, index) => (
            <div
              key={index}
              className="block p-5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:scale-105 hover:shadow-lg transition-all"
            >
              <div className="flex justify-center mb-3">
                <ShoppingBag size={40} className="text-yellow-500" />
              </div>
              <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-2 text-center">
                {item.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">
                {item.description}
              </p>
              <p className="text-center text-lg font-semibold">₹{item.price}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 col-span-full">
            No items available.
          </p>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
