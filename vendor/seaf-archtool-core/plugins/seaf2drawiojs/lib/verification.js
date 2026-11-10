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

  Contributors:
      Aksinenko Anatoly <aiaksinenko@sberbnak.ru>, Sber - 2026
*/

import { SCHEMAS } from './constants';
import { findByKey, getSchemaData, normalizeValues } from './utils';

const IGNORE_OBJECT_IDS = new Set(['981', '991']);
const SAMPLE_LIMIT = 20;

function sortedValues(values) {
  return [...values].sort((left, right) => String(left).localeCompare(String(right)));
}

function ensureSchemaState(state, schema) {
  if (!state.expectedCounts[schema]) state.expectedCounts[schema] = new Set();
  if (!state.expectedData[schema]) state.expectedData[schema] = {};
  if (!state.patternSpecs[schema]) state.patternSpecs[schema] = [];
}

function parseTypeSpec(type) {
  if (!type) return { typeKey: null, typeValue: null };
  const index = String(type).indexOf(':');
  if (index === -1) return { typeKey: 'type', typeValue: String(type) };
  return {
    typeKey: String(type).slice(0, index),
    typeValue: String(type).slice(index + 1)
  };
}

function valueList(value) {
  return normalizeValues(value).filter(Boolean);
}

function buildPresentIdSet(diagramIds) {
  const presentIds = new Set();
  for (const ids of Object.values(diagramIds ?? {})) {
    if (!Array.isArray(ids)) continue;
    for (const id of ids) {
      if (id) presentIds.add(String(id));
    }
  }
  return presentIds;
}

function normalizePendingLink(record) {
  if (Array.isArray(record)) {
    return {
      type: 'generic',
      pageName: record[0],
      sourceId: record[1],
      targetId: record[2],
      reason: 'endpoint_missing_on_page'
    };
  }
  return {
    type: record?.type ?? 'generic',
    pageName: record?.pageName ?? '',
    linkOid: record?.linkOid ?? '',
    sourceId: record?.sourceId ?? '',
    targetId: record?.targetId ?? '',
    topology: record?.topology ?? '',
    reason: record?.reason ?? 'endpoint_missing_on_page'
  };
}

function compactLink(record) {
  const link = record.linkOid ? ` link=${record.linkOid}` : '';
  const topology = record.topology ? ` topology=${record.topology}` : '';
  return `${record.type}${link} page="${record.pageName}" ${record.sourceId} -> ${record.targetId}${topology}`;
}

function uniquePendingLinks(pendingMissingLinks) {
  const seen = new Set();
  const result = [];
  for (const rawRecord of pendingMissingLinks ?? []) {
    const record = normalizePendingLink(rawRecord);
    const key = [
      record.type,
      record.pageName,
      record.linkOid,
      record.sourceId,
      record.targetId,
      record.reason
    ].join('\u0000');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(record);
  }
  return result;
}

function formatSample(records) {
  const sample = records.slice(0, SAMPLE_LIMIT).map(compactLink).join('; ');
  const tail = records.length > SAMPLE_LIMIT ? `; ... +${records.length - SAMPLE_LIMIT} more` : '';
  return `${sample}${tail}`;
}

function getMxCell(element) {
  if (!element) return null;
  if (element.tagName === 'mxCell') return element;
  return Array.from(element.children ?? []).find((child) => child.tagName === 'mxCell') ?? null;
}

function elementId(element) {
  const mx = getMxCell(element);
  return element?.getAttribute('id') || mx?.getAttribute('id') || '';
}

function isEdge(element) {
  return getMxCell(element)?.getAttribute('edge') === '1';
}

function allDrawnIds(root) {
  const ids = new Set();
  for (const element of Array.from(root.getElementsByTagName('*') ?? [])) {
    const id = element.getAttribute('id');
    if (id) ids.add(id);
  }
  return ids;
}

function parseDrawioXml(xml) {
  const parser = new DOMParser();
  const document = parser.parseFromString(xml, 'application/xml');
  const parserError = document.getElementsByTagName('parsererror')?.[0];
  if (parserError) throw new Error(parserError.textContent || 'Unable to parse generated Draw.io XML');
  return document;
}

function getSchemaExpectedHints(patternSpecs) {
  const countsByKey = {};
  const valuesByKey = {};
  for (const spec of patternSpecs ?? []) {
    if (!spec.typeKey || !spec.typeValue) continue;
    countsByKey[spec.typeKey] = (countsByKey[spec.typeKey] ?? 0) + 1;
    valuesByKey[spec.typeKey] = valuesByKey[spec.typeKey] ?? new Set();
    valuesByKey[spec.typeKey].add(spec.typeValue);
  }
  const typeKey = Object.entries(countsByKey).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
  return {
    typeKey,
    expectedValues: typeKey ? sortedValues(valuesByKey[typeKey] ?? []) : []
  };
}

export function createVerificationState() {
  return {
    expectedCounts: {},
    expectedData: {},
    patternSpecs: {},
    pendingMissingLinks: []
  };
}

export function collectExpectedPatternObjects(state, patternName, patternData, objectData) {
  const schema = patternData?.schema;
  if (!state || !schema || !objectData || typeof objectData !== 'object') return;
  ensureSchemaState(state, schema);

  for (const [id, data] of Object.entries(objectData)) {
    state.expectedCounts[schema].add(id);
    state.expectedData[schema][id] = data;
  }

  const { typeKey, typeValue } = parseTypeSpec(patternData.type);
  state.patternSpecs[schema].push({
    patternName,
    parentId: patternData.parent_id ?? null,
    typeKey,
    typeValue
  });
}

export function commonOnlyLogicalLinkIds(sourceData, diagramIds) {
  const logicalLinks = getSchemaData(sourceData, SCHEMAS.LOGICAL_LINK);
  if (!logicalLinks || typeof logicalLinks !== 'object') return new Set();

  const pageIdSets = Object.fromEntries(
    Object.entries(diagramIds ?? {})
      .filter(([, ids]) => Array.isArray(ids))
      .map(([pageName, ids]) => [pageName, new Set(ids)])
  );
  const presentIds = buildPresentIdSet(diagramIds);
  const result = new Set();

  for (const [linkOid, linkData] of Object.entries(logicalLinks)) {
    if (!linkData || typeof linkData !== 'object') continue;
    const routeIds = [linkData.source, ...valueList(linkData.target)].filter(Boolean);
    if (routeIds.length < 2) continue;

    const pagesWithAny = Object.values(pageIdSets)
      .filter((ids) => routeIds.some((id) => ids.has(id)));
    const allEndpointsPresent = routeIds.every((id) => presentIds.has(id));
    const fullyDrawableOnPage = Object.values(pageIdSets)
      .some((ids) => routeIds.every((id) => ids.has(id)));

    if (pagesWithAny.length > 1 && allEndpointsPresent && !fullyDrawableOnPage) {
      result.add(linkOid);
    }
  }
  return result;
}

export function excludeCommonOnlyLogicalLinksFromVerification(state, sourceData, diagramIds, logger) {
  const commonOnlyLinks = commonOnlyLogicalLinkIds(sourceData, diagramIds);
  if (!commonOnlyLinks.size) return [];

  const schema = SCHEMAS.LOGICAL_LINK;
  for (const linkOid of commonOnlyLinks) {
    state.expectedCounts[schema]?.delete(linkOid);
    if (state.expectedData[schema]) delete state.expectedData[schema][linkOid];
  }

  const ids = sortedValues(commonOnlyLinks);
  logger?.info?.(() => `SEAF2DrawIO: ${ids.length} cross-page logical_links are verified on the common page only: ${ids.join(', ')}`);
  return ids;
}

export function logPendingMissingLinks(pendingMissingLinks, diagramIds, logger, options = {}) {
  const uniqueLinks = uniquePendingLinks(pendingMissingLinks);
  if (!uniqueLinks.length) return { missing: [], deferred: [] };

  const commonPageEnabled = options.commonPageEnabled ?? true;
  const presentIds = buildPresentIdSet(diagramIds);
  const missing = [];
  const deferred = [];
  for (const record of uniqueLinks) {
    const missingEndpoints = [
      presentIds.has(record.sourceId) ? null : `source:${record.sourceId}`,
      presentIds.has(record.targetId) ? null : `target:${record.targetId}`
    ].filter(Boolean);
    if (missingEndpoints.length) missing.push({ ...record, missingEndpoints });
    else deferred.push(record);
  }

  if (missing.length) {
    logger.warn(() => `SEAF2DrawIO: skipped ${missing.length} links because endpoints are missing on all pages: ${formatSample(missing)}`);
  }

  const deferredLogical = deferred.filter((record) => record.type === 'logical');
  if (deferredLogical.length) {
    const message = commonPageEnabled
      ? `SEAF2DrawIO: ${deferredLogical.length} logical_links have endpoints outside the current page and are deferred to the common page`
      : `SEAF2DrawIO: ${deferredLogical.length} logical_links have endpoints outside the current page; common page is disabled`;
    logger.info(() => `${message}: ${formatSample(deferredLogical)}`);
  }

  return { missing, deferred };
}

export function analyzeGeneratedXml(xml, state) {
  const document = parseDrawioXml(xml);
  const drawnUnique = {};
  const drawnTotal = {};
  const perPageUnique = {};
  const perPageTotal = {};
  const drawnIds = allDrawnIds(document);

  for (const diagram of Array.from(document.getElementsByTagName('diagram'))) {
    const pageName = diagram.getAttribute('name') || 'Unknown';
    perPageUnique[pageName] = perPageUnique[pageName] ?? {};
    perPageTotal[pageName] = perPageTotal[pageName] ?? {};

    for (const object of Array.from(diagram.getElementsByTagName('object'))) {
      const schema = object.getAttribute('schema');
      let oid = elementId(object);
      if (!schema || !oid || IGNORE_OBJECT_IDS.has(oid)) continue;

      if (isEdge(object) && object.getAttribute('OID')) {
        oid = object.getAttribute('OID');
      }

      perPageTotal[pageName][schema] = (perPageTotal[pageName][schema] ?? 0) + 1;
      perPageUnique[pageName][schema] = perPageUnique[pageName][schema] ?? new Set();
      perPageUnique[pageName][schema].add(oid);

      drawnTotal[schema] = (drawnTotal[schema] ?? 0) + 1;
      drawnUnique[schema] = drawnUnique[schema] ?? new Set();
      drawnUnique[schema].add(oid);
    }
  }

  const schemas = sortedValues(new Set([
    ...Object.keys(state.expectedCounts ?? {}),
    ...Object.keys(drawnUnique)
  ]));
  const summary = [];
  const missing = {};
  const extra = {};
  const diagnostics = {};

  for (const schema of schemas) {
    const expectedSet = state.expectedCounts[schema] ?? new Set();
    const drawnSet = drawnUnique[schema] ?? new Set();
    const missingIds = sortedValues([...expectedSet].filter((id) => !drawnSet.has(id)));
    const extraIds = sortedValues([...drawnSet].filter((id) => !expectedSet.has(id)));

    if (missingIds.length) missing[schema] = missingIds;
    if (extraIds.length) extra[schema] = extraIds;

    summary.push({
      schema,
      expected: expectedSet.size,
      drawn_unique: drawnSet.size,
      drawn_total: drawnTotal[schema] ?? 0,
      status: missingIds.length || extraIds.length ? 'MISMATCH' : 'OK'
    });

    if (!missingIds.length) continue;

    const hints = getSchemaExpectedHints(state.patternSpecs[schema]);
    const parentId = (state.patternSpecs[schema] ?? []).find((spec) => spec.parentId)?.parentId ?? null;
    diagnostics[schema] = missingIds.map((id) => {
      const data = state.expectedData[schema]?.[id] ?? {};
      const details = [];
      if (hints.typeKey) {
        const actual = findByKey(data, hints.typeKey)[0] ?? null;
        details.push(`${hints.typeKey}='${actual}' | expected: ${hints.expectedValues.join(', ')}`);
      }
      if (parentId) {
        const parents = findByKey(data, parentId);
        const parentPresent = valueList(parents).some((parent) => drawnIds.has(parent));
        if (!parentPresent) details.push(`parent '${parentId}' not present on pages`);
      }
      return {
        id,
        reason: details.length ? details.join('; ') : 'no rule matched'
      };
    });
  }

  const perPageSummary = Object.fromEntries(
    sortedValues(new Set(Object.keys(perPageTotal))).map((pageName) => {
      const pageSchemas = sortedValues(new Set([
        ...Object.keys(perPageTotal[pageName] ?? {}),
        ...Object.keys(perPageUnique[pageName] ?? {})
      ]));
      return [pageName, Object.fromEntries(pageSchemas.map((schema) => [
        schema,
        {
          drawn_unique: perPageUnique[pageName]?.[schema]?.size ?? 0,
          drawn_total: perPageTotal[pageName]?.[schema] ?? 0
        }
      ]))];
    })
  );
  const drawn = Object.fromEntries(
    sortedValues(new Set(Object.keys(drawnUnique)))
      .map((schema) => [schema, sortedValues(drawnUnique[schema] ?? [])])
  );

  return {
    summary,
    drawn,
    missing,
    extra,
    diagnostics,
    perPageSummary,
    allMatch: summary.every((item) => item.status === 'OK')
  };
}

export function logVerificationReport(report, logger) {
  logger.info(() => [
    'SEAF2DrawIO verification summary by schema',
    { title: 'summary', obj: report.summary }
  ]);

  for (const [schema, ids] of Object.entries(report.missing ?? {})) {
    logger.warn(() => `SEAF2DrawIO missing in diagram (${schema}): ${ids.join(', ')}`);
    logger.warn(() => [
      `SEAF2DrawIO diagnostics for missing items (${schema})`,
      { title: 'items', obj: report.diagnostics[schema] ?? [] }
    ]);
  }

  for (const [schema, ids] of Object.entries(report.extra ?? {})) {
    logger.warn(() => `SEAF2DrawIO extra in diagram (${schema}): ${ids.join(', ')}`);
  }

  logger.info(() => [
    'SEAF2DrawIO per-page summary',
    { title: 'pages', obj: report.perPageSummary }
  ]);
  logger.info(() => `SEAF2DrawIO verification result: ${report.allMatch ? 'GENERATION MATCHES YAML (by schema)' : 'GENERATION DIFFERS FROM YAML (by schema)'}`);
}
