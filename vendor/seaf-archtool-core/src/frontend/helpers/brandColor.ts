// Фирменный цвет задается один раз — CSS-токеном --color-brand-primary (src/assets/styles/base.css).
// Тема Vuetify не хранит свою копию, а читает значение токена при запуске: стили подключаются
// в index.js раньше создания Vuetify. Vuetify разбирает цвета вида rgb(...) и #rrggbb.

export const BRAND_PRIMARY_TOKEN = '--color-brand-primary';

type StyleReader = (element: Element) => Pick<CSSStyleDeclaration, 'getPropertyValue'>;

const documentRoot = (): Element | undefined =>
  typeof document !== 'undefined' ? document.documentElement : undefined;

const computedStyleReader = (): StyleReader | undefined =>
  typeof window !== 'undefined' ? (element) => window.getComputedStyle(element) : undefined;

// Значение CSS-токена или undefined, если токен не задан (стили не загружены, нет DOM)
export const readCssToken = (
  name: string,
  root: Element | undefined = documentRoot(),
  readStyle: StyleReader | undefined = computedStyleReader()
): string | undefined => {
  if (!root || !readStyle) return undefined;
  const value = readStyle(root).getPropertyValue(name).trim();
  return value || undefined;
};

// Цвета темы Vuetify из CSS-токенов; без токена цвет не переопределяется
export const brandThemeColors = (primary: string | undefined = readCssToken(BRAND_PRIMARY_TOKEN)): Record<string, string> =>
  primary ? { primary } : {};
