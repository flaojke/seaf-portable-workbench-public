/*
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
*/

import DOMPurify from 'dompurify';
import MarkdownIt from 'markdown-it';

const purifier = typeof window !== 'undefined' && typeof DOMPurify === 'function'
  ? DOMPurify(window)
  : DOMPurify;

export const INLINE_MARKDOWN_EMBED_ATTRIBUTE = 'data-inline-markdown-embed';

const EMBED_LANGUAGES = new Set(['mermaid', 'plantuml']);

export type MarkdownEmbed = {
  id: string;
  type: 'image' | 'mermaid' | 'plantuml';
  src?: string;
  alt?: string;
  source?: string;
};

type RenderEnvironment = { embeds: MarkdownEmbed[] };

const renderer = new MarkdownIt({
  html: false,
  breaks: false,
  linkify: false
});

renderer.renderer.rules.table_open = (tokens, idx, options, env, slf) =>
  `<div class="inline-markdown-table-container">${slf.renderToken(tokens, idx, options)}`;
renderer.renderer.rules.table_close = (tokens, idx, options, env, slf) =>
  `${slf.renderToken(tokens, idx, options)}</div>\n`;

function createEmbed(env: RenderEnvironment, descriptor: Omit<MarkdownEmbed, 'id'>) {
  const id = `inline-markdown-embed-${env.embeds.length}`;
  env.embeds.push({id, ...descriptor});
  return id;
}

renderer.renderer.rules.image = (tokens, idx, options, env, slf) => {
  const token = tokens[idx];
  const id = createEmbed(env, {
    type: 'image',
    src: token.attrGet('src') || '',
    alt: slf.renderInlineAsText(token.children || [], options, env)
  });

  return `<span ${INLINE_MARKDOWN_EMBED_ATTRIBUTE}="${id}"></span>`;
};

const defaultFenceRenderer = renderer.renderer.rules.fence;
renderer.renderer.rules.fence = (tokens, idx, options, env, slf) => {
  const token = tokens[idx];
  const language = (token.info || '').trim().split(/\s+/)[0].toLowerCase();

  if (!EMBED_LANGUAGES.has(language)) {
    return defaultFenceRenderer(tokens, idx, options, env, slf);
  }

  const id = createEmbed(env, {
    type: language,
    source: token.content
  });

  return `<div ${INLINE_MARKDOWN_EMBED_ATTRIBUTE}="${id}"></div>\n`;
};

/**
 * Renders Markdown that can be displayed inside an editable-table cell.
 * Images and supported diagram fences are returned as descriptors and are
 * represented in HTML by elements carrying INLINE_MARKDOWN_EMBED_ATTRIBUTE.
 *
 * @param {*} value Markdown source.
 * @returns {{html: string, embeds: Array<object>}}
 */
export function renderInlineMarkdown(value: unknown): { html: string; embeds: MarkdownEmbed[] } {
  const source = value == null ? '' : String(value);
  const env = {embeds: []};
  const rendered = renderer.render(source, env);
  const sanitized = purifier.sanitize(rendered);

  return {
    html: sanitized,
    embeds: env.embeds
  };
}
