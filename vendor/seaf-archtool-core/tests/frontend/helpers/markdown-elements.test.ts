import MarkdownIt from 'markdown-it';

import { markMarkdownElements, MARKDOWN_ELEMENT_CLASS } from '@front/helpers/markdownElements';

const render = (markdown: string): string => {
  const md = new MarkdownIt({ html: false });
  const tokens = md.parse(markdown, {});
  markMarkdownElements(tokens as never);
  return md.renderer.render(tokens, md.options, {});
};

const cls = `class="${MARKDOWN_ELEMENT_CLASS}"`;

describe('markMarkdownElements', () => {
  test('Блочные элементы markdown получают класс', () => {
    const html = render([
      '# Заголовок',
      '',
      'Абзац',
      '',
      '- пункт',
      '',
      '1. пункт',
      '',
      '> цитата',
      '',
      '---',
      '',
      '| a | b |',
      '|---|---|',
      '| 1 | 2 |',
      '',
      '    код с отступом'
    ].join('\n'));

    expect(html).toContain(`<h1 ${cls}>`);
    expect(html).toContain(`<p ${cls}>Абзац</p>`);
    expect(html).toContain(`<ul ${cls}>`);
    expect(html).toContain(`<ol ${cls}>`);
    expect(html).toContain(`<blockquote ${cls}>`);
    expect(html).toContain(`<hr ${cls}>`);
    expect(html).toContain(`<table ${cls}>`);
    expect(html).toContain(`<pre ${cls}><code>`);
  });

  test('Ссылки и inline-код получают класс, в том числе внутри таблиц и списков', () => {
    const html = render('- [ссылка](http://example.com) и `код`\n\n| `x` |\n|---|\n| [y](http://example.com) |\n');

    expect(html).toContain(`<a href="http://example.com" ${cls}>ссылка</a>`);
    expect(html).toContain(`<code ${cls}>код</code>`);
    expect(html).toContain(`<code ${cls}>x</code>`);
    expect(html).toContain(`<a href="http://example.com" ${cls}>y</a>`);
  });

  test('Вставка документа остается изображением без класса: стили не переходят на его содержимое', () => {
    const html = render('![](@document/archtool.table.preset)\n');

    expect(html).toContain('<img src="@document/archtool.table.preset" alt="">');
  });
});
