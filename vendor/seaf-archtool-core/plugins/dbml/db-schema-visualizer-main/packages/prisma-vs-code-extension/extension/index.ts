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

import { commands, type ExtensionContext } from "vscode";

import { parsePrismaToJSON } from "prisma-to-json-table-schema";

import { MainPanel } from "extension-shared/extension/views/panel";
import {
  EXTENSION_CONFIG_SESSION,
  WEB_VIEW_NAME,
  WEB_VIEW_TITLE,
} from "@/extension/constants";

export function activate(context: ExtensionContext): void {
  // Add command to the extension context
  context.subscriptions.push(
    commands.registerCommand(
      "prisma-erd-visualizer.previewDiagrams",
      async () => {
        lunchExtension(context);
      },
    ),
  );
}

const lunchExtension = (context: ExtensionContext): void => {
  MainPanel.render({
    context,
    extensionConfigSession: EXTENSION_CONFIG_SESSION,
    webviewConfig: {
      name: WEB_VIEW_NAME,
      title: WEB_VIEW_TITLE,
    },
    parser: parsePrismaToJSON,
    fileExt: "prisma",
  });
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function deactivate() {}
