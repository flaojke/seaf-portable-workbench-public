# Глобальный поиск

Таблица с колонками `text`, `select`, `multiple-select` и `link`, в которой включены поиск (`global_search: true`) и выбор строк (`selection: true`).

Описание таблицы:

```yaml
  archtool.plugins.editable-table.search.global_search.table:
    type: editable-table
    global_search: true       # Включаем поле глобального поиска
    selection: true           # Чекбоксы выбора строк ("Выбрать все" работает по найденным строкам)
    excel_export_filter: true # Выгрузка в Excel учитывает фильтры, поиск и сортировку
    page_size: 5

    origin:
      body: >
        ($."archtool.plugins.editable-table.search.global_search.data")

    headers:
      - value: name
        text: Название
        width: 220px

      - value: status
        text: Статус
        type: select
        width: 140px
        options:
          - value: opt_1
            text: Активен
          - value: opt_2
            text: Выведен
          - value: opt_3
            text: В разработке

      - value: tags
        text: Метки
        type: multiple-select
        width: 220px
        options:
          - value: payments
            text: Платежи
          - value: reporting
            text: Отчётность
          - value: core
            text: Ядро

      - value: links
        text: Ссылки
        type: link
        width: 160px

    source: >
      ({ "body": body })
```

Данные таблицы:

```yaml
archtool.plugins.editable-table.search.global_search.data:
  row_1:
    name: Сервис платежей
    status: opt_1
    tags:
      - payments
      - core
    links:
      - href: https://ru.wikipedia.org/
        text: Wiki
  row_2:
    name: Каталог продуктов
    status: opt_1
    tags:
      - reporting
    links:
      - href: /
        text: Главная
  row_3:
    name: Биллинг
    status: opt_2
    tags:
      - payments
    links:
  row_4:
    name: Портал отчётности
    status: opt_3
    tags:
      - reporting
      - core
    links:
      - https://www.google.ru/
  row_5:
    name: Шина интеграции
    status: opt_1
    tags:
      - core
    links:
  row_6:
    name: Архив документов
    status: opt_2
    tags:
    links:
      - href: https://ya.ru/
        text: Яндекс
  row_7:
    name: Платёжный шлюз
    status: opt_3
    tags:
      - payments
    links:
  row_8:
    name: Справочник клиентов
    status:
    tags:
      - core
      - reporting
    links:
```

Результат:

![](@document/archtool.plugins.editable-table.search.global_search.table)

Что стоит проверить:

- запрос `актив` находит строки со статусом «Активен», а запрос `opt_1` (идентификатор варианта) — нет;
- запрос `отчёт` находит строки с меткой «Отчётность» в колонке `multiple-select`;
- запрос `яндекс` находит строку по тексту ссылки, а `google` — по адресу ссылки без текста;
- после фильтра по колонке «Статус» и запроса видны только строки, прошедшие оба условия; чекбокс «Выбрать все» выделяет только их;
- кнопка «Сбросить» сбрасывает и фильтры, и запрос.
