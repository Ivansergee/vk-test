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
      console.log(fragment);
      console.log(accessToken);
      localStorage.setItem('access_token', accessToken);
      this.$store.commit("setToken", accessToken);
      this.$router.push('/');
    }
  }
</script>