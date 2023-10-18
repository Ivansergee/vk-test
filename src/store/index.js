import { createStore } from 'vuex'

export default createStore({
  state: {
    isAuthenticated: false,
    token: null,
  },
  getters: {
  },
  mutations: {
    initializeStore(state) {
      if (localStorage.getItem('access_token')) {
        state.token = localStorage.getItem('access_token');
        state.isAuthenticated = true;
      } else {
        state.token = null;
        state.isAuthenticated = false;
      }
    },
    setToken(state, token) {
      state.token = token;
      state.isAuthenticated = true;
    },
    removeToken(state) {
      state.token = null;
      state.isAuthenticated = false;
    },
  },
  actions: {
  },
  modules: {
  }
})
