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
      Rostislav Kabalin <kabalin2009@yandex.ru> - 2022
      Artyom Prilip <artyom.prilip@gmail.com>, Sber - 2026
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <v-card class="card-item" elevation="0">
    <div class="validators-title">
      <span class="validators-title__text">Валидаторы</span>
      <v-btn
        v-if="calcDataset"
        class="validators-title__btn"
        color="primary"
        variant="flat"
        size="small"
        v-bind:loading="isCalculatingDatasets"
        v-bind:disabled="isCalculatingDatasets"
        v-on:click="calculateDatasets">
        Рассчитать датасеты
        <template #loader>Расчёт…</template>
      </v-btn>
    </div>

    <v-card-text class="problems-content">
      <div v-if="datasetPeeper.progress !== null" class="dataset-progress">
        <div class="dataset-progress__status">
          <div>Расчёт датасетов</div>
          <div class="dataset-progress__value">{{ datasetPeeper.progress }}%</div>
        </div>
        <v-progress-linear
          v-bind:model-value="datasetPeeper.progress"
          color="primary"
          height="4"
          rounded />
        <div
          v-if="datasetPeeper.current"
          class="dataset-progress__current"
          v-bind:title="datasetPeeper.current">
          {{ datasetPeeper.current }}
        </div>
      </div>
      <v-tabs
        v-model="filter"
        class="validators-tabs"
        color="primary"
        density="compact">
        <v-tab value="all">Все</v-tab>
        <v-tab value="error">Отклонения</v-tab>
        <v-tab value="warning">Исключения</v-tab>
      </v-tabs>
      <tree v-bind:items="items" class="tree" />
    </v-card-text>
  </v-card>
</template>

<script>
  import Tree from '@front/components/Controls/Tree.vue';
  import datasets from '@front/helpers/datasets';
  import env from '@front/helpers/env';
  import recalculateDatasets from '@global/datasets/recalculate-datasets.mjs';
  import {
    EXCEPTION_STATUS,
    PROBLEM_STATUS,
    isShownOnTab,
    problemsCount,
    problemsCountTone,
    problemsNodeStatus
  } from '@front/helpers/problemsTree';

  export default {
    name: 'Validators',
    components: {
      Tree
    },
    props: {
      subject: { type: String, default: '' },
      problems: { type: Array, default: () => [] }
    },
    data() {
      return {
        calcDataset: !env.isBackendMode,
        filter: 'error',
        datasetPeeper: {
          progress: null,
          current: null
        },
        isCalculatingDatasets: false
      };
    },
    computed: {
      items() {
        const result = [];
        // Строим дерево валидаторов
        const expandItem = (expitem) => {
          let node = result;
          const stack = [];
          // Разбираем ключ
          expitem.id.split('.').map((partKey, index, arr) => {
            const key = arr.slice(0, index + 1).join('.');
            let item = node.find((element) => element.key === key);
            if (!item) {
              node.push(
                item = {
                  title: partKey,
                  key,
                  icon: 'mdi-check',
                  tone: 'ok',
                  items: [],
                  parent: node,
                  countProblems: 0,
                  countExceptions: 0,
                  count: 0
                }
              );
            }
            stack.push(item);
            if (arr.length - 1 === index) {
              item.link = expitem.link;
              item.title = expitem.title || partKey;
            }
            node = item.items;
          });
          // Разбираем отклонения
          let countProblems = 0;
          let countExceptions = 0;
          (expitem.items || []).map((item) => {
            const isException = !!item.exception;
            const problem = {
              title: item.title || item.uid,
              key: item.uid,
              ...(isException ? EXCEPTION_STATUS : PROBLEM_STATUS),
              items: [],
              link: `/problems/${item.uid}`,
              selected: this.subject === item.uid
            };

            if (isException) countExceptions++;
            else countProblems++;

            if (!isShownOnTab(this.filter, isException)) return;

            // Если отклонение выбрано (как параметр в URL) открываем дерево до него
            problem.selected && stack.forEach((item) => item.expand = true);

            node.push(problem);
          });
          // Всегда раскрываем первый уровень дерева
          stack[0].expand = true;
          // Обходим дерево до корня
          stack.forEach((item) => {
            // Если ошибка критическая, раскрываем все дерево
            expitem.critical && (item.expand = true);
            // Индексируем счетчики проблем
            item.countProblems += countProblems;
            item.countExceptions += countExceptions;
            item.count += problemsCount(this.filter, countProblems, countExceptions);
            // Цвет счетчика — по тому, что он считает на выбранной вкладке
            item.countTone = problemsCountTone(this.filter, item.countProblems);

            const status = problemsNodeStatus(item.countProblems, item.countExceptions);
            status && Object.assign(item, status);
          });
        };
        this.problems?.map((item) => expandItem(item));

        // Сортируем дерево отклонений
        const sort = (items) => {
          items.sort((item1, item2) => {
            if (!item1.items.length && item2.items.length > 0) return 1;
            else if (item1.items.length > 0 && !item2.items.length) return -1;
            else if (item1.icon === 'error' && item2.icon === 'warning') return -1;
            else if (item2.icon === 'error' && item1.icon === 'warning') return 1;
            return 0;
          });
          items.map((item) => item.items.length && sort(item.items));
        };
        sort(result);

        return result;
      }
    },
    methods: {
      calculateDatasets() {
        if (this.isCalculatingDatasets) return;
        this.isCalculatingDatasets = true;
        recalculateDatasets(this.manifest, datasets(), this.datasetPeeper).then((problems) => {
          this.$store.commit('appendProblems', problems);
          this.isCalculatingDatasets = false;
        });
      }
    }
  };
</script>

<style scoped>
  /* Карточка валидаторов. Цвета — из общей палитры представлений (presentation.css) */
  .card-item {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
    margin-top: 12px;
    border: 1px solid var(--dh-border);
    border-radius: var(--dh-radius);
    background: var(--dh-surface);
    color: var(--dh-text);
  }

  .validators-title {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--dh-border);
    background: var(--dh-surface-header);
  }

  .validators-title__text {
    font-size: 16px;
    font-weight: 600;
  }

  .validators-title__btn {
    letter-spacing: normal;
    text-transform: none;
  }

  .validators-tabs {
    border-bottom: 1px solid var(--dh-border);
  }

  .validators-tabs :deep(.v-tab) {
    color: var(--dh-text-secondary);
    letter-spacing: normal;
    text-transform: none;
  }

  .validators-tabs :deep(.v-tab--selected) {
    color: var(--dh-primary-strong);
    font-weight: 600;
  }

  .dataset-progress {
    padding: 0 4px 12px;
  }

  .dataset-progress__status {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    color: var(--dh-text-secondary);
  }

  .dataset-progress__value {
    color: var(--dh-primary-strong);
    font-weight: 600;
  }

  .dataset-progress__current {
    margin-top: 6px;
    color: var(--dh-text-muted);
  }

  .problems-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  .tree {
    min-width: 0;
    padding-top: 8px;
    overflow: auto;
  }
 </style>
