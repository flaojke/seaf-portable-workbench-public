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

import { type JSONTableEnum } from "shared/types/tableSchema";

import { computeTextsMaxWidth } from "./computeTextsMaxWidth";
import { createEnumItemText } from "./createEnumItemText";

/**
 * compute and return the max width of the enum.
 * Compares the text width of the enum title with the text widths of each menu item
 *
 * @param {JSONTableEnum} enumObject - The enum object to compute the detail box width for
 * @return {number} The maximum width of the detail box
 */
export const computeEnumDetailBoxMaxW = (enumObject: JSONTableEnum): number => {
  const titleText = `Enum ${enumObject.name}`;
  const itemsTexts = enumObject.values.map((item) =>
    createEnumItemText(item.name),
  );
  return computeTextsMaxWidth([titleText, ...itemsTexts]);
};
