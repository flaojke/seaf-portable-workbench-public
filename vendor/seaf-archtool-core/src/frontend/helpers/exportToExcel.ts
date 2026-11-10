/*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru

  Copyright (C) 2022 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  In any derivative products, you must retain the information of
  owner of the original code and provide clear attribution to the project

  https://dochub.info

  The use of this product or its derivatives for any purpose cannot be a secret.


  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      R.Piontik <r.piontik@mail.ru>

  Contributors:
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2026
*/

import env from '@front/helpers/env';
import ExcelJS from 'exceljs';

type LinkCellData = {
  text: string;
  hyperlink: string;
  tooltip?: string;
};
type CellData = string | number | LinkCellData;
export enum ExcelHeaderType {
  text = 'text',
  dropdown = 'dropdown',
  link = 'link',
}
export type ExcelHeader = {
  text?: string;
  value: string;
  type?: ExcelHeaderType;
  options?: Array<string>;
};
export type ExcelTableRowData = Record<string, CellData | CellData[] | null>;

const START_POINTER = {
  row: 1,
  col: 1
};
const MIN_CELL_LENGTH = 3;
const MAX_CELL_LENGTH = 100;
const DEFAULT_ROW_HEIGHT = 15;

export default function exportToExcel(
  headers: ExcelHeader[],
  data: ExcelTableRowData[],
  worksheetName: string
) {
  const workbook = new ExcelJS.Workbook();

  const optionsWorksheet = workbook.addWorksheet('LOOKUPS');
  optionsWorksheet.state = 'veryHidden';

  const worksheet = workbook.addWorksheet(worksheetName);

  const startRef = worksheet
    .getRow(START_POINTER.row)
    .getCell(START_POINTER.col).address;

  const table = worksheet.addTable({
    name: worksheetName || 'Table',
    ref: startRef,
    columns: headers.map(({ text, value }) => ({ name: text || value })),
    rows: data.map(() => headers.map(() => null))
  });

  const dropdownRefs = headers.reduce((refs, header, index) => {
    const { value, options } = header;

    if (Array.isArray(options) && options.length > 0) {
      const filteredOptions = options.filter(Boolean);

      if (filteredOptions.length === 0) {
        return null;
      }

      const newRow = optionsWorksheet.addRow(filteredOptions);
      const first = newRow.getCell(1).$col$row;
      const last = newRow.getCell(filteredOptions.length).$col$row;

      return Object.assign(refs, {
        [value]: {
          value,
          startRef: first,
          lastRef: last,
          headerIndex: index
        }
      });
    }

    return refs;
  }, {});

  for (let r = 0; r < data.length; r++) {
    const rawRowData = data[r];

    const tableRow = worksheet.getRow(
      r + START_POINTER.row + Number(table.headerRow)
    );
    tableRow.alignment = { wrapText: true, vertical: 'top' };

    let lineBreakCount = 1;
    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];
      const { value: headerId, type } = header;

      const tableRowCell = tableRow.getCell(START_POINTER.col + c);

      const rawCellData = rawRowData[headerId] ?? null;
      let formatedCellData = null;

      let lineLength = 1;

      if (Array.isArray(rawCellData)) {
        formatedCellData = formatListToString(rawCellData) ?? null;
      } else {
        formatedCellData = rawCellData ?? null;
      }

      if (formatedCellData) {
        let stringData = formatedCellData;

        if (typeof formatedCellData === 'number') {
          stringData = formatedCellData.toString();
        } else if (formatedCellData && formatedCellData.hyperlink) {
          stringData = formatedCellData?.text ?? formatedCellData.hyperlink;
        }

        const list = stringData.split('\n');
        lineBreakCount = Math.max(list.length, lineBreakCount);

        if (list.length > 1) {
          lineLength = Math.max(...list.map((v) => v.toString().length));
        } else {
          lineLength = stringData.length;
        }
      }

      tableRowCell.value = formatedCellData;

      const column = worksheet.getColumn(tableRowCell.col);
      column.width = Math.min(
        Math.max(column.width ?? MIN_CELL_LENGTH, lineLength + MIN_CELL_LENGTH),
        MAX_CELL_LENGTH
      );

      if (type === ExcelHeaderType.link && tableRowCell.value?.hyperlink) {
        tableRowCell.style.font = {
          italic: true,
          underline: true,
          color: {
            theme: 10
          }
        };
      } else if (dropdownRefs[headerId]) {
        const { startRef, lastRef } = dropdownRefs[headerId];
        tableRowCell.dataValidation = {
          type: 'list',
          operator: 'equal',
          showErrorMessage: true,
          allowBlank: true,
          formulae: [`${optionsWorksheet.name}!${startRef}:${lastRef}`],
          errorStyle: 'error',
          errorTitle: 'Ошибка',
          error: 'Выберите значение из списка'
        };
      }
    }

    tableRow.height = Math.max(
      tableRow.height ?? DEFAULT_ROW_HEIGHT,
      lineBreakCount * DEFAULT_ROW_HEIGHT
    );
  }

  download(workbook, worksheetName);
}

function download(workbook: ExcelJS.Workbook, fileName: string) {
  workbook.xlsx.writeBuffer().then(async function(buffer) {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const reader = new FileReader();
    reader.readAsDataURL(blob);

    reader.onloadend = function() {
      if (typeof reader.result !== 'string') {
        return;
      }

      const dataUrl = reader.result;
      const slitedFileName = fileName.split('.');
      const userExtension = slitedFileName.at(-1);
      const hasExtension = ['xls', 'xlsx', 'csv'].includes(userExtension);
      const cleanedFileName = hasExtension
        ? slitedFileName.slice(0, -1).join('.')
        : fileName;
      const extension =
        hasExtension && userExtension !== 'xls' ? userExtension : 'xlsx';

      if (env.isPlugin()) {
        window.$PAPI.download(
          dataUrl,
          'Экспорт в Excel',
          'Выберите файл для сохранения выгрузки',
          extension,
          cleanedFileName
        );
      } else {
        const link = document.createElement('a');
        link.download = `${cleanedFileName}.${extension}`;
        link.href = dataUrl;
        link.click();
      }
    };
  });
}

const formatListToString = (list: Array<CellData | null>) => {
  if (!Array.isArray(list)) return list;
  if (list.length < 2) return list[0] ?? null;

  return list
    .map((item) =>
      typeof item === 'object' && item?.hyperlink ? item?.hyperlink : item
    )
    .join('\n');
};
