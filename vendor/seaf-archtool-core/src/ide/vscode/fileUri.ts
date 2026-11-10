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
      Alexander Romashin <alexander.romashin@gmail.com>, Sber

  Contributors:
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

// Расширение VS Code присылает changeFile с путем файла без кодирования (FILE_URI_PREFIX + document.fileName),
// а imports парсера построены от URI webview, где путь закодирован (пробелы, кириллица).
// Для сравнения URI приводится к виду origin + декодированный путь.
export function normalizeFileUri(uri: string): string {
  try {
    const url = new URL(uri);
    return `${url.origin}${decodeURIComponent(url.pathname)}`;
  } catch {
    return uri;
  }
}

export function isSameFileUri(a: string, b: string): boolean {
  return normalizeFileUri(a) === normalizeFileUri(b);
}
