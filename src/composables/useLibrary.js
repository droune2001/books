import { computed, onMounted, ref } from 'vue'

const defaultFilters = () => ({
  author: '',
  series: '',
  language: '',
  category: '',
  type: ''
})

const sortStrings = (values) => [...values].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))

const parseErrorPayload = async (response) => {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const payload = await response.json()
    return payload?.error || payload?.message || `Request failed (${response.status})`
  }

  const text = await response.text()
  return text || `Request failed (${response.status})`
}

const requestJson = async (url, options) => {
  const response = await fetch(url, options)

  if (!response.ok) {
    throw new Error(await parseErrorPayload(response))
  }

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return null
  }

  return response.json()
}

export const useLibrary = () => {
  const books = ref([])
  const authors = ref([])
  const series = ref([])
  const loading = ref(true)
  const saving = ref(false)
  const deletingBookId = ref('')
  const loadError = ref('')
  const saveError = ref('')
  const deleteError = ref('')
  const editingBook = ref(null)
  const formResetToken = ref(0)

  const filters = ref(defaultFilters())
  const sortCriteria = ref('endDate')
  const sortOrder = ref('desc')
  const viewMode = ref('grid')

  const fetchData = async () => {
    loading.value = true
    loadError.value = ''

    try {
      const [booksData, authorsData, seriesData] = await Promise.all([
        requestJson('/api/books'),
        requestJson('/api/authors'),
        requestJson('/api/series')
      ])

      books.value = Array.isArray(booksData) ? booksData : []
      authors.value = Array.isArray(authorsData) ? authorsData : []
      series.value = Array.isArray(seriesData) ? seriesData : []
    } catch (error) {
      loadError.value = error.message || 'Unable to load the library.'
    } finally {
      loading.value = false
    }
  }

  const filteredBooks = computed(() => {
    const list = books.value
      .filter((book) => !filters.value.author || book.author === filters.value.author)
      .filter((book) => !filters.value.series || book.series?.includes(filters.value.series))
      .filter((book) => !filters.value.language || book.language === filters.value.language)
      .filter((book) => !filters.value.category || book.category === filters.value.category)
      .filter((book) => !filters.value.type || book.type === filters.value.type)
      .slice()

    list.sort((a, b) => {
      let valueA = 0
      let valueB = 0

      if (sortCriteria.value === 'endDate') {
        valueA = new Date(a.endDate || 0).getTime()
        valueB = new Date(b.endDate || 0).getTime()
      } else if (sortCriteria.value === 'pageCount') {
        valueA = a.pageCount || 0
        valueB = b.pageCount || 0
      } else if (sortCriteria.value === 'length') {
        valueA = a.length || 0
        valueB = b.length || 0
      }

      return sortOrder.value === 'asc' ? valueA - valueB : valueB - valueA
    })

    return list
  })

  const categories = computed(() => {
    const values = new Set(books.value.map((book) => book.category).filter(Boolean))
    return sortStrings(values)
  })

  const saveBook = async (bookData) => {
    saving.value = true
    saveError.value = ''

    const method = bookData.id ? 'PUT' : 'POST'
    const url = bookData.id ? `/api/books/${bookData.id}` : '/api/books'

    try {
      await requestJson(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
      })

      editingBook.value = null
      formResetToken.value += 1
      await fetchData()
      return true
    } catch (error) {
      saveError.value = error.message || 'Unable to save the book.'
      return false
    } finally {
      saving.value = false
    }
  }

  const editBook = (book) => {
    saveError.value = ''
    editingBook.value = { ...book, series: Array.isArray(book.series) ? [...book.series] : [] }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    editingBook.value = null
    saveError.value = ''
  }

  const removeBook = async (id) => {
    if (!window.confirm('Are you sure?')) {
      return
    }

    deletingBookId.value = id
    deleteError.value = ''

    try {
      await requestJson(`/api/books/${id}`, { method: 'DELETE' })

      if (editingBook.value?.id === id) {
        editingBook.value = null
        formResetToken.value += 1
      }

      await fetchData()
    } catch (error) {
      deleteError.value = error.message || 'Unable to delete the book.'
    } finally {
      deletingBookId.value = ''
    }
  }

  onMounted(fetchData)

  return {
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
  }
}
