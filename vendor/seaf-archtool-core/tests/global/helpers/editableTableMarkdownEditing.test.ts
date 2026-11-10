/** @jest-environment jsdom */

import { shouldFinishMarkdownEditing } from '../../../src/frontend/helpers/shouldFinishMarkdownEditing';

describe('editable-table Markdown editing focus', () => {
  const cell = document.createElement('div');
  const pencil = document.createElement('button');
  const outside = document.createElement('button');

  beforeAll(() => cell.append(pencil));

  it('does not finish when editing is closed', () => {
    expect(shouldFinishMarkdownEditing(false, cell, outside)).toBe(false);
  });

  it('keeps editing when focus moves within the cell', () => {
    expect(shouldFinishMarkdownEditing(true, cell, pencil)).toBe(false);
  });

  it('finishes editing when focus leaves the cell', () => {
    expect(shouldFinishMarkdownEditing(true, cell, outside)).toBe(true);
  });

  it('finishes editing when the focus target is unavailable', () => {
    expect(shouldFinishMarkdownEditing(true, cell, null)).toBe(true);
  });
});
