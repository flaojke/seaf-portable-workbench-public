import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
const here=path.dirname(fileURLToPath(import.meta.url));
const task=path.join(here,'state','lsv-docs');await fs.mkdir(task,{recursive:true});
const client=new Client({name:'seaf-documentation',version:'1.0.0'});
const call=async(name,args)=>{const r=await client.callTool({name,arguments:args},undefined,{timeout:120000});if(r.isError)throw Error(r.content[0].text);return JSON.parse(r.content[0].text);};
try{
 await client.connect(new StdioClientTransport({command:process.execPath,args:[path.join(here,'server.mjs')],stderr:'inherit'}));
 const mode=process.argv[2]||'propose';
 if(mode==='propose'){
  await call('list_projects',{});
  const doc=await call('read_artifact',{project:'shopflow',path:'docs.yaml'});
  if(doc.content.includes('local.lsv.overview:'))throw Error('Documentation already registered');
  const readme=await fs.readFile(path.join(here,'README.md'),'utf8');
  const report=await fs.readFile(path.join(here,'../performance/REPORT.md'),'utf8');
  const overview=`# Доработки LSV

Документация локальных доработок SEAF.ArchTool 2026.33.0. Раздел описывает подключение внешнего агента через MCP и изменения производительности, установленные в этом портале.

## Документация

- [MCP: подключение агента и изменение архитектуры](/entities/docs/blank?dh-doc-id=local.lsv.mcp) — устройство сервиса, инструменты, подключение новых проектов, Git, проверки и восстановление после ошибок.
- [Оптимизация производительности](/entities/docs/blank?dh-doc-id=local.lsv.performance) — пять изменений ядра, методика сравнения, результаты, ограничения и откат.

## Что установлено

| Часть | Состояние |
|---|---|
| Портал | Локальный Docker-образ \`seaf-local:2026.33.0-performance\`, кэш \`memory\` |
| MCP | Сервер \`seaf\`, транспорт stdio, зарегистрирован в Codex |
| Проект с записью | \`shopflow\`, собственный локальный Git-репозиторий |
| Справочные источники | Шесть скачанных upstream-репозиториев, доступ через MCP только для чтения |
| Источник истины | YAML и документы архитектурного проекта в Git |

## Пример выполненного изменения

Через MCP в ShopFlow добавлен Delivery Service с владельцем Logistics, собственным хранилищем и связями с Order Service и Event Broker. Обновлены контексты, описание и Mermaid-сценарий. Изменение прошло 15 архитектурных проверок и проверку синтаксиса Mermaid; сохранено коммитом \`5247c77\`.

[Оформление заказа](/entities/docs/blank?dh-doc-id=demo.shop.checkout) · [Карточка Delivery Service](/entities/components/blank?dh-component-id=demo.shop.delivery) · [Проблемы модели](/problems)

Документация опубликована 4 ноября 2026 года. Результаты производительности относятся к отдельному прогону 2 ноября 2026 года.
`;
  const tools=`
## Справочник MCP-инструментов

| Инструмент | Назначение |
|---|---|
| \`list_projects\` | Проекты и доступные права чтения/записи |
| \`list_artifacts\` | Список текстовых файлов проекта |
| \`read_artifact\` | Содержимое файла, путь и SHA-256 |
| \`search_artifacts\` | Текстовый поиск с файлом и номером строки; до 100 совпадений |
| \`get_entity\` | Сущность по разделу и ID, исходный YAML |
| \`get_dependencies\` | Прямые входящие и исходящие связи компонента |
| \`query_model\` | JSONata-запрос к импортам проекта; отдельный worker, лимит 2 секунды |
| \`propose_entity\` | Предложение создания или полной замены одной сущности |
| \`propose_change\` | Предложение согласованного набора изменений файлов с diff |
| \`get_proposal\` | Сохранённое предложение, diff, результаты и статус |
| \`validate_change\` | Проверка черновика настоящим SEAF в изолированном контейнере |
| \`apply_change\` | Применение проверенного предложения, Git-коммит, reload |
| \`reload_project\` | Повторная загрузка уже сохранённой модели без нового коммита |

## Архитектура и границы интеграции

Пользователь обращается к внешнему агенту. Агент вызывает MCP-инструменты; сервер читает разрешённые локальные проекты и подготавливает изменения. Проверка выполняется отдельным экземпляром SEAF. После Git-коммита рабочий портал перечитывает модель.

Этот сервис не выбирает LLM и не выполняет самостоятельные платные вызовы модели. Модель и её учётная запись принадлежат MCP-клиенту. Встроенный GigaChat SEAF и локальный MCP-сервис — разные точки подключения к архитектуре.

SmartAnts строится из YAML. Отдельные Mermaid/PlantUML-документы агент должен обновлять согласованно с моделью. Проверки модели не заменяют проверку синтаксиса таких диаграмм: для изменения Delivery Service дополнительно запускался Mermaid parser.

## Где находится реализация

Все пути ниже относятся к этому компьютеру:

- \`./seaf-mcp/server.mjs\` — stdio и MCP-tools.
- \`./seaf-mcp/engine.mjs\` — файлы, diff, Git, проверка и reload.
- \`./seaf-mcp/query-worker.mjs\` — ограниченное выполнение JSONata.
- \`./seaf-mcp/projects.json\` — реестр проектов.
- \`./seaf-mcp/mcp.config.json\` — пример настройки клиента.
- \`./seaf-mcp/test/bridge.test.mjs\` — проверки протокола и полного цикла записи.
- \`./seaf-mcp/state/<proposal-id>/proposal.json\` — журнал конкретного изменения.

[Раздел доработок](/entities/docs/blank?dh-doc-id=local.lsv.overview) · [Оптимизация производительности](/entities/docs/blank?dh-doc-id=local.lsv.performance)
`;
  let mcp=readme.replace(/^# SEAF MCP\s*/, '# MCP: подключение внешнего агента к SEAF\n\n');
  mcp=mcp.replace('`.git/seaf-mcp.lock`.','`seaf-mcp.lock` в Git-каталоге проекта (для обычного репозитория — `.git/seaf-mcp.lock`).');
  mcp+=tools;
  let perf=report.replace(/^# SEAF: изменения и сравнение производительности\s*/, '# Оптимизация производительности SEAF\n\n');
  perf=perf.replace('коммиты и публикация не выполнялись.','публикация изменений ядра в upstream не выполнялась. Git-коммиты архитектурной модели ShopFlow учитываются отдельно.');
  perf=perf.replace('## Что внедрено','> Исторический прогон: замеры выполнены 2 ноября 2026 года на исходной ShopFlow до добавления Delivery Service. Числа ниже не являются повторным замером текущей семисервисной модели.\n\n## Что внедрено');
  perf+=`
## Изменённые участки ядра

Пути относительно \`./repositories/seaf-archtool-core\`:

| Изменение | Код |
|---|---|
| LRU и объединение одинаковых запросов | \`src/global/helpers/bounded-cache.mjs\`, \`src/backend/storage/cache.mjs\` |
| Кэш снимков SmartAnts | \`src/frontend/helpers/smartantsCompute.ts\`, \`src/frontend/components/Schema/DHSchema/DHSchema.vue\` |
| Повторное использование AJV | \`src/global/jsonata/driver.mjs\` |
| Асинхронный файловый кэш | \`src/backend/storage/cache.mjs\` |
| Ограничение загрузок и исключение повторных рёбер | \`src/global/manifest/parser3/index.mjs\` |

Самое заметное ускорение получено на повторной компиляции и вычислениях. Обычное получение меню и полная перезагрузка маленького проекта не показали универсального ускорения. Ограничение импортов и асинхронный I/O уменьшают давление на ресурсы и блокировки, но могут увеличивать время отдельной операции.

[Раздел доработок](/entities/docs/blank?dh-doc-id=local.lsv.overview) · [Документация MCP](/entities/docs/blank?dh-doc-id=local.lsv.mcp)
`;
  const additions=`
  local.lsv.overview:
    title: Доработки LSV
    location: Доработки LSV/00. Обзор
    type: markdown
    toc: true
    source: docs/lsv/overview.md
  local.lsv.mcp:
    title: MCP — подключение внешнего агента
    location: Доработки LSV/01. MCP
    type: markdown
    toc: true
    source: docs/lsv/mcp.md
  local.lsv.performance:
    title: Оптимизация производительности SEAF
    location: Доработки LSV/02. Производительность
    type: markdown
    toc: true
    source: docs/lsv/performance.md
`;
  const changes=[{path:'docs.yaml',content:doc.content+additions},{path:'docs/lsv/overview.md',content:overview},{path:'docs/lsv/mcp.md',content:mcp},{path:'docs/lsv/performance.md',content:perf}];
  const p=await call('propose_change',{project:'shopflow',message:'Document LSV customizations: MCP integration and performance improvements',changes});
  await fs.writeFile(path.join(task,'proposal.json'),JSON.stringify(p,null,2));await fs.writeFile(path.join(task,'docs.diff'),p.diff);
  console.log(JSON.stringify({proposal:p.proposalId,files:changes.map(c=>c.path),diff:path.join(task,'docs.diff')}));
 }else{
  const p=JSON.parse(await fs.readFile(path.join(task,'proposal.json'),'utf8'));
  const result=await call(mode==='validate'?'validate_change':'apply_change',{proposal_id:p.proposalId});
  await fs.writeFile(path.join(task,mode+'.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }
}finally{await client.close();}
