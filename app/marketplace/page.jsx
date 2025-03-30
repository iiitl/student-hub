"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, ShoppingBag } from "lucide-react";
import marketplaceData from "../../data/marketplace_data.json";

const Marketplace = () => {
  const [listings, setListings] = useState([]);
  const [formData, setFormData] = useState({ name: "", description: "", price: "" });

  useEffect(() => {
    setListings(marketplaceData.listings);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.description && formData.price) {
      setListings([...listings, formData]);
      setFormData({ name: "", description: "", price: "" });
    }
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
        <textarea
          name="description"
          placeholder="Item Description"
          className="w-full p-3 mb-3 border rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
          value={formData.description}
          onChange={handleInputChange}
        ></textarea>
        <input
          type="number"
          name="price"
          placeholder="Price"
          className="w-full p-3 mb-3 border rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
          value={formData.price}
          onChange={handleInputChange}
        />
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
