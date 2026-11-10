<!--
  Copyright (C) 2026 Sber

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
      Sber
-->

<template>
  <div
    class="markdown-cell"
    v-bind:class="{ 'markdown-cell_editable': !disabled }"
    v-bind:style="stylesToApply"
    v-on:dblclick="handleDoubleClick"
    v-on:focusout="handleFocusOut">
    <template v-if="isEditing && !disabled">
      <div class="markdown-toolbar">
        <span>Markdown</span>
        <button
          type="button"
          class="markdown-toolbar-button"
          title="Показать результат"
          v-on:click.stop="finishEditing">
          Предпросмотр
        </button>
      </div>
      <textarea
        ref="textarea"
        v-bind:value="localValue"
        class="markdown-editor focus-element"
        v-on:input="handleInput"
        v-on:keydown="handleEditorKeydown" />
    </template>

    <template v-else>
      <button
        v-if="!disabled"
        type="button"
        class="markdown-edit-button focus-element"
        title="Редактировать Markdown"
        aria-label="Редактировать Markdown"
        v-on:mousedown.prevent
        v-on:click.stop="startEditing">
        <v-icon size="small">mdi-pencil</v-icon>
      </button>
      <inline-markdown class="editable-table-markdown" v-bind:value="value" v-bind:base-u-r-i="baseURI" />
    </template>
  </div>
</template>

<script>
  import InlineMarkdown from '@front/components/Docs/InlineMarkdown.vue';
  import { getStylesToApply } from '../../../lib/helpers';
  import { shouldFinishMarkdownEditing } from '@front/helpers/shouldFinishMarkdownEditing';

  export default {
    name: 'EditableTableMarkdownCell',
    components: {
      InlineMarkdown
    },
    props: {
      value: {
        type: [Number, String],
        default: ''
      },
      baseURI: {
        type: String,
        default: ''
      },
      disabled: {
        type: Boolean,
        default: false
      },
      styles: {
        type: Object,
        default: () => ({})
      }
    },
    emits: ['input', 'focus-cell'],
    data() {
      return {
        isEditing: false,
        localValue: this.value?.toString() || ''
      };
    },
    computed: {
      stylesToApply() {
        return getStylesToApply(this.value, this.styles);
      }
    },
    watch: {
      value(value) {
        const normalizedValue = value?.toString() || '';
        if (normalizedValue !== this.localValue) this.localValue = normalizedValue;
      }
    },
    methods: {
      startEditing() {
        if (this.disabled) return;
        this.isEditing = true;
        this.$nextTick(() => this.$refs.textarea?.focus());
      },
      finishEditing() {
        this.isEditing = false;
        this.$nextTick(() => this.$emit('focus-cell'));
      },
      handleInput(event) {
        this.localValue = event.target.value;
        this.$emit('input', this.localValue);
      },
      handleDoubleClick(event) {
        if (event.target.closest('a, button, textarea')) return;
        this.startEditing();
      },
      handleFocusOut(event) {
        if (!shouldFinishMarkdownEditing(this.isEditing, event.currentTarget, event.relatedTarget)) return;
        this.finishEditing();
      },
      handleEditorKeydown(event) {
        event.stopPropagation();
        if (event.key === 'Escape' || ((event.metaKey || event.ctrlKey) && event.key === 'Enter')) {
          event.preventDefault();
          this.finishEditing();
        }
      }
    }
  };
</script>

<style scoped>
.markdown-cell {
  position: relative;
  width: 100%;
  min-width: 0;
}

.markdown-cell_editable {
  padding-right: 28px;
}

.markdown-edit-button {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 1;
  padding: 2px;
  color: var(--color-gray);
  background: var(--color-bg-cell);
  border-radius: 4px;
  opacity: 0;
}

.markdown-cell:hover .markdown-edit-button,
.markdown-edit-button:focus-visible {
  opacity: 1;
}

.markdown-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
  color: var(--color-gray);
  font-size: 12px;
}

.markdown-toolbar-button {
  padding: 2px 6px;
  color: var(--color-focus);
  border: 1px solid var(--color-focus);
  border-radius: 4px;
}

.markdown-editor {
  display: block;
  width: 100%;
  min-width: 280px;
  min-height: 160px;
  max-height: 480px;
  padding: 8px;
  overflow: auto;
  resize: vertical;
  background: var(--color-bg-cell);
  border: 1px solid var(--color-focus);
  border-radius: 4px;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  line-height: 1.4;
}
</style>
