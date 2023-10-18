<template>
  <div class="container">
    <div class="columns">
      <div class="column is-8 is-offset-2">
        <div class="level is-mobile">
          <div class="level-left">
            <router-link :to="{name: 'home'}"><h1 class="title is-4 mb-0">VK Test</h1></router-link>
          </div>
          <div class="level-right">
            <a class="button is-success" :href="loginURL" v-if="$store.state.isAuthenticated">Обновить токен</a>
            <a class="button is-success" :href="loginURL" v-else>Авторизоваться</a>
            <a class="button is-danger ml-2" @click="logout" v-if="$store.state.isAuthenticated">Выйти</a>
          </div>
        </div>
        <div class="search">
          <div class="control">
            <input class="input" type="text" placeholder="Имя, фамилия, username или id" v-model="search"
              @focus="showHints = true">
            <a class="clear" @click="search = ''" v-if="search">
              <i class="bi bi-x-circle-fill"></i>
            </a>
          </div>

          <div class="box search-hints" v-if="search && searchHints.length > 0 && showHints">
            <div class="user" v-for="hint in searchHints">
              <div class="level is-mobile mb-1">
                <div class="level-left">
                  <figure class="image is-32x32 mr-3">
                    <img :src="hint.photo_50">
                  </figure>
                  <p>{{ hint.first_name }} {{ hint.last_name }}</p>
                </div>
                <div class="level-right">
                  <a class="button is-success" @click="addToSource(hint)">Добавить</a>
                </div>
              </div>
              <hr class="dropdown-divider">
            </div>
          </div>
        </div>

        <div class="tabs mt-3">
          <ul>
            <li :class="{ 'is-active': activeList === 'source' }"><a @click="activeList = 'source'">Исходный</a></li>
            <li :class="{ 'is-active': activeList === 'friends' }"><a @click="activeList = 'friends'">Друзья</a></li>
          </ul>
        </div>

        <div class="source-items" v-if="activeList === 'source'">
          <button
            class="button is-success"
            :class="{'is-loading': isLoading}"
            @click="buildFriends"
            v-if="sourceList.length > 0"
          >Построить</button>
          <div class="box mt-2" v-for="item in sourceList">
            <div class="level is-mobile">
              <div class="level-left">
                <figure class="image is-48x48">
                  <img :src="item.photo_50">
                </figure>
                <p class="ml-2">{{ item.first_name }} {{ item.last_name }}</p>
              </div>
              <div class="level-right">
                <a class="button is-danger" @click="removePerson(item.id)">Удалить</a>
              </div>
            </div>
          </div>
        </div>

        <div class="friends-items" v-if="activeList === 'friends' && friendsList.length > 0">
          <div class="box"
            v-for="item in friendsPart"
            :style="{backgroundColor: getBGColor(item.source_ids.length)}"
          >
            <div class="level is-mobile">
              <div class="level-left">
                <div class="level-item">
                  <figure class="image is-48x48">
                    <img :src="item.photo_50">
                  </figure>
                </div>
                <div class="level-item">
                  <div class="ml-2">
                    <router-link
                      :to="{ name: 'details', params: { id: item.id }, query: {source_ids: item.source_ids.toString()}}">
                      <p>{{ item.first_name }} {{ item.last_name }}</p>
                    </router-link>
                    <span class="mr-2" v-if="item.sex === 1">Женщина</span>
                    <span class="mr-2" v-if="item.sex === 2">Мужчина</span>
                    <span class="mr-2" v-if="item.bdate">{{ getAge(item.bdate) }}</span>
                    <span class="mr-2" v-if="item.friends_count">друзей: {{ item.friends_count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            class="button is-success"
            v-if="friendsList.length > friendsPart.length"
            @click="loadNext">Показать ещё</button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.search {
  position: relative;
}

.search-hints {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 9999;
  width: 100%;
}

.clear {
  position: absolute;
  right: 10px;
  top: 20%;
  color: red;
  font-size: 1.2em;
}
</style>

<script>
import { jsonp } from 'vue-jsonp';
import debounce from 'lodash.debounce';
import moment from "moment";
import { toast } from "bulma-toast";

export default {
  data() {
    return {
      activeList: 'source',
      search: '',
      showHints: false,
      searchHints: [],
      sourceList: [],
      sourceLength: null, //длина исходного списка на момент построения друзей, нужно для того чтобы не менялись цвета панелей при редактировании исходного списка
      friendsList: [],
      friendsPart: [],
      partIndex: 15,
      isLoading: false,
    }
  },
  watch: {
    search() {
      this.debouncedWatch();
    },
  },
  computed:{
    loginURL(){
      return `https://oauth.vk.com/authorize?client_id=${process.env.VUE_APP_CLIENT_ID}&display=page&redirect_uri=${process.env.VUE_APP_BASE_URL}/login&response_type=token&scope=friends,groups&v=5.131`;
    }
  },
  mounted() {
    this.debouncedWatch = debounce(() => {
      this.getUsers();
    }, 500);
    const localSource = localStorage.getItem('source');
    const localFriends = localStorage.getItem('friends');
    const sourceLen = localStorage.getItem('sourceLen');
    const localFriendsPart = localStorage.getItem('friendsPart');
    this.sourceList = localSource ? JSON.parse(localSource) : [];
    this.friendsList = localFriends ? JSON.parse(localFriends) : [];
    this.sourceLength = sourceLen;
    this.friendsPart = localFriendsPart ? JSON.parse(localFriendsPart) : [];
  },
  methods: {
    async getUsers() {
      if (!this.$store.state.isAuthenticated) {
        toast({
          message: 'Вы не авторизованы!',
          type: "is-danger",
          dismissible: true,
          duration: 10000,
          pauseOnHover: true,
          position: "top-center",
        });
        return
      }
      const res = await jsonp('https://api.vk.com/method/users.search', {
        access_token: this.$store.state.token,
        v: '5.154',
        fields: 'photo_50',
        q: isNaN(this.search) ? this.search : `id${this.search}`,
        count: 10
      })
      if (res.error) {
        toast({
          message: res.error.error_msg,
          type: "is-danger",
          dismissible: true,
          duration: 10000,
          pauseOnHover: true,
          position: "top-center",
        });
        return
      }
      this.searchHints = res.response.items;
    },
    addToSource(user) {
      this.sourceList.push(user);
      localStorage.setItem('source', JSON.stringify(this.sourceList));
      this.showHints = false;
    },
    removePerson(id) {
      this.sourceList = this.sourceList.filter(item => item.id !== id);
      localStorage.setItem('source', JSON.stringify(this.sourceList));
    },
    async buildFriends() {
      this.sourceLength = this.sourceList.length;
      localStorage.setItem('sourceLen', this.sourceLength);
      this.friendsList = [];
      for (let user of this.sourceList) {
        const res = await jsonp('https://api.vk.com/method/friends.get', {
          access_token: this.$store.state.token,
          v: '5.154',
          user_id: user.id,
          order: 'name',
          fields: ['sex', 'bdate', 'photo_50']
        })
        if (res.error) {
          toast({
            message: res.error.error_msg,
            type: "is-danger",
            dismissible: true,
            duration: 10000,
            pauseOnHover: true,
            position: "top-center",
          });
          return
        } 
        const userFriends = res.response.items;
        const addedSource = userFriends.map(friend => {
          return {...friend, source_ids: [user.id]}
        });
        addedSource.forEach(item => {
          const i = this.friendsList.findIndex(elem => elem.id === item.id);
          if (i >= 0) {
            this.friendsList[i].source_ids.push(...item.source_ids);
          } else {
            this.friendsList.push(item);
          }
        })
      }
      this.getFriendsCount();
    },
    async getFriendsCount() {
      const friendsBatches = this.buildBatches();
      const friendsCounters = [];
      
      this.isLoading = true;
      for (let batch of friendsBatches) {
        const res = await jsonp('https://api.vk.com/method/execute', {
          access_token: this.$store.state.token,
          v: '5.154',
          code: `var users = [${batch}];
                 var index = 0;
                 var counters = [];
                 while (index < users.length) {
                   var friendsCount = API.users.get({'user_ids': users[index], 'fields': ['counters']});
                   counters.push({'id': users[index], 'friends_count': friendsCount[0].counters.friends});
                   index = index + 1;
                  };
                 return counters;`
        });
        if (res.error) {
          toast({
            message: res.error.error_msg,
            type: "is-danger",
            dismissible: true,
            duration: 10000,
            pauseOnHover: true,
            position: "top-center",
          });
          return
        }
        friendsCounters.push(...res.response);
      }
      this.isLoading = false;

      this.friendsList.forEach(friend => {
        const counter = friendsCounters.find(counter => counter.id === friend.id);
        if (counter) {
          friend.friends_count = counter.friends_count;
        }
      });

      this.friendsList.sort((a, b) => {
        const first_nameA = a.first_name.toUpperCase();
        const first_nameB = b.first_name.toUpperCase();
        if (first_nameA < first_nameB) {
          return -1;
        }
        if (first_nameA > first_nameB) {
          return 1;
        }
        
        const last_nameA = a.last_name.toUpperCase();
        const last_nameB = b.last_name.toUpperCase();
        if (last_nameA < last_nameB) {
          return -1;
        }
        if (last_nameB > last_nameB) {
          return 1;
        }
        
        return 0;
      });
      localStorage.setItem('friends', JSON.stringify(this.friendsList));
      this.friendsPart = this.friendsList.slice(0, 15);
      localStorage.setItem('friendsPart', JSON.stringify(this.friendsPart));
      this.activeList = 'friends';
    },
    buildBatches() {
      const batchSize = 25;
      const friendsBatches = [];

      for (let i = 0; i < this.friendsList.length; i += batchSize) {
        const batchObjects = this.friendsList.slice(i, i + batchSize);
        const batch = batchObjects.map(item => item.id)
        friendsBatches.push(batch);
      }
      return friendsBatches;
    },
    getAge(bdate){
      const bdateSplit = bdate.split('.');
      if (bdateSplit.length === 3) {
        const bdateDate = moment(bdate, 'D.M.YYYY');
        const age = moment().diff(bdateDate, 'years');
        return `${age} лет`;
      }
      return null;
    },
    getBGColor(refCount){
      if (refCount === 1){
        return 'white';
      }
      const refPercent = Math.round((refCount / this.sourceLength) * 100)
      if (refPercent === 100) {
        return 'hsl(141, 53%, 41%)';
      } else if (refPercent > 75) {
        return 'hsl(141, 70%, 50%);';
      } else if (refPercent > 50) {
        return 'hsl(141, 90%, 70%);';
      } else if (refPercent > 25) {
        return 'hsl(141, 70%, 80%);';
      }
    },
    loadNext() {
      this.friendsPart.push(...this.friendsList.slice(this.partIndex, this.partIndex + 15));
      this.partIndex += 15;
    },
    logout() {
      localStorage.removeItem('access_token');
      this.$store.commit("removeToken");
    }
  }
}
</script>
