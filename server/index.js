const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const port = 3001;
const dbPath = path.join(__dirname, 'books.json');
const seriesPath = path.join(__dirname, 'series.json');
const authorsPath = path.join(__dirname, 'authors.json');
const coversDir = path.join(__dirname, 'covers');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, coversDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/covers', express.static(coversDir));

// Init files
[dbPath, seriesPath, authorsPath].forEach(p => {
  if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify([], null, 2));
});
if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir);

// Helpers
const updateList = (filePath, newItems) => {
  if (!newItems) return;
  const items = Array.isArray(newItems) ? newItems : [newItems];
  const current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const updated = Array.from(new Set([...current, ...items])).filter(Boolean);
  fs.writeFileSync(filePath, JSON.stringify(updated.sort(), null, 2));
};

app.get('/series', (req, res) => res.json(JSON.parse(fs.readFileSync(seriesPath, 'utf8'))));
app.get('/authors', (req, res) => res.json(JSON.parse(fs.readFileSync(authorsPath, 'utf8'))));
app.get('/books', (req, res) => res.json(JSON.parse(fs.readFileSync(dbPath, 'utf8'))));

app.post('/upload', upload.single('cover'), (req, res) => {
  res.json({ url: `/api/covers/${req.file.filename}` });
});

app.post('/books', (req, res) => {
  const books = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const newBook = { ...req.body, id: Date.now().toString() };
  books.push(newBook);
  updateList(seriesPath, newBook.series);
  updateList(authorsPath, newBook.author);
  fs.writeFileSync(dbPath, JSON.stringify(books, null, 2));
  res.status(201).json(newBook);
});

app.put('/books/:id', (req, res) => {
  let books = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const index = books.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).send();
  
  books[index] = { ...req.body, id: req.params.id };
  updateList(seriesPath, books[index].series);
  updateList(authorsPath, books[index].author);
  fs.writeFileSync(dbPath, JSON.stringify(books, null, 2));
  res.json(books[index]);
});

app.delete('/books/:id', (req, res) => {
  let books = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  books = books.filter(b => b.id !== req.params.id);
  fs.writeFileSync(dbPath, JSON.stringify(books, null, 2));
  res.status(204).send();
});

app.listen(port, () => console.log(`Server at http://localhost:${port}`));
