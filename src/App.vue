<template>
    <div id="wrapper">
      <main class="main-content section">
        <router-view/>
      </main>
    </div>
</template>
<script>

export default {
  beforeCreate() {
    this.$store.commit("initializeStore");
  }
};

</script>

<style lang="scss">
@import "../node_modules/bulma";
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css");

html {
  background: #f5f5f5;
}

html,
body,
#app {
  height: 100%;
  margin: 0;
}

#wrapper {
  display: flex;
  flex-direction: column;
}

</style>
