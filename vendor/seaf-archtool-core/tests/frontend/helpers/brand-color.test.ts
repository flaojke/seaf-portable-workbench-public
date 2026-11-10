import { BRAND_PRIMARY_TOKEN, brandThemeColors, readCssToken } from '@front/helpers/brandColor';

const styleReader = (tokens: Record<string, string>) => () => ({
  getPropertyValue: (name: string): string => tokens[name] ?? ''
});

const root = {} as Element;

describe('brandColor', () => {
  test('readCssToken возвращает значение токена без пробелов', () => {
    const read = styleReader({ [BRAND_PRIMARY_TOKEN]: ' rgb(0, 117, 93) ' });

    expect(readCssToken(BRAND_PRIMARY_TOKEN, root, read)).toBe('rgb(0, 117, 93)');
  });

  test('readCssToken без токена, без DOM или без getComputedStyle возвращает undefined', () => {
    expect(readCssToken(BRAND_PRIMARY_TOKEN, root, styleReader({}))).toBeUndefined();
    expect(readCssToken(BRAND_PRIMARY_TOKEN, undefined, styleReader({}))).toBeUndefined();
    expect(readCssToken(BRAND_PRIMARY_TOKEN, root, undefined)).toBeUndefined();
  });

  test('brandThemeColors задает primary из токена', () => {
    expect(brandThemeColors('rgb(0, 117, 93)')).toEqual({ primary: 'rgb(0, 117, 93)' });
  });

  test('brandThemeColors без токена не переопределяет цвета темы', () => {
    expect(brandThemeColors(undefined)).toEqual({});
  });
});
