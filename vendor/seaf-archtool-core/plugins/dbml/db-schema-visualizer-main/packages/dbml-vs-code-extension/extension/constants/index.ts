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

// In the text below, you may notice a spelling
// mistake: dblm instead of dbml.
// But by changing this, users will lose their table
// position if the plugin version is updated.
// This constant is the identifier given to the webview
// displaying the diagram, and since the positions of
// tables and so on are stored in the localStorage, a
// change to this ID will cause this data to be lost,
// as if a brand new webview were created.
export const WEB_VIEW_NAME = "dblm-preview-webview";

export const WEB_VIEW_TITLE = "DBML Diagram Preview";
export const EXTENSION_CONFIG_SESSION = "dbmlERDPreviewer";
