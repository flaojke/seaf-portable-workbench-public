/*
  Copyright (C) 2026 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber

  Contributors:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2026
*/

import { SearchToolCallback } from '@global/gigachat/tools/SearchTool/SearchTool';
import { executeSearchToolAction } from '@global/search/search-tool-run.mjs';
import { SearchDataProvider } from '@global/search/search-data.mjs';
import datasets from '@front/helpers/datasets';
import parser from '@global/manifest/parser3/index.mjs';

export const searchToolCallback: SearchToolCallback = async(args) => {
  const manifest = parser.manifest;
  if (!manifest) {
    throw new Error('Manifest is not available for search tool');
  }

  const fullSchema = manifest.schema ?? manifest;
  const provider = new SearchDataProvider(manifest, (datasetId) =>
    datasets().releaseData(`/datasets/${datasetId}`)
  );

  return executeSearchToolAction(args.action, args, {
    manifest,
    fullSchema,
    provider
  });
};
