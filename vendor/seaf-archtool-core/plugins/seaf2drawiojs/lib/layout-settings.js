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
*/

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function mergeLayoutSettings(...settings) {
  const definedSettings = settings.filter((setting) => setting !== undefined && setting !== null);
  if (!definedSettings.length) return null;

  return definedSettings.reduce((merged, setting) => {
    if (!isPlainObject(merged) || !isPlainObject(setting)) return setting;

    const result = { ...merged };
    for (const [key, value] of Object.entries(setting)) {
      result[key] = isPlainObject(result[key]) && isPlainObject(value)
        ? mergeLayoutSettings(result[key], value)
        : value;
    }
    return result;
  });
}

export function layoutSettingsFromProfile(profile, data) {
  return mergeLayoutSettings(
    profile?.layout_settings ?? profile?.layoutSettings,
    data?.layout_settings ?? data?.layoutSettings
  );
}
