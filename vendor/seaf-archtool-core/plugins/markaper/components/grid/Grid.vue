<!--
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru

  Copyright (C) 2022 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  In any derivative products, you must retain the information of
  owner of the original code and provide clear attribution to the project

  https://dochub.info

  The use of this product or its derivatives for any purpose cannot be a secret.


  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      R.Piontik <r.piontik@mail.ru>

  Contributors:
      R.Piontik <r.piontik@mail.ru> - 2023
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <div>
    <v-alert v-if="error" class="dh-alert dh-alert--error" icon="mdi-alert-circle-outline">
      <div class="dh-alert__text">{{ error }}</div>
    </v-alert>
    <dhsection v-if="!error && model" v-bind:section="model" />
  </div>
</template>

<script>

  import DHSection from './Section.vue';
  import schema from '../../schema/grid';
  import ajv from 'ajv';
  const ajv_localize = require('ajv-i18n/localize/ru');

  export default {
    name: 'MKRGrid',
    components: {
      dhsection: DHSection
    },
    props: {
      // Требуем обязательно передавать профайл документа
      profile: {
        type: Object,
        required: true
      },
      // Требуем обязательно передавать функцию получения контента
      getContent: {
        type: Function,
        required: true
      },
      // Требуем обязательно передавать функцию доступа к Data Lake
      pullData: {
        type: Function,
        required: true
      },
      // Требуем обязательно сообщать путь к объекту описывающему документ в коде
      path: {
        type: String,
        required: true
      },
      // Запрашиваем параметры рендеринга
      params: {
        type: Object,
        default: null
      },
      // Признак рендеринга для печати
      toPrint: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        // Обработчик события обновления
        refresher: null,
        // Модель документа
        model: {},
        // Информация об ошибке
        error: null
      };
    },
    watch: {
      profile() {
        // При изменении переметров, генерируем событие обновления
        this.onRefresh();
      }
    },
    mounted() {
      // При монтировании компонента в DOM, генерируем событие обновления
      this.onRefresh();
    },
    methods: {
      // Обновляем данные модели разметки
      doRefresh() {
        this.pullData().then((result) =>{
          try {
            // Валидируем данные по структуре
            const rules = new ajv({ allErrors: true });
            const validator = rules.compile(schema);
            if (!validator(result)) {
              ajv_localize(validator.errors);
              this.error = JSON.stringify(validator.errors, null, 4);
              return;
            }
            // Если все в порядке, обновляем модель
            this.model = result;
            this.error = null;
          } catch (e) {
            this.error = e;
          }
        }).catch((e) => this.error = e);
      },
      // Обработчик события обновления
      onRefresh() {
        // Если обработчик уже запущен, останавливаем его
        if (this.refresher) clearTimeout(this.refresher);
        // Для исключения избыточных обращений к Data Lake откладывам обноление на 50мс
        this.refresher = setTimeout(this.doRefresh, 50);
      }
    }
  };
</script>

<style scoped>
</style>
