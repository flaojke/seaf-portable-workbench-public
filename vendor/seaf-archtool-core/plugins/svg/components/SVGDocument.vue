<template>
  <div v-if="showData" class="svg-image" v-html="content" />
  <div v-else>
    <p>Ключи не найдены в шаблоне:</p>
    <li v-for="item in validate_result.not_found_in_svg" v-bind:key="item">
      {{ item }}
    </li>
    <p>Ключи не найдены в результате запроса:</p>
    <li v-for="item in validate_result.not_found_in_source" v-bind:key="item">
      {{ item }}
    </li>
  </div>
</template>

<script>
  import mustache from 'mustache';

  export default {
    name: 'SVGDocument',
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
      // Требуем обязательно передавать функцию доступа к Data Lake
      pullData: {
        type: Function,
        required: true
      },
      // Требуем обязательно сообщать путь к объекту описывающему документ в коде
      path: {
        type: String,
        required: true
      },
      // Запрашиваем параметры рендеринга
      params: {
        type: Object,
        default: null
      },
      // Признак рендеринга для печати
      toPrint: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        showData: true,
        // Обработчик события обновления
        refresher: null,
        // Здесь будет храниться контент из полученного SVG файла
        content: '',
        validate_result: {
          not_found_in_svg : [],
          not_found_in_source: []
        },
        data: null
      };
    },

    watch: {
      profile() {
        // При изменении переметров, генерируем событие обновления
        this.onRefresh();
      }
    },
    mounted() {
      // При монтировании компонента в DOM, генерируем событие обновления
      this.onRefresh();
    },
    methods: {
      // Функция обновления контента документа с учетом параметров содержащихся в "this.profile"
      doRefresh() {
        if (this.profile) {
          this.pullData(this.profile.source)
            .then( (data) => {
              this.data = data;
            })
            .then( () => this.getContent(this.profile.template) )
            // Если все хорошо, рендерим HTML "как есть"
            .then((response) => {
              let responseData = response.data;
              // Если была применена PAPI мидлвара, то мы получим буфер вместо svg разметки.
              // Преобразуем его обратно в строку.
              if (response.data instanceof Uint8Array) {
                responseData = new TextDecoder().decode(response.data);
              }
              if (this.params.check) {
                this.showData = false;
                this.checkTemplate(responseData, this.data);
              } else {
                this.showData = true;
                this.content = mustache.render(responseData, this.data);
              }
            })
            // Если что-то пошло не так, генерируем HTML с ошибкой
            .catch((error) => {
              this.content = `<div style="color:#fff; background-color: #f00">Ошибка выполнения запроса: <br> ${error}</div>`;
            });
        } else {
          this.data = null;
          this.content = '';
        }
      },

      checkTemplate(template, data){
        const ast = mustache.parse(template);
        const res = this.validate_result;
        res.not_found_in_svg = [];
        res.not_found_in_source = [];
        const keys_in_template = {};
        // Формат структуры: ast - массив
        // элементы массива:
        //   массив из 4 частей:
        // 0 - тип части
        // 1 - троковая константа / имя переменной
        // 2 - смещение в файле начала фрагмента
        // 3 - смещение в файле конца фрагмента

        ast.map( (el) => {
          const tp = el[0];
          const vr = el[1];
          if ( tp != 'name' ) return;
          /* В шаблоне может быть несколько ссылок на один и тот же параметр, исключаем дубли */
          if ( keys_in_template[vr] == 1 ) return;
          keys_in_template[vr] = 1;
          if ( vr in data) return;
          res.not_found_in_source.push(vr);
        } );

        Object.keys(data).map( (el) => {
          if ( el in keys_in_template ) return;
          res.not_found_in_svg.push(el);
        });
      },
      // Обработчик события обновления
      onRefresh() {
        // Если обработчик уже запущен, останавливаем его
        if (this.refresher) clearTimeout(this.refresher);
        // Для исключения избыточных обращений к Data Lake откладывам обноление на 50мс
        this.refresher = setTimeout(this.doRefresh, 50);
      }
    }
  };
</script>

<style scoped>
h2 {
  margin-top: 24px;
}

td {
  padding: 6px;
  ;
}

.space {
  padding: 12px;
}

.label {
  width: 20%;
}

.svg-image {
  padding: 12px;
  margin: 12px;
  border: solid 1px #ccc;
}</style>
