/*
  Copyright (C) 2026 Sber

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
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber

  Contributors:
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber
*/

const TRUE_VALUES = ['true', 'yes', 'y', '1'];
const FALSE_VALUES = ['false', 'no', 'n', '0'];

export function stringToBooleanOrDefault(maybeBoolean, defaultValue) {
    const normalized = String(maybeBoolean).trim().toLowerCase();

    if (TRUE_VALUES.includes(normalized)) {
        return true;
    }
    if (FALSE_VALUES.includes(normalized)) {
        return false;
    }
    return defaultValue;
}
