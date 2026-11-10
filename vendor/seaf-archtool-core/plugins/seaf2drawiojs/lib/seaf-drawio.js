/* eslint-disable */
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
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2025, 2026
      Aksinenko Anatoly <aiaksinenko@sberbnak.ru>, Sber - 2026
*/

import xmlTool from 'xml2js';
import { SCHEMAS } from './constants';
import { buildLogicalLinkSteps, computedRouteLayerForTag, logicalRouteSettings } from './logical-routing';
import { findByKey, findCommonElement, hashString, matchesPatternFilters, matchesType, normalizeValues, getSchemaData, schemaMatches } from './utils';

const logger = DocHub.documents.getLoggerWithTag('seaf2drawiojs-lib');
const NETWORK_DEVICE_MIN_ROW_GAP = 120;
const NETWORK_DEVICE_ITEM_GAP = 20;
const LOCAL_MEMBER_SUFFIX = ' [локально]';
const MEMBERS_LABEL = 'Участники';

export class Seaf2Drawio {
  createdTagLayers = new Set();
  loggedDefaultTopologyLinks = new Set();
  providerWanLayout = {};
  userDeviceLayout = {};
  networkConnectionLayout = {};
  networkDeviceLayout = {};

  constructor(data, diagram) {
    this.parser = new xmlTool.Parser({
      explicitChildren: true,
      preserveChildrenOrder: true
    });
    this.data = data;
    this.diagram = diagram;
  }

  resetLayoutState() {
    this.providerWanLayout = {};
    this.userDeviceLayout = {};
    this.networkConnectionLayout = {};
    this.networkDeviceLayout = {};
    this.createdTagLayers.clear();
    this.loggedDefaultTopologyLinks.clear();
  }

  prepareElement(element) {
    const arr = [element];
    for (const ele of arr) {
      delete ele.$$;
      delete ele['#name'];
      for (const key in ele) {
        if (typeof ele[key] === 'object') {
          arr.push(ele[key]);
        }
      }
    }
  }

  getObjectsFromXml(xml, data) {
    xml = xml.replaceAll('{{', '[:[').replaceAll('}}', ']:]');
    const input = `<root>${xml}</root>`;
    let output = [];
    this.parser.parseString(input, (err, result) => {
      if (err) throw err;
      for (const ele of result.root.$$) {
        const xmlTag = ele['#name'];
        this.prepareElement(ele);
        if (xmlTag === 'object' && data) {
          ele.$ = {
            ...ele.$,
            ...data
          };
        }
        output.push({
          xmlTag,
          template: ele
        });
      }
    });
    return output;
  }

  /**
   * Returns objects from a schema namespace, filtered and optionally sorted by pattern options.
   * @param {*} data - Data to search in
   * @param {string} schema - Schema namespace to read from
   * @param {*} options - Options for filtering and sorting
   * @returns {Object} Objects keyed by id
   */
  getObjectsBySchema(schema, options) {
    let output = getSchemaData(this.data, schema);
    if (!output) return {};
    const arr = Object.entries(output).filter(([id, value]) => {
      return !this.isNetworkServiceMember(schema, value)
        && matchesType(value, options?.type)
        && matchesPatternFilters(id, value, options);
    }).map(([id, value]) => {
      return schemaMatches(schema, SCHEMAS.NETWORK_SERVICE)
        ? [id, this.networkServiceView(id, value)]
        : [id, value];
    });
    if (options?.sort) {
      arr.sort((a, b) => {
        const left = normalizeValues(findByKey(a[1], options.sort))[0] ?? '';
        const right = normalizeValues(findByKey(b[1], options.sort))[0] ?? '';
        return left.localeCompare(right);
      });
    }
    return Object.fromEntries(arr);
  }

  /** @param {string} schema @param {Object} value @returns {boolean} */
  isNetworkServiceMember(schema, value) {
    if (!schemaMatches(schema, SCHEMAS.COMPONENT_NETWORK)) return false;
    const services = getSchemaData(this.data, SCHEMAS.NETWORK_SERVICE);
    return normalizeValues(value?.is_part_of).some((serviceId) => services?.[serviceId]);
  }

  visibleEndpointId(objectId, diagramIds) {
    if (diagramIds.includes(objectId)) return objectId;
    const member = getSchemaData(this.data, SCHEMAS.COMPONENT_NETWORK)?.[objectId];
    const services = getSchemaData(this.data, SCHEMAS.NETWORK_SERVICE);
    const serviceId = normalizeValues(member?.is_part_of).find((id) => services?.[id]);
    return serviceId && diagramIds.includes(serviceId) ? serviceId : objectId;
  }

  /** @param {string} serviceId @returns {Array<[string, Object]>} */
  networkServiceMembers(serviceId) {
    return Object.entries(getSchemaData(this.data, SCHEMAS.COMPONENT_NETWORK))
      .filter(([, member]) => normalizeValues(member?.is_part_of).includes(serviceId));
  }

  /** @param {string|string[]} connectionIds @returns {string[]} */
  connectionSegments(connectionIds) {
    const networks = getSchemaData(this.data, SCHEMAS.NETWORK);
    return normalizeValues(connectionIds).flatMap((networkId) => normalizeValues(networks?.[networkId]?.segment));
  }

  /** @param {string} serviceId @param {Object} service @param {string[]|null} pageIds @returns {Object} */
  networkServiceView(serviceId, service, pageIds = null) {
    const members = this.networkServiceMembers(serviceId);
    const localMembers = pageIds
      ? members.filter(([, member]) => findCommonElement([
        ...normalizeValues(member.location),
        ...normalizeValues(member.segment)
      ], pageIds))
      : members;
    const localIds = new Set(localMembers.map(([memberId]) => memberId));
    const memberLines = members.map(([memberId, member]) => {
      const locations = normalizeValues(member.location).map((locationId) => {
        return this.getObjectById(locationId)?.title ?? locationId;
      });
      const details = [member.title ?? memberId, member.model, locations.join(', ')].filter(Boolean).join(' — ');
      return `• ${details}${pageIds && localIds.has(memberId) ? LOCAL_MEMBER_SUFFIX : ''}`;
    });
    const membersInfo = memberLines.length
      ? `${MEMBERS_LABEL} (${members.length}):\n${memberLines.join('\n')}`
      : `${MEMBERS_LABEL}: не указаны`;
    const renderSegment = [...new Set([
      ...normalizeValues(service.segment),
      ...members.flatMap(([, member]) => normalizeValues(member.segment)),
      ...this.connectionSegments(service.network_connection)
    ])];
    const membersCount = members.length;
    const membersLocalCount = localMembers.length;
    const title = pageIds && membersLocalCount < membersCount
      ? `${service.title ?? serviceId} · ${membersLocalCount}/${membersCount}`
      : service.title;

    return {
      ...service,
      title,
      members_count: membersCount,
      members_local_count: membersLocalCount,
      members: membersInfo,
      ha_mode: normalizeValues(service.high_availability?.mode)[0] ?? '',
      render_segment: renderSegment
    };
  }

  getObjectById(objectId) {
    if (!objectId) return {};
    for (const schemaData of Object.values(this.data ?? {})) {
      if (schemaData && typeof schemaData === 'object' && !Array.isArray(schemaData) && schemaData[objectId]) {
        return schemaData[objectId];
      }
    }
    return findByKey(this.data, objectId);
  }

  getParentValue(patternData, currentParent) {
    if (!(patternData.parent_key && currentParent)) return '';
    let output = '';
    if (patternData.parent_key) {
      const obj = this.getObjectById(currentParent);
      output = normalizeValues(findByKey(obj, patternData.parent_key))[0];
    }
    return output ?? '';
  }

  parentStackKey(patternData, currentParent) {
    if (!patternData.global_positioning || !patternData.parent_key) return currentParent;
    return this.getParentValue(patternData, currentParent) || currentParent;
  }

  parentZone(currentParent) {
    if (!currentParent) return '';
    const obj = this.getObjectById(currentParent);
    return String(normalizeValues(findByKey(obj, 'zone'))[0] ?? '').toUpperCase();
  }

  isProviderWanPattern(patternData) {
    return schemaMatches(patternData?.schema, SCHEMAS.NETWORK)
      && patternData?.type === 'type:WAN'
      && Array.isArray(patternData?.require_fields)
      && patternData.require_fields.includes('provider');
  }

  isUserDevicePattern(patternData) {
    return schemaMatches(patternData?.schema, SCHEMAS.COMPONENT_USER_DEVICE)
      && patternData?.parent_id === 'network_connection';
  }

  isNetworkDevicePattern(patternData) {
    return (schemaMatches(patternData?.schema, SCHEMAS.COMPONENT_NETWORK)
        && patternData?.parent_id === 'segment')
      || (schemaMatches(patternData?.schema, SCHEMAS.NETWORK_SERVICE)
        && patternData?.parent_id === 'render_segment');
  }

  mainProviderRootParent(currentParent, page = 'Main Schema') {
    const zone = this.parentZone(currentParent);
    if (zone === 'INTERNET') return page === 'Main Schema' ? 'INTERNET' : '003';
    if (zone === 'TRANSPORT-WAN') return page === 'Main Schema' ? 'TRANSPORT-WAN' : '004';
    return '';
  }

  layoutMainProviderWan(patternData, page, currentParent) {
    if (!this.isProviderWanPattern(patternData)) return null;
    const parentId = this.mainProviderRootParent(currentParent, page);
    if (!parentId) return null;

    const layoutKey = `${page}:${parentId}`;
    const state = this.providerWanLayout[layoutKey] ?? { count: 0 };
    this.providerWanLayout[layoutKey] = state;

    const colGap = patternData.provider_col_gap ?? 25;
    const rowGap = patternData.provider_row_gap ?? 15;
    const startX = ['TRANSPORT-WAN', '004'].includes(parentId)
      ? (patternData.provider_transport_x ?? 40)
      : (patternData.provider_internet_x ?? 40);
    const startY = patternData.provider_y ?? 45;
    const layoutHeight = patternData.provider_layout_height ?? 590;
    const rows = patternData.provider_rows
      ?? Math.max(1, Math.floor((layoutHeight - startY - patternData.h) / (patternData.h + rowGap)) + 1);
    const col = Math.floor(state.count / rows);
    const row = state.count % rows;
    state.count += 1;

    return {
      parentId,
      x: startX + col * (patternData.w + colGap),
      y: startY + row * (patternData.h + rowGap)
    };
  }

  layoutUserDevice(patternData, page, currentParent) {
    if (!this.isUserDevicePattern(patternData) || !currentParent) return null;

    const layoutKey = `${page}:${currentParent}`;
    const state = this.userDeviceLayout[layoutKey] ?? {
      count: 0,
      columns: patternData.user_device_columns ?? 4,
      colGap: patternData.user_device_col_gap ?? 120,
      rowGap: patternData.user_device_row_gap ?? 95,
      x: patternData.user_device_x ?? patternData.x ?? 300,
      y: patternData.user_device_y ?? patternData.y ?? 20
    };
    this.userDeviceLayout[layoutKey] = state;

    const col = state.count % state.columns;
    const row = Math.floor(state.count / state.columns);
    state.count += 1;

    return {
      x: state.x + col * state.colGap,
      y: state.y + row * state.rowGap
    };
  }

  /** @param {Object} patternData @param {string} page @param {string} currentParent @returns {{x:number,y:number}|null} */
  layoutNetworkConnection(patternData, page, currentParent) {
    if (!schemaMatches(patternData?.schema, SCHEMAS.NETWORK)
      || patternData?.parent_id !== 'segment'
      || this.isProviderWanPattern(patternData)
      || !currentParent) return null;

    const layoutKey = `${page}:${currentParent}`;
    const state = this.networkConnectionLayout[layoutKey] ?? {
      count: 0,
      columns: patternData.network_connection_columns ?? 2,
      colGap: patternData.network_connection_col_gap ?? 120,
      rowGap: patternData.network_connection_row_gap ?? 300,
      x: patternData.network_connection_x ?? patternData.x,
      y: patternData.network_connection_y ?? patternData.y
    };
    this.networkConnectionLayout[layoutKey] = state;
    const col = state.count % state.columns;
    const row = Math.floor(state.count / state.columns);
    state.count += 1;

    return { x: state.x + col * state.colGap, y: state.y + row * state.rowGap };
  }

  /** @param {Object} patternData @param {string} page @param {string} currentParent @returns {{x:number,y:number}|null} */
  layoutNetworkDevice(patternData, page, currentParent) {
    if (!this.isNetworkDevicePattern(patternData) || !currentParent) return null;

    const zone = this.parentZone(currentParent);
    const zoneLanes = patternData.network_device_x_by_zone ?? {
      'DMZ': 330,
      'INT-NET': 250,
      'INT-SECURITY-NET': 250
    };
    const x = Math.max(
      patternData.network_device_band_x ?? 170,
      patternData.network_device_x ?? zoneLanes[zone] ?? patternData.x
    );
    const rows = patternData.network_device_rows ?? 4;
    const colGap = patternData.network_device_col_gap ?? 130;
    const rowGap = Math.max(
      patternData.network_device_row_gap ?? 70,
      NETWORK_DEVICE_MIN_ROW_GAP,
      Number(patternData.h ?? 0) + NETWORK_DEVICE_ITEM_GAP
    );
    const layoutKey = `${page}:${currentParent}`;
    const state = this.networkDeviceLayout[layoutKey] ?? {
      count: 0,
      x,
      y: patternData.y,
      rows,
      colGap,
      rowGap
    };
    this.networkDeviceLayout[layoutKey] = state;
    const col = Math.floor(state.count / state.rows);
    const row = state.count % state.rows;
    state.count += 1;

    return { x: state.x + col * state.colGap, y: state.y + row * state.rowGap };
  }

  addOrUpdateObject(patternData, page, value, key, defaultPattern, diagramIds) {
    if (!diagramIds[page]) diagramIds[page] = [];
    if (schemaMatches(patternData?.schema, SCHEMAS.NETWORK_SERVICE)) {
      value = this.networkServiceView(key, value, diagramIds[page]);
    }
    if (this.diagram.hasObject(page, key)) {
      this.diagram.updateNode(page, key, value);
      if (!diagramIds[page].includes(key)) diagramIds[page].push(key);
      return;
    }

    let patternCount = 0; // Pattern count is used to detect first element among the children and to generate unique id
    let currentParent = '';
    let customLayout = null;
    const xmlDoc = this.getObjectsFromXml(patternData.xml);
    // Each xml template can have multiple xml elements inside.
    for (const xmlPattern of xmlDoc) {
      if (patternData?.parent_id) {
        if (findCommonElement(findByKey(value, patternData.parent_id), diagramIds[page])) {
          // If it is the first element, find the parent for the object.
          if (patternCount === 0) {
            const parentId = patternData.parent_id;
            const parentValue = findByKey(value, parentId);
            currentParent = findCommonElement(parentValue, diagramIds[page]);

            if (currentParent) {
              if (!diagramIds[page].includes(key)) {
                diagramIds[page].push(key);
              }
              // If the parent has changed, that means that we start new children stack.
              const parentStackKey = this.parentStackKey(patternData, currentParent);
              const shouldResetStack = patternData.global_positioning
                ? patternData.lastParent === ''
                : parentStackKey !== patternData.lastParent;
              if (shouldResetStack && parentId !== 'network_connection') {
                defaultPattern.parent = patternData.parent_key ? this.getParentValue(patternData, currentParent) : '';
                if (patternData.parent_key && defaultPattern.parent === '') {
                  logger.warn(() => `Parent value is empty for key ${key}`);
                }
                Object.assign(patternData, defaultPattern);
                patternData.lastParent = parentStackKey;
              }
            }
          }
        }
      }

      if (patternCount === 0) {
        const mainProviderLayout = this.layoutMainProviderWan(patternData, page, currentParent);
        const userDeviceLayout = this.layoutUserDevice(patternData, page, currentParent);
        const networkConnectionLayout = mainProviderLayout || userDeviceLayout
          ? null
          : this.layoutNetworkConnection(patternData, page, currentParent);
        const networkDeviceLayout = mainProviderLayout || userDeviceLayout || networkConnectionLayout
          ? null
          : this.layoutNetworkDevice(patternData, page, currentParent);
        if (mainProviderLayout || userDeviceLayout || networkConnectionLayout) {
          customLayout = {
            parentId: mainProviderLayout?.parentId ?? currentParent,
            x: mainProviderLayout?.x ?? userDeviceLayout?.x ?? networkConnectionLayout?.x,
            y: mainProviderLayout?.y ?? userDeviceLayout?.y ?? networkConnectionLayout?.y,
            skipOffset: true
          };
        } else if (networkDeviceLayout) {
          customLayout = {
            parentId: currentParent,
            x: networkDeviceLayout.x,
            y: networkDeviceLayout.y,
            skipOffset: true
          };
        }
      }
      const renderedParentId = customLayout?.parentId ?? currentParent;
      const renderedX = customLayout?.x ?? patternData.x;
      const renderedY = customLayout?.y ?? patternData.y;

      const renderedVars = {
        ...value,
        ...(customLayout && patternData.parent_id && patternData.parent_id !== 'network_connection'
          ? { [patternData.parent_id]: renderedParentId }
          : {}),
        'Group_ID': `${key}_0`,
        parent_id: renderedParentId,
        parent_type: defaultPattern.parent,
        description: value.description ?? ''
      };
      xmlPattern.primaryVars = {
        ...value,
        'Group_ID': `${key}_0`,
        parent_id: renderedParentId,
        parent_type: defaultPattern.parent,
        description: value.description ?? ''
      };
      xmlPattern.renderVars = renderedVars;
      value['OID'] = key;

      if (diagramIds[page]?.includes(key)) {
        if (value.id) {
          value.sid = value.id;
          value.id = null;
        }
        value.schema = patternData.schema;

        if (value.parent_tmp) {
          value.parent_tmp = null;
        }

        const isObject = xmlPattern.xmlTag === 'object';
        const objKey = isObject ? key : `${key}_${patternCount}`;

        xmlPattern.secondaryVars = {
          id: objKey,
          label: value.title,
          x_pos: renderedX,
          y_pos: renderedY,
          width: patternData.w,
          height: patternData.h,
          url: patternData.ext_page ?? value.title
        };

        isObject && Object.assign(xmlPattern.template.$, value);

        this.diagram.addObject(
          page,
          xmlPattern,
          objKey
        );

      }
        if (patternCount === 0 && !customLayout?.skipOffset) {
          this.positionOffset(patternData);
        }
        patternCount++;
    }
  }

  logicalLinkSteps(linkOid, linkData, patternData, pageName, allowedNodeIds = null) {
    return buildLogicalLinkSteps({
      linkOid,
      linkData,
      targetsKey: patternData.targets,
      pageName,
      sourceData: this.data,
      layoutSettings: this.diagram?.layoutSettings,
      logger,
      loggedDefaultTopologyLinks: this.loggedDefaultTopologyLinks,
      allowedNodeIds
    }).map((step) => ({
      ...step,
      linkId: `link_id:${pageName}:logical:${linkOid}:${step.topology}:${step.stepIndex}:${step.sourceId}_${step.targetId}`
    }));
  }

  tagLayerId(tag) {
    const normalized = String(tag ?? '').trim().replace(/[^A-Za-z0-9_.-]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
    return `layer.logical.${normalized || hashString(tag)}`;
  }

  ensureTagLayer(pageName, tag) {
    const layerId = this.tagLayerId(tag);
    this.diagram.addLayer(pageName, layerId, String(tag));
    const logKey = `${pageName}:${layerId}`;
    if (!this.createdTagLayers.has(logKey)) {
      logger.info(() => `Created logical link tag layer "${tag}" (${layerId}) on page "${pageName}"`);
      this.createdTagLayers.add(logKey);
    }
    return layerId;
  }

  ensureComputedRouteLayer(pageName, routeSettings, tag = null) {
    const layer = computedRouteLayerForTag(routeSettings, tag);
    this.diagram.addLayer(pageName, layer.layerId, layer.layerLabel, layer.layerHidden);
    return layer.layerId;
  }

  setLinkParent(xmlObject, parentId) {
    const stack = [xmlObject.template];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== 'object') continue;
      if (node.$?.edge === '1') {
        node.$.parent = parentId;
        return;
      }
      for (const value of Object.values(node)) {
        if (Array.isArray(value)) stack.push(...value);
        else if (value && typeof value === 'object') stack.push(value);
      }
    }
  }

  resolveLinkStyle(patternData, linkData, logicalLink = false) {
    if (!logicalLink) return patternData.style ?? '';
    const key = `style${linkData.direction}`;
    return patternData[key] ?? patternData.style ?? '';
  }

  /** @param {Object} linkData @param {string} sourceId @param {string} targetId @returns {string} */
  linkLabel(linkData, sourceId, targetId) {
    const title = String(linkData.title ?? '').trim();
    if (!title) return '';
    const endpointTitles = [sourceId, targetId]
      .map((id) => String(this.getObjectById(id)?.title ?? '').trim());
    return endpointTitles.includes(title) ? '' : title;
  }

  linkDataForStep(linkData, step) {
    if (!step.computedRoute) return linkData;
    return {
      ...linkData,
      title: step.routeSegmentIndex === 0 ? linkData.title : '',
      computed_route: 'true',
      route_expanded: step.routeExpanded ? 'true' : 'false',
      route_path: step.routePath,
      route_source: step.routeSourceId,
      route_target: step.routeTargetId,
      route_step_index: step.routeStepIndex,
      route_segment_index: step.routeSegmentIndex,
      route_segment_count: step.routeSegmentCount,
      route_failed: step.routeFailed ? 'true' : undefined
    };
  }

  addRenderedLink(pageName, patternData, linkData, sourceId, targetId, linkId, parentLayerId = null) {
    const xmlObjects = this.getObjectsFromXml(patternData.xml, linkData);
    const style = this.resolveLinkStyle(patternData, linkData, Boolean(linkData.logical_link));
    for (const xmlObjectBase of xmlObjects) {
      const xmlObject = structuredClone(xmlObjectBase);
      if (parentLayerId) this.setLinkParent(xmlObject, parentLayerId);
      xmlObject.primaryVars = {
        id: parentLayerId ? `${linkId}:${parentLayerId}` : linkId,
        style,
        label: this.linkLabel(linkData, sourceId, targetId),
        source: sourceId,
        target: targetId,
        source_id: sourceId,
        target_id: targetId
      };
      this.diagram.addLinks(pageName, xmlObject);
    }
  }

  addLinks(patternData, pageName, diagramIds, options, pendingMissingLinks) {
    const objects = this.getObjectsBySchema(patternData.schema, { ...patternData, type: patternData.type });
    const drawnPairs = new Set();

    for (let [key, target] of Object.entries(objects)) {
      if (options?.logical_link) {
        const linkOid = key;
        const linkData = {
          ...target,
          OID: linkOid,
          schema: patternData.schema,
          logical_link: true
        };
        const pageObjectIds = diagramIds[pageName] ?? [];
        const visibleLinkData = {
          ...linkData,
          source: this.visibleEndpointId(linkData.source, pageObjectIds),
          [patternData.targets]: normalizeValues(linkData[patternData.targets])
            .map((targetId) => this.visibleEndpointId(targetId, pageObjectIds))
        };
        const routeSettings = logicalRouteSettings(this.diagram?.layoutSettings);
        for (const step of this.logicalLinkSteps(linkOid, visibleLinkData, patternData, pageName, pageObjectIds)) {
          if (diagramIds[pageName]?.includes(step.sourceId) && diagramIds[pageName]?.includes(step.targetId)) {
            const tags = normalizeValues(linkData.tags);
            const stepLinkData = this.linkDataForStep(visibleLinkData, step);
            if (step.computedRoute) {
              const computedTags = tags.length ? tags : [null];
              for (const tag of computedTags) {
                const layerId = this.ensureComputedRouteLayer(pageName, routeSettings, tag);
                this.addRenderedLink(pageName, patternData, stepLinkData, step.sourceId, step.targetId, step.linkId, layerId);
              }
            } else if (tags.length) {
              for (const tag of tags) {
                const layerId = this.ensureTagLayer(pageName, tag);
                this.addRenderedLink(pageName, patternData, stepLinkData, step.sourceId, step.targetId, step.linkId, layerId);
              }
            } else {
              this.addRenderedLink(pageName, patternData, stepLinkData, step.sourceId, step.targetId, step.linkId);
            }
          } else if (diagramIds[pageName]?.includes(step.sourceId) || diagramIds[pageName]?.includes(step.targetId)) {
            pendingMissingLinks?.push({
              type: 'logical',
              pageName,
              linkOid,
              sourceId: step.sourceId,
              targetId: step.targetId,
              topology: linkData.topology,
              reason: 'endpoint_missing_on_page'
            });
          }
        }
        continue;
      }

      if (options?.network_link) {
        target.OID = target.OID ?? key;
        target.schema = target.schema ?? SCHEMAS.NETWORK_LINK;
        const connections = normalizeValues(target[patternData?.targets]).filter(Boolean);
        if (connections.length < 2) continue;
        const anchor = connections.find((ele) => diagramIds[pageName].includes(ele));
        if (!anchor) {
          // this here means that no objects for the link is found on the current page
          for (let i = 1; i < connections.length; i++) {
            pendingMissingLinks?.push({
              type: 'network',
              pageName,
              linkOid: key,
              sourceId: connections[0],
              targetId: connections[i],
              reason: 'no_endpoint_on_page'
            });
          }
          continue;
        }
        const stylePattern = target.technology ? patternData[`style.${target.technology}`] : null;
        const linkPattern = { ...patternData, style: stylePattern ?? patternData.style };
        for (const targetKey of connections) {
          if (targetKey === anchor) continue;
          const pairKey = [anchor, targetKey].sort().join('::');
          if (drawnPairs.has(pairKey)) continue;
          if (diagramIds[pageName].includes(targetKey)) {
            this.addRenderedLink(pageName, linkPattern, target, anchor, targetKey, `link_id:${pageName}:network:${key}:${anchor}_${targetKey}`);
          } else {
            pendingMissingLinks?.push({
              type: 'network',
              pageName,
              linkOid: key,
              sourceId: anchor,
              targetId: targetKey,
              reason: 'target_missing_on_page'
            });
          }
          drawnPairs.add(pairKey);
        }
        continue;
      }

      if (diagramIds[pageName]?.includes(key)) {
        if (patternData?.parent_id) {
          const parentValue = normalizeValues(target[patternData.parent_id]);
          target = { [patternData.targets]: parentValue.map((value) => this.getParentValue(patternData, value)).filter(Boolean) };
        }
        for (let targetKey of normalizeValues(target[patternData.targets])) {
          if (Array.isArray(targetKey)) {
            targetKey = targetKey[0];
          }
          if (diagramIds[pageName]?.includes(targetKey)) {
            const type = !options ? 'generic' : options.network_link ? 'network' : 'generic';
            const id = `link_id:${pageName}:${type}:${key}_${targetKey}`;
            this.addRenderedLink(pageName, patternData, target, key, targetKey, id);
          }
        }
      }
    }
  }

  returnReady(patternData) {
    patternData.count++;
    if (patternData.count === patternData.deep) {
      patternData.count = 0;
    }
    return !patternData.count;
  }

  positionOffset(patternData) {
    switch (patternData.algo) {
      case 'Y+':
        // По оси Y cверху вниз относительно родительского объекта
        if (this.returnReady(patternData)) {
          patternData.x = patternData.x + patternData.w + patternData.offset;
          patternData.y =
            patternData.y -
            (patternData.h + patternData.offset) * patternData.deep;
        }
        patternData.y = patternData.y + patternData.h + patternData.offset;
        break;

      case 'Y-':
        if (this.returnReady(patternData)) {
          patternData.x = patternData.x + patternData.w + patternData.offset;
          patternData.y =
            patternData.y +
            (patternData.h + patternData.offset) * patternData.deep;
        }
        patternData.y = patternData.y - patternData.h - patternData.offset;
        break;

      case 'X-':
        if (this.returnReady(patternData)) {
          patternData.y = patternData.y + patternData.h + patternData.offset;
          patternData.x =
            patternData.x +
            (patternData.w + patternData.offset) * patternData.deep;
        }
        patternData.x = patternData.x - patternData.w - patternData.offset;
        break;

      case 'X+':
        // По оси X слева направо
        if (this.returnReady(patternData)) {
          patternData.y = patternData.y + patternData.h + patternData.offset;
          patternData.x =
            patternData.x -
            (patternData.w + patternData.offset) * patternData.deep;
        }
        patternData.x = patternData.x + patternData.w + patternData.offset;
        break;
    }
  }
};
