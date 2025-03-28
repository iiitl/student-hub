"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  ExternalLink,
  Github,
  Code,
  BookOpen,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";

type BlogSource = "GitHub" | "Stack Overflow" | "Dev.to" | "MDN" | "TypeScript";

interface Blog {
  id: string;
  title: string;
  source: BlogSource;
  url: string;
  description: string;
  tags: string[];
  date: string;
  author?: string;
}

export default function OpenSourceReads() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<BlogSource | "All">("All");

  useEffect(() => {
    const mockBlogs: Blog[] = [
      {
        id: "1",
        title: "TypeScript 5.0 Release Notes",
        source: "TypeScript",
        url: "https://devblogs.microsoft.com/typescript/typescript-5-0/",
        description: "What's new in TypeScript 5.0 with code examples",
        tags: ["typescript", "release"],
        date: "2023-03-16",
      },
      {
        id: "2",
        title: "GitHub Copilot for Open Source",
        source: "GitHub",
        url: "https://github.blog/copilot-open-source/",
        description: "How GitHub Copilot is helping open source developers",
        tags: ["github", "ai", "opensource"],
        date: "2023-05-10",
      },
      {
        id: "3",
        title: "Advanced TypeScript Patterns",
        source: "Dev.to",
        url: "https://dev.to/advanced-typescript",
        description: "Learn advanced TypeScript techniques with real-world examples",
        tags: ["typescript", "patterns"],
        date: "2023-07-22",
        author: "typescript_guru",
      },
    ];

    setTimeout(() => {
      setBlogs(mockBlogs);
      setLoading(false);
    }, 800);
  }, []);

  const categories = ["All", ...new Set(blogs.map((blog) => blog.source))];

  const filteredBlogs = useMemo(() => {
    let result = blogs;

    if (activeFilter !== "All") {
      result = result.filter((blog) => blog.source === activeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (blog) =>
          blog.title.toLowerCase().includes(query) ||
          blog.description.toLowerCase().includes(query) ||
          blog.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [blogs, activeFilter, searchQuery]);

  const handleSearchRedirect = () => {
    if (searchQuery) {
      window.open(
        `https://github.com/search?q=${encodeURIComponent(searchQuery)}&type=repositories`,
        "_blank"
      );
      window.open(
        `https://stackoverflow.com/search?q=${encodeURIComponent(searchQuery)}`,
        "_blank"
      );
    }
  };

  const getSourceIcon = (source: BlogSource) => {
    switch (source) {
      case "GitHub":
        return <Github className="w-4 h-4" />;
      case "Stack Overflow":
        return <Code className="w-4 h-4" />;
      case "Dev.to":
        return <BookOpen className="w-4 h-4" />;
      case "MDN":
        return <BookOpen className="w-4 h-4" />;
      case "TypeScript":
        return <Code className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Horizontal Navbar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Menu icon (for mobile, if needed) */}
            <button className="text-base md:hidden">☰</button>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              StudentHub
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <a
              href="/quick-reads"
              className="px-2 py-1 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              Quick Reads
            </a>
            <a
              href="/notes"
              className="px-2 py-1 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              Notes
            </a>
            <a
              href="/question-papers"
              className="px-2 py-1 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              Question Papers
            </a>
            <a
              href="/marketplace"
              className="px-2 py-1 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              Marketplace
            </a>
            <a
              href="/chat"
              className="px-2 py-1 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              Chat
            </a>
            <a
              href="/newsletters"
              className="px-2 py-1 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              Newsletters
            </a>
            <a
              href="/contributors"
              className="px-2 py-1 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              Contributors
            </a>
            <a
              href="/files-selected"
              className="px-2 py-1 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              Files Selected
            </a>
          </div>
        </div>
      </nav>

      {/* Existing Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            OpenSource <span className="text-blue-600">Tech</span> Reads
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Curated technical articles about TypeScript, Open Source, and Web
            Development
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search articles or press Enter to search GitHub/StackOverflow..."
              className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchRedirect()}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                onClick={handleSearchRedirect}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                title="Search on GitHub/StackOverflow"
              >
                <ExternalLink className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto pb-2 md:pb-0">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveFilter(category as BlogSource | "All")}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium mr-2 last:mr-0 transition-colors ${
                  activeFilter === category
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 text-gray-600 dark:text-gray-400 text-sm">
          {filteredBlogs.length}{" "}
          {filteredBlogs.length === 1 ? "result" : "results"} found
          {searchQuery && ` for "${searchQuery}"`}
          {activeFilter !== "All" && ` in ${activeFilter}`}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden h-full animate-pulse"
              >
                <div className="p-4">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              No articles found
            </h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog) => (
              <div
                key={blog.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col"
              >
                <a
                  href={blog.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block flex-1 p-4"
                >
                  <div className="flex items-center mb-2">
                    <span className="inline-flex items-center justify-center p-2 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-2">
                      {getSourceIcon(blog.source)}
                    </span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {blog.source}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3 text-xs line-clamp-3">
                    {blog.description}
                  </p>
                  <div className="mt-auto">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {blog.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>{new Date(blog.date).toLocaleDateString()}</span>
                      {blog.author && <span>@{blog.author}</span>}
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Horizontal Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* Left: Brand & Tagline */}
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              StudentHub
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              By students, for students
            </p>
            <p className="mt-2 text-gray-400 text-xs">
              © {new Date().getFullYear()} StudentHub. All rights reserved.
            </p>
          </div>

          {/* Center: Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="/about-us"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              About Us
            </a>
            <a
              href="/careers"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Careers
            </a>
            <a
              href="/contact-us"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Contact Us
            </a>
            <a
              href="/help-center"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Help Center
            </a>
            <a
              href="/privacy-policy"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Privacy Policy
            </a>
            <a
              href="/terms-of-service"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Terms of Service
            </a>
          </nav>

          {/* Right: Social Icons */}
          <div className="flex items-center justify-center space-x-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:opacity-75"
            >
              <Facebook className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:opacity-75"
            >
              <Instagram className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="hover:opacity-75"
            >
              <Twitter className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="hover:opacity-75"
            >
              <Github className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hover:opacity-75"
            >
              <Linkedin className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}



