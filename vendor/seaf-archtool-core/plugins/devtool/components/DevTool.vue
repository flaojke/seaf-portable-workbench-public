<!--
  Copyright (C) 2023 Александр Трубников <a.trubnikov@samolet.ru>
  Copyright (C) 2024 Sber

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
       Александр Трубников <a.trubnikov@samolet.ru>

  Contributors:
      Александр Трубников <a.trubnikov@samolet.ru> - 2023
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2024
      Vladislav Markin <markinvy@yandex.ru>, Sber - 2025
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <v-container class="desk" grid-list-xl fluid>
    <v-toolbar dense flat>
      <v-spacer />
      <v-btn v-show="!autoExec" icon title="Выполнить" v-on:click="manualExec(true)">
        <v-icon>mdi-arrow-right-drop-circle</v-icon>
      </v-btn>
      <v-btn icon title="Добавить панель" v-on:click="addTab()">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
      <v-menu location="bottom" v-bind:offset="8">
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item>
            <div class="menu-checkbox-row">
              <v-checkbox
                v-model="autoExec"
                density="compact"
                hide-details />
              <v-list-item-title>Автовыполнение</v-list-item-title>
            </div>
          </v-list-item>
          <v-list-item>
            <div class="menu-checkbox-row">
              <v-checkbox
                v-model="autoExpand"
                density="compact"
                hide-details />
              <v-list-item-title>Не сворачивать ответ</v-list-item-title>
            </div>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-autocomplete
        v-model="currentOrigins"
        multiple
        hide-details
        clearable
        chips
        closable-chips
        v-bind:items="originItems"
        label="origin"
        title="Базовый источник данных"
        prepend-icon="mdi-semantic-web"
        single-line />
      <template #extension>
        <v-tabs v-model="selectedTab" show-arrows>
          <v-tab v-for="(tab, index) in tabs" v-bind:key="tab.id" class="tab">
            <v-btn icon size="x-small" variant="text" title="Клонировать панель" class="btn-copy" v-on:click="cloneTab(index)">
              <v-icon size="x-small">mdi-content-copy</v-icon>
            </v-btn>
            <span class="tab-name">{{ tab.name }}</span>
            <v-btn v-if="index > 0" icon size="x-small" variant="text" title="Удалить панель" class="btn-del" v-on:click="delTab(index)">
              <v-icon size="x-small">mdi-close</v-icon>
            </v-btn>
          </v-tab>
        </v-tabs>
      </template>
    </v-toolbar>
    <splitpanes v-if="tabs.length" horizontal class="default-theme devtool-splitpanes">
      <pane v-bind:size="40">
        <!-- TODO: минимальная высота на всю split-area или передача клика в input-->
        <!-- TODO: theme selector, но лучше просто light/dark-->
        <code-component v-if="tabs[selectedTab]" v-model="tabs[selectedTab].code" v-bind:change="onChange" />
      </pane>
      <pane v-bind:size="60">
        <div v-if="tabs[selectedTab]" class="response">
          <!-- TODO: loader здорового человека -->
          <div v-if="tabs[selectedTab].loading">Идет загрузка</div>
          <div v-else>
            <div v-if="tabs[selectedTab].emptyData">
              {{ tabs[selectedTab].emptyData }}
            </div>
            <div v-else-if="tabs[selectedTab].unexpectedError">
              {{ tabs[selectedTab].unexpectedError }}
            </div>
            <div v-else-if="tabs[selectedTab].error">
              <response-component v-if="tabs[selectedTab].error" v-bind:data="tabs[selectedTab].error" v-bind:auto-expand="autoExpand" />
            </div>
            <div v-else>
              <response-component v-if="tabs[selectedTab].response" v-bind:data="tabs[selectedTab].response" v-bind:auto-expand="autoExpand" />
            </div>
          </div>
        </div>
      </pane>
    </splitpanes>
  </v-container>
</template>

<script>
  import cookie from 'vue-cookie';
  import CodeComponent from './CodeComponent.vue';
  import ResponseComponent from './ResponseComponent.vue';
  import env from '@front/helpers/env';
  import { Splitpanes, Pane } from 'splitpanes';
  import 'splitpanes/dist/splitpanes.css';

  function uuidv4() {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  const COOKIE_NAME_AUTOEXEC = 'json-dev-tool-new-autoexec';
  const COOKIE_NAME_AUTOEXPAND = 'json-dev-tool-new-autoexpand';
  const LOCALSTORAGE_NAME_TABS = 'json-dev-tool-new-tabs';
  const COOKIE_NAME_SELECTEDTAB = 'json-dev-tool-new-selectedtab';
  const TAB_DEFAULT = { 'origins': [], 'response': {}, 'loading': false, 'error': null, 'unexpectedError': null, 'controller': null, 'emptyData': null};


  export default {
    name: 'DevTool',
    components: {CodeComponent, ResponseComponent, Splitpanes, Pane},
    props: {
      pullData: {
        type: Function,
        required: true
      }
    },
    data() {
      return {
        selectedTab: parseInt(cookie.get(COOKIE_NAME_SELECTEDTAB) || 0) || 0,
        tabsCounter: 0,
        tabs: [],
        autoExpand: cookie.get(COOKIE_NAME_AUTOEXPAND) === 'true',
        autoExec: cookie.get(COOKIE_NAME_AUTOEXEC) === 'true',
        origins: [],
        debounceTimeout: null
      };
    },
    computed: {
      currentOrigins: {
        get() {
          return this.tabs[this.selectedTab]?.origins ?? [];
        },
        set(origins) {
          this.onOriginChange(origins ?? []);
        }
      },
      originItems() {
        return (this.origins || [])
          .map((origin) => typeof origin === 'string' ? origin : origin?.id)
          .filter(Boolean);
      }
    },
    watch: {
      autoExec(value) {
        value && this.exec();
        cookie.set(COOKIE_NAME_AUTOEXEC, value, 365);
      },
      autoExpand(value) {
        value && this.exec(); // TODO: тут не нужен перезапрос, но без него не работает
        cookie.set(COOKIE_NAME_AUTOEXPAND, value, 365);
      },
      selectedTab(value) {
        cookie.set(COOKIE_NAME_SELECTEDTAB, value, 365);
        if (this.autoExec){
          this.exec();
        }
      }
    },
    mounted() {
      this.onRefresh();
    },
    methods: {
      doRefresh() {
        if (localStorage.getItem(LOCALSTORAGE_NAME_TABS)) {
          try {
            const tabs = JSON.parse(localStorage.getItem(LOCALSTORAGE_NAME_TABS));
            this.tabs = tabs.map(tab => ({
              ...TAB_DEFAULT, ...tab
            }));
            this.tabsCounter = this.tabs.length;
            if (!this.tabs.length) {
              this.addTab();
              this.normalizeSelectedTab();
              return;
            }
            this.normalizeSelectedTab();
            this.exec();
            return;
          } catch(e) {
            localStorage.removeItem(LOCALSTORAGE_NAME_TABS);
          }
        }
        this.addTab();
        this.normalizeSelectedTab();
      },
      onRefresh() {
        this.refreshOrigins();
        if (this.refresher) clearTimeout(this.refresher);
        this.refresher = setTimeout(this.doRefresh, 50);
      },
      normalizeSelectedTab() {
        this.selectedTab = Math.min(Math.max(this.selectedTab, 0), this.tabs.length - 1);
      },
      refreshOrigins() {
        this.pullData(`(datasets.$spread().{
          "id": $keys()[0],
          "title": *.title
        })`).then((response) => this.origins = response);
      },
      deleteOrigin(originId) {
        this.tabs[this.selectedTab].origins = this.tabs[this.selectedTab]?.origins.filter((id) => id !== originId) ?? [];
        this.manualAutoExec(true);
      },
      saveTabsToLocalStorage(){
        const tabs = this.tabs.map(tab => ({
          'id': tab.id, 'name': tab.name, 'code': tab.code, 'origins': tab.origins
        }));
        localStorage.setItem(LOCALSTORAGE_NAME_TABS, JSON.stringify(tabs));
      },
      addTab() {
        const id = uuidv4();
        this.tabsCounter += 1;  // кол-во ключей в объекте tabs не получится использовать, т.к. при удалении-создании начнётся каша с нумерацией
        this.tabs.push({'id': id, 'name': `Панель #${this.tabsCounter}`, 'code': '', ...TAB_DEFAULT});
        this.saveTabsToLocalStorage();
      },
      cloneTab(id) {
        const oldTab = this.tabs[id];
        this.addTab();
        this.tabs[this.tabs.length - 1].code = oldTab.code;
        this.tabs[this.tabs.length - 1].origins = [...oldTab.origins];
      },
      delTab(id) {
        if (id === 0) return;

        this.tabs.splice(id, 1);
        this.normalizeSelectedTab();
        this.saveTabsToLocalStorage();
      },
      showEmpty(tab, data) {
        tab.emptyData = data || 'Пустой ответ от сервера';
      },
      showSuccess(tab, data) {
        tab.response = JSON.parse(JSON.stringify(data));
      },
      showError(tab, data) {
        tab.error = data;
      },
      manualExec(){
        this.exec();
      },
      manualAutoExec(now) {
        if (this.autoExec) {
          clearTimeout(this.debounceTimeout);
          this.debounceTimeout = setTimeout(() => {
            this.exec();
          }, now ? 0 : 500);
        }
      },
      exec(){
        const currentTab = this.tabs[this.selectedTab];

        currentTab.error = null;
        currentTab.unexpectedError = null;
        currentTab.emptyData = null;
        currentTab.response = null;

        this.saveTabsToLocalStorage();

        if (!currentTab.code){
          this.showSuccess(currentTab, '');
          return;
        }

        this.baseExec(currentTab);
      },
      async baseExec(currentTab){
        const origins = currentTab.origins.length > 1
          ? currentTab.origins.reduce((acc, ele) => {acc[ele] = ele; return acc;} ,{})
          : currentTab.origins[0];
        const subject = {
          source: `(${currentTab.code})`
        };
        let originContext;
        // метод getData() хелпера датасет-драйвера в режиме бекенда не пересылает контекст,
        // из-за чего передача датасета выглядит по-разному в двух режимах.
        if (env.isBackendMode) {
          subject.origin = origins;
          subject.separateDatasets = true;
        } else {
          originContext = currentTab.origins.length > 1
            ? await Promise.all(Object.keys(origins).map(async(id) => {
              return { [id]: await this.pullData(id) };
            }))
            : await this.pullData(origins);
        }
        this.pullData(subject, null, null, originContext).then(response => {
          if (response){
            this.showSuccess(currentTab, response);
          }else{
            this.showEmpty(currentTab);
          }
        }).catch(response => {
          this.showError(currentTab, response.message ?? response);
        });
      },
      onChange(code) {
        const currentTab = this.tabs[this.selectedTab];

        currentTab.code = code;

        this.manualAutoExec();
      },
      onOriginChange(origins) {
        if (!this.tabs[this.selectedTab]) return;
        this.tabs[this.selectedTab].origins = origins;
        this.manualAutoExec(true);
      }
    }
  };
</script>

<style scoped>
  /* Рабочая область — flex-колонка на всю высоту под шапкой, без внутренних отступов; выходящее за край обрезается */
  .desk {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: none;
    height: calc(100vh - var(--v-layout-top, 0px));
    max-height: 100%;
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }
  header.v-toolbar {
    height: 96px;
  }
  .devtool-splitpanes {
    height: calc(100% - 96px);
    border: solid 1px #eee;
  }
  .devtool-splitpanes :deep(.splitpanes__pane) {
    min-height: 0;
    overflow: hidden;
  }
  .response {
    height: 100%;
    min-height: 0;
    padding: 1em;
    overflow: auto;
  }
  .menu-checkbox-row {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }
  .tab {
    min-width: 0;
    height: 32px;
    padding: 0 8px;
  }
  .tab :deep(.v-btn) {
    flex: 0 0 auto;
  }
  .tab-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .btn-copy {
    opacity: 0;
  }
  .tab:hover .btn-copy {
    opacity: 1;
  }
</style>
