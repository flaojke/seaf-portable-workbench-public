/* Copyright (C) 2026 Sber. Licensed under the Apache License, Version 2.0. */

import type { RoutingIssue } from './corridor-routing';

const OVERLAP_FAILURE = /^route-layer-overlap-over-port-limit:(.+)$/;

function displayNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1).replace(/\.0$/, '') : '?';
}

export function routingIssueMessage(issue: RoutingIssue, pageIndex: number, pageCount: number, type: string) {
  const page = `Страница ${pageIndex + 1}/${pageCount}`;
  const endpoints = `${issue.source || 'неизвестный источник'} → ${issue.target || 'неизвестная цель'}`;
  const layer = issue.layer ? `; слой «${issue.layer}»` : '';
  const id = issue.id ? `; ID связи: ${issue.id}` : '';
  const header = `${type}: ${endpoints}${layer}; ${page}${id}.`;
  const reason = String(issue.reason || 'unknown');
  const overlap = OVERLAP_FAILURE.exec(reason);

  if (overlap) {
    let detail: Record<string, unknown> = {};
    try {
      detail = JSON.parse(overlap[1]);
    } catch (_) {
      // Diagnostics must not interrupt rendering if a payload is malformed.
    }
    const otherEdge = `другим логическим маршрутом${detail.otherEdge ? ` (ID: ${detail.otherEdge})` : ''}`;
    const segment = detail.axis === 'vertical'
      ? `вертикальный участок x=${displayNumber(detail.coordinate)}, y=${displayNumber(detail.top)}–${displayNumber(detail.bottom)}`
      : `горизонтальный участок y=${displayNumber(detail.coordinate)}, x=${displayNumber(detail.left)}–${displayNumber(detail.right)}`;
    const limit = Number(detail.maxEndpointOverlap);
    const limitMessage = Number.isFinite(limit) ? ` Допустимое общее продолжение у портов — не более ${displayNumber(limit)} единиц схемы.` : '';
    return `${header} Маршрут отвергнут: он делит участок длиной ${displayNumber(detail.length)} единиц схемы с ${otherEdge}; ${segment}.${limitMessage}`;
  }

  const reasonCode = reason.split(':', 1)[0];
  const descriptions = {
    'route-not-found': 'не найден путь в обход препятствий с учётом маршрутов других логических слоёв',
    'route-obstacle-collision': 'найденный путь пересекает объект-препятствие',
    'source-ports-blocked': 'точки выхода из исходного объекта заблокированы препятствиями',
    'target-ports-blocked': 'все точки подключения целевого объекта заблокированы препятствиями',
    'route-target-missing': 'не удалось определить точку входа в целевой объект',
    'missing-layer-or-endpoint': 'в XML не указан слой, источник или цель связи',
    'unsupported-or-missing-endpoint': 'один из концов связи отсутствует или не имеет поддерживаемой геометрии',
    'self-link': 'связь указывает на тот же объект',
    'missing-edge-geometry': 'в XML отсутствует геометрия связи',
    'invalid-endpoint-geometry': 'координаты объекта некорректны',
    'invalid-preserved-geometry': 'сохранённые точки ручного маршрута некорректны',
    'route-search-limit': 'превышен предел поиска пути',
    'route-grid-too-large': 'сетка поиска превышает безопасный размер',
    'route-waypoint-limit': 'путь содержит слишком много поворотов',
    'route-grid-endpoint-missing': 'точки подключения не попали в сетку поиска'
  };
  return `${header} Причина: ${descriptions[reasonCode] || `маршрутизатор вернул код «${reasonCode}»`}.`;
}
