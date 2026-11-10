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

export const TABLE_DEFAULT_MIN_WIDTH = 150;
export const TABLE_COLOR_HEIGHT = 6;
export const TABLE_LINE_HEIGHT = 25;
export const COLUMN_HEIGHT = 30;
export const TABLE_HEADER_HEIGHT = COLUMN_HEIGHT + TABLE_COLOR_HEIGHT;
export const CONNECTION_STROKE = 2;
export const DEFAULT_PADDING = 5;
export const CROSS_CONNECTION_MIN_MARGIN = 20;
export const CONNECTION_MARGIN = 40;
export const COLS_OFFSET_Y_TO_COL_MIDDLE =
  TABLE_COLOR_HEIGHT +
  COLUMN_HEIGHT +
  COLUMN_HEIGHT / 2; /* to point to cols middle */
export const CONNECTION_HANDLE_OFFSET = 20;
export const PADDINGS = {
  xs: 5,
  sm: 8,
  md: 10,
  lg: 20,
};
export const TABLE_FIELD_TYPE_PADDING = PADDINGS.sm;

export const FONT_SIZES = {
  md: 15,
  lg: 18,
  tableTitle: 18,
};

export const FIELD_DETAILS_CARET = {
  w: 5,
  h: 5,
};

export const FIELD_DETAILS_TOOLTIPS_W = 200;

export const TABLES_GAP_X = 50;
export const TABLES_GAP_Y = 50;
export const DIAGRAM_PADDING = 60;
export const CONNECTION_RELATION_SYMBOL_OFFSET = 8;

export const STAGE_SCALE_FACTOR = 0.75;
