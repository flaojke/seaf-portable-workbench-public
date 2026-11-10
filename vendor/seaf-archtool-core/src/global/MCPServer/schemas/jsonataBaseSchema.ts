import { z } from 'zod';

export const jsonataBaseSchema = {
  name: 'jsonata',
  schema: {
    title: 'JSONata',
    description:
      'Выполняет переданное JSONata выражение на озере данных (манифесте) и возвращает результат в виде JSON.',
    inputSchema: {
      query: z.string().describe('JSONata - выражение/запрос (всегда оберуто в скобки). Примеры: ($), ($.entities)'),
      params: z
        .record(z.union([z.string(), z.number()]))
        .optional()
        .describe(
          'Значения доступные в JSONata-выражении как $params. Примеры: {}, {"id": "01234567", "name": "Ivan"}, {"company": "my_company"}.'
        ),
      origin: z
        .record(z.string())
        .optional()
        .describe(
          'Используются в качестве датасетов для JSONata-выражения, значением может быть как идентификатор существующего датасета, так и JSONata выражением. Примеры: {"company": "dataset_id", "manifest": "($)"}, {"id": "01234567"}.'
        )
    }
  },
  handler: null
};
