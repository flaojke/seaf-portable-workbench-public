# Практика: изменяем архитектуру

Рабочая папка проекта: `.\seaf-docker\workspace\microservices-demo`.

## 1. Назначьте владельца сервиса

В `architecture/components.yaml` найдите `demo.shop.orders` и измените поле `owner`. Выполните обновление:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\seaf-docker\reload-examples.ps1
```

Обновите страницу браузера. Новое имя появится в [карточке заказов](/entities/components/blank?dh-component-id=demo.shop.orders) и [каталоге сервисов](/entities/docs/blank?dh-doc-id=demo.shop.services).

## 2. Посмотрите, как работает контроль качества

Временно замените владельца одного микросервиса на `owner: ""`, обновите данные и откройте [проверки](/problems). Правило `demo.shop.quality.owner` покажет отклонение со ссылкой на компонент. Верните владельца и повторите обновление — отклонение исчезнет.

## 3. Добавьте новый сервис

Скопируйте описание компонента, задайте уникальный ID `demo.shop.delivery`, `kind: microservice`, название, владельца и назначение. Добавьте связи только с уже описанными ID. После обновления сервис попадёт в каталог и [общий контекст](/entities/contexts/smartants?dh-context-id=demo.shop). Для включения в тематические схемы добавьте его в соответствующие списки `architecture/contexts.yaml`.

## 4. Сравните разные виды

- [Все компоненты](/entities/contexts/smartants?dh-context-id=demo.shop) показывают полный состав системы.
- [Данные](/entities/contexts/smartants?dh-context-id=demo.shop.data) показывают владение хранилищами.
- [Оформление заказа](/entities/docs/blank?dh-doc-id=demo.shop.checkout) показывает поведение системы во времени.

Компоненты, контексты и правила задаются YAML. Схема последовательности описана отдельно в `diagrams/checkout.mmd`; при изменении сценария её также нужно обновить. В текущем локальном режиме изменения сохраняйте в файлах проекта.

[Обзор проекта](/entities/docs/blank?dh-doc-id=demo.shop.overview) · [Учебник по таблицам](/entities/docs/blank?dh-doc-id=archtool.plugins.editable-table.menu)
