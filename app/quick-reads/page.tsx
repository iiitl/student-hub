import blogData, { BlogItem } from '../../data/blogs'
import React from 'react'

const blogCategories: BlogItem['source'][] = ['Medium', 'GitHub', 'Other']

const QuickReads: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">
        Quick Reads
      </h1>
      {blogCategories.map((category) => (
        <div key={category} className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-400 border-b border-gray-300 dark:border-gray-600 pb-2 mb-4">
            {category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {blogData
              .filter((blog: BlogItem) => blog.source.toLowerCase() === category.toLowerCase())
              .map((blog: BlogItem, index: number) => (
                <a
                  key={index}
                  href={blog.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-md 
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                             transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105 hover:shadow-lg"
                >
                  <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline mb-2">
                    {blog.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Source: {blog.source}
                  </p>
                </a>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default QuickReads
