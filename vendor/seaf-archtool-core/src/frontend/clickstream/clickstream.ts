/*
 *    Copyright (C) 2025 Sber
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *            http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 *    Maintainers:
 *      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2025
 *
 *    Contributors:
 *      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2025
 */

// Modified by LSV: telemetry is unavailable in the public distribution.
import env, {Plugins} from '@front/helpers/env';
export const PAGE_LOAD_START_SESSION_STORE_KEY = 'cs_pageLoadStart';
export const PAGE_FROM_PATH_SESSION_STORE_KEY = 'cs_pageFromPath';
export const PAGE_TO_PATH_SESSION_STORE_KEY = 'cs_pageToPath';
export const ROUTE_UID_SESSION_STORE_KEY = 'cs_routeUid';
export enum ClickstreamState {
  Initializing = 'initializing',
  Running = 'running',
  CannotStart = 'cannot_start'
}
export const getClickstreamState = (): ClickstreamState => ClickstreamState.CannotStart;
export const platform = !env.isPlugin() ? 'web' : env.isPlugin(Plugins.idea) ? 'plugin_idea' : 'plugin_vscode';
export const enableClickstream = async(): Promise<void> => {};
