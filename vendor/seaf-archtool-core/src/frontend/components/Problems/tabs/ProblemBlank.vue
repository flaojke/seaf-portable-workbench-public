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
      Navasardyan Suren, Sber - 2023
      R.Piontik <r.piontik@mail.ru> - 2022
      Rostislav Kabalin <kabalin2009@yandex.ru> - 2022
      Vladislav Markin <markinvy@yandex.ru>, Sber - 2023
      Artyom Prilip <artyom.prilip@gmail.com>, Sber - 2026
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <v-card class="problem-card" elevation="0">
    <div class="problem-card__head">
      <v-icon
        v-if="problem.content"
        class="problem-card__icon"
        v-bind:class="problem.exception ? 'problem-card__icon--exception' : 'problem-card__icon--error'"
        v-bind:icon="problem.exception ? 'mdi-alert' : 'mdi-alert-circle'"
        v-bind:title="problem.exception ? 'На отклонение определено исключение' : 'Отклонение'"
        size="20"
        v-bind:color="null" />
      <span class="problem-card__title">{{ problem.content ? 'Сводка' : 'Отклонение' }}</span>
      <span
        v-if="problem.content"
        class="problem-card__status"
        v-bind:class="problem.exception ? 'problem-card__status--exception' : 'problem-card__status--error'">
        {{ problem.exception ? 'Исключение' : 'Отклонение' }}
      </span>
      <v-btn
        class="problem-card__close"
        title="Закрыть"
        aria-label="Закрыть"
        size="small"
        variant="text"
        icon
        v-on:click="$emit('close')">
        <v-icon icon="mdi-close" size="20" v-bind:color="null" />
      </v-btn>
    </div>
    <div v-if="!problem.content" class="problem-card__empty">
      Отклонение [{{ subject }}] не обнаружено. Вероятно, оно устранено.
    </div>
    <dl v-else class="problem-card__fields">
      <dt>Идентификатор отклонения</dt>
      <dd class="problem-card__id">{{ subject }}</dd>
      <template v-if="problem.content.location">
        <dt>Ссылка на объект</dt>
        <dd>
          <router-link class="problem-card__link" v-bind:to="problem.content.location">{{ problem.content.location }}</router-link>
        </dd>
      </template>
      <template v-if="problem.content.correction">
        <dt>Как исправить</dt>
        <dd class="problem-card__text">{{ problem.content.correction }}</dd>
      </template>
      <template v-if="problem.content.description">
        <dt>Описание проблемы</dt>
        <dd class="problem-card__text">{{ problem.content.description }}</dd>
      </template>
      <template v-if="problem.content.standard">
        <dt>Стандарт</dt>
        <dd>
          <router-link
            v-if="!isExternalURI(problem.content.standard)"
            class="problem-card__link"
            v-bind:to="problem.content.standard">
            {{ problem.content.standard }}
          </router-link>
          <a v-else class="problem-card__link" v-bind:href="problem.content.standard">{{ problem.content.standard }}</a>
        </dd>
      </template>
    </dl>
    <!-- Исключение — выноской, как цитата в markdown -->
    <div v-if="problem.content && problem.exception" class="problem-card__exception">
      <div class="problem-card__exception-title">
        <v-icon icon="mdi-shield-check-outline" size="18" v-bind:color="null" />
        Исключение
      </div>
      <dl class="problem-card__fields problem-card__fields--compact">
        <template v-if="problem.exception.reason">
          <dt>Причина исключения</dt>
          <dd class="problem-card__text problem-card__text--plain">{{ problem.exception.reason }}</dd>
        </template>
        <template v-if="problem.exception.cause">
          <dt>Документ-основание</dt>
          <dd>
            <router-link
              v-if="!isExternalURI(problem.exception.cause)"
              class="problem-card__link"
              v-bind:to="problem.exception.cause">
              {{ problem.exception.cause }}
            </router-link>
            <a v-else class="problem-card__link" v-bind:href="problem.exception.cause">{{ problem.exception.cause }}</a>
          </dd>
        </template>
      </dl>
    </div>
  </v-card>
</template>

<script>
  import uri from '@front/helpers/uri';

  export default {
    name: 'ProblemBlank',
    props: {
      subject: { type: String, default: '' },
      problems: { type: Array, default: () => [] }
    },
    emits: ['close'],
    data() {
      return {};
    },
    computed: {
      problem() {
        let content = null;
        let validator = null;
        for(let i = 0; i < this.problems?.length && !content; i++ ) {
          validator = this.problems[i];
          content = (validator.items || []).find((problem) => (problem || {}).uid === this.subject);
        }
        return {
          content,
          validator,
          exception: content?.exception
        };
      }
    },
    methods: {
      isExternalURI: (url) => uri.isExternalURI(url)
    }
  };
</script>

<style scoped>
  /* Карточка отклонения. Цвета — из общей палитры представлений (presentation.css) */
  .problem-card {
    width: 100%;
    margin-top: 12px;
    border: 1px solid var(--dh-border);
    border-radius: var(--dh-radius);
    background: var(--dh-surface);
    color: var(--dh-text);
  }

  .problem-card__head {
    display: flex;
    align-items: center;
    gap: 8px;
    /* Высота шапки — как у карточки «Валидаторы» */
    min-height: 56px;
    padding: 7px 8px 7px 16px;
    border-bottom: 1px solid var(--dh-border);
    background: var(--dh-surface-header);
  }

  .problem-card__title {
    font-size: 16px;
    font-weight: 600;
  }

  .problem-card__icon--error {
    color: var(--dh-danger);
  }

  .problem-card__icon--exception {
    color: var(--dh-attention);
  }

  .problem-card__status {
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    line-height: 18px;
  }

  .problem-card__status--error {
    background: var(--dh-status-bad-bg);
    color: var(--dh-status-bad-text);
  }

  .problem-card__status--exception {
    background: var(--dh-status-wip-bg);
    color: var(--dh-status-wip-text);
  }

  .problem-card__close {
    margin-left: auto;
    color: var(--dh-text-secondary);
  }

  .problem-card__empty {
    padding: 16px;
    color: var(--dh-text-muted);
    font-size: 14px;
  }

  /* Поля: подпись приглушенная, значение обычным текстом */
  .problem-card__fields {
    margin: 0;
    padding: 12px 16px 16px;
  }

  .problem-card__fields dt {
    margin-top: 12px;
    color: var(--dh-text-muted);
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
  }

  .problem-card__fields dt:first-child {
    margin-top: 0;
  }

  .problem-card__fields dd {
    margin: 2px 0 0;
    font-size: 14px;
    line-height: 20px;
    overflow-wrap: anywhere;
    /* Перенос с дефисом — только по явному мягкому переносу: идентификаторы выводятся как есть */
    hyphens: manual;
  }

  .problem-card__id {
    font-family: var(--dh-font-mono);
    font-size: 13px !important;
  }

  .problem-card__link {
    color: var(--dh-primary-strong);
    text-decoration: none;
  }

  .problem-card__link:hover {
    text-decoration: underline;
  }

  /* Многострочный текст валидатора: переводы строк сохраняются */
  .problem-card__text {
    margin-top: 4px !important;
    padding: 10px 12px;
    border-radius: var(--dh-radius);
    background: var(--dh-surface-alt);
    white-space: pre-wrap;
  }

  .problem-card__text--plain {
    padding: 0;
    background: none;
  }

  .problem-card__exception {
    margin: 0 16px 16px;
    padding: 10px 14px;
    border-left: 3px solid var(--dh-attention);
    border-radius: 0 var(--dh-radius) var(--dh-radius) 0;
    background: var(--dh-status-wip-bg);
  }

  .problem-card__exception-title {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--dh-status-wip-text);
    font-size: 14px;
    font-weight: 600;
  }

  .problem-card__fields--compact {
    padding: 6px 0 0;
  }
</style>
