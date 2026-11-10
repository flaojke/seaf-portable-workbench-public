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
  <div class="mkr-select">
    <v-alert v-if="error" class="dh-alert dh-alert--error" icon="mdi-alert-circle-outline">
      <div class="dh-alert__text">{{ error }}</div>
    </v-alert>
    <div v-else-if="model.length" class="mkr-select__control">
      <!-- Поле и список — как фильтры поиска: рамка палитры, список .dh-pick с галочкой у выбранного -->
      <v-select
        v-model="selected"
        v-bind:items="model"
        v-bind:menu-props="{ contentClass: 'dh-pick', offset: 4, maxHeight: 360 }"
        v-bind:list-props="{ class: 'dh-pick__list' }"
        item-title="title"
        item-value="src"
        return-object
        variant="outlined"
        density="compact"
        hide-details
        aria-label="Выбор варианта"
        class="mkr-select__field">
        <template #item="{ props }">
          <v-list-item v-bind="props" role="option" class="dh-pick__item">
            <template #append="{ isSelected }">
              <v-icon
                v-if="isSelected"
                class="dh-pick__check"
                icon="mdi-check"
                size="18"
                v-bind:color="null" />
            </template>
          </v-list-item>
        </template>
      </v-select>
    </div>
    <p v-else-if="loaded" class="mkr-select__empty">Нет вариантов для выбора</p>
    <mkrcontent v-if="!error && selected?.src" v-bind:src="selected.src" />
  </div>
</template>

<script>

  import schema from '../../schema/select';
  import { appendParams } from '../../helpers/src';
  import MKRContent from '../elements/Content.vue';

  import ajv from 'ajv';
  const ajv_localize = require('ajv-i18n/localize/ru');

  export default {
    name: 'MKRSelector',
    components: {
      mkrcontent: MKRContent
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
        // Выбранный элемент
        selected: null,
        // Обработчик события обновления
        refresher: null,
        // Модель документа
        model: [],
        // Информация об ошибке
        error: null,
        // Данные получены хотя бы раз: до этого не показываем «Нет вариантов»
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
            this.selected = null;
            this.model = result.map((item) => {
              const result = Object.assign({}, item, {src: appendParams(item.src, item.params)});
              if (item.selected) this.selected = result;
              return result;
            });
            this.error = null;
            this.selected = this.selected || this.model[0];
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
  .mkr-select {
    width: 100%;
  }

  .mkr-select__control {
    width: 100%;
    padding: 8px var(--dh-widget-inset) 4px;
    box-sizing: border-box;
  }

  .mkr-select__field {
    width: 100%;
  }

  .mkr-select__field :deep(.v-field) {
    border-radius: var(--dh-radius);
    background: var(--dh-surface);
    color: var(--dh-text);
    font-size: 14px;
  }

  .mkr-select__field :deep(.v-field__outline) {
    --v-field-border-opacity: 1;
    color: var(--dh-border-strong);
  }

  .mkr-select__field :deep(.v-field:hover .v-field__outline) {
    color: var(--dh-text-muted);
  }

  .mkr-select__field :deep(.v-field--focused .v-field__outline) {
    color: var(--dh-primary);
  }

  .mkr-select__field :deep(.v-select__menu-icon) {
    color: var(--dh-text-muted);
    opacity: 1;
  }

  .mkr-select__empty {
    margin: 0;
    padding: 8px var(--dh-widget-inset) 16px;
    color: var(--dh-text-muted);
    font-size: 13px;
  }
</style>
