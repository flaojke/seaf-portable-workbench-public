<template>
  <div class="wrapper">
    <span>
      Ошибка
    </span>

    <div class="action-block">
      <v-menu location="bottom end" v-bind:offset="4" v-bind:close-on-content-click="false">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            variant="text"
            color="white"
            density="compact"
            title="Подробнее об ошибке"
            aria-label="Подробнее об ошибке">
            <v-icon color="white">
              mdi-alert-circle
            </v-icon>
          </v-btn>
        </template>
        <div class="error-card">
          <div class="error-card__title">
            <v-icon class="error-card__icon" icon="mdi-alert-circle-outline" size="18" v-bind:color="null" />
            Ошибка в данных
          </div>
          <div class="error-message">{{ message }}</div>
        </div>
      </v-menu>

      <v-btn
        icon
        variant="text"
        color="white"
        density="compact"
        title="Сбросить значение"
        aria-label="Сбросить значение"
        v-on:click="onReset">
        <v-icon color="white">
          mdi-close-circle-outline
        </v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      value: {
        type: Object,
        required: true
      }
    },
    emits: ['reset-error'],
    computed: {
      // Сообщение приходит с переводами строк по краям, а pre-wrap показывает их пустыми строками
      message() {
        return `${this.value?.message ?? ''}`.trim();
      }
    },
    methods: {
      onReset() {
        this.$emit('reset-error');
      }
    }
  };
</script>

<style scoped>
.wrapper {
  display: flex;
  justify-content: space-between;
  gap: 8px;

  background-color: var(--color-warning);
  color: var(--color-white);
  font-weight: 500;
}

/* Карточка с текстом ошибки: выводится в оверлее, но в шаблоне компонента, поэтому scoped-стили работают */
.error-card {
  max-width: 420px;
  padding: 10px 12px 12px;
  border: 1px solid var(--dh-border);
  border-left: 3px solid var(--dh-danger);
  border-radius: var(--dh-radius);
  background: var(--dh-surface);
  box-shadow: var(--dh-shadow-overlay);
  color: var(--dh-text);
}

.error-card__title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  color: var(--dh-status-bad-text);
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
}

.error-card__icon {
  color: var(--dh-danger);
}

.error-message {
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 19px;
  overflow-wrap: break-word;
}

.action-block {
  display: flex;
  align-self: flex-start;
  gap: 4px;
}

</style>
