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

import fs from 'node:fs';
import path from 'node:path';
import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';
import sanitizeUrl from '@global/helpers/sanitizeUrl.mjs';

const LOG_TAG = 'support-channels';
const logger = getLoggerWithTag(LOG_TAG);

const MAX_SUPPORT_CHANNELS = 4;

function isAllowedSupportLink(link) {
    try {
        const url = sanitizeUrl(link);
        return Boolean(url) && (url.protocol === 'http:' || url.protocol === 'https:');
    } catch {
        return false;
    }
}

export function parseSupportChannels(data) {
    if (!Array.isArray(data)) {
        return [];
    }

    const cards = [];
    for (let i = 0; i < data.length; i++) {
        if (cards.length >= MAX_SUPPORT_CHANNELS) {
            logger.debug(() => 'Max support channels reached, skipping remaining cards');
            break;
        }
        const card = data[i];
        if (!card || !card?.name) {
            logger.warn(() => `Support channel at index ${i} is missing name, skipped`);
            continue;
        }
        if (!isAllowedSupportLink(card.link)) {
            logger.warn(() => `Support channel at index ${i} has invalid link, skipped`);
            continue;
        }
        cards.push({
            icon: card.icon,
            name: card.name,
            desc: card.desc,
            link: card.link
        });
    }
    return cards;
}

function resolveChannelsPath(channelsPath) {
    if (path.isAbsolute(channelsPath)) {
        return channelsPath;
    }
    return path.resolve(process.cwd(), channelsPath);
}

export function getSupportChannels(channelsPath = process.env.VUE_APP_DOCHUB_SUPPORT_CHANNELS_PATH) {
    const rawPath = channelsPath?.trim();
    if (!rawPath) {
        return;
    }

    const resolved = resolveChannelsPath(rawPath);
    let raw;
    try {
        raw = fs.readFileSync(resolved, 'utf8');
    } catch (error) {
        logger.warn(() => `Failed to read support channels file (${resolved}): ${error.message}`);
        return;
    }

    let data;
    try {
        data = JSON.parse(raw);
    } catch (error) {
        logger.warn(() => `Support channels file is not valid JSON (${resolved}): ${error.message}`);
        return;
    }

    const cards = parseSupportChannels(data);
    if (!cards.length) {
        logger.warn(() => `Support channels file has no valid cards (${resolved})`);
        return;
    }

    return cards;
}
