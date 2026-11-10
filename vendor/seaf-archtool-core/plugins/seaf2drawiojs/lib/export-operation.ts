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

  Contributors:
      Aksinenko Anatoly <aiaksinenko@sberbnak.ru>, Sber - 2026
*/

export type ExportOperation = {
  handler: (data: Record<string, unknown>) => unknown | Promise<unknown>;
  token: symbol;
  requestId: number;
  responseStarted: boolean;
};

export type ExportOperationController = {
  current: ExportOperation | null;
  start(handler: ExportOperation['handler']): ExportOperation | null;
  responseStarted(operation: ExportOperation | null | undefined, response: Record<string, unknown>): boolean;
  finish(operation: ExportOperation | null | undefined): boolean;
  cancel(): void;
  isCurrent(operation: ExportOperation | null | undefined): boolean;
};

export function createExportOperationState(
  onTimeout: (operation: ExportOperation) => void,
  timeout = 30000
) {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  let nextRequestId = 0;

  const controller: ExportOperationController = {
    current: null,
    start(handler: ExportOperation['handler']): ExportOperation | null {
      if (this.current) return null;
      const operation: ExportOperation = {
        handler,
        token: Symbol('drawio-export'),
        requestId: ++nextRequestId,
        responseStarted: false
      };
      this.current = operation;
      const owner = this;
      timeoutHandle = setTimeout(() => {
        if (!owner.isCurrent(operation)) return;
        owner.current = null;
        timeoutHandle = null;
        onTimeout(operation);
      }, timeout);
      return operation;
    },
    responseStarted(operation: ExportOperation | null | undefined, response: Record<string, unknown>): boolean {
      if (!this.isCurrent(operation) || operation.responseStarted) return false;
      const request = response.message;
      if (!request || typeof request !== 'object' || (request as Record<string, unknown>).requestId !== operation.requestId) return false;
      operation.responseStarted = true;
      clearTimer();
      return true;
    },
    finish(operation: ExportOperation | null | undefined): boolean {
      if (!this.isCurrent(operation)) return false;
      clearTimer();
      this.current = null;
      return true;
    },
    cancel() {
      clearTimer();
      this.current = null;
    },
    isCurrent(operation: ExportOperation | null | undefined) {
      return Boolean(operation && this.current?.token === operation.token);
    }
  };

  function clearTimer() {
    if (timeoutHandle !== null) {
      clearTimeout(timeoutHandle);
      timeoutHandle = null;
    }
  }

  return controller;
}

export function parseDrawioMessage(message: unknown): Record<string, unknown> | null {
  if (typeof message !== 'string' || !message) return null;
  try {
    const data = JSON.parse(message);
    return data && typeof data === 'object' && !Array.isArray(data)
      ? data as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}
