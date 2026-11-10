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

export enum Theme {
  light = "light",
  dark = "dark",
}
export interface ThemeColors {
  text: {
    900: string;
    700: string;
  };
  connection: {
    default: string;
    active: string;
  };
  tableHeader: {
    bg: string;
    fg: string;
  };
  colAccent: string;
  table: {
    bg: string;
    shadow: string;
  };
  red: string;
  green: string;
  enumItem: string;
  white: string;
  noteBg: string;
  bg: string;
}

export interface ThemeProviderValue {
  themeColors: ThemeColors;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}
