<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  authors: {
    type: Array,
    default: () => []
  },
  initialData: {
    type: Object,
    default: null
  },
  isSaving: {
    type: Boolean,
    default: false
  },
  resetToken: {
    type: Number,
    default: 0
  },
  saveBook: {
    type: Function,
    required: true
  },
  saveError: {
    type: String,
    default: ''
  },
  seriesOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['cancel'])

const getDefaultState = () => ({
  title: '', author: '', cover: null, currentCover: '',
  startDate: '', endDate: '', type: 'paper', language: 'french',
  category: 'novel', pageCount: null, length: null, series: []
})

const book = ref(getDefaultState())
const fileInput = ref(null)
const currentSeriesTag = ref('')
const localError = ref('')

const displayError = computed(() => localError.value || props.saveError)

const resetForm = () => {
  book.value = getDefaultState()
  currentSeriesTag.value = ''
  localError.value = ''

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

watch(() => props.initialData, (newVal) => {
  localError.value = ''

  if (newVal) {
    book.value = {
      ...getDefaultState(),
      ...newVal,
      currentCover: newVal.cover || '',
      cover: null,
      series: Array.isArray(newVal.series) ? [...newVal.series] : []
    }
  } else {
    resetForm()
  }
}, { immediate: true })

watch(() => props.resetToken, () => {
  if (!props.initialData) {
    resetForm()
  }
})

const addSeriesTag = () => {
  const tag = currentSeriesTag.value.trim()
  if (tag && !book.value.series.includes(tag)) book.value.series.push(tag)
  currentSeriesTag.value = ''
}

const uploadCover = async (file) => {
  const formData = new FormData()
  formData.append('cover', file)

  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) {
    let message = 'Unable to upload the cover.'

    try {
      const payload = await res.json()
      message = payload?.error || message
    } catch {
      // Ignore malformed error responses.
    }

    throw new Error(message)
  }

  const data = await res.json()
  return data.url
}

const submitForm = async () => {
  localError.value = ''

  try {
    let finalCoverUrl = book.value.currentCover || '/placeholder-cover.svg'

    if (book.value.cover) {
      finalCoverUrl = await uploadCover(book.value.cover)
    }

    const payload = { ...book.value, cover: finalCoverUrl }
    delete payload.currentCover

    const didSave = await props.saveBook(payload)
    if (didSave) {
      resetForm()
    }
  } catch (error) {
    localError.value = error.message || 'Unable to save the book.'
  }
}
</script>

<template>
  <form @submit.prevent="submitForm" class="book-form">
    <h3>{{ book.id ? 'Edit Book' : 'Add a New Book' }}</h3>
    <p v-if="displayError" class="form-error">{{ displayError }}</p>
    
    <div class="form-grid">
      <div class="field title-field">
        <label>Title</label>
        <input v-model="book.title" type="text" required />
      </div>

      <div class="field author-field">
        <label>Author</label>
        <input v-model="book.author" list="author-suggestions" type="text" />
        <datalist id="author-suggestions">
          <option v-for="author in authors" :key="author" :value="author" />
        </datalist>
      </div>

      <div class="field">
        <label>Cover (leave empty to keep current)</label>
        <input ref="fileInput" accept="image/*" type="file" @change="e => book.cover = e.target.files[0] || null" />
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
        <input v-model.number="book.pageCount" type="number" min="0" />
      </div>

      <div v-if="book.type === 'audio'" class="field">
        <label>Length (Hours)</label>
        <input v-model.number="book.length" type="number" min="0" step="0.1" />
      </div>

      <div class="field series-field">
        <label>Series / Tags</label>
        <div class="tag-input-wrapper">
          <input v-model="currentSeriesTag" list="series-suggestions" @keydown.enter.prevent="addSeriesTag" />
          <datalist id="series-suggestions">
            <option v-for="seriesName in seriesOptions" :key="seriesName" :value="seriesName" />
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
        <button v-if="book.id" :disabled="isSaving" type="button" @click="emit('cancel')" class="btn-cancel">Cancel</button>
        <button :disabled="isSaving" type="submit" class="btn-primary">{{ isSaving ? 'Saving...' : (book.id ? 'Update Book' : 'Add Book') }}</button>
      </div>
    </div>
  </form>
</template>

<style scoped>
.book-form h3 { margin-bottom: 1.5rem; color: var(--color-text-strong); }
.form-error {
  margin-bottom: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-error-border);
  background: var(--color-error-bg);
  color: var(--color-error-text);
}
.form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; }
.field { display: flex; flex-direction: column; }
.field label { font-size: 0.9rem; margin-bottom: 0.4rem; font-weight: bold; color: var(--color-text); }
input, select { 
  padding: 0.8rem; 
  border: 1px solid var(--color-border-strong); 
  border-radius: 6px; 
  background: var(--color-surface-4);
  color: var(--color-text-strong);
}
input:focus, select:focus {
  outline: none;
  border-color: var(--color-primary);
}
.title-field, .author-field, .series-field { grid-column: span 2; }
.tag-input-wrapper { display: flex; gap: 0.5rem; }
.tags-preview { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
.tag-pill { 
  background: var(--color-surface-5); 
  padding: 4px 10px; 
  border-radius: 20px; 
  font-size: 0.85rem; 
  border: 1px solid var(--color-border-strong); 
  color: var(--color-primary);
}
.tag-pill button { background: none; border: none; color: var(--color-accent-danger-strong); cursor: pointer; }
.action { grid-column: span 2; display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
.btn-add-tag,
.btn-primary,
.btn-cancel { border: none; border-radius: 6px; font-weight: bold; }
.btn-add-tag { padding: 0 1rem; background: var(--color-surface-6); color: var(--color-text-strong); }
.btn-primary { background: var(--color-primary); color: var(--color-text-strong); padding: 0.8rem 1.5rem; }
.btn-cancel { background: var(--color-surface-6); color: var(--color-text-strong); padding: 0.8rem 1.5rem; }
.btn-add-tag:disabled,
.btn-primary:disabled,
.btn-cancel:disabled { opacity: 0.65; cursor: not-allowed; }

@media (max-width: 800px) {
  .title-field, .author-field, .series-field, .action { grid-column: span 1; }
}
</style>
