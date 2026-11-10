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
  <div class="container">
    <div v-if="error" class="error">
      {{ error }}
    </div>
    <div v-if="!error" class="content">
      <button v-bind:disabled="isLoading" class="button" v-bind:class="{button_disabled: isLoading}" v-on:click="format">Конвертировать</button>
      <table v-if="result.length > 0" class="table">
        <thead>
          <tr>
            <th class="table__cell">Имя файла</th>
            <th class="table__cell">Содержимое</th>
            <th class="table__cell">Сохранение</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(data, ind) in result" v-bind:key="ind">
            <td class="table__cell">{{ `${data.id}.yaml` }}</td>
            <td class="table__cell">{{ data.contentStatus }}</td>
            <td class="table__cell">{{ data.saveSatatus }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
  import yaml from 'yaml';

  const statuses = {
    content: {
      ok: 'Содержит данные',
      err: 'Нет данных'
    },
    save: {
      ok: 'Данные сохранены',
      err: 'Ошибка'
    }
  };

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
      },
      path: {
        type: String,
        required: true
      },
      params: {
        type: Object,
        default: null
      }
    },
    data() {
      return {
        error: null,
        isLoading: false,
        result: []
      };
    },
    methods: {
      async format() {
        this.isLoading = true;

        for (let { id, source, path } of this.profile?.components) {
          if (!source) return this.error = `Не заполнено значение "source" для компонета "${id}"`;
          if (!id) return this.error = 'Не задан идентификатор "components/id"';

          const resultItem = { id };
          try {
            const dataset = await this.pullData({ ...this.profile, source });

            this.checkIsEmpty(dataset)
              ? resultItem.contentStatus = statuses.content.ok
              : resultItem.contentStatus = statuses.content.err;

            const fileName = `${id}.yaml`;
            const uri = path ? `${path}/${fileName}` : fileName;

            await this.putContent(uri, yaml.stringify(dataset))
              .then(() => resultItem.saveSatatus = statuses.save.ok)
              .catch(() => resultItem.saveSatatus = statuses.save.err)
              .finally(() => {
                this.result.push(resultItem);
              });
          } catch (err) {
            return this.error = `Произошла ошибка при получении или сохранении данных для компонента "${id}"`;
          }
        }
        this.isLoading = false;
      },

      checkIsEmpty(content) {
        if(!content) return false;
        if(typeof content === 'object') {
          if(Array.isArray(content) && content.length === 0) return false;
          if(Object.keys(content).length === 0) return false;
        }
        if(typeof content === 'string' && !!content.trim()) return false;
        return true;
      }
    }

  };
</script>

<style scoped>

.error {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 64px;
  font-weight: 800;
  font-size: 16px;
  padding: 14px;
}
.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.button {
  background-color: blue;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
}
.button_disabled {
  opacity: .5;
}
.table {
  border-collapse: collapse;
}
.table__cell {
  border: 1px solid black;
  padding: 12px;
}
</style>
