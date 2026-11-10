/*
  Copyright (C) 2025 Sber

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
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2025
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2026
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

import {DEFAULT_ALIAS_FOR_COMMON_MANIFEST, DEFAULT_PERMISSION_FOR_COMMON_MANIFEST} from '@back/cluster/constants.mjs';
import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';

const logger = getLoggerWithTag('rootManifestVersionCheck');

export function validateRootManifest(rootJson) {
    if (!rootJson) {
        throw Error('root manifest object does not exist (undefined or null)');
    }
    let imports = rootJson.imports;
    if (!imports) {
        throw Error('root manifest does not contains \'imports\' directive');
    }
    if(!Array.isArray(imports)) {
        throw Error('root manifest \'imports\' directive is not array, but must be');
    }
    if(typeof imports[0] !== 'object') {
        throw Error('root manifest \'imports\' directive is not an object, but must be object with params \'root\' and \'permission\'.');
    }
    let errors = [];
    for(let imp in imports) {
        const importForCheck = imports[imp];
        if (!importForCheck.root) {
            errors.push(`Error in root manifest: imports[${imp}] must have 'root' property, which direct on domain root manifest`);
        }
        if (!importForCheck.permission) {
            errors.push(`Error in root manifest: imports[${imp}] must have 'permission' property, which direct access permission for data`);
        }
        if (!importForCheck.alias) {
            errors.push(`Error in root manifest: imports[${imp}] must have 'alias' property, which direct alias for reload data (used for reload request)`);
        }

        if (importForCheck.repos) {
            const repoErrors = checkRepos(importForCheck.repos);
            for (const error of repoErrors) {
                errors.push(`Error in root manifest: imports[${imp}] have error in repos array: ${error}`);
            }
        }
        if(imports[imp].permission === DEFAULT_PERMISSION_FOR_COMMON_MANIFEST) {
            errors.push(`Error in root manifest: imports[${imp}] has 'permission' property set with reserved word ${DEFAULT_PERMISSION_FOR_COMMON_MANIFEST}`);
        }
        if(imports[imp].alias === DEFAULT_ALIAS_FOR_COMMON_MANIFEST) {
            errors.push(`Error in root manifest: imports[${imp}] has 'alias' property set with reserved word ${DEFAULT_ALIAS_FOR_COMMON_MANIFEST}`);
        }
    }
    if (rootJson.common) {
        errors.push(...checkCommon(rootJson.common));
    }
    if (errors.length > 0) {
        throw Error(errors.join('; '));
    }
}

/**
 * Разбор common - единственное место, где описана его допустимая форма: и checkCommon, и
 * normalizeCommon работают с результатом отсюда, своих проверок формы у них нет.
 *
 * @param common - значение common из root-манифеста в любой из допустимых форм
 * @returns {{roots: string[], packages: object[]|undefined, problems: {message: string, fatal: boolean}[]}}
 *   roots пуст - общего манифеста нет. problems с fatal делают root-манифест невалидным, остальные
 *   лишь сообщают, что часть объявления не даёт источника
 */
function parseCommon(common) {
    const problems = [];
    const fail = (message) => problems.push({message, fatal: true});
    const note = (message) => problems.push({message, fatal: false});

    // Общего манифеста нет вовсе - штатная конфигурация, сообщать не о чем
    if (common === undefined || common === null) {
        return {roots: [], packages: undefined, problems};
    }
    if (typeof common === 'string') {
        if (!common) {
            note('\'common\' is an empty string, treat it as no common manifest');
        }
        return {roots: common ? [common] : [], packages: undefined, problems};
    }
    if (typeof common !== 'object' || Array.isArray(common)) {
        fail('\'common\' must be a string (URI) or an object with \'root\'/\'packages\' properties');
        return {roots: [], packages: undefined, problems};
    }

    if (common.root !== undefined) {
        if (typeof common.root !== 'string') {
            fail('\'common.root\' must be a string');
        } else if (!common.root) {
            note('\'common.root\' is empty, it gives no source and is dropped');
        }
    }

    const packages = parsePackages(common.packages, fail);
    // Порядок задаёт приоритет мёржа: root первым, дальше пакеты по порядку объявления
    const roots = [
        ...(common.root ? [common.root] : []),
        ...(packages || []).map((pkg) => pkg?.root).filter(Boolean)
    ];
    if (roots.length === 0) {
        note('\'common\' is declared, but gives no root at all, treat it as no common manifest');
    }
    return {roots, packages, problems};
}

/**
 * Проверяет объявления пакетов.
 *
 * Версия обязана быть строкой, то есть в YAML записанной в кавычках. Незакавыченную версию из двух
 * частей YAML отдаёт числом, а `1.10` как число неотличимо от `1.1` - и это разные требования
 * semver: диапазон `1.1` не покрывает `1.10.0`, а `1.10` не покрывает `1.1.0`. Приводить число к
 * строке нельзя: к моменту приведения `1.10` уже потеряна
 */
function parsePackages(packages, fail) {
    if (packages === undefined) {
        return undefined;
    }
    if (!Array.isArray(packages)) {
        fail('\'common.packages\' must be an array');
        return undefined;
    }
    packages.forEach((pkg, i) => {
        if (!pkg || typeof pkg.root !== 'string' || !pkg.root) {
            fail(`common.packages[${i}] must have a non-empty 'root' property (string)`);
        }
        if (!pkg || typeof pkg.id !== 'string' || !pkg.id) {
            fail(`common.packages[${i}] must have a non-empty 'id' property (string)`);
        }
        if (!pkg || typeof pkg.version !== 'string' || !pkg.version) {
            fail(`common.packages[${i}] must have a non-empty 'version' property (quoted string, e.g. '1.11.0')`);
        }
    });
    return packages;
}

/**
 * common - строка (URI) либо объект {root?, packages?}.
 * Проверяются только типы: пустой common - легальная запись, означающая
 * отсутствие общего манифеста (см. normalizeCommon)
 * @returns {string[]} список ошибок, пустой массив если всё корректно
 */
function checkCommon(common) {
    return parseCommon(common).problems
        .filter((problem) => problem.fatal)
        .map((problem) => `Error in root manifest: ${problem.message}`);
}

/**
 * Единственное место, где решается, есть ли у root-манифеста общий манифест и из чего он собирается.
 * Вырожденные записи (нет поля, пустая строка, {}, {packages: []}, {root: ''}) равнозначны отсутствию common
 * @param common - значение common из root-манифеста в любой из допустимых форм
 * @returns {{roots: string[], packages: object[]|undefined}} roots пуст - общего манифеста нет
 */
export function normalizeCommon(common) {
    const {roots, packages, problems} = parseCommon(common);
    for (const problem of problems) {
        // fatal сюда доходит только из manifest-reload.controller.mjs: в потоке загрузчика такой
        // root-манифест отвергается раньше, на validateRootManifest
        if (problem.fatal) {
            logger.warn(() => `root manifest: ${problem.message}`);
        } else {
            logger.info(() => `root manifest: ${problem.message}`);
        }
    }
    return {roots, packages};
}

/**
 * проверка, что repos это массив, что его элементы имеют обязательные атрибуты type и url с типом string
 * @param repos
 * @returns {string[]|*[]}
 */
function checkRepos(repos) {
    if (!Array.isArray(repos)) {
        return ['repos must be array of object ({type: string, url: string})'];
    }
    if (repos.length === 0) {
        return [];
    }
    const errors = [];
    for (let i = 0; i < repos.length; i++) {
        const repo = repos[i];
        if (!repo.type || typeof repo.type !== 'string') {
            errors.push(`repo [${i}] have incorrect 'type' value (not exist or not string)`);
        }
        if (!repo.url || typeof repo.url !== 'string') {
            errors.push(`repo [${i}] have incorrect 'url' value (not exist or not string)`);
        }
    }
    return errors;
}
