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
      Yushkov Alexandr <asyushkov@gmail.com> - 2026
-->

<script>
  import { createTableHash } from '../../lib/helpers';

  const CACHE_TIMEOUT = 2000;
  const STORAGE_KEY_PREFIX = 'editable_table_options';

  export default {
    data() {
      return {
        optionStorageKey:  this.createStorageKey(),
        debounceTimeout: null
      };
    },

    methods: {
      createStorageKey() {
        const urlHash = window.location.hash.endsWith('#/root/')
          ? window.location.hash.split('#/root/')[0]
          : window.location.hash;
        const hash = createTableHash(this.$parent.profile.$base, urlHash, this.$parent?.$attrs?.params);
        return `${STORAGE_KEY_PREFIX}:${hash}`;
      },

      getOptionsCache() {
        const storageKey = this.createStorageKey();
        const cache = sessionStorage.getItem(storageKey);
        return cache ? JSON.parse(cache) : {};
      },

      updateOptionsCache() {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
          const data = {
            filters: this.filters,
            page: this.currentPage,
            sortList: this.sortList
          };
          if (typeof this.globalSearch === 'string') {
            data.globalSearch = this.globalSearch;
          }
          if (this.columnWidths) {
            data.columnWidths = this.columnWidths;
          }
          sessionStorage.setItem(this.optionStorageKey, JSON.stringify(data));
        }, CACHE_TIMEOUT);
      }
    }
  };
</script>
