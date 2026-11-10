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
      mtrhnv, Sber - 2026

  Contributors:
      mtrhnv - 2026
*/

import {beforeEach, describe, expect, it, jest} from '@jest/globals';

describe('account extractUserData', () => {
    beforeEach(() => {
        delete process.env.VUE_APP_DOCHUB_AUTH_USER_CONFIG;
        delete process.env.VUE_APP_DOCHUB_ROLES_CONFIG;
        jest.resetModules();
    });

    it('извлекает данные из SEAF JWT (AMS issuer) через AUTH_USER_CONFIG', async() => {
        process.env.VUE_APP_DOCHUB_AUTH_USER_CONFIG = JSON.stringify([{
            iss: 'access-management-service',
            name: 'name',
            surname: 'surname',
            roles: 'roles',
            userId: 'sub'
        }]);
        process.env.VUE_APP_DOCHUB_ROLES_CONFIG = '[]';
        const {extractUserData} = await import('@back/helpers/account.mjs');
        const user = extractUserData({
            iss: 'access-management-service',
            sub: 'user-1',
            name: 'Иван',
            surname: 'Петров',
            roles: ['users']
        });
        expect(user).toEqual({
            sub: 'user-1',
            userId: 'user-1',
            name: 'Иван',
            surname: 'Петров',
            email: '',
            roles: [],
            initials: 'ИП'
        });
    });

    it('использует AUTH_USER_CONFIG для Keycloak issuer', async() => {
        process.env.VUE_APP_DOCHUB_AUTH_USER_CONFIG = JSON.stringify([{
            iss: 'https://keycloak.example/realms/test',
            surname: 'family_name',
            name: 'given_name',
            roles: 'realm_access.roles',
            userId: 'preferred_username'
        }]);
        process.env.VUE_APP_DOCHUB_ROLES_CONFIG = JSON.stringify([
            {role: 'users', label: 'Пользователь'}
        ]);
        const {extractUserData} = await import('@back/helpers/account.mjs');
        const user = extractUserData({
            iss: 'https://keycloak.example/realms/test',
            preferred_username: 'alice',
            given_name: 'Alice',
            family_name: 'Smith',
            realm_access: {roles: ['users']}
        });
        expect(user.userId).toBe('alice');
        expect(user.name).toBe('Alice');
        expect(user.surname).toBe('Smith');
        expect(user.roles).toEqual(['пользователь']);
        expect(user.initials).toBe('AS');
    });
});
