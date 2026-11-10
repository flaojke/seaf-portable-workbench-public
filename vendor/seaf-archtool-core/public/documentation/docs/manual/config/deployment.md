# Развертывание

SEAF.ArchTool поддерживает следующие режимы развертывания:

1. **Plugin** - Плагин IDE (Idea / VSCode). Вся бизнес-логика располагается в плагине;
2. **Server Less** - Портал. Вся бизнес-логика располагается на клиенте.
3. **Client-Server** - Портал. Основная бизнес-логика располагается на сервере.
4. **Cluster** - Ноды в режиме **Client-Server** функционируют в кластере.

Режимы имеют свои преимущества и недостатки. Необходимо их рассмотреть детально:

## Plugin

Самый простой режим. 

Скачайте плагин из [репозитория](https://gitverse.ru/seafteam/seaf-archtool-core/releases) и установите. 
Следуйте подсказкам плагина.

Вам также поможет статья ["Архитектура рядом с кодом"](https://habr.com/ru/post/659595/).

### Переменные среды

* **DOCHUB_IDE_GITLAB_URL** - Адрес Gitlab сервера для интеграции с ним (например, https://gitlab.com/);
* **DOCHUB_IDE_GITLAB_MODE** - Режим работы с Gitlab (api или adapter)
* **DOCHUB_IDE_GITLAB_ADAPTER_URL** - Адрес adapter (seaf-gas) сервера для интеграции с ним (например, http://localhost:8082/);
* **DOCHUB_IDE_BITBUCKET_URL** - Адрес Bitbucket сервера для интеграции с ним (например, https://bitbucket.org/);
* **DOCHUB_IDE_PERSONAL_TOKEN** - Персональный токен, необходимый для доступа к системе управления версиями. Выпускается самой системой (Gitlab/Bitbucket).

Переменные среды могут быть переопределены через пользовательский интерфейс в настройках плагина.

### Преимущества
1. Развертывание буквально за 2 минуты;
2. Встраивание в инструмент производства (IDE);
3. Интерактивное отображение воздействия на код архитектуры;
4. Разметка кода проекта на объекты архитектурного учета и интерактивное взаимодействие с разметкой;
5. Полноценная функциональность.

### Недостатки
1. Монопольный режим, актуальный для развития (внесения изменений) в код архитектуры.

### Рекомендации

Прекрасно подходит для изучения инструмента. 

Остается востребованным на всех этапах внедрения SEAF.ArchTool в организации, т.к. позволяет внедрить подход
"Архитектура как код" в ключевой этап производства - разработку кодовой базы приложений, сервисов 
и инфраструктуры. 


## Server Less

[Проект](https://gitverse.ru/seafteam/seaf-archtool-core) собирается как обычный статический сайт командой:

```
  npm run build
```

В папку ./dist генерируется комплект файлов, который является SEAF.ArchTool WEB-приложением. 
Подробнее о сборке и развертывании смотри [здесь](https://gitverse.ru/seafteam/seaf-bok). 

Файлы содержащие код архитектуры загружаются по доступным приложению URL при его исполнении в браузере.

Проще говоря, если вы развернули сайт на archtool.local, необходимо указать в переменной
окружения корневой манифест, например:

```
VUE_APP_DOCHUB_ROOT_MANIFEST=workspace/service/root.yaml
```

в этом случае, сразу после загрузки приложения в браузере, SEAF.ArchTool попытается загрузить файл
archtool.local/workspace/service/root.yaml и "выполнить" его. В корневом манифесте могут 
содержаться указания по подключению зависимостей. Например:

```yaml
imports:
  - docs/root.yaml
  - rules/root.yaml
  - plugins/root.yaml
...
```

Эти файлы также будут загружены.

Базовым URL для них будет URL файла "workspace/service/root.yaml". 
Например, для "docs/root.yaml" прямой URL будет - archtool.local/workspace/service/docs/root.yaml

Подключаемые файлы также могут содержать команды подключения других файлов. В таком случае цикл повторяется.

Таким образом **на клиенте** собирается полная кодовая база архитектуры. 

Вся бизнес-логика выполняется на клиенте.

### Преимущества
1. Минимальное количество серверных ресурсов;
2. Минимальное время на разворачивание и конфигурирование (почти все параметры можно оставить по умолчанию);
3. При интеграции с GitLab позволяет разделять доступы пользователей на уровне репозиториев.

### Недостатки
1. При росте кодовой базы возникает заметная деградация производительности клиентского приложения;
2. Не позволяет разделять доступ пользователей на уровне объектов архитектурного учета;
3. Не предлагает специального интерфейса интеграции (API), что затрудняет переиспользование архитектурных объектов 
   для производственных нужд. 

### Рекомендации

Данный режим оптимален для изучения инструмента и опытной эксплуатации. С ростом кодовой базы и потребностей,
рекомендуется мигрировать в режим "Client-Server".


## Client-Server

В этом режиме основная бизнес-логика SEAF.ArchTool исполняется на сервере. К ней относится (но не ограничивается):

1. Загрузка и сборка кодовой базы архитектуры;
2. Выполнение JSONata запросов к данным архитектуры;
3. Кэширование результатов выполнения JSONata запросов;
4. Контроль доступа к архитектурным артефактам (файлы различного назначения) (в разработке);
5. Разграничение прав доступа к объектам архитектурного учета (в разработке).

Отдельно необходимо отметить, что сервер SEAF.ArchTool предоставляет API:

1. **/core/storage/jsonata** - Доступ к кодовой базе (архитектурному Data Lake) через JSONata запросы (POST, тело запроса — JSON);
2. **/core/storage/validators/** - Доступ к результату работы [валидаторов](/docs/archtool.rules.validators);
2. **/entities/:entity/presentations/:presentation*** - Доступ к презентациям 
   [сущностей](/docs/archtool.entities) специального типа "upload".

Простейшей сборкой SEAF.ArchTool в режиме Client-Server является команда:

```
  npm run backend
```

При ее выполнении будет собран frontend и запущен backend процесс nodejs в соответствии с конфигурацией среды (см.
[example.env](https://gitverse.ru/seafteam/seaf-archtool-core/content/master/example.env)).

### Кэширование через PostgreSQL

По умолчанию кэш backend отключён (`VUE_APP_DOCHUB_DATALAKE_CACHE=none`). Также поддерживаются
режимы `memory` и хранение в локальной папке (путь к каталогу). Для ускорения работы backend можно
включить персистентное кэширование результатов вычислений в СУБД
[PostgreSQL](https://www.postgresql.org/):

```
VUE_APP_DOCHUB_DATALAKE_CACHE=postgres
# Формат URL подключения: postgresql://[[username][:password]@[host][:port][/db]
VUE_APP_DOCHUB_POSTGRES_URL=postgresql://alice:secret@postgres.server:5432/seaf
```

В этом режиме PostgreSQL используется как общее хранилище кэша backend: результаты JSONata-запросов,
датасеты, чексуммы, меню, SmartAnts и прочая служебная информация (ключи с префиксом `SEAF.cache.*`).
Кэш разделяется между пользователями одного backend-инстанса (ключи не содержат идентификатор
пользователя) и сохраняется при перезапуске backend-процесса.

Дополнительные параметры пула соединений и повторных запросов описаны в
[example.env](https://gitverse.ru/seafteam/seaf-archtool-core/content/master/example.env).

### Преимущества
1. Заметно ускоряет работу пользовательского приложения за счет единоразовой подготовки архитектурной 
   кодовой базы на стороне backend;
2. Позволяет кэшировать результаты запросов и разделять кэши между пользователями, что значительно
   сокращает отклик приложения на действия пользователя;
3. Позволяет регулировать доступ пользователя к объектам архитектурного учета (в разработке);
4. Скрывает для пользователя чувствительные конфигурационные денные интеграций, например с хранилищами GitLab;
5. Предоставляет API для встраивания SEAF.ArchTool в DevOps процессы.

### Недостатки
1. Требует более сложной конфигурации как самого SEAF.ArchTool так и серверных ресурсов для 
   стабильного функционирования;
2. При сложных связях архитектурного кода, могут потребоваться специальные меры по инвалидации
   кэша (регулярно чистить кэш);
3. Перезапуск сервера, при значительных объемах кодовой базы может занимать заметное время,
   что воздействует на всех пользователей.


### Рекомендации

Данный режим разумно использовать при существенных объемах кодовой базы и использовании SEAF.ArchTool 
как инструмента встраиваемого в процессы производства (в DevOps процессы в частности). 


## Cluster 

**ВНИМАНИЕ!** Данный режим проходит beta-тестирование.

Этот режим создан для того, чтобы сервис SEAF.ArchTool был доступен в любое время. В кластере может быть запущено много нод
в режиме "Client-Server", что обеспечивает доступ к сервису, даже если все, кроме одной ноды, вышли из строя.

Также режим позволяет обновлять данные манифестов без приостановки работы сервиса.

Функционирование кластера и совместное использование данных между нодами обеспечивается через общую СУБД
[PostgreSQL](https://www.postgresql.org/). Подключение задаётся переменной `VUE_APP_DOCHUB_POSTGRES_URL`,
режим кэширования — `VUE_APP_DOCHUB_DATALAKE_CACHE=postgres` (единственный поддерживаемый режим для кластера).

Одна и та же база PostgreSQL используется для нескольких задач:

1. **Кэш backend (Data Lake)** — результаты JSONata-запросов, датасеты, чексуммы, меню и прочие
   вычисления (`SEAF.cache.*`); общий для всех нод кластера;
2. **Синхронизация кластера** — координация нод (master/slave), root-манифест, метки времени
   актуальности манифестов. Ключи в таблице `cache`: `SEAF.master`, `SEAF.master.command`,
   `SEAF.master.state`, `SEAF.root.manifest`, `SEAF.manifest__{permission}`,
   `SEAF.manifest.meta__{permission}`, `SEAF.manifest.parser__{permission}`,
   `SEAF.manifest.expected.ts__{alias}`, `SEAF.manifest.actual.ts`;
3. **Ролевая модель v2** — при включённой федеративной модели (`VUE_APP_DOCHUB_ROLES_MODEL_V2=Y`)
   собранные манифесты по каждому праву доступа (permission) хранятся в той же таблице `cache`;
   ноды отдают пользователю манифест в соответствии с JWT и заголовком `X_SFA_ORGCTX`.
   Подробнее о root-манифесте для кластера см.
   [Главный манифест для кластера](/docs/archtool.imports.root);
4. **Сессии GigaChat** — отдельная таблица `ai_chat_session_data` (в режиме Client-Server сессии
   хранятся в памяти backend-процесса).

### Компонентная схема работы кластера

```plantuml
@startuml
  actor "User" as user
  component "Browser" as browser
  component "Balancer" as balancer


  package "SEAF.ArchTool кластер" {
    component "Node 1" as node1
    component "Node 2" as node2
    component "Node N" as nodeN
  }

  database "PostgreSQL" as postgres
  database "Хранилище\nманифестов" as storage

  note right of postgres
    кэш backend,
    синхронизация кластера,
    ролевая модель v2,
    сессии GigaChat
  end note

  user <-D- browser
  browser <-D- balancer

  postgres <-U-> node1
  postgres <-U-> node2
  postgres <-U-> nodeN

  storage -U-> node1
  storage -U-> node2
  storage -U-> nodeN

  balancer <-D- node1
  balancer <-D- node2
  balancer <-D- nodeN
@enduml
```

### Алгоритм работы кластера 
```plantuml
@startuml
participant SeafArchtoolFront [
    =SEAF.ArchTool
    ----
    ""Front end""
]

participant Balancer [
    =Balancer
    ----
    ""Балансировщик""
]

participant SeafArchtoolNode1 [
    =SEAF.ArchTool
    ----
    ""Server node1""
]

participant SeafArchtoolNode2 [
    =SEAF.ArchTool
    ----
    ""Server node2""
]


participant Storage [
    =Storage
    ----
    ""Хранилище""
    ""манифестов""
]

participant PostgreSQL [
    =PostgreSQL
    ----
    ""Общее хранилище""
    ""кэш / кластер /""
    ""ролевая модель /""
    ""сессии GigaChat""
]

group Старт или перезагрузка master-ноды (Server node1)
 SeafArchtoolFront -> Balancer: Запрос
 Balancer -> SeafArchtoolNode1: Попытка запроса

 note over of SeafArchtoolNode1: Пока master грузит манифест,\nнода отвечает кодом 503
 Balancer <- SeafArchtoolNode1: 503 временно недоступно
 Balancer -> Balancer: Переключение на другую ноду
 Balancer -> SeafArchtoolNode2: Попытка запроса
 Balancer <- SeafArchtoolNode2: 200 результат
 SeafArchtoolFront <- Balancer: Результат

 SeafArchtoolNode1 <-Storage: Загрузка и сборка манифестов
 SeafArchtoolNode1 -> PostgreSQL: Запись SEAF.manifest__*,\nметок времени и SEAF.master (endLoadTime)
 note over of SeafArchtoolNode1: По завершению загрузки нода будет отвечать с кодом 200
end

group Синхронизация slave-ноды (Server node2)
 note right of SeafArchtoolNode2: Каждые 5 с нода читает\nSEAF.master.endLoadTime из PostgreSQL
 SeafArchtoolNode2 <- PostgreSQL: Чтение SEAF.master (endLoadTime)
 SeafArchtoolNode2 <- SeafArchtoolNode2: endLoadTime изменился
 SeafArchtoolNode2 <- PostgreSQL: Загрузка манифестов из кэша\n(SEAF.manifest__*)
 SeafArchtoolNode2 <- SeafArchtoolNode2: Обновление локального состояния,\nсброс memory cache
 note right of SeafArchtoolNode2: Slave не обращается к Storage\nи не пишет в PostgreSQL
end


@enduml

```

### Преимущества
1. Предоставляет все преимущества развертывания в режиме Client-Server;
2. Обеспечивает высокую надежность сервиса и дополнительное повышение производительности за 
   счет горизонтального масштабирования;
3. Обеспечивает работу сервиса без простоя в период обновления данных.

### Недостатки
1. Требует развертывания инфраструктуры отказоустойчивости: балансировщик, PostgreSQL;
2. При сложных связях архитектурного кода, могут потребоваться специальные меры по инвалидации
   кэша (регулярно чистить кэш).


### Рекомендации

Кластер рекомендуется применять при высоких требованиях к уровню сервиса по надежности и производительности. 

### Конфигурирование

Для перевода группы серверов в режиме Client-Server в кластер, необходимо:

1. Развернуть СУБД [PostgreSQL](https://www.postgresql.org/);
2. Развернуть балансировщик и настроить его. Например, можно использовать
   [nginx](https://nginx.org/ru/docs/http/ngx_http_upstream_module.html). Недоступная нода определяется по коду ответа 503;
3. Добавить в конфигурацию **всех** нод кластера параметры:

```
# Режим кэширования Data Lake — обязателен для кластера
VUE_APP_DOCHUB_DATALAKE_CACHE=postgres
# Формат URL подключения: postgresql://[[username][:password]@[host][:port][/db]
VUE_APP_DOCHUB_POSTGRES_URL=postgresql://alice:secret@awesome.postgres.server:5432/seaf
VUE_APP_DOCHUB_CLUSTER=on
# Вызов backend должен происходить через балансировщик
VUE_APP_DOCHUB_BACKEND_URL=http://node-balancer:3030

# Ролевая модель v2 (опционально, для федеративного доступа к нескольким архитектурам)
# VUE_APP_DOCHUB_ROLES_MODEL_V2=Y
```
4. Перезапустить серверы.

Подробные примеры конфигурации кластера смотрите в файле
[example.env](https://gitverse.ru/seafteam/seaf-archtool-core/content/master/example.env)
(раздел «Портал в кластере, с кешированием в Postgres»).


## Сервис SmartAnts на JVM

В режимах Client-Server и Cluster расчёт схем SmartAnts можно вынести в отдельный сервис на JVM
(порт библиотеки на Kotlin). Сервис говорит на том же протоколе, что и Node-сервис режима `service`,
и читает те же переменные `VUE_APP_DOCHUB_SMART_ANTS_*`, поэтому портал подключается к нему без изменений.
Для запуска нужна только Java 21 или новее. Сервис публикуется в Maven Central
(`su.seaf.archtool:smartants-service`, файл `smartants-service-<версия>-all.jar`); в core его JAR не хранится,
а версия и SHA-256 закреплены в `src/assets/libs/smartants-service.properties`.

Подключение портала:

```bash
VUE_APP_DOCHUB_SMART_ANTS_MODE=service
VUE_APP_DOCHUB_SMART_ANTS_ADDRESS=http://archtool-smartants
VUE_APP_DOCHUB_SMART_ANTS_PORT=3040
# Ключ кэша результатов: с JVM-сервисом задаётся явно, jvm-<версия сервиса>
VUE_APP_SEAF_SMARTANTS_CACHE_KEY=jvm-1.23.0
```

В эксплуатации сервис запускается напрямую: `java -jar smartants-service-<версия>-all.jar` с теми же переменными
`VUE_APP_DOCHUB_SMART_ANTS_*` в окружении процесса (порт — `VUE_APP_DOCHUB_SMART_ANTS_PORT`).

Локальный запуск — `npm run smartants-jvm-up` (скрипт `scripts/smartants-jvm-up.ts`, только для разработки: backend портала
Java и JAR не ищет и сервис не запускает): читает `.env` (и `VUE_APP_ENV_FILES`), ищет Java 21+ в `JAVA_HOME`, затем в `PATH`,
и запускает сервис с этими переменными. JAR берётся из `VUE_APP_SEAF_SMARTANTS_JAR`, если переменная задана;
иначе из локального репозитория Maven (`~/.m2`) или кэша `node_modules/.cache/seaf-smartants`, а при отсутствии
скачивается из `VUE_APP_SEAF_SMARTANTS_MAVEN_REPOSITORY` (по умолчанию Maven Central). Из `~/.m2`, кэша и сети
принимается только файл с закреплённой SHA-256. Если JAR получить не удалось, ошибка перечисляет проверенные места
с причиной (нет файла, другая SHA-256, сетевая ошибка или HTTP-статус) и переменные, которые нужно задать;
параметры JVM (например, `-Xmx2g`) задаются в `VUE_APP_SEAF_SMARTANTS_JAVA_OPTS`.

Особенности:

- Режим SmartAnts фронтенд получает от backend (`/api/env-config`), поэтому пересобирать фронтенд или образ портала
  при смене режима не нужно: достаточно переменной в окружении backend. Без переменной backend передаёт режим `front`
  (схемы строит браузер), даже если фронтенд собран с другим значением; значение сборки действует, только если
  `/api/env-config` недоступен.

- Backend кэширует результаты SmartAnts, в том числе ошибки. Без `VUE_APP_SEAF_SMARTANTS_CACHE_KEY` ключ кэша строится
  по `smartants.cjs`. Backend не знает, какой сервис отвечает в режиме `service`, поэтому с JVM-сервисом ключ задаётся
  явно (`jvm-<версия сервиса>`) и меняется при обновлении сервиса: иначе останутся результаты прежнего расчёта.
- Сервис отклоняет с ошибкой `SmartAntsUnsupported` редкие входные данные, которые Node-версия обрабатывает
  нестрого: например, идентификаторы вида `__proto__`, нестроковые заголовки связей, `&symbol`-коллизии идентификаторов.
- На некорректный запрос сервис отвечает 400 и продолжает работу.
- Каждый поток трассировки занимает до ~40 МБ; размер кучи подбирается под `VUE_APP_DOCHUB_SMART_ANTS_MAX_THREADS`.

## Файлы переменных среды исполнения

Файлы конфигурации среды исполнения:
```text
.env                # загружается во всех случаях
.env.local          # загружается во всех случаях, игнорируется git
.env.[mode]         # загружается только в указанном режиме работы
.env.[mode].local   # загружается только в указанном режиме работы, игнорируется git
```
[Больше информации](https://cli.vuejs.org/ru/guide/mode-and-env.html) 

## Переменные среды исполнения и примеры конфигураций

Актуальные параметры конфигурирования смотрите в файле
[example.env](https://gitverse.ru/seafteam/seaf-archtool-core/content/master/example.env)
