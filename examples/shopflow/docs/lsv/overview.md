# Доработки LSV

Документация локальных доработок SEAF.ArchTool 2026.33.0. Раздел описывает подключение внешнего агента через MCP и изменения производительности, установленные в этом портале.

## Документация

- [MCP: подключение агента и изменение архитектуры](/entities/docs/blank?dh-doc-id=local.lsv.mcp) — устройство сервиса, инструменты, подключение новых проектов, Git, проверки и восстановление после ошибок.
- [Оптимизация производительности](/entities/docs/blank?dh-doc-id=local.lsv.performance) — пять изменений ядра, методика сравнения, результаты, ограничения и откат.

## Что установлено

| Часть | Состояние |
|---|---|
| Портал | Локальный Docker-образ `seaf-local:2026.33.0-performance`, кэш `memory` |
| MCP | Сервер `seaf`, транспорт stdio, зарегистрирован в Codex |
| Проект с записью | `shopflow`, собственный локальный Git-репозиторий |
| Справочные источники | Шесть скачанных upstream-репозиториев, доступ через MCP только для чтения |
| Источник истины | YAML и документы архитектурного проекта в Git |

## Пример выполненного изменения

Через MCP в ShopFlow добавлен Delivery Service с владельцем Logistics, собственным хранилищем и связями с Order Service и Event Broker. Обновлены контексты, описание и Mermaid-сценарий. Изменение прошло 15 архитектурных проверок и проверку синтаксиса Mermaid; сохранено коммитом `5247c77`.

[Оформление заказа](/entities/docs/blank?dh-doc-id=demo.shop.checkout) · [Карточка Delivery Service](/entities/components/blank?dh-component-id=demo.shop.delivery) · [Проблемы модели](/problems)

Документация опубликована 4 ноября 2026 года. Результаты производительности относятся к отдельному прогону 2 ноября 2026 года.


## Рабочее пространство и новые функции

[Открыть рабочее пространство](/entities/docs/blank?dh-doc-id=local.lsv.workbench). Здесь доступны редактор объектов и черновики, снимки, preview веток, сравнение архитектуры, фокус графа, данные и доверие, ассистент с источниками и локальный draw.io.

- [Автономные черновики](/entities/docs/blank?dh-doc-id=local.lsv.drafts)
- [Мастер подключения и диагностики](/entities/docs/blank?dh-doc-id=local.lsv.diagnostics)
- [Точечные и пакетные изменения](/entities/docs/blank?dh-doc-id=local.lsv.objects)
- [Снимки архитектуры](/entities/docs/blank?dh-doc-id=local.lsv.snapshots)
- [Фокус на подграфе](/entities/docs/blank?dh-doc-id=local.lsv.subgraph)
- [Потоки данных и зоны доверия](/entities/docs/blank?dh-doc-id=local.lsv.trust)
- [Семантический diff архитектуры](/entities/docs/blank?dh-doc-id=local.lsv.semanticdiff)
- [Preview портала для ветки и черновика](/entities/docs/blank?dh-doc-id=local.lsv.preview)
- [Ответы с проверяемыми источниками](/entities/docs/blank?dh-doc-id=local.lsv.grounded)
- [Поиск противоречий между источниками](/entities/docs/blank?dh-doc-id=local.lsv.contradictions)
- [Draw.io: импорт, экспорт и редактор](/entities/docs/blank?dh-doc-id=local.lsv.drawio)
- [SDD и OpenSpec: порядок доработок](/entities/docs/blank?dh-doc-id=local.lsv.sdd)

В каждом разделе приведены шаги и пример ShopFlow. Учебная схема доставки: `diagrams/shopflow-delivery.drawio` — откройте её в разделе draw.io рабочего пространства. Аннотации зон и TLS в модели — учебные архитектурные декларации, не настройки работающих микросервисов.
