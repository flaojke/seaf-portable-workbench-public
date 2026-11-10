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
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber

  Contributors:
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2024
-->

<template>
  <div class="wrapper">
    <v-btn color="primary" v-on:click="postData">export to META</v-btn>
  </div>
</template>

<script>
  import yaml from 'yaml';

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

    methods: {
      postData() {
        this.pullData().then(res => {
          const ID = res?.digitalArchitecture[0]?.yamlId;
          const yamledData = yaml.stringify(res);
          window.$PAPI.postDataInMeta(ID, this.profile.url, yamledData)
            .then(res => {
              this.putContent(`response/${ID}.yaml`, res.data);
            });
        });
      }
    }

  };
</script>

<style scoped>
.wrapper {
  padding: 16px 0;

  display: flex;
}


</style>
