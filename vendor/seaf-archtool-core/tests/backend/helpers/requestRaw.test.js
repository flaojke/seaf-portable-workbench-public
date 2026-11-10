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
      Vladislav Markin, Sber

  Contributors:
      Vladislav Markin, Sber - 2026
*/

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {afterAll, beforeAll, describe, expect, it, jest} from '@jest/globals';
import {envelopeDocument} from '@global/helpers/api/envelope.js';
import {unenvelopeDocument} from '@global/helpers/api/unenvelope.js';

const BPMN = '<?xml version="1.0" encoding="UTF-8"?>\n<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"/>\n';
const YAML_TEXT = 'a: 1\nb:\n  - x\n';
// Сигнатура PNG содержит байты, невалидные для UTF-8
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff, 0xfe, 0x80]);
const SVG = '<svg xmlns="http://www.w3.org/2000/svg"/>';
const TEMPLATE = '{\n  "info": {}\n  {{#content}},"{{field}}": {{{body}}}{{/content}}\n}\n';

// Окружение бэкенда (top-level await, import.meta) jest не загружает, подменяем его
jest.mock('@back/utils/logger/index.mjs', () => ({performanceLogger: null}));
jest.mock('@back/helpers/env.mjs', () => ({hasStaticEtag: false}));
jest.mock('@back/helpers/gitlab.mjs', () => ({axiosInterceptor: (config) => config}));
jest.mock('@back/helpers/bitbucket.mjs', () => ({axiosInterceptor: (config) => config}));

let storage;
let requestRaw;

beforeAll(async() => {
    storage = fs.mkdtempSync(path.join(os.tmpdir(), 'request-raw-'));
    fs.writeFileSync(path.join(storage, 'diagram.xml'), BPMN);
    fs.writeFileSync(path.join(storage, 'data.yaml'), YAML_TEXT);
    fs.writeFileSync(path.join(storage, 'template.json'), TEMPLATE);
    fs.writeFileSync(path.join(storage, 'cat.png'), PNG);
    fs.writeFileSync(path.join(storage, 'icon.svg'), SVG);
    global.$paths = {...(global.$paths || {}), file_storage: storage};
    global.$httpRepeater = global.$httpRepeater || {maxRetries: 0};
    ({requestRaw} = await import('@back/helpers/request.mjs'));
    global.$paths.file_storage = storage;
});

afterAll(() => {
    fs.rmSync(storage, {recursive: true, force: true});
});

describe('requestRaw', () => {
    it('возвращает XML как есть, а не разобранный объект', async() => {
        const result = await requestRaw('diagram.xml', 'file:///');
        expect(result.data).toBe(BPMN);
        expect(result.contentType).toBe('application/xhtml+xml');
    });

    it('возвращает YAML как есть с content-type', async() => {
        const result = await requestRaw('data.yaml', 'file:///');
        expect(result.data).toBe(YAML_TEXT);
        expect(result.contentType).toBe('application/x-yaml');
    });

    it('не пытается разбирать шаблон с mustache', async() => {
        const result = await requestRaw('template.json', 'file:///');
        expect(result.data).toBe(TEMPLATE);
        expect(result.contentType).toBe('application/json');
    });

    it('возвращает картинку в base64 без потерь', async() => {
        const result = await requestRaw('cat.png', 'file:///');
        expect(result.encoding).toBe('base64');
        expect(result.contentType).toBe('image/png');
        expect(Buffer.from(result.data, 'base64').equals(PNG)).toBe(true);
    });

    it('возвращает SVG как текст', async() => {
        const result = await requestRaw('icon.svg', 'file:///');
        expect(result.data).toBe(SVG);
        expect(result.contentType).toBe('image/svg+xml');
        expect(result.encoding).toBeUndefined();
    });

    it('картинка без потерь проходит через envelope', async() => {
        const result = await requestRaw('cat.png', 'file:///');
        const wire = JSON.parse(JSON.stringify(envelopeDocument(result)));
        const content = unenvelopeDocument(wire);
        expect(Buffer.from(content.data, 'base64').equals(PNG)).toBe(true);
        expect(content.contentType).toBe('image/png');
    });

    it('содержимое без изменений проходит через envelope', async() => {
        const result = await requestRaw('diagram.xml', 'file:///');
        const wire = JSON.parse(JSON.stringify(envelopeDocument({
            data: result.data,
            contentType: result.contentType
        })));
        expect(unenvelopeDocument(wire)).toEqual({
            data: BPMN,
            contentType: 'application/xhtml+xml'
        });
    });
});
