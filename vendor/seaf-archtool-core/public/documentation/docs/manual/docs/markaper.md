# Компоновщик (markaper)

Компоновщик предоставляет для работы 4 вида компонентов. И, соответственно, возможность размещения содержимого в одной из предложенных форм:
- **select** (список);
- **tabs** (табы);
- **grid** (грид-сетка);
- **tree** (дерево).

Чтобы воспользоваться возможностями компоновщика, необходимо выбрать специальный тип документа с префиксом **mkr-...** и любым значением из списка выше. Таким образом, объявленный документ будет использовать компонент этого компоновщика для отображения данных архитектуры в выбранной разметке.

## Пример использования в архитектурном коде документа с типом mkr-select:

```yaml
entities:
  aspects:
    presentations:
      contexts:
        title: Документ с типом mkr-select
        type: mkr-select
        source: >
          (
            $aspect_id := $params.aspect;
            $MANIFEST := $;
            [$distinct(
              components.$spread().(
                $COMPONENT_ID := $keys()[0];
                *.[$aspect_id in aspects] ? 
                (
                  [$MANIFEST.contexts.$spread().(
                    $CONTEXT_ID := $keys()[0];
                    $TITLE := *.title;
                    *.components[$wcard($COMPONENT_ID, $)].{
                      "id": $CONTEXT_ID,
                      "title": $TITLE,
                      "src": "@entity/contexts/plantuml?dh-context-id=" & $CONTEXT_ID & "&dh-focus-id=" & $aspect_id
                    }
                )];
              ) : undefined
            ))];
          )
```

Пример рендеринга документа:

![Пример](@document/aspects.select?aspect=archtool.gitlab.auth)

## Пример использования в архитектурном коде документа с типом mkr-tabs:

```yaml
entities:
  aspects:
    presentations:
      contexts:
        title: Документ с типом mkr-tabs
        type: mkr-tabs
        source: >
          (
            [
              {
                "id": "archtool",
                "title": "Общая архитектура SEAF.ArchTool",
                "src": "@entity/contexts/plantuml?dh-context-id=archtool&dh-focus-id=archtool.gitlab.auth"
              },
              {
                "id": "archtool.uml_options",
                "title": "Демонстрация UML опций контекста",
                "src": "@entity/contexts/plantuml?dh-context-id=archtool.uml_options&dh-focus-id=archtool.gitlab.auth"
              },
              {
                "id": "archtool.custom",
                "title": "Компоненты эксперта R.Piontik",
                "src": "@entity/contexts/plantuml?dh-context-id=archtool.custom&dh-focus-id=archtool.gitlab.auth"
              },
              {
                "id": "archtool.front",
                "title": "Контейнерная архитектура SEAF.ArchTool",
                "src": "@entity/contexts/plantuml?dh-context-id=archtool.front&dh-focus-id=archtool.gitlab.auth"
              }
            ]
          )
```

Пример рендеринга документа:

![Пример](@document/aspects.tabs)

### Сохранение выбранной вкладки

После перезагрузки страницы, в том числе после сохранения редактируемой таблицы,
`mkr-tabs` восстанавливает выбранную вкладку. Если она больше недоступна,
выбирается вкладка с `selected: true`, а при её отсутствии — первая вкладка.

### Вид вкладок: поле kind

Вид вкладок задаётся необязательным полем `kind` в описании представления `mkr-tabs`:

| `kind` | Вид |
|--------|-----|
| нет или `tabs` | Вкладки первого уровня: названия в строку, выбранная подчёркнута, под строкой линия |
| `switcher` | Переключатель: кнопки на общей подложке, выбранная — на белом фоне |

Другое значение `kind` считается отсутствием поля. Ядро, которое поле `kind` не знает, выводит
вкладки как раньше.

```yaml
entities:
  systems:
    presentations:
      integrations:
        title: Интеграционные потоки
        type: mkr-tabs
        kind: switcher              # Варианты одного содержимого — переключатель
        source: >
          (
            [
              { "title": "Все", "src": "@entity/systems/flows_all?id=" & $params.id },
              { "title": "Входящие", "src": "@entity/systems/flows_in?id=" & $params.id },
              { "title": "Исходящие", "src": "@entity/systems/flows_out?id=" & $params.id }
            ]
          )
```

### Переключатель в заголовке виджета

Если переключатель — содержимое виджета сетки `mkr-grid` с заголовком, он стоит в строке заголовка
справа, перед панелью таблицы. Отдельной строки под заголовком нет: содержимое вкладки начинается сразу
под ним. Пока вкладки загружаются, в заголовке только название.

В остальных случаях — виджет без заголовка, переключатель вне виджета или внутри вкладок другого
`mkr-tabs` — переключатель стоит первой строкой содержимого.

Если в строке заголовка мало места, оно освобождается по порядку:

1. вкладки переключателя уходят в меню «Ещё»;
2. если рядом с названием не помещается даже выбранная вкладка с кнопкой «Ещё», переключатель
   переходит на вторую строку заголовка;
3. поле поиска панели таблицы сужается с 200 до 140px;
4. панель таблицы переходит на следующую строку заголовка.

### Вкладки, которые не помещаются

Правила одинаковы для вкладок и переключателя. Если вкладки не помещаются в строку,
в её конце стоит кнопка «Ещё N», где N — число вкладок в меню. В строке — первые по порядку вкладки,
сколько помещается вместе с кнопкой, и выбранная вкладка: она всегда в строке. Остальные вкладки —
в меню, в порядке описания. После выбора вкладки из меню состав строки и меню определяется заново.

## Пример использования в архитектурном коде документа с типом mkr-grid:

```yaml
entities:
  aspects:
    presentations:
      blank:
        title: Документ с типом mkr-grid
        type: mkr-grid
        source: >
          (
            {
              "type": "columns",
              "items": [
                {
                  "type": "rows",
                  "items": [
                    {
                      "type": "rows",
                      "width": "40%",
                      "items": [
                        {
                          "title": "Сводка по аспекту",
                          "icon": "settings",
                          "style": {
                            "margin": "4px",
                            "border": true
                          },
                          "src": "@entity/aspects/summary?aspect=archtool.git.client"
                        },
                        {
                          "title": "Встречается в компонентах",
                          "icon": "description",
                          "style": {
                            "border": true,
                            "padding": "0px",
                            "margin": "0px"
                          },
                          "src": "@entity/aspects/components?aspect=archtool.git.client"
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "columns",
                  "items": [
                    {
                      "title": "Иерархия аспекта",
                      "icon": "description",
                      "style": {
                        "border": true,
                        "margin": "4px"
                      },
                      "src": "@entity/aspects/hierarchy?aspect=archtool.git.client"
                    },
                    {
                      "type": "rows",
                      "width": "60%",
                      "items": [
                        {
                          "title": "Контексты",
                          "icon": "description",
                          "style": {
                            "border": true,
                            "min-height": "300px",
                            "margin": "4px"
                          },
                          "src": "@entity/aspects/contexts?aspect=archtool.git.client"
                        },
                        {
                          "title": "Иерархия аспекта",
                          "icon": "description",
                          "style": {
                            "border": true,
                            "min-height": "300px",
                            "margin": "4px"
                          },
                          "src": "@entity/aspects/hierarchy?aspect=archtool.git.client"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          )
```

Пример рендеринга документа:

![Пример](@document/aspects.grid)

### Виджеты сетки

Секция сетки с заголовком (`title`), иконкой (`icon`) или рамкой (`style.border`) выводится виджетом.
`border: true` рисует рамку; с рамкой и без нее виджет устроен одинаково. Заголовок и содержимое
виджета — текст markdown, первый столбец таблицы, поле выбора — стоят на отступе 20px от края.
Таблица в виджете своей рамки не рисует: строки идут от края до края виджета.

### Промежуток между секциями

Промежуток между соседними секциями `columns` и `rows` — не меньше 16px. `margin` соседних секций
входит в промежуток: сетка добавляет недостающее до 16px, а если сумма `margin` пары больше, промежуток
равен этой сумме. Промежуток считается для каждой пары соседей отдельно:

| `margin` секций | Промежутки |
|-----------------|------------|
| нет | 16px |
| `4px` и `4px` | 16px |
| `4px`, `4px` и `8px` | 16px и 16px |
| `12px` и `12px` | 24px |

В сумму входит `margin` вложенных секций, которые прилегают к соседу, кроме секций внутри рамки:
у секции с `border` край — сама рамка. Если `margin` пары задан не в пикселях (`1em`, `5%`, `auto`),
сетка к нему ничего не добавляет.

### Панель таблицы в заголовке виджета

Если содержимое виджета с заголовком — таблица, справа в заголовке виджета стоит ее панель: число
строк, поле поиска и кнопка Excel. Таблица может лежать в виджете сама, на открытой вкладке `mkr-tabs`
или в выбранном варианте `mkr-select`; при переключении вкладки панель показывает таблицу открытой
вкладки. Число строк — общее, поиск его не меняет. Поле поиска есть у таблиц больше 10 строк, кнопки
Excel нет у пустой таблицы.

Поле поиска в заголовке шириной до 200px. Если места мало, оно сужается до 140px, а затем панель
переходит на вторую строку заголовка. Если в заголовке стоит и переключатель вкладок, место сначала
освобождает он: вкладки уходят в меню «Ещё», затем переключатель переходит на вторую строку, и только
потом сужается поле поиска (см. [Переключатель в заголовке виджета](#переключатель-в-заголовке-виджета)).

В остальных случаях — таблица вне виджета, внутри markdown, в виджете без заголовка, несколько таблиц
в одном виджете — поле поиска и кнопка Excel стоят в строке над таблицей, без числа строк. У редактируемой
таблицы (`editable-table`) панели в заголовке виджета нет: ее действия остаются в ее собственной панели.
Подробнее о таблицах — в разделе [Таблица](/docs/archtool.tables).

## Пример использования в архитектурном коде документа с типом mkr-tree:

```yaml
entities:
  aspects:
    presentations:
      docs:
        title: Документ с типом mkr-tree
        type: mkr-tree
        source: >
          (
            [
              {
                "location": "SEAF.ArchTool/Развертывание",
                "title": "Развертывание",
                "link": "/docs/archtool.deployment"
              },
              {
                "location": "SEAF.ArchTool/Руководство",
                "title": "Руководство",
                "link": "/docs/archtool.manual"
              },
              {
                "location": "SEAF.ArchTool/Руководство/JSONata+",
                "title": "Расширения JSONata",
                "link": "/docs/archtool.jsonata"
              },
              {
                "location": "SEAF.ArchTool/Руководство/Адаптивная метамодель",
                "title": "Адаптивная метамодель",
                "link": "/docs/archtool.flex_metamodel"
              },
              {
                "location": "SEAF.ArchTool/Руководство/Адаптивная метамодель/Entity",
                "title": "Сущность",
                "link": "/docs/archtool.flex_metamodel.entities"
              },
              {
                "location": "SEAF.ArchTool/Руководство/Документы",
                "title": "Документы",
                "link": "/docs/archtool.docs"
              },
              {
                "location": "SEAF.ArchTool/Руководство/Документы/AsyncApi",
                "title": "Markdown",
                "link": "/docs/archtool.asyncapi"
              },
              {
                "location": "SEAF.ArchTool/Руководство/Документы/BPMN",
                "title": "BPMN диаграммы",
                "link": "/docs/archtool.bpmn"
              },
              {
                "location": "SEAF.ArchTool/Руководство/Документы/PlantUML",
                "title": "PlantUML",
                "link": "/docs/archtool.plantuml"
              },
              {
                "location": "SEAF.ArchTool/Руководство/Документы/SmartAnts",
                "title": "SmartAnts",
                "link": "/docs/archtool.smartants"
              },
              {
                "location": "SEAF.ArchTool/Руководство/Документы/Swagger",
                "title": "Swagger",
                "link": "/docs/archtool.swagger"
              },
              {
                "location": "SEAF.ArchTool/Руководство/Документы/Шаблоны",
                "title": "Шаблоны",
                "link": "/docs/archtool.templates"
              },
              {
                "location": "SEAF.ArchTool/Руководство/Импорт",
                "title": "Импорт манифестов",
                "link": "/docs/archtool.imports"
              },
              {
                "location": "SEAF.ArchTool/Руководство/Источники данных",
                "title": "Источники данных",
                "link": "/docs/archtool.datasets"
              },
              {
                "location": "SEAF.ArchTool/Руководство/Технологии",
                "title": "Технологии",
                "link": "/docs/archtool.technologies"
              },
              {
                "location": "SEAF.ArchTool/Руководство/Функции",
                "title": "Пользовательские функции",
                "link": "/docs/archtool.functions"
              }
            ]
          )
```

Пример рендеринга документа:

![Пример](@document/aspects.tree)
