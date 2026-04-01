# Books Tracker - Project Documentation

A local-first, dark-themed web application built with **Vue.js**, **Vite**, and **Node.js/Express** to track personal reading history.

## Architecture & Persistence
- **Local Storage**: All data is stored in human-readable JSON files within the `books/server/` directory:
  - `books.json`: Primary collection of read books.
  - `authors.json`: Database of known authors for autocomplete.
  - `series.json`: Database of series/tags for autocomplete.
- **Image Storage**: Uploaded book covers are stored in the `books/server/covers/` folder.
- **Backend**: A minimal Express server handles file I/O and image uploads using `multer`.
- **Frontend**: A reactive Vue 3 (Composition API) application using Vanilla CSS for styling.

## Key Features
- **Two View Modes**:
  - **Immersive Grid**: Large covers (350px) with rich visual badges and a modern hover effect.
  - **Compact List**: A slim, tabular view for efficient scanning of large collections.
- **Advanced Metadata**:
  - Tracks Start/End dates (displayed in French format: `DD/MM/YYYY`).
  - Supports Page Count (Paper) or Length in hours (Audio).
  - Multi-tagging for Series (e.g., a book can be part of "The Cosmere" and "Stormlight Archive").
- **Dynamic Controls**:
  - Filtering by Author, Series, Language, Format, and Category.
  - Bi-directional sorting (Ascending/Descending) by Date, Pages, or Length.
- **Full CRUD**: Support for adding, editing (all fields including covers), and deleting books.

## Technical Setup

### Requirements
- Node.js installed on your local machine.

### Installation
```powershell
cd books
npm install
```

### Running the App
The app uses `concurrently` to launch both the Vite frontend and the Node.js backend with a single command:
```powershell
npm start
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001 (Proxied via Vite)

## Style Conventions
- **Theme**: Dark Mode (Charcoal/Navy palette).
- **CSS**: Scoped Vanilla CSS within Vue components.
- **Components**:
  - `App.vue`: State management, filtering, and sorting logic.
  - `BookForm.vue`: Unified Add/Edit form with autocomplete.
  - `BookList.vue`: View mode container.
  - `BookCard.vue`: Dynamic card rendering for both Grid and List modes.
