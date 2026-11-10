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
*/

import {
  checkEditableHeaderIncludePathProp,
  checkHeaderRender,
  TableError
} from '../../../plugins/editable-table/lib/tableDataValidate';

describe('editable-table Markdown contract', () => {
  it('accepts render: markdown for a text column', () => {
    expect(() => checkHeaderRender({
      headerID: 'evidence',
      type: 'text',
      render: 'markdown'
    })).not.toThrow();
  });

  it('keeps the existing text contract when render is not configured', () => {
    expect(() => checkHeaderRender({
      headerID: 'description',
      type: 'text'
    })).not.toThrow();
  });

  it('rejects unknown render modes', () => {
    expect(() => checkHeaderRender({
      headerID: 'evidence',
      type: 'text',
      render: 'html'
    })).toThrow(TableError);
  });

  it('rejects Markdown rendering for non-text columns', () => {
    expect(() => checkHeaderRender({
      headerID: 'status',
      type: 'select',
      render: 'markdown'
    })).toThrow(TableError);
  });

  it('requires save.path for editable columns', () => {
    expect(() => checkEditableHeaderIncludePathProp({
      headerID: 'evidence',
      editable: true
    })).toThrow(TableError);

    expect(() => checkEditableHeaderIncludePathProp({
      headerID: 'evidence',
      editable: true,
      save: { path: 'data/result.yaml' }
    })).not.toThrow();
  });

});
