<script setup>
import BookForm from './components/BookForm.vue'
import BookList from './components/BookList.vue'
import { useLibrary } from './composables/useLibrary'

const {
  authors,
  categories,
  deleteError,
  deletingBookId,
  editingBook,
  filteredBooks,
  filters,
  formResetToken,
  loadError,
  loading,
  removeBook,
  saveBook,
  saveError,
  saving,
  series,
  sortCriteria,
  sortOrder,
  viewMode,
  cancelEdit,
  editBook
} = useLibrary()
</script>

<template>
  <div class="container">
    <header>
      <h1>My Read Books</h1>
    </header>

    <main>
      <section class="form-section">
        <BookForm
          :authors="authors"
          :initial-data="editingBook"
          :is-saving="saving"
          :reset-token="formResetToken"
          :save-book="saveBook"
          :save-error="saveError"
          :series-options="series"
          @cancel="cancelEdit"
        />
      </section>

      <section class="controls-section">
        <div class="controls-header">
          <div class="view-toggle">
            <button :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'">Immersive Grid</button>
            <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">Compact List</button>
          </div>
        </div>

        <div class="controls-row">
          <span class="row-label">Filters:</span>
          <div class="controls-grid">
            <div class="control">
              <label>Author</label>
              <select v-model="filters.author">
                <option value="">All Authors</option>
                <option v-for="author in authors" :key="author" :value="author">{{ author }}</option>
              </select>
            </div>
            <div class="control">
              <label>Series</label>
              <select v-model="filters.series">
                <option value="">All Series</option>
                <option v-for="seriesName in series" :key="seriesName" :value="seriesName">{{ seriesName }}</option>
              </select>
            </div>
            <div class="control">
              <label>Language</label>
              <select v-model="filters.language">
                <option value="">All</option>
                <option value="french">French</option>
                <option value="english">English</option>
              </select>
            </div>
            <div class="control">
              <label>Format</label>
              <select v-model="filters.type">
                <option value="">All</option>
                <option value="paper">Paper</option>
                <option value="audio">Audio</option>
              </select>
            </div>
            <div class="control">
              <label>Category</label>
              <select v-model="filters.category">
                <option value="">All</option>
                <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="controls-row sort-row">
          <span class="row-label">Sort:</span>
          <div class="controls-grid">
            <div class="control">
              <label>Criteria</label>
              <select v-model="sortCriteria">
                <option value="endDate">Finish Date</option>
                <option value="pageCount">Page Count</option>
                <option value="length">Audio Length</option>
              </select>
            </div>
            <div class="control">
              <label>Direction</label>
              <select v-model="sortOrder">
                <option value="desc">Descending (High/New first)</option>
                <option value="asc">Ascending (Low/Old first)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section class="list-section">
        <div v-if="loadError" class="status-banner error">{{ loadError }}</div>
        <div v-if="deleteError" class="status-banner error">{{ deleteError }}</div>
        <div v-if="loading" class="loading">Loading library...</div>
        <BookList
          v-else
          :books="filteredBooks"
          :deleting-book-id="deletingBookId"
          :view-mode="viewMode"
          @edit-book="editBook"
          @remove-book="removeBook"
        />
      </section>
    </main>
  </div>
</template>

<style>
.container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
header { text-align: center; margin-bottom: 2rem; }
header h1 { color: var(--color-text-strong); }

.form-section { 
  background: var(--color-surface-2); 
  padding: 2rem; 
  border-radius: 12px; 
  box-shadow: 0 4px 20px var(--color-shadow); 
  margin-bottom: 2rem; 
  border: 1px solid var(--color-border);
}

.controls-section { 
  background: var(--color-surface-3); 
  padding: 1.5rem; 
  border-radius: 12px; 
  margin-bottom: 2rem; 
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.controls-header {
  display: flex;
  justify-content: flex-end;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1rem;
}

.view-toggle {
  display: flex;
  background: var(--color-surface-1);
  padding: 4px;
  border-radius: 8px;
}

.view-toggle button {
  background: transparent;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  color: var(--color-text-faint);
  font-size: 0.8rem;
  font-weight: bold;
  transition: all 0.2s;
  cursor: pointer;
}

.view-toggle button.active {
  background: var(--color-primary);
  color: var(--color-text-strong);
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.row-label {
  font-weight: bold;
  color: var(--color-primary);
  min-width: 80px;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.controls-grid { 
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  flex-grow: 1;
}

.control { display: flex; flex-direction: column; min-width: 150px; }
.control label { font-size: 0.75rem; font-weight: bold; margin-bottom: 0.3rem; color: var(--color-text-faint); }
.control select { 
  padding: 0.4rem; 
  border-radius: 6px; 
  border: 1px solid var(--color-border-strong); 
  background: var(--color-surface-5);
  color: var(--color-text-strong);
  font-size: 0.8rem;
}

.status-banner {
  margin-bottom: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-error-border);
  background: var(--color-error-bg);
  color: var(--color-error-text);
}

.loading { text-align: center; font-size: 1.2rem; color: var(--color-text-subtle); padding: 4rem; }

@media (max-width: 800px) {
  .container { padding: 1rem; }
  .controls-row { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  .row-label { min-width: auto; }
}
</style>
