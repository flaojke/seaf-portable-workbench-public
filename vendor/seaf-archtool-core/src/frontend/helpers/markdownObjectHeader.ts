// Шапка объекта в markdown (Т4.6):
//   ###### Продукт                          -> надпись над заголовком
//   # Название продукта
//   `example.products.p1`                   -> идентификатор объекта
// Средствами CSS не проверить, что в абзаце нет ничего, кроме кода, и что h6 стоит именно
// перед заголовком, поэтому такие элементы помечаются классами на уровне токенов markdown-it.

export const OBJECT_KIND_CLASS = 'md-object-kind';
export const OBJECT_ID_CLASS = 'md-object-id';

// Минимальный интерфейс токена markdown-it, достаточный для разметки
interface MarkdownToken {
  type: string;
  tag: string;
  content: string;
  children: MarkdownToken[] | null;
  attrJoin(name: string, value: string): void;
}

const TITLE_TAGS = ['h1', 'h2'];

const isTitleOpen = (token?: MarkdownToken): boolean =>
  token?.type === 'heading_open' && TITLE_TAGS.includes(token.tag);

const isTitleClose = (token?: MarkdownToken): boolean =>
  token?.type === 'heading_close' && TITLE_TAGS.includes(token.tag);

// Абзац состоит только из одного inline-кода (пробелы вокруг допускаются)
const isOnlyInlineCode = (inline?: MarkdownToken): boolean => {
  const children = inline?.children || [];
  const codes = children.filter((child) => child.type === 'code_inline');
  return codes.length === 1 && children.every((child) =>
    child.type === 'code_inline' || (child.type === 'text' && !child.content.trim())
  );
};

export const markObjectHeader = (tokens: MarkdownToken[]): void => {
  tokens.forEach((token, index) => {
    // h6, за которым сразу идет h1/h2: heading_open(h6), inline, heading_close(h6), heading_open(h1/h2)
    if (token.type === 'heading_open' && token.tag === 'h6' && isTitleOpen(tokens[index + 3])) {
      token.attrJoin('class', OBJECT_KIND_CLASS);
    }

    // Абзац сразу после h1/h2, состоящий только из inline-кода
    if (token.type === 'paragraph_open' && isTitleClose(tokens[index - 1]) && isOnlyInlineCode(tokens[index + 1])) {
      token.attrJoin('class', OBJECT_ID_CLASS);
    }
  });
};
