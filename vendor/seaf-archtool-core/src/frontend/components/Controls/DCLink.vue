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
      R.Piontik <r.piontik@mail.ru> - 2022
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <span v-if="isUnsafe">
    <slot />
  </span>

  <span v-else-if="isVsCodeLink" v-bind:class="$style.link" v-on:click="onClickVsCodeLink">
    <slot />
  </span>

  <a v-else v-bind:href="href" v-bind:target="linkTarget" v-bind:rel="linkRel" v-on:click="onClick">
    <slot />
  </a>
</template>

<script>

  import env from '@front/helpers/env';
  import { isUnsafeHref } from '@front/helpers/linkHref';

  export default {
    name: 'DCLink',
    props: {
      href: { type: String, default: '' },
      target: { type: String, default: '' },
      rel: { type: String, default: '' }
    },
    data() {
      return {};
    },
    computed: {
      // javascript:, data:, vbscript: и неразбираемые адреса выводятся текстом
      isUnsafe() {
        return isUnsafeHref(this.href, window.location.href);
      },
      isVsCodeLink() {
        return this.href.includes('https://file+.vscode-resource.vscode-cdn.net');
      },
      isInternalLink() {
        // return (this.href || '').split(':/').length === 1;
        try {
          const url = new URL(this.href, window.location.href);
          return url.origin === window.location.origin;
        } catch {
          return false;
        }
      },
      openInNewTab() {
        return !env.isPlugin() && this.target === '_blank';
      },
      linkTarget() {
        if (env.isPlugin() && this.isInternalLink) {
          return undefined;
        }
        if (this.openInNewTab) {
          return '_blank';
        }
        if (!this.isInternalLink) {
          return '_blank';
        }
        return undefined;
      },
      linkRel() {
        if (!this.linkTarget || this.isInternalLink) {
          return this.rel || undefined;
        }
        return this.rel || 'noopener noreferrer';
      }
    },
    methods: {
      onClickVsCodeLink() {
        window.$PAPI.goto(this.href);
      },
      onClick(event) {
        const struct = (this.href || '').split(':/');
        if (struct[0] === 'plugin') {
          const url = new URL(this.href);
          window.$PAPI.goto(`plugin:${url.pathname}`, url.searchParams.get('entity'), url.searchParams.get('id'));
          event.preventDefault();
          return false;
        } else if (this.isInternalLink) {
          event.preventDefault();
          if (this.openInNewTab) {
            const { href } = this.$router.resolve(this.href);
            const windowFeatures = this.isInternalLink ? undefined : 'noopener,noreferrer';
            window.open(href, '_blank', windowFeatures);
          } else {
            this.$router.push(this.href);
          }
          return false;
        }
        return true;
      }
    }
  };
</script>

<style module>
  /* Ссылка на файл в плагине VS Code — цвет ссылок палитры, как у обычных ссылок */
  .link {
    cursor: pointer;
    color: var(--dh-primary-strong);
  }

  .link:hover {
    text-decoration: underline;
  }
</style>
