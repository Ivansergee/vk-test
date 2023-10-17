<template>
  <div class="container">
    <div class="columns">
      <div class="column is-8 is-offset-2">
        <div class="level is-mobile">
          <router-link :to="{name: 'home'}"><h1 class="title is-4 mb-0">VK Test</h1></router-link>
        </div>

        <div class="box" v-if="userData">
          <div class="level is-mobile">
            <div class="level-left">
              <figure class="image is-96x96 mr-5">
                <img :src="userData.photo_100">
              </figure>
              <p class="title is-4">{{ userData.first_name }} {{ userData.last_name }}</p>
            </div>
          </div>
        </div>

        <div class="box">
          <p class="title is-5">Исходные друзья:</p>
          <div class="level is-mobile" v-for="friend in sourceData">
            <div class="level-left">
              <figure class="image is-48x48">
                <img :src="friend.photo_50">
              </figure>
              <p class="ml-2">{{ friend.first_name }} {{ friend.last_name }}</p>
            </div>
          </div>
        </div>

        <div class="box">
          <p class="title is-5">Сообщения на стене:</p>
          <article class="media" v-for="post in userWall" v-if="userWall">
            <div class="media-content">
              <div class="content">
                <p>
                  <strong class="mr-2">{{ post.from }}</strong>
                  <small>{{ getPostTime(post.date) }}</small>
                  <br>
                  <p>{{ post.text }}</p>
                  <figure v-for="attachment in post.attachments">
                    <img :src="attachment.photo.sizes[2].url" v-if="attachment.type === 'photo'">
                  </figure>
                  <p v-if="post.copy_history">
                    <span class="icon is-small">
                      <i class="bi bi-arrow-90deg-right"></i>
                    </span>
                    Репост
                  </p>
                </p>
              </div>
              <div class="level is-mobile">
                <div class="level-left">
                  <div class="level-item" v-if="post.likes">
                    <button class="button is-rounded is-small is-static">
                      <span class="icon is-small">
                        <i class="bi bi-heart-fill"></i>
                      </span>
                      <span>{{ post.likes.count }}</span>
                    </button>
                  </div>
                  <div class="level-item" v-if="post.comments">
                    <button class="button is-rounded is-small is-static">
                      <span class="icon is-small">
                        <i class="bi bi-chat"></i>
                      </span>
                      <span>{{ post.comments.count }}</span>
                    </button>
                  </div>
                  <div class="level-item" v-if="post.views">
                    <button class="button is-rounded is-small is-static">
                      <span class="icon is-small">
                        <i class="bi bi-eye-fill"></i>
                      </span>
                      <span>{{ post.views.count }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>

        </div>

      </div>
    </div>
  </div>
</template>
  
<script>
import { jsonp } from 'vue-jsonp';
import moment from "moment";
import { toast } from "bulma-toast";

export default {
  data() {
    return {
      userData: null,
      sourceData: null,
      userWall: null,
    }
  },
  mounted() {
    this.getUser();
    this.getSourceFriends();
    this.getWall();
  },
  methods: {
    async getUser() {
      const id = this.$route.params.id;
      const res = await jsonp('https://api.vk.com/method/users.get', {
        access_token: this.$store.state.token,
        v: '5.154',
        user_ids: id,
        fields: 'photo_100',
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
      this.userData = res.response[0];
    },
    async getSourceFriends() {
      const source_ids = this.$route.query.source_ids;

      const res = await jsonp('https://api.vk.com/method/users.get', {
        access_token: this.$store.state.token,
        v: '5.154',
        user_ids: source_ids,
        fields: 'photo_50',
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
      this.sourceData = res.response;
    },
    async getWall() {
      const id = this.$route.params.id;
      const res = await jsonp('https://api.vk.com/method/wall.get', {
        access_token: this.$store.state.token,
        v: '5.154',
        owner_id: id,
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
      const posts = res.response.items;
      const fromSet = new Set();
      for (let post of posts) {
        fromSet.add(post.from_id);
      }
      const fromUsers = await jsonp('https://api.vk.com/method/users.get', {
        access_token: this.$store.state.token,
        v: '5.154',
        user_ids: Array.from(fromSet).toString(),
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
      posts.forEach(post => {
        const user = fromUsers.response.find(user => user.id === post.from_id);
        post.from = `${user.first_name} ${user.last_name}`
      })
      this.userWall = posts;
    },
    getPostTime(time){
      return moment.unix(time).format("DD.MM.YYYY HH:mm");
    }
  }
};
</script>