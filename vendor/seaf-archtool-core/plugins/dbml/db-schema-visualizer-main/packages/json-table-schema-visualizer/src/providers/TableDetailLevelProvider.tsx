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

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  type TableDetailLevelValue,
  TableDetailLevel,
} from "@/types/tableDetailLevel";
import { detailLevelStore } from "@/stores/detailLevelStore";

export const TableDetailLevelContext = createContext<TableDetailLevelValue>({
  detailLevel: TableDetailLevel.FullDetails,
  next() {},
});

interface TableLevelDetailProviderProps {
  children: ReactNode;
  level?: TableDetailLevel;
}

const TableLevelDetailProvider = ({
  children,
}: TableLevelDetailProviderProps) => {
  const [state, setState] = useState(() =>
    detailLevelStore.getCurrentDetailLevel(),
  );
  useEffect(() => {
    if (state !== detailLevelStore.getCurrentDetailLevel()) {
      detailLevelStore.set(state);
      detailLevelStore.saveCurrentState();
    }
  }, [state]);
  const next = useCallback((): void => {
    if (state === TableDetailLevel.FullDetails) {
      setState(TableDetailLevel.HeaderOnly);
    } else if (state === TableDetailLevel.HeaderOnly) {
      setState(TableDetailLevel.KeyOnly);
    } else {
      setState(TableDetailLevel.FullDetails);
    }
  }, [state, setState]);
  return (
    <TableDetailLevelContext.Provider value={{ detailLevel: state, next }}>
      {children}
    </TableDetailLevelContext.Provider>
  );
};

export default TableLevelDetailProvider;
