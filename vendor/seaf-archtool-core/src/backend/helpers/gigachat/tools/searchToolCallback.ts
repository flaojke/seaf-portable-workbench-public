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
import { isRolesMode } from '@back/utils/roles.mjs';
import datasets from '@back/helpers/datasets.mjs';

function getManifest(request) {
  const storage = request?.storage;
  if (!storage) {
    throw new Error('Storage is not available for search tool');
  }
  if (isRolesMode()) {
    const roleId = request.userProfile?.roleId;
    return storage.manifests[roleId];
  }
  return storage.manifest;
}

export const searchToolCallback: SearchToolCallback = async(args, request) => {
  const storage = request?.storage;
  if (!storage) {
    throw new Error('Storage is not available for search tool');
  }

  const manifest = getManifest(request);
  if (!manifest) {
    throw new Error('Manifest is not available for search tool');
  }

  const roleId = isRolesMode() ? request?.userProfile?.roleId : undefined;
  const datasetDriver = datasets(storage, roleId);
  const provider = new SearchDataProvider(manifest, (datasetId) =>
    datasetDriver.releaseData(`/datasets/${datasetId}`)
  );
  const fullSchema = storage.schema ?? manifest;

  return executeSearchToolAction(args.action, args, {
    manifest,
    fullSchema,
    provider
  });
};
