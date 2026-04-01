const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const multer = require('multer')

const app = express()
const port = 3001

const dbPath = path.join(__dirname, 'books.json')
const seriesPath = path.join(__dirname, 'series.json')
const authorsPath = path.join(__dirname, 'authors.json')
const coversDir = path.join(__dirname, 'covers')

const PLACEHOLDER_COVER_URL = '/placeholder-cover.svg'
const MAX_COVER_FILE_SIZE = 5 * 1024 * 1024
const allowedImageTypes = new Set([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp'
])

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, coversDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`)
})

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_COVER_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      cb(new Error('Unsupported cover type. Upload PNG, JPEG, GIF, SVG, or WebP.'))
      return
    }

    cb(null, true)
  }
})

app.use(cors())
app.use(express.json())
app.use('/covers', express.static(coversDir))

const ensureStorage = () => {
  ;[dbPath, seriesPath, authorsPath].forEach((targetPath) => {
    if (!fs.existsSync(targetPath)) {
      fs.writeFileSync(targetPath, JSON.stringify([], null, 2))
    }
  })

  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir)
  }
}

const readJsonArray = (filePath) => {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeJson = (filePath, payload) => {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2))
}

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '')

const normalizeDate = (value) => {
  const normalized = normalizeString(value)
  if (!normalized || !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return ''
  }

  const timestamp = Date.parse(`${normalized}T00:00:00Z`)
  return Number.isNaN(timestamp) ? '' : normalized
}

const normalizeNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null
  }

  return numericValue
}

const normalizeSeries = (value) => {
  const values = Array.isArray(value) ? value : [value]
  return Array.from(new Set(values.map(normalizeString).filter(Boolean)))
}

const normalizeType = (value) => (value === 'audio' ? 'audio' : 'paper')
const normalizeLanguage = (value) => (value === 'english' ? 'english' : 'french')
const normalizeCategory = (value) => normalizeString(value) || 'novel'
const normalizeCover = (value) => normalizeString(value) || PLACEHOLDER_COVER_URL

const normalizeStoredBook = (input, fallbackId) => {
  const type = normalizeType(input?.type)

  return {
    id: normalizeString(input?.id) || String(fallbackId),
    title: normalizeString(input?.title) || 'Untitled',
    author: normalizeString(input?.author),
    cover: normalizeCover(input?.cover),
    startDate: normalizeDate(input?.startDate),
    endDate: normalizeDate(input?.endDate),
    type,
    language: normalizeLanguage(input?.language),
    category: normalizeCategory(input?.category),
    pageCount: type === 'paper' ? normalizeNumber(input?.pageCount) : null,
    length: type === 'audio' ? normalizeNumber(input?.length) : null,
    series: normalizeSeries(input?.series)
  }
}

const validateBookInput = (input, id) => {
  const title = normalizeString(input?.title)
  if (!title) {
    return { error: 'Title is required.' }
  }

  const type = normalizeType(input?.type)

  return {
    book: {
      id,
      title,
      author: normalizeString(input?.author),
      cover: normalizeCover(input?.cover),
      startDate: normalizeDate(input?.startDate),
      endDate: normalizeDate(input?.endDate),
      type,
      language: normalizeLanguage(input?.language),
      category: normalizeCategory(input?.category),
      pageCount: type === 'paper' ? normalizeNumber(input?.pageCount) : null,
      length: type === 'audio' ? normalizeNumber(input?.length) : null,
      series: normalizeSeries(input?.series)
    }
  }
}

const uniqueSorted = (values) => Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))

const extractLocalCoverFilename = (coverUrl) => {
  const normalized = normalizeString(coverUrl)
  if (!normalized.startsWith('/api/covers/')) {
    return ''
  }

  return path.basename(normalized)
}

const cleanupOrphanedCoverFiles = (books) => {
  const referencedCoverFiles = new Set(
    books
      .map((book) => extractLocalCoverFilename(book.cover))
      .filter(Boolean)
  )

  for (const fileName of fs.readdirSync(coversDir)) {
    if (!referencedCoverFiles.has(fileName)) {
      fs.unlinkSync(path.join(coversDir, fileName))
    }
  }
}

const rebuildIndexes = (books) => {
  const authorValues = uniqueSorted(books.map((book) => book.author))
  const seriesValues = uniqueSorted(books.flatMap((book) => book.series || []))

  writeJson(authorsPath, authorValues)
  writeJson(seriesPath, seriesValues)
}

const readBooks = () => readJsonArray(dbPath).map((book, index) => normalizeStoredBook(book, Date.now() + index))

const persistBooks = (books) => {
  const normalizedBooks = books.map((book, index) => normalizeStoredBook(book, Date.now() + index))
  writeJson(dbPath, normalizedBooks)
  rebuildIndexes(normalizedBooks)
  cleanupOrphanedCoverFiles(normalizedBooks)
  return normalizedBooks
}

ensureStorage()
persistBooks(readBooks())

app.get('/series', (req, res) => {
  res.json(readJsonArray(seriesPath))
})

app.get('/authors', (req, res) => {
  res.json(readJsonArray(authorsPath))
})

app.get('/books', (req, res) => {
  res.json(readBooks())
})

app.post('/upload', upload.single('cover'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'A cover image is required.' })
    return
  }

  res.json({ url: `/api/covers/${req.file.filename}` })
})

app.post('/books', (req, res) => {
  const validation = validateBookInput(req.body, Date.now().toString())
  if (validation.error) {
    res.status(400).json({ error: validation.error })
    return
  }

  const books = readBooks()
  const newBook = validation.book
  const updatedBooks = persistBooks([...books, newBook])
  const savedBook = updatedBooks.find((book) => book.id === newBook.id) || newBook

  res.status(201).json(savedBook)
})

app.put('/books/:id', (req, res) => {
  const books = readBooks()
  const index = books.findIndex((book) => book.id === req.params.id)

  if (index === -1) {
    res.status(404).json({ error: 'Book not found.' })
    return
  }

  const validation = validateBookInput(req.body, req.params.id)
  if (validation.error) {
    res.status(400).json({ error: validation.error })
    return
  }

  books[index] = validation.book
  const updatedBooks = persistBooks(books)
  res.json(updatedBooks[index])
})

app.delete('/books/:id', (req, res) => {
  const books = readBooks()
  const nextBooks = books.filter((book) => book.id !== req.params.id)

  if (nextBooks.length === books.length) {
    res.status(404).json({ error: 'Book not found.' })
    return
  }

  persistBooks(nextBooks)
  res.status(204).send()
})

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'Cover image is too large. Maximum size is 5 MB.' })
    return
  }

  if (err) {
    res.status(400).json({ error: err.message || 'Request failed.' })
    return
  }

  next()
})

app.listen(port, () => console.log(`Server at http://localhost:${port}`))
