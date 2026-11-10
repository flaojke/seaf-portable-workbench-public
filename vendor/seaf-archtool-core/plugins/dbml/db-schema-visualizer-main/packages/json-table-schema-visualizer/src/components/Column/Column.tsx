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

import KonvaText from "../dumb/KonvaText";
import FieldDetails from "../FieldDetails/FieldDetails";

import ColumnWrapper from "./ColumnWrapper";

import { useTableColor } from "@/hooks/tableColor";
import {
  COLUMN_HEIGHT,
  FONT_SIZES,
  PADDINGS,
  TABLE_FIELD_TYPE_PADDING,
} from "@/constants/sizing";
import { useThemeColors } from "@/hooks/theme";
import { useTableWidth } from "@/hooks/table";

interface ColumnProps {
  colName: string;
  tableName: string;
  type: string;
  isPrimaryKey?: boolean;
  isEnum: boolean;
  relationalTables?: string[] | null;
  offsetY?: number;
  note?: string;
}

const Column = ({
  colName,
  tableName,
  type,
  isPrimaryKey = false,
  offsetY,
  relationalTables,
  isEnum,
  note,
}: ColumnProps) => {
  const themeColors = useThemeColors();
  const tableColors = useTableColor(tableName);
  const tablePreferredWidth = useTableWidth();

  const colTextColor = themeColors.text[900];
  const typeTextColor = themeColors.text[700];
  const fontStyle = isPrimaryKey ? "bold" : "normal";

  return (
    <ColumnWrapper
      highlightColor={tableColors?.lighter ?? themeColors.colAccent}
      relationalTables={relationalTables}
      offsetY={offsetY}
      tableName={tableName}
    >
      {(highlighted) => (
        <>
          <KonvaText
            ellipsis
            wrap="none"
            text={colName}
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-nullish-coalescing
            fill={(highlighted && tableColors?.regular) || colTextColor}
            width={tablePreferredWidth}
            fontStyle={fontStyle}
            padding={PADDINGS.sm}
            height={COLUMN_HEIGHT}
            fontSize={FONT_SIZES.md}
          />

          <KonvaText
            text={type}
            align="right"
            width={tablePreferredWidth}
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-nullish-coalescing
            fill={(highlighted && tableColors?.regular) || typeTextColor}
            padding={TABLE_FIELD_TYPE_PADDING}
            fontStyle={fontStyle}
            fontSize={FONT_SIZES.md}
            height={COLUMN_HEIGHT}
          />

          {note != null || isEnum ? (
            <FieldDetails note={note ?? ""} enumName={type} />
          ) : null}
        </>
      )}
    </ColumnWrapper>
  );
};

export default Column;
