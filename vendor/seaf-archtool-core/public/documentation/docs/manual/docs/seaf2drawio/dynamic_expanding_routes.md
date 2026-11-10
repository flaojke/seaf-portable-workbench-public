# Динамическое раскрытие logical links

## Назначение

Динамическое раскрытие logical links позволяет строить не только прямую связь между `source` и `target`, но и вычисленный сетевой маршрут между ними. Маршрут строится по объектам технической архитектуры и их сетевым связям. На схеме он отображается как последовательность edge-сегментов через промежуточные сети и сетевые устройства.

Функция нужна для случаев, когда logical link описывает намерение, например "пользователь подключается к ФПСУ", а физический путь проходит через LAN, ACL, WAN, маршрутизаторы или другие сетевые элементы.

## Включение

Вычисление маршрутов включается на двух уровнях.

На уровне документа:

```yaml
docs:
  seaf.ta.docs.schema_r41:
    description: Схема Р41 (seaf2drawio, raw TA dataset)
    type: seaf2drawio
    source: seaf.company.ds.ta.schema_r41
    layout_settings:
      logical_links:
        computed_routes:
          enabled: true
          show_intermediate: true
          layer: "Расчетные связи"
          layer_id: "layer.logical.computed.routes"
          fallback: "direct"
          route_mode: "shortest"
```

На уровне конкретной logical link:

```yaml
seaf.company.ta.services.logical_links:
  app.to.db:
    title: App to DB
    source: app.service
    target:
      - db.service
    direction: "==>"
    topology: star
    route_mode: shortest
```

Если `computed_routes.enabled` не включен, logical links рисуются как раньше. Если в `computed_routes.route_mode` не задан режим по умолчанию, связь раскрывается только при собственном `route_mode: shortest` или совместимом opt-in поле.

`computed_routes.route_mode: shortest` включает поиск кратчайшего пути для всех logical links документа, у которых нет собственного режима. Настройки самой связи имеют приоритет: например, `route_mode: direct` оставит конкретную связь прямой.

## Источник графа

Граф маршрутизации строится из TA-объектов, которые могут участвовать в сетевом пути. Узлами графа становятся сети, сетевые устройства, пользовательские устройства, сервисы и другие routable-сущности. Ребра графа создаются из полей:

- `network_connection`
- `network_connection_devices`
- `network_links`

Например, если пользовательское устройство подключено к LAN через `network_connection`, а сетевое устройство подключено к этой LAN и к следующей сети, то между пользователем и сетевым устройством появляется вычисляемый путь через LAN.

## Топологии

`topology: star` обрабатывает каждый target как независимую пару `source -> target`.

```yaml
source: user.device
target:
  - fpsu.1
  - fpsu.2
topology: star
route_mode: shortest
```

В этом случае для `fpsu.1` и `fpsu.2` строятся два отдельных маршрута. Один из них может успешно раскрыться, а второй может уйти в fallback, если в сетевом графе нет пути.

`topology: chain` трактует targets как упорядоченные hop-точки:

```yaml
source: user.device
target:
  - firewall.node
  - db.service
topology: chain
route_mode: shortest
```

Плагин строит путь `user.device -> firewall.node`, затем `firewall.node -> db.service` и объединяет сегменты.

## Промежуточные hop-точки

Для явного задания промежуточных узлов можно использовать `via`, `hops` или `waypoints`. Эти поля дополняют путь между исходной парой `source -> target`.

```yaml
seaf.company.ta.services.logical_links:
  app.to.db.via.firewall:
    title: App to DB via firewall
    source: app.service
    target:
      - db.service
    via:
      - firewall.node
    route_mode: shortest
```

Если хотя бы один участок между соседними waypoint-узлами не найден, весь маршрут считается неуспешным и обрабатывается через `fallback`.

## Визуальная модель слоев

Обычные logical links и вычисленные logical links разделяются по слоям.

Если связь не вычисляется, она рисуется в базовом слое тега:

- `VPN`
- `VM`
- `АВЗ`

Если связь вычисляется, она рисуется в рассчитанном слое тега:

- `VPN рассчитанные связи`
- `VM рассчитанные связи`
- `АВЗ рассчитанные связи`

Если у logical link нет `tags`, используется общий рассчитанный слой из `computed_routes.layer`, по умолчанию `Расчетные связи`.

На общей агрегированной странице применяется та же логика, но id слоя получает префикс `common_`. Например:

- `layer.logical.computed.vpn.routes`
- `common_layer.logical.computed.vpn.routes`

Такой подход нужен, чтобы на схеме можно было независимо включать исходные логические связи и вычисленные маршруты. Без этого рассчитанные пути разных тегов быстро смешиваются в один трудно читаемый слой.

## Fallback

Если путь не найден, поведение задается `computed_routes.fallback`.

`fallback: direct` рисует прямую связь между исходными endpoint-ами, но оставляет ее в рассчитанном слое. В XML такая связь помечается:

```xml
computed_route="true"
route_expanded="false"
route_failed="true"
```

Важно, что fallback не должен попадать в базовый слой тега. Иначе визуально возникает конфликт: базовый слой показывает одну прямую связь, а рассчитанный слой показывает другой путь для того же logical link.

`fallback: skip` не рисует связь, если маршрут не найден.

## Пример: два target у VPN

Для logical link с одним source и двумя target-ами возможна смешанная картина:

```yaml
source: user.device
target:
  - fpsu.1
  - fpsu.2
tags:
  - VPN
topology: star
route_mode: shortest
```

Если до `fpsu.1` путь найден, а до `fpsu.2` путь в графе отсутствует, то в слое `VPN рассчитанные связи` будут:

- раскрытые сегменты маршрута до `fpsu.1`;
- прямой fallback до `fpsu.2` с `route_failed=true`.

В базовом слое `VPN` для этой вычисляемой связи не должно быть edge-ов.

## Диагностические XML-атрибуты

Для вычисленных сегментов в Draw.io XML добавляются атрибуты:

- `computed_route="true"`
- `route_expanded="true"` для раскрытого маршрута;
- `route_expanded="false"` для свернутого маршрута или fallback;
- `route_failed="true"` для fallback после неуспешного поиска;
- `route_path` с полным путем через узлы графа;
- `route_source` и `route_target` с исходной парой маршрута;
- `route_step_index` с индексом исходной пары;
- `route_segment_index` и `route_segment_count` с позицией сегмента в раскрытом маршруте.

Эти атрибуты используются для отладки и автоматических проверок.

## Проверка изменений

Минимальный набор локальных проверок:

```bash
node -c plugins/seaf2drawiojs/lib/logical-routing.js
npm exec eslint -- \
  plugins/seaf2drawiojs/lib/logical-routing.js \
  plugins/seaf2drawiojs/lib/seaf-drawio.js \
  plugins/seaf2drawiojs/lib/diagram.js \
  tests/seaf2drawiojs/verification.test.js
npm test -- --runInBand tests/seaf2drawiojs/verification.test.js
git diff --check
```

Для проверки на реальных R41 данных нужно пересобрать Docker-образ и перезапустить контейнер. Код `seaf2drawiojs` попадает внутрь web bundle, поэтому уже запущенный контейнер не подхватывает изменения исходников.

Для больших датасетов обязательно включать memory cache:

```bash
docker run -d --name seaf2drawio-routes \
  -p 28080:3030 \
  -e VUE_APP_DOCHUB_ROOT_MANIFEST=workspace/dochub.yaml \
  -e VUE_APP_DOCHUB_DATALAKE_CACHE=memory \
  -e NODE_OPTIONS=--max-old-space-size=8192 \
  -e VUE_APP_DOCHUB_APPEND_DOCHUB_DOCS=n \
  -v /tmp/seaf2drawio-routes-workspace:/var/www/public/workspace:rw \
  -v /path/to/model:/var/www/public/workspace/source:ro \
  seaf.archtool.core:computed-routes
```

После генерации `.drawio` нужно проверять не только картинку, но и XML-инварианты:

- есть рассчитанные слои по тегам, например `VPN рассчитанные связи`;
- computed edge-ы лежат в `layer.logical.computed.<tag>.routes`;
- fallback edge-ы с `route_failed=true` тоже лежат в рассчитанном слое;
- базовый слой тега не содержит edge-ы для logical links, которые ушли в computed route mode;
- на общей странице используются `common_layer.logical.computed.<tag>.routes`;
- для проблемного visual-кейса проверяется конкретный `OID` logical link, а не только общее количество связей.

## Ограничения

Алгоритм ищет кратчайший путь по текущему графу данных. Он не создает недостающие связи между сетями и устройствами. Если в модели нет `network_connection`, `network_connection_devices` или `network_links`, которые соединяют два участка сети, путь не будет найден.

В этом случае нужно либо дополнить модель сетевой связностью, либо использовать `fallback: direct`, либо явно задать дополнительные hop-точки, если они уже присутствуют в графе.
