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
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber

  Contributors:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2025
      Aksinenko Anatoly <aiaksinenko@sberbnak.ru>, Sber - 2026
*/

import { LEGACY_TO_SEAF2, SEAF2_TO_LEGACY } from './constants';

function uniq(values) {
  return values.filter((value, index) => value && values.indexOf(value) === index);
}

/**
 * Finds the first common element between two sources.
 * @param {string|Array|Object} sourceOne - First source to compare.
 * @param {Array|Object|string} sourceTwo - Second source to compare.
 * @returns {(string|number|undefined)} - First common element, or `undefined` if none exists.
 */
export function findCommonElement(sourceOne, sourceTwo) {
  if (!sourceOne || !sourceTwo) return undefined;
  if (typeof sourceOne === 'string') {
    return sourceTwo[sourceTwo.indexOf(sourceOne)];
  }
  if (!Array.isArray(sourceOne)) {
    return undefined;
  }
  for (const ele of sourceOne) {
    if (sourceTwo.includes(ele)) {
      return ele;
    }
  }
}

/**
 * Generates a deterministic 32-bit hash from a string.
 * @param {string} value - The input value to hash (will be converted to string).
 * @returns {string}
 */
export function hashString(value) {
  let hash = 0;
  const source = String(value ?? '');
  for (let i = 0; i < source.length; i++) {
    hash = ((hash << 5) - hash) + source.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Checks if a given value matches a specified type pattern (e.g., "type:component").
 * Supports colon-separated type specifiers and nested field lookups.
 * @param {Object} value - The value to check.
 * @param {string} type - The type pattern to match (e.g., "type", "type:component").
 * @returns {boolean} - `true` if the value matches the type, `false` otherwise.
 */
export function matchesType(value, type) {
  if (!type) return true;
  const index = type.indexOf(':');
  const typeKey = index !== -1 ? type.substring(0, index) : 'type';
  const typeValue = index !== -1 ? type.substring(index + 1) : type;
  const valueType = findByKey(value, typeKey);
  return normalizeValues(valueType).includes(typeValue);
}

/**
 * Recursively searches for values associated with a given key in a nested object or array.
 * @param {Object|Array} data - The data structure to search.
 * @param {string} targetKey - The key to look for.
 * @returns {Array} - Array of found values for the target key.
 */
export function findByKey(data, targetKey) {
  const results = [];
  if (Array.isArray(data)) {
    data.forEach((ele) => results.push(...findByKey(ele, targetKey)));
  } else if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      if (key === targetKey) {
        if (Array.isArray(value) && value.length > 0) {
          return value;
        }
        results.push(value);
      } else if (value && typeof value === 'object') {
        results.push(...findByKey(value, targetKey));
      }
    }
  }
  return results;
}

// Functions to work with regexp
/**
 * Checks whether a given object or value matches a set of pattern filters (regex, tags, required/forbidden fields).
 * @param {string} id - The ID of the object (used for `id_regex`/`exclude_id_regex`).
 * @param {Object} value - The object to validate.
 * @param {Object} options - Filter configuration (regex patterns, required/optional tags/fields).
 * @returns {boolean} - `true` if all filters are satisfied, `false` otherwise.
 */
export function matchesPatternFilters(id, value, options) {
  if (!options) return true;
  if (options.id_regex && !compilePatternRegex(options.id_regex).test(id)) return false;
  if (options.exclude_id_regex && compilePatternRegex(options.exclude_id_regex).test(id)) return false;
  if (options.require_fields?.some((field) => !value?.[field])) return false;
  if (options.exclude_fields?.some((field) => value?.[field])) return false;
  if (options.field_regex && matchesRegexRules(value, options.field_regex, true)) return false;
  if (options.exclude_field_regex && matchesRegexRules(value, options.exclude_field_regex, true)) return false;
  if (options.any_field_regex && !matchesRegexRules(value, options.any_field_regex, false)) return false;
  if (options.exclude_any_field_regex && matchesRegexRules(value, options.exclude_any_field_regex, false)) return false;

  const tags = normalizeSet(value?.tags);
  const includeTags = normalizeSet(options.include_tags);
  const requireTags = normalizeSet(options.require_tags);
  const excludeTags = normalizeSet(options.exclude_tags);
  if (includeTags.size && ![...includeTags].some((tag) => tags.has(tag))) return false;
  if (requireTags.size && ![...requireTags].every((tag) => tags.has(tag))) return false;
  if (excludeTags.size && [...excludeTags].some((tag) => tags.has(tag))) return false;
  return true;
}

function matchesRegexRules(value, rules, requireAll) {
  const entries = Object.entries(rules ?? {});
  if (!entries.length) return false;
  return entries[requireAll ? 'every' : 'some'](([field, regex]) => {
    const values = iterFieldValues(value, field);
    const pattern = compilePatternRegex(regex);
    return values.some((item) => pattern.test(item));
  });
}

function compilePatternRegex(regex) {
  if (typeof regex !== 'string') return new RegExp(regex);
  let source = regex;
  let flags = '';
  const inlineFlags = source.match(/^\(\?([a-z]+)\)/i);
  if (inlineFlags) {
    source = source.slice(inlineFlags[0].length);
    if (inlineFlags[1].includes('i')) flags += 'i';
    if (inlineFlags[1].includes('m')) flags += 'm';
    if (inlineFlags[1].includes('s')) flags += 's';
  }
  return new RegExp(source, flags);
}

function canonicalSchema(schema) {
  return LEGACY_TO_SEAF2[schema] ?? schema;
}

function schemaCandidates(schema) {
  const canonical = canonicalSchema(schema);
  return uniq([canonical, schema, ...(SEAF2_TO_LEGACY[canonical] ?? [])]);
}

/**
 * Checks if two schemas are equivalent (after canonicalization).
 * @param {string} schema - First schema name.
 * @param {string} expectedSchema - Second schema name.
 * @returns {boolean} - `true` if both schemas canonicalize to the same value.
 */
export function schemaMatches(schema, expectedSchema) {
  return canonicalSchema(schema) === canonicalSchema(expectedSchema);
}

/**
 * Extracts the data object for a given schema from the combined data object.
 * Tries all possible schema candidates.
 * @param {Object} data - Object that may contain schema keys.
 * @param {string} schema - Schema name to look for.
 * @returns {Object} - The schema-specific data, or empty object if not found.
 */
export function getSchemaData(data, schema) {
  if (!data || !schema) return {};
  for (const candidate of schemaCandidates(schema)) {
    if (data[candidate]) return data[candidate];
  }
  return {};
}

/**
 * Retrieves a specific object from schema data by its ID.
 * @param {Object} data - The data object containing schema keys.
 * @param {string} schema - Schema name.
 * @param {string} objectId - ID of the object to retrieve.
 * @returns {Object} - The found object, or an empty object if not found.
 */
export function getSchemaObject(data, schema, objectId) {
  const objects = getSchemaData(data, schema);
  return objects?.[objectId] ?? {};
}

function iterFieldValues(obj, field) {
  return normalizeValues(obj?.[field]);
}

function normalizeSet(value) {
  return new Set(normalizeValues(value));
}

/**
 * Normalizes a value (string, array, etc.) into an array of non-null strings.
 * @param {*} value - Value to normalize.
 * @returns {Array<string>} - Array of normalized string values.
 */
export function normalizeValues(value) {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.filter((item) => item !== null && item !== undefined).map(String);
  return [String(value)];
}
