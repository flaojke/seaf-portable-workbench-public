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

import {
  PrismaAstNodeType,
  PrismaFieldAttributeType,
} from "../enums/prismaAstNodeType";

import type {
  Model,
  Enumerator,
  Field,
  KeyValue,
  Value,
  RelationArray,
  Enum,
  Func,
  Type,
  Attribute,
} from "@mrleebo/prisma-ast";
import type { AstNode } from "../types/node";

export const isEnumNode = (node: AstNode): node is Enum => {
  return node.type === PrismaAstNodeType.enum;
};

export const isEnumeratorNode = (node: AstNode): node is Enumerator => {
  return node.type === PrismaAstNodeType.enumerator;
};

export const isModelNode = (node: AstNode): node is Model => {
  return node.type === PrismaAstNodeType.model;
};

export const isField = (node: AstNode): node is Field => {
  return node.type === PrismaAstNodeType.field;
};

export const isRelationFieldAttr = (
  node: Model["properties"][number],
): node is Field => {
  return node.type === PrismaAstNodeType.attribute && node.name === "relation";
};

export const isKeyValue = (node: AstNode | Value): node is KeyValue => {
  return (
    typeof node === "object" &&
    !Array.isArray(node) &&
    node.type === PrismaAstNodeType.keyValue
  );
};

export const isRelationNode = (node: AstNode): node is Attribute => {
  return (
    node.type === PrismaAstNodeType.attribute &&
    (node as Attribute).name === PrismaFieldAttributeType.relation
  );
};

export const isRelationArray = (
  node: AstNode | Value,
): node is RelationArray => {
  return (
    typeof node === "object" &&
    !Array.isArray(node) &&
    node.type === PrismaAstNodeType.array &&
    Array.isArray((node as RelationArray).args)
  );
};

export const isDefaultFieldValueNode = (
  node: NonNullable<Field["attributes"]>[number],
): boolean => {
  return node.type === PrismaAstNodeType.attribute && node.name === "default";
};

export const isFunNodeType = (node: AstNode | Value[]): node is Func => {
  return !Array.isArray(node) && node.type === PrismaAstNodeType.function;
};

export const isTypeNode = (node: AstNode): node is Type => {
  return node.type === PrismaAstNodeType.type;
};
