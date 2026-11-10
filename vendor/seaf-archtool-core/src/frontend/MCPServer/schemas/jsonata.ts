import { jsonataToolCallback } from '@front/helpers/gigachat/tools/jsonataToolCallback';
import { jsonataBaseSchema } from '@global/MCPServer/schemas/jsonataBaseSchema';

export const jsonata = {
  ...jsonataBaseSchema,
  handler: async({
    query,
    params = {},
    origin
  }: {
    query: string;
    params?: Record<string, string | number>;
    origin?: Record<string, string>;
  }) => {

    let normalizedQuery = query.trim();
    const isWrapped =
      normalizedQuery.startsWith('(') && normalizedQuery.endsWith(')');
    if (!isWrapped) {
      normalizedQuery = `(${normalizedQuery})`;
    }

    const result = await jsonataToolCallback(normalizedQuery, params, origin);

    return {
      content: [
        {
          type: 'text',
          text:
            typeof result === 'string' ? result : JSON.stringify(result ?? null)
        }
      ]
    };
  }
};
