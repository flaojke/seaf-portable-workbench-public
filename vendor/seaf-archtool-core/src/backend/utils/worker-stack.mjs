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
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber

  Contributors:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2024, 2026
*/

import { EventEmitter } from 'node:events';
import { Worker } from 'worker_threads';

const currentJob = Symbol('currentJob');
const replaced = Symbol('replaced');

// The same thread is handed out again after a successful message, so a worker
// has to stay alive once it has posted a result. A thread that exits after a
// reply is dropped and replaced; this pool is built for long-lived workers
// (smartants), not for scripts that exit after one postMessage.
export class WorkerStack {
    constructor(workerCount, source, workerTimeout, requestTimeout) {
        this.stack = [];
        this.max = workerCount;
        this.source = source;
        this.workerTimeout = workerTimeout;
        this.queueTimeout = requestTimeout;
        this.taskQueue = [];
        this.dequeueing = false;
        this.emitter = new EventEmitter();
        this.dequeue = this.dequeue.bind(this);
        this.emitter.on('ready', this.dequeue);
        if (source) {
            for (let i = 0; i < workerCount; i++) {
                this.stack.push(this.createWorker());
            }
        }
    }

    createWorker() {
        const worker = new Worker(this.source);
        worker.on('exit', () => {
            const job = worker[currentJob];
            worker[currentJob] = undefined;
            if (job) job();
            this.replace(worker);
        });
        return worker;
    }

    // One replacement per dead thread. Exit of an idle worker and a later pop
    // of that same corpse must not each start a new thread.
    replace(worker) {
        if (worker[replaced]) return;
        worker[replaced] = true;
        const index = this.stack.indexOf(worker);
        if (index !== -1) this.stack.splice(index, 1);
        const next = this.createWorker();
        if (!this.put(next)) {
            next[replaced] = true;
            next.terminate();
        }
    }

    // threadId is -1 after the thread has stopped.
    acquire() {
        while (this.stack.length > 0) {
            const worker = this.stack.pop();
            if (worker.threadId !== -1) return worker;
            this.replace(worker);
        }
        return undefined;
    }
    
    async execute(data) {
        const timeout = new Promise((_resolve, reject) => {
            setTimeout(() => {
                reject('Queue timeout');
            }, this.queueTimeout);
        });
        const result = new Promise((resolve, reject) => {
            this.retrieve().then((worker) => {
                worker.removeAllListeners('message');
                worker.removeAllListeners('error');
                let settled = false;
                let killed = false;
                const controller = setTimeout(() => {
                    if (settled) return;
                    killed = true;
                    worker.terminate();
                }, this.workerTimeout);
                worker[currentJob] = () => {
                    clearTimeout(controller);
                    if (settled) return;
                    settled = true;
                    reject('Worker terminated');
                };
                worker.on('message', (outcome) => {
                    if (settled || killed) return;
                    settled = true;
                    clearTimeout(controller);
                    worker[currentJob] = undefined;
                    if (worker.threadId !== -1) this.put(worker);
                    resolve(outcome);
                });
                worker.on('error', (error) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(controller);
                    reject(error);
                });
                worker.postMessage(data);
            });
        });
        return Promise.race([timeout, result]);
    }
    
    dequeue() {
        if (this.dequeueing) return;
        this.dequeueing = true;
        try {
            while (this.taskQueue.length > 0) {
                const worker = this.acquire();
                if (!worker) break;
                this.taskQueue.shift()(worker);
            }
        } finally {
            this.dequeueing = false;
        }
    }
    
    put(worker) {
        if (worker.threadId === -1) return false;
        if (this.stack.length < this.max) {
            this.stack.push(worker);
            if (this.stack.length === 1) {
                this.emitter.emit('ready');
            }
            return true;
        } else return false;
    }
    
    async retrieve() {
        const worker = this.acquire();
        if (worker) return worker;
        return new Promise((resolve) => {
            this.taskQueue.push(resolve);
        });
    }
}
