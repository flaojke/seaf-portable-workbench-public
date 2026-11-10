# Таблицы (Table)

Документ предназначен для отображеия данных в табличной форме.

## Предопределенный набор данных
```yaml
docs:
  archtool.table.preset: 
    type: table               # Тип документа 
    headers:                  # Заголовки таблицы
      - value: id             # Идентификатор поля для вывода в колонке
        text: Идентификатор   # Заголовок колокнки
        sortable: true        # Производить сортировку по колонке
        align: left           # Форматирование по горизонтали
        width: 20%            # Ширина колонки 
      - value: payload
        text: Значение
        sortable: true
        align: left
    source:                   # Данные для таблицы (массив)
      - id: 1                 # Поде "id" 
        payload: Значение 1   # Значение поля "id"
      - id: 2
        payload: Значение 2
```

Результат:
![Предопределенная таблица](@document/archtool.table.preset)

## Статус в виде чипа

Значение колонки можно вывести цветным чипом, например статус объекта. Для этого у колонки
указывается `format: status`. Оттенок чипа задается картой `statuses`: значение колонки -> оттенок.
Допустимые оттенки:

| Оттенок | Назначение |
|---------|------------|
| `ok` | используется, в норме |
| `wip` | в работе, создается |
| `off` | выводится, неактивен |
| `bad` | проблема, не поддерживается |

Значение, которого нет в `statuses`, и колонка без `statuses` выводятся нейтральным чипом.
Неизвестный оттенок в `statuses` тоже дает нейтральный чип.

```yaml
docs:
  archtool.table.status:
    type: table
    headers:
      - value: title
        text: Система
        align: left
      - value: status
        text: Статус
        align: left
        format: status          # Выводить значение чипом статуса
        statuses:               # Значение -> оттенок чипа: ok, wip, off, bad
          Используется: ok
          Создается: wip
          Выводится: off
          Не поддерживается: bad
    source:
      - title: CRM
        status: Используется
      - title: Мобильное приложение
        status: Создается
      - title: Старый портал
        status: Выводится
      - title: Учетная система
        status: Не поддерживается
      - title: Аналитика
        status: Планируется     # Нет в statuses — нейтральный чип
```

Результат:
![Таблица со статусами](@document/archtool.table.status)

## Строк на странице

По умолчанию таблица показывает 10 строк на странице. Другое значение задается полем `per-page`:

```yaml
docs:
  my.table:
    type: table
    per-page: 20              # Строк на странице
    headers:
      ...
```

В списке «Записей на странице» доступны 10, 20, 50, значение `per-page` и «Все».
`per-page: -1` выводит все строки сразу. Если все строки помещаются на одну страницу,
подвал с пагинацией не показывается. При печати таблица выводится целиком.

## Ширина столбцов

Ширину столбцов таблица подбирает по содержимому:

- столбец, в значениях которого каждая строка не длиннее 20 символов (коды, статусы, технологии),
  не переносится; переводы строк в значениях сохраняются. Столбец с `format: status` тоже не переносится;
- остальные столбцы — не уже 160px, длинный текст в них переносится.

Ширина, заданная в профиле, важнее этих правил. Ширину столбца задают поля `width`, `minWidth`
и `maxWidth` — числом пикселей или CSS-значением:

```yaml
docs:
  my.table:
    type: table
    headers:
      - value: code
        text: Код
        width: 80               # Ширина столбца
      - value: title
        text: Наименование
        minWidth: 240           # Минимальная ширина столбца
```

Ключи через дефис (`min-width`, `max-width`) не применяются: столбец с ними раскладывается по содержимому.

Если столбцы не помещаются по ширине, таблица прокручивается по горизонтали, а у края со скрытыми
столбцами видна тень.

## Поиск, выгрузка и пустая таблица

У таблицы больше 10 строк есть поле поиска. Кнопка Excel выгружает все строки таблицы; у пустой
таблицы и в печатной версии ее нет. Поле поиска и кнопка Excel стоят в строке над таблицей.
Если таблица — содержимое виджета с заголовком в сетке [markaper](/docs/archtool.markaper),
они вместе с числом строк выводятся в заголовке виджета.

Пустая таблица выводится одной строкой «Нет данных», без шапки столбцов и постраничного вывода.

## Запрос к данным архитектуры

Есть возможность выполнять запросы к данным архитектуры. Например, получить список всех интеграций:

```yaml
docs:
  archtool.table.select: 
    type: table
    headers:
      - value: from
        text: Система 1
        sortable: true
        align: left
        width: 20%
        link: link-from       # Идентификатор поля, в котором хранится ссылка
      - value: to
        text: Система 2
        sortable: true
        align: left
        width: 20%
        link: link-to
      - value: direction
        text: Связь
        sortable: true
        align: center
        width: 5%
      - value: title
        text: Описание
        sortable: true
        align: left
      - value: contract
        text: Контракт
        sortable: true
        align: left
        link: link-contract
    source: >                # JSONata запрос к архитектуре
      (
        $MANIFEST := $;
        $distinct([components.$spread().(
            $COMPONENT := $;
            $COMPONENT_ID := $keys()[0];
            $.*.links.{
                "from": $COMPONENT.*.title,
                "link-from": "/architect/components/" & $COMPONENT_ID,
                "to": id ? $lookup($MANIFEST.components, id).title : id,
                "link-to": "/architect/components/" & id,
                "contract": contract ? $lookup($MANIFEST.docs, contract).location : contract,
                "link-contract": "/docs/" & contract,
                "title": title,
                "direction": direction
            };
        )])^(from)
      )
```

Результат:
![Запрос к данным архитектуры](@document/archtool.table.select)

## Хранение запросов в отдельном файле

Располагать запрос непосредственно в манифесте не всегде хорошее решение. Манифест целиком загружается в память. 
Тыжелый запрос создаст излишнюю нагрузку на ОЗУ. Старайтесь тяжелые запросы выделять в отдельные файлы. В этом случае
запрос будет загружаться только при необходимости.

```yaml
docs:
  archtool.table.ex_jsonata:
    type: table               
    headers:                  
      - value: id             
        text: Идентификатор   
        sortable: true        
        align: left           
        width: 20%            
        link: link
      - value: title
        text: Наименование
        sortable: true
        align: left
        link: link
    source: contexts.jsonata   # Файл с запросом JSONata
```

Содержимое файла "contexts.jsonata":

```jsonata
  /* Отбираем все контексты */
  [contexts.$spread().(
      {
          "id": $keys()[0],
          "title": *.title,
          "link": "/architect/contexts/" & $keys()[0]
      }
  )]^(title)
```

Результат:

![Предопределенная таблица](@document/archtool.table.ex_jsonata)

## Хранение данных в отдельном файле

Вы также можете размещать тяжелые данные в отдельном файле YAML или JSON.

```yaml
docs:
  archtool.table.ex_yaml:
    type: table               
    headers:                  
      - value: name             
        text: ФИО автора
        sortable: true        
        align: left           
        width: 100%            
    source: autors.yaml        # Файл с данными
```

Содержимое файла "autors.yaml"

```yaml
- name: Иванов Иван Иванович
- name: Петров Петр Сергеевич
- name: Сидоров Евгений Вальдемарович
```

Результат:

![Предопределенная таблица](@document/archtool.table.ex_yaml)


## Внешние данные

В некоторых случаях полезно иметь возможность получать внешние данные и сопоставлять их с данными архитектуры.
Вы можете сделать это указав в качестве источника данных URI.

```yaml
docs:
  archtool.table.ex_http:
    type: table               
    headers:                  
      - value: title
        text: Name
        sortable: true        
        align: left           
    origin: https://labs.ft.com/tech-radar/demo.json   # Внешний ресурс
    source: showcases.jsonata     # Обработа данных внешнего ресурса
```

Содержимое файла "showcases.jsonata"

```jsonata
[
    $.{
        "title": name
    }
]^(title)
```

Результат:

![Предопределенная таблица](@document/archtool.table.ex_http)


## Генерация таблицы на основании источника данных

Табличные документы могут ссылаться на [источники данных](/docs/archtool.datasets).

```yaml
docs:
  archtool.table.dataset: 
    type: table
    headers:
      - value: location
        text: Документ
        sortable: true
        align: left
        width: 100%
        link: link
    source: archtool.docs         # Идентификтор источника данных
datasets:                       # Источники данных
  archtool.docs:                  # Возвращает список всех документов
    source: >                   # JSONata запрос к архитектуре
      (
        [docs.$spread().{
          "location": *.location,
          "link": "/docs/" & $keys()[0]
        }[location]^(location)]
      )
```

Результат:
![Предопределенная таблица](@document/archtool.table.dataset)

Источники позволяют многократно переиспользовать себя. Это дает возможность не дублировать запросы в разных документах.

## Обработка данных

Перед визуализацией таблицы есть возможность подвергнуть данные обработке.
Для примера, возьмем за основу источник данных "archtool.docs". Его необходимо указать
в поле "origin". В поле "source" нужно определить JSONata запрос. В примере отбираются документы 
располагающиеся в меню "SEAF.ArchTool/Руководство/Документы/".

```yaml
docs:
  archtool.table.dataset.post:    # Табличный с портобработкой данных источника
    type: table
    headers:
      - value: location
        text: Документ
        sortable: true
        align: left
        width: 100%
        link: link
    origin: archtool.docs         # Оригинальный источник данных
    source: >                   # Отбирает документы концепции
      (
        $[$substring(location, 0, 29) = "SEAF.ArchTool/Руководство/Документы/"].{
          "title": $substring(location, 29),
          "link": link
        }
      )
datasets:                       # Источники данных
  archtool.docs:                  # Возвращает список всех документов
    source: >                   # JSONata запрос к архитектуре
      (
        [docs.$spread().{
          "location": *.location,
          "link": "/docs/" & $keys()[0]
        }[location]^(location)]
      )
```


Результат:
![Предопределенная таблица](@document/archtool.table.dataset.post)
