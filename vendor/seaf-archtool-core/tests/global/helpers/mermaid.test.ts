/** @jest-environment jsdom */

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
*/

import { prepareMermaidSVG } from '@front/helpers/mermaid';

describe('prepareMermaidSVG', () => {
  test('keeps safe C4 links and closes their anchor', () => {
    const result = prepareMermaidSVG('<svg><text>![Документ](/docs/example)</text></svg>');

    expect(result).toContain('<a href="/docs/example">Документ</a>');
  });

  test('does not turn a C4 label into executable markup', () => {
    const result = prepareMermaidSVG('<svg><text>![&lt;img src=x onerror=alert(1)&gt;](/docs/example)</text></svg>');

    expect(result).not.toContain('<img');
    expect(result).toContain('&amp;lt;img src=x onerror=alert(1)&amp;gt;');
  });

  test('preserves renderer-specific SVG elements', () => {
    const result = prepareMermaidSVG('<svg><foreignObject><div>safe</div></foreignObject></svg>');

    expect(result).toContain('<foreignObject>');
  });
});
