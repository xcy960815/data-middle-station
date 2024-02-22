<template>
  <div class="lazy-load">
    <div class="lazy-load-item" v-for="item in 100"></div>
  </div>
</template>

<script setup lang="ts">
onMounted(() => {
  const ob = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('lazy-load-item--loaded');
          ob.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 1,
    },
  );
  const lazyLoadItems = document.querySelectorAll('.lazy-load-item');
  lazyLoadItems.forEach((item) => {
    ob.observe(item);
  });
});
</script>

<style scoped lang="scss">
.lazy-load {
  width: 100%;
  height: 100%;
  background-color: #fff;
  .lazy-load-item {
    height: 300px;
    width: 300px;
    background-color: aqua;
    margin: 10px;
  }
  .lazy-load-item--loaded {
    animation: fade-in 1s;
    background-color: red;
  }
}
</style>
