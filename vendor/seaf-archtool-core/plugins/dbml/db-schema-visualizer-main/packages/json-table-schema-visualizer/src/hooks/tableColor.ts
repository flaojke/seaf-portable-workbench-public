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

import { useContext } from "react";

import type { TableColors } from "@/types/tableColor";

import { TablesColorContext } from "@/providers/TablesColorProvider";

export const useTableColor = (table: string): TableColors | undefined => {
  const contextValue = useContext(TablesColorContext);

  if (contextValue == null) {
    throw new Error(
      "it seem you forgot to wrap your app with TablesColorContext",
    );
  }

  return contextValue.tableColors.get(table);
};
