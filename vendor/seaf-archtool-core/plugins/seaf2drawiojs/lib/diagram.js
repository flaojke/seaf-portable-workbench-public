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

import mustache from 'mustache';
import xmlTool from 'xml2js';
import { DRAWIO_XML_END, DRAWIO_XML_START, LAYOUT_NODE_DEFAULT_HEIGHT, LAYOUT_NODE_DEFAULT_WIDTH, LAYOUT_SECURITY_ZONE_HINTS, LAYOUT_TARGET_SCHEMAS, LAYOUT_ZONE_RULES, SCHEMAS } from './constants';
import { buildLogicalLinkSteps, commonComputedRouteLayerId, computedRouteLayerForTag, logicalRouteSettings } from './logical-routing';
import { hashString, normalizeValues, schemaMatches, getSchemaData, getSchemaObject } from './utils';
import { manualRouteIds } from './transformations';

const logger = DocHub.documents.getLoggerWithTag('seaf2drawiojs-draftsman');
const GEOMETRY_ATTRS_KEY = 'geometry_attr_key';
const SECURITY_SERVICES_LAYER_ID = '101';
const SECURITY_SERVICES_LAYER_LABEL = 'Сервисы КБ';
const TECH_SERVICES_LAYER_ID = '102';
const TECH_SERVICES_LAYER_LABEL = 'Tех. сервисы';
const APPLICATION_COMPONENTS_LAYER_ID = '103';
const APPLICATION_COMPONENTS_LAYER_LABEL = 'Прикладные компоненты';
const ROOT_CELL_ID = '0';
const MAIN_LAYER_ID = '1';
const COMMON_NETWORK_LAYER_ID = '100';
const LOCATION_CONTAINER_ID = '001';
const CARRIER_INTERNET_LAYER_ID = '003';
const CARRIER_TRANSPORT_LAYER_ID = '004';
const CARRIER_INTERNET_ZONE = 'INTERNET';
const CARRIER_TRANSPORT_ZONE = 'TRANSPORT-WAN';
const EXTERNAL_SERVICES_ID = 'EXTERNAL-SERVICES';
const EXTERNAL_SERVICES_LABEL = 'Внешние сервисы';
const EXTERNAL_USER_DEVICES_LABEL = 'Внешние пользовательские устройства';
const EXTERNAL_SERVICES_STYLE = 'rounded=1;arcSize=16;absoluteArcSize=1;whiteSpace=wrap;html=1;container=0;dashed=1;dashPattern=6 4;strokeColor=#94A3B8;strokeWidth=1;fillColor=none;verticalAlign=top;align=left;spacingTop=8;spacingLeft=10;spacingRight=8;spacingBottom=8;fontFamily=Helvetica;fontSize=11;fontStyle=1;fontColor=#334155;labelBackgroundColor=#FFFFFF;';
const CARRIER_LAYER_IDS = [CARRIER_INTERNET_LAYER_ID, CARRIER_TRANSPORT_LAYER_ID];
const CARRIER_CONTAINER_IDS = [CARRIER_INTERNET_ZONE, CARRIER_TRANSPORT_ZONE];
const CARRIER_ZONES = [CARRIER_INTERNET_ZONE, CARRIER_TRANSPORT_ZONE];
const CARRIER_PARENT_IDS = new Set([...CARRIER_LAYER_IDS, ...CARRIER_CONTAINER_IDS]);
const SERVICE_LAYER_IDS = new Set([
  SECURITY_SERVICES_LAYER_ID,
  TECH_SERVICES_LAYER_ID,
  APPLICATION_COMPONENTS_LAYER_ID
]);
const VISIBLE_LOGICAL_LAYER_ID = 'layer.logical.visible';
const VISIBLE_LOGICAL_LAYER_LABEL = 'Связи без тегов';
const LOGICAL_LAYER_NAME_COLLATOR = new Intl.Collator('ru', { numeric: true });
const COMMON_LOGICAL_LINK_STYLES = {
  '==>': 'edgeStyle=orthogonalEdgeStyle;curved=1;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;exitX=1;exitY=0.25;exitDx=0;exitDy=0;strokeColor=#0057B8;strokeWidth=4;dashed=1;dashPattern=8 4;endArrow=block;endFill=1;jumpStyle=arc;',
  '<==>': 'edgeStyle=orthogonalEdgeStyle;curved=1;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#008A00;strokeWidth=4;dashed=1;dashPattern=8 4;startArrow=block;startFill=1;endArrow=block;endFill=1;jumpStyle=arc;',
  '<==': 'edgeStyle=orthogonalEdgeStyle;curved=1;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#C00000;strokeWidth=4;dashed=1;dashPattern=8 4;startArrow=block;startFill=1;endArrow=none;jumpStyle=arc;'
};
const CONSTANTS = {
  GROUP_STYLE: 'rounded=1;arcSize=25;absoluteArcSize=1;dashed=1;html=1;whiteSpace=wrap;strokeColor=#7f8c8d;strokeWidth=1;fillColor=none;align=left;verticalAlign=top;spacingTop=6;spacingLeft=10;spacingRight=8;spacingBottom=6;fontFamily=Helvetica;fontSize=12;fontColor=#323130;',
  GAP_X: 20,
  GAP_Y: 20,
  PAD_X: 20,
  PAD_Y: 12,
  HEADER_H: 22,
  SEGMENT_PADDING_X: 20,
  SEGMENT_PADDING_RIGHT: 20,
  TECH_GAP_TOP: 40,
  ROW_GAP: 32,
  COL_GAP: 32,
  BOTTOM_MARGIN: 40,
  MAX_COLS: 4,
  MIN_CONTAINER_WIDTH: 170,
  APPEND_RIGHT_GAP: 40,
  LABEL_CHAR_WIDTH: 5.5,
  SERVICE_GROUP_GAP: 140,
  EXTERNAL_SERVICES_GAP: 20,
  EXTERNAL_SERVICES_HEADER_HEIGHT: 45,
  EXTERNAL_SERVICES_SLOT_WIDTH: 120
};

export default class Diagram {
  diagrams = {};
  data = {};
  indices = {};
  constants = {};
  targetSchemas = {};
  objects = {};
  links = {};

  constructor(layoutSettings, sourceData) {
    this.layoutSettings = layoutSettings ?? {};
    this.sourceData = sourceData ?? {};
    this.commonLocationSourcePages = [];
    this.constants = { ...CONSTANTS, ...layoutSettings?.constants };
    this.targetSchemas = { ...LAYOUT_TARGET_SCHEMAS, ...layoutSettings?.target_schemas };
    this.nodeDefaultWidth = layoutSettings?.node_default_width ?? LAYOUT_NODE_DEFAULT_WIDTH;
    this.nodeDefaultHeight = layoutSettings?.node_default_height ?? LAYOUT_NODE_DEFAULT_HEIGHT;
    this.zoneRules = { ...LAYOUT_ZONE_RULES, ...layoutSettings?.zone_rules };
    this.securityZoneHints = { ...LAYOUT_SECURITY_ZONE_HINTS, ...layoutSettings?.security_zone_hints };
  }

  getFloatAttribute(xmlElement, name, defaultValue = 0) {
    const result = parseFloat(xmlElement?.getAttribute(name));
    return isNaN(result) ? defaultValue : result;
  }

  getFloatGeometryAttribute(xmlElement, name, defaultValue = 0) {
    const geom = xmlElement?.querySelector('mxGeometry');
    return this.getFloatAttribute(geom, name, defaultValue);
  }

  addDiagram(id, name, pattern) {
    const rootIndex = pattern.indexOf('</root>');
    const start = pattern.slice(0, rootIndex);
    const end = pattern.slice(rootIndex);
    this.diagrams[name] = { id, name, start, end };
    this.data[name] = {};
  }

  addObject(page, xmlPattern, key) {
    if (!this.data[page]) this.data[page] = {};
    if (!this.data[page][key]) this.data[page][key] = xmlPattern;
  }

  addLinks(page, xmlDoc) {
    if (!this.data[page]) this.data[page] = {};
    if (!this.links[page]) this.links[page] = {};
    const key = xmlDoc.primaryVars.id;
    if (!this.data[page][key]) {
      this.data[page][key] = { ...xmlDoc };
      this.links[page][key] = xmlDoc;
    }
  }

  addLayer(page, layerId, label, hidden = true) {
    if (!this.data[page]) this.data[page] = {};
    if (this.data[page][layerId]) return;
    this.data[page][layerId] = {
      xmlTag: 'mxCell',
      template: {
        $: {
          id: layerId,
          value: label,
          parent: '0',
          ...(hidden ? { visible: '0' } : {})
        }
      },
      primaryVars: {},
      secondaryVars: {}
    };
  }

  addContainer(document, rootElement, segmentId, groupId, label, absX, absY, width, height, style = this.constants.GROUP_STYLE) {
    const cell = document.createElement('mxCell');
    const attributes = {
      id: groupId,
      value: `<div><b>${label}</b></div>`,
      style,
      vertex: '1',
      parent: segmentId
    };
    for (const key in attributes) {
      cell.setAttribute(key, attributes[key]);
    }
    const geometry = document.createElement('mxGeometry');
    const geomAttributes = {
      x: absX,
      y: absY,
      width,
      height,
      as: 'geometry'
    };
    for (const key in geomAttributes) {
      geometry.setAttribute(key, geomAttributes[key]);
    }
    cell.appendChild(geometry);
    rootElement.appendChild(cell);
    return cell;
  }

  /** @param {Element[]} items @param {boolean} includeRotatedLabels @returns {[number, number]} */
  measureSegment(items, includeRotatedLabels = false) {
    let right = 0;
    let bottom = 0;
    for (const item of items) {
      const cell = this.mxCell(item);
      const geom = cell?.querySelector('mxGeometry');
      if (!geom) continue;
      const visual = this.rotatedGeometryBounds(cell, geom);
      right = Math.max(right, visual.right);
      bottom = Math.max(bottom, visual.bottom);
      if (includeRotatedLabels && visual.isVertical) {
        const label = item.getAttribute?.('label') ?? cell.getAttribute('value') ?? '';
        const labelWidth = this.estimateLabelWidth(label);
        right = Math.max(right, visual.right + Math.max(0, (labelWidth - visual.width) / 2));
      }
    }
    return [bottom, right];
  }

  /** @param {*} label @returns {number} */
  estimateLabelWidth(label) {
    const text = String(label ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return [...text].length * this.constants.LABEL_CHAR_WIDTH;
  }

  /** @param {Element} rootElement @param {string} parentId @returns {Element[]} */
  directVertexChildren(rootElement, parentId) {
    return Array.from(rootElement.children).filter((element) => {
      const cell = this.mxCell(element);
      return cell?.getAttribute('parent') === parentId && cell.getAttribute('vertex') === '1';
    });
  }

  /** @param {Element} geometry @param {Element[]} children @param {number} minWidth @param {number} minHeight @returns {boolean} */
  fitContainerToChildren(geometry, children, minWidth = 0, minHeight = 0) {
    if (!geometry || !children.length) return false;
    const [bottom, right] = this.measureSegment(children);
    geometry.setAttribute('width', this.formatNumber(Math.max(minWidth, right + this.constants.SEGMENT_PADDING_RIGHT)));
    geometry.setAttribute('height', this.formatNumber(Math.max(minHeight, bottom + this.constants.BOTTOM_MARGIN)));
    return true;
  }

  /** @param {*} left @param {*} right @returns {number} */
  compareIds(left, right) {
    return left < right ? -1 : left > right ? 1 : 0;
  }

  /**
   * Move service-group geometries together with their owning segment.
   * @param {Element} rootElement
   * @param {Object<string, string[]>} serviceGroupIdsBySegment
   * @param {number} xDelta
   * @param {number} yDelta
   * @param {string[]|undefined} segmentIds
   * @returns {void}
   */
  shiftServiceGroups(rootElement, serviceGroupIdsBySegment, xDelta, yDelta, segmentIds) {
    const ids = segmentIds ?? Object.keys(serviceGroupIdsBySegment);
    for (const segmentId of ids) {
      for (const groupId of serviceGroupIdsBySegment[segmentId] ?? []) {
        const groupGeometry = this.findRootChildById(rootElement, groupId)?.querySelector('mxGeometry');
        if (!groupGeometry) continue;
        if (xDelta) {
          groupGeometry.setAttribute('x', this.formatNumber(this.getFloatAttribute(groupGeometry, 'x') + xDelta));
        }
        if (yDelta) {
          groupGeometry.setAttribute('y', this.formatNumber(this.getFloatAttribute(groupGeometry, 'y') + yDelta));
        }
      }
    }
  }

  /** @param {{geometry: Element}} segment @returns {number} */
  segmentRight(segment) {
    return this.getFloatAttribute(segment.geometry, 'x')
      + this.getFloatAttribute(segment.geometry, 'width');
  }

  /** @param {{geometry: Element}} segment @returns {number} */
  segmentBottom(segment) {
    return this.getFloatAttribute(segment.geometry, 'y')
      + this.getFloatAttribute(segment.geometry, 'height');
  }

  /**
   * Return root-level segments in a zone in stable visual order.
   * @param {Object<string, {element: Element, meta?: Object}>} allSegmentIndex
   * @param {string} zone
   * @param {string} [parentId]
   * @returns {{id: string, geometry: Element}[]}
   */
  segmentsForZone(allSegmentIndex, zone, parentId = LOCATION_CONTAINER_ID) {
    return Object.entries(allSegmentIndex)
      .filter(([, segment]) => segment.meta?.zone === zone
        && this.mxCell(segment.element)?.getAttribute('parent') === parentId)
      .map(([id, segment]) => ({ id, geometry: segment.element.querySelector('mxGeometry') }))
      .sort((left, right) => this.getFloatAttribute(left.geometry, 'y')
        - this.getFloatAttribute(right.geometry, 'y')
        || this.compareIds(left.id, right.id));
  }

  /**
   * Move one segment and its generated service groups unless geometry was saved manually.
   * @param {{id: string, geometry: Element}} segment
   * @param {number} x
   * @param {number} y
   * @param {Set<string>} manualGeometryIds
   * @param {Element} rootElement
   * @param {Object<string, string[]>} serviceGroupIdsBySegment
   * @returns {void}
   */
  moveSegment(segment, x, y, manualGeometryIds, rootElement, serviceGroupIdsBySegment) {
    if (manualGeometryIds.has(segment.id)) return;
    const oldX = this.getFloatAttribute(segment.geometry, 'x');
    const oldY = this.getFloatAttribute(segment.geometry, 'y');
    segment.geometry.setAttribute('x', this.formatNumber(x));
    segment.geometry.setAttribute('y', this.formatNumber(y));
    this.shiftServiceGroups(
      rootElement,
      serviceGroupIdsBySegment,
      x - oldX,
      y - oldY,
      [segment.id]
    );
  }

  /**
   * Stack segments vertically and return their resulting bounds.
   * @param {{id: string, geometry: Element}[]} segments
   * @param {number|null} minX
   * @param {number|null} minY
   * @param {boolean} alignX
   * @param {{manualGeometryIds: Set<string>, rootElement: Element, serviceGroupIdsBySegment: Object<string, string[]>}} context
   * @returns {{segments: Object[], x: number, right: number, bottom: number}|null}
   */
  stackSegments(segments, minX = null, minY = null, alignX = false, context) {
    if (!segments.length) return null;
    const x = alignX && minX !== null
      ? minX
      : Math.max(
        minX ?? -Infinity,
        ...segments.map((segment) => this.getFloatAttribute(segment.geometry, 'x'))
      );
    let nextY = minY ?? this.getFloatAttribute(segments[0].geometry, 'y');
    for (const segment of segments) {
      const y = Math.max(this.getFloatAttribute(segment.geometry, 'y'), nextY);
      this.moveSegment(
        segment,
        x,
        y,
        context.manualGeometryIds,
        context.rootElement,
        context.serviceGroupIdsBySegment
      );
      nextY = this.segmentBottom(segment) + this.constants.GAP_Y;
    }
    return {
      segments,
      x,
      right: Math.max(...segments.map((segment) => this.segmentRight(segment))),
      bottom: Math.max(...segments.map((segment) => this.segmentBottom(segment)))
    };
  }

  /**
   * Grow a hierarchy container around direct child schemas while preserving its current minimum size.
   * @param {Element} rootElement
   * @param {Object<string, {element: Element, item: Object}>} objectIndex
   * @param {string} id
   * @param {string[]} childSchemas
   * @returns {boolean}
   */
  growHierarchyContainer(rootElement, objectIndex, id, childSchemas) {
    const geometry = objectIndex[id]?.element.querySelector('mxGeometry');
    const children = this.directVertexChildren(rootElement, id).filter((element) =>
      childSchemas.some((schema) => schemaMatches(element.getAttribute('schema'), schema))
    );
    if (!geometry) return false;
    return this.fitContainerToChildren(
      geometry,
      children,
      this.getFloatAttribute(geometry, 'width'),
      this.getFloatAttribute(geometry, 'height')
    );
  }

  /** @param {Element} cell @param {Element} geometry @returns {{right:number,bottom:number,width:number,height:number,isVertical:boolean}} */
  rotatedGeometryBounds(cell, geometry) {
    const x = this.getFloatAttribute(geometry, 'x');
    const y = this.getFloatAttribute(geometry, 'y');
    const width = this.getFloatAttribute(geometry, 'width');
    const height = this.getFloatAttribute(geometry, 'height');
    const rotation = parseFloat(cell?.getAttribute('style')?.match(/(?:^|;)rotation=(-?[\d.]+)/)?.[1]) || 0;
    const radians = rotation * Math.PI / 180;
    const visualWidth = Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians));
    const visualHeight = Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians));
    return {
      right: x + (width + visualWidth) / 2,
      bottom: y + (height + visualHeight) / 2,
      width: visualWidth,
      height: visualHeight,
      isVertical: Math.abs(Math.sin(radians)) > 0.99
    };
  }

  resolveSegmentRules(segmentId, segmentIndex, zoneIndex) {
    const meta = segmentIndex[segmentId]?.meta;
    if (!meta) {
      logger.warn(() => `Can't resolve layout rules for segment ${segmentId}: zone/location meta is missing`);
      return {};
    }
    const { zone, location } = meta;
    const baseRules = { ...this.zoneRules[zone] };
    if (!baseRules) return {};
    for (const ruleName of ['neighbors_right_zones', 'stack_below_zones']) {
      if (!baseRules[ruleName]) continue;
      const segmentIds = [];
      const zonesArray = baseRules[ruleName];
      for (const zoneId of zonesArray) {
        const newSegments = zoneIndex[`${zoneId}:${location}`]?.filter((ele) => segmentId !== ele && !segmentIds.includes(ele));
        if (newSegments) segmentIds.push(...newSegments);
      }
      baseRules[ruleName] = segmentIds.sort((left, right) => this.compareIds(left, right));
    }
    return baseRules;
  }

  computeGroupBox(elementCount, slotSize, label) {
    if (elementCount === 0) {
      return { width: 0, height: 0, positions: []};
    }
    const rawAspect = slotSize.height / slotSize.width;
    const aspectBias = Math.min(1.5, Math.max(1.0, rawAspect));
    const columnCount = Math.max(1, Math.min(this.constants.MAX_COLS, Math.ceil(Math.sqrt(elementCount) * aspectBias)));
    const rowCount = Math.ceil(elementCount / columnCount);
    const innerWidth = columnCount === 1 ? slotSize.width : columnCount * slotSize.width + (columnCount - 1) * this.constants.GAP_X;
    const innerHeight = rowCount === 1 ? slotSize.height : rowCount * slotSize.height + (rowCount - 1) * this.constants.GAP_Y;
    const width = Math.max(this.constants.MIN_CONTAINER_WIDTH, innerWidth + 2 * this.constants.PAD_X);
    const headerMultiplier = Math.ceil(label.length / ( 24 * 170 / width ));
    const headerHight = this.constants.HEADER_H * headerMultiplier;
    const height = headerHight + innerHeight + 2 * this.constants.PAD_Y;
    const positions = [];
    for (let i = 0; i < elementCount; i++) {
      const column = i % columnCount;
      const row = Math.floor(i / columnCount);
      positions.push({
        x: this.constants.PAD_X + column * (slotSize.width + this.constants.GAP_X),
        y: headerHight + this.constants.PAD_Y + row * (slotSize.height + this.constants.GAP_Y)
      });
    }
    return { width, height, positions };
  }

  resolveGroupKey(element, schema_conf) {
    for (const key of schema_conf?.group_by ?? []) {
        const value = element.getAttribute(key);
        if (value) return value;
    }
    return schema_conf?.group_name ?? element.getAttribute('schema') ?? 'Прочие сервисы';
  }

  targetSchemaConfig(schema) {
    for (const [targetSchema, config] of Object.entries(this.targetSchemas)) {
      if (schemaMatches(schema, targetSchema)) return config;
    }
    return null;
  }

  segmentMeta(item, element) {
    const primary = item?.primaryVars ?? {};
    const sber = primary.sber ?? {};
    const zone = sber.zone ?? primary.zone ?? element?.getAttribute('zone');
    const location = sber.location ?? primary.location ?? element?.getAttribute('location');
    if (!zone || !location) return null;
    return {
      ...sber,
      zone: String(zone),
      location: String(location)
    };
  }

  /** @param {Object} obj @param {Object} schemaConf @param {Object} objectIndex @returns {string|null} */
  deriveSegmentFromConnections(obj, schemaConf, objectIndex) {
    if (!schemaConf.auto_segment) {
      return '';
    }
    const source = obj?.primaryVars ?? obj ?? {};
    const explicitSegment = normalizeValues(source.segment)[0] ?? '';
    if (explicitSegment) return explicitSegment;
    const connections = normalizeValues(source.network_connection);
    if (!connections.length) return null;
    let hasCarrierCandidate = false;
    let hasUnresolvedConnection = false;
    const carrierSegments = {};
    const segments = connections.reduce((acc, connectionId) => {
      const connection = objectIndex[connectionId];
      let segmentId = normalizeValues(connection?.item?.primaryVars?.segment)[0];
      if (!segmentId && schemaMatches(connection?.item?.primaryVars?.schema, SCHEMAS.NETWORK_SEGMENT)) {
        segmentId = connectionId;
      }
      if (!segmentId) {
        const connectionParent = this.elementParentId(connection?.element);
        if (CARRIER_PARENT_IDS.has(connectionParent)) {
          hasCarrierCandidate = true;
          return acc;
        }
        const parentSegment = this.segmentFromParent(connectionParent, objectIndex);
        if (parentSegment) {
          segmentId = parentSegment;
        } else {
          hasUnresolvedConnection = true;
          logger.warn(() => `Can't find a segment for connection ${connectionId} для объекта ${obj.OID}`);
        }
      }
      if (segmentId) {
        const segment = objectIndex[segmentId];
        const zone = this.segmentMeta(segment?.item, segment?.element)?.zone;
        if (!segment || !zone) {
          hasUnresolvedConnection = true;
          logger.warn(() => `Can't resolve segment ${segmentId} for connection ${connectionId} для объекта ${obj.OID}`);
        } else if (CARRIER_ZONES.includes(zone)) {
          hasCarrierCandidate = true;
          carrierSegments[segmentId] = (carrierSegments[segmentId] ?? 0) + 1;
        } else {
          acc[segmentId] = (acc[segmentId] ?? 0) + 1;
        }
      }
      return acc;
    }, {});
    const segmentIds = Object.keys(segments);
    const segmentCounts = segmentIds.length
      ? segments
      : hasUnresolvedConnection ? carrierSegments : null;
    if (segmentCounts) {
      const { segmentId } = Object.entries(segmentCounts).reduce((acc, [segmentId, num]) => {
        if (num > acc.value || (num === acc.value && segmentId.localeCompare(acc.segmentId) < 0)) {
          acc = { segmentId, value: num };
        }
        return acc;
      }, { segmentId: null, value: 0 });
      // Keep the resolved non-carrier segment when another connection is
      // unresolved or carrier-only; only carrier-only connections are moved
      // to the external-services layout.
      return segmentId;
    }
    return hasCarrierCandidate ? '' : null;
  }

  /** @param {string} parentId @param {Object} objectIndex @param {Object} [cellIndex] @param {Set<string>} [carrierParentIds] @returns {string|null} */
  segmentFromParent(parentId, objectIndex, cellIndex = {}, carrierParentIds = null) {
    const visited = new Set();
    let currentId = parentId;
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      if (carrierParentIds?.has(currentId)) return currentId;
      const record = objectIndex[currentId] ?? cellIndex[currentId];
      if (!record) return null;
      const schema = record.item?.primaryVars?.schema
        ?? record.item?.schema
        ?? record.element?.getAttribute('schema');
      if (schemaMatches(schema, SCHEMAS.NETWORK_SEGMENT)) return currentId;
      const explicitSegment = normalizeValues(
        record.item?.primaryVars?.segment ?? record.element?.getAttribute('segment')
      )[0];
      if (explicitSegment && objectIndex[explicitSegment]) {
        currentId = explicitSegment;
        continue;
      }
      currentId = this.elementParentId(record.element);
    }
    return null;
  }

  shiftStackBelow(objectIndex, segmentGeometry, segmentRules, gap = this.constants.SEGMENT_PADDING_X) {
    const stackIds = segmentRules.stack_below_zones;
    let maxBottom = this.getFloatAttribute(segmentGeometry, 'y') + this.getFloatAttribute(segmentGeometry, 'height');
    if (!stackIds) return maxBottom;
    let currentY = maxBottom + gap;
    for (const neighborId of stackIds) {
      const neighborObj = objectIndex[neighborId];
      if (!neighborObj) continue;
      const geometry = neighborObj.element.querySelector('mxGeometry');
      if (!geometry) continue;
      const height = this.getFloatAttribute(geometry, 'height');
      geometry.setAttribute('x', this.formatNumber(this.getFloatAttribute(segmentGeometry, 'x')));
      geometry.setAttribute('y', currentY);
      currentY += height + gap;
      maxBottom = currentY - gap;
    }
    return maxBottom;
  }

  applySecurityHints(element, segmentId, segmentIndex, zoneIndex, derivedSegment) {
    if (derivedSegment) {
      return segmentId;
    }
    const tag = element.getAttribute('tag')?.toLowerCase() ?? '';
    const tech = element.getAttribute('technology')?.toLowerCase() ?? '';
    const requestedZones = [];
    for (const [zoneName, keywords] of Object.entries(this.securityZoneHints)) {
      for (const keyword of keywords) {
        if (tag.includes(keyword) || tech.includes(keyword)) {
          requestedZones.push(zoneName);
          break;
        }
      }
    }
    const currentSegment = segmentIndex[segmentId];
    if (currentSegment && requestedZones.length > 0) {
      const { zone, location } = currentSegment ?? {};
      const key = `${zone}:${location}`;
      const candidates = zoneIndex[key] ?? [];
      if (candidates.length > 0) {
        return candidates[0];
      }
    }
    return segmentId;
  }

  shiftNeighborChain(objectIndex, segmentGeometry, segmentRules, gap = this.constants.SEGMENT_PADDING_X) {
    const neighbors = segmentRules.neighbors_right_zones;
    let currentX = this.getFloatAttribute(segmentGeometry, 'x') + this.getFloatAttribute(segmentGeometry, 'width') + gap;
    let lastExtent = currentX;
    if (!neighbors) return lastExtent;
    for (const neighborId of neighbors) {
      const neighborObj = objectIndex[neighborId];
      if (!neighborObj) continue;
      const geometry = neighborObj.element.querySelector('mxGeometry');
      if (!geometry) continue;
      const width = this.getFloatAttribute(geometry, 'width');
      geometry.setAttribute('x', currentX);
      currentX += width + gap;
      lastExtent = currentX - gap;
    }
    return lastExtent;
  }

  getElementDiff(eleOne, eleTwo) {
    if (!eleOne || !eleTwo) {
      return null;
    }
    const diff = {};
    for (const attribute of eleTwo.attributes) {
      const old = eleOne.getAttribute(attribute.name);
      if (attribute.value !== old) {
        diff[attribute.name] = { new: attribute.value, old };
      }
    }
    const geometryOne = eleOne.querySelector('mxGeometry');
    const geometryTwo = eleTwo.querySelector('mxGeometry');
    if (geometryOne && geometryTwo) {
      for (const attribute of geometryTwo.attributes) {
        const old = geometryOne.getAttribute(attribute.name);
        if (attribute.value !== old) {
          if (!diff[GEOMETRY_ATTRS_KEY]) {
            diff[GEOMETRY_ATTRS_KEY]= {};
          }
          diff[GEOMETRY_ATTRS_KEY][attribute.name] = { new: attribute.value, old };
        }
      }
    }
    if (geometryTwo) {
      const mxPointsArray = geometryTwo.querySelectorAll('mxPoint');
      const pointsArray = [];
      for (const ele of mxPointsArray) {
        const x = ele.getAttribute('x');
        const y = ele.getAttribute('y');
        pointsArray.push([x, y]);
      }
      const oldPoints = Array.from(geometryOne?.querySelectorAll('mxPoint') ?? [])
        .map((point) => [point.getAttribute('x'), point.getAttribute('y')]);
      if (JSON.stringify(oldPoints) !== JSON.stringify(pointsArray)) {
        diff[GEOMETRY_ATTRS_KEY] = diff[GEOMETRY_ATTRS_KEY] ?? {};
        diff[GEOMETRY_ATTRS_KEY].pointsArray = pointsArray;
      }
    }
    const cellOne = this.mxCell(eleOne);
    const cellTwo = this.mxCell(eleTwo);
    const styleChanged = cellTwo && cellTwo !== eleTwo && cellOne?.getAttribute('style') !== cellTwo.getAttribute('style');
    const manualRoute = this.isLogicalLinkVisualEdge(eleTwo)
      && (styleChanged || diff[GEOMETRY_ATTRS_KEY]?.pointsArray !== undefined);
    if (manualRoute) {
      diff.cell_attr_key = { style: { old: cellOne?.getAttribute('style'), new: cellTwo.getAttribute('style') } };
    }
    if (manualRoute && diff[GEOMETRY_ATTRS_KEY]?.pointsArray === undefined) {
      diff[GEOMETRY_ATTRS_KEY] = diff[GEOMETRY_ATTRS_KEY] ?? {};
      diff[GEOMETRY_ATTRS_KEY].pointsArray = Array.from(geometryTwo?.querySelectorAll('mxPoint') ?? [])
        .map((point) => [point.getAttribute('x'), point.getAttribute('y')]);
    }
    return Object.keys(diff).length > 0 ? diff : null;
  }

  getObjectDiff(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const diagramElements = doc.getElementsByTagName('diagram');
    const objects = {};
    const newObjects = {};
    const changedObjects = {};
    for (const diagramElement of diagramElements) {
      const diagramId = diagramElement.getAttribute('name');
      // If it's a special page, skip it
      if (!this.objects[diagramId]) continue;
      // Fist finding all the objects
      objects[diagramId] = diagramElement.getElementsByTagName('object');
      Object.keys(objects[diagramId]).forEach((key) => {
        const currentObj = objects[diagramId][key];
        const id = currentObj.getAttribute('id');
        // If the id is new, we got a new object, however
        // if it's a number, then it might be an edge or something else immaterial
        if (!(id in this.objects[diagramId]) && isNaN(id)) {
          const attrObj = {};
          newObjects[diagramId] = newObjects[diagramId] ?? {};
          for (const att of currentObj.attributes) {
            attrObj[att.name] = att.value;
          }
          newObjects[diagramId][id] = attrObj;
        } else if (isNaN(id)) {
          // if the object is old, then we need to check if any of its attributes changed
          const oldObj = this.objects[diagramId][id];
          const newAttrObject = {};
          for (const att of currentObj.attributes) {
            const oldAttValue = oldObj?.element.getAttribute(att.name);
            if (oldAttValue && oldAttValue !== att.value) {
              newAttrObject[att.name] = att.value;
            }
          }
          if (Object.keys(newAttrObject).length > 0) {
            newAttrObject.schema = currentObj.getAttribute('schema');
            changedObjects[diagramId] = changedObjects[diagramId] ?? {};
            changedObjects[diagramId][id] = newAttrObject;
          }
        }
      });
      // Then we need to check for new links
      const links = diagramElement.querySelectorAll('[edge="1"]');
      const newLinks = {};
      for (const link of links) {
        // Check if the link is new
        const linkId = link.getAttribute('id');
        if (linkId && !this.links[diagramId][linkId]) {
          const linkObject = {};
          for (const att of link.attributes) {
            linkObject[att.name] = att.value;
          }
          newLinks[linkId] = linkObject;
        }
      }
      // Go through new links and add them to the object properties
      for (const linkId in newLinks) {
        if (newLinks[linkId].source in newObjects[diagramId]) {
          const obj = newObjects[diagramId][newLinks[linkId].source];
          if (obj.network_connection && obj.network_connection !== '[]') {
            if (!Array.isArray(obj.network_connection)) {
              obj.network_connection = [obj.network_connection];
            }
          } else {
            obj.network_connection = [];
          }
          let target;
          if (newLinks[linkId].target in newObjects[diagramId]) {
            target = newObjects[diagramId][newLinks[linkId].target].OID;
          } else {
            target = newLinks[linkId].target;
          }
          obj.network_connection.push(target);
        }
      }
    }
    return { newObjects, changedObjects };
  }

  getDiff(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const diagramElements = doc.getElementsByTagName('diagram');
    const indices = {};
    const result = {};
    for (let i = 0; i < diagramElements.length; i++) {
      const diagramElement = diagramElements[i];
      const diagramId = diagramElement.getAttribute('id');
      indices[diagramId] = {};
      const stack = [...diagramElement.childNodes];
      while (stack.length > 0) {
        const el = stack.pop();
        const id = el?.getAttribute?.('id');
        if (id) indices[diagramId][id] = el;
        for (let j = el.childNodes.length - 1; j >= 0; j--) {
          const child = el.childNodes[j];
          if (child.nodeType === Node.ELEMENT_NODE) stack.push(child);
        }
      }
      if (diagramId in this.indices) {
        const pageDiff = [];
        for (const id in this.indices[diagramId]) {
          const old = this.routingBaseline?.[diagramId]?.[id]
            ?? this.indices[diagramId][id].initElement ?? this.indices[diagramId][id].element;
          const saved = indices[diagramId][id];
          const diff = this.getElementDiff(old, saved);
          if (saved && diff) {
            pageDiff.push({ id, diff });
          }
        }
        if (diagramId !== 'common_location_page' || pageDiff.length > 0) result[diagramId] = pageDiff;
      }
    }
    return result;
  }

  captureRoutingBaseline(xml, diff) {
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    this.routingBaseline = {};
    for (const page of document.querySelectorAll('mxfile > diagram')) {
      const pageId = page.getAttribute('id');
      const saved = new Map(Array.from(page.querySelectorAll('[id]')).map((element) => [element.getAttribute('id'), element]));
      const manual = manualRouteIds(diff?.[pageId]);
      const baseline = this.routingBaseline[pageId] = {};
      for (const [id, record] of Object.entries(this.indices[pageId] ?? {})) {
        if (!this.isLogicalLinkVisualEdge(record.element) || !saved.has(id)) continue;
        const initial = (record.initElement ?? record.element).cloneNode(true);
        const current = saved.get(id);
        const initialCell = this.mxCell(initial);
        const currentCell = this.mxCell(current);
        if (manual.has(id)) {
          const color = currentCell.getAttribute('style')?.match(/(?:^|;)strokeColor=([^;]+)/)?.[1];
          if (color) {
            const style = initialCell.getAttribute('style') ?? '';
            initialCell.setAttribute('style', /(?:^|;)strokeColor=/.test(style)
              ? style.replace(/(^|;)strokeColor=[^;]*/g, `$1strokeColor=${color}`)
              : `${style}${style.endsWith(';') ? '' : ';'}strokeColor=${color};`);
          }
        } else {
          initialCell.setAttribute('style', currentCell.getAttribute('style') ?? '');
          const geometry = initial.querySelector('mxGeometry');
          const routedGeometry = current.querySelector('mxGeometry');
          if (geometry && routedGeometry) geometry.replaceWith(routedGeometry.cloneNode(true));
        }
        baseline[id] = initial;
      }
    }
  }

  applyDiff(document, eleRec, diff) {
    const ele = eleRec.element;
    eleRec.initElement = ele.cloneNode(true);
    for (const attr in diff) {
      if (attr === 'cell_attr_key') {
        const cell = this.mxCell(ele);
        for (const [name, value] of Object.entries(diff[attr])) {
          if (value.new == null) cell.removeAttribute(name);
          else cell.setAttribute(name, value.new);
        }
      } else if (attr === GEOMETRY_ATTRS_KEY) {
        const geometry = ele.querySelector('mxGeometry');
        for (const geoAttr in diff[GEOMETRY_ATTRS_KEY]) {
          if (geoAttr === 'pointsArray') {
            for (const existing of Array.from(geometry.querySelectorAll('Array[as="points"]'))) existing.remove();
            const mxPointsArray = document.createElement('Array');
            mxPointsArray.setAttribute('as', 'points');
            geometry.appendChild(mxPointsArray);
            for (const point of diff[GEOMETRY_ATTRS_KEY][geoAttr]) {
              const mxPoint = document.createElement('mxPoint');
              mxPoint.setAttribute('x', point[0]);
              mxPoint.setAttribute('y', point[1]);
              mxPointsArray.appendChild(mxPoint);
            }
            continue;
          }
          geometry.setAttribute(geoAttr, diff[GEOMETRY_ATTRS_KEY][geoAttr].new);
        }
      } else {
        ele.setAttribute(attr, diff[attr].new);
      }
    }
  }

  makeElement(document, tagName, attributes = {}) {
    const element = document.createElement(tagName);
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined && value !== null) element.setAttribute(key, String(value));
    }
    return element;
  }

  mxCell(element) {
    if (!element) return null;
    if (element.tagName?.toLowerCase() === 'mxcell') return element;
    return Array.from(element.children ?? []).find((child) => child.tagName?.toLowerCase() === 'mxcell') ?? null;
  }

  elementId(element) {
    const mx = this.mxCell(element);
    return element?.getAttribute('id') || mx?.getAttribute('id') || '';
  }

  elementParentId(element) {
    const mx = this.mxCell(element);
    return mx?.getAttribute('parent') || element?.getAttribute('parent') || '';
  }

  buildPageIndex(rootElement) {
    const elementsById = {};
    const cellsById = {};
    const childrenByParent = {};
    for (const element of Array.from(rootElement.children ?? [])) {
      const id = this.elementId(element);
      const mx = this.mxCell(element);
      if (id) elementsById[id] = element;
      if (!mx) continue;
      const cellId = mx.getAttribute('id') || id;
      if (cellId) cellsById[cellId] = mx;
      const parent = mx.getAttribute('parent');
      if (parent && id) {
        childrenByParent[parent] = childrenByParent[parent] ?? [];
        childrenByParent[parent].push(id);
      }
    }
    return { elementsById, cellsById, childrenByParent };
  }

  absoluteGeometry(cellId, index, seen = new Set()) {
    if (seen.has(cellId)) return null;
    seen.add(cellId);
    const cell = index.cellsById[cellId];
    if (!cell || cell.getAttribute('vertex') !== '1') return null;
    const geometry = cell.querySelector('mxGeometry');
    if (!geometry) return null;
    let x = this.getFloatAttribute(geometry, 'x');
    let y = this.getFloatAttribute(geometry, 'y');
    const width = this.getFloatAttribute(geometry, 'width');
    const height = this.getFloatAttribute(geometry, 'height');
    const parent = cell.getAttribute('parent');
    if (parent && !['0', '1'].includes(parent)) {
      const parentGeometry = this.absoluteGeometry(parent, index, seen);
      if (parentGeometry) {
        x += parentGeometry[0];
        y += parentGeometry[1];
      }
    }
    return [x, y, width, height];
  }

  pageBBox(rootElement) {
    const index = this.buildPageIndex(rootElement);
    const boxes = [];
    for (const [cellId, cell] of Object.entries(index.cellsById)) {
      if (cell.getAttribute('vertex') !== '1' || cell.getAttribute('visible') === '0') continue;
      const geometry = this.absoluteGeometry(cellId, index);
      if (!geometry) continue;
      const [x, y, width, height] = geometry;
      boxes.push([x, y, x + width, y + height]);
    }
    if (!boxes.length) return [0, 0, 0, 0];
    return [
      Math.min(...boxes.map((box) => box[0])),
      Math.min(...boxes.map((box) => box[1])),
      Math.max(...boxes.map((box) => box[2])),
      Math.max(...boxes.map((box) => box[3]))
    ];
  }

  formatNumber(value) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return '0';
    return Number.isInteger(numberValue) ? String(numberValue) : String(Number(numberValue.toFixed(3)));
  }

  isCoordinateRootParent(parentId, coordinateRootParents = null) {
    if (coordinateRootParents) return coordinateRootParents.has(String(parentId ?? ''));
    return ['0', '1', SECURITY_SERVICES_LAYER_ID, TECH_SERVICES_LAYER_ID].includes(parentId);
  }

  shiftGeometry(element, xDelta, yDelta, coordinateRootParents = null) {
    const mx = this.mxCell(element);
    if (!mx) return;
    const geometry = mx.querySelector('mxGeometry');
    if (geometry && this.isCoordinateRootParent(mx.getAttribute('parent'), coordinateRootParents)) {
      if (geometry.getAttribute('x') !== null) {
        geometry.setAttribute('x', this.formatNumber(this.getFloatAttribute(geometry, 'x') + xDelta));
      }
      if (geometry.getAttribute('y') !== null) {
        geometry.setAttribute('y', this.formatNumber(this.getFloatAttribute(geometry, 'y') + yDelta));
      }
    }
    if (mx.getAttribute('edge') === '1') {
      for (const point of Array.from(mx.querySelectorAll('mxPoint'))) {
        if (point.getAttribute('x') !== null) {
          point.setAttribute('x', this.formatNumber(this.getFloatAttribute(point, 'x') + xDelta));
        }
        if (point.getAttribute('y') !== null) {
          point.setAttribute('y', this.formatNumber(this.getFloatAttribute(point, 'y') + yDelta));
        }
      }
    }
  }

  rewriteIds(element, idMap) {
    const schema = element.getAttribute('schema');
    const nodes = [element, ...Array.from(element.getElementsByTagName('*'))];
    for (const node of nodes) {
      for (const attr of ['id', 'parent', 'source', 'target']) {
        const value = node.getAttribute(attr);
        if (!value) continue;
        if (attr === 'parent' && ['0', '1'].includes(value)) continue;
        node.setAttribute(attr, idMap[value] ?? value);
      }
    }
    if (element.tagName?.toLowerCase() === 'object') {
      if (schemaMatches(schema, SCHEMAS.NETWORK_SEGMENT)) {
        element.setAttribute('common_network_segment', 'true');
      }
      if (schema && this.mxCell(element)?.getAttribute('vertex') === '1') {
        element.setAttribute('common_schema', schema);
      }
      element.removeAttribute('schema');
      element.setAttribute('common_visual_copy', 'true');
    }
  }

  normalizeCommonCloneLayerParent(element) {
    const mx = this.mxCell(element);
    if (mx?.getAttribute('parent') === '0') {
      mx.setAttribute('parent', '1');
    }
  }

  commonVisualOrder(element, index) {
    const id = this.elementId(element);
    if (['0', '1'].includes(id)) return [0, index];
    const mx = this.mxCell(element);
    if (!mx) return [1, index];
    if (mx.getAttribute('parent') === '0') return [1, index];
    if (mx.getAttribute('edge') === '1') return [4, index];
    if (element.getAttribute('common_network_segment') === 'true'
      || /^common_\d+_00[1-4]$/.test(id)
      || /^common_\d+_tech_group_/.test(id)) {
      return [2, index];
    }
    return [3, index];
  }

  sortCommonVisualClones(commonRoot) {
    const ordered = Array.from(commonRoot.children ?? [])
      .map((element, index) => ({ element, order: this.commonVisualOrder(element, index) }))
      .sort((a, b) => a.order[0] - b.order[0] || a.order[1] - b.order[1])
      .map(({ element }) => element);
    for (const element of ordered) commonRoot.appendChild(element);
  }

  logicalTagLayerId(tag) {
    const normalized = String(tag ?? '').trim().replace(/[^A-Za-z0-9_.-]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
    return `layer.logical.${normalized || hashString(tag)}`;
  }

  commonTagLayerId(tag) {
    return `common_${this.logicalTagLayerId(tag)}`;
  }

  layerValue(element) {
    const mx = this.mxCell(element);
    return String(mx?.getAttribute('value') || element?.getAttribute('label') || '').trim();
  }

  findRootChildById(rootElement, id) {
    return Array.from(rootElement.children ?? []).find((child) => child.getAttribute('id') === id) ?? null;
  }

  normalizeRootLayerOrder(rootElement) {
    const rootCell = this.findRootChildById(rootElement, '0');
    if (!rootCell) return;
    const layerCells = Array.from(rootElement.children ?? [])
      .filter((element) => element !== rootCell
        && element.tagName?.toLowerCase() === 'mxcell'
        && element.getAttribute('parent') === '0');
    let insertAfter = rootCell;
    for (const layerCell of layerCells) {
      rootElement.removeChild(layerCell);
      rootElement.insertBefore(layerCell, insertAfter.nextSibling);
      insertAfter = layerCell;
    }
  }

  isRootLayerCell(element) {
    return element.tagName?.toLowerCase() === 'mxcell'
      && this.elementId(element) !== '0'
      && element.getAttribute('parent') === '0';
  }

  isPlainRootLayerCell(element) {
    const mx = this.mxCell(element);
    if (!mx || mx.getAttribute('parent') !== '0') return false;
    if (mx.getAttribute('vertex') === '1' || mx.getAttribute('edge') === '1') return false;
    return !mx.querySelector('mxGeometry');
  }

  isCommonBackgroundVertex(element) {
    const mx = this.mxCell(element);
    if (mx?.getAttribute('vertex') !== '1') return false;
    if (schemaMatches(element.getAttribute('schema'), SCHEMAS.NETWORK_SEGMENT)) return true;
    const objectId = String(element.getAttribute('OID') || '').toLowerCase();
    const elementId = String(element.getAttribute('id') || mx.getAttribute('id') || '').toLowerCase();
    if (element.tagName?.toLowerCase() === 'object' && (objectId.includes('network_segment') || elementId.includes('network_segment'))) return true;
    return mx.getAttribute('parent') === '0';
  }

  commonPageZOrderRank(element) {
    if (this.isPlainRootLayerCell(element)) return 0;
    if (this.isCommonBackgroundVertex(element)) return 1;
    const mx = this.mxCell(element);
    if (mx?.getAttribute('edge') === '1') return 3;
    return 2;
  }

  isCommonForegroundLayerCell(element) {
    if (!this.isPlainRootLayerCell(element)) return false;
    const id = this.elementId(element);
    const value = this.layerValue(element);
    if ([SECURITY_SERVICES_LAYER_ID, TECH_SERVICES_LAYER_ID].includes(id)) return true;
    if (id === VISIBLE_LOGICAL_LAYER_ID || id?.startsWith('common_layer.logical.')) return true;
    return value === 'Connections';
  }

  bringCommonForegroundLayersToFront(rootElement) {
    for (const layer of Array.from(rootElement.children ?? []).filter((element) => this.isCommonForegroundLayerCell(element))) {
      rootElement.removeChild(layer);
      rootElement.appendChild(layer);
    }
  }

  commonAlignmentAnchorX(rootElement) {
    const anchorValues = ['INTERNET', 'WAN', 'Office', 'DC'];
    const index = this.buildPageIndex(rootElement);
    for (const anchorValue of anchorValues) {
      for (const element of Array.from(rootElement.children ?? [])) {
        const id = this.elementId(element);
        const mx = this.mxCell(element);
        if (!id || !mx || mx.getAttribute('parent') !== '0' || mx.getAttribute('vertex') !== '1') continue;
        if (this.layerValue(element) !== anchorValue) continue;
        const geometry = this.absoluteGeometry(id, index);
        if (geometry) return geometry[0];
      }
    }
    return null;
  }

  commonLayerIdForSource(pageIndex, sourceLayerId, layerValue, commonLayerIdsByValue) {
    const key = layerValue || sourceLayerId;
    if (commonLayerIdsByValue[key]) return commonLayerIdsByValue[key];
    const commonLayerId = `common_${pageIndex}_${sourceLayerId}`;
    commonLayerIdsByValue[key] = commonLayerId;
    return commonLayerId;
  }

  commonVisualLayerIdForSource(sourceLayerId, layerValue, commonLayerIdsByValue) {
    const key = layerValue || sourceLayerId;
    if (commonLayerIdsByValue[key]) return commonLayerIdsByValue[key];
    const normalized = String(key ?? '')
      .trim()
      .replace(/[^A-Za-z0-9_.-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();
    const commonLayerId = `common_layer.visual.${normalized || hashString(key)}`;
    commonLayerIdsByValue[key] = commonLayerId;
    return commonLayerId;
  }

  ensureCommonAggregatedLayer(document, commonRoot, layerId, label, hidden = false) {
    let layer = this.findRootChildById(commonRoot, layerId);
    if (!layer) {
      layer = this.makeElement(document, 'mxCell', {
        id: layerId,
        value: label,
        parent: '0'
      });
      if (hidden) layer.setAttribute('visible', '0');
      commonRoot.appendChild(layer);
      return layer;
    }
    layer.setAttribute('value', label);
    layer.setAttribute('parent', '0');
    if (!hidden) layer.removeAttribute('visible');
    return layer;
  }

  isCommonAggregatedRootVisual(element) {
    const id = this.elementId(element);
    const mx = this.mxCell(element);
    if (!id || ['0', '1'].includes(id) || SERVICE_LAYER_IDS.has(id)) return false;
    if (!mx || mx.getAttribute('parent') !== '0') return false;
    if (mx.getAttribute('edge') === '1') return false;
    if (this.isPlainRootLayerCell(element)) return false;
    return Boolean(this.layerValue(element));
  }

  firstValue(value) {
    return normalizeValues(value)[0] ?? '';
  }

  segmentZone(segmentId) {
    const segment = getSchemaObject(this.sourceData, SCHEMAS.NETWORK_SEGMENT, segmentId);
    return String(segment?.zone || '').toUpperCase();
  }

  isCommonProviderNetwork(element, providerZones) {
    if (element?.tagName?.toLowerCase() !== 'object') return false;
    if (!schemaMatches(element.getAttribute('schema'), SCHEMAS.NETWORK)) return false;
    if (!element.getAttribute('provider')) return false;

    const networkId = element.getAttribute('id') || '';
    const network = getSchemaObject(this.sourceData, SCHEMAS.NETWORK, networkId);
    const segmentId = this.firstValue(network?.segment) || String(element.getAttribute('segment') || '');
    if (!segmentId) return false;

    return providerZones.has(this.segmentZone(segmentId)) || segmentId.toLowerCase().endsWith('.inet');
  }

  providerKey(provider) {
    return String(provider || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  providerId(provider) {
    const normalized = this.providerKey(provider);
    const slug = normalized.replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
    return `common_provider_${slug || 'provider'}_${hashString(normalized)}`;
  }

  descendantIds(rootId, childrenByParent) {
    const result = new Set();
    const stack = [rootId];
    while (stack.length) {
      const current = stack.pop();
      if (result.has(current)) continue;
      result.add(current);
      stack.push(...(childrenByParent[current] ?? []));
    }
    return result;
  }

  edgeTargetsCommonProvider(element, commonProviderIds) {
    const mx = this.mxCell(element);
    return mx?.getAttribute('edge') === '1'
      && (commonProviderIds.has(mx.getAttribute('source')) || commonProviderIds.has(mx.getAttribute('target')));
  }

  resetEdgeGeometry(element) {
    const mx = this.mxCell(element);
    if (mx?.getAttribute('edge') !== '1') return;
    let geometry = mx.querySelector('mxGeometry');
    if (!geometry) {
      geometry = element.ownerDocument.createElement('mxGeometry');
      mx.appendChild(geometry);
    }
    for (const attr of Array.from(geometry.attributes ?? [])) geometry.removeAttribute(attr.name);
    for (const child of Array.from(geometry.children ?? [])) geometry.removeChild(child);
    geometry.setAttribute('relative', '1');
    geometry.setAttribute('as', 'geometry');
  }

  createCommonProviderNode(document, providerId, label, x, y) {
    const object = this.makeElement(document, 'object', {
      id: providerId,
      label,
      common_provider: 'true'
    });
    const cell = this.makeElement(document, 'mxCell', {
      style: 'shape=cloud;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;align=center;verticalAlign=middle;fontStyle=1;',
      vertex: '1',
      parent: '1'
    });
    cell.appendChild(this.makeElement(document, 'mxGeometry', {
      x: this.formatNumber(x),
      y: this.formatNumber(y),
      width: '160',
      height: '80',
      as: 'geometry'
    }));
    object.appendChild(cell);
    return object;
  }

  rootBodyOrder(element, index) {
    const id = this.elementId(element);
    const mx = this.mxCell(element);
    if (!mx) return [1, index];
    if (this.isLogicalLinkVisualEdge(element)) return [5, index];
    if (mx.getAttribute('edge') === '1') return [4, index];
    if (schemaMatches(element.getAttribute('schema'), SCHEMAS.NETWORK_SEGMENT)
      || element.getAttribute('common_network_segment') === 'true'
      || /^common_\d+_00[1-4]$/.test(id)
      || /^common_\d+_tech_group_/.test(id)
      || /^tech_group_/.test(id)) {
      return [2, index];
    }
    return [3, index];
  }

  orderRootBodyElements(elements) {
    const byId = new Map();
    elements.forEach((element) => {
      const id = this.elementId(element);
      if (id) byId.set(id, element);
    });

    const sorted = elements
      .map((element, index) => ({ element, order: this.rootBodyOrder(element, index) }))
      .sort((a, b) => a.order[0] - b.order[0] || a.order[1] - b.order[1])
      .map(({ element }) => element);

    const ordered = [];
    const visiting = new Set();
    const visited = new Set();
    const visit = (element) => {
      if (visited.has(element)) return;
      if (visiting.has(element)) return;
      visiting.add(element);
      const parent = this.elementParentId(element);
      const parentElement = byId.get(parent);
      if (parentElement && parentElement !== element) visit(parentElement);
      visiting.delete(element);
      visited.add(element);
      ordered.push(element);
    };
    for (const element of sorted) visit(element);
    return ordered;
  }

  normalizeRootChildOrder(rootElement) {
    const children = Array.from(rootElement.children ?? []);
    const rootCell = children.find((element) => this.elementId(element) === '0');
    const layerCells = children.filter((element) => element !== rootCell && this.isRootLayerCell(element));
    const logicalLayers = layerCells.filter((element) => /^(common_)?layer\.logical\./.test(this.elementId(element)));
    const baseLayers = layerCells.filter((element) => !logicalLayers.includes(element));
    // Draw.io lists layers from top to bottom in reverse XML order.
    logicalLayers.sort((left, right) => LOGICAL_LAYER_NAME_COLLATOR.compare(
      this.layerValue(right), this.layerValue(left)
    ));
    const bodyElements = children.filter((element) => element !== rootCell && !this.isRootLayerCell(element));
    const ordered = [
      ...(rootCell ? [rootCell] : []),
      ...baseLayers,
      ...logicalLayers,
      ...this.orderRootBodyElements(bodyElements)
    ];
    for (const element of ordered) rootElement.appendChild(element);
  }

  ensureRootLayer(document, rootElement, layerId, label, hidden = false) {
    let layer = this.findRootChildById(rootElement, layerId);
    if (!layer) {
      layer = this.makeElement(document, 'mxCell', {
        id: layerId,
        value: label,
        parent: '0'
      });
      if (hidden) layer.setAttribute('visible', '0');
      rootElement.appendChild(layer);
      return layer;
    }
    layer.setAttribute('value', label);
    layer.setAttribute('parent', '0');
    if (hidden) layer.setAttribute('visible', '0');
    else layer.removeAttribute('visible');
    return layer;
  }

  serviceLayerIdForSchema(schema) {
    if (schemaMatches(schema, SCHEMAS.KB)) return SECURITY_SERVICES_LAYER_ID;
    return this.targetSchemaConfig(schema) ? TECH_SERVICES_LAYER_ID : '';
  }

  serviceLayerIdForGroup(groupItems) {
    if (groupItems.some((item) => this.serviceLayerIdForSchema(item.schema) === SECURITY_SERVICES_LAYER_ID)) {
      return SECURITY_SERVICES_LAYER_ID;
    }
    if (groupItems.some((item) => this.serviceLayerIdForSchema(item.schema) === TECH_SERVICES_LAYER_ID)) {
      return TECH_SERVICES_LAYER_ID;
    }
    return '';
  }

  ensureServiceLayers(document, rootElement, layerIds = SERVICE_LAYER_IDS) {
    if (layerIds.has?.(SECURITY_SERVICES_LAYER_ID) || layerIds.includes?.(SECURITY_SERVICES_LAYER_ID)) {
      this.ensureRootLayer(document, rootElement, SECURITY_SERVICES_LAYER_ID, SECURITY_SERVICES_LAYER_LABEL);
    }
    if (layerIds.has?.(TECH_SERVICES_LAYER_ID) || layerIds.includes?.(TECH_SERVICES_LAYER_ID)) {
      this.ensureRootLayer(document, rootElement, TECH_SERVICES_LAYER_ID, TECH_SERVICES_LAYER_LABEL);
    }
    if (layerIds.has?.(APPLICATION_COMPONENTS_LAYER_ID) || layerIds.includes?.(APPLICATION_COMPONENTS_LAYER_ID)) {
      this.ensureRootLayer(document, rootElement, APPLICATION_COMPONENTS_LAYER_ID, APPLICATION_COMPONENTS_LAYER_LABEL);
    }
  }

  promoteServiceGroupsToLayers(document, rootElement, groupLayerIds) {
    const usedLayerIds = new Set(Object.values(groupLayerIds).filter(Boolean));
    if (!usedLayerIds.size) return;
    usedLayerIds.add(APPLICATION_COMPONENTS_LAYER_ID);
    this.ensureServiceLayers(document, rootElement, usedLayerIds);

    const index = this.buildPageIndex(rootElement);
    for (const [groupId, layerId] of Object.entries(groupLayerIds)) {
      const cell = index.cellsById[groupId];
      if (!cell || !layerId) continue;
      const geometry = cell.querySelector('mxGeometry');
      const absolute = this.absoluteGeometry(groupId, index);
      if (geometry && absolute) {
        geometry.setAttribute('x', this.formatNumber(absolute[0]));
        geometry.setAttribute('y', this.formatNumber(absolute[1]));
      }
      cell.setAttribute('parent', layerId);
    }
  }

  ensureCommonBaseLayers(document, commonRoot) {
    this.ensureServiceLayers(document, commonRoot);
  }

  ensureCommonTagLayer(document, commonRoot, tag) {
    const layerId = this.commonTagLayerId(tag);
    if (!this.findRootChildById(commonRoot, layerId)) {
      commonRoot.appendChild(this.makeElement(document, 'mxCell', {
        id: layerId,
        value: String(tag),
        parent: '0',
        visible: '0'
      }));
    }
    return layerId;
  }

  ensureCommonComputedRouteLayer(document, commonRoot, routeSettings, tag = null) {
    const layer = computedRouteLayerForTag(routeSettings, tag);
    const layerId = commonComputedRouteLayerId(layer);
    this.ensureCommonAggregatedLayer(document, commonRoot, layerId, layer.layerLabel, layer.layerHidden);
    return layerId;
  }

  normalizeLogicalTopology(linkOid, linkData, pageName) {
    const rawTopology = linkData?.topology;
    let topology = String(rawTopology || 'star').toLowerCase();
    if (rawTopology && !['star', 'chain'].includes(topology)) {
      logger.warn(() => `logical_link ${linkOid} on page "${pageName}": unknown topology "${rawTopology}", using star`);
      topology = 'star';
    }
    return topology;
  }

  logicalLinkTargets(linkData, targetsKey = 'target') {
    return normalizeValues(linkData?.[targetsKey]).filter(Boolean);
  }

  logicalLinkSteps(sourceId, targetIds, topology) {
    if (topology === 'chain') {
      return targetIds.map((targetId, index) => [index === 0 ? sourceId : targetIds[index - 1], targetId]);
    }
    return targetIds.map((targetId) => [sourceId, targetId]);
  }

  commonLogicalLinkStyle(direction) {
    return COMMON_LOGICAL_LINK_STYLES[String(direction || '==>')] ?? COMMON_LOGICAL_LINK_STYLES['==>'];
  }

  isLogicalLinkEdge(element) {
    const mx = this.mxCell(element);
    return (
      element?.tagName?.toLowerCase() === 'object'
      && mx?.getAttribute('edge') === '1'
      && schemaMatches(element.getAttribute('schema'), SCHEMAS.LOGICAL_LINK)
    );
  }

  isLogicalLinkVisualEdge(element) {
    const mx = this.mxCell(element);
    if (element?.tagName?.toLowerCase() !== 'object' || mx?.getAttribute('edge') !== '1') return false;
    return schemaMatches(element.getAttribute('schema'), SCHEMAS.LOGICAL_LINK)
      || element.getAttribute('common_logical_link') === 'true';
  }

  registerCommonRef(commonRefsByOriginal, originalId, commonId, pageName, pageIndex) {
    if (!originalId || ['0', '1'].includes(originalId) || !commonId) return;
    commonRefsByOriginal[originalId] = commonRefsByOriginal[originalId] ?? [];
    const refs = commonRefsByOriginal[originalId];
    if (refs.some((ref) => ref.commonId === commonId && ref.pageName === pageName)) return;
    refs.push({ commonId, pageName, pageIndex });
  }

  dedupeCommonRefPairs(refPairs) {
    const result = [];
    const seen = new Set();
    for (const [sourceRef, targetRef] of refPairs) {
      const sourceCommonId = sourceRef.commonId;
      const targetCommonId = targetRef.commonId;
      if (sourceCommonId === targetCommonId) continue;
      const key = `${sourceCommonId}\u0000${targetCommonId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push([sourceRef, targetRef]);
    }
    return result;
  }

  selectCommonRefPairs(sourceRefs, targetRefs) {
    const samePagePairs = [];
    for (const sourceRef of sourceRefs) {
      for (const targetRef of targetRefs) {
        if (sourceRef.pageName === targetRef.pageName) samePagePairs.push([sourceRef, targetRef]);
      }
    }
    if (samePagePairs.length) return this.dedupeCommonRefPairs(samePagePairs);

    const sourceCommonIds = new Set(sourceRefs.map((ref) => ref.commonId));
    const targetCommonIds = new Set(targetRefs.map((ref) => ref.commonId));
    if (sourceCommonIds.size === 1) {
      return this.dedupeCommonRefPairs(targetRefs.map((targetRef) => [sourceRefs[0], targetRef]));
    }
    if (targetCommonIds.size === 1) {
      return this.dedupeCommonRefPairs(sourceRefs.map((sourceRef) => [sourceRef, targetRefs[0]]));
    }

    const sourceRef = [...sourceRefs].sort((a, b) => a.pageIndex - b.pageIndex)[0];
    const targetRef = [...targetRefs].sort((a, b) => a.pageIndex - b.pageIndex)[0];
    return this.dedupeCommonRefPairs([[sourceRef, targetRef]]);
  }

  appendCommonLogicalEdge(document, commonRoot, {
    linkOid,
    sourceOriginalId,
    targetOriginalId,
    sourceCommonId,
    targetCommonId,
    sourcePageName,
    targetPageName,
    style,
    parentId,
    topology,
    stepIndex,
    route
  }) {
    const edgeId = `common_logical_${hashString(`${linkOid}|${topology}|${stepIndex}|${sourceCommonId}|${targetCommonId}|${parentId}`)}`;
    const object = this.makeElement(document, 'object', {
      id: edgeId,
      label: '',
      common_visual_copy: 'true',
      common_logical_link: 'true',
      logical_link_id: linkOid,
      source_oid: sourceOriginalId,
      target_oid: targetOriginalId,
      source_page: sourcePageName,
      target_page: targetPageName,
      topology,
      step_index: stepIndex,
      computed_route: route?.computedRoute ? 'true' : undefined,
      route_expanded: route?.computedRoute ? (route.routeExpanded ? 'true' : 'false') : undefined,
      route_path: route?.routePath,
      route_source: route?.routeSourceId,
      route_target: route?.routeTargetId,
      route_step_index: route?.routeStepIndex,
      route_segment_index: route?.routeSegmentIndex,
      route_segment_count: route?.routeSegmentCount,
      route_failed: route?.routeFailed ? 'true' : undefined
    });
    const cell = this.makeElement(document, 'mxCell', {
      style,
      edge: '1',
      parent: parentId,
      source: sourceCommonId,
      target: targetCommonId
    });
    cell.appendChild(this.makeElement(document, 'mxGeometry', { relative: '1', as: 'geometry' }));
    object.appendChild(cell);
    commonRoot.appendChild(object);
  }

  drawCommonLogicalLinks(document, commonRoot, commonRefsByOriginal) {
    const logicalLinks = getSchemaData(this.sourceData, SCHEMAS.LOGICAL_LINK);
    if (!logicalLinks || typeof logicalLinks !== 'object') return;

    let drawnEdges = 0;
    let skippedEdges = 0;
    for (const [linkOid, linkData] of Object.entries(logicalLinks)) {
      if (!linkData || typeof linkData !== 'object') continue;
      const sourceId = linkData.source;
      if (!sourceId) continue;
      const routeSettings = logicalRouteSettings(this.layoutSettings);
      const logicalSteps = buildLogicalLinkSteps({
        linkOid,
        linkData: { ...linkData },
        targetsKey: 'target',
        pageName: 'common page',
        sourceData: this.sourceData,
        layoutSettings: this.layoutSettings,
        logger,
        allowedNodeIds: Object.keys(commonRefsByOriginal)
      });
      if (!logicalSteps.length) continue;
      const style = this.commonLogicalLinkStyle(linkData.direction);
      const tags = normalizeValues(linkData.tags);
      const hasComputedRoute = logicalSteps.some((step) => step.computedRoute);
      const parentIds = hasComputedRoute
        ? (tags.length
          ? tags.map((tag) => this.ensureCommonComputedRouteLayer(document, commonRoot, routeSettings, tag))
          : [this.ensureCommonComputedRouteLayer(document, commonRoot, routeSettings)])
        : tags.length
        ? tags.map((tag) => this.ensureCommonTagLayer(document, commonRoot, tag))
        : ['1'];

      for (const step of logicalSteps) {
        const stepIndex = step.stepIndex;
        const stepSourceId = step.sourceId;
        const targetId = step.targetId;
        const sourceRefs = commonRefsByOriginal[stepSourceId] ?? [];
        const targetRefs = commonRefsByOriginal[targetId] ?? [];
        if (!sourceRefs.length || !targetRefs.length) {
          skippedEdges++;
          logger.warn(() => `logical_link ${linkOid} on common page: can't draw ${stepSourceId} -> ${targetId}; endpoint missing`);
          continue;
        }

        const refPairs = this.selectCommonRefPairs(sourceRefs, targetRefs);
        for (const parentId of parentIds) {
          for (const [sourceRef, targetRef] of refPairs) {
            this.appendCommonLogicalEdge(document, commonRoot, {
              linkOid,
              sourceOriginalId: stepSourceId,
              targetOriginalId: targetId,
              sourceCommonId: sourceRef.commonId,
              targetCommonId: targetRef.commonId,
              sourcePageName: sourceRef.pageName,
              targetPageName: targetRef.pageName,
              style,
              parentId,
              topology: step.topology,
              stepIndex,
              route: step
            });
            drawnEdges++;
          }
        }
      }
    }

    if (drawnEdges || skippedEdges) {
      logger.info(() => `Common page logical_links edges drawn=${drawnEdges}, skipped=${skippedEdges}`);
    }
  }

  ensureVisibleLogicalLayer(document, graphRoot) {
    let layer = this.findRootChildById(graphRoot, VISIBLE_LOGICAL_LAYER_ID);
    if (!layer) {
      layer = this.makeElement(document, 'mxCell', {
        id: VISIBLE_LOGICAL_LAYER_ID,
        value: VISIBLE_LOGICAL_LAYER_LABEL,
        parent: '0'
      });
    } else {
      layer.setAttribute('value', VISIBLE_LOGICAL_LAYER_LABEL);
      layer.setAttribute('parent', '0');
      layer.removeAttribute('visible');
      graphRoot.removeChild(layer);
    }
    graphRoot.appendChild(layer);
    return VISIBLE_LOGICAL_LAYER_ID;
  }

  isHiddenLogicalTagLayer(parentId) {
    if (!parentId || parentId === VISIBLE_LOGICAL_LAYER_ID) return false;
    return parentId.startsWith('layer.logical.') || parentId.startsWith('common_layer.logical.');
  }

  shouldUseVisibleLogicalLayer(element, mx) {
    if (element.getAttribute('tags')) return false;
    return !this.isHiddenLogicalTagLayer(mx.getAttribute('parent'));
  }

  bringLogicalLinksToFront(document, mxFileXml) {
    const movedByPage = {};
    for (const diagram of Array.from(mxFileXml.getElementsByTagName('diagram'))) {
      const pageName = diagram.getAttribute('name') || '';
      const graphRoot = diagram.getElementsByTagName('root')[0];
      if (!graphRoot) continue;

      let visibleLayerId = '';
      let visibleEdges = 0;
      const logicalEdges = [];
      for (const element of Array.from(graphRoot.children ?? [])) {
        if (!this.isLogicalLinkVisualEdge(element)) continue;
        const mx = this.mxCell(element);
        if (this.shouldUseVisibleLogicalLayer(element, mx)) {
          if (!visibleLayerId) visibleLayerId = this.ensureVisibleLogicalLayer(document, graphRoot);
          mx.setAttribute('parent', visibleLayerId);
          visibleEdges++;
        }
        graphRoot.removeChild(element);
        logicalEdges.push(element);
      }
      for (const element of logicalEdges) graphRoot.appendChild(element);
      this.normalizeRootChildOrder(graphRoot);
      if (logicalEdges.length) movedByPage[pageName] = { total: logicalEdges.length, visible: visibleEdges };
    }

    const details = Object.entries(movedByPage)
      .map(([pageName, counts]) => `${pageName}: total=${counts.total}, visible_layer=${counts.visible}`)
      .join(', ');
    if (details) logger.info(() => `logical_links moved to foreground logical layer: ${details}`);
  }

  commonLocationSettings() {
    const raw = this.layoutSettings?.common_location ?? this.layoutSettings ?? {};
    const enabled = raw.common_location_page ?? raw.commonLocationPage;
    return {
      enabled: enabled === undefined ? true : Boolean(enabled),
      name: raw.common_location_page_name ?? raw.commonLocationPageName ?? 'Общая схема',
      gap: Number(raw.common_location_page_gap ?? raw.commonLocationPageGap ?? 120),
      providerZones: new Set(normalizeValues(raw.common_location_provider_zones ?? raw.commonLocationProviderZones ?? ['INTERNET', 'INET-EDGE'])
        .map((zone) => String(zone).toUpperCase()))
    };
  }

  appendCommonLocationPage(document, mxFileXml) {
    const settings = this.commonLocationSettings();
    if (!settings.enabled) return;

    for (const diagram of Array.from(mxFileXml.getElementsByTagName('diagram'))) {
      if (diagram.getAttribute('name') === settings.name) mxFileXml.removeChild(diagram);
    }

    const sourceNames = new Set(this.commonLocationSourcePages);
    if (!sourceNames.size) return;
    const sourceDiagrams = Array.from(mxFileXml.getElementsByTagName('diagram'))
      .filter((diagram) => sourceNames.has(diagram.getAttribute('name')));
    if (!sourceDiagrams.length) return;

    const commonDiagram = this.makeElement(document, 'diagram', { id: 'common_location_page', name: settings.name });
    const model = this.makeElement(document, 'mxGraphModel', {
      dx: '1800',
      dy: '1200',
      grid: '0',
      gridSize: '10',
      guides: '1',
      tooltips: '1',
      connect: '1',
      arrows: '1',
      fold: '1',
      page: '0',
      pageScale: '1',
      pageWidth: '1800',
      pageHeight: '1200',
      math: '0',
      shadow: '0'
    });
    const commonRoot = this.makeElement(document, 'root');
    commonRoot.appendChild(this.makeElement(document, 'mxCell', { id: '0' }));
    commonRoot.appendChild(this.makeElement(document, 'mxCell', { id: '1', parent: '0' }));
    this.ensureCommonBaseLayers(document, commonRoot);
    model.appendChild(commonRoot);
    commonDiagram.appendChild(model);

    const marginX = 40;
    const providerColumnWidth = 160;
    const providerGapX = 80;
    const hasCommonProviderNetworks = sourceDiagrams.some((sourceDiagram) => {
      const sourceRoot = sourceDiagram.getElementsByTagName('root')[0];
      return Array.from(sourceRoot?.children ?? [])
        .some((element) => this.isCommonProviderNetwork(element, settings.providerZones));
    });
    const contentMarginX = marginX + (hasCommonProviderNetworks ? providerColumnWidth + providerGapX : 0);
    let cursorY = 40;
    const gap = Number.isFinite(settings.gap) ? settings.gap : 120;
    let maxRight = contentMarginX;
    const commonProviderIds = new Set();
    const providerLabels = {};
    const providerOccurrences = {};
    const commonRefsByOriginal = {};
    const commonLayerIdsByValue = {
      [SECURITY_SERVICES_LAYER_LABEL]: SECURITY_SERVICES_LAYER_ID,
      [TECH_SERVICES_LAYER_LABEL]: TECH_SERVICES_LAYER_ID
    };
    const sourcePageMetrics = sourceDiagrams.map((sourceDiagram) => {
      const sourceRoot = sourceDiagram.getElementsByTagName('root')[0];
      if (!sourceRoot) return null;
      const [minX, minY, pageMaxX, pageMaxY] = this.pageBBox(sourceRoot);
      const anchorX = this.commonAlignmentAnchorX(sourceRoot);
      const normalizedAnchorX = anchorX === null ? null : anchorX + contentMarginX - minX;
      return { minX, minY, pageMaxX, pageMaxY, anchorX, normalizedAnchorX };
    });
    const targetAnchorX = sourcePageMetrics
      .map((metric) => metric?.normalizedAnchorX)
      .filter((value) => value !== null && value !== undefined)
      .reduce((max, value) => Math.max(max, value), -Infinity);

    sourceDiagrams.forEach((sourceDiagram, pageIndex) => {
      const sourcePageName = sourceDiagram.getAttribute('name') || `page_${pageIndex}`;
      const sourceRoot = sourceDiagram.getElementsByTagName('root')[0];
      if (!sourceRoot) return;

      const metrics = sourcePageMetrics[pageIndex];
      if (!metrics) return;
      const { minX, minY, pageMaxX, pageMaxY } = metrics;
      const alignDelta = Number.isFinite(targetAnchorX) && metrics.normalizedAnchorX !== null
        ? targetAnchorX - metrics.normalizedAnchorX
        : 0;
      const xDelta = contentMarginX - minX + alignDelta;
      const yDelta = cursorY - minY;
      const index = this.buildPageIndex(sourceRoot);
      const idMap = {};
      const skipIds = new Set();
      const coordinateRootParents = new Set(['0', '1', SECURITY_SERVICES_LAYER_ID, TECH_SERVICES_LAYER_ID]);
      const visualLayerIdsBySourceId = {};

      for (const layerId of SERVICE_LAYER_IDS) {
        idMap[layerId] = layerId === APPLICATION_COMPONENTS_LAYER_ID ? '1' : layerId;
      }

      for (const element of Array.from(sourceRoot.children ?? [])) {
        const id = this.elementId(element);
        const mx = this.mxCell(element);
        if (!id || !mx || !this.isCommonProviderNetwork(element, settings.providerZones)) continue;

        const provider = String(element.getAttribute('provider')
          || element.getAttribute('title')
          || element.getAttribute('label')
          || 'Provider');
        const providerKey = this.providerKey(provider);
        const commonProviderId = this.providerId(provider);
        providerLabels[providerKey] = providerLabels[providerKey] ?? provider;
        commonProviderIds.add(commonProviderId);
        idMap[id] = commonProviderId;

        const groupId = mx.getAttribute('parent');
        if (groupId && !['0', '1'].includes(groupId)) {
          idMap[groupId] = commonProviderId;
          for (const descendantId of this.descendantIds(groupId, index.childrenByParent)) skipIds.add(descendantId);
          const groupGeometry = this.absoluteGeometry(groupId, index);
          if (groupGeometry) {
            const [, groupY, , groupHeight] = groupGeometry;
            providerOccurrences[providerKey] = providerOccurrences[providerKey] ?? [];
            providerOccurrences[providerKey].push(groupY + yDelta + groupHeight / 2);
          }
        } else {
          providerOccurrences[providerKey] = providerOccurrences[providerKey] ?? [];
          providerOccurrences[providerKey].push(cursorY);
        }
      }

      for (const element of Array.from(sourceRoot.children ?? [])) {
        if (!this.isCommonAggregatedRootVisual(element)) continue;
        const id = this.elementId(element);
        const mx = this.mxCell(element);
        const value = this.layerValue(element);
        const commonLayerId = this.commonVisualLayerIdForSource(id, value, commonLayerIdsByValue);
        this.ensureCommonAggregatedLayer(document, commonRoot, commonLayerId, value, mx?.getAttribute('visible') === '0');
        visualLayerIdsBySourceId[id] = commonLayerId;
        coordinateRootParents.add(commonLayerId);
      }

      for (const element of Array.from(sourceRoot.children ?? [])) {
        const id = this.elementId(element);
        if (!id || ['0', '1'].includes(id) || !this.isPlainRootLayerCell(element)) continue;
        if (SERVICE_LAYER_IDS.has(id)) continue;

        if (id.startsWith('layer.logical.')) {
          const tag = this.layerValue(element) || id.replace(/^layer\.logical\./, '');
          idMap[id] = this.commonTagLayerId(tag);
          coordinateRootParents.add(idMap[id]);
          skipIds.add(id);
          continue;
        }

        const commonLayerId = this.commonLayerIdForSource(pageIndex, id, this.layerValue(element), commonLayerIdsByValue);
        idMap[id] = commonLayerId;
        coordinateRootParents.add(commonLayerId);
        if (commonLayerId !== `common_${pageIndex}_${id}`) skipIds.add(id);
      }

      const copyElements = Array.from(sourceRoot.children ?? [])
        .map((element, order) => ({ element, order }))
        .sort((left, right) => {
          const rankDiff = this.commonPageZOrderRank(left.element) - this.commonPageZOrderRank(right.element);
          return rankDiff || left.order - right.order;
        });
      for (const { element } of copyElements) {
        const id = this.elementId(element);
        if (['0', '1'].includes(id) || skipIds.has(id)) continue;
        if (SERVICE_LAYER_IDS.has(id)) continue;
        if (id && !idMap[id]) idMap[id] = `common_${pageIndex}_${id}`;
        const mx = this.mxCell(element);
        const cellId = mx?.getAttribute('id');
        if (cellId && !['0', '1'].includes(cellId) && !SERVICE_LAYER_IDS.has(cellId) && !idMap[cellId]) idMap[cellId] = `common_${pageIndex}_${cellId}`;
      }

      for (const [originalId, commonId] of Object.entries(idMap)) {
        this.registerCommonRef(commonRefsByOriginal, originalId, commonId, sourcePageName, pageIndex);
      }

      for (const element of Array.from(sourceRoot.children ?? [])) {
        const id = this.elementId(element);
        if (['0', '1'].includes(id) || skipIds.has(id)) continue;
        if (SERVICE_LAYER_IDS.has(id)) continue;
        if (this.isLogicalLinkEdge(element)) continue;
        const clone = element.cloneNode(true);
        this.rewriteIds(clone, idMap);
        const mx = this.mxCell(clone);
        if (visualLayerIdsBySourceId[id] && mx) mx.setAttribute('parent', visualLayerIdsBySourceId[id]);
        if (mx?.getAttribute('edge') === '1' && mx.getAttribute('source') === mx.getAttribute('target')) continue;
        if (this.edgeTargetsCommonProvider(clone, commonProviderIds)) this.resetEdgeGeometry(clone);
        this.shiftGeometry(clone, xDelta, yDelta, coordinateRootParents);
        commonRoot.appendChild(clone);
      }

      maxRight = Math.max(maxRight, pageMaxX + xDelta);
      cursorY += (pageMaxY - minY) + gap;
    });

    const providerX = marginX;
    const providerPositions = Object.entries(providerOccurrences)
      .map(([providerKey, occurrences]) => {
        const avgY = occurrences.length
          ? occurrences.reduce((sum, value) => sum + value, 0) / occurrences.length
          : 40;
        return [avgY, providerKey];
      })
      .sort((left, right) => left[0] - right[0]);
    let lastProviderY = null;
    for (const [avgY, providerKey] of providerPositions) {
      let nodeY = avgY - 40;
      if (lastProviderY !== null && nodeY < lastProviderY + 120) nodeY = lastProviderY + 120;
      lastProviderY = nodeY;
      const label = providerLabels[providerKey] ?? providerKey;
      commonRoot.appendChild(this.createCommonProviderNode(document, this.providerId(label), label, providerX, nodeY));
    }

    this.sortCommonVisualClones(commonRoot);
    this.drawCommonLogicalLinks(document, commonRoot, commonRefsByOriginal);
    this.bringCommonForegroundLayersToFront(commonRoot);

    const providerRight = providerPositions.length ? providerX + providerColumnWidth + 80 : 0;
    const pageWidth = Math.max(maxRight + 80, providerRight, 1200);
    const pageHeight = Math.max(cursorY + 80, (lastProviderY ?? 0) + 140, 1200);
    model.setAttribute('dx', this.formatNumber(pageWidth));
    model.setAttribute('dy', this.formatNumber(pageHeight));
    model.setAttribute('pageWidth', this.formatNumber(pageWidth));
    model.setAttribute('pageHeight', this.formatNumber(pageHeight));
    mxFileXml.appendChild(commonDiagram);
  }

  /**
   * Layout generated service groups inside their resolved network segments.
   * @param {Object} context generated-page layout indexes and registries
   */
  layoutManagedSegments({
    drawioXml,
    rootElement,
    allSegmentIndex,
    managedSegmentIndex,
    segmentOrder,
    objectIndex,
    zoneIndex,
    serviceGroupIdsBySegment,
    serviceGroupLayerIds
  }) {
    for (const segmentId of segmentOrder) {
      const segmentItems = managedSegmentIndex[segmentId].items.sort((a, b) => {
        const left = a.element.getAttribute('id') ?? '';
        const right = b.element.getAttribute('id') ?? '';
        return this.compareIds(left, right);
      });
      if (!segmentItems.length) continue;
      const segmentObject = objectIndex[segmentId].element;
      if (!segmentObject) logger.error(() => `Can't find segment object for segment ${segmentId}`);
      const segmentCell = this.mxCell(segmentObject);
      const segmentGeometry = segmentCell.querySelector('mxGeometry');
      const segmentWidth = this.getFloatAttribute(segmentGeometry, 'width');
      const segmentCurrentChildren = this.directVertexChildren(rootElement, segmentId);
      const [existingBottom, baseWidth] = this.measureSegment(segmentCurrentChildren, true);

      const segmentRules = this.resolveSegmentRules(segmentId, allSegmentIndex, zoneIndex);
      const layoutMode = segmentRules.layout_mode ?? 'stack_down';
      const segmentGroups = {};
      for (const item of segmentItems) {
        if (!item.group) {
          logger.error(() => 'Expected group on a service, but found none.', item);
        } else {
          segmentGroups[item.group] = segmentGroups[item.group]?.concat([item]) ?? [item];
        }
      }

      const layout = {};
      const appendAnchor = Math.max(baseWidth, this.estimateLabelWidth(segmentObject.getAttribute('label')));
      const stackAnchor = Math.max(this.constants.SEGMENT_PADDING_X, appendAnchor + this.constants.SERVICE_GROUP_GAP);
      let rowX = layoutMode === 'append_right'
        ? appendAnchor + this.constants.APPEND_RIGHT_GAP
        : stackAnchor;
      let rowY = 0;
      let rowHeight = 0;
      const wrapLimit = layoutMode === 'append_right'
        ? Math.max(
          appendAnchor + (segmentRules.append_width ?? segmentWidth - this.constants.SEGMENT_PADDING_RIGHT),
          rowX + this.constants.MIN_CONTAINER_WIDTH
        )
        : segmentWidth - this.constants.SEGMENT_PADDING_RIGHT;

      const orderedGroups = Object.entries(segmentGroups).sort(([left], [right]) =>
        this.compareIds(left, right)
      );
      for (const [groupName, groupItems] of orderedGroups) {
        const slotSize = groupItems.reduce((acc, item) => ({
          width: Math.max(item.width, acc.width),
          height: Math.max(item.height, acc.height)
        }), { width: 0, height: 0 });
        const { width, height, positions } = this.computeGroupBox(groupItems.length, slotSize, groupName);
        const minX = layoutMode === 'append_right'
          ? appendAnchor + this.constants.APPEND_RIGHT_GAP
          : stackAnchor;
        if (rowX + width > wrapLimit && rowX > minX) {
          rowY += rowHeight + this.constants.ROW_GAP;
          rowX = minX;
          rowHeight = 0;
        }
        layout[groupName] = {
          rel_x: rowX,
          rel_y: rowY,
          width,
          height,
          positions,
          slot_w: slotSize.width,
          slot_h: slotSize.height
        };
        rowX += width + this.constants.COL_GAP;
        rowHeight = Math.max(rowHeight, height);
      }

      const totalStackHeight = rowY + rowHeight;
      const techTop = layoutMode === 'append_right'
        ? segmentRules.tech_top ?? this.constants.SEGMENT_PADDING_X
        : Math.max(existingBottom + this.constants.TECH_GAP_TOP, this.constants.TECH_GAP_TOP);
      const contentBottom = techTop + totalStackHeight;
      const targetHeight = Math.max(existingBottom, contentBottom) + this.constants.BOTTOM_MARGIN;
      segmentGeometry.setAttribute('height', this.formatNumber(targetHeight));

      let maxContainerRight = appendAnchor;
      for (const [label, groupItems] of orderedGroups) {
        const info = layout[label];
        const groupId = `tech_group_${segmentId}_${label}`;
        serviceGroupIdsBySegment[segmentId] = serviceGroupIdsBySegment[segmentId] ?? [];
        serviceGroupIdsBySegment[segmentId].push(groupId);
        const serviceLayerId = this.serviceLayerIdForGroup(groupItems);
        if (serviceLayerId) serviceGroupLayerIds[groupId] = serviceLayerId;
        const absX = info.rel_x;
        const absY = techTop + info.rel_y;
        this.addContainer(drawioXml, rootElement, segmentId, groupId, label, absX, absY, info.width, info.height);
        const { slot_w, slot_h } = info;
        for (let i = 0; i < groupItems.length; i++) {
          const item = groupItems[i];
          const { x, y } = info.positions[i];
          const mxGeom = item.cell.querySelector('mxGeometry');
          if (!mxGeom) logger.warn(() => `Could't locate mxGeometry node for item ${item.element.getAttribute('id')}`);
          const offsetX = Math.max(0, (slot_w - item.width) / 2);
          const offsetY = Math.max(0, (slot_h - item.height) / 2);
          mxGeom.setAttribute('x', x + offsetX);
          mxGeom.setAttribute('y', y + offsetY);
          item.cell.setAttribute('parent', groupId);
        }
        maxContainerRight = Math.max(maxContainerRight, absX + info.width);
      }

      const requiredWidth = Math.max(
        this.constants.MIN_CONTAINER_WIDTH,
        baseWidth + this.constants.SEGMENT_PADDING_RIGHT,
        maxContainerRight + this.constants.SEGMENT_PADDING_RIGHT
      );
      segmentGeometry.setAttribute('width', this.formatNumber(requiredWidth));
      this.shiftStackBelow(objectIndex, segmentGeometry, segmentRules, this.constants.SEGMENT_PADDING_X);
      this.shiftNeighborChain(objectIndex, segmentGeometry, segmentRules, this.constants.SEGMENT_PADDING_X);
    }
    this.promoteServiceGroupsToLayers(drawioXml, rootElement, serviceGroupLayerIds);
  }

  generateXml(diff) {
    logger.info(() => 'diagram.generateXml() invoked.');
    const parser = new DOMParser();
    const drawioXml = parser.parseFromString(DRAWIO_XML_START + DRAWIO_XML_END, 'application/xml');
    const mxFileXml = drawioXml.getElementsByTagName('mxfile')[0];
    for (const diagramKey in this.data) {
      const objectIndex = {};
      this.objects[diagramKey] = objectIndex;
      const cellIndex = {};
      const managedSegmentIndex = {};
      const allSegmentIndex = {};
      const managedObjects = {};
      const unplacedCarrierServices = [];
      const serviceGroupLayerIds = {};
      const serviceGroupIdsBySegment = {};
      // A registry mapping object ids to their corresponding segments.
      const objectSegments = {};
      // A registry mapping keys 'zoneName:location' to arrays of segmentIds.
      const zoneIndex = {};
      let diagramXmlString = this.diagrams[diagramKey].start;
      let diagramXml = parser.parseFromString(diagramXmlString + this.diagrams[diagramKey].end, 'application/xml').firstElementChild;
      const diagramId = diagramXml.getAttribute('id');
      this.indices[diagramId] = {};

      // Establish all initial elements for layout later
      const rootElement = diagramXml.querySelector('root');
      this.ensureServiceLayers(drawioXml, rootElement);
      const dcCell = diagramXml.querySelector(`[id="${LOCATION_CONTAINER_ID}"]`);
      if (!dcCell) logger.info(() => `No DC cell found for diagram ${diagramKey}`);
      const dcGeom = dcCell?.querySelector('mxGeometry');

      for (const id in this.data[diagramKey]) {
        const item = this.data[diagramKey][id];
        const builder = new xmlTool.Builder({
          headless: true,
          rootName: item.xmlTag
        });
        let xml = '';
        try {
          xml = builder.buildObject(item.template);
        } catch (e) {
          logger.error(() => `Faled to create XML from template for item on diagram ${diagramKey}, id ${id}`, e);
          continue;
        }
        xml = mustache.render(xml, {
          ...item.primaryVars,
          ...item.renderVars,
          ...item.secondaryVars
        }, {}, [ '{', '}' ]);
        xml = mustache.render(xml, item.secondaryVars, {}, [ '[:[', ']:]' ]);
        const element = parser.parseFromString(xml, 'application/xml').firstElementChild;
        if (element) {
          this.indices[diagramId][id] = { element };
        }
        if (item.xmlTag.toLowerCase() ==='mxcell') {
          cellIndex[id] = {
            item,
            element
          };
        }
        if (schemaMatches(element.getAttribute('schema'), SCHEMAS.NETWORK_SEGMENT)) {
          allSegmentIndex[id] = {
            item,
            element
          };
          const segmentMeta = this.segmentMeta(item, element);
          if (!segmentMeta) {
            logger.error(() => `Found network segment ${id}, but something is wrong with zone/location attributes.`);
          } else {
            allSegmentIndex[id].meta = segmentMeta;
            const metaKey = `${segmentMeta.zone}:${segmentMeta.location}`;
            if (zoneIndex[metaKey]) {
              zoneIndex[metaKey].push(id);
            } else {
              zoneIndex[metaKey] = [id];
            }
          }
        }
        if (item.xmlTag.toLowerCase() === 'object') {
          objectIndex[id] = {
            item,
            element
          };

          const objectSegment = element.getAttribute('segment');
          if (objectSegment) objectIndex[id].segment = objectSegment;

          const schema = item.primaryVars?.schema ?? item.schema;
          const schemaConf = this.targetSchemaConfig(schema);
          if (schemaConf) {
            const primaryCell = cellIndex[`${id}_0`]?.element ??
              this.mxCell(element);
            if (primaryCell) {
              const schemaId = schemaConf.schemaId;
              const schemaSegment = schemaId?.['segment_id'];

              const derivedSegment = this.deriveSegmentFromConnections(item, schemaConf, objectIndex);
              const parentSegment = this.segmentFromParent(primaryCell.getAttribute('parent'), objectIndex);
              const baseSegmentId = derivedSegment ?? schemaSegment ?? parentSegment ?? '';
              objectSegments[id] = baseSegmentId;
              const elementSchema = element.getAttribute('schema');
              const segmentId = !schemaMatches(elementSchema, SCHEMAS.KB) ?
                baseSegmentId :
                this.applySecurityHints(element, baseSegmentId, allSegmentIndex, zoneIndex, derivedSegment);

              const mxGeom = primaryCell.querySelector('mxGeometry');
              const width = this.getFloatAttribute(mxGeom, 'width', LAYOUT_NODE_DEFAULT_WIDTH);
              let height = this.getFloatAttribute(mxGeom, 'height', LAYOUT_NODE_DEFAULT_HEIGHT);
              if (item.primaryVars.title) {
                height += Math.min(40, item.primaryVars.title.split(' ').length * 10);
              }
              const managedObject = {
                object: item,
                element,
                group: this.resolveGroupKey(element, schemaConf),
                cell: primaryCell,
                schema,
                segmentId,
                width,
                height,
                neighbourId: null
              };
              const segmentObject = allSegmentIndex[segmentId];
              const connections = normalizeValues(
                item.primaryVars?.network_connection ?? element.getAttribute('network_connection')
              );
              const hasExplicitSegment = normalizeValues(
                item.primaryVars?.segment ?? element.getAttribute('segment')
              ).length > 0;
              if (connections.length && !hasExplicitSegment && derivedSegment === '') {
                const layerId = this.serviceLayerIdForSchema(schema);
                unplacedCarrierServices.push({
                  id,
                  cell: primaryCell,
                  layerId,
                  group: managedObject.group,
                  width,
                  height
                });
                primaryCell.setAttribute('parent', layerId);
              } else if (!segmentObject) {
                logger.error(() => `Can't find segmentObject for id ${segmentId}`);
              } else {
                managedSegmentIndex[segmentId] = managedSegmentIndex[segmentId] ?? { element: segmentObject.element, items: [], neighbour: null };
                managedSegmentIndex[segmentId].items.push(managedObject);
              }
              managedObjects[id] = managedObject;
            }
          }
        }
        rootElement.append(element);
      }
      const carrierIds = diagramXml.querySelector(`[id="${CARRIER_INTERNET_ZONE}"]`)
        && diagramXml.querySelector(`[id="${CARRIER_TRANSPORT_ZONE}"]`)
        ? CARRIER_CONTAINER_IDS
        : CARRIER_LAYER_IDS;
      const carrierParentIds = new Set(carrierIds);
      const collectedCarrierObjects = new Set(unplacedCarrierServices.map((service) => service.id));
      for (const [id, record] of Object.entries(objectIndex)) {
        if (managedObjects[id] || collectedCarrierObjects.has(id)) continue;
        const schema = record.item.primaryVars?.schema ?? record.item.schema ?? record.element.getAttribute('schema');
        if (!schemaMatches(schema, SCHEMAS.COMPONENT_USER_DEVICE)) continue;
        const connections = normalizeValues(
          record.item.primaryVars?.network_connection ?? record.element.getAttribute('network_connection')
        );
        const explicitSegment = normalizeValues(
          record.item.primaryVars?.segment ?? record.element.getAttribute('segment')
        );
        if (!connections.length || explicitSegment.length) continue;
        const anchor = cellIndex[`${id}_0`]?.element
          ?? this.mxCell(record.element);
        if (!anchor || anchor.getAttribute('vertex') !== '1' || anchor.getAttribute('edge') === '1') continue;
        const resolvedZones = connections.map((connectionId) => {
          const connection = objectIndex[connectionId];
          let segmentId = normalizeValues(connection?.item?.primaryVars?.segment)[0];
          if (!segmentId && schemaMatches(connection?.item?.primaryVars?.schema, SCHEMAS.NETWORK_SEGMENT)) {
            segmentId = connectionId;
          }
          const connectionParent = (cellIndex[`${connectionId}_0`]?.element
              ?? this.mxCell(connection?.element))?.getAttribute('parent');
          const resolvedParent = !segmentId
            ? this.segmentFromParent(connectionParent, objectIndex, cellIndex, carrierParentIds)
            : null;
          if (resolvedParent && carrierIds.includes(resolvedParent)) {
            return resolvedParent === carrierIds[0]
              ? CARRIER_INTERNET_ZONE
              : CARRIER_TRANSPORT_ZONE;
          }
          segmentId = segmentId || resolvedParent;
          if (segmentId) return allSegmentIndex[segmentId]?.meta?.zone ?? null;
          return null;
        }).filter(Boolean);
        if (resolvedZones.length !== connections.length
          || resolvedZones.some((zone) => !CARRIER_ZONES.includes(zone))) continue;
        const geometry = anchor.querySelector('mxGeometry');
        const layerId = this.serviceLayerIdForSchema(schema) || TECH_SERVICES_LAYER_ID;
        unplacedCarrierServices.push({
          id,
          cell: anchor,
          layerId,
          group: EXTERNAL_USER_DEVICES_LABEL,
          width: this.getFloatAttribute(geometry, 'width', LAYOUT_NODE_DEFAULT_WIDTH),
          height: this.getFloatAttribute(geometry, 'height', LAYOUT_NODE_DEFAULT_HEIGHT)
        });
        anchor.setAttribute('parent', layerId);
      }
      for (const carrierId of carrierIds) {
        const carrier = diagramXml.querySelector(`[id="${carrierId}"]`);
        const geometry = carrier?.querySelector('mxGeometry');
        this.fitContainerToChildren(
          geometry,
          this.directVertexChildren(rootElement, carrierId)
            .filter((element) => !allSegmentIndex[element.getAttribute('id')]),
          this.getFloatAttribute(geometry, 'width'),
          this.getFloatAttribute(geometry, 'height')
        );
      }
      const internetGeometry = diagramXml.querySelector(`[id="${carrierIds[0]}"]`)?.querySelector('mxGeometry');
      const transportGeometry = diagramXml.querySelector(`[id="${carrierIds[1]}"]`)?.querySelector('mxGeometry');
      const segmentOrder = Object.keys(managedSegmentIndex);
      segmentOrder.sort((a, b) => {
        const segmentA = objectIndex[a].element;
        const segmentB = objectIndex[b].element;
        const xa = this.getFloatGeometryAttribute(segmentA, 'x');
        const xb = this.getFloatGeometryAttribute(segmentB, 'x');
        return xa - xb || this.compareIds(a, b);
      });

      for (const [segmentId, segment] of Object.entries(allSegmentIndex)) {
        const cell = this.mxCell(segment.element);
        if (CARRIER_LAYER_IDS.includes(cell?.getAttribute('parent'))) continue;
        const geometry = cell?.querySelector('mxGeometry');
        this.fitContainerToChildren(
          geometry,
          this.directVertexChildren(rootElement, segmentId),
          this.constants.MIN_CONTAINER_WIDTH
        );
      }

      this.layoutManagedSegments({
        drawioXml,
        rootElement,
        allSegmentIndex,
        managedSegmentIndex,
        segmentOrder,
        objectIndex,
        zoneIndex,
        serviceGroupIdsBySegment,
        serviceGroupLayerIds
      });
      const segmentPositionsBeforeDiff = Object.fromEntries(Object.entries(allSegmentIndex).map(([id, segment]) => {
        const geometry = segment.element.querySelector('mxGeometry');
        return [id, [this.getFloatAttribute(geometry, 'x'), this.getFloatAttribute(geometry, 'y')]];
      }));
      const manualGeometryIds = new Set((diff?.[diagramId] ?? [])
        .filter((record) => record.diff?.[GEOMETRY_ATTRS_KEY])
        .map((record) => record.id));
      this.fitContainerToChildren(dcGeom, this.directVertexChildren(rootElement, LOCATION_CONTAINER_ID));
      if (diff?.[diagramId]) {
        logger.info(() => `Applying diff for diagram ${diagramKey}`);
        for (const rec of diff[diagramId]) {
          const elementRecord = this.indices[diagramId][rec.id];
          if (elementRecord) {
            this.applyDiff(drawioXml, elementRecord, rec.diff);
          } else {
            logger.warn(() => `There's diff for element ${rec.id} but there's no such element in the diagram.`);
          }
        }
      }
      for (const [segmentId, [oldX, oldY]] of Object.entries(segmentPositionsBeforeDiff)) {
        const segmentGeometry = allSegmentIndex[segmentId].element.querySelector('mxGeometry');
        const xDelta = this.getFloatAttribute(segmentGeometry, 'x') - oldX;
        const yDelta = this.getFloatAttribute(segmentGeometry, 'y') - oldY;
        this.shiftServiceGroups(rootElement, serviceGroupIdsBySegment, xDelta, yDelta, [segmentId]);
      }
      const pageIndex = this.buildPageIndex(rootElement);
      for (const [segmentId, segment] of Object.entries(allSegmentIndex)) {
        const segmentGeometry = segment.element.querySelector('mxGeometry');
        const segmentBounds = this.absoluteGeometry(segmentId, pageIndex);
        if (!segmentGeometry || !segmentBounds) continue;
        const contentIds = this.descendantIds(segmentId, pageIndex.childrenByParent);
        contentIds.delete(segmentId);
        let contentRight = segmentBounds[0];
        let contentBottom = segmentBounds[1];
        const extendContentBounds = (ids) => {
          for (const id of ids) {
            const cell = pageIndex.cellsById[id];
            const bounds = this.absoluteGeometry(id, pageIndex);
            if (!cell || !bounds) continue;
            const visual = this.rotatedGeometryBounds(cell, cell.querySelector('mxGeometry'));
            contentRight = Math.max(contentRight, bounds[0] + (bounds[2] + visual.width) / 2);
            contentBottom = Math.max(contentBottom, bounds[1] + (bounds[3] + visual.height) / 2);
          }
        };
        extendContentBounds(contentIds);
        const groupIds = [...(serviceGroupIdsBySegment[segmentId] ?? [])]
          .sort((left, right) => this.compareIds(left, right));
        if (manualGeometryIds.has(segmentId)) continue;
        const labelRight = segmentBounds[0] + this.estimateLabelWidth(segment.element.getAttribute('label'));
        const groupX = Math.max(contentRight, labelRight) + this.constants.SERVICE_GROUP_GAP;
        let groupY = segmentBounds[1] + this.constants.SEGMENT_PADDING_X;
        for (const groupId of groupIds) {
          const groupGeometry = this.findRootChildById(rootElement, groupId)?.querySelector('mxGeometry');
          if (!groupGeometry) continue;
          groupGeometry.setAttribute('x', this.formatNumber(groupX));
          groupGeometry.setAttribute('y', this.formatNumber(Math.max(
            this.getFloatAttribute(groupGeometry, 'y'), groupY
          )));
          groupY = this.getFloatAttribute(groupGeometry, 'y')
            + this.getFloatAttribute(groupGeometry, 'height') + this.constants.GAP_Y;
          const groupContentIds = this.descendantIds(groupId, pageIndex.childrenByParent);
          extendContentBounds(groupContentIds);
        }
        segmentGeometry.setAttribute('width', this.formatNumber(Math.max(
          this.getFloatAttribute(segmentGeometry, 'width'),
          contentRight - segmentBounds[0] + this.constants.SEGMENT_PADDING_RIGHT
        )));
        segmentGeometry.setAttribute('height', this.formatNumber(Math.max(
          this.getFloatAttribute(segmentGeometry, 'height'),
          contentBottom - segmentBounds[1] + this.constants.BOTTOM_MARGIN
        )));
      }
      for (const carrierId of carrierIds) {
        const carrierGeometry = diagramXml.querySelector(`[id="${carrierId}"]`)?.querySelector('mxGeometry');
        if (!carrierGeometry) continue;
        const carrierX = this.getFloatAttribute(carrierGeometry, 'x');
        const carrierY = this.getFloatAttribute(carrierGeometry, 'y');
        for (const [segmentId, groupIds] of Object.entries(serviceGroupIdsBySegment)) {
          if (this.mxCell(allSegmentIndex[segmentId]?.element)?.getAttribute('parent') !== carrierId) continue;
          for (const groupId of groupIds) {
            const groupGeometry = this.findRootChildById(rootElement, groupId)?.querySelector('mxGeometry');
            if (!groupGeometry) continue;
            carrierGeometry.setAttribute('width', this.formatNumber(Math.max(
              this.getFloatAttribute(carrierGeometry, 'width'),
              this.getFloatAttribute(groupGeometry, 'x') + this.getFloatAttribute(groupGeometry, 'width')
                - carrierX + this.constants.SEGMENT_PADDING_RIGHT
            )));
            carrierGeometry.setAttribute('height', this.formatNumber(Math.max(
              this.getFloatAttribute(carrierGeometry, 'height'),
              this.getFloatAttribute(groupGeometry, 'y') + this.getFloatAttribute(groupGeometry, 'height')
                - carrierY + this.constants.BOTTOM_MARGIN
            )));
          }
        }
      }
      if (internetGeometry && transportGeometry) {
        const transportX = Math.max(
          this.getFloatAttribute(transportGeometry, 'x'),
          this.getFloatAttribute(internetGeometry, 'x') + this.getFloatAttribute(internetGeometry, 'width') + this.constants.GAP_X
        );
        transportGeometry.setAttribute('x', this.formatNumber(transportX));
        if (carrierIds[0] === CARRIER_INTERNET_ZONE) {
          const excludedIds = new Set([
            ROOT_CELL_ID,
            MAIN_LAYER_ID,
            COMMON_NETWORK_LAYER_ID,
            ...CARRIER_LAYER_IDS,
            ...SERVICE_LAYER_IDS,
            ...carrierIds
          ]);
          const topLevelContent = this.directVertexChildren(rootElement, MAIN_LAYER_ID).filter((element) => {
            const cell = this.mxCell(element);
            return !excludedIds.has(element.getAttribute('id') ?? cell?.getAttribute('id'));
          });
          if (topLevelContent.length) {
            const left = Math.min(...topLevelContent.map((element) => {
              const cell = this.mxCell(element);
              return this.getFloatAttribute(cell?.querySelector('mxGeometry'), 'x');
            }));
            const delta = Math.max(0, transportX + this.getFloatAttribute(transportGeometry, 'width') + this.constants.GAP_X - left);
            for (const element of topLevelContent) {
              const cell = this.mxCell(element);
              const geometry = cell?.querySelector('mxGeometry');
              geometry?.setAttribute('x', this.formatNumber(this.getFloatAttribute(geometry, 'x') + delta));
            }
          }
        } else if (dcGeom) {
          const oldDcX = this.getFloatAttribute(dcGeom, 'x');
          const newDcX = Math.max(
            this.getFloatAttribute(dcGeom, 'x'),
            transportX + this.getFloatAttribute(transportGeometry, 'width') + this.constants.GAP_X
          );
          dcGeom.setAttribute('x', this.formatNumber(newDcX));
          const locationSegmentIds = Object.keys(serviceGroupIdsBySegment).filter((segmentId) =>
            this.mxCell(allSegmentIndex[segmentId]?.element)?.getAttribute('parent') === LOCATION_CONTAINER_ID
          );
          this.shiftServiceGroups(
            rootElement,
            serviceGroupIdsBySegment,
            newDcX - oldDcX,
            0,
            locationSegmentIds
          );
        }
      }
      const segmentLayoutContext = { manualGeometryIds, rootElement, serviceGroupIdsBySegment };
      const inetEdge = this.stackSegments(
        this.segmentsForZone(allSegmentIndex, 'INET-EDGE'),
        null,
        null,
        false,
        segmentLayoutContext
      );
      const extWan = this.stackSegments(
        this.segmentsForZone(allSegmentIndex, 'EXT-WAN-EDGE'),
        inetEdge?.x,
        inetEdge ? inetEdge.bottom + this.constants.GAP_Y : null,
        Boolean(inetEdge),
        segmentLayoutContext
      );
      const leftRight = Math.max(inetEdge?.right ?? -Infinity, extWan?.right ?? -Infinity);
      const dmz = this.stackSegments(
        this.segmentsForZone(allSegmentIndex, 'DMZ'),
        Number.isFinite(leftRight) ? leftRight + this.constants.GAP_X : null,
        null,
        false,
        segmentLayoutContext
      );
      const intWan = this.stackSegments(
        this.segmentsForZone(allSegmentIndex, 'INT-WAN-EDGE'),
        dmz?.x,
        dmz ? dmz.bottom + this.constants.GAP_Y : null,
        Boolean(dmz),
        segmentLayoutContext
      );
      const centerRight = Math.max(dmz?.right ?? -Infinity, intWan?.right ?? -Infinity);
      const intNetSegments = this.segmentsForZone(allSegmentIndex, 'INT-NET');
      const intNet = this.stackSegments(
        intNetSegments,
        Number.isFinite(centerRight) ? centerRight + this.constants.GAP_X : null,
        null,
        false,
        segmentLayoutContext
      );
      if (intNet) {
        const neighborIds = new Set(intNetSegments.flatMap((segment) =>
          this.resolveSegmentRules(segment.id, allSegmentIndex, zoneIndex).neighbors_right_zones ?? []
        ));
        const neighbors = [...neighborIds]
          .map((id) => ({ id, geometry: objectIndex[id]?.element.querySelector('mxGeometry') }))
          .filter((segment) => segment.geometry)
          .sort((left, right) => this.compareIds(left.id, right.id));
        this.stackSegments(
          neighbors,
          intNet.right + this.constants.GAP_X,
          null,
          true,
          segmentLayoutContext
        );
      }
      if (internetGeometry && transportGeometry && unplacedCarrierServices.length) {
        const groups = Object.entries(unplacedCarrierServices.reduce((acc, service) => {
          const key = `${service.layerId}:${service.group}`;
          acc[key] = acc[key] ?? [];
          acc[key].push(service);
          return acc;
        }, {})).sort(([left], [right]) => this.compareIds(left, right));
        const groupLayouts = groups.map(([key, services]) => {
          services.sort((left, right) => this.compareIds(left.id, right.id));
          const slotSize = services.reduce((acc, service) => ({
            width: Math.max(acc.width, service.width),
            height: Math.max(acc.height, service.height)
          }), { width: this.constants.EXTERNAL_SERVICES_SLOT_WIDTH, height: 0 });
          return {
            key,
            services,
            ...this.computeGroupBox(services.length, slotSize, services[0].group)
          };
        });
        const externalY = Math.min(
          this.getFloatAttribute(internetGeometry, 'y'),
          this.getFloatAttribute(transportGeometry, 'y')
        );
        const externalWidth = Math.max(
          this.constants.MIN_CONTAINER_WIDTH,
          ...groupLayouts.map((layout) => layout.width + 2 * this.constants.SEGMENT_PADDING_X)
        );
        const externalHeight = Math.max(
          this.getFloatAttribute(internetGeometry, 'height'),
          this.getFloatAttribute(transportGeometry, 'height'),
          this.constants.EXTERNAL_SERVICES_HEADER_HEIGHT + groupLayouts.reduce((height, layout) =>
            height + layout.height + this.constants.GAP_Y, 0
          ) + this.constants.SEGMENT_PADDING_X - this.constants.GAP_Y
        );
        const rootDelta = Math.max(
          0,
          externalWidth + this.constants.EXTERNAL_SERVICES_GAP - this.getFloatAttribute(internetGeometry, 'x')
        );
        if (rootDelta > 0) {
          for (const geometry of [internetGeometry, transportGeometry, dcGeom].filter(Boolean)) {
            geometry.setAttribute('x', this.formatNumber(this.getFloatAttribute(geometry, 'x') + rootDelta));
          }
          this.shiftServiceGroups(rootElement, serviceGroupIdsBySegment, rootDelta, 0);
        }
        const externalX = this.getFloatAttribute(internetGeometry, 'x')
          - externalWidth - this.constants.EXTERNAL_SERVICES_GAP;
        this.addContainer(
          drawioXml, rootElement, MAIN_LAYER_ID, EXTERNAL_SERVICES_ID, EXTERNAL_SERVICES_LABEL,
          externalX, externalY, externalWidth, externalHeight, EXTERNAL_SERVICES_STYLE
        );
        const serviceX = externalX + this.constants.SEGMENT_PADDING_X;
        let serviceY = externalY + this.constants.EXTERNAL_SERVICES_HEADER_HEIGHT;
        for (const { key, services, width, height, positions } of groupLayouts) {
          const groupId = `tech_group_unplaced_${key}`;
          this.addContainer(
            drawioXml, rootElement, services[0].layerId, groupId, services[0].group,
            serviceX, serviceY, width, height
          );
          for (let index = 0; index < services.length; index++) {
            const service = services[index];
            const serviceGeometry = service.cell.querySelector('mxGeometry');
            if (!serviceGeometry) continue;
            service.cell.setAttribute('parent', groupId);
            serviceGeometry.setAttribute('x', this.formatNumber(positions[index].x));
            serviceGeometry.setAttribute('y', this.formatNumber(positions[index].y));
          }
          serviceY += height + this.constants.GAP_Y;
        }
      }
      if (dcGeom) {
        this.fitContainerToChildren(
          dcGeom,
          this.directVertexChildren(rootElement, LOCATION_CONTAINER_ID),
          this.getFloatAttribute(dcGeom, 'width'),
          this.getFloatAttribute(dcGeom, 'height')
        );
      }
      const hierarchyObjects = Object.entries(objectIndex).sort(([left], [right]) =>
        this.compareIds(left, right)
      );
      for (const [id, record] of hierarchyObjects) {
        const schema = record.element.getAttribute('schema') ?? record.item.primaryVars?.schema;
        if (schemaMatches(schema, SCHEMAS.DC_AZ)) {
          this.growHierarchyContainer(rootElement, objectIndex, id, [SCHEMAS.DC, SCHEMAS.DC_OFFICE]);
        }
      }
      for (const [id, record] of hierarchyObjects) {
        const schema = record.element.getAttribute('schema') ?? record.item.primaryVars?.schema;
        if (schemaMatches(schema, SCHEMAS.DC_REGION)) {
          this.growHierarchyContainer(rootElement, objectIndex, id, [SCHEMAS.DC_AZ, SCHEMAS.DC, SCHEMAS.DC_OFFICE]);
        }
      }
      mxFileXml.append(diagramXml);
    }

    this.appendCommonLocationPage(drawioXml, mxFileXml);
    for (const page of mxFileXml.querySelectorAll('diagram')) {
      const pageId = page.getAttribute('id');
      if (this.indices[pageId]) continue;
      const records = {};
      for (const element of page.querySelectorAll('root > object')) {
        if (this.isLogicalLinkVisualEdge(element)) records[this.elementId(element)] = { element };
      }
      if (Object.keys(records).length) this.indices[pageId] = records;
      for (const record of diff?.[pageId] ?? []) {
        if (records[record.id]) this.applyDiff(drawioXml, records[record.id], record.diff);
      }
    }
    this.bringLogicalLinksToFront(drawioXml, mxFileXml);
    return new XMLSerializer().serializeToString(mxFileXml);
  }

  hasObject(page, key) {
    return this.data[page] && key in this.data[page];
  }

  updateNode(page, key, value) {
    Object.assign(this.data[page][key], value);
  }
}
