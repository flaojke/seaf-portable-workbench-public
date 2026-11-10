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
*/

import { SCHEMAS } from './constants';
import { getSchemaData, hashString, normalizeValues, schemaMatches } from './utils';

const ROUTABLE_SCHEMAS = Object.values(SCHEMAS).filter((schema) => schema !== SCHEMAS.LOGICAL_LINK);
const DIRECT_ROUTE_MODES = new Set(['', 'direct', 'none', 'false', 'off']);
const SHORTEST_ROUTE_MODES = new Set(['shortest', 'computed', 'route', 'routed', 'path', 'expanded']);
const DEFAULT_COMPUTED_ROUTE_LAYER_LABEL = 'Расчетные связи';
const DEFAULT_COMPUTED_ROUTE_LAYER_ID = 'layer.logical.computed.routes';
const COMPUTED_ROUTE_TAG_LAYER_SUFFIX = 'рассчитанные связи';

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function booleanValue(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on', 'enabled'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'off', 'disabled'].includes(normalized)) return false;
  return defaultValue;
}

function normalizedLayerKey(value) {
  return String(value ?? '')
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function normalizedLayerId(label) {
  const normalized = normalizedLayerKey(label);
  return `layer.logical.computed.${normalized || hashString(label)}`;
}

export function logicalRouteSettings(layoutSettings = {}) {
  const logicalSettings = layoutSettings?.logical_links ?? layoutSettings?.logicalLinks ?? {};
  const raw = logicalSettings?.computed_routes ?? logicalSettings?.computedRoutes ?? {};
  const layerLabel = firstDefined(raw.layer, raw.layer_name, raw.layerName, DEFAULT_COMPUTED_ROUTE_LAYER_LABEL);
  const maxDepth = Number(firstDefined(raw.max_depth, raw.maxDepth, 64));
  const explicitLayerId = firstDefined(raw.layer_id, raw.layerId);
  const routeMode = String(firstDefined(
    raw.route_mode,
    raw.routeMode,
    raw.default_route_mode,
    raw.defaultRouteMode,
    ''
  )).trim().toLowerCase();
  const layerId = explicitLayerId
    ?? (layerLabel === DEFAULT_COMPUTED_ROUTE_LAYER_LABEL
      ? DEFAULT_COMPUTED_ROUTE_LAYER_ID
      : normalizedLayerId(layerLabel));
  return {
    enabled: booleanValue(firstDefined(raw.enabled, raw.enable), false),
    showIntermediate: booleanValue(firstDefined(raw.show_intermediate, raw.showIntermediate), true),
    fallback: String(firstDefined(raw.fallback, 'direct')).toLowerCase(),
    layerLabel,
    layerId,
    layerHidden: booleanValue(firstDefined(raw.layer_hidden, raw.layerHidden), true),
    maxDepth: Number.isFinite(maxDepth) && maxDepth > 0 ? maxDepth : 64,
    routeMode
  };
}

export function commonComputedRouteLayerId(routeSettings) {
  const layerId = typeof routeSettings === 'string' ? routeSettings : routeSettings.layerId;
  return `common_${layerId}`;
}

export function computedRouteLayerForTag(routeSettings, tag = null) {
  const tagLabel = String(tag ?? '').trim();
  if (!tagLabel) {
    return {
      layerId: routeSettings.layerId,
      layerLabel: routeSettings.layerLabel,
      layerHidden: routeSettings.layerHidden
    };
  }
  const normalized = normalizedLayerKey(tagLabel);
  return {
    layerId: `layer.logical.computed.${normalized || hashString(tagLabel)}.routes`,
    layerLabel: `${tagLabel} ${COMPUTED_ROUTE_TAG_LAYER_SUFFIX}`,
    layerHidden: routeSettings.layerHidden
  };
}

function addNode(graph, id, meta = {}) {
  if (!id) return;
  const nodeId = String(id);
  if (!graph.nodes[nodeId]) graph.nodes[nodeId] = { id: nodeId, ...meta };
  if (!graph.adj[nodeId]) graph.adj[nodeId] = new Set();
}

function addEdge(graph, sourceId, targetId, meta = {}) {
  if (!sourceId || !targetId || sourceId === targetId) return;
  const source = String(sourceId);
  const target = String(targetId);
  addNode(graph, source);
  addNode(graph, target);
  graph.adj[source].add(target);
  graph.adj[target].add(source);
  graph.edges[`${source}\u0000${target}`] = meta;
  graph.edges[`${target}\u0000${source}`] = meta;
}

function addNetworkLinkEdges(graph, sourceData) {
  const networkLinks = getSchemaData(sourceData, SCHEMAS.NETWORK_LINK);
  for (const [linkId, linkData] of Object.entries(networkLinks ?? {})) {
    const connections = normalizeValues(linkData?.network_connection).filter(Boolean);
    if (connections.length < 2) continue;
    for (const networkId of connections) addNode(graph, networkId, { schema: SCHEMAS.NETWORK });
    for (let index = 1; index < connections.length; index++) {
      addEdge(graph, connections[0], connections[index], {
        type: 'network_link',
        linkId
      });
    }
  }
}

export function buildNetworkGraph(sourceData) {
  const graph = { nodes: {}, adj: {}, edges: {} };
  for (const schema of ROUTABLE_SCHEMAS) {
    const objects = getSchemaData(sourceData, schema);
    for (const [objectId, objectData] of Object.entries(objects ?? {})) {
      addNode(graph, objectId, { schema });
      if (schemaMatches(schema, SCHEMAS.NETWORK_LINK)) continue;
      for (const networkId of normalizeValues(objectData?.network_connection).filter(Boolean)) {
        addEdge(graph, objectId, networkId, {
          type: 'network_connection',
          schema
        });
      }
      for (const connectionDeviceId of normalizeValues(objectData?.network_connection_devices).filter(Boolean)) {
        addEdge(graph, objectId, connectionDeviceId, {
          type: 'network_connection_devices',
          schema
        });
      }
    }
  }
  addNetworkLinkEdges(graph, sourceData);
  return graph;
}

function allowedNodeSet(allowedNodeIds) {
  if (!allowedNodeIds) return null;
  const values = Array.isArray(allowedNodeIds) ? allowedNodeIds : [...allowedNodeIds];
  const normalized = values.filter(Boolean).map(String);
  return normalized.length ? new Set(normalized) : null;
}

function shortestPath(graph, sourceId, targetId, maxDepth, allowedNodes = null) {
  if (!sourceId || !targetId) return null;
  const source = String(sourceId);
  const target = String(targetId);
  if (!graph.adj[source] || !graph.adj[target]) return null;
  if (source === target) return [source];

  const queue = [[source]];
  const visited = new Set([source]);
  while (queue.length) {
    const path = queue.shift();
    const current = path[path.length - 1];
    if (path.length > maxDepth) continue;
    const neighbors = [...(graph.adj[current] ?? [])].sort();
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      if (allowedNodes && neighbor !== target && !allowedNodes.has(neighbor)) continue;
      const nextPath = [...path, neighbor];
      if (neighbor === target) return nextPath;
      visited.add(neighbor);
      queue.push(nextPath);
    }
  }
  return null;
}

function routeThroughWaypoints(graph, waypoints, maxDepth, allowedNodes = null) {
  const cleanWaypoints = waypoints.filter(Boolean).map(String);
  if (cleanWaypoints.length < 2) return null;
  let result = [];
  for (let index = 1; index < cleanWaypoints.length; index++) {
    const legPath = shortestPath(graph, cleanWaypoints[index - 1], cleanWaypoints[index], maxDepth, allowedNodes);
    if (!legPath) return null;
    result = result.length ? [...result, ...legPath.slice(1)] : legPath;
  }
  return result;
}

export function normalizeLogicalTopology(linkOid, linkData, pageName, logger, loggedDefaultTopologyLinks) {
  const rawTopology = linkData?.topology;
  let topology = String(rawTopology || 'star').toLowerCase();
  if (!rawTopology && loggedDefaultTopologyLinks && !loggedDefaultTopologyLinks.has(linkOid)) {
    logger?.info?.(() => `logical_link ${linkOid} on page "${pageName}": topology is not set, using star`);
    loggedDefaultTopologyLinks.add(linkOid);
  }
  if (!['star', 'chain'].includes(topology)) {
    logger?.warn?.(() => `logical_link ${linkOid} on page "${pageName}": unknown topology "${rawTopology}", using star`);
    topology = 'star';
  }
  if (linkData) linkData.topology = topology;
  return topology;
}

function directPairs(sourceId, targetIds, topology) {
  if (topology === 'chain') {
    return targetIds.map((targetId, index) => [index === 0 ? sourceId : targetIds[index - 1], targetId]);
  }
  return targetIds.map((targetId) => [sourceId, targetId]);
}

function linkRouteMode(linkData, routeSettings = {}) {
  const linkMode = String(firstDefined(
    linkData?.route_mode,
    linkData?.routeMode,
    linkData?.path_mode,
    linkData?.pathMode,
    ''
  )).trim().toLowerCase();
  return linkMode || routeSettings.routeMode || '';
}

function linkRequestsShortestRoute(linkData, routeSettings) {
  if (!routeSettings.enabled) return false;
  const routeMode = linkRouteMode(linkData, routeSettings);
  if (DIRECT_ROUTE_MODES.has(routeMode)) {
    return booleanValue(firstDefined(
      linkData?.expand_route,
      linkData?.expandRoute,
      linkData?.computed_route,
      linkData?.computedRoute,
      linkData?.resolve_path,
      linkData?.resolvePath
    ), false);
  }
  if (SHORTEST_ROUTE_MODES.has(routeMode)) return true;
  return booleanValue(firstDefined(
    linkData?.expand_route,
    linkData?.expandRoute,
    linkData?.computed_route,
    linkData?.computedRoute,
    linkData?.resolve_path,
    linkData?.resolvePath
  ), false);
}

function routeMetadata(path, baseSourceId, baseTargetId, baseStepIndex, segmentIndex, expanded) {
  return {
    computedRoute: true,
    routeExpanded: expanded,
    routePath: path.join(' -> '),
    routeSourceId: baseSourceId,
    routeTargetId: baseTargetId,
    routeStepIndex: baseStepIndex,
    routeSegmentIndex: segmentIndex,
    routeSegmentCount: Math.max(0, path.length - 1)
  };
}

function failedRouteMetadata(baseSourceId, baseTargetId, baseStepIndex) {
  return {
    computedRoute: true,
    routeExpanded: false,
    routeFailed: true,
    routeSourceId: baseSourceId,
    routeTargetId: baseTargetId,
    routeStepIndex: baseStepIndex,
    routeSegmentIndex: 0,
    routeSegmentCount: 1
  };
}

export function buildLogicalLinkSteps({
  linkOid,
  linkData,
  targetsKey = 'target',
  pageName = '',
  sourceData = {},
  layoutSettings = {},
  graph = null,
  logger = null,
  loggedDefaultTopologyLinks = null,
  allowedNodeIds = null
}) {
  const sourceId = linkData?.source;
  const targetIds = normalizeValues(linkData?.[targetsKey]).filter(Boolean);
  if (!sourceId || !targetIds.length) return [];

  const topology = normalizeLogicalTopology(linkOid, linkData, pageName, logger, loggedDefaultTopologyLinks);
  const routeSettings = logicalRouteSettings(layoutSettings);
  const shouldRoute = linkRequestsShortestRoute(linkData, routeSettings);
  const networkGraph = shouldRoute ? (graph ?? buildNetworkGraph(sourceData)) : null;
  const allowedNodes = shouldRoute && routeSettings.showIntermediate ? allowedNodeSet(allowedNodeIds) : null;
  const via = normalizeValues(firstDefined(linkData?.via, linkData?.hops, linkData?.waypoints)).filter(Boolean);
  const steps = [];

  directPairs(sourceId, targetIds, topology).forEach(([baseSourceId, baseTargetId], baseStepIndex) => {
    if (!shouldRoute) {
      steps.push({
        sourceId: baseSourceId,
        targetId: baseTargetId,
        topology,
        stepIndex: steps.length,
        baseStepIndex,
        computedRoute: false
      });
      return;
    }

    const path = routeThroughWaypoints(networkGraph, [baseSourceId, ...via, baseTargetId], routeSettings.maxDepth, allowedNodes);
    if (!path || path.length < 2) {
      if (!allowedNodes || allowedNodes.has(String(baseSourceId)) || allowedNodes.has(String(baseTargetId))) {
        logger?.warn?.(() => `logical_link ${linkOid} on page "${pageName}": can't resolve shortest route ${baseSourceId} -> ${baseTargetId}`);
      }
      if (routeSettings.fallback !== 'skip') {
        steps.push({
          sourceId: baseSourceId,
          targetId: baseTargetId,
          topology,
          stepIndex: steps.length,
          baseStepIndex,
          ...failedRouteMetadata(baseSourceId, baseTargetId, baseStepIndex)
        });
      }
      return;
    }

    if (!routeSettings.showIntermediate) {
      steps.push({
        sourceId: baseSourceId,
        targetId: baseTargetId,
        topology,
        stepIndex: steps.length,
        baseStepIndex,
        ...routeMetadata(path, baseSourceId, baseTargetId, baseStepIndex, 0, false)
      });
      return;
    }

    for (let routeIndex = 1; routeIndex < path.length; routeIndex++) {
      steps.push({
        sourceId: path[routeIndex - 1],
        targetId: path[routeIndex],
        topology,
        stepIndex: steps.length,
        baseStepIndex,
        ...routeMetadata(path, baseSourceId, baseTargetId, baseStepIndex, routeIndex - 1, true)
      });
    }
  });

  return steps;
}
