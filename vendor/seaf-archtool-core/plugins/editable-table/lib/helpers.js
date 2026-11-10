/*
  Copyright (C) 2023 Sber

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
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber

  Contributors:
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
*/

import objectHash from 'object-hash';

import { createInvalidOptionListError } from './tableDataValidate';
import { FILTRATION_MODES } from './const';
import { isUnsafeHref } from '@front/helpers/linkHref';

// База для isUnsafeHref: для путей от корня и абсолютных адресов результат от неё не зависит
const LINK_CHECK_BASE = 'https://localhost/';

// Ссылка: путь от корня или абсолютный адрес (как до ERA-3562) и не опасная схема
export function checkIsValidUrl(url) {
  try {
    return (url.startsWith('/') || Boolean(new URL(url))) && !isUnsafeHref(url, LINK_CHECK_BASE);
  } catch (e) {
    return false;
  }
}

export function formatLinkData(data, strictMode = false) {
  const formatLinkItem = (data) => {
    if (typeof data === 'string') {
      return checkIsValidUrl(data) 
        ? { href: data, text: data } 
        : strictMode
          ? null
          : data;

    } else if (typeof data === 'object') {
      return data?.href && checkIsValidUrl(data.href)
        ? { href: data.href, text: data?.text || data.href }
        : data?.text && !strictMode
          ? data.text
          : null;
    }
    return null;
  };

  if (Array.isArray(data)) {
    return data.map((item) => formatLinkItem(item)).filter(Boolean);
  } else if (data) {
    const formatedLink = formatLinkItem(data);
    return formatedLink ? [formatedLink] : null;
  } else {
    return null;
  }
}

export function deepMerge(target, source) {
  for (let key in source) {
    const value = source[key];

    if (typeof value === 'object' && !Array.isArray(value)) {
      if (typeof target[key] === 'undefined') {
        target[key] = {};
      }
      const deepTarget = target[key];
      deepMerge(deepTarget, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

export function mergeHeaders(targetList, sourceList) {
  if (!targetList || !sourceList) {
    return targetList ?? sourceList;
  }

  const HEADER_INDEX_MAP = {};
  targetList.forEach((header, index) => {
    HEADER_INDEX_MAP[header.value] = index;
  });

  sourceList.forEach((header) => {
    let index = HEADER_INDEX_MAP[header.value];

    if (index === undefined) {
      targetList.push(header);
    } else {
      deepMerge(targetList[index], header);
    }
  });

  return targetList;
}

export function formatHeaderSelectorOptionList(optionList, headerID) {
  let formatedOptions;
  if (Array.isArray(optionList)) {
    formatedOptions = optionList
      .filter(({ value }) =>
        typeof value === 'boolean' ? true : Boolean(value)
      )
      .map((item) => (item.text ? item : { ...item, text: item.value }));
  } else if (optionList && typeof optionList === 'object') {
    formatedOptions = {};

    for (let key in optionList) {
      if (Array.isArray(optionList[key])) {
        formatedOptions[key] = formatHeaderSelectorOptionList(optionList[key]);
      } else {
        createInvalidOptionListError(headerID);
      }
    }
  } else {
    createInvalidOptionListError(headerID);
  }

  return formatedOptions;
}

export function filterValuesByOptions(value, options) {
  const getValuesProps = (list) => list.map(({ value }) => value);

  const optionValues = Array.isArray(options)
    ? getValuesProps(options)
    : Object.values(options).reduce(
        (acc, value) => acc.concat(getValuesProps(value)),
        []
      );

  if (typeof value === 'string' || typeof value === 'boolean') {
    return optionValues.includes(value) ? value : null;
  } else if (Array.isArray(value)) {
    return value.filter((item) => optionValues.includes(item));
  }
  return null;
}

export function checkIsValueEmpty(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function getMultipleRowSorter(sortList, exceptions = []) {
  return ([rowAID, rowA], [rowBID, rowB]) => {
    const aIsException = exceptions.includes(rowAID);
    const bIsException = exceptions.includes(rowBID);

    if (aIsException && bIsException) {
      return 0;
    } else if (aIsException) {
      return 1;
    } else if (bIsException) {
      return -1;
    }

    for (let { value: headerID, direction, type, options } of sortList) {
      let aValue = rowA[headerID];
      let bValue = rowB[headerID];

      const aIsEmpty = checkIsValueEmpty(aValue);
      const bIsEmpty = checkIsValueEmpty(bValue);

      if (aIsEmpty && bIsEmpty) {
        continue;
      } else if (aIsEmpty) {
        return direction === 'inc' ? -1 : 1;
      } else if (bIsEmpty) {
        return direction === 'inc' ? 1 : -1;
      }

      let first, second;
      if (type === 'multiple-select') {
        first = aValue.length;
        second = bValue.length;
      } else if (type === 'checkbox') {
        first = Number(aValue);
        second = Number(bValue);
      } else {
        if (type === 'select') {
          aValue = options[aValue];
          bValue = options[bValue];
        }

        const isNumbers = !isNaN(Number(aValue)) && !isNaN(Number(bValue));
        if (isNumbers) {
          first = Number(aValue);
          second = Number(bValue);
        } else {
          first = `${aValue}`.toLowerCase();
          second = `${bValue}`.toLowerCase();
        }
      }

      if (first < second) {
        return direction === 'inc' ? -1 : 1;
      } else if (first > second) {
        return direction === 'inc' ? 1 : -1;
      }
    }

    return 0;
  };
}

export function getStylesToApply(value, styles) {
  if (checkIsValueEmpty(value)) {
    return '';
  }

  let result = {};
  for (let key in styles) {
    const currentStyles = styles[key];

    if (currentStyles.conditions) {
      for (let i = 0; i < currentStyles.conditions.length; i++) {
        const { condition_type, value: checkValue } =
          currentStyles.conditions[i];
        if (checkIsConditionPassed(condition_type, value, checkValue)) {
          result = { ...result, ...currentStyles };
          delete result.conditions;
          break;
        }
      }
    } else {
      result = { ...result, ...currentStyles };
    }
  }
  return result;
}

function checkIsConditionPassed(type, value, checkValue) {
  switch (type) {
    case 'equal':
      return checkIsEqual(value, checkValue);
    case 'includes':
      return Array.isArray(checkValue)
        ? checkIsArrayIncludesValue(value, checkValue)
        : checkIsStringIncludesValue(value, checkValue);
    case 'match':
      return checkByRegExp(value, checkValue);
    case '>':
      return Number(value) > Number(checkValue);
    case '>=':
      return Number(value) >= Number(checkValue);
    case '<':
      return Number(value) < Number(checkValue);
    case '<=':
      return Number(value) <= Number(checkValue);
  }
}

function checkIsEqual(value, checkValue) {
  return value === checkValue;
}

function checkIsStringIncludesValue(value, checkValue) {
  return value.includes(checkValue);
}

function checkIsArrayIncludesValue(value, checkValue) {
  return checkValue.includes(value);
}

function parseRegExp(str) {
  const [pattern, flags] = str.split('/').slice(1);
  return new RegExp(pattern, flags);
}

function checkByRegExp(value, regExp) {
  return value.match(parseRegExp(regExp)) !== null;
}

export const getFilteredTableData = (
  items,
  filters,
  headers,
  exceptions = []
) => {
  return items.filter(([rowID, row]) => {
    if (exceptions.includes(rowID)) {
      return true;
    }

    for (let i = 0; i < headers.length; i++) {
      const { headerID, filterable, type } = headers[i];

      const filter = filters[headerID];
      if (!filter || !filterable) continue;

      const currentValue = row[headerID];
      const { value: filterValue, filtrationMode } = filter;

      if (filtrationMode === FILTRATION_MODES.empty) {
        if (checkIsValueEmpty(currentValue)) {
          continue;
        } else {
          return false;
        }
      } else if (filtrationMode === FILTRATION_MODES.notEmpty) {
        if (checkIsValueEmpty(currentValue)) {
          return false;
        } else {
          continue;
        }
      } else if (checkIsValueEmpty(currentValue)) {
        return false;
      } else if (checkIsValueEmpty(filter?.value)) {
        continue;
      } else if (filtrationMode === FILTRATION_MODES.correspondsPartially) {
        if (type === 'multiple-select') {
          if (filterValue.every((current) => currentValue.includes(current))) {
            continue;
          } else {
            return false;
          }
        }

        let value = currentValue;
        if (type === 'link') {
          value = currentValue
            // опасная ссылка лежит в данных строкой (текст), а не объектом; объект без text ищется по href
            .map((item) => typeof item === 'string' ? item : (item?.text ?? item?.href))
            .join(' ')
            .trim();
        }

        if (`${value}`.toLowerCase().includes(`${filterValue}`.toLowerCase())) {
          continue;
        } else {
          return false;
        }
      } else if (filtrationMode === FILTRATION_MODES.correspondsFully) {
        if (type === 'multiple-select') {
          if (
            filterValue.length === currentValue.length &&
            filterValue.every((current) => currentValue.includes(current))
          ) {
            continue;
          } else {
            return false;
          }
        } else if (type === 'checkbox') {
          if (filterValue === currentValue) {
            continue;
          } else {
            return false;
          }
        } else {
          if (
            `${filterValue}`.toLocaleLowerCase() ===
            `${currentValue}`.toLocaleLowerCase()
          ) {
            continue;
          } else {
            return false;
          }
        }
      } else if (filtrationMode === FILTRATION_MODES.regExp) {
        if (type !== 'text') continue;
        try {
          if (checkByRegExp(currentValue, filterValue)) {
            continue;
          } else {
            return false;
          }
        } catch (e) {
          continue;
        }
      } else if (filtrationMode === FILTRATION_MODES.oneOfMany) {
        const hasFilterElement = (
          Array.isArray(currentValue) ? currentValue : [currentValue]
        ).some((el) => filterValue.includes(el));
        if (hasFilterElement) {
          continue;
        } else {
          return false;
        }
      }
    }
    return true;
  });
};

export const createTableHash = (path, locationHash, params = {}) => {
  return objectHash({path, locationHash, params});
};
