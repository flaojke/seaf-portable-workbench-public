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

import { createRoot } from "react-dom/client";
import "@tomjs/vscode-extension-webview/client";
import { tableCoordsStore } from "json-table-schema-visualizer/src/stores/tableCoords";

import App from "./App";

export const createExtensionApp = () => {
  // save current table position when exiting the page
  window.addEventListener("unload", () => {
    tableCoordsStore.saveCurrentStore();
  });

  const View = () => {
    return <App />;
  };

  const appWrapper = document.getElementById("app");

  if (appWrapper !== null) {
    const root = createRoot(appWrapper);
    root.render(<View />);
  }
};
