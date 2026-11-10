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
      ilya.ermolin <ilya.ermolin@rtlabs. ru>

  Contributors:
      ilya.ermolin <ilya.ermolin@rtlabs. ru> - 2024
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2026
-->

<template>
  <div v-if="content_error" v-html="content_error" />
  <iframe v-else-if="showData" ref="frame" class="drawio-image" v-bind:src="serverURI" />
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
  import { ref } from 'vue';
  import { buildDrawioUrl } from '@front/helpers/drawioUrl';

  const CONF_PATH = '($.entities."config.plugin.drawio".handlers)';

  const DRAWIO_MANDATORY_PARAMS = {
    embed: '1',
    proto: 'json'
  };


  export default {
    name: 'DrawIODocument',
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
    setup() {
      const frame = ref(null);
      return {
        frame
      };
    },
    data() {
      return {
        showData: true,
        // Обработчик события обновления
        refresher: null,
        // Здесь будет храниться контент из полученного SVG файла
        content_tmp: '',
        content: '',
        content_error: '',
        validate_result: {
          not_found_in_svg : [],
          not_found_in_source: []
        },
        data: {
          params: null,
          xml_mutators: null
        },
        conf: null
      };
    },
    computed: {
      serverURI() {
        return buildDrawioUrl({
          componentDefaults: { noSaveBtn: '1' },
          documentParams: this.profile?.drawio_url_params,
          componentMandatory: DRAWIO_MANDATORY_PARAMS
        });
      }
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
      // Подписываемся на получение событий

      this.log('mounted - addEventListener', this.listenEvents);
      this.log('mounted - frame ', this.frame);

      window.addEventListener('message', this.listenEvents);
    },
    unmounted(){
      window.removeEventListener('message', this.listenEvents);
    },
    methods: {
      log(...args){
        // В условии можно поставить интересующие случаи для точечной отладки
        // eslint-disable-next-line
        if (false){
          // eslint-disable-next-line
          console.info( ...args );
        }
      },
      // Функция обновления контента документа с учетом параметров содержащихся в "this.profile"
      doRefresh() {
        if (this.profile) {
          this.log('before pullData', CONF_PATH);
          this.pullData(CONF_PATH)
            .then( (conf) => {
              this.log('get config', conf);
              this.conf = conf;
            })
            .then( () => {
              if (this.profile.source) {
                return this.pullData(this.profile.source) ;
              } else {
                return Promise.resolve(null);
              }
            } )
            .then( (data) => {
              this.log('get source', data);
              this.data = data;
            })
            .then( () => this.getContent(this.profile.template) )
            .then((response) => {
              this.log('getContent - this.profile.template', response);
              if (this.params.check) {
                this.showData = false;
                this.checkTemplate(response.data, this.data.params);
              } else if ( this.data  ){
                this.showData = true;
                this.content_tmp = this.render_params(response.data, this.data.params);
                this.log('render_params', response.data, this.data.params);
                this.content     = this.render_xml_mutators(this.content_tmp, this.data.xml_mutators);
                this.log('render_xml_mutators', this.content_tmp, this.data.xml_mutators);
              } else {
                this.content = response.data;
              }
            })
            // Если что-то пошло не так, генерируем HTML с ошибкой
            .catch((error) => {
              this.content_error = `<div style="color:#fff; background-color: #f00">Ошибка выполнения запроса: <br> ${error} <br> ${error.stack}</div>`;
            });
        } else {
          this.data = { params: null, xml_mutators: null };
          this.conf = null;
          this.content_tmp = '';
          this.content = '';
          this.content_error = '';
        }
      },

      render_params(template, data) {
        return mustache.render(template, data);
      },

      render_xml_mutators(template, data) {
        var handlers = this.get_mutation_handlers();
        this.log('render_xml_mutators - handlers', handlers);
        var plugin = this;

        var oParser = new DOMParser();
        var oDOM = oParser.parseFromString(template, 'application/xml');
        this.log(
          oDOM.documentElement.nodeName == 'parsererror'
            ? 'error while parsing'
            : oDOM.documentElement.nodeName, oDOM
        );

        this.log('render_xml_mutators', template, data);
        data.forEach( function(el, idx) {
          var xpath_result = oDOM.evaluate( el.xpath, oDOM.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
          plugin.log('xpath result', idx, el.id, el.xpath, xpath_result);
          var node = null;
          for (let i = 0; i < xpath_result.snapshotLength; i++) {
            node = xpath_result.snapshotItem(i);
            plugin.log('xpath result item', node);
            try {
              for (var key of Object.keys(handlers)) {
                try {
                  handlers[key](plugin, node, el.operation[key], el.params);
                } catch ( error ) {
                  plugin.log('handler error for handler', key, error, error.stack);
                }
              }
              plugin.log('xpath result item', node);
            } catch ( error ) {
              plugin.log('xpath_result error', i, error, error.stack);
            }
          }
        });

        var oSerializer = new XMLSerializer();
        var sXML = oSerializer.serializeToString(oDOM);
        return sXML;
      },

      get_mutation_handlers() {
        var default_handlers = {
          attrs : this.change_attrs,
          style : this.change_style
        };
        this.log('get_mutation_handlers - default_handlers - 1', default_handlers);

        const LOAD_HANDLERS = process.env.VUE_APP_DOCHUB_PLUGIN_DRAWIO_LOAD_CUSTOM_HANDLERS;
        if( !LOAD_HANDLERS || LOAD_HANDLERS.toLowerCase() != 'true' ) {
          return default_handlers;
        }

        // Можно переопределить стандартные реализации
        for (let key of Object.keys(this.conf)) {
          default_handlers[key] = this.compile_function(this.conf[key]);
        }
        this.log('get_mutation_handlers - default_handlers - 2', default_handlers);
        return default_handlers;
      },


      compile_function(body){
        var func = null;
        try {
          func = new Function('plugin', 'node', 'attrs', 'params', body);
        } catch(e) {
          this.log('Error compiling function', body, e);
          func = null;
        }
        return func;
      },

      // eslint-disable-next-line
      change_attrs(plugin, node, attrs, params) {
        plugin.log('change_attrs - start', node, attrs);
        for (let key of Object.keys(attrs)) {
          node.setAttribute(key, attrs[key]);
        }
        plugin.log('change_attrs - end', node);
      },

      change_style(plugin, node, style_conf, params) {
        plugin.log('change_style - start', node, style);
        // todo: check errors
        var style_node =  params.style_self ? node : node.getElementsByTagName('mxCell').item(0);
        var style = style_node.getAttribute('style');
        var style_obj = style.split(';')
          .reduce( function(res, el) {
            var items = el.split('=');
            if (items[0])
              res[items[0]] = items[1] ;
            return res;
          }, {} );

        for (let key of Object.keys(style_conf)) {
          style_obj[key] = style_conf[key];
        }

        plugin.log('change_style - style apply', style_obj);

        var style_res = [];
        for (let key of Object.keys(style_obj)) {
          style_res.push( '' + key + '=' + style_obj[key] );
        }
        var style_res2 = style_res.join(';');
        plugin.log('change_style - result', style_res, style_res2);
        style_node.setAttribute('style', style_res2);
      },

      listenEvents(evt) {

        if (evt.data.length > 0 && this.frame && evt.source == this.frame.contentWindow) {
          var msg = JSON.parse(evt.data);
          this.log('listenEvents - msg', msg);

          // Received if the editor is ready
          if (msg.event == 'init') {
            // Sends the data URI with embedded XML to editor
            var loadMsg = JSON.stringify( { action: 'load', xml: this.content});
            this.log('listenEvents - loadMsg', loadMsg);

            this.frame.contentWindow.postMessage(loadMsg, '*');
          }
          // Received if the user clicks exit or after export
          else if (msg.event == 'exit')
          {
            // Closes the editor
            // window.removeEventListener('message', receive);
            // source.drawIoWindow.close();
            // source.drawIoWindow = null;
          }
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

.drawio-image {
  padding: 12px;
  margin: 12px;
  border: solid 1px #ccc;
  width: 98%;
  height: 96%;
  min-height: 800px;
  min-width: 800px;
}</style>
