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
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber

  Contributors:
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
*/

import ExcelJS from 'exceljs';

import env from '@front/helpers/env';
import { STYLES } from './const';

const OPTION_LIST_NAME = 'LOOKUPS';

export class Book {
  constructor(options = {}) {
    this.workbook = new ExcelJS.Workbook();
    this.options = options;

    const optionsList = this.workbook.addWorksheet(OPTION_LIST_NAME);
    optionsList.state = 'veryHidden';
  }

  createPage(data) {
    return new List(this.workbook, this.options, data);
  }

  download(fileName) {
    this.workbook.xlsx.writeBuffer().then(async function(buffer) {
      const blob = new Blob([buffer], { type: 'application/vnd.ms-excel' });
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = function() {
        const slitedFileName = fileName.split('.');
        const userExtension = slitedFileName.at(-1);
        const hasExtension = ['xls', 'xlsx', 'csv'].includes(userExtension);
        const cleanedFileName = hasExtension ? slitedFileName.slice(0, -1).join('.') : fileName;
        const extension = hasExtension ? userExtension : 'xls';

        if (env.isPlugin()) {
          window.$PAPI.download(
            reader.result,
            'Экспорт в Excel',
            'Выберите файл для сохранения выгрузки',
            extension,
            cleanedFileName
          );
        } else {
          const link = document.createElement('a');
          link.download = `${cleanedFileName}.${extension}`;
          link.href = reader.result;
          link.click();
        }
      };
    });
  }
}

export class List {
  constructor(workbook, options, pageData) {
    this.options = options;

    this.gap = {
      row: 0,
      col: 0
    };

    this.pointer = {
      row: 1,
      col: 1
    };

    this.init(workbook, options, pageData);
  }

  createOptionFormulae(options) {
    const optionsList = this.worksheet.workbook.getWorksheet(OPTION_LIST_NAME);

    const row = optionsList.addRow(options);

    const firstCellAddress = row._cells[0]['$col$row'];
    const lastCellAddress = row._cells[row._cells.length - 1]['$col$row'];

    const formulae = [
      `${optionsList.name}!${firstCellAddress}:${lastCellAddress}`
    ];

    return formulae;
  }

  init(workbook, options, pageData) {
    this.worksheet = workbook.addWorksheet(pageData.name, {
      views: [
        {
          showGridLines: Boolean(options['show-grid-lines'] !== false)
        }
      ]
    });

    if (options['margin-top']) {
      this.worksheet.getRow(1).height = options['margin-top'];
      this.gap.row++;
      this.pointer.row++;
    }

    if (options['margin-left']) {
      this.worksheet.getColumn(1).width = options['margin-left'];
      this.gap.col++;
      this.pointer.col++;
    }
  }

  applyPageSettings(pageData) {
    if (pageData.rows) {
      for (let key in pageData.rows) {
        const num = parseInt(key);
        const options = pageData.rows[key];
        if (isNaN(num)) return;
        const row = this.worksheet.getRow(num);
        this.applyRowAndColumnOptions(row, options);
      }
    }

    if (pageData.columns) {
      for (let key in pageData.columns) {
        const num = parseInt(key);
        const options = pageData.columns[key];
        if (isNaN(num)) return;
        const row = this.worksheet.getColumn(num);
        this.applyRowAndColumnOptions(row, options);
      }
    }
  }

  applyRowAndColumnOptions(line, options) {
    for (let optionName in options) {
      const optionValue = options[optionName];
      line[optionName] = optionValue;
    }
  }

  addEmptyRows(size = 1) {
    this.pointer.row += size;
  }

  setLinkCell(cell, link) {
    const text = link.text;
    cell.value = {
      text: text,
      hyperlink: '#\'' + link.path + '\'!A1'
    };
    this.applyCellStyle(cell, STYLES.LINK);
  }

  setSelectCell(cell, options) {
    if (!options) return;

    cell.dataValidation = {
      type: 'list',
      operator: 'equal',
      showErrorMessage: true,
      allowBlank: true,
      formulae: this.createOptionFormulae(options),
      errorStyle: 'error',
      errorTitle: 'Ошибка',
      error: 'Выберите значение из списка'
    };
  }

  getNextRowCell() {
    const row = this.worksheet.getRow(this.pointer.row++);
    return row.getCell(this.pointer.col + this.gap.col - 1);
  }

  addLink(link = {}) {
    const { text, path } = link;
    if (!text || !path) return;
    const cell = this.getNextRowCell();
    this.setLinkCell(cell, link);
  }

  addTitle(text) {
    if (!text) return;
    const cell = this.getNextRowCell();
    cell.value = text;
    cell.style = STYLES.TITLE;
  }

  addSubtitle(text) {
    if (!text) return;
    const cell = this.getNextRowCell();
    cell.value = text;
    cell.style = STYLES.SUBTITLE;
  }

  addDescription(text) {
    if (!text) return;
    const cell = this.getNextRowCell();
    cell.value = text;
    cell.style = STYLES.DESCRIPTION;
  }

  addComponentTable(component, data) {
    const { headers: sourseHeaders, body: rows } = data;

    const headers = sourseHeaders || component.headers;

    const columns = headers.map(({ value }) => ({ name: value }));

    const table = this.worksheet.addTable({
      name: component.name,
      ref: this.getNextRowCell().address,
      columns,
      rows
    });

    this.pointer.row += table.filterHeight - 1;

    this.setTableCells(table, headers);
  }

  addComponentRows({ rows }) {
    rows.forEach((rowData) => {
      let cell = this.getNextRowCell();

      if (typeof rowData === 'string' || typeof rowData === 'number') {
        cell.value = rowData;
      } else if (Array.isArray(rowData)) {
        const row = cell._row;
        let currentCellIndex = cell.fullAddress.col;

        rowData.forEach((data) => {
          cell = row.getCell(currentCellIndex);

          if (typeof data === 'string') {
            cell.value = data;
          } else if (typeof data === 'object') {
            cell.value = data.value;
            this.applyCellStyle(cell, data.style);
          }
          currentCellIndex++;
        });
      }
    });
  }

  applyCellStyle(cell, style = {}) {
    const { alignment, font, background, border } = style;
    if (alignment) {
      cell.style.alignment = alignment;
    }
    if (background) {
      cell.style.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: background
        }
      };
    }
    if (border) {
      const { style, color } = border;

      cell.style.border = {
        top: { style, color: { argb: color } },
        left: { style, color: { argb: color } },
        bottom: { style, color: { argb: color } },
        right: { style, color: { argb: color } }
      };
    }
    if (font) {
      for (let styleName in font) {
        if (!cell.style.font) cell.style.font = {};
        if (styleName === 'color') {
          if (typeof font[styleName] === 'object') {
            cell.style.font.color = font[styleName];
          } else {
            cell.style.font.color = {
              argb: font[styleName]
            };
          }
        } else {
          cell.style.font[styleName] = font[styleName];
        }
      }
    }
  }

  setTableCells(table, headers) {
    const { filterHeight: tableHeight, width: tableWidth } = table;

    const firstTableRowNumber = table.table.tl.row;
    const lastTableRowNumber = table.table.tl.row + tableHeight - 1;

    let currentRowNumber = firstTableRowNumber;

    const tableOptions = this.options;

    while (currentRowNumber <= lastTableRowNumber) {
      const row = this.worksheet.getRow(currentRowNumber);

      if (currentRowNumber === firstTableRowNumber) {
        row.height = tableOptions?.table?.headers?.height;
      }

      for (let c = 0; c < tableWidth; c++) {
        const currentCellNumber = c + this.gap.col + 1;
        const cell = row.getCell(currentCellNumber);
        const { type, style, options } = headers[c];

        const resultStyles = {
          border: { ...STYLES.TABLE_CELL_BORDER.border }
        };

        if (currentRowNumber === firstTableRowNumber) {
          // Первая строка / Заголовок
          Object.assign(resultStyles, STYLES.TABLE_HEADER_ALIGNMENT);
        } else {
          // Не заголовок
          Object.assign(resultStyles, style);

          if (type === 'select') {
            this.setSelectCell(cell, options);
          } else if (type === 'link') {
            this.setLinkCell(cell, { text: cell.value, path: cell.value });
          }
        }

        this.applyCellStyle(cell, resultStyles);

        // if (currentRowNumber === lastTableRowNumber) {
        //   // Последняя строка
        // } else if (c === 0) {
        //   // Первая колонка
        // } else if (c === tableWidth - 1) {
        //   // Последняя колонка
        // }
      }
      currentRowNumber++;
    }
  }
}
