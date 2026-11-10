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

import { Text, type TextConfig } from "konva/lib/shapes/Text";

import { FONT_FAMILY } from "@/constants/font";
import { FONT_SIZES } from "@/constants/sizing";
import { type Dimension } from "@/types/dimension";

const textNode = new Text({
  fontFamily: FONT_FAMILY,
  fontSize: FONT_SIZES.md,
});

export const computeTextSize = (
  text: string,
  config?: TextConfig,
): Dimension => {
  if (config != null) {
    const clone = textNode.clone(config);
    return clone.measureSize(text);
  }

  return textNode.measureSize(text);
};

export const getLetterApproximateDimension = (
  config?: TextConfig,
): Dimension => {
  return computeTextSize("a", config);
};
