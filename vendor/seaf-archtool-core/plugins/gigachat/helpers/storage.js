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
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber

  Contributors:
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2026
*/

const STORAGE_PREFIX = 'augmented-chat-new-data';

function createStorageKey(activeToggle) {
  const agent = activeToggle ? activeToggle.key : 'default';
  return `${STORAGE_PREFIX}-${agent}`;
}

export function saveToStorage(activeToggle) {
  sessionStorage.setItem(
    createStorageKey(activeToggle),
    JSON.stringify({
      messages: activeToggle.messagesList,
      sessionId: activeToggle.sessionId
    })
  );
}

export function loadFromStorage(activeToggle) {
  const savedState = sessionStorage.getItem(
    createStorageKey(activeToggle)
  );
  if (savedState) {
    const { messages, sessionId } = JSON.parse(savedState);
    activeToggle.messagesList = messages;
    activeToggle.sessionId = sessionId;
  }
}

export function removeFromStorage(activeToggle) {
  sessionStorage.removeItem(createStorageKey(activeToggle));
}
