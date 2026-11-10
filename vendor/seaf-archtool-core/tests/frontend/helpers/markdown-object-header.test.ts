import MarkdownIt from 'markdown-it';

import { markObjectHeader, OBJECT_ID_CLASS, OBJECT_KIND_CLASS } from '@front/helpers/markdownObjectHeader';

const render = (markdown: string): string => {
  const md = new MarkdownIt({ html: false });
  const tokens = md.parse(markdown, {});
  markObjectHeader(tokens as never);
  return md.renderer.render(tokens, md.options, {});
};

describe('markObjectHeader', () => {
  test('Шапка объекта: надпись, заголовок и идентификатор получают классы', () => {
    const html = render('###### Продукт\n# Название продукта\n`example.products.p1`\n');

    expect(html).toContain(`<h6 class="${OBJECT_KIND_CLASS}">Продукт</h6>`);
    expect(html).toContain(`<p class="${OBJECT_ID_CLASS}"><code>example.products.p1</code></p>`);
  });

  test('Идентификатор после h2 без надписи тоже распознается', () => {
    expect(render('## Система\n\n `crm` \n')).toContain(`<p class="${OBJECT_ID_CLASS}">`);
  });

  test('Inline-код внутри обычного предложения после заголовка не становится идентификатором', () => {
    // Абзац из руководства по редактируемым таблицам
    const html = render('# Знакомство\n\nУказание типа документа, где `editable-table` является идентификатором плагина.\n');

    expect(html).not.toContain(OBJECT_ID_CLASS);
    expect(html).toContain('<p>Указание типа документа, где <code>editable-table</code>');
  });

  test('Абзац из нескольких фрагментов кода или кода со ссылкой не распознается', () => {
    expect(render('# Заголовок\n`a` `b`\n')).not.toContain(OBJECT_ID_CLASS);
    expect(render('# Заголовок\n`a` [ссылка](http://example.com)\n')).not.toContain(OBJECT_ID_CLASS);
  });

  test('Код после заголовков h3 и ниже, а также не сразу после заголовка не распознается', () => {
    expect(render('### Раздел\n`id`\n')).not.toContain(OBJECT_ID_CLASS);
    expect(render('# Заголовок\n\nТекст\n\n`id`\n')).not.toContain(OBJECT_ID_CLASS);
  });

  test('h6 без следующего h1/h2 остается обычным заголовком', () => {
    expect(render('###### Примечание\n\nТекст\n')).not.toContain(OBJECT_KIND_CLASS);
    expect(render('###### Примечание\n### Раздел\n')).not.toContain(OBJECT_KIND_CLASS);
  });
});
