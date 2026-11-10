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
      Alexander Romashin <alexander.romashin@gmail.com>, Sber

  Contributors:
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

export function toManifestInfoDto(manifestMeta) {
    const dto = {
        permission: manifestMeta.permission,
        manifestHash: manifestMeta.manifestHash,
        problems: manifestMeta.problems,
        commonManifestHash: manifestMeta.commonManifestHash,
        error: manifestMeta.error,
        tsVersion: manifestMeta.tsVersion,
        successLoadTimestamp: manifestMeta.successLoadTimestamp,
        errorLoadTimestamp: manifestMeta.errorLoadTimestamp
    };
    if (dto.successLoadTimestamp) {
        dto.successLoadTimestampISO = new Date(dto.successLoadTimestamp).toISOString();
    }
    if (dto.errorLoadTimestamp) {
        dto.errorLoadTimestampISO = new Date(dto.errorLoadTimestamp).toISOString();
    }
    return dto;
}
