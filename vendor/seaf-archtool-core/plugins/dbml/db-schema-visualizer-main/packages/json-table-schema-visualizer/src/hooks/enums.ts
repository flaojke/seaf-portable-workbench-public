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
import { type JSONTableEnum } from "shared/types/tableSchema";

import { EnumsContext } from "@/providers/EnumsProvider";
import { type EnumsContextValue } from "@/types/enums";

export const useEnums = (): EnumsContextValue => {
  const value = useContext(EnumsContext);

  if (value == null) {
    throw new Error("useEnums must be used within an EnumsProvider");
  }

  return value;
};

export const useGetEnum = (enumName: string): JSONTableEnum | undefined => {
  const value = useEnums();

  return value.enums.find((en) => en.name === enumName);
};
