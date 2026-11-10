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
  import NewRowCard from '../DialogCard/NewRowCard.vue';

  export default {
    components: {
      NewRowCard
    },
    methods: {
      removeRow() {
        this.$emit('remove-row', this.selectedRows);
      },

      async startNewRowCreating() {
        if (this.tableOptions.newRow) { 
          const id = await this.autoCreateNewRowID();
          this.createNewRow(id);
        } else {
          this.isDialogOpen = true;
        }
      },

      async autoCreateNewRowID() {
        try {
          const expression = this.tableOptions.newRow;
          const data = { 'table': this.tableData };
          return await this.pullProfileData(expression, data);
        } catch (e) {
          console.warn('Произошла ошибка при создании новой строки. Проверьте возможность применения описанного JSONata выражения', e);
        }
      },

      createNewRow(rowID) {
        if (rowID in this.tableData) {
          console.warn(`Строка с идентификатором "${rowID}" уже существует`);
          return;
        }

        const newRow = this.headers
          .reduce((newRow, {headerID}) => Object.assign(newRow, {[headerID]: null}), {});

        this.$emit('add-row', {[rowID]: newRow});

        this.isDialogOpen = false;
      }
    }
  };
</script>

<style></style>
