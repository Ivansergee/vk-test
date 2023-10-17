<template>
    <div>
      <h1>Обработка авторизации...</h1>
    </div>
</template>
  
<script>
  export default {
    mounted() {
      const fragment = window.location.hash;
      const accessToken = fragment.match(/access_token=([^&]+)/)[1];
      localStorage.setItem('access_token', accessToken);
      this.$store.commit("setToken", token);
      this.$router.push('/');
    }
  }
</script>