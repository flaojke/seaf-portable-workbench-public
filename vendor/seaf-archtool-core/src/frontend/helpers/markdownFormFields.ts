// Поля формы markaper: подпись и значения задаются блоками кода
//   ```markuper-form-label        ```markuper-form-field
//   Файл                          значение
//   ```                           ```
// Значение — блок markuper-form-field, абзац из ссылок, а сразу после подписи — любой абзац.
// formatFormFields собирает идущие подряд поля в блок. Заполненные поля выводятся подписью слева
// и значениями справа; пустое значение среди заполненных — прочерком. Поле без значений или
// только с пустыми значениями выводится подписью в строке «Не заполнено» в конце блока.

export const FORM_LABEL = 'markuper-form-label';
export const FORM_FIELD = 'markuper-form-field';
export const EMPTY_VALUE = '—';
export const EMPTY_VALUE_CLASS = 'md-empty-value';
// Поле формы: подпись и ее значения
export const FORM_FIELD_CLASS = 'md-form-field';
export const FORM_FIELD_VALUES_CLASS = 'md-form-field__values';
// Строка «Не заполнено» с подписями пустых полей блока
export const EMPTY_FIELDS_CLASS = 'md-form-empty';
// Строка «Не заполнено» блока, в котором нет заполненных полей: без линии над ней
export const EMPTY_FIELDS_ONLY_CLASS = 'md-form-empty--only';
export const EMPTY_FIELDS_TITLE_CLASS = 'md-form-empty__title';
export const EMPTY_FIELDS_TITLE = 'Не заполнено:';

// Минимальный интерфейс токена markdown-it, достаточный для разметки
interface MarkdownToken {
  type: string;
  info: string;
  content: string;
  block: boolean;
  children: MarkdownToken[] | null;
  attrJoin(name: string, value: string): void;
}

type TokenFactory = (type: string, tag: string, nesting: number) => MarkdownToken;

const isFence = (token: MarkdownToken | undefined, info: string): boolean =>
  token?.type === 'fence' && token.info.trim().split(/\s+/)[0] === info;

// Абзац — три токена paragraph_open, inline, paragraph_close
const isParagraph = (tokens: MarkdownToken[], index: number): boolean =>
  tokens[index]?.type === 'paragraph_open' && tokens[index + 2]?.type === 'paragraph_close';

// Абзац из ссылок [```значение```](url) или [значение](url), разделенных переводами строк и пробелами:
// так шаблоны выводят список ссылок одного поля
const isLinksParagraph = (tokens: MarkdownToken[], index: number): boolean => {
  if (!isParagraph(tokens, index)) return false;
  let depth = 0;
  let links = 0;
  for (const child of tokens[index + 1].children || []) {
    if (child.type === 'link_open') {
      depth++;
      links++;
    } else if (child.type === 'link_close') {
      depth--;
    } else if (!depth && child.type !== 'softbreak' && !(child.type === 'text' && !child.content.trim())) {
      return false;
    }
  }
  return links > 0;
};

// Число токенов значения поля, которое начинается с tokens[index]; 0 — там не значение.
// Значение — блок markuper-form-field, абзац из ссылок, а сразу после подписи — любой абзац
const valueLength = (tokens: MarkdownToken[], index: number, afterLabel: boolean): number => {
  if (isFence(tokens[index], FORM_FIELD)) return 1;
  return isLinksParagraph(tokens, index) || (afterLabel && isParagraph(tokens, index)) ? 3 : 0;
};

// Пустое значение — блок markuper-form-field без текста
const isEmptyValue = (value: MarkdownToken[]): boolean => isFence(value[0], FORM_FIELD) && !value[0].content.trim();

const markEmpty = (token: MarkdownToken): void => {
  token.content = `${EMPTY_VALUE}\n`;
  token.attrJoin('class', EMPTY_VALUE_CLASS);
};

interface FormField {
  label: MarkdownToken;
  // Значения: токены каждого значения
  values: MarkdownToken[][];
}

const isEmptyField = (field: FormField): boolean => field.values.every(isEmptyValue);

const labelText = (field: FormField): string => field.label.content.trim().replace(/\s+/g, ' ');

const elementToken = (
  createToken: TokenFactory, type: string, tag: string, nesting: number, className?: string, block = true
): MarkdownToken => {
  const token = createToken(type, tag, nesting);
  token.block = block;
  if (className) token.attrJoin('class', className);
  return token;
};

const textToken = (createToken: TokenFactory, content: string): MarkdownToken => {
  const token = createToken('text', '', 0);
  token.content = content;
  return token;
};

// Ссылки абзаца-значения выводятся друг под другом
const breakLinks = (paragraph: MarkdownToken[]): void => {
  paragraph[1].children?.forEach((child) => {
    if (child.type === 'softbreak') child.type = 'hardbreak';
  });
};

// Заполненное поле: подпись и значения в блоке поля, значения — в общем блоке; пустое значение
// среди заполненных выводится прочерком
const renderField = (field: FormField, createToken: TokenFactory): MarkdownToken[] => {
  field.values.filter(isEmptyValue).forEach((value) => markEmpty(value[0]));
  return [
    elementToken(createToken, 'form_field_open', 'div', 1, FORM_FIELD_CLASS),
    field.label,
    elementToken(createToken, 'form_field_values_open', 'div', 1, FORM_FIELD_VALUES_CLASS),
    ...field.values.flat(),
    elementToken(createToken, 'form_field_values_close', 'div', -1),
    elementToken(createToken, 'form_field_close', 'div', -1)
  ];
};

// Строка «Не заполнено: подпись; подпись»: подписи сами могут содержать запятые
const renderEmptyFields = (fields: FormField[], only: boolean, createToken: TokenFactory): MarkdownToken[] => {
  const line = elementToken(createToken, 'inline', '', 0, undefined, false);
  line.children = [
    elementToken(createToken, 'form_empty_title_open', 'span', 1, EMPTY_FIELDS_TITLE_CLASS, false),
    textToken(createToken, EMPTY_FIELDS_TITLE),
    elementToken(createToken, 'form_empty_title_close', 'span', -1, undefined, false),
    textToken(createToken, ` ${fields.map(labelText).join('; ')}`)
  ];
  return [
    elementToken(createToken, 'form_empty_open', 'div', 1, only ? `${EMPTY_FIELDS_CLASS} ${EMPTY_FIELDS_ONLY_CLASS}` : EMPTY_FIELDS_CLASS),
    line,
    elementToken(createToken, 'form_empty_close', 'div', -1)
  ];
};

// Поля формы, идущие подряд, образуют блок. Заполненные поля выводятся подписью слева и
// значениями справа; подписи пустых полей собираются в строку «Не заполнено» в конце блока.
// Пустой блок markuper-form-field вне поля выводится прочерком
export const formatFormFields = (tokens: MarkdownToken[], createToken: TokenFactory): MarkdownToken[] => {
  const result: MarkdownToken[] = [];
  let block: FormField[] = [];
  let index = 0;

  const flushBlock = (): void => {
    if (!block.length) return;
    const filled = block.filter((field) => !isEmptyField(field));
    filled.forEach((field) => result.push(...renderField(field, createToken)));
    const empty = block.filter(isEmptyField);
    if (empty.length) result.push(...renderEmptyFields(empty, !filled.length, createToken));
    block = [];
  };

  while (index < tokens.length) {
    const token = tokens[index];
    if (!isFence(token, FORM_LABEL)) {
      flushBlock();
      if (isEmptyValue([token])) markEmpty(token);
      result.push(token);
      index++;
      continue;
    }

    const field: FormField = { label: token, values: [] };
    index++;
    for (let length = valueLength(tokens, index, true); length; length = valueLength(tokens, index, false)) {
      const value = tokens.slice(index, index + length);
      if (isLinksParagraph(tokens, index)) breakLinks(value);
      field.values.push(value);
      index += length;
    }
    block.push(field);
  }
  flushBlock();

  return result;
};
