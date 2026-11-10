# Документация SEAF

Практический справочник по изученным исходникам SEAF.ArchTool 2026.33.0 и переносимой доработке. Он описывает архитектурную кодовую базу, а не произвольный исходный код приложения: клонирования Git-репозитория недостаточно, если в нём нет архитектурного манифеста.

## Содержание

1. [Требования к папкам и Git-репозиториям](/entities/docs/blank?dh-doc-id=local.lsv.reverse.requirements).
2. [Объекты, зависимости и справочники](/entities/docs/blank?dh-doc-id=local.lsv.reverse.model).
3. [Схемы и C4 L2](/entities/docs/blank?dh-doc-id=local.lsv.reverse.diagrams).
4. [Документы и сценарии](/entities/docs/blank?dh-doc-id=local.lsv.reverse.documents).
5. [Проверки, ошибки и рабочий пример](/entities/docs/blank?dh-doc-id=local.lsv.reverse.validation).

**Обязательно в ядре** — поля и связи, заданные метамоделью. **Правило проекта** — дополнительные ограничения, например владелец микросервиса ShopFlow. **Переносимый профиль** — ограничения нашего редактора/MCP и offline runtime. Эти группы различаются: Git, Docker, каталоги `architecture` и `docs`, поле owner не являются универсальными требованиями ко всем моделям SEAF.

Начать проще с **Проекты → Hello → Открыть**. Проект содержит систему, Web App, API и БД, реальные связи и выпадающие поля владельца/статуса. ShopFlow показывает более сложные контексты, хранилища, события и оформление заказа.

## На чём основана документация

- `seaf-archtool-core/public/metamodel/dochub/entities/{components,contexts,documents,aspects}/base.yaml` — схемы полей и построение меню.
- `seaf-archtool-core/public/metamodel/dochub/rules/validators.yaml` — встроенные проверки.
- `seaf-core/entities/app/integrations/base.yaml` — дополнительная метамодель интеграций; её наличие не подразумевается в каждом проекте.
- `seaf-mcp/{engine,project-sources}.mjs`, `workbench/{editor-fields,drawio,domain}.mjs` — поведение подключений, редактора и истории нашей поставки.
- `vendor/seaf-archtool-core/src/backend/helpers/local-file-path.mjs` — локальные пути переносимого профиля; `examples/hello`, `examples/shopflow` — проверяемые примеры.

Это документированное поведение данной версии, а не гарантия совместимости со всеми плагинами и будущими версиями SEAF. Происхождение ядра и локальные изменения сохранены в `vendor/seaf-archtool-core/UPSTREAM.json`.
