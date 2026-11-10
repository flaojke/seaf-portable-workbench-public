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

// Jest не настроен на .vue: компилируем настоящий компонент локально (как в plugin-host.test.js),
// без нового transformer и без копирования логики компонента в тест.
// Поддерживает компоненты и миксины с Options API (script, template — если есть); вложенные .vue импортируются так же.
// Модули, которые импортирует компонент, загружаются через require jest, поэтому jest.mock в тесте на них действует.

import fs from 'fs';
import path from 'path';
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc';
import ts from 'typescript';

export type VueSfc = Record<string, any>;

type ModuleExports = Record<string, unknown> & { default?: VueSfc; render?: unknown };

const ALIASES: Record<string, string> = {
  '@front/': 'src/frontend/',
  '@global/': 'src/global/'
};
const ROOT = path.resolve(__dirname, '../..');
const cache = new Map<string, VueSfc>();

function transpile(code: string): string {
  return ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, allowJs: true, esModuleInterop: true }
  }).outputText;
}

function resolveVue(name: string, fromFile: string): string {
  for (const [alias, dir] of Object.entries(ALIASES)) {
    if (name.startsWith(alias)) {
      return path.resolve(ROOT, dir, name.slice(alias.length));
    }
  }
  return path.resolve(path.dirname(fromFile), name);
}

function runModule(code: string, load: (name: string) => unknown): ModuleExports {
  const moduleExports: ModuleExports = {};
  new Function('require', 'exports', transpile(code))(load, moduleExports);
  return moduleExports;
}

export function loadVueSfc(filename: string): VueSfc {
  const cached = cache.get(filename);
  if (cached) {
    return cached;
  }
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  const id = path.basename(filename);
  const script = compileScript(descriptor, { id });
  const load = (name: string): unknown => {
    if (name.endsWith('.vue')) {
      return { __esModule: true, default: loadVueSfc(resolveVue(name, filename)) };
    }
    // относительные пути (../../lib/helpers) резолвим от файла компонента
    return require(name.startsWith('.') ? path.resolve(path.dirname(filename), name) : name);
  };
  const component: VueSfc = { ...runModule(script.content, load).default };
  // миксины без <template> тоже поддерживаются
  if (descriptor.template) {
    const template = compileTemplate({ source: descriptor.template.content, filename, id });
    component.render = runModule(template.code, require).render;
  }
  cache.set(filename, component);
  return component;
}
