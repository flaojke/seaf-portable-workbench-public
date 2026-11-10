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
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber

  Contributors:
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2026
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import {v4 as uuidv4} from 'uuid';

const logger = getLoggerWithTag('retry_func');

export async function execWithRetry(retryCount = 0, pauseBetweenAttemptMs = 0, fn) {
    let lastError;
    let logUuid = '';
    // uuid связывает между собой строки одной серии попыток. Генерим лениво: на успешном пути (а это
    // подавляющее большинство операций кеша) он не нужен вовсе. Звать uid() внутри msgFn безопасно:
    // логгер вычисляет сообщение, только если уровень включён.
    const uid = () => logUuid || (logUuid = uuidv4());
    for (let attempt = 0; attempt <= retryCount; attempt++) {
        logger.trace(() => `${uid()}: Attempt ${attempt + 1}`);
        try {
            const result = await fn();
            // Только после неудачных попыток - иначе строка печаталась бы на каждую операцию кеша.
            // Без неё в логе оставалось "Attempt N failed ... trying again" и тишина: не отличить
            // восстановившийся ретрай от окончательного отказа.
            if (attempt !== 0) {
                logger.debug(() => `${uid()}: Attempt ${attempt + 1} success`);
            }
            return result;
        } catch (error) {
            lastError = error;
            if (attempt < retryCount) {
                logger.debug(() => `${uid()}: Attempt ${attempt + 1} failed with error: ${error?.message}, wait ${pauseBetweenAttemptMs} ms and trying again...`);
                await new Promise(resolve => setTimeout(resolve, pauseBetweenAttemptMs));
            }
        }
    }

    // Исчерпание попыток видно на уровне ретрая независимо от того, логирует вызывающий или нет:
    // до этого серия обрывалась в логе на последнем "trying again".
    logger.debug(() => `${uid()}: All ${retryCount + 1} attempt(s) failed, last error: ${lastError?.message}`);
    throw lastError || new Error(`${uid()}: All attempt failed`);
}
