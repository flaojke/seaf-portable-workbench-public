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

import { Group, Layer, Stage } from "react-konva";
import { useEffect, useRef, type ReactNode, useState, RefObject } from "react";
import { type KonvaEventObject } from "konva/lib/Node";

import Toolbar from "../Toolbar/Toolbar";

import type { Stage as CoreStage } from "konva/lib/Stage";

import { useContainerSize } from "@/hooks/containerSize";
import { useCursorChanger } from "@/hooks/cursor";
import { DIAGRAM_PADDING } from "@/constants/sizing";
import { useThemeColors, useThemeContext } from "@/hooks/theme";
import { Theme } from "@/types/theme";
import { useStageStartingState } from "@/hooks/stage";
import { stageStateStore } from "@/stores/stagesState";
import { useTablePositionContext } from "@/hooks/table";

interface DiagramWrapperProps {
  children: ReactNode;
  containerRef: RefObject<HTMLElement>;
}

const DiagramWrapper = ({ children, containerRef }: DiagramWrapperProps) => {
  const scaleBy = 1.02;
  const { height, width } = useContainerSize(containerRef);
  const { onChange: onGrabbing, onRestore: onGrabRelease } =
    useCursorChanger("grabbing");
  const themeColors = useThemeColors();
  const stageRef = useRef<null | CoreStage>(null);

  // repositioning the stage only once
  const { scale: defaultStageScale, position: defaultStagePosition } =
    useStageStartingState(containerRef);
  useEffect(() => {
    if (stageRef.current != null) {
      stageRef.current.scale({
        x: defaultStageScale,
        y: defaultStageScale,
      });
      stageRef.current.position(defaultStagePosition);
    }
  }, [defaultStageScale, defaultStagePosition]);

  const handleZooming = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.currentTarget as CoreStage;
    const oldScale = stage.scaleX();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const pointer = stage.getPointerPosition()!;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    // how to scale? Zoom in? Or zoom out?
    let direction = e.evt.deltaY > 0 ? 1 : -1;

    // when we zoom on trackpad, e.evt.ctrlKey is true
    // in that case lets revert direction
    if (e.evt.ctrlKey) {
      direction = -direction;
    }

    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
    stageStateStore.set({ scale: newScale, position: newPos });
  };

  return (
    <>
      <Stage
        draggable
        ref={stageRef}
        onDragStart={onGrabbing}
        onDragEnd={onGrabRelease}
        onWheel={handleZooming}
        width={width}
        height={height}
        style={{ width: "fit-content", backgroundColor: themeColors.bg }}
      >
        <Layer>
          <Group offsetX={-DIAGRAM_PADDING} offsetY={-DIAGRAM_PADDING}>
            {children}
          </Group>
        </Layer>
      </Stage>

      <Toolbar />
    </>
  );
};

const DiagramWrapperContainer = ({ children }: DiagramWrapperProps) => {
  const { theme } = useThemeContext();
  const [showContent, setShowContent] = useState(false)
  const containerRef = useRef(null)
  const { resetPositions } = useTablePositionContext();

  const { width } = useContainerSize(containerRef);

  useEffect(() => {
    if (width > 0) {
      setShowContent(true)
    }
  }, [width])

  useEffect(() => {
    resetPositions();
  }, [])

  return (
    <main
      ref={containerRef}
      className={`relative flex flex-col items-center h-full min-h-[70vh] ${theme === Theme.dark ? "dark" : ""}`}
    >
      {showContent ? <DiagramWrapper containerRef={containerRef}>{children}</DiagramWrapper> : null}
    </main>
  )
}

export default DiagramWrapperContainer;
