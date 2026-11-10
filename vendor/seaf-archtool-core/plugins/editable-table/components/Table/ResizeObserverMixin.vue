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
      Aksinenko Anatoly <aiaksinenko@sberbank.ru>, Sber - 2026
-->

<script>
  export default {
    data() {
      return {
        freezeObserver: null,
        freezeRecalculateFrame: null
      };
    },

    mounted() {
      this.initFreezeObserver();
    },

    beforeUnmount() {
      if (this.freezeObserver) {
        this.freezeObserver.disconnect();
        this.freezeObserver = null;
      }

      if (this.freezeRecalculateFrame) {
        cancelAnimationFrame(this.freezeRecalculateFrame);
        this.freezeRecalculateFrame = null;
      }
    },

    methods: {
      freezeIsEnabled() {
        const freeze = this.tableOptions.freeze || {};

        return freeze.rows > 0 || freeze.columns > 0 || this.tableOptions.pinned;
      },

      initFreezeObserver() {
        if (!this.freezeIsEnabled() || typeof ResizeObserver === 'undefined') {
          return;
        }

        this.freezeObserver = new ResizeObserver(() => this.scheduleFreezeRecalculation());
        this.freezeObserver.observe(this.$refs.table);
        this.scheduleFreezeRecalculation();
      },

      resizeObserve(el) {
        if (this.freezeObserver && el?.$el) {
          this.freezeObserver.observe(el.$el);
        }

        this.scheduleFreezeRecalculation();
      },

      scheduleFreezeRecalculation() {
        if (!this.freezeIsEnabled() || this.freezeRecalculateFrame) {
          return;
        }

        this.freezeRecalculateFrame = requestAnimationFrame(() => {
          this.freezeRecalculateFrame = null;
          this.recalculateFrozenCells();
        });
      },

      recalculateFrozenCells() {
        const table = this.$refs.table;
        if (!table) return;

        const cells = Array.from(table.children);
        const axisSize = this.headers.filter(({ display }) => display).length
          + Number(this.tableOptions.selection);
        if (!axisSize) return;

        const direction = this.tableOptions.direction;
        const freeze = this.tableOptions.freeze || {};
        const rowsToFreeze = freeze.rows || 0;
        const columnsToFreeze = freeze.columns || 0;
        const coordinates = cells.map((_, index) => direction === 'ttb'
          ? { row: index % axisSize, column: Math.floor(index / axisSize) }
          : { row: Math.floor(index / axisSize), column: index % axisSize });

        const firstCellByRow = new Map();
        const firstCellByColumn = new Map();
        coordinates.forEach((coordinate, index) => {
          if (!firstCellByRow.has(coordinate.row)) firstCellByRow.set(coordinate.row, cells[index]);
          if (!firstCellByColumn.has(coordinate.column)) firstCellByColumn.set(coordinate.column, cells[index]);
        });

        const legacyPinnedColumns = new Set();
        coordinates.forEach((coordinate, index) => {
          if (coordinate.row === 0 && cells[index].classList.contains('cell_pinned')) {
            legacyPinnedColumns.add(coordinate.column);
          }
        });

        const frozenColumns = new Set(legacyPinnedColumns);
        for (let column = 0; column < columnsToFreeze; column++) frozenColumns.add(column);

        const tableStyle = getComputedStyle(table);
        const columnSizes = tableStyle.gridTemplateColumns
          .split(' ')
          .map((value) => Number.parseFloat(value))
          .filter((value) => Number.isFinite(value));
        const rowSizes = tableStyle.gridTemplateRows
          .split(' ')
          .map((value) => Number.parseFloat(value))
          .filter((value) => Number.isFinite(value));
        const columnGap = Number.parseFloat(tableStyle.columnGap) || 0;
        const rowGap = Number.parseFloat(tableStyle.rowGap) || 0;
        const tableLeftPadding = Number.parseFloat(tableStyle.paddingLeft) || 0;
        const tableTopPadding = Number.parseFloat(tableStyle.paddingTop) || 0;

        const leftOffsets = new Map();
        let leftOffset = tableLeftPadding;
        for (let column = 0; column < axisSize; column++) {
          leftOffsets.set(column, leftOffset);
          if (frozenColumns.has(column)) {
            leftOffset += (columnSizes[column] || firstCellByColumn.get(column)?.offsetWidth || 0)
              + columnGap;
          }
        }

        const rowCount = Math.max(...coordinates.map(({ row }) => row), -1) + 1;
        const topOffsets = new Map();
        let topOffset = tableTopPadding;
        for (let row = 0; row < rowCount; row++) {
          topOffsets.set(row, topOffset);
          const cell = firstCellByRow.get(row);
          if (row < rowsToFreeze && cell) {
            topOffset += (rowSizes[row] || cell.offsetHeight || 0) + rowGap;
          }
        }

        cells.forEach((cell, index) => {
          const { row, column } = coordinates[index];
          const freezeTop = row < rowsToFreeze;
          const freezeLeft = frozenColumns.has(column);

          cell.classList.toggle('cell_freeze_top', freezeTop);
          cell.classList.toggle('cell_freeze_left', freezeLeft);
          cell.classList.toggle('cell_freeze_corner', freezeTop && freezeLeft);

          if (freezeLeft) {
            cell.style.left = `${leftOffsets.get(column)}px`;
          } else if (!cell.classList.contains('cell_pinned')) {
            cell.style.removeProperty('left');
          }

          if (freezeTop) {
            cell.style.top = `${topOffsets.get(row) - (topOffsets.get(0) || 0)}px`;
          } else {
            cell.style.removeProperty('top');
          }
        });
      }
    }
  };
</script>
