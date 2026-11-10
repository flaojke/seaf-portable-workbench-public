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
import os from 'node:os';
import path from 'node:path';
import {describe, expect, it} from '@jest/globals';
import {getSupportChannels, parseSupportChannels} from '@back/helpers/supportChannels.mjs';

const VALID_CARD = {
  icon: 'mdi-bank',
  name: 'Тестовый канал поддержки',
  desc: 'Пример канала',
  link: 'https://example.invalid/support'
};

function writeTempChannels(data) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'support-channels-'));
  const filePath = path.join(dir, 'channels.json');
  fs.writeFileSync(filePath, typeof data === 'string' ? data : JSON.stringify(data));
  return filePath;
}

describe('parseSupportChannels', () => {
  it('keeps valid http(s) cards in order and caps at 4', () => {
    const cards = parseSupportChannels([
      VALID_CARD,
      {name: 'Two', link: 'http://example.com/two'},
      {name: 'Three', link: 'https://example.com/three'},
      {name: 'Four', link: 'https://example.com/four'},
      {name: 'Five', link: 'https://example.com/five'}
    ]);

    expect(cards).toHaveLength(4);
    expect(cards.map((card) => card.name)).toEqual([
      'Тестовый канал поддержки',
      'Two',
      'Three',
      'Four'
    ]);
  });

  it('skips invalid items and keeps the next valid ones', () => {
    const cards = parseSupportChannels([
      {name: 'Bad scheme', link: 'javascript:alert(1)'},
      {link: 'https://example.com/no-name'},
      {name: 'Data', link: 'data:text/html,hi'},
      {name: 'Ok', link: 'https://example.com/ok', extra: 'ignored'},
      {name: 'Also ok', link: 'http://example.com/also'}
    ]);

    expect(cards).toEqual([
      {icon: undefined, name: 'Ok', desc: undefined, link: 'https://example.com/ok'},
      {icon: undefined, name: 'Also ok', desc: undefined, link: 'http://example.com/also'}
    ]);
  });

  it('returns an empty array when input is not an array', () => {
    expect(parseSupportChannels({name: 'Nope'})).toEqual([]);
    expect(parseSupportChannels(null)).toEqual([]);
  });
});

describe('getSupportChannels', () => {
  it('returns undefined when path is empty', () => {
    expect(getSupportChannels('')).toBeUndefined();
    expect(getSupportChannels('   ')).toBeUndefined();
  });

  it('returns undefined when the file is missing', () => {
    expect(getSupportChannels(path.join(os.tmpdir(), 'no-such-support-channels.json'))).toBeUndefined();
  });

  it('returns undefined when JSON is invalid or not an array', () => {
    expect(getSupportChannels(writeTempChannels('{not json'))).toBeUndefined();
    expect(getSupportChannels(writeTempChannels({name: 'Nope'}))).toBeUndefined();
  });

  it('returns undefined when there are no valid cards', () => {
    expect(getSupportChannels(writeTempChannels([
      {name: 'Bad', link: 'javascript:alert(1)'}
    ]))).toBeUndefined();
  });

  it('returns parsed cards from a valid file', () => {
    const filePath = writeTempChannels([VALID_CARD]);
    expect(getSupportChannels(filePath)).toEqual([VALID_CARD]);
  });
});
