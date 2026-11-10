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
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber

  Contributors:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2026
-->

<template>
  <v-dialog
    v-bind:model-value="modelValue"
    max-width="560"
    v-on:update:model-value="onToggle">
    <v-card class="support-modal">
      <div class="support-modal__header">
        <h2 class="support-modal__title">Поддержка</h2>
        <v-btn
          icon
          variant="text"
          size="small"
          title="Закрыть"
          class="support-modal__close"
          v-on:click="onToggle(false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
      <p class="support-modal__hint">Выберите подходящий канал</p>
      <div class="support-modal__cards">
        <a
          v-for="(card, index) in channels"
          v-bind:key="`${card.link}-${index}`"
          v-bind:href="card.link"
          class="support-modal__card"
          target="_blank"
          rel="noopener noreferrer">
          <span class="support-modal__card-icon">
            <v-icon v-if="card.icon" style="color:var(--icon-color)" size="28">{{ card.icon }}</v-icon>
          </span>
          <div class="support-modal__card-text">
            <h3 class="support-modal__card-name">{{ card.name }}</h3>
            <span v-if="card.desc" class="support-modal__card-desc">{{ card.desc }}</span>
          </div>
          <span class="support-modal__card-chevron">
            <v-icon style="color:var(--icon-color)" size="28">mdi-chevron-right</v-icon>
          </span>
        </a>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
  export default {
    name: 'SupportModal',
    props: {
      modelValue: {
        type: Boolean,
        default: false
      },
      channels: {
        type: Array,
        default: () => []
      }
    },
    emits: ['update:modelValue'],
    methods: {
      onToggle(value) {
        this.$emit('update:modelValue', value);
      }
    }
  };
</script>

<style scoped>
.support-modal {
  position: relative;
  padding: 16px 24px 20px;
  border-radius: 12px;
}

.support-modal__title {
  margin: 0;
  font-size: 20px;
  color: #111827;
}

.support-modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  color: #6b7280;
}

.support-modal__hint {
  margin: 6px 0 16px;
  font-size: 14px;
  color: #4b5563;
}

.support-modal__cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.support-modal__card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  --icon-color: #6b7280;
  &:hover, &:focus-visible {
    background: #f9fafb;
    border: 1px solid #d1d5db;
    transform: translateY(-1px);
    --icon-color: #00755d;
  }
}

.support-modal__card-icon {
  display: flex;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
}

.support-modal__card-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-width: 0;
}

.support-modal__card-name {
  margin: 0;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
}

.support-modal__card-desc {
  font-size: 13px;
  color: rgb(158, 158, 158);
}

.support-modal__card-chevron {
  margin-left: auto;
}
</style>
