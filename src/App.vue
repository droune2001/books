<script setup>
import { ref, onMounted, computed } from 'vue'
import BookForm from './components/BookForm.vue'
import BookList from './components/BookList.vue'

const books = ref([])
const loading = ref(true)
const editingBook = ref(null)

const authors = ref([])
const series = ref([])

const filters = ref({
  author: '',
  series: '',
  language: '',
  category: '',
  type: ''
})

const sortCriteria = ref('endDate')
const sortOrder = ref('desc')
const viewMode = ref('grid') // 'grid' or 'list'

const fetchData = async () => {
  loading.value = true
  try {
    const [bRes, aRes, sRes] = await Promise.all([
      fetch('/api/books'),
      fetch('/api/authors'),
      fetch('/api/series')
    ])
    books.value = await bRes.json()
    authors.value = await aRes.json()
    series.value = await sRes.json()
  } finally {
    loading.value = false
  }
}

const filteredBooks = computed(() => {
  let list = [...books.value]
  if (filters.value.author) list = list.filter(b => b.author === filters.value.author)
  if (filters.value.series) list = list.filter(b => b.series?.includes(filters.value.series))
  if (filters.value.language) list = list.filter(b => b.language === filters.value.language)
  if (filters.value.category) list = list.filter(b => b.category === filters.value.category)
  if (filters.value.type) list = list.filter(b => b.type === filters.value.type)

  list.sort((a, b) => {
    let valA = 0, valB = 0
    if (sortCriteria.value === 'endDate') {
      valA = new Date(a.endDate || 0).getTime()
      valB = new Date(b.endDate || 0).getTime()
    } else if (sortCriteria.value === 'pageCount') {
      valA = a.pageCount || 0
      valB = b.pageCount || 0
    } else if (sortCriteria.value === 'length') {
      valA = a.length || 0
      valB = b.length || 0
    }
    return sortOrder.value === 'asc' ? valA - valB : valB - valA
  })
  return list
})

const handleSaveBook = async (bookData) => {
  const method = bookData.id ? 'PUT' : 'POST'
  const url = bookData.id ? `/api/books/${bookData.id}` : '/api/books'
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookData)
    })
    if (res.ok) {
      editingBook.value = null
      await fetchData()
    }
  } catch (e) { console.error('Save failed', e) }
}

const editBook = (book) => {
  editingBook.value = { ...book }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const cancelEdit = () => { editingBook.value = null }

const removeBook = async (id) => {
  if (!confirm('Are you sure?')) return
  await fetch(`/api/books/${id}`, { method: 'DELETE' })
  await fetchData()
}

onMounted(fetchData)
</script>

<template>
  <div class="container">
    <header>
      <h1>My Read Books</h1>
    </header>

    <main>
      <section class="form-section">
        <BookForm :initial-data="editingBook" @save="handleSaveBook" @cancel="cancelEdit" />
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
                <option v-for="a in authors" :key="a" :value="a">{{ a }}</option>
              </select>
            </div>
            <div class="control">
              <label>Series</label>
              <select v-model="filters.series">
                <option value="">All Series</option>
                <option v-for="s in series" :key="s" :value="s">{{ s }}</option>
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
        <div v-if="loading" class="loading">Loading library...</div>
        <BookList 
          v-else 
          :books="filteredBooks" 
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
header h1 { color: #ffffff; }

.form-section { 
  background: #1e1e1e; 
  padding: 2rem; 
  border-radius: 12px; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.3); 
  margin-bottom: 2rem; 
  border: 1px solid #333;
}

.controls-section { 
  background: #252525; 
  padding: 1.5rem; 
  border-radius: 12px; 
  margin-bottom: 2rem; 
  border: 1px solid #333;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.controls-header {
  display: flex;
  justify-content: flex-end;
  border-bottom: 1px solid #333;
  padding-bottom: 1rem;
}

.view-toggle {
  display: flex;
  background: #1a1a1a;
  padding: 4px;
  border-radius: 8px;
}

.view-toggle button {
  background: transparent;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  color: #777;
  font-size: 0.8rem;
  font-weight: bold;
  transition: all 0.2s;
  cursor: pointer;
}

.view-toggle button.active {
  background: #3498db;
  color: white;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.row-label {
  font-weight: bold;
  color: #3498db;
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
.control label { font-size: 0.75rem; font-weight: bold; margin-bottom: 0.3rem; color: #777; }
.control select { 
  padding: 0.4rem; 
  border-radius: 6px; 
  border: 1px solid #444; 
  background: #333;
  color: #fff;
  font-size: 0.8rem;
}

.loading { text-align: center; font-size: 1.2rem; color: #7f8c8d; padding: 4rem; }

@media (max-width: 800px) {
  .controls-row { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  .row-label { min-width: auto; }
}
</style>
