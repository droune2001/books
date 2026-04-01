# Project Analysis

## Scope

This analysis is based on:

- `GEMINI.md`
- the Vue frontend in `src/`
- the Express backend in `server/`
- the persisted JSON data in `server/*.json`

## High-level read

This is a small, practical single-user reading tracker built as:

- a Vue 3 + Vite frontend
- a minimal Express API
- JSON-file persistence on disk
- local image storage through `multer`

The implementation is straightforward and easy to reason about. There is no heavy framework layering, no database, and no hidden state management beyond a single top-level Vue component. For a personal local tool, that simplicity is a real strength.

## What the project is doing well

### 1. The architecture matches the size of the problem

The app does not over-engineer a personal tracker. `src/App.vue` owns the main state, filtering, sorting, and CRUD refresh cycle, while the backend in `server/index.js` stays small and readable.

### 2. The data model is easy to inspect and recover

Storing books, authors, and series in plain JSON files makes the app easy to back up, inspect, and repair manually. For a local-first personal tool, that is a pragmatic choice.

### 3. The UI separation is reasonable

The split between:

- `BookForm.vue`
- `BookList.vue`
- `BookCard.vue`

is simple but clear. The form handles editing/input, the list handles layout, and the card handles presentation.

### 4. The Vite proxy setup is clean

`vite.config.js` keeps frontend requests simple by routing `/api/*` to the Express server. That avoids hardcoding backend origins inside components.

## Current architecture

### Frontend

`src/App.vue` is the stateful shell:

- fetches books/authors/series on mount
- stores current filters and sort settings
- computes the visible list client-side
- sends create/update/delete requests
- passes edit/remove events down to child components

`src/components/BookForm.vue`:

- handles both create and edit
- uploads the cover first, then emits a save payload
- fetches author/series suggestions separately

`src/components/BookList.vue` and `src/components/BookCard.vue`:

- render either grid or compact-list mode
- keep the display logic mostly presentational

### Backend

`server/index.js` is a file-backed CRUD API:

- `GET /books`
- `GET /authors`
- `GET /series`
- `POST /upload`
- `POST /books`
- `PUT /books/:id`
- `DELETE /books/:id`

The backend also:

- initializes missing JSON files
- stores uploaded covers under `server/covers/`
- appends discovered authors/series into lookup lists

## Main issues and risks

### 1. `GEMINI.md` overstates or drifts from the current UI

The documentation says filtering supports Author, Series, Language, Format, and Category. The code declares `category` in the filter state in `src/App.vue`, but there is no category filter control in the template. The feature is partially wired, not actually exposed.

The documentation also calls the app "local-first", but the current form falls back to an external placeholder image service when no cover is uploaded. That makes the experience partly network-dependent.

### 2. The frontend resets form state before the save is confirmed

In `src/components/BookForm.vue`, `submitForm()` emits `save`, then immediately resets the form state and clears the file input. The parent save handler in `src/App.vue` is async and may fail. If the request fails, the user can lose the form contents even though the book was not saved.

This is the most important UX flaw in the current flow.

### 3. Auxiliary lookup data only grows and never reconciles

`server/index.js` updates `authors.json` and `series.json` by appending new values on create/update, but delete and edit operations never remove values that are no longer used by any book.

That means autocomplete/filter values can become stale over time.

### 4. Persistence is intentionally simple, but fragile

The server reads and writes whole JSON files synchronously on every request. For a single local user, this is acceptable. But there is:

- no schema validation
- no corruption handling
- no write locking
- no conflict protection if multiple writes happen close together

This is fine for a hobby local app, but it is the main technical ceiling of the current design.

### 5. Upload handling is too permissive

`multer` accepts uploads without visible validation for:

- file type
- file size
- image dimensions

For a trusted local app this may be acceptable, but it is still a weak boundary and can lead to junk files or oversized uploads.

### 6. Error handling is thin across the stack

Examples:

- `src/App.vue` fetches data without checking `res.ok`
- `src/components/BookForm.vue` swallows suggestion-fetch failures
- the backend does not guard against malformed JSON files or failed file writes
- delete and save flows do not surface meaningful errors in the UI

The result is that failures are likely to degrade silently.

### 7. Persisted data is not consistently normalized

The sample data in `server/books.json` already mixes `null` and empty string values for `pageCount`. The UI and sort logic currently tolerate this through JavaScript coercion, but the data model is drifting.

The JSON also appears to contain mojibake for some French titles when read in this environment, which suggests an encoding inconsistency somewhere in the data pipeline or file history.

## Code-level observations

### `src/App.vue`

Strengths:

- centralizes the app state cleanly
- uses a computed property for filtering and sorting
- keeps CRUD flow easy to follow

Weak points:

- filter state includes `category`, but the UI does not expose it
- fetches do not verify HTTP status before parsing JSON
- all logic is concentrated in one component, so growth will make it bulky

### `src/components/BookForm.vue`

Strengths:

- sensible dual-purpose add/edit form
- tag entry for series is simple and usable
- cover upload is straightforward

Weak points:

- resets form before the save is confirmed
- pulls suggestions independently instead of reusing already-fetched app state
- uses an external placeholder image URL instead of a local fallback asset

### `src/components/BookCard.vue`

Strengths:

- supports both display modes with one component
- layout logic is readable

Weak points:

- presentation is tightly coupled to the current book schema
- no `alt` text on the cover image
- list mode becomes dense quickly as fields grow

### `server/index.js`

Strengths:

- very small surface area
- easy to understand and debug
- practical initialization of local storage files

Weak points:

- synchronous file I/O on every request
- no validation/sanitization layer
- no cleanup of orphaned covers when books are updated or deleted
- no reconciliation of authors/series indexes

## Maintainability outlook

This codebase is maintainable today because it is small. The main risk is not complexity yet; it is informal coupling.

Examples of that coupling:

- frontend and backend share an implicit schema with no validation contract
- `authors.json` and `series.json` are treated as derived indexes, but are stored independently and can drift from `books.json`
- form behavior depends on parent success, but the child resets optimistically

If the app grows, the first meaningful refactor should be to define a clearer book schema and derived-data rules.

## Recommended next steps

### High priority

1. Keep form state until save succeeds.
2. Add visible error states for load/save/delete failures.
3. Normalize stored book data on write.
4. Rebuild `authors.json` and `series.json` from `books.json` instead of only appending.

### Medium priority

1. Add upload validation for file type and size.
2. Add a local placeholder cover asset instead of using a remote image URL.
3. Add category filtering to the UI or remove it from the documented feature set.
4. Clean up orphaned cover files on replace/delete.

### Low priority

1. Split some `App.vue` state logic into a composable if the app grows.
2. Move server dependencies from `devDependencies` to `dependencies` if this is ever packaged beyond local development.
3. Add lightweight schema validation around request bodies and stored JSON.

## Verification notes

I was able to inspect the code and persisted data directly.

I also attempted a production build with `npm.cmd run build`, but the build did not complete in this sandboxed environment because Vite/esbuild failed with `spawn EPERM`. That looks like an environment restriction, not a clear application code error.
