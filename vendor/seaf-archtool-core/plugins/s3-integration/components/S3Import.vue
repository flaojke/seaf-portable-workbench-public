<!--
  Copyright (C) 2026 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      Temnyakov Nikolay <temnjakovn@gmail.com>, Sber - 2026
-->

<template>
  <div class="wrapper">
    <div v-if="isAuth === null" class="progress">
      <v-progress-circular v-bind:size="50" color="primary" indeterminate />
    </div>

    <div v-else class="auth">
      <h4 class="auth__status" v-bind:class="{ 'auth__status_unauthorize': !isAuth }">
        {{ isAuth ? "Авторизация выполнена" : "Требуется авторизация" }}
      </h4>
      <a v-if="!isAuth" v-bind:href="s3Url">
        Перейти к S3
      </a>
    </div>
  </div>
</template>

<script>
  import env, { Plugins } from '@front/helpers/env.ts';

  export default {
    props: {
      profile: {
        type: Object,
        required: true
      },
      getContent: {
        type: Function,
        required: true
      },
      putContent: {
        type: Function,
        default: null,
        required: false
      },
      pullData: {
        type: Function,
        required: true
      }
    },

    data() {
      return {
        inputValue: '',
        guid: null,
        imports: [],
        isAuth: null
      };
    },

    computed: {
      s3Url() {
        return URL.canParse(env.s3CloudUrl) ? new URL(env.s3CloudUrl).origin : '';
      }
    },

    mounted() {
      this.checkAuthStatus(window.location.href);
    },

    methods: {
      checkAuthStatus(backlink) {
        if (!env.isPlugin(Plugins.idea) || typeof window.$PAPI?.checkIsAuthS3 !== 'function') {
          this.isAuth = false;
          return;
        }
        window.$PAPI.checkIsAuthS3(backlink)
          .then(res => this.isAuth = !!res)
          .catch(() => this.isAuth = false);
      }
    }
  };
</script>

<style scoped>
.wrapper {
  padding: 8px 16px;

  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress {
  padding: 48px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth__status {
  margin: 16px 0;
  color: green;
}

.auth__status_unauthorize {
  color: red;
}
</style>
