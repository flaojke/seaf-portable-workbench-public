import { describe, expect, it, jest } from '@jest/globals';
import { computed, reactive } from 'vue';

import {
  getDiffContent,
  mergeDiffs,
  normalizeDiffPath,
  parseDiffContent,
  putDiffContent,
  stringifyDiffContent
} from '../../plugins/seaf2drawiojs/lib/transformations';
import {
  createExportOperationState,
  parseDrawioMessage
} from '../../plugins/seaf2drawiojs/lib/export-operation';
import { resolvePathInsideRoot } from '../../src/global/helpers/updateRootFiles/updateRootFilesInPutContent';

describe('seaf2drawiojs transformation storage', () => {
  it('keeps download fallback when diff_path is absent', () => {
    expect(normalizeDiffPath()).toBeNull();
    expect(normalizeDiffPath('  ')).toBeNull();
    expect(normalizeDiffPath(' ./diff.yaml ')).toBe('./diff.yaml');
    expect(() => normalizeDiffPath({ path: './diff.yaml' })).toThrow('diff_path must be a string');
    expect(() => normalizeDiffPath('./diff.txt')).toThrow('diff_path must end with .yaml or .json');
  });

  it('serializes diff content according to its configured extension', () => {
    expect(stringifyDiffContent({ page: [] }, './diff.yaml')).toBe('page: []\n');
    expect(stringifyDiffContent({ page: [] }, './diff.json')).toBe('{\n  "page": []\n}\n');
  });

  it('ignores malformed and non-object Draw.io messages', () => {
    expect(parseDrawioMessage(undefined)).toBeNull();
    expect(parseDrawioMessage({ event: 'init' })).toBeNull();
    expect(parseDrawioMessage('not-json')).toBeNull();
    expect(parseDrawioMessage('[]')).toBeNull();
    expect(parseDrawioMessage('{"event":"init"}')).toEqual({ event: 'init' });
  });

  it('keeps export attempts isolated after timeout and late settlement', () => {
    jest.useFakeTimers();
    try {
      const onTimeout = jest.fn();
      const state = createExportOperationState(onTimeout, 1000);
      const first = state.start(jest.fn());
      expect(state.current).toBe(first);

      jest.advanceTimersByTime(1000);
      expect(onTimeout).toHaveBeenCalledWith(first);
      expect(state.isCurrent(first)).toBe(false);

      const second = state.start(jest.fn());
      expect(second).not.toBe(first);
      expect(state.responseStarted(second, { message: { requestId: first.requestId } })).toBe(false);
      expect(state.responseStarted(second, { message: { requestId: second.requestId } })).toBe(true);
      expect(state.finish(first)).toBe(false);
      expect(state.isCurrent(second)).toBe(true);
      expect(onTimeout).toHaveBeenCalledTimes(1);
      expect(state.finish(second)).toBe(true);
      expect(state.current).toBeNull();
      expect(state.isCurrent(second)).toBe(false);
      jest.advanceTimersByTime(1000);
      expect(onTimeout).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('stops the export timeout when Draw.io starts its response', () => {
    jest.useFakeTimers();
    try {
      const onTimeout = jest.fn();
      const state = createExportOperationState(onTimeout);
      const operation = state.start(jest.fn());
      expect(state.current).toBe(operation);

      expect(state.responseStarted(operation, { message: { requestId: operation.requestId } })).toBe(true);
      jest.advanceTimersByTime(30001);
      expect(onTimeout).not.toHaveBeenCalled();
      expect(state.responseStarted(operation, { message: { requestId: operation.requestId } })).toBe(false);
      expect(state.finish(operation)).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('exposes current through a reactive controller proxy', () => {
    const state = reactive(createExportOperationState(jest.fn()));
    const exporting = computed(() => Boolean(state.current));
    expect(exporting.value).toBe(false);
    const operation = state.start(jest.fn());

    expect(state.current?.token).toBe(operation.token);
    expect(exporting.value).toBe(true);
    expect(state.finish(operation)).toBe(true);
    expect(state.current).toBeNull();
    expect(exporting.value).toBe(false);
  });

  it('parses YAML returned by getContent and accepts plugin objects', () => {
    expect(parseDiffContent({ data: 'page:\n  - id: object\n' })).toEqual({
      page: [{ id: 'object' }]
    });
    expect(parseDiffContent({ data: { page: [] } })).toEqual({ page: [] });
    expect(parseDiffContent(null)).toBeNull();
    expect(() => parseDiffContent({ data: [] })).toThrow('diff_path must contain a YAML object');
    expect(() => parseDiffContent({ data: 'value' })).toThrow('diff_path must contain a YAML object');
  });

  it('treats a missing diff file as empty and preserves other read errors', async() => {
    const notFound = { response: { status: 404 } };
    const unavailable = { response: { status: 503 } };

    await expect(getDiffContent(jest.fn().mockRejectedValue(notFound), './diff.yaml'))
      .resolves.toBeNull();
    await expect(getDiffContent(jest.fn().mockRejectedValue({ status: 404 }), './diff.yaml'))
      .resolves.toBeNull();
    await expect(getDiffContent(jest.fn().mockRejectedValue(unavailable), './diff.yaml'))
      .rejects.toBe(unavailable);
  });

  it('uses plugin and backend putContent contracts', async() => {
    const pluginPutContent = jest.fn().mockResolvedValue(undefined);
    const backendPutContent = jest.fn().mockResolvedValue({ success: true });

    await putDiffContent(pluginPutContent, './diff.yaml', 'page: []\n', true);
    await putDiffContent(backendPutContent, './diff.yaml', 'page: []\n', false);

    expect(pluginPutContent).toHaveBeenCalledWith('./diff.yaml', 'page: []\n');
    expect(backendPutContent).toHaveBeenCalledWith({ './diff.yaml': 'page: []\n' });
  });

  it('resolves R41 diff_path inside the IDE source root for both read and write', async() => {
    const path = resolvePathInsideRoot(
      '../../../../../../architecture/ta/Docs/schema_r41.diff.yaml',
      'plugin:/idea/source/_metamodel_/seaf-company-ta/_extensions/ta_docs/r41/docs/schema_r41.yaml',
      'plugin:/idea/source/$root'
    );
    const getContent = jest.fn().mockResolvedValue({ data: 'main: []\n' });
    const putContent = jest.fn().mockResolvedValue(undefined);

    await getDiffContent(getContent, path);
    await putDiffContent(putContent, path, 'main: []\n', true);

    expect(path).toBe('plugin:/idea/source/architecture/ta/Docs/schema_r41.diff.yaml');
    expect(getContent).toHaveBeenCalledWith(path);
    expect(putContent).toHaveBeenCalledWith(path, 'main: []\n');
  });

  it('reports a rejected backend save', async() => {
    const putContent = jest.fn().mockResolvedValue({ success: false, message: 'rejected' });

    await expect(putDiffContent(putContent, './diff.yaml', '{}\n', false))
      .rejects.toThrow('rejected');
  });

  it('propagates failed plugin writes and missing backend results', async() => {
    await expect(putDiffContent(jest.fn().mockRejectedValue(new Error('plugin rejected')), './diff.yaml', '{}\n', true))
      .rejects.toThrow('plugin rejected');
    await expect(putDiffContent(jest.fn().mockResolvedValue(undefined), './diff.yaml', '{}\n', false))
      .rejects.toThrow('Failed to save transformations');
  });

  it('preserves hidden disk transformations while replacing visible ones', () => {
    expect(mergeDiffs(
      {
        main: [
          { id: 'visible', diff: { x: 10 } },
          { id: 'missing', diff: { x: 20 } }
        ]
      },
      { main: [{ id: 'visible', diff: { x: 30 } }] },
      { main: { visible: {} } }
    )).toEqual({
      main: [
        { id: 'visible', diff: { x: 30 } },
        { id: 'missing', diff: { x: 20 } }
      ]
    });
  });

  it('removes stale visible transformations', () => {
    expect(mergeDiffs(
      { main: [{ id: 'visible', diff: { x: 30 } }, { id: 'missing', diff: { x: 20 } }] },
      { main: [] },
      { main: { visible: {} } }
    )).toEqual({
      main: [{ id: 'missing', diff: { x: 20 } }]
    });
  });

  it('does not add an empty Common page but keeps an existing one when resetting visible records', () => {
    expect(mergeDiffs({}, { common_location_page: [] }, { common_location_page: {} })).toEqual({});
    expect(mergeDiffs({}, undefined, { common_location_page: { logical: {} } })).toEqual({});
    expect(mergeDiffs({ main: [] }, undefined, { main: {} })).toEqual({ main: [] });
    expect(mergeDiffs({ common_location_page: [] }, undefined, { common_location_page: { logical: {} } }))
      .toEqual({ common_location_page: [] });
    expect(mergeDiffs(
      {},
      { common_location_page: [{ id: 'manual', diff: { cell_attr_key: { style: { new: 'exitX=0.5' } } } }] },
      { common_location_page: { manual: {} } }
    )).toEqual({
      common_location_page: [{ id: 'manual', diff: { cell_attr_key: { style: { new: 'exitX=0.5' } } } }]
    });
    expect(mergeDiffs(
      { common_location_page: [{ id: 'visible', diff: { style: 'manual' } }, { id: 'hidden', diff: { x: 1 } }] },
      { common_location_page: [] },
      { common_location_page: { visible: {} } }
    )).toEqual({ common_location_page: [{ id: 'hidden', diff: { x: 1 } }] });
    expect(mergeDiffs(
      { common_location_page: [{ id: 'visible', diff: { style: 'manual' } }] },
      { common_location_page: [] },
      { common_location_page: { visible: {} } }
    )).toEqual({ common_location_page: [] });
  });
});
