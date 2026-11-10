import MarkdownIt from 'markdown-it';

import {
  EMPTY_VALUE,
  EMPTY_FIELDS_CLASS,
  EMPTY_FIELDS_ONLY_CLASS,
  EMPTY_FIELDS_TITLE_CLASS,
  EMPTY_VALUE_CLASS,
  FORM_FIELD_CLASS,
  FORM_FIELD_VALUES_CLASS,
  formatFormFields
} from '@front/helpers/markdownFormFields';

const renderGrouped = (markdown: string): string => {
  const md = new MarkdownIt({ html: false });
  const Token = md.core.State.prototype.Token;
  const createToken = (type: string, tag: string, nesting: number) => new Token(type, tag, nesting) as never;
  const tokens = formatFormFields(md.parse(markdown, {}) as never, createToken);
  return md.renderer.render(tokens as never, md.options, {}).replace(/\n/g, '');
};

const label = (text: string): string => `\`\`\`markuper-form-label\n${text}\n\`\`\`\n`;
const field = (text: string): string => `\`\`\`markuper-form-field\n${text}\n\`\`\`\n`;
const emptyField = `<code class="${EMPTY_VALUE_CLASS} language-markuper-form-field">${EMPTY_VALUE}\n</code>`;

describe('formatFormFields: значения', () => {
  test('Заполненное значение не меняется', () => {
    const html = renderGrouped(label('Название') + field('Сайт'));

    expect(html).toContain('<code class="language-markuper-form-field">Сайт</code>');
    expect(html).not.toContain(EMPTY_VALUE_CLASS);
  });

  test('Пустой блок значения и подпись без значения — пустые поля, без прочерка', () => {
    const html = renderGrouped(label('Файл') + '```markuper-form-field\n\n```\n' + label('Риски') + label('Статус') + field('Да'));

    expect(html).not.toContain(EMPTY_VALUE_CLASS);
    expect(html.endsWith('</span> Файл; Риски</div>')).toBe(true);
  });

  test('Значение-ссылка [```значение```](url) считается заполненным', () => {
    const html = renderGrouped(label('Система') + '[```CRM```](/entities/systems/card?id=crm)\n\n' + label('Статус') + field('Да'));

    expect(html).not.toContain(EMPTY_FIELDS_CLASS);
  });

  test('Пустой блок значения вне поля выводится прочерком', () => {
    const html = renderGrouped('Текст\n\n```markuper-form-field\n\n```\n');

    expect(html).toContain(emptyField.replace(/\n/g, ''));
  });

  test('Обычные блоки кода не затрагиваются', () => {
    const html = renderGrouped('```yaml\n\n```\n');

    expect(html).not.toContain(EMPTY_VALUE);
  });
});

describe('formatFormFields: блоки полей', () => {
  const open = `<div class="${FORM_FIELD_CLASS}"><pre><code class="language-markuper-form-label">`;
  const values = `<div class="${FORM_FIELD_VALUES_CLASS}">`;

  test('Подпись и значение оборачиваются в блок поля, значение — в блок значений', () => {
    const html = renderGrouped(label('Класс') + field('Продуктовая фабрика'));

    expect(html).toBe(
      `${open}Класс</code></pre>${values}<pre><code class="language-markuper-form-field">Продуктовая фабрика</code></pre></div></div>`
    );
  });

  test('Несколько значений и значение-ссылка попадают в один блок значений', () => {
    const html = renderGrouped(label('Группы') + field('A') + '[```B```](/b)\n\n' + label('Статус') + field('Да'));

    expect(html.split(`class="${FORM_FIELD_CLASS}"`).length - 1).toBe(2);
    expect(html).toContain(`${values}<pre><code class="language-markuper-form-field">A</code></pre><p><a href="/b"><code>B</code></a></p></div>`);
  });

  test('Пустые поля убираются со своих мест, их подписи — в строке «Не заполнено» в конце блока', () => {
    const html = renderGrouped(label('ID родителя') + label('Класс') + field('X') + label('Комментарии,\nриски') + '```markuper-form-field\n\n```\n');

    expect(html.split(`class="${FORM_FIELD_CLASS}"`).length - 1).toBe(1);
    expect(html).not.toContain(EMPTY_VALUE_CLASS);
    expect(html.endsWith(
      `</div></div><div class="${EMPTY_FIELDS_CLASS}"><span class="${EMPTY_FIELDS_TITLE_CLASS}">Не заполнено:</span> ID родителя; Комментарии, риски</div>`
    )).toBe(true);
  });

  test('Все поля блока пустые — только строка «Не заполнено» без линии', () => {
    const html = renderGrouped(label('А') + label('Б'));

    expect(html).toBe(`<div class="${EMPTY_FIELDS_CLASS} ${EMPTY_FIELDS_ONLY_CLASS}"><span class="${EMPTY_FIELDS_TITLE_CLASS}">Не заполнено:</span> А; Б</div>`);
  });

  test('Блок из пустых полей после заголовка — строка без линии, у блока с заполненными полями — с линией', () => {
    const html = renderGrouped(label('В') + field('1') + label('Г') + '## Раздел\n\n' + label('А') + label('Б'));

    expect(html).toContain(`<div class="${EMPTY_FIELDS_CLASS}"><span class="${EMPTY_FIELDS_TITLE_CLASS}">Не заполнено:</span> Г</div><h2>Раздел</h2>`);
    expect(html.endsWith(`<div class="${EMPTY_FIELDS_CLASS} ${EMPTY_FIELDS_ONLY_CLASS}"><span class="${EMPTY_FIELDS_TITLE_CLASS}">Не заполнено:</span> А; Б</div>`)).toBe(true);
  });

  test('Заголовок между полями начинает новый блок со своей строкой «Не заполнено»', () => {
    const html = renderGrouped(label('А') + field('1') + label('Б') + '## Раздел\n\n' + label('В') + field('2') + label('Г'));

    expect(html.split(`class="${EMPTY_FIELDS_CLASS}"`).length - 1).toBe(2);
    expect(html).toContain('</span> Б</div><h2>Раздел</h2>');
    expect(html.endsWith('</span> Г</div>')).toBe(true);
  });

  test('Поле с одним из нескольких значений заполнено', () => {
    const html = renderGrouped(label('Группы') + '```markuper-form-field\n\n```\n' + field('A'));

    expect(html).not.toContain(EMPTY_FIELDS_CLASS);
    expect(html).toContain(EMPTY_VALUE_CLASS);
  });

  test('Несколько ссылок одним абзацем — значения поля друг под другом', () => {
    // Так шаблон выводит список ссылок циклом без пустой строки между ними
    const html = renderGrouped(label('Системы') + '[```CRM```](/a)\n[```ERP```](/b)\n\n' + label('Класс') + field('X'));

    expect(html).not.toContain(EMPTY_FIELDS_CLASS);
    expect(html.split(`class="${FORM_FIELD_CLASS}"`).length - 1).toBe(2);
    expect(html).toContain(`${values}<p><a href="/a"><code>CRM</code></a><br><a href="/b"><code>ERP</code></a></p></div>`);
  });

  test('Ссылка без кода и текст сразу после подписи — значения поля', () => {
    const html = renderGrouped(label('Группа') + '[Системы Маркетплейс](/g)\n\n' + label('Описание') + 'Система на микросервисах\n\n' + label('Класс'));

    expect(html.split(`class="${FORM_FIELD_CLASS}"`).length - 1).toBe(2);
    expect(html).toContain(`${values}<p><a href="/g">Системы Маркетплейс</a></p></div>`);
    expect(html).toContain(`${values}<p>Система на микросервисах</p></div>`);
    expect(html.endsWith('</span> Класс</div>')).toBe(true);
  });

  test('Ссылки после значения — тоже значения поля, текст после значения — вне поля', () => {
    const html = renderGrouped(label('Группы') + field('A') + '[```B```](/b)\n[```C```](/c)\n\n' + 'После');

    expect(html).toContain(
      '<code class="language-markuper-form-field">A</code></pre><p><a href="/b"><code>B</code></a><br><a href="/c"><code>C</code></a></p></div></div><p>После</p>'
    );
  });

  test('Подписи экранируются', () => {
    const html = renderGrouped(label('<b>Риски</b>'));

    expect(html).toContain('</span> &lt;b&gt;Риски&lt;/b&gt;</div>');
  });

  test('Текст вне полей не оборачивается', () => {
    const html = renderGrouped('# Заголовок\n\nАбзац\n\n' + label('Класс') + field('X') + '\nПосле');

    expect(html.startsWith('<h1>Заголовок</h1><p>Абзац</p>')).toBe(true);
    expect(html.endsWith('</div></div><p>После</p>')).toBe(true);
  });
});
