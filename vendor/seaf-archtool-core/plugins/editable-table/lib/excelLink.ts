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
      Vladislav Markin, Sber

  Contributors:
      Vladislav Markin, Sber - 2026
*/

// Значение ячейки link/upload для выгрузки таблицы в Excel.
// Адрес, для которого isUnsafeHref = true (javascript:, data:, vbscript:, неразбираемый), выгружается текстом
// без гиперссылки; остальные — гиперссылкой, как раньше (если createHyperlink не бросает исключение).

import { isUnsafeHref } from '@front/helpers/linkHref';

export interface ExcelHyperlink {
  hyperlink: string;
  text: string;
}

export interface ExcelHyperlinkSource {
  hyperlink: string;
  text?: string;
}

export type ExcelLinkValue = ExcelHyperlink | string | null | ExcelLinkValue[];

export function formatExcelLinkValue(
  tableLink: unknown,
  createHyperlink: (link: ExcelHyperlinkSource) => ExcelHyperlink,
  base: string
): ExcelLinkValue {
  if (Array.isArray(tableLink)) {
    return tableLink.map((link) => formatExcelLinkValue(link, createHyperlink, base)).filter(Boolean);
  }

  if (typeof tableLink === 'string') {
    if (isUnsafeHref(tableLink, base)) {
      return tableLink;
    }
    try {
      return createHyperlink({ hyperlink: tableLink });
    } catch {
      return tableLink;
    }
  }

  const link = tableLink as { href?: string; text?: string } | null | undefined;
  if (link && link.href) {
    if (isUnsafeHref(link.href, base)) {
      return link.text ?? link.href;
    }
    try {
      return createHyperlink({ hyperlink: link.href, text: link.text });
    } catch {
      return link.text ?? link.href;
    }
  }

  return null;
}
