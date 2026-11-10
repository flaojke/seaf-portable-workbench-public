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

import { useContext, useState } from "react";

import {
  Theme,
  type ThemeColors,
  type ThemeProviderValue,
} from "@/types/theme";
import { ThemeContext } from "@/providers/ThemeProvider";
import { darkThemeConfig, defaultThemeConfig } from "@/constants/theme";

export const useThemeContext = (): ThemeProviderValue => {
  const contextValue = useContext(ThemeContext);
  if (contextValue === undefined) {
    throw new Error("it seem you forgot to wrap your app with ThemeProvider");
  }

  return contextValue;
};

export const useThemeColors = (): ThemeColors => {
  const contextValue = useThemeContext();

  return contextValue.themeColors;
};

export const useCreateTheme = (
  defaultTheme: Theme = Theme.light,
): ThemeProviderValue => {
  const [theme, setTheme] = useState(defaultTheme);

  const themeColors =
    theme === Theme.dark ? darkThemeConfig : defaultThemeConfig;

  return { setTheme, theme, themeColors };
};
