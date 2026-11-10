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
      Alexander Romashin, Sber

  Contributors:
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2026
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

import { extractUserData }        from '@back/helpers/account.mjs';
import { commitToRepository, ALLOW_PROTOCOLS_TO_COMMIT }   from '@back/helpers/gitcommit/commitToRepository.mjs';
import {
  createCommitData,
  createLayerUpdateDataByParser,
  resolveWritableStorage,
  restoreParser,
  updateManifestInfo,
  validateAndFormatContent
}                                 from '@back/helpers/putContent';
import { PutContentToolCallback } from '@global/gigachat/tools/PutContentTool/PutContentTool';
import { getLoggerWithTag }       from '@global/logger/v2/logger.mjs';

const logger = getLoggerWithTag('putContentTool');

import md5 from 'md5';

export const putContentToolCallback: PutContentToolCallback = async(
  path,
  content,
  profile,
  isCluster,
  request
) => {
  const [protocol] = process.env.VUE_APP_DOCHUB_ROOT_MANIFEST?.split(':') ?? [];
  if (!ALLOW_PROTOCOLS_TO_COMMIT.includes(protocol)) {
    throw new Error(`Сохранение доступно только с использованием ${ALLOW_PROTOCOLS_TO_COMMIT}`);
  }

  // в кластере с common request.storage - смёрженное представление для чтения; писать можно только
  // в storage конкретной роли (см. resolveWritableStorage)
  const storage = resolveWritableStorage(request.storage);
  const data = { [path]: content };
  const hash = md5(profile.base);

  const payload = request?.tokenPayload?.payloadObj;
  const userInfo = extractUserData(payload);

  const validatedContent = validateAndFormatContent(data, storage, hash);
  const commitData = createCommitData(validatedContent);
  const layersToUpdate = createLayerUpdateDataByParser(validatedContent);

  const jsonLog = {
    userName: userInfo.name + ' ' +  userInfo.surname,
    originalUrl: request.originalUrl,
    message: null,
    time: null
  };
  const start = Date.now();

  const commitResult = await commitToRepository({
    ...commitData,
    userInfo
  });

  if (!commitResult.success) {
    throw new Error(`${commitResult.message}: ${commitResult.error}`);
  }

  jsonLog.time = Date.now() - start;
  jsonLog.message = 'On change: repository has been updated';
  logger.info(() => JSON.stringify(jsonLog));

  const parser = await restoreParser(storage);
  await parser.onChange(layersToUpdate);
  await updateManifestInfo(parser, storage, isCluster);

  jsonLog.time = Date.now() - start;
  jsonLog.message = 'On change: manifest has been changed';
  logger.info(() => JSON.stringify(jsonLog));
};
