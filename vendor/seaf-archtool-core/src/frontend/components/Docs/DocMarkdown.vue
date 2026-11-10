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
      Rostislav Kabalin <kabalin2009@yandex.ru> - 2022
      R.Piontik <r.piontik@mail.ru> - 2024
      Vladislav Nefedov <clay.zenx@gmail.com>, Sber - 2024
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2025
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2025
      Artyom Prilip <artyom.prilip@gmail.com>, Sber - 2026
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <box
    class="space"
    v-bind:class="{ 'space--in-widget': widget?.isWidget, 'space--under-header': widget?.isWidget && widget.hasHeader }"
    v-bind:errors="errors"
    v-bind:path="path"
    v-on:doc-contextmenu="showContextMenu">
    <dochub-anchor id="" />
    <v-alert
      v-if="showDocument && !inline && pluginsMetadataError"
      class="dh-alert dh-alert--warning"
      icon="mdi-alert-outline">
      {{ pluginsMetadataError }}
      Встроенные документы плагинов могут отображаться как блоки кода.
    </v-alert>
    <final-markdown
      v-if="showDocument"
      v-bind:template="outHTML"
      v-bind:base-u-r-i="currentURL"
      v-on:go-markdown="onGoMarkdown" />
    <spinner v-else />
  </box>
</template>

<script>
  import MarkdownIt from 'markdown-it';
  import mustache from 'mustache';
  import Prism from 'prismjs';
  import { createVNode, render } from 'vue';

  import requests from '@front/helpers/requests';
  import href from '@front/helpers/href';
  import uri from '@front/helpers/uri';

  import { DocTypes } from '@front/components/Docs/enums/doc-types.enum';
  import DocMarkdownObject from './DocHubObject';
  import DocMixin from './DocMixin';
  import Spinner from '@front/components/Controls/Spinner.vue';
  import env from '@front/helpers/env';
  import { pluginManager } from '@front/plugins/plugin-manager';
  import sanitizeUrl from '@global/helpers/sanitizeUrl.mjs';
  import {extractFrontmatter} from '@global/manifest/tools/yamlHeader.mjs';
  import {pageEventRegDoc, waitNextDoc} from '@front/clickstream/pageEvent.ts';
  import consts from '@front/consts.js';
  import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
  import CopyButton from '@front/components/Buttons/CopyButton.vue';
  import { preparePluginMarkdown } from '@front/helpers/preparePluginMarkdown';
  import { markObjectHeader } from '@front/helpers/markdownObjectHeader';
  import { markMarkdownElements, MARKDOWN_ELEMENT_CLASS } from '@front/helpers/markdownElements';
  import { formatFormFields } from '@front/helpers/markdownFormFields';
  import { WIDGET_CONTEXT } from '@front/helpers/widgetContext';

  const logger = getLoggerWithTag('f/c/D/DocMarkdown');

  export default {
    name: 'DocMarkdown',
    components: {
      Spinner,
      finalMarkdown: {
        props: {
          template: { type: String, default: '' },
          baseURI: { type: String, default: '' }
        },
        emits: ['go-markdown'],
        computed: {
          compiledMarkdown() {
            const parent = this;
            return {
              name: 'FinalMarkdownContent',
              components: {
                'dochub-object': DocMarkdownObject
              },
              data() {
                return {
                  baseURI: parent.baseURI
                };
              },
              template: `<div class="markdown-document">${this.template}</div>`
            };
          }
        },
        methods: {
          goToMarkdown(event) {
            this.$emit('go-markdown', event);
            return false;
          },
          goToAnchor(event) {
            const id = event.target.attributes.href.value.slice(1);
            const element = document.getElementById(id);
            element?.scrollIntoView();
          },
          // Ищем ссылки на markdown документы для переходов по ним
          sniffMarkdownLinks(el) {
            const refs = el?.querySelectorAll && el.querySelectorAll('[href]') || [];
            for (let i = 0; i < refs.length; i++) {
              const refItem = refs[i];
              if (refItem.href.slice(-3) === '.md') {
                refItem.onclick = this.goToMarkdown;
              } else if (refItem?.attributes?.href?.value?.startsWith('#')) {
                refItem.onclick = this.goToAnchor;
              }
            }
          },
          createCopyButton(el) {
            const codeElements = el.getElementsByTagName('code');

            for (let i = 0; i < codeElements.length; i++) {
              const codeElement = codeElements[i];
              const preElement = codeElement.parentElement;

              if (preElement && preElement.tagName === 'PRE') {
                // не добавляем кнопку если:
                // - она уже есть, т.е. есть класс code-copy-button
                // - это markuper
                if (preElement.querySelector(
                  '.code-copy-button, .language-markuper-form-label, .language-markuper-form-field'
                )) continue;

                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'code-copy-button';

                const copyButtonVNode = createVNode(CopyButton, {
                  title: 'Копировать код',
                  getCopiedText: () => codeElement.textContent
                });
                copyButtonVNode.appContext = this.$.appContext;

                render(copyButtonVNode, buttonContainer);
                preElement.insertBefore(buttonContainer, codeElement);
              }
            }
          }
        },
        mounted() {
          href.elProcessing(this.$el);
          this.sniffMarkdownLinks(this.$el);
          this.createCopyButton(this.$el);
        },
        template: '<component v-bind:is="compiledMarkdown" />'
      }
    },
    mixins: [DocMixin],
    inject: {
      // Виджет сетки markaper, в котором лежит документ
      widget: { from: WIDGET_CONTEXT, default: null }
    },
    // Документы, встроенные в markdown, оформляются как самостоятельные документы
    provide() {
      return {
        [WIDGET_CONTEXT]: null
      };
    },
    props: {
      tocShow: {
        type: Boolean,
        default: true
      },
      inline: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        showDocument: false,
        toc: '',
        markdown: null,
        outHTML: null,
        redirectURL: null
      };
    },
    computed: {
      pluginsMetadataError() {
        return this.$store.state.plugins.metadataError;
      },
      // Определяет поддерживаются ли HTML тэги в markdown
      isHTMLSupport() {
        return (process.env.VUE_APP_DOCHUB_MARKDOWN_HTML || env.ideSettings?.env.DOCHUB_IDE_MARKDOWN_HTML || 'off').toLocaleLowerCase() === 'on';
      },
      // Возвращает URL документа с учетом истории переходов
      currentURL() {
        return this.redirectURL ? this.redirectURL : this.url;
      },
      // Доступные типы документов
      availableDocTypes() {
        const result = [];
        for (const key in DocTypes) result.push(DocTypes[key].toLowerCase());
        const extended = pluginManager.getAvailableDocumentTypes();
        extended.forEach((documentType) => {
          result.push(documentType.toLowerCase());
        });
        return result;
      }
    },
    watch: {
      availableDocTypes(types, previousTypes) {
        if (this.markdown === null) return;

        const newTypes = types.filter((type) => !previousTypes.includes(type));
        if (!newTypes.length) return;

        // Уже преобразованные вложения остаются ссылками. Обрабатываем только
        // блоки новых типов и перерисовываем документ, если они в нём есть.
        const markdown = this.prepareMarkdown(this.markdown, newTypes);
        if (markdown === this.markdown) return;

        this.markdown = markdown;
        this.rendered(this.renderMarkdownContent(markdown));
      }
    },
    methods: {
      // При загрузке документа преобразуем исходный текст с учётом уже известных типов.
      updateMarkdown(content) {
        this.markdown = this.prepareMarkdown(content);
        this.rendered(this.renderMarkdownContent(this.markdown));
      },
      createMarkdownRenderer() {
        const renderer = new MarkdownIt({
          html: this.isHTMLSupport,
          breaks: false,
          linkify: false,
          highlight: (content, language) => this.highlightCode(content, language)
        });

        const defaultFenceRenderer = renderer.renderer.rules.fence;
        renderer.renderer.rules.fence = (tokens, idx, options, env, slf) => {
          const token = tokens[idx];
          const language = (token.info || '').trim().split(/\s+/)[0];
          const rendered = defaultFenceRenderer(tokens, idx, options, env, slf);

          if (!language) return rendered.replace('<pre>', `<pre class="${MARKDOWN_ELEMENT_CLASS}">`);

          const languageClass = `${options.langPrefix}${renderer.utils.escapeHtml(language)}`;
          return rendered.replace('<pre>', `<pre class="${MARKDOWN_ELEMENT_CLASS} ${languageClass}">`);
        };

        return renderer;
      },
      highlightCode(content, language) {
        const normalizedLanguage = (language || '').trim().split(/\s+/)[0].toLowerCase();
        const prismLanguage = normalizedLanguage === 'yml' ? 'yaml' : normalizedLanguage;
        const grammar = Prism.languages[prismLanguage];

        if (!grammar) return '';

        return Prism.highlight(content, grammar, prismLanguage);
      },
      createSlug(text) {
        return text
          .toString()
          .trim()
          .toLowerCase()
          .replace(/[^\w\u0400-\u04FF\s-]/g, '')
          .replace(/\s+/g, '-');
      },

      renderMarkdownContent(content) {
        const renderer = this.createMarkdownRenderer();
        const Token = renderer.core.State.prototype.Token;
        const createToken = (type, tag, nesting) => new Token(type, tag, nesting);
        const tokens = formatFormFields(renderer.parse(content, {}), createToken);
        const tocItems = [];

        tokens.forEach((token, index) => {
          if (token.type !== 'heading_open') return;

          const nextToken = tokens[index + 1];
          const title = nextToken?.children?.length
            ? nextToken.children.map((child) => child.content).join('')
            : nextToken?.content || '';
          const level = Number(token.tag.slice(1));
          const id = this.createSlug(title);

          token.attrSet('id', id);
          tocItems.push({ id, level, title: renderer.utils.escapeHtml(title) });
        });

        markObjectHeader(tokens);
        markMarkdownElements(tokens);

        this.tocRendered(this.renderTOC(tocItems));
        return renderer.renderer.render(tokens, renderer.options, {});
      },
      renderTOC(items) {
        if (!items.length) return '';

        const result = [];
        const baseLevel = items[0].level;
        let currentLevel = baseLevel;
        let isFirstItem = true;

        result.push('<ul class="table-of-contents">');

        for (const item of items) {
          if (item.level > currentLevel) {
            while (currentLevel < item.level) {
              result.push('<ul>');
              currentLevel += 1;
            }
          }
          else if (item.level < currentLevel) {
            while (currentLevel > item.level) {
              result.push('</li></ul>');
              currentLevel -= 1;
            }
            result.push('</li>');
          }
          else if (!isFirstItem) {
            result.push('</li>');
          }

          result.push(
            `<li class="toc-level-${item.level}"><a href="#${item.id}">${item.title}</a>`
          );

          isFirstItem = false;
        }

        while (currentLevel > baseLevel) {
          result.push('</li></ul>');
          currentLevel -= 1;
        }

        result.push('</li></ul>');

        return result.join('');
      },
      onGoMarkdown(event) {
        const ref = event.target.attributes.href.nodeValue;
        const query = Object.assign({}, this.$route.query);
        query.redirect = uri.makeURIByBaseURI(ref, this.currentURL);
        logger.info(() => this.$route.query);
        this.$router.push({ query });
        return false;
      },
      rendered(outHtml) {
        let docCount = 0; // счетчик количества сработавших replace, нужен ниже
        // Парсим ссылки на объекты DocHub
        let result = outHtml.replace(/<img\s+([^>]*?)>/g, (segment, attrs) => {
          docCount++;
          return '<dochub-object :baseURI="baseURI" :inline="true" ' + attrs + '></dochub-object>';
        })
          .replace(/\{\{/g, '<span v-pre>{{</span>')
          .replace(/\}\}/g, '<span v-pre>}}</span>');
        // если replace сработал хоть 1 раз, значит будет подгрузка вложенных документов
        // и надо подождать их перед отправкой события загрузки страница
        if (docCount > 0) {
          waitNextDoc(consts.clickstream.MARKDOWN_WAIT_SUBDOC_RENDER_MS);
        }
        // Заменяем [[toc]] на содержимое TOC, если оно присутствует
        result = this.insertTOCIfNeeded(result);

        if (this.outHTML != result) {
          this.showDocument = false;
          this.outHTML = result;
          this.$nextTick(() => {
            this.showDocument = true;
            setTimeout(() => {
              this.loadState();

              if (!window.location.hash) return;

              const url = sanitizeUrl(window.location.href);
              const anchorId = decodeURIComponent(url.hash.slice(1));

              if (!anchorId) return;

              const anchorElement = document.getElementById(anchorId);
              anchorElement?.scrollIntoView();
            }, 50);
          });
        }
        return '';
      },
      insertTOCIfNeeded(result) {
        if (!this.toc) {
          return result;
        }

        const replaced = result.replace(/\[\[toc]]/, `<div class="toc">${this.toc}</div>`);
        // если замена произошла, значит пользователь добавить плейсхолдер [[toc]] и мы на это место добавили оглавление
        if (replaced !== result) {
          return replaced;
        }

        // Если пользователь не вставил [[toc]], добавим в начало
        return `<div class="toc">${this.toc}</div>\n\n` + result;
      },
      /**
       * callback для библиотеки markdown. Сюда приходит отрендеренный toc в виде html
       * @param tocHTML - html содержащий toc
       */
      tocRendered(tocHTML) {
        // если явно указано, что toc не нужен в документе или во вложении, тогда не сохраняем его
        if (this.profile?.toc === false || this.inline || !this.tocShow) {
          this.toc = null;
          return;
        }
        if (this.profile?.toc !== true) {
          // Считаем количество заголовков только если пользователь явно не указал, что toc нужен
          // т.е. если нет toc или он не равен true
          // т.к. это оглавление, и считать пункты li не получается (они вложенные их много), проще посчитать ссылки
          const listItemsCount = (tocHTML.match(/<a href\b[^>]*>/gi) || []).length;

          if (listItemsCount <= 3) {
            this.toc = null;
            return;
          }
        }
        this.toc = tocHTML;
      },
      prepareMarkdown(content, documentTypes = this.availableDocTypes) {
        return preparePluginMarkdown(
          content,
          documentTypes,
          (documentContent, language) => {
            return URL.createObjectURL(
              new Blob([documentContent], {
                type: `text/${language};charset=UTF-8`
              })
            );
          }
        );
      },
      refresh() {
        // Если есть параметр перенаправления, используем его
        this.redirectURL = this.$route.query?.redirect;

        // Обновляем документ
        this.markdown = null;

        if (!this.currentURL) return;

        this.outHTML = null;
        this.showDocument = false;
        this.toc = '';

        pageEventRegDoc();

        this.sourceRefresh().then(() => {
          requests.request(this.currentURL).then(({ data }) => {
            let content = null;
            this.error = null;

            if (!data)
              content = 'Здесь пусто :(';
            else if (this.isTemplate) {
              content = mustache.render(data, this.source.dataset);
            } else {
              content = data;
            }

            // Извлекаем документ отделяя от метаданных если они есть
            content = extractFrontmatter(content).content;
            this.updateMarkdown(content);
          }).catch((e) => {
            this.error = e;
          });
        });
      }
    }
  };
</script>

<!--todo: ERA-1329: создание toc работает в любом месте, но по какой-то причине вылетает ошибка
          vue-router.esm.js:2046 Uncaught (in promise) NavigationDuplicated: Avoided redundant navigation to current location: "/entities/docs/blank?dh-doc-id=seaf.no-toc".
          так же при скролле выбранный заголовок прячется за шапкой, надо править-->
<style>
.table-of-contents {
  list-style-type: circle;
  padding-left: 24px;
}

.table-of-contents ul {
  list-style-type: square;
}

.dochub-object {
  margin-top: 12px;
  margin-bottom: 24px;
}

.space {
  padding: 24px;
  position: relative;
  min-height: 60px;
}

/* Документ в виджете: текст на вертикали заголовка виджета */
.space.space--in-widget {
  padding: 20px var(--dh-widget-inset);
}

.space.space--under-header {
  padding-top: 4px;
}

/* Текст документа в виджете — размером значений полей и ячеек таблиц. Документы, встроенные
   в него, сохраняют размер самостоятельного документа */
.space--in-widget > .markdown-document {
  font-size: 0.875rem;
  line-height: 1.5;
}

.toc {
  margin-bottom: 24px;
}

.toc-anchor {
  display: none;
}

.toc a,
.markdown-document a.md-el {
  color: var(--dh-primary-strong);
}

.markdown-document a.md-el:hover {
  text-decoration: underline;
}

.markdown-document {
  color: var(--dh-text);
  font-size: 1rem;
  line-height: 1.6;
}

/* Заголовки */
.markdown-document h1.md-el,
.markdown-document h2.md-el,
.markdown-document h3.md-el,
.markdown-document h4.md-el,
.markdown-document h5.md-el {
  clear: both;
  color: var(--dh-text);
  line-height: 1.25;
  text-wrap: balance;
}

.markdown-document h1.md-el {
  font-size: 1.625rem;
  letter-spacing: -0.01em;
  margin-bottom: 16px;
}

.markdown-document h2.md-el {
  font-size: 1.25rem;
  margin-bottom: 12px;
}

.markdown-document h3.md-el,
.markdown-document h4.md-el,
.markdown-document h5.md-el {
  font-size: 1rem;
  margin-bottom: 8px;
}

.markdown-document h1.md-el:not(:first-child),
.markdown-document h2.md-el:not(:first-child) {
  margin-top: 32px;
}

.markdown-document h3.md-el:not(:first-child),
.markdown-document h4.md-el:not(:first-child),
.markdown-document h5.md-el:not(:first-child) {
  margin-top: 24px;
}

/*
  Шапка объекта (Т4.6). Классы расставляет markObjectHeader при рендере:
    ###### Продукт                      -> h6.md-object-kind — надпись над заголовком
    # Название продукта
    `example.products.p1`               -> p.md-object-id — идентификатор объекта
  Прочие h6 и inline-код в обычных абзацах не затрагиваются.
*/
.markdown-document h6.md-object-kind {
  font-size: 0.75rem;
  font-weight: 600 !important;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dh-primary);
  margin-bottom: 4px;
}

.markdown-document h6.md-object-kind + h1.md-el,
.markdown-document h6.md-object-kind + h2.md-el {
  margin-top: 0 !important;
  margin-bottom: 6px;
}

.markdown-document p.md-object-id > code {
  font-size: 0.75rem;
  color: var(--dh-text-secondary);
  background: var(--dh-surface-alt);
  border: 1px solid var(--dh-border);
  border-radius: 6px;
  padding: 2px 8px;
}

.markdown-document hr.md-el {
  border: none;
  border-top: 1px solid var(--dh-border);
  margin: 16px 0;
}

.markdown-document p.md-el,
.markdown-document ul.md-el,
.markdown-document ol.md-el {
  margin-bottom: 12px;
}

/* Inline-код */
.markdown-document code.md-el {
  font-family: var(--dh-font-mono);
  font-size: 0.875em;
  color: var(--dh-text);
  background: var(--dh-surface-alt);
  border-radius: 4px;
  padding: 1px 5px;
}

/* Блоки кода. Блоки markuper-form-* оформляет плагин markaper (plugins/markaper/styles/markdown.css) */
.markdown-document pre.md-el:not([class*="language-markuper"]) {
  display: block;
  margin: 0 0 16px;
  padding: 12px 14px;
  font-family: var(--dh-font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--dh-text);
  background: var(--dh-surface-alt);
  border: none;
  border-radius: var(--dh-radius);
  overflow: auto;
  white-space: pre-wrap;
  word-break: normal;
  overflow-wrap: anywhere;
  tab-size: 4;
  text-shadow: none;

  @media print {
    print-color-adjust: exact;
  }
}

.markdown-document pre.md-el:not([class*="language-markuper"]) code {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
  background: none;
  padding: 0;
  margin: 0;
  border-radius: 0;
  text-shadow: none;
  white-space: inherit;
}

.markdown-document pre.md-el code[class*="language-"] .token {
  background: none;
}

.markdown-document pre.md-el code[class*="language-"]::before,
.markdown-document pre.md-el code[class*="language-"]::after {
  content: none !important;
}

.markdown-document pre.md-el[class*="language-mustache"] .token.variable {
  color: var(--dh-code-variable);
}

/*noinspection CssUnusedSymbol*/
/* Кнопка копирования в углу блока кода: светлая подложка с рамкой, без тени */
.code-copy-button {
  float: right;
  margin: -4px -6px 4px 12px;
}

.code-copy-button .dh-copy-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--dh-border);
  border-radius: calc(var(--dh-radius) - 2px);
  background: var(--dh-surface);
}

.code-copy-button .dh-copy-btn:hover {
  border-color: var(--dh-border-strong);
}

/* Цитата — выноска */
.markdown-document blockquote.md-el {
  margin: 0 0 16px;
  padding: 10px 14px;
  color: var(--dh-text);
  background: var(--dh-primary-soft);
  border-left: 3px solid var(--dh-primary);
  border-radius: 0 var(--dh-radius) var(--dh-radius) 0;
}

.markdown-document blockquote.md-el > :last-child {
  margin-bottom: 0;
}

/* Таблицы */
.markdown-document table.md-el {
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--dh-border);
  border-radius: var(--dh-radius);
  overflow: hidden;
  margin-bottom: 16px;
  font-size: 0.875rem;
}

.markdown-document table.md-el thead th {
  background: var(--dh-surface-header);
  color: var(--dh-text-secondary) !important;
  font-weight: 600;
  text-align: left;
  height: auto;
  padding: 8px 12px;
  border-bottom: 1px solid var(--dh-border-strong);
  white-space: nowrap;
}

.markdown-document table.md-el thead th * {
  color: inherit !important;
}

.markdown-document table.md-el td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--dh-border);
  vertical-align: top;
}

.markdown-document table.md-el tbody tr:last-child td {
  border-bottom: none;
}

.markdown-document table.md-el tbody tr:hover td {
  background: var(--dh-surface-hover);
}
</style>
