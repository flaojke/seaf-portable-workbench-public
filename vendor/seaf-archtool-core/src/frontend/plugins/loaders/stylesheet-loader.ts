export const loadStylesheet = (
  url: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const stylesheet = document.createElement('link');

    stylesheet.rel = 'stylesheet';
    stylesheet.href = url;

    stylesheet.onload = () => {
      resolve();
    };

    stylesheet.onerror = () => {
      stylesheet.remove();

      reject(
        new Error(`Не удалось загрузить стили плагина [${url}]`)
      );
    };

    document.head.appendChild(stylesheet);
  });
};
