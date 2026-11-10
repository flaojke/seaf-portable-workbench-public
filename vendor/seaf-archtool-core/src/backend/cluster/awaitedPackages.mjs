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
      Alexander Romashin <alexander.romashin@gmail.com>, Sber

  Contributors:
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

/**
 * Сверка пакетов, ожидаемых в common (root-манифест, common.packages[].id/version), с тем, что реально
 * собралось при его загрузке (parser.metamodels, см. parser3 _getMetamodelVersions).
 * Результат идёт в storage.problems/manifestMeta.problems.
 * Переходный режим: несовпадение не прерывает загрузку common
 */
import semver from 'semver';

const PROBLEM_ID_PREFIX = 'seaf.common.package.';

export function checkAwaitedPackages(metamodels, awaitedPackages) {
    const problems = [];
    for (const {id, version: expectedVersion} of awaitedPackages || []) {
        if (!semver.validRange(expectedVersion)) {
            problems.push(toProblem(id, expectedVersion, null, 'invalid-range'));
            continue;
        }
        const actualVersion = metamodels?.[id];
        if (actualVersion === undefined) {
            problems.push(toProblem(id, expectedVersion, null, 'missing'));
            continue;
        }
        const coercedVersion = semver.coerce(actualVersion);
        if (!coercedVersion || !semver.satisfies(coercedVersion, expectedVersion)) {
            problems.push(toProblem(id, expectedVersion, actualVersion, 'version-mismatch'));
        }
    }
    return problems;
}

export function replacePackageProblems(problems, packageProblems) {
    const kept = (problems || []).filter((problem) => !problem?.id?.startsWith(PROBLEM_ID_PREFIX));
    return [...kept, ...packageProblems];
}

const PROBLEM_TITLES = {
    'missing': 'Пакет не найден в common',
    'version-mismatch': 'Версия пакета не соответствует ожидаемой',
    'invalid-range': 'Ожидаемая версия задана некорректно'
};

function toProblem(packageId, expectedVersion, actualVersion, reason) {
    const descriptions = {
        'missing': `Ожидался пакет "${packageId}" версии ${expectedVersion}, не найден в собранном common`,
        'version-mismatch': `Ожидалась версия ${expectedVersion}, обнаружена ${actualVersion}`,
        'invalid-range': `Значение "${expectedVersion}" не является корректным диапазоном версий semver`
            + ' - проверьте common.packages в root-манифесте'
    };
    return {
        id: `${PROBLEM_ID_PREFIX}${packageId}`,
        title: `Пакет "${packageId}"`,
        items: [{
            uid: `${PROBLEM_ID_PREFIX}${packageId}`,
            title: PROBLEM_TITLES[reason],
            description: descriptions[reason]
        }]
    };
}
