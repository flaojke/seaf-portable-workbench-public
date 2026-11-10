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

import { type ReactNode, useState } from "react";
import { Group, Rect } from "react-konva";

import { COLUMN_HEIGHT } from "@/constants/sizing";
import { useTablesInfo, useTableWidth } from "@/hooks/table";
import { shouldHighLightCol } from "@/utils/shouldHighLightCol";

interface ColumnWrapperProps {
  children: (highlighted: boolean) => ReactNode;
  offsetY?: number;
  tableName: string;
  relationalTables?: string[] | null;
  highlightColor: string;
}

const ColumnWrapper = ({
  children,
  offsetY,
  tableName,
  relationalTables,
  highlightColor,
}: ColumnWrapperProps) => {
  const { hoveredTableName } = useTablesInfo();
  const [hovered, setHovered] = useState(false);
  const tablePreferredWidth = useTableWidth();

  const handleOnHover = () => {
    setHovered(true);
  };

  const handleOnLeave = () => {
    setHovered(false);
  };

  const highlighted = shouldHighLightCol(
    hovered,
    tableName,
    hoveredTableName,
    relationalTables,
  );

  return (
    <Group onMouseOver={handleOnHover} onMouseLeave={handleOnLeave} y={offsetY}>
      <Rect
        fill={highlighted ? highlightColor : "transparent"}
        width={tablePreferredWidth}
        height={COLUMN_HEIGHT}
      />
      {children(highlighted)}
    </Group>
  );
};

export default ColumnWrapper;
