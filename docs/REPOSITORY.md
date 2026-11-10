# Подготовка к публикации на GitHub и GitVerse

## Идентичность

- Название: **SEAF-Portable**.
- Аккаунт на обеих площадках: **flaojke**.
- Проект явно обозначается как **форк SEAF.ArchTool**. Оригинал — [seafteam/seaf-archtool-core](https://gitverse.ru/seafteam/seaf-archtool-core), Git URL — `https://gitverse.ru/seafteam/seaf-archtool-core.git`.
- Текущее ядро: 2026.33.0, собственные MCP/Workbench — 2.2.0. История происхождения — [UPSTREAM.md](../UPSTREAM.md).

Для выпуска 2.2.0 разрешена отправка **только SEAF** в **закрытый GitHub-репозиторий** `flaojke/seaf-portable-workbench`. Публикация GitVerse, корпоративных данных и других проектов не входит в разрешённый объём. Номер пакета и наличие целевых URL не подтверждают окончательную приёмку или отправку: они фиксируются по [критериям выпуска](release-2026-11-10.md).

## Описание для GitHub

**About / Description:**

> Форк SEAF.ArchTool: переносимый Windows-комплект, редактор и конструктор архитектурных схем, локальные и Git-проекты, история, MCP и автономные схемы/draw.io. Оригинал: https://gitverse.ru/seafteam/seaf-archtool-core

**English description:**

> SEAF.ArchTool fork: portable Windows workspace with architecture editing and diagram composition, Git and local projects, revision history, MCP and offline diagrams/draw.io. Upstream: https://gitverse.ru/seafteam/seaf-archtool-core

Адрес форка после создания: `https://github.com/flaojke/seaf-portable-workbench`.

## Описание для GitVerse

**Описание:**

> Форк SEAF.ArchTool для Windows 10/11 x64. Переносимый запуск без Docker и установки Node.js; управление папками и Git-проектами, редактор, diff и проверки, локальная история, MCP, PlantUML и draw.io offline. Оригинал: https://gitverse.ru/seafteam/seaf-archtool-core

Адрес форка после создания: `https://gitverse.ru/flaojke/seaf-portable-workbench`.

Теги для обеих площадок: `seaf`, `architecture-as-code`, `windows`, `portable`, `nodejs`, `mcp`, `gitlab`, `drawio`, `plantuml`, `openspec`.

## Ссылки на оригинальные проекты

Runtime upstream SEAF.ArchTool размещён на [GitVerse](https://gitverse.ru/seafteam/seaf-archtool-core). На GitHub проверены [SEAFTeam/seaf-core](https://github.com/SEAFTeam/seaf-core) — отдельная inactive-метамодель — и [DocHubTeam/DocHub](https://github.com/DocHubTeam/DocHub), исходная основа SEAF. Их роли разделены в README; неподтверждённый GitHub-адрес `SEAFTeam/seaf-archtool-core` не используется как зеркало оригинала.

## Состав публикации

В Git входят исходники, vendor ядра с атрибуцией, примеры, спецификации, lockfiles, сборщик и инструкции. Большие runtime-бинарники, ZIP, node_modules, локальные data/кеши/логи, реальные projects.json и mcp.config.json исключены. Готовый ZIP — отдельный релизный артефакт, а не содержимое source Git. Текущие отчёты source-аудита находятся в приёмке OpenSpec; старые архивные доказательства остаются историей проверки, а не рабочими настройками.

Финальный source ZIP создаётся из `HEAD` с канонической Git line-ending policy, per-file `SOURCE-MANIFEST.json`, SHA-256 и SRI. `docs/source-manifest.mjs verify-zip` проверяет все bytes архива. Сам локальный source Git сохраняет отдельную историю форка; `.git` не включается в source ZIP.

## Команды текущего выпуска после создания закрытого GitHub-репозитория

Ниже — команды только для разрешённой публикации текущего выпуска. Подготовка файлов их не выполняет. Сначала проверьте аккаунт `flaojke` и видимость `private` точного репозитория, затем работайте из проверенного отдельного source Git. Никакие команды GitVerse в текущем выпуске не выполняются:

```powershell
git remote add github https://github.com/flaojke/seaf-portable-workbench.git
git push github HEAD:main
```

Если remote с таким именем уже существует, сначала изучите `git remote -v`; не заменяйте чужой адрес и не используйте force push. Команды требуют собственной авторизации. Ссылки форка в README обозначают целевые адреса; успешное создание и публикация подтверждаются отдельно.
