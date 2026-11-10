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
  export default {
    computed: {
      headerRowSize() {
        return this.headers.filter(({display}) => display).length + +Boolean(this.tableOptions.selection);
      }
    },

    methods: {
      handleTableKeydown(e) {
        const currentElementIndex = +e?.currentTarget?.getAttribute('data-index');
        if (!currentElementIndex) return;

        let nextIndex;
        if (e.key === ' ') {
          e.preventDefault();

        } else if (e.key === 'ArrowUp' && !e.target?.classList?.contains('text-area')) {
          nextIndex = this.tableOptions.direction === 'ltr'
            ? this.getElementIndexFromAbove(currentElementIndex)
            : this.getElementIndexFromLeft(currentElementIndex);

        } else if (e.key === 'ArrowRight' && !e.target?.classList?.contains('text-area')) {
          nextIndex = this.tableOptions.direction === 'ltr'
            ? this.getElementIndexFromRight(currentElementIndex)
            : this.getElementIndexFromBottom(currentElementIndex);

        } else if (e.key === 'ArrowDown' && !e.target?.classList?.contains('text-area')) {
          nextIndex = this.tableOptions.direction === 'ltr'
            ? this.getElementIndexFromBottom(currentElementIndex)
            : this.getElementIndexFromRight(currentElementIndex);

        } else if (e.key === 'ArrowLeft' && !e.target?.classList?.contains('text-area')) {
          nextIndex = this.tableOptions.direction === 'ltr'
            ? this.getElementIndexFromLeft(currentElementIndex)
            : this.getElementIndexFromAbove(currentElementIndex);

        } else if (e.key === 'Home') {
          // первая ячейка в СТРОКЕ
          nextIndex = this.tableOptions.direction === 'ltr'
            ? this.getElementIndexFromStartOfRow(currentElementIndex)
            : this.getElementIndexFromFirstRow(currentElementIndex);

        } else if (e.key === 'End') {
          // последняя ячейка в СТРОКЕ
          nextIndex = this.tableOptions.direction === 'ltr'
            ? this.getElementIndexFromEndOfRow(currentElementIndex)
            : this.getElementIndexFromLastRow(currentElementIndex);

        } else if (e.key === 'PageUp') {
          // первая ячейка в СТОЛБЦЕ
          nextIndex = this.tableOptions.direction === 'ltr'
            ? this.getElementIndexFromFirstRow(currentElementIndex)
            : this.getElementIndexFromStartOfRow(currentElementIndex);

        } else if (e.key === 'PageDown') {
          // последняя ячейка в СТОЛБЦЕ
          nextIndex = this.tableOptions.direction === 'ltr'
            ? this.getElementIndexFromLastRow(currentElementIndex)
            : this.getElementIndexFromEndOfRow(currentElementIndex);
            
        } else if (
          (e.key === 'Enter' || e.key === 'F2') &&
          this.$refs.table?.children?.[currentElementIndex]?.dataset?.render !== 'markdown' &&
          this.$refs.table?.children?.[currentElementIndex]?.classList?.contains('text')
        ) {
          const currentElement = this.$refs.table.children[currentElementIndex];

          if (e.target === currentElement) {
            const inputElement = this.findInnerInputElement(currentElement);
            if (inputElement?.disabled) return;
            inputElement && inputElement.focus();

          } else {
            this.$refs.table.children[currentElementIndex].focus();

          }

          e.preventDefault();
          e.stopPropagation();
          return;
        }

        if (!nextIndex) return;

        e.preventDefault();
        e.stopPropagation();

        const nextElement = this.$refs.table.children[nextIndex];

        if (!nextElement) return;

        if (!nextElement.classList.contains('cell_editable') || nextElement.classList.contains('text')) {
          return nextElement.focus();
        }

        const inputElement = this.findInnerInputElement(nextElement);

        if (!inputElement || inputElement.disabled) nextElement.focus();

        inputElement && inputElement.focus();

      },

      findInnerInputElement(element) {
        return element.querySelector('.focus-element');
      },

      getElementIndex(rowIndex, colunIndex) {
        const currentIndex = colunIndex + +Boolean(this.tableOptions.selection);
        return this.headerRowSize + currentIndex + (this.headerRowSize * rowIndex);
      },

      getElementIndexFromAbove(currentIndex) {
        const isFirstRow = (this.headerRowSize * 2) > currentIndex;
        return isFirstRow ? null : currentIndex - this.headerRowSize;
      },

      getElementIndexFromRight(currentIndex) {
        const isLastColumn = ((currentIndex + 1) % this.headerRowSize) === 0;
        return isLastColumn ? null : currentIndex + 1;
      },

      getElementIndexFromBottom(currentIndex) {
        const lastIndex = this.headerRowSize + (this.filteredAndSortedItemsSlice.length * this.headerRowSize) - 1;
        const result = currentIndex + this.headerRowSize;
        return result > lastIndex ? null : result;
      },

      getElementIndexFromLeft(currentIndex) {
        const isFirstColumn = ((currentIndex + 1 - +Boolean(this.tableOptions.selection)) % this.headerRowSize) === 1;
        return isFirstColumn ? null : currentIndex - 1;
      },

      getElementIndexFromFirstRow(currentIndex) {
        const columnIndex = currentIndex % this.headerRowSize;
        const result = this.headerRowSize + columnIndex;
        return currentIndex === result ? null : result;
      },

      getElementIndexFromEndOfRow(currentIndex) {
        const currentRow = Math.floor(currentIndex / this.headerRowSize) + 1;
        return (currentRow * this.headerRowSize) - 1;
      },

      getElementIndexFromLastRow(currentIndex) {
        const columnIndex = currentIndex % this.headerRowSize;
        const result = ((this.filteredAndSortedItemsSlice.length - 1) * this.headerRowSize) + this.headerRowSize + columnIndex;
        return currentIndex === result ? null : result;
      },

      getElementIndexFromStartOfRow(currentIndex) {
        return (Math.ceil(currentIndex / this.headerRowSize) * this.headerRowSize) - this.headerRowSize + +Boolean(this.tableOptions.selection);
      }
    } 
  };
</script>
