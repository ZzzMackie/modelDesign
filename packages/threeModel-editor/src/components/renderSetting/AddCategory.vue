<script setup>
const emit = defineEmits(['change']);
const change = val => {
  emit('change', val);
};
</script>

<template>
  <div class="add_category__wrap">
    <a-input @change="change"></a-input>
  </div>
</template>

<style lang="scss" scoped></style>
