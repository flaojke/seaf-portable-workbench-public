# Происхождение SEAF-Portable

**Проект является форком SEAF.ArchTool**, а не официальным релизом SEAF.

Оригинал: [seafteam/seaf-archtool-core на GitVerse](https://gitverse.ru/seafteam/seaf-archtool-core). Git URL: `https://gitverse.ru/seafteam/seaf-archtool-core.git`.

В корневом Git ведётся собственная история доработок. Ядро импортировано как отслеживаемое дерево `vendor/seaf-archtool-core`, без вложенной .git, node_modules, сборок и секретов. Это позволяет собрать проект после clone без неопубликованных локальных submodules. Машиночитаемое происхождение — `vendor/seaf-archtool-core/UPSTREAM.json`.

| Основа | Зафиксированное значение |
|---|---|
| Версия ядра | 2026.33.0 |
| Исходный upstream commit | `c928383e599565533ecd76f90765691bc5a73704` |
| Импортированный локальный snapshot | `3f77aaacee390d36ea517a910418e0a6c7a6f500` |
| Предшествующие локальные доработки | `9669b513205bc003534da32b13d47517d9b0c150`, `ccc4a0119514bcc4a73d7d860abfb3739fd543ac`, `3f77aaacee390d36ea517a910418e0a6c7a6f500` |
| Лицензия ядра | Apache-2.0, исходные LICENSE и NOTICE сохранены |

Дальнейшие изменения vendor видны в истории этого репозитория: нативные Windows-пути и imports, loopback/runtime-конфигурация, системные пункты меню и интеграция Workbench. Собственные MCP, история папок, portable build/runtime, примеры и OpenSpec находятся рядом с vendor. Они не объявляются частью официального upstream.

В поставке 2.2.0 поверх импортированного snapshot добавлены поиск Ctrl+K в локальном портале, прямые переходы в рабочее пространство, конструктор и сценарии, а также поддержка подтверждений в локальном iframe. Эти изменения относятся к форку и не меняют указанный upstream commit. Нативный launcher отдельно передаёт версию ядра при прямом запуске Node.js.

В публичном snapshot телеметрия заменена отключённой заглушкой: сторонний SDK удалён. Интерфейс внешнего импорта и dev-прокси возвращают сообщение о недоступности. Исходные авторские уведомления и лицензии сохранены. Документация и локальный Workbench используют обозначение LSV.

## Другие первоисточники

- [SEAFTeam/seaf-core на GitHub](https://github.com/SEAFTeam/seaf-core) — отдельная метамодель SEAF, помеченная авторами inactive. Не выдаётся за зеркало ArchTool core.
- [DocHubTeam/DocHub](https://github.com/DocHubTeam/DocHub) — текущий GitHub-репозиторий DocHub. Исторический [RabotaRu/DocHub](https://github.com/RabotaRu/DocHub) содержит уведомление о переносе. SEAF.ArchTool основан на DocHub; атрибуция https://dochub.info сохранена.

Новые версии upstream следует переносить отдельным проверяемым изменением, обновляя provenance, lockfiles, спецификации и доказательства. ZIP runtime не заменяет исходный код и сведения о происхождении.
