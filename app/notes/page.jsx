"use client";

import React, { useState } from "react";

// Example directory data
const directoryData = [
  {
    name: "Work",
    children: [
      { name: "Projects", children: [] },
      { name: "Meetings", children: [] },
    ],
  },
  {
    name: "Personal",
    children: [
      { name: "Journals", children: [] },
      { name: "Recipes", children: [] },
    ],
  },
  {
    name: "Archives",
    children: [
      { name: "2023", children: [] },
      { name: "2022", children: [] },
    ],
  },
];

// Example notes data
const notesData = [
  {
    id: 1,
    title: "Text-based Note Example",
    type: "text",
    content: "This is a text note.",
  },
  {
    id: 2,
    title: "PDF Document Example",
    type: "pdf",
    content: "Preview of a PDF document.",
  },
  {
    id: 3,
    title: "Code Snippet Example",
    type: "code",
    content: "console.log('Hello World!');",
  },
  {
    id: 4,
    title: "To-do List Example",
    type: "todo",
    content: "[ ] Complete the project",
  },
];

export default function NotesPage() {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);

  // Toggle folder expansion in the sidebar
  const toggleFolder = (folderName) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  // Dummy action handlers
  const handleOpen = (note) => {
    setSelectedNote(note);
  };
  const handleEdit = (note) => {
    alert(`Editing note: ${note.title}`);
  };
  const handleDelete = (note) => {
    alert(`Deleting note: ${note.title}`);
  };
  const handleMove = (note) => {
    alert(`Moving note: ${note.title}`);
  };

  // Recursive directory rendering
  const renderDirectory = (items) => {
    return (
      <ul className="directory-list">
        {items.map((item) => (
          <li key={item.name}>
            {item.children && item.children.length > 0 ? (
              <>
                <div
                  className="directory-item"
                  onClick={() => toggleFolder(item.name)}
                >
                  {item.name}
                  <span className="folder-icon">
                    {expandedFolders[item.name] ? "▼" : "▶"}
                  </span>
                </div>
                {expandedFolders[item.name] && renderDirectory(item.children)}
              </>
            ) : (
              <div className="directory-item">{item.name}</div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="notes-app">
      {/* Horizontal Navbar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <button
              className="menu-button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <span className="navbar-brand">StudentHub</span>
          </div>
          <div className="navbar-links">
            <a href="/quick-reads" className="nav-link">
              Quick Reads
            </a>
            <a href="/notes" className="nav-link active">
              Notes
            </a>
            <a href="/question-papers" className="nav-link">
              Question Papers
            </a>
            <a href="/marketplace" className="nav-link">
              Marketplace
            </a>
            <a href="/chat" className="nav-link">
              Chat
            </a>
            <a href="/newsletters" className="nav-link">
              Newsletters
            </a>
            <a href="/contributors" className="nav-link">
              Contributors
            </a>
            <a href="/files-selected" className="nav-link">
              Files Selected
            </a>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="main-container">
        {/* Sidebar Navigation */}
        {sidebarOpen && (
          <aside className="sidebar">
            <h3>Notes Directory</h3>
            <div className="directory-container">
              {renderDirectory(directoryData)}
            </div>
          </aside>
        )}

        {/* Notes Display Area */}
        <main className="notes-content">
          <h1 className="page-title">My Notes</h1>
          <div className="notes-grid">
            {notesData.map((note) => (
              <div key={note.id} className="note-card">
                <h3>{note.title}</h3>
                <p className="note-type">Type: {note.type}</p>
                <p className="note-preview">{note.content}</p>
                <div className="note-actions">
                  <button onClick={() => handleOpen(note)}>Open</button>
                  <button onClick={() => handleEdit(note)}>Edit</button>
                  <button onClick={() => handleDelete(note)}>Delete</button>
                  <button onClick={() => handleMove(note)}>Move</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Simple Modal for "Open" Note */}
      {selectedNote && (
        <div className="note-modal" onClick={() => setSelectedNote(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedNote.title}</h2>
            <pre>{selectedNote.content}</pre>
            <button onClick={() => setSelectedNote(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Inline Styles */}
      <style jsx>{`
        /* Overall Layout */
        .notes-app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #fff;
          color: #000;
          font-family: sans-serif;
          font-size: 14px;
        }

        /* Navbar */
        .navbar {
          background: #fff;
          border-bottom: 1px solid #ccc;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .navbar-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 1rem;
        }
        .navbar-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .menu-button {
          background: none;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
        }
        .navbar-brand {
          font-size: 1rem;
          font-weight: 600;
        }
        .navbar-links {
          display: flex;
          gap: 0.5rem;
        }
        .nav-link {
          text-decoration: none;
          color: #000;
          padding: 0.3rem 0.6rem;
          border-radius: 3px;
          transition: background 0.2s;
        }
        .nav-link:hover {
          background: #f2f2f2;
        }
        .nav-link.active {
          background: #eaeaea;
          font-weight: 600;
        }

        /* Main Container */
        .main-container {
          display: flex;
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        /* Sidebar */
        .sidebar {
          width: 200px;
          border-right: 1px solid #ccc;
          padding: 0.5rem;
        }
        .sidebar h3 {
          margin-bottom: 0.5rem;
          font-size: 1rem;
        }
        .directory-container {
          margin-top: 0.5rem;
        }
        .directory-list {
          list-style: none;
          padding-left: 1rem;
        }
        .directory-item {
          cursor: pointer;
          padding: 0.25rem 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .folder-icon {
          margin-left: 0.5rem;
          font-size: 0.8rem;
        }

        /* Notes Content */
        .notes-content {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
        }
        .page-title {
          font-size: 1.2rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }
        .notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        /* Note Card */
        .note-card {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 0.75rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s;
        }
        .note-card:hover {
          transform: translateY(-2px);
        }
        .note-type {
          margin-bottom: 0.5rem;
          color: #666;
          font-size: 0.85rem;
        }
        .note-preview {
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
        .note-actions button {
          margin-right: 0.3rem;
          padding: 0.25rem 0.5rem;
          border: 1px solid #333;
          background: #fff;
          color: #000;
          border-radius: 3px;
          cursor: pointer;
          font-size: 0.75rem;
        }
        .note-actions button:hover {
          background: #f2f2f2;
        }

        /* Modal */
        .note-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #fff;
          padding: 1rem;
          border-radius: 4px;
          width: 90%;
          max-width: 600px;
          position: relative;
        }
        .modal-content h2 {
          margin-bottom: 0.5rem;
        }
        .modal-content pre {
          background: #f9f9f9;
          padding: 0.75rem;
          border-radius: 3px;
          margin-bottom: 1rem;
        }
        .modal-content button {
          border: 1px solid #333;
          background: #fff;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          font-size: 0.8rem;
        }
        .modal-content button:hover {
          background: #f2f2f2;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .main-container {
            flex-direction: column;
          }
          .sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #ccc;
          }
        }
      `}</style>
    </div>
  );
}
