import { preparePluginMarkdown } from '@front/helpers/preparePluginMarkdown';

const dbmlBlock = '```dbml\nTable users {}\n```';
const svgBlock = '```svg\n<svg />\n```';
const codeBlock = '```javascript\nconst value = 1;\n```';

describe('preparePluginMarkdown', () => {
  test('Без metadata сохраняет блоки кода и не создаёт URL', () => {
    const markdown = `${dbmlBlock}\n${codeBlock}`;
    const createUrl = jest.fn();

    expect(preparePluginMarkdown(markdown, [], createUrl)).toBe(markdown);
    expect(createUrl).not.toHaveBeenCalled();
  });

  test('После появления типа преобразует его блок, сохраняя обычный код', () => {
    const markdown = `${dbmlBlock}\n${codeBlock}`;
    const createUrl = jest.fn().mockReturnValue('blob:dbml');

    expect(preparePluginMarkdown(markdown, ['dbml'], createUrl)).toBe(
      `![](@document/blob:dbml)\n${codeBlock}`
    );
    expect(createUrl).toHaveBeenCalledTimes(1);
    expect(createUrl).toHaveBeenCalledWith('Table users {}\n', 'dbml');
  });

  test('Новый тип добавляет вставку, не пересоздавая существующие', () => {
    const createUrl = jest.fn()
      .mockReturnValueOnce('blob:dbml')
      .mockReturnValueOnce('blob:svg');
    const first = preparePluginMarkdown(`${dbmlBlock}\n${svgBlock}`, ['dbml'], createUrl);

    expect(first).toBe(`![](@document/blob:dbml)\n${svgBlock}`);

    const updated = preparePluginMarkdown(first, ['svg'], createUrl);
    expect(updated).toBe('![](@document/blob:dbml)\n![](@document/blob:svg)');
    expect(createUrl).toHaveBeenCalledTimes(2);
    expect(createUrl).toHaveBeenLastCalledWith('<svg />\n', 'svg');

    expect(preparePluginMarkdown(updated, ['dbml', 'svg'], createUrl)).toBe(updated);
    expect(createUrl).toHaveBeenCalledTimes(2);
  });
});
