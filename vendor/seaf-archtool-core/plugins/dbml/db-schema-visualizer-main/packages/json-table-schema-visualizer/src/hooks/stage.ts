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

import { useMemo, RefObject } from "react";

import { DIAGRAM_PADDING, STAGE_SCALE_FACTOR } from "@/constants/sizing";
import { type StageState } from "@/types/stage";
import { stageStateStore } from "@/stores/stagesState";
import { tableCoordsStore } from "@/stores/tableCoords";
import { useContainerSize } from "@/hooks/containerSize";

export const useStageStartingState = (containerRef: RefObject<HTMLElement>): StageState => {
  const { height, width } = useContainerSize(containerRef);

  const state = useMemo(() => {
    const savedStageState = stageStateStore.getCurrentStageState();
    if (savedStageState !== null) {
      return savedStageState;
    }

    let maxX = 0;
    let maxY = 0;
    let minX = 0;
    let minY = 0;

    tableCoordsStore.getCurrentStore().forEach(({ x, y }) => {
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
    });

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const scaleX = (width - DIAGRAM_PADDING) / contentW;
    const scaleY = (height - DIAGRAM_PADDING) / contentH;
    const scale =
      Math.min(scaleX, scaleY, 1 /* scale must not ne higher than 1 */) *
      STAGE_SCALE_FACTOR;

    const scaledW = contentW * scale;
    const scaledH = contentH * scale;

    const centerPositionX = -minX * scale + (width - scaledW) / 4;
    const centerPositionY = -minY * scale + (height - scaledH) / 4;

    const state = {
      scale,
      position: { x: centerPositionX, y: centerPositionY },
    };

    return state;
  }, []);

  return state;
};
