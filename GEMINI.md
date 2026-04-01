# Books Tracker - Project Documentation

A local-first, dark-themed web application built with **Vue.js**, **Vite**, and **Node.js/Express** to track personal reading history.

## Architecture & Persistence
- **Local Storage**: All data is stored in human-readable JSON files within the `books/server/` directory:
  - `books.json`: Primary collection of read books.
  - `authors.json`: Derived author index for autocomplete/filtering.
  - `series.json`: Derived series/tag index for autocomplete/filtering.
- **Image Storage**: Uploaded book covers are stored in the `books/server/covers/` folder.
- **Backend**: A minimal Express server handles file I/O, request normalization, derived-index rebuilding, orphaned cover cleanup, and validated image uploads using `multer`.
- **Frontend**: A reactive Vue 3 (Composition API) application using Vanilla CSS and centralized theme tokens.

## Current Implementation Notes
- **State management**: Main library state now lives in `src/composables/useLibrary.js` instead of keeping all fetch/save/delete logic inside `App.vue`.
- **Why**: This keeps `App.vue` focused on composition and layout, while the data lifecycle lives in one reusable place.
- **Save behavior**: The add/edit form does **not** clear optimistically anymore. Form state is only reset after the backend confirms success.
- **Why**: Earlier behavior could discard user input if a save failed after submission.
- **Error handling**: Load, save, delete, and upload failures are surfaced in the UI instead of failing silently.
- **Why**: The app is local and simple, but silent failure still makes data entry unreliable.
- **Normalization**: The server normalizes stored books on read/write so empty strings and invalid numeric/date values do not drift through the JSON files.
- **Why**: `books.json` had started mixing `null`, empty string, and other loose values. The normalization step keeps the schema predictable.
- **Derived indexes**: `authors.json` and `series.json` are rebuilt from `books.json` instead of append-only updates.
- **Why**: This prevents stale autocomplete/filter values after edits or deletes.
- **Cover fallback**: Missing covers now use a local asset at `public/placeholder-cover.svg`.
- **Why**: The app description says local-first; using a remote placeholder service contradicted that.
- **Upload rules**: Cover uploads are limited by file type and size.
- **Why**: Even for a local app, this avoids junk files and oversized uploads.

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

## Compact List Layout Decision
- The compact list view uses explicit grid columns for title, tags, metadata, dates, and actions.
- The action column is fixed-width and right-aligned.
- **Why**: Rows without tags previously caused later fields, especially the action buttons, to stretch or shift. Explicit column placement keeps all rows aligned regardless of optional content.

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
- **CSS**: Scoped Vanilla CSS within Vue components, with shared CSS custom properties defined in `src/assets/main.css`.
- **Why**: The codebase had accumulated repeated hardcoded colors. Theme tokens make palette updates consistent and easier.
- **Components**:
  - `App.vue`: Layout and high-level composition.
  - `useLibrary.js`: Fetching, filtering, sorting, save/delete actions, and UI error state.
  - `BookForm.vue`: Unified Add/Edit form with autocomplete and upload flow.
  - `BookList.vue`: View mode container.
  - `BookCard.vue`: Dynamic card rendering for both Grid and List modes.
