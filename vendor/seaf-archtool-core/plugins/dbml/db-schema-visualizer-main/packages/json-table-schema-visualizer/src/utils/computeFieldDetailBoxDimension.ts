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

import { computeEnumDetailBoxMaxW } from "./computeEnumDetailBoxMaxW";
import {
  computeTextSize,
  getLetterApproximateDimension,
} from "./computeTextSize";
import { estimateSentenceLineCount } from "./estimateSentenceLineCount";

import { FIELD_DETAILS_TOOLTIPS_W, PADDINGS } from "@/constants/sizing";

export const computeFieldDetailBoxDimension = (
  note?: string,
  enumObject?: JSONTableEnum,
): { w: number; h: number; noteH: number } => {
  const enumDetailMaxW =
    enumObject === undefined ? 0 : computeEnumDetailBoxMaxW(enumObject);
  const oneLineNoteW = note != null ? computeTextSize(note).width : 0;
  const preferredWidth = Math.max(enumDetailMaxW, oneLineNoteW) + PADDINGS.md;
  const finalWidth = Math.min(preferredWidth, FIELD_DETAILS_TOOLTIPS_W);

  const letterApproximateDim = getLetterApproximateDimension();
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  const noteH = note
    ? estimateSentenceLineCount(note, finalWidth) * letterApproximateDim.height
    : 0;

  const enumsDetailsH =
    enumObject === undefined
      ? 0
      : letterApproximateDim.height *
        (1 + enumObject.values.length); /* the 1 added is for the title line */

  const enumsPanelHWithPadding =
    enumsDetailsH + (enumsDetailsH > 0 ? PADDINGS.md : 0);

  const noteHWithPadding = noteH + (noteH !== 0 ? PADDINGS.lg : PADDINGS.md);
  const totalH = noteHWithPadding + enumsPanelHWithPadding;

  return { w: finalWidth, h: totalH, noteH: noteHWithPadding };
};
