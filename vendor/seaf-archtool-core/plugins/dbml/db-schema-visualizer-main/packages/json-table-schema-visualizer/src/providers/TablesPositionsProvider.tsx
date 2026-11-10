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

import { createContext, useMemo, type PropsWithChildren } from "react";

import type { JSONTableRef, JSONTableTable } from "shared/types/tableSchema";
import type { TablesPositionsContextValue } from "@/types/dimension";

import { tableCoordsStore } from "@/stores/tableCoords";

export const TablesPositionsContext =
  createContext<TablesPositionsContextValue | null>(null);

interface TablesPositionsProviderProps extends PropsWithChildren {
  tables: JSONTableTable[];
  refs: JSONTableRef[];
}

const TablesPositionsProvider = ({
  tables,
  refs,
  children,
}: TablesPositionsProviderProps) => {
  const resetPositions = () => {
    tableCoordsStore.resetPositions(tables, refs);
  };

  const contextValue = useMemo(() => ({ resetPositions }), [resetPositions]);

  return (
    <TablesPositionsContext.Provider value={contextValue}>
      {children}
    </TablesPositionsContext.Provider>
  );
};

export default TablesPositionsProvider;
