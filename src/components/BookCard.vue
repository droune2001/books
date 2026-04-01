<script setup>
defineProps(['book', 'viewMode'])
const emit = defineEmits(['edit', 'remove'])

const formatDate = (d) => {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('fr-FR')
}
</script>

<template>
  <div :class="['book-card', viewMode]">
    <div class="cover">
      <img :src="book.cover" />
      <div v-if="viewMode === 'grid'" class="badges">
        <span class="badge type">{{ book.type }}</span>
        <span class="badge lang">{{ book.language }}</span>
        <span class="badge cat">{{ book.category }}</span>
      </div>
    </div>
    
    <div class="content">
      <div class="header">
        <div class="title-row">
          <h4>{{ book.title }}</h4>
          <div v-if="viewMode === 'list'" class="list-badges">
            <span class="badge type">{{ book.type }}</span>
            <span class="badge lang">{{ book.language }}</span>
            <span class="badge cat">{{ book.category }}</span>
          </div>
        </div>
        <p class="author" v-if="book.author">by {{ book.author }}</p>
      </div>

      <div class="series-list" v-if="book.series?.length">
        <span v-for="s in book.series" :key="s" class="series-tag">#{{ s }}</span>
      </div>

      <div class="info">
        <span v-if="book.pageCount"><strong>{{ book.pageCount }}</strong> pages</span>
        <span v-if="book.length"><strong>{{ book.length }}</strong>h</span>
        <span class="separator" v-if="(book.pageCount || book.length) && book.category"> | </span>
        <span class="cat-text" v-if="book.category">{{ book.category }}</span>
      </div>
      
      <div class="dates">
        <span>{{ formatDate(book.startDate) }} &rarr; {{ formatDate(book.endDate) }}</span>
      </div>
      
      <div class="card-actions">
        <button @click="emit('edit')" class="btn-edit">Edit</button>
        <button @click="emit('remove')" class="btn-remove">Delete</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.book-card { 
  background: #1e1e1e; 
  border-radius: 12px; 
  overflow: hidden; 
  box-shadow: 0 4px 15px rgba(0,0,0,0.4); 
  display: flex; 
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid #333;
}

/* GRID MODE (RESTORED) */
.book-card.grid {
  flex-direction: column;
}
.book-card.grid:hover { 
  transform: translateY(-8px); 
  box-shadow: 0 12px 25px rgba(0,0,0,0.6);
  border-color: #444;
}
.book-card.grid .cover { position: relative; height: 350px; background: #2a2a2a; }
.book-card.grid .cover img { width: 100%; height: 100%; object-fit: cover; }
.book-card.grid .content { padding: 0.75rem 1.25rem 1.25rem 1.25rem; flex-grow: 1; display: flex; flex-direction: column; }
.book-card.grid .info { margin-bottom: 0.75rem; border-top: 1px solid #333; padding-top: 0.5rem; font-size: 0.85rem; }
.book-card.grid .info .separator, .book-card.grid .info .cat-text { display: none; }
.book-card.grid .dates { font-size: 0.8rem; color: #7f8c8d; margin-bottom: 1rem; }
.book-card.grid .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: auto; }
.book-card.grid .card-actions button { padding: 0.5rem; font-size: 0.8rem; }

/* LIST MODE (COMPACT - MAINTAINED) */
.book-card.list {
  flex-direction: row;
  height: 100px;
}
.book-card.list .cover { width: 70px; height: 100%; flex-shrink: 0; }
.book-card.list .cover img { width: 100%; height: 100%; object-fit: cover; }
.book-card.list .content { 
  padding: 0 1.25rem; 
  flex-grow: 1; 
  display: grid; 
  grid-template-columns: 2.5fr 1fr 1fr 1.5fr 80px;
  align-items: center;
  gap: 1rem;
}
.book-card.list .header { margin-bottom: 0; min-width: 0; }
.book-card.list h4 { font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.book-card.list .author { font-size: 0.8rem; }
.book-card.list .series-list { margin-bottom: 0; font-size: 0.8rem; }
.book-card.list .info { border-top: none; padding-top: 0; margin-bottom: 0; font-size: 0.8rem; }
.book-card.list .dates { margin-bottom: 0; font-size: 0.8rem; white-space: nowrap; }
.book-card.list .card-actions { display: flex; flex-direction: column; gap: 4px; }
.book-card.list .card-actions button { padding: 4px; font-size: 0.7rem; width: 100%; }

/* SHARED */
.badges { position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 5px; }
.list-badges { display: flex; gap: 5px; margin-left: 10px; flex-shrink: 0; }
.title-row { display: flex; align-items: center; min-width: 0; }
.badge { padding: 2px 6px; border-radius: 4px; font-size: 0.6rem; font-weight: bold; text-transform: uppercase; color: white; }
.badge.type { background: #d35400; }
.badge.lang { background: #27ae60; }
.badge.cat { background: #8e44ad; }

h4 { margin: 0; color: #ffffff; }
.author { margin: 0; font-style: italic; color: #aaaaaa; }
.series-tag { font-size: 0.75rem; color: #3498db; }
.info { color: #ccc; }
.dates { color: #7f8c8d; }

.card-actions button { border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
.btn-edit { background: #f39c12; color: #fff; }
.btn-remove { background: #c0392b; color: white; }

@media (max-width: 1100px) {
  .book-card.list .content { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; padding: 0.5rem 1rem; }
  .book-card.list { height: auto; min-height: 100px; }
  .book-card.list .card-actions { grid-column: span 2; flex-direction: row; }
}
</style>
