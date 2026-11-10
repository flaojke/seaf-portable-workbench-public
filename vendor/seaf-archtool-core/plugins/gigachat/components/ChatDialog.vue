<!--
  Copyright (C) 2023 Sber

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
      Alexander Romashin, Sber

  Contributors:
      Alexander Romashin, Sber - 2025
      Marat Niyazmatov, Sber - 2025
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
-->

<template>
  <div class="chat-container scroll-bar">
    <div v-for="(msg, index) in messages" v-bind:key="index">
      <chat-message
        v-bind:is-token-counter-enabled="isTokenCounterEnabled"
        v-bind:index="index"
        v-bind:msg="msg"
        v-bind:agent-type="agentType" />
    </div>
  </div>
</template>

<script>
  import ChatMessage from './Message/ChatMessage.vue';
  import env from '@front/helpers/env.ts';

  export default {
    components: { ChatMessage },
    props: {
      messages: {
        type: Array,
        default: () => ([])
      },
      agentType: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        isTokenCounterEnabled: env.gigachatTokenCounterIsShown
      };
    },
    watch: {
      messages: {
        deep: true,
        handler() {
          this.$nextTick(() => {
            const container = document.querySelector('.chat-container');
            if (container) {
              container.scrollTop = container.scrollHeight;
            }
          });
        }
      }
    }
  };
</script>

<style scoped>
.chat-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 0;
}
</style>
