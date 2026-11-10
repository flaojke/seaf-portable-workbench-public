// Создание URL передаётся извне: компонент использует Blob, тесты — mock.
export const preparePluginMarkdown = (
  markdown: string,
  documentTypes: readonly string[],
  createDocumentUrl: (content: string, language: string) => string
): string => {
  return markdown.replace(
    /```(\w\w*)(\n|\r)([^`]*)```/gim,
    (segment, language, _lineBreak, content) => {
      // Неизвестные типы остаются кодом до появления metadata.
      if (!documentTypes.includes(language.toLowerCase())) {
        return segment;
      }

      const url = createDocumentUrl(content, language);
      return `![](@document/${url})`;
    }
  );
};
