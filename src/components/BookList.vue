<script setup>
import BookCard from './BookCard.vue'

defineProps(['books', 'viewMode'])
const emit = defineEmits(['edit-book', 'remove-book'])
</script>

<template>
  <div class="book-list">
    <div v-if="books.length === 0" class="empty">No books match your criteria.</div>
    <div v-else :class="['grid', viewMode]">
      <BookCard 
        v-for="book in books" 
        :key="book.id" 
        :book="book" 
        :view-mode="viewMode"
        @edit="emit('edit-book', book)"
        @remove="emit('remove-book', book.id)"
      />
    </div>
  </div>
</template>

<style scoped>
.grid.grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
  gap: 2rem; 
}

.grid.list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty { text-align: center; padding: 3rem; background: #1e1e1e; border-radius: 12px; color: #777; border: 1px dashed #333; }
</style>
