<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps(['initialData'])
const emit = defineEmits(['save', 'cancel'])

const getDefaultState = () => ({
  title: '', author: '', cover: null, currentCover: '',
  startDate: '', endDate: '', type: 'paper', language: 'french',
  category: 'novel', pageCount: null, length: null, series: []
})

const book = ref(getDefaultState())
const fileInput = ref(null)
const currentSeriesTag = ref('')
const knownSeries = ref([])
const knownAuthors = ref([])

const fetchData = async () => {
  try {
    const [s, a] = await Promise.all([fetch('/api/series'), fetch('/api/authors')])
    knownSeries.value = await s.json()
    knownAuthors.value = await a.json()
  } catch (e) {}
}

onMounted(fetchData)

watch(() => props.initialData, (newVal) => {
  if (newVal) {
    book.value = { ...newVal, currentCover: newVal.cover, cover: null }
  } else {
    book.value = getDefaultState()
  }
}, { immediate: true })

const addSeriesTag = () => {
  const tag = currentSeriesTag.value.trim()
  if (tag && !book.value.series.includes(tag)) book.value.series.push(tag)
  currentSeriesTag.value = ''
}

const submitForm = async () => {
  let finalCoverUrl = book.value.currentCover || ''
  
  if (book.value.cover) {
    const formData = new FormData()
    formData.append('cover', book.value.cover)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    finalCoverUrl = data.url
  } else if (!finalCoverUrl) {
    finalCoverUrl = `https://placehold.co/200x300/e0e0e0/333333?text=${encodeURIComponent(book.value.title)}`
  }

  const payload = { ...book.value, cover: finalCoverUrl }
  delete payload.currentCover
  emit('save', payload)
  book.value = getDefaultState()
  if (fileInput.value) fileInput.value.value = ''
  fetchData()
}
</script>

<template>
  <form @submit.prevent="submitForm" class="book-form">
    <h3>{{ book.id ? 'Edit Book' : 'Add a New Book' }}</h3>
    
    <div class="form-grid">
      <div class="field title-field">
        <label>Title</label>
        <input v-model="book.title" type="text" required />
      </div>

      <div class="field author-field">
        <label>Author</label>
        <input v-model="book.author" list="author-suggestions" type="text" />
        <datalist id="author-suggestions">
          <option v-for="a in knownAuthors" :key="a" :value="a" />
        </datalist>
      </div>

      <div class="field">
        <label>Cover (leave empty to keep current)</label>
        <input ref="fileInput" type="file" @change="e => book.cover = e.target.files[0]" />
      </div>

      <div class="field">
        <label>Start Date</label>
        <input v-model="book.startDate" type="date" />
      </div>

      <div class="field">
        <label>End Date</label>
        <input v-model="book.endDate" type="date" />
      </div>

      <div class="field">
        <label>Format</label>
        <select v-model="book.type">
          <option value="paper">Paper</option>
          <option value="audio">Audio</option>
        </select>
      </div>

      <div class="field">
        <label>Language</label>
        <select v-model="book.language">
          <option value="french">French</option>
          <option value="english">English</option>
        </select>
      </div>

      <div class="field">
        <label>Category</label>
        <select v-model="book.category">
          <option value="programming">Programming</option>
          <option value="novel">Novel</option>
        </select>
      </div>

      <div v-if="book.type === 'paper'" class="field">
        <label>Page Count</label>
        <input v-model.number="book.pageCount" type="number" />
      </div>

      <div v-if="book.type === 'audio'" class="field">
        <label>Length (Hours)</label>
        <input v-model.number="book.length" type="number" step="0.1" />
      </div>

      <div class="field series-field">
        <label>Series / Tags</label>
        <div class="tag-input-wrapper">
          <input v-model="currentSeriesTag" list="series-suggestions" @keydown.enter.prevent="addSeriesTag" />
          <datalist id="series-suggestions">
            <option v-for="s in knownSeries" :key="s" :value="s" />
          </datalist>
          <button type="button" @click="addSeriesTag" class="btn-add-tag">+</button>
        </div>
        <div class="tags-preview">
          <span v-for="tag in book.series" :key="tag" class="tag-pill">
            {{ tag }} <button type="button" @click="book.series = book.series.filter(t => t !== tag)">&times;</button>
          </span>
        </div>
      </div>

      <div class="field action">
        <button v-if="book.id" type="button" @click="emit('cancel')" class="btn-cancel">Cancel</button>
        <button type="submit" class="btn-primary">{{ book.id ? 'Update Book' : 'Add Book' }}</button>
      </div>
    </div>
  </form>
</template>

<style scoped>
.book-form h3 { margin-bottom: 1.5rem; color: #ffffff; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; }
.field { display: flex; flex-direction: column; }
.field label { font-size: 0.9rem; margin-bottom: 0.4rem; font-weight: bold; color: #ccc; }
input, select { 
  padding: 0.8rem; 
  border: 1px solid #444; 
  border-radius: 6px; 
  background: #2a2a2a;
  color: #fff;
}
input:focus, select:focus {
  outline: none;
  border-color: #3498db;
}
.title-field, .author-field, .series-field { grid-column: span 2; }
.tag-input-wrapper { display: flex; gap: 0.5rem; }
.tags-preview { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
.tag-pill { 
  background: #333; 
  padding: 4px 10px; 
  border-radius: 20px; 
  font-size: 0.85rem; 
  border: 1px solid #444; 
  color: #3498db;
}
.tag-pill button { background: none; border: none; color: #e74c3c; cursor: pointer; }
.action { grid-column: span 2; display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
.btn-primary { background: #3498db; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 6px; font-weight: bold; }
.btn-cancel { background: #444; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 6px; font-weight: bold; }
</style>
