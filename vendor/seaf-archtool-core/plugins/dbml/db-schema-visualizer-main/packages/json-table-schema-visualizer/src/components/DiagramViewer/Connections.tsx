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
      Vladislav Markin, Sber

  Contributors:
      Vladislav Markin, Sber - 2025
*/

import { type JSONTableRef } from "shared/types/tableSchema";

import RelationConnection from "../RelationConnection/RelationConnection";

interface RelationsConnectionsProps {
  refs: JSONTableRef[];
}

const RelationsConnections = ({ refs }: RelationsConnectionsProps) => {
  return refs.map((ref) => {
    const source = ref.endpoints[0];
    const target = ref.endpoints[1];

    const key = `${source.tableName}-${source.fieldNames[0]}-${target.tableName}-${target.fieldNames[0]}`;

    return <RelationConnection key={key} source={source} target={target} />;
  });
};

export default RelationsConnections;
