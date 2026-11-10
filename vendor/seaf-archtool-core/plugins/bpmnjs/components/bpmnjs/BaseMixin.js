/*
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
*/

export default {
    props: {
        // Требуем обязательно передавать профайл документа
        profile: {
            type: Object,
            required: true
        },
        // Требуем обязательно передавать функцию получения контента
        getContent: {
            type: Function,
            required: true
        },
        // Получаем функцию сохранения контента если есть
        putContent: {
            type: Function,
            default: null,
            required: false
        },
        // Содержимое документа
        value: String
    },
    methods: {
        // Методы для реализации в компонентах
        // init() { },
        // applyContent(content) { },

        // Регистрация ошибки
        registerError(error) {
            this.errors.push(error);
        },
        // Регистрация предупреждений
        registerWarning(warning) {
            this.warnings.push(warning);
        }
    },
    watch: {
        value(value) {
            this.applyContent(value);
        }
    },
    mounted() {
        this.init();
        this.applyContent(this.value);
    },
    data() {
        return {
            errors: [],
            warnings: [],
            data: null
        };
    }
};
