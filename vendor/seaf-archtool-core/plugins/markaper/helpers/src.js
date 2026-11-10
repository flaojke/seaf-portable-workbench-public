/*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru

  Copyright (C) 2022 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  In any derivative products, you must retain the information of
  owner of the original code and provide clear attribution to the project

  https://dochub.info

  The use of this product or its derivatives for any purpose cannot be a secret.


  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      R.Piontik <r.piontik@mail.ru>

  Contributors:
	    R.Piontik <r.piontik@mail.ru> - 2023
*/

import objectHash from 'object-hash';

const TABS_STORAGE_KEY_PREFIX = 'markaper_tabs';

export function appendParams(src, params) {
    if (params) {
        const hashStruct = src.split('#');
        const paramsStruct = hashStruct[0].split('?');
        const tmpURL = new URL(`https://null?${paramsStruct[1] || ''}${hashStruct[1] ? '#' + hashStruct[1] : ''}`);
        for (const param in params) {
        tmpURL.searchParams.set(param, params[param]);
        }

        return `${paramsStruct[0]}${tmpURL.search}${tmpURL.hash}`;
    } else return src;
}

export function createTabsStorageKey(path, location, params = {}) {
    return `${TABS_STORAGE_KEY_PREFIX}:${objectHash({
        path,
        location,
        params: params || {}
    })}`;
}

export function getTabIdentity(tab) {
    if (!tab) return null;

    if (tab.id !== undefined && tab.id !== null && tab.id !== '') {
        return `id:${tab.id}`;
    }

    return tab.src ? `src:${tab.src}` : null;
}

export function resolveCurrentTab(tabs, storedIdentity) {
    if (!tabs.length) return null;

    const storedTabIndex = storedIdentity
        ? tabs.findIndex((tab) => getTabIdentity(tab) === storedIdentity)
        : -1;

    if (storedTabIndex >= 0) return storedTabIndex;

    const selectedTabIndex = tabs.findIndex((tab) => tab.selected);
    return selectedTabIndex >= 0 ? selectedTabIndex : 0;
}

export function readStoredTabIdentity(storage, storageKey, logger) {
    if (!storage) return null;

    try {
        return storage.getItem(storageKey);
    } catch (error) {
        logger?.debug(
            () => `Failed to read selected tab state from sessionStorage (key: ${storageKey})`,
            error
        );
        return null;
    }
}

export function writeStoredTabIdentity(storage, storageKey, identity, logger) {
    if (!storage || !identity) return;

    try {
        storage.setItem(storageKey, identity);
    } catch (error) {
        logger?.debug(
            () => `Failed to write selected tab state to sessionStorage (key: ${storageKey})`,
            error
        );
    }
}
