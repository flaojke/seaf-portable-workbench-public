/** @jest-environment jsdom */

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
*/

jest.mock('markdown-it', () => {
  const ActualMarkdownIt = jest.requireActual('markdown-it');
  return jest.fn((...args) => new ActualMarkdownIt(...args));
});

import MarkdownIt from 'markdown-it';
import {
  INLINE_MARKDOWN_EMBED_ATTRIBUTE,
  renderInlineMarkdown
} from '@front/helpers/inlineMarkdown';

describe('renderInlineMarkdown', () => {
  it('wraps rendered Markdown tables so editable cells can scroll them independently', () => {
    const {html} = renderInlineMarkdown('| Name | Value |\n| --- | --- |\n| A | B |');

    expect(html).toContain('<div class="inline-markdown-table-container"><table>');
    expect(html.split('</table>')[1]).toContain('</div>');
  });

  it('reuses one MarkdownIt instance across cell renders', () => {
    renderInlineMarkdown('First cell');
    renderInlineMarkdown('Second cell');

    expect(MarkdownIt).toHaveBeenCalledTimes(1);
  });

  it('renders ordinary Markdown and pipe tables', () => {
    const {html, embeds} = renderInlineMarkdown([
      '**Result**',
      '',
      '| Check | State |',
      '| --- | --- |',
      '| TLS | passed |'
    ].join('\n'));

    expect(html).toContain('<strong>Result</strong>');
    expect(html).toContain('<table>');
    expect(html).toContain('<td>TLS</td>');
    expect(embeds).toEqual([]);
  });

  it('turns Markdown images into safe placeholders and descriptors', () => {
    const {html, embeds} = renderInlineMarkdown('Before ![System *diagram*](images/system.png) after');

    expect(embeds).toEqual([{
      id: 'inline-markdown-embed-0',
      type: 'image',
      src: 'images/system.png',
      alt: 'System diagram'
    }]);
    expect(html).toContain(`<span ${INLINE_MARKDOWN_EMBED_ATTRIBUTE}="inline-markdown-embed-0"></span>`);
    expect(html).not.toContain('<img');
  });

  it.each([
    ['MeRmAiD', 'mermaid'],
    ['PLANTUML', 'plantuml']
  ])('turns a %s fence into a descriptor with its exact source', (language, type) => {
    const source = 'first line\nsecond {{value}} line\n';
    const {html, embeds} = renderInlineMarkdown(`\`\`\`${language}\n${source}\`\`\``);

    expect(embeds).toEqual([{
      id: 'inline-markdown-embed-0',
      type,
      source
    }]);
    expect(html).toContain(`<div ${INLINE_MARKDOWN_EMBED_ATTRIBUTE}="inline-markdown-embed-0"></div>`);
  });

  it('keeps unknown fences as escaped code', () => {
    const {html, embeds} = renderInlineMarkdown('```javascript\nalert("test")\n```');

    expect(embeds).toEqual([]);
    expect(html).toContain('<pre><code class="language-javascript">');
    expect(html).toContain('alert("test")');
  });

  it('sanitizes HTML and unsafe URLs while keeping moustaches as text', () => {
    const {html, embeds} = renderInlineMarkdown([
      '<img src=x onerror=alert(1)>',
      '',
      '[unsafe](javascript:alert(1))',
      '',
      '{{ constructor.constructor("alert(1)")() }}',
      '',
      '![unsafe](javascript:alert(1))'
    ].join('\n'));

    document.body.innerHTML = html;

    expect(embeds).toEqual([]);
    expect(document.body.querySelector('img')).toBeNull();
    expect(document.body.querySelector('[onerror]')).toBeNull();
    expect(document.body.querySelector('[href^="javascript:"]')).toBeNull();
    expect(html).toContain('{{ constructor.constructor("alert(1)")() }}');
  });

  it('does not create Blob URLs', () => {
    const createObjectURL = jest.fn();
    const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL
    });

    renderInlineMarkdown('```mermaid\ngraph LR\n```');

    expect(createObjectURL).not.toHaveBeenCalled();

    if (originalCreateObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL);
    } else {
      delete URL.createObjectURL;
    }
  });

  it('isolates embed descriptors between sequential renders', () => {
    const first = renderInlineMarkdown('![First](first.png)');
    const second = renderInlineMarkdown('```mermaid\ngraph LR\n```');

    expect(first.embeds).toEqual([{
      id: 'inline-markdown-embed-0',
      type: 'image',
      src: 'first.png',
      alt: 'First'
    }]);
    expect(second.embeds).toEqual([{
      id: 'inline-markdown-embed-0',
      type: 'mermaid',
      source: 'graph LR\n'
    }]);
  });

  it('renders null as empty content', () => {
    expect(renderInlineMarkdown(null)).toEqual({html: '', embeds: []});
  });
});
