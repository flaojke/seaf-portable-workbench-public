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

import DiagramViewer from "json-table-schema-visualizer/src/components/DiagramViewer/DiagramViewer";
import { useCreateTheme } from "json-table-schema-visualizer/src/hooks/theme";
import ThemeProvider from "json-table-schema-visualizer/src/providers/ThemeProvider";
import NoSchemaMessage from "json-table-schema-visualizer/src/components/Messages/NoSchemaMessage";
import { type Theme } from "json-table-schema-visualizer/src/types/theme";

import {
  WebviewCommand,
  type WebviewPostMessage,
} from "../extension/types/webviewCommand";

const App = ({ schema }: { schema: any }) => {
  const { setTheme, theme, themeColors } = useCreateTheme();

  if (schema === null) {
    return <NoSchemaMessage />;
  }

  // update the preference in the extension settings
  const saveThemePreference = (theme: Theme) => {
    setTheme(theme);
    const updateThemeMessage: WebviewPostMessage = {
      command: WebviewCommand.SET_THEME_PREFERENCES,
      message: theme,
    };

    if (window.vsCodeWebviewAPI === undefined) {
      console.error(
        "can't send message to extension due vsCodeWebviewAPI global variable is not defined",
      );
    } else {
      window.vsCodeWebviewAPI?.postMessage(updateThemeMessage);
    }
  };

  return (
    <ThemeProvider
      theme={theme}
      setTheme={saveThemePreference}
      themeColors={themeColors}
    >
      <DiagramViewer {...schema} />
    </ThemeProvider>
  );
};

export default App;
