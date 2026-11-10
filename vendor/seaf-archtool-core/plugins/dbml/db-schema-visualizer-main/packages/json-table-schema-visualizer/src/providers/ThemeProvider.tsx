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

import { createContext, type PropsWithChildren } from "react";

import {
  type ThemeColors,
  type ThemeProviderValue,
  Theme,
} from "@/types/theme";
import { darkThemeConfig } from "@/constants/theme";

export const ThemeContext = createContext<ThemeProviderValue>({
  themeColors: darkThemeConfig,
  theme: Theme.dark,
  setTheme: () => {},
});

interface ThemeProviderProps extends PropsWithChildren {
  theme: Theme;
  themeColors: ThemeColors;
  setTheme: (value: Theme) => void;
}

const ThemeProvider = ({
  theme,
  themeColors,
  setTheme,
  children,
}: ThemeProviderProps) => {
  return (
    <ThemeContext.Provider value={{ setTheme, theme, themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
