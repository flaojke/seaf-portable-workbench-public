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
  <div class="mkr-tree">
    <v-alert v-if="error" class="dh-alert dh-alert--error" icon="mdi-alert-circle-outline">
      <div class="dh-alert__text">{{ error }}</div>
    </v-alert>
    <!-- Общее дерево приложения (как в разделе «Проблемы» и главном меню) -->
    <dh-tree v-else-if="tree.length" v-bind:items="tree" />
    <p v-else-if="loaded" class="mkr-tree__empty">Нет элементов</p>
  </div>
</template>

<script>

  import schema from '../../schema/tree';
  import DhTree from '@front/components/Controls/Tree.vue';

  import ajv from 'ajv';
  const ajv_localize = require('ajv-i18n/localize/ru');

  export default {
    name: 'MKRTree',
    components: {
      DhTree
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
        // Массив меню
        tree: [],
        // Обработчик события обновления
        refresher: null,
        // Модель документа
        model: [],
        // Информация об ошибке
        error: null,
        // Данные получены хотя бы раз: до этого не показываем «Нет элементов»
        loaded: false
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
      // Строит дерево
      makeTreeItems(items) {
        let counter = 0;
        const result = [];
        const expandItem = (expitem) => {
          let node = result;
          expitem.location.split('/').map((title, index, arr) => {
            let item = node.find((element) => element.title === title);
            if (!item) {
              node.push(
                item = {
                  title: title,
                  key: `${title}_${counter++}`,
                  items: []
                }
              );
            }
            if (arr.length - 1 === index) {
              item.link = expitem.link;
            }
            node = item.items;
          });
        };
        items.map((item) => expandItem(item));
        return result;
      },
      // Обновляем данные модели разметки
      doRefresh() {
        this.pullData().then((items) =>{
          try {
            // Валидируем данные по структуре
            const rules = new ajv({ allErrors: true });
            const validator = rules.compile(schema);
            if (!validator(items)) {
              ajv_localize(validator.errors);
              this.error = JSON.stringify(validator.errors, null, 4);
              return;
            }
            // Если все в порядке, обновляем модель
            this.error = null;
            this.tree = this.makeTreeItems(items);
          } catch (e) {
            this.error = e;
          }
        }).catch((e) => this.error = e)
          .finally(() => this.loaded = true);
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
  .mkr-tree {
    padding: 4px 12px 12px;
    overflow-y: hidden;
    overflow-x: auto;
  }

  .mkr-tree__empty {
    margin: 0;
    padding: 4px 6px;
    color: var(--dh-text-muted);
    font-size: 13px;
  }
</style>
