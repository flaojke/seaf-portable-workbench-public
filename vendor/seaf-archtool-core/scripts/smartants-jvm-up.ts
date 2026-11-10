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

// Запуск SmartAnts-сервиса на JVM (Kotlin) для локальной разработки.
// Сервис читает только переменные процесса, поэтому .env загружается здесь и передаётся в JVM.
// JAR берётся по версии из src/assets/libs/smartants-service.properties (см. smartants-jvm/serviceJar.ts).
import { spawn } from 'child_process';
import '@back/helpers/env.mjs';
import { resolveJava } from './smartants-jvm/java.ts';
import { resolveServiceJar } from './smartants-jvm/serviceJar.ts';
import { changeLoggerImpl, getLoggerWithTag } from '@global/logger/v2/logger.mjs';
import { mainLogger } from '@back/utils/logger/constLoggers.mjs';

changeLoggerImpl(mainLogger);
const logger = getLoggerWithTag('scripts/smartants-jvm-up.ts');

const javaOpts = (process.env.VUE_APP_SEAF_SMARTANTS_JAVA_OPTS ?? '').split(/\s+/).filter(Boolean);

let java: ReturnType<typeof resolveJava>;
let jar: string;
try {
    java = resolveJava(process.env);
    ({ jar } = await resolveServiceJar());
} catch (err) {
    logger.error(() => (err as Error).message);
    process.exit(1);
}

logger.info(() => `SmartAnts JVM service: ${java.command} (Java ${java.major}), ${jar}`);
const child = spawn(java.command, [...javaOpts, '-jar', jar], { env: process.env, stdio: 'inherit' });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => child.kill(signal));
}
child.on('error', (err) => {
    logger.error(() => `SmartAnts JVM service failed to start: ${err.message}`);
    process.exit(1);
});
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
