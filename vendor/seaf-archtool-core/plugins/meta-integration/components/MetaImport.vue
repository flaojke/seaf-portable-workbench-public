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
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2025
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2024
-->

<!-- Modified by LSV: corporate import is a disabled public-distribution placeholder. -->
<template>
  <div class="wrapper" role="status">
    <h4>Импорт из внешней системы недоступен</h4>
    <p>Эта поставка не содержит корпоративную интеграцию. Используйте импорт YAML из локального файла.</p>
  </div>
</template>
<script>
  export default {
    props: {
      profile: {type: Object, required: true},
      getContent: {type: Function, required: true},
      putContent: {type: Function, default: null},
      pullData: {type: Function, required: true}
    }
  };
</script>
<style scoped>
.wrapper { padding: 8px 16px; }
</style>
