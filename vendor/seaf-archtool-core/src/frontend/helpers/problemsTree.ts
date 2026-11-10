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
      Konstantin Myachin <kvmyachin@gmail.com>, Sber

  Contributors:
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
*/

// Дерево валидаторов раздела «Проблемы» (Problems/tabs/Validators.vue): счетчик и цвета узлов.

// Вкладка: все, только отклонения или только исключения
export type ProblemsFilter = 'all' | 'error' | 'warning';

// Цвета статусов палитры: bad — отклонение, wip — исключение
export type ProblemTone = 'bad' | 'wip';

export interface ProblemStatus {
  icon: string;
  tone: ProblemTone;
}

export const PROBLEM_STATUS: ProblemStatus = { icon: 'mdi-alert-circle', tone: 'bad' };
export const EXCEPTION_STATUS: ProblemStatus = { icon: 'mdi-alert', tone: 'wip' };

// Попадает ли отклонение или исключение на выбранную вкладку
export const isShownOnTab = (filter: ProblemsFilter, isException: boolean): boolean =>
  !((filter === 'error' && isException) || (filter === 'warning' && !isException));

// Число в бейдже узла — то, что видно на выбранной вкладке
export const problemsCount = (filter: ProblemsFilter, countProblems: number, countExceptions: number): number => {
  switch (filter) {
    case 'error': return countProblems;
    case 'warning': return countExceptions;
    default: return countProblems + countExceptions;
  }
};

// Цвет бейджа — по тому, что он считает: на вкладке «Все» он красный, если среди посчитанного есть отклонения
export const problemsCountTone = (filter: ProblemsFilter, countProblems: number): ProblemTone =>
  ((filter === 'warning') || ((filter === 'all') && !countProblems)) ? 'wip' : 'bad';

// Значок узла: отклонения важнее исключений; без того и другого значок не меняется
export const problemsNodeStatus = (countProblems: number, countExceptions: number): ProblemStatus | null => {
  if (countProblems) return PROBLEM_STATUS;
  if (countExceptions) return EXCEPTION_STATUS;
  return null;
};
