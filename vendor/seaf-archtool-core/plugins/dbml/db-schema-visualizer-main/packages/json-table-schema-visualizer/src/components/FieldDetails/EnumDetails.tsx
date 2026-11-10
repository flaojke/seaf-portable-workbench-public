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

import { Group } from "react-konva";

import KonvaText from "../dumb/KonvaText";

import { useGetEnum } from "@/hooks/enums";
import { useThemeColors } from "@/hooks/theme";
import { computeTextSize } from "@/utils/computeTextSize";
import { PADDINGS } from "@/constants/sizing";
import { createEnumItemText } from "@/utils/createEnumItemText";

interface EnumDetailsProps {
  enumName: string;
  y?: number;
}

const enumTextSize = computeTextSize("Enum");

const EnumDetails = ({ enumName, y }: EnumDetailsProps) => {
  const enumObject = useGetEnum(enumName);
  const themeColors = useThemeColors();

  if (enumObject === undefined) {
    return null;
  }

  const enumNameX = enumTextSize.width + PADDINGS.md;

  return (
    <Group y={y}>
      <KonvaText fontStyle="bold" fill={themeColors.red} text="Enum" />

      <KonvaText
        x={enumNameX}
        fill={themeColors.green}
        text={enumObject.name}
      />

      {enumObject.values.map((item, index) => (
        <KonvaText
          key={item.name}
          y={(index + 1) * enumTextSize.height}
          text={createEnumItemText(item.name)}
          fill={themeColors.enumItem}
        />
      ))}
    </Group>
  );
};

export default EnumDetails;
