/*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru

  Copyright (C) 2022 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  In any derivative products, you must retain the information of
  owner of the original code and provide clear attribution to the project

  https://dochub.info

  The use of this product or its derivatives for any purpose cannot be a secret.


  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      R.Piontik <r.piontik@mail.ru>

  Contributors:
  	  R.Piontik <r.piontik@mail.ru> - 2023
  	  R.Piontik <r.piontik@mail.ru> - 2024
  	  Vladislav Markin <markinvy@yandex.ru>, Sber - 2023
  	  Vladislav Markin <markinvy@yandex.ru>, Sber - 2024
      Alexander Romashin <romashin.a.va@sberbank.ru>, Sber - 2025
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

import gitlabDriver from '../../gitlab/driver.mjs';
import bitbucketDriver from '../../bitbucket/driver.mjs';
import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';

const logger = getLoggerWithTag('g/m/t/uri');

export function makeURIByBaseURI(uri, baseURI) {
	// if (('' + uri).startsWith('gitlab:')) debugger;
	let result;
	// Анализируем URI
	try {
		// Если URI ссылка на прямой ресурс, оставляем его как есть
		new URL(uri);
		result = uri;
	} catch (e) {
		// Если возникла ошибка, считаем путь относительным
		if (!baseURI) {
			throw `Error in makeURIByBaseURI! Base URI is empty, can not resolve relative URI ${uri}. ${e.message ?? ''}`;
		}
		const protocol = (new URL(baseURI)).protocol;

		if (protocol === 'gitlab:' || protocol === 'bitbucket:') {
			const segments = baseURI.split('@');
			if (segments.length !== 2) {
				// Не найден разделитель репозитория+ветка от файла
				throw `Error in URI ${baseURI}! Not found divider '@'`;
			}
			const basePathURL = new URL(`/${segments[1]}`, 'http://nop.none');
			const targetURL = new URL(uri, basePathURL);
			result = `${segments[0]}@${targetURL.pathname.slice(1)}${targetURL.search}${targetURL.hash}`;
		} else if (protocol === 'backend:') {
			result = new URL(uri.replace(/\.\./g, '%E2%86%90'), baseURI);
		} else {
			result = new URL(uri, baseURI);
		}
	}
	return result.toString();
}

// Раскодирует путь к файлу из URI; при некорректной последовательности '%' возвращает путь как есть
function decodeFilePath(path) {
	try {
		return decodeURIComponent(path);
	} catch {
		return path;
	}
}

export default function(config) {
	const gitlab = new gitlabDriver(config);
	const bitbucket = new bitbucketDriver(config);
	this.isURL= (url) => {
		// eslint-disable-next-line no-useless-escape
		return url && url.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.?[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/);
	};
	this.isExternalURI = (uri) => {
		const slice = uri.slice(0, window.origin.length);
		const origin = window.origin;
		const isUrl = this.isURL(uri);
		const result = (slice !== origin) && isUrl;
		logger.trace(() => [
			`check is external uri [${uri}]`,
			{title: 'slice', obj: slice},
			{title: 'origin', obj: origin},
			{title: 'isUrl', obj: isUrl},
			{title: 'result', obj: result}
		]);
		return result;
	};
	this.makeURIByBaseURI = makeURIByBaseURI;
	this.makeURL = (uri, baseURI) => {
		let result;
		// Анализируем URI
		try {
			let url = new URL(uri);
			// Если ссылка на gitlab
			if (url.protocol === 'gitlab:') {
				let segments = url.pathname.split('@');
				if (segments.length !== 2) {
					// Не найден разделитель проекта+бранч от файла GitLab
					throw `Error in URI ${uri}! Not found divider '@'`;
				} else {
					let gilab_params = segments[0].split(':');
					if (gilab_params.length !== 2) {
						// Неверно указаны идентификатор проекта и бранч GitLab
						throw `Error in URI ${uri}! Incorrect project id and branch`;
					}

					result = {
						type: 'gitlab',
						projectID: gilab_params[0],
						url: gitlab.makeFileURI(
							gilab_params[0], // Application ID
							decodeFilePath(segments[1]), // Путь к файлу
							gilab_params[1], // Бранч
							'raw'
						)
					};
				}
			} else if (url.protocol === 'bitbucket:') {
				let segments = url.pathname.split('@');
				if (segments.length !== 2) {
					//  Не найден разделитель проекта+репозиторий+бранч от файла BitBucket
					throw `Error in URI ${uri}! Not found divider '@'`;
				} else {
					let bitbucket_params = segments[0].split(':');
					if (bitbucket_params.length !== 3) {
						// Не верно указаны идентификаторы проекта, репозитория и бранча BitBucket
						throw `Error in URI ${uri}! Incorrect project id, repository id and branch`;
					}

					result = {
						type: 'bitbucket',
						projectID: bitbucket_params[0],
						repositoryID: bitbucket_params[1],
						url: bitbucket.makeFileURI(
							bitbucket_params[0].toUpperCase(), // Project ID
							bitbucket_params[1].toLowerCase(), // Repository ID
							decodeFilePath(segments[1]), // Путь к файлу
							bitbucket_params[2] // Бранч
						)
					};
				}
			} else {
				result = {
					type: 'web',
					url
				};
			}
		} catch (e) {
			// Если возникла ошибка, считаем путь относительным
			if (!baseURI) {
				logger.error(() => `error when makeURL with url ${uri} and baseUri ${baseURI}`, e);
				throw `Error in makeURL! Base URI is empty, can not resolve relative URI ${uri}. ${e.message ?? ''}`;
			}
			result = this.makeURL(baseURI);
			if (result.type === 'gitlab' || result.type === 'bitbucket') {
				return this.makeURL(makeURIByBaseURI(uri, baseURI));
			} else {
				result.url = new URL(uri, result.url);
			}
		}
		return result;
	};
}

