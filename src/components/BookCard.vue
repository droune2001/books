<script setup>
const props = defineProps({
  book: {
    type: Object,
    required: true
  },
  isDeleting: {
    type: Boolean,
    default: false
  },
  viewMode: {
    type: String,
    default: 'grid'
  }
})
const emit = defineEmits(['edit', 'remove'])

const formatDate = (d) => {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('fr-FR')
}

const fallbackCover = (event) => {
  if (event.target.dataset.fallbackApplied) {
    return
  }

  event.target.dataset.fallbackApplied = 'true'
  event.target.src = '/placeholder-cover.svg'
}
</script>

<template>
  <div :class="['book-card', viewMode]">
    <div class="cover">
      <img :alt="`Cover of ${props.book.title}`" :src="props.book.cover || '/placeholder-cover.svg'" @error="fallbackCover" />
      <div v-if="viewMode === 'grid'" class="badges">
        <span class="badge type">{{ props.book.type }}</span>
        <span class="badge lang">{{ props.book.language }}</span>
        <span class="badge cat">{{ props.book.category }}</span>
      </div>
    </div>
    
    <div class="content">
      <div class="header">
        <div class="title-row">
          <h4>{{ props.book.title }}</h4>
          <div v-if="viewMode === 'list'" class="list-badges">
            <span class="badge type">{{ props.book.type }}</span>
            <span class="badge lang">{{ props.book.language }}</span>
            <span class="badge cat">{{ props.book.category }}</span>
          </div>
        </div>
        <p class="author" v-if="props.book.author">by {{ props.book.author }}</p>
      </div>

      <div class="series-list" v-if="props.book.series?.length">
        <span v-for="s in props.book.series" :key="s" class="series-tag">#{{ s }}</span>
      </div>

      <div class="info">
        <span v-if="props.book.pageCount"><strong>{{ props.book.pageCount }}</strong> pages</span>
        <span v-if="props.book.length"><strong>{{ props.book.length }}</strong>h</span>
        <span class="separator" v-if="(props.book.pageCount || props.book.length) && props.book.category"> | </span>
        <span class="cat-text" v-if="props.book.category">{{ props.book.category }}</span>
      </div>
      
      <div class="dates">
        <span>{{ formatDate(props.book.startDate) }} &rarr; {{ formatDate(props.book.endDate) }}</span>
      </div>
      
      <div class="card-actions">
        <button :disabled="isDeleting" @click="emit('edit')" class="btn-edit">Edit</button>
        <button :disabled="isDeleting" @click="emit('remove')" class="btn-remove">{{ isDeleting ? 'Deleting...' : 'Delete' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.book-card { 
  background: var(--color-surface-2); 
  border-radius: 12px; 
  overflow: hidden; 
  box-shadow: 0 4px 15px var(--color-shadow-heavy); 
  display: flex; 
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid var(--color-border);
}

/* GRID MODE (RESTORED) */
.book-card.grid {
  flex-direction: column;
}
.book-card.grid:hover { 
  transform: translateY(-8px); 
  box-shadow: 0 12px 25px var(--color-shadow-hover);
  border-color: var(--color-border-strong);
}
.book-card.grid .cover { position: relative; height: 350px; background: var(--color-surface-4); }
.book-card.grid .cover img { width: 100%; height: 100%; object-fit: cover; }
.book-card.grid .content { padding: 0.75rem 1.25rem 1.25rem 1.25rem; flex-grow: 1; display: flex; flex-direction: column; }
.book-card.grid .info { margin-bottom: 0.75rem; border-top: 1px solid var(--color-border); padding-top: 0.5rem; font-size: 0.85rem; }
.book-card.grid .info .separator, .book-card.grid .info .cat-text { display: none; }
.book-card.grid .dates { font-size: 0.8rem; color: var(--color-text-subtle); margin-bottom: 1rem; }
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
  grid-template-columns: minmax(0, 2.5fr) minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1.5fr) 80px;
  align-items: center;
  gap: 1rem;
}
.book-card.list .header { margin-bottom: 0; min-width: 0; grid-column: 1; }
.book-card.list h4 { font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.book-card.list .author { font-size: 0.8rem; }
.book-card.list .series-list { margin-bottom: 0; font-size: 0.8rem; grid-column: 2; min-width: 0; }
.book-card.list .info { border-top: none; padding-top: 0; margin-bottom: 0; font-size: 0.8rem; grid-column: 3; min-width: 0; }
.book-card.list .dates { margin-bottom: 0; font-size: 0.8rem; white-space: nowrap; grid-column: 4; min-width: 0; }
.book-card.list .card-actions { display: flex; flex-direction: column; gap: 4px; grid-column: 5; width: 80px; justify-self: end; }
.book-card.list .card-actions button { padding: 4px; font-size: 0.7rem; width: 100%; }

/* SHARED */
.badges { position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 5px; }
.list-badges { display: flex; gap: 5px; margin-left: 10px; flex-shrink: 0; }
.title-row { display: flex; align-items: center; min-width: 0; }
.badge { padding: 2px 6px; border-radius: 4px; font-size: 0.6rem; font-weight: bold; text-transform: uppercase; color: var(--color-text-strong); }
.badge.type { background: var(--color-accent-warning-strong); }
.badge.lang { background: var(--color-accent-info); }
.badge.cat { background: var(--color-accent-category); }

h4 { margin: 0; color: var(--color-text-strong); }
.author { margin: 0; font-style: italic; color: var(--color-text-muted); }
.series-tag { font-size: 0.75rem; color: var(--color-primary); }
.info { color: var(--color-text); }
.dates { color: var(--color-text-subtle); }

.card-actions button { border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
.card-actions button:disabled { opacity: 0.65; cursor: not-allowed; }
.btn-edit { background: var(--color-accent-warning); color: var(--color-text-strong); }
.btn-remove { background: var(--color-accent-danger); color: var(--color-text-strong); }

@media (max-width: 1100px) {
  .book-card.list .content { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; padding: 0.5rem 1rem; }
  .book-card.list { height: auto; min-height: 100px; }
  .book-card.list .card-actions { grid-column: span 2; flex-direction: row; }
}
</style>
