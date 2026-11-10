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
      R.Piontik <r.piontik@mail.ru> - 2024
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <v-alert class="dh-alert dh-alert--error" icon="mdi-alert-circle-outline">
    <div class="dh-alert__title">Ошибка выражения JSONata</div>
    <div class="dh-alert__text">{{ message }}</div>
  </v-alert>
</template>

<script>
  /*
    Ошибка построения меню. Ошибки выражений отдельных пунктов перехватывает построитель меню,
    сюда доходит только общая ошибка (например, от backend) — без запроса и места ошибки.
    Место ошибки в запросе показывает песочница JSONata (jsonataErrorInfo).
  */
  export default {
    name: 'JSONataErrorExplainer',
    props: {
      error: {
        type: Object,
        default: null
      }
    },
    computed: {
      message() {
        const message = this.error?.message || this.error || '';
        return String(message).replaceAll('\\n', '\n');
      }
    }
  };
</script>
