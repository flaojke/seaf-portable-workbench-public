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
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
-->

<script>
  import { createTableHash } from '../lib/helpers';

  const CACHE_INTERVAL_TIME = 1250;
  const SAVING_MARK_KEY = 'isEditableTableSaveReload';
  const PAGE_LIST_CACHE_KEY = 'editableTablePages';

  const STORAGE_KEY_PREFIX = 'editable_table';

  export default {
    data() {
      return {
        storageKey: this.createStorageKey(),
        debounceTimeout: null
      };
    },
    watch: {
      tableData: {
        handler(newValue, oldValue) {
          if(this.tableOptions.editable && oldValue && newValue) {
            this.cacheData();
          }
        },
        deep: true
      }
    },
    methods: {
      getFromCache() {
        const data = sessionStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
      },

      markStorageAboutTableSaving() {
        sessionStorage.setItem(SAVING_MARK_KEY, 'true');
      },

      createStorageKey() {
        const urlHash = window.location.hash.endsWith('#/root/')
          ? window.location.hash.split('#/root/')[0]
          : window.location.hash;
        const hash = createTableHash(this.profile.$base, urlHash, this?.$attrs?.params);
        return `${STORAGE_KEY_PREFIX}:${hash}`;
      },

      cacheData() {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(this.writeToStorage, CACHE_INTERVAL_TIME);
        if(!this.tableOptions.hasChange) {
          this.updateCacheWithEditedTables();
        }
      },
      
      writeToStorage() {
        const jsonData = JSON.stringify({
          data: this.tableData,
          createdRows: this.createdRows
        });
        sessionStorage.setItem(this.storageKey, jsonData);
      },

      updateCacheWithEditedTables() {
        const storage = sessionStorage.getItem(PAGE_LIST_CACHE_KEY);
        const cacheList = storage 
          ? JSON.parse(storage).filter(id => id !== this.storageKey) 
          : [];
        cacheList.push(this.storageKey);
        sessionStorage.setItem(PAGE_LIST_CACHE_KEY, JSON.stringify(cacheList));

        this.tableOptions.hasChange = true;
      },

      clearCache() {
        clearTimeout(this.debounceTimeout);
        sessionStorage.removeItem(this.storageKey);

        const storage = sessionStorage.getItem(PAGE_LIST_CACHE_KEY);
        const cacheList = storage 
          ? JSON.parse(storage).filter(id => id !== this.storageKey) 
          : [];
        sessionStorage.setItem(PAGE_LIST_CACHE_KEY, JSON.stringify(cacheList));
      }
    }
  };
</script>
