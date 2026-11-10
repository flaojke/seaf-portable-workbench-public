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

import { Position } from "@/types/positions";

interface Params {
  sourceW: number;
  sourceX: number;
  targetX: number;
  targetW: number;
}

const intersectionGap = 40;

export const computeConnectionHandlePos = ({
  sourceX,
  sourceW,
  targetW,
  targetX,
}: Params): [Position, Position, number, number] => {
  const sourceEndX = sourceX + sourceW;
  const targetEndX = targetX + targetW;

  const horizontalIntersection =
    Math.max(sourceEndX, targetEndX) - Math.min(sourceX, targetX);

  if (horizontalIntersection <= targetW + sourceW + intersectionGap) {
    return [Position.Left, Position.Left, sourceX, targetX];
  }

  if (sourceEndX < targetEndX) {
    return [Position.Right, Position.Left, sourceEndX, targetX];
  }

  return [Position.Left, Position.Right, sourceX, targetEndX];
};
