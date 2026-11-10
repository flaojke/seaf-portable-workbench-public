// Элементы, созданные markdown-it, помечаются классом, чтобы стили документа не действовали
// на содержимое встроенных документов (![](@document/...)): таблиц Vuetify, swagger и т.п.
// Вложенный документ markdown помечает свои элементы сам. Т4.7.

export const MARKDOWN_ELEMENT_CLASS = 'md-el';

// Минимальный интерфейс токена markdown-it, достаточный для разметки
interface MarkdownToken {
  type: string;
  children: MarkdownToken[] | null;
  attrJoin(name: string, value: string): void;
}

// Блочные токены, атрибуты которых выводятся на сам элемент.
// fence (блок кода с языком) сюда не входит: его атрибуты markdown-it выводит на <code>,
// класс для <pre> добавляет рендерер fence в DocMarkdown.
const BLOCK_TOKENS = [
  'heading_open',
  'paragraph_open',
  'bullet_list_open',
  'ordered_list_open',
  'blockquote_open',
  'table_open',
  'hr',
  'code_block'
];

const INLINE_TOKENS = ['link_open', 'code_inline'];

export const markMarkdownElements = (tokens: MarkdownToken[]): void => {
  tokens.forEach((token) => {
    if (BLOCK_TOKENS.includes(token.type)) token.attrJoin('class', MARKDOWN_ELEMENT_CLASS);

    (token.children || []).forEach((child) => {
      if (INLINE_TOKENS.includes(child.type)) child.attrJoin('class', MARKDOWN_ELEMENT_CLASS);
    });
  });
};
