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
      Vladislav Markin, Sber

  Contributors:
      Vladislav Markin, Sber - 2025
*/

import { CONNECTION_RELATION_SYMBOL_OFFSET } from "@/constants/sizing";
import { Position, type XYPosition } from "@/types/positions";
const computeOneTypeRelationSymbol = (
  { x, y }: XYPosition,
  position: Position,
): string => {
  const halfHeight = 3;

  const symbolOffset = compteSymbolOffset(position, { x, y });
  const path = `M${symbolOffset.x},${y - halfHeight} L${symbolOffset.x},${y + halfHeight}`;

  return path;
};

export const compteSymbolOffset = (
  position: Position,
  startPoint: XYPosition,
): XYPosition => {
  const x =
    position === Position.Left
      ? startPoint.x - CONNECTION_RELATION_SYMBOL_OFFSET
      : startPoint.x + CONNECTION_RELATION_SYMBOL_OFFSET;
  return { x, y: startPoint.y };
};

const computeMultipleTypeRelationSymbol = (
  { x, y }: XYPosition,
  position: Position,
): string => {
  const halfHeight = 5;
  const symbolOffset = compteSymbolOffset(position, { x, y });

  return `M${x},${y - halfHeight} L${symbolOffset.x},${symbolOffset.y} L${x},${y + halfHeight}`;
};

export const getRelationSymbol = (
  relation: string,
  position: Position,
  coord: XYPosition,
): string => {
  if (relation === "1") {
    return computeOneTypeRelationSymbol(coord, position);
  }

  return computeMultipleTypeRelationSymbol(coord, position);
};
