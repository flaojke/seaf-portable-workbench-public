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
      Rostislav Kabalin <kabalin2009@yandex.ru> - 2022
      R.Piontik <r.piontik@mail.ru> - 2022
      R.Piontik <r.piontik@mail.ru> - 2021
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <ul
    class="dh-tree"
    v-bind:class="{ 'dh-tree--nested': level > 0 }"
    v-bind:role="level ? 'group' : 'tree'">
    <li
      v-for="item in items"
      v-bind:key="item.key"
      class="dh-tree__item"
      role="treeitem"
      v-bind:aria-expanded="hasChildren(item) ? String(isExpanded(item)) : undefined"
      v-bind:aria-selected="item.selected ? 'true' : undefined">
      <div
        class="dh-tree__row"
        v-bind:class="{ 'dh-tree__row--selected': item.selected, 'dh-tree__row--root': level === 0 }">
        <!-- Треугольник, как у папок главного меню: ▸ свернуто, ▾ раскрыто. С клавиатуры раздел
             раскрывается на самой строке, поэтому треугольник — только для мыши -->
        <span
          v-if="hasChildren(item)"
          class="dh-tree__toggle"
          v-bind:class="{ 'dh-tree__toggle--open': isExpanded(item) }"
          aria-hidden="true"
          v-on:click="toggle(item)">
          <v-icon icon="mdi-menu-right" size="18" v-bind:color="null" />
        </span>
        <span v-else class="dh-tree__spacer" />
        <v-icon
          v-if="item.icon"
          class="dh-tree__icon"
          v-bind:class="toneClass(item)"
          v-bind:style="item.tone ? null : item.iconStyle"
          v-bind:icon="item.icon"
          size="16"
          v-bind:color="null" />
        <!-- Строка — как пункт главного меню: Tab между строками, → раскрывает раздел, ← сворачивает,
             Enter открывает ссылку или раскрывает раздел без ссылки -->
        <router-link
          v-if="item.link"
          class="dh-tree__title"
          v-bind:to="item.link"
          v-on:keydown.right.prevent="setExpanded(item, true)"
          v-on:keydown.left.prevent="setExpanded(item, false)">
          {{ item.title }}
        </router-link>
        <span
          v-else-if="hasChildren(item)"
          class="dh-tree__title dh-tree__title--toggle"
          role="button"
          tabindex="0"
          v-bind:aria-expanded="String(isExpanded(item))"
          v-on:click="toggle(item)"
          v-on:keydown.enter.prevent="toggle(item)"
          v-on:keydown.space.prevent="toggle(item)"
          v-on:keydown.right.prevent="setExpanded(item, true)"
          v-on:keydown.left.prevent="setExpanded(item, false)">{{ item.title }}</span>
        <span v-else class="dh-tree__title">{{ item.title }}</span>
        <span
          v-if="item.count"
          class="dh-tree__count"
          v-bind:class="toneClass(item, item.countTone)">{{ item.count }}</span>
      </div>
      <tree-item
        v-if="hasChildren(item) && isExpanded(item)"
        v-bind:items="item.items"
        v-bind:level="level + 1" />
    </li>
  </ul>
</template>

<script>
  /*
    Пункт дерева: { key, title, link?, icon?, tone?, count?, countTone?, selected?, expand?, items? }.
    tone — состояние для цвета значка и счетчика: ok, wip, bad (палитра presentation.css);
    countTone — свой цвет счетчика, если он считает не то же, что показывает значок.
    iconStyle (строка стилей значка) поддерживается для совместимости, если tone не задан.
    Состояние раскрытия — у дерева (Controls/Tree.vue), пункт получает его через inject (dhTree).
  */
  const TONES = ['ok', 'wip', 'bad'];

  const TreeItem = {
    name: 'TreeItem',
    inject: ['dhTree'],
    props: {
      items: {
        type: Array,
        default: () => []
      },
      level: {
        type: Number,
        default: 0
      }
    },
    methods: {
      hasChildren(item) {
        return !!item.items?.length;
      },
      toneClass(item, tone = item.tone) {
        return TONES.includes(tone) ? `dh-tree--tone-${tone}` : null;
      },
      isExpanded(item) {
        return this.dhTree.isExpanded(item.key);
      },
      setExpanded(item, value) {
        if (this.hasChildren(item)) this.dhTree.setExpanded(item.key, value);
      },
      toggle(item) {
        this.setExpanded(item, !this.isExpanded(item));
      }
    }
  };

  export default Object.assign(TreeItem, {
    components: {
      TreeItem
    }
  });
</script>

<style scoped>
  /* Дерево в стиле главного меню. Цвета — из общей палитры представлений (presentation.css) */
  .dh-tree {
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--dh-text);
    font-size: 13px;
  }

  /* Вложенный уровень: отступ и тонкая направляющая под треугольником родителя */
  .dh-tree--nested {
    position: relative;
    padding-left: 20px;
  }

  .dh-tree--nested::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 4px;
    left: 13px;
    width: 1px;
    background: var(--dh-border);
  }

  .dh-tree__row {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    min-height: 30px;
    padding: 5px 8px 5px 2px;
    border-radius: 6px;
    line-height: 20px;
  }

  .dh-tree__row:hover {
    background: var(--dh-surface-hover);
  }

  .dh-tree__row--root {
    font-weight: 600;
  }

  /* Выбранный пункт — как в главном меню: светлый фирменный фон и полоса слева */
  .dh-tree__row--selected,
  .dh-tree__row--selected:hover {
    background: var(--dh-primary-soft);
    box-shadow: inset 3px 0 0 var(--dh-primary);
    color: var(--dh-primary-strong);
    font-weight: 600;
  }

  .dh-tree__toggle {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: none;
    color: var(--dh-text-muted);
    cursor: pointer;
  }

  .dh-tree__toggle:hover {
    background: var(--dh-border);
    color: var(--dh-text);
  }


  .dh-tree__toggle .v-icon {
    transition: transform 0.15s ease;
  }

  .dh-tree__toggle--open .v-icon {
    transform: rotate(90deg);
  }

  .dh-tree__spacer {
    flex: none;
    width: 22px;
  }

  .dh-tree__icon {
    flex: none;
    margin-top: 2px;
    color: var(--dh-text-muted);
  }

  .dh-tree__title {
    flex: 1 1 auto;
    min-width: 0;
    color: inherit;
    text-decoration: none;
    overflow-wrap: anywhere;
  }

  a.dh-tree__title:hover {
    color: var(--dh-primary-strong);
    text-decoration: underline;
  }

  .dh-tree__title--toggle {
    cursor: pointer;
  }

  /* Фокус с клавиатуры — рамка фирменного цвета, как у пунктов главного меню */
  .dh-tree__title:focus-visible {
    border-radius: 4px;
    outline: 2px solid var(--dh-primary);
    outline-offset: 2px;
  }

  /* Счетчик отклонений — бейдж, как у пункта «Проблемы» в меню */
  .dh-tree__count {
    flex: none;
    min-width: 20px;
    margin-top: 1px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--dh-status-off-bg);
    color: var(--dh-status-off-text);
    font-size: 11px;
    font-weight: 600;
    line-height: 18px;
    text-align: center;
  }

  .dh-tree__icon.dh-tree--tone-ok {
    color: var(--dh-status-ok-text);
  }

  .dh-tree__icon.dh-tree--tone-wip {
    color: var(--dh-attention);
  }

  .dh-tree__icon.dh-tree--tone-bad {
    color: var(--dh-danger);
  }

  .dh-tree__count.dh-tree--tone-wip {
    background: var(--dh-status-wip-bg);
    color: var(--dh-status-wip-text);
  }

  .dh-tree__count.dh-tree--tone-bad {
    background: var(--dh-status-bad-bg);
    color: var(--dh-status-bad-text);
  }
</style>
