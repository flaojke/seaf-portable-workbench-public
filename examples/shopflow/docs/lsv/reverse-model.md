# Объекты, связи, зависимости и справочники

| Секция | Назначение |
|---|---|
| `components` | Системы, приложения, сервисы, БД и другие архитектурные элементы. В базовой схеме обязательны `title` и `entity`. |
| `contexts` | Выбор компонентов для диаграммы; обязательное поле — `title`, список `components` задаёт состав. |
| `docs` | Документы и сценарии: `type` выбирает обработчик, `source` — файл, dataset или выражение, `location` — меню. |
| `aspects` | Аспекты/классификация, на которые могут ссылаться компоненты. |
| `entities` | Определения метамодели: schema, представления и меню. Новый произвольный YAML-раздел сам по себе не создаёт отдельный портал сущностей. |
| `rules.validators` | Проверки проекта, обычно JSONata; список findings должен быть пуст для успешной публикации. |

Связь имеет направление **от компонента, содержащего links, к id получателя**:

```yaml
components:
  demo.api:
    title: API
    entity: component
    owner: Backend
    links:
      - id: demo.db
        title: Чтение и запись
        protocol: SQL
```

`demo` и `demo.db` тоже должны быть описаны в полном проекте. Имена через точки задают иерархию; встроенный валидатор проверяет её родителей. `owner`, `description`, `protocol`, `trustZone` и `dataClassification` нужны по соглашению/правилам проекта или нашей доработки, а не автоматически для любого SEAF-компонента. Самостоятельные интеграции `seaf.app.integrations` требуют подключения соответствующей метамодели; её схема содержит `title`, `description`, `from`, `to` и ссылки на спецификации/объекты данных.

## Справочники редактора

SEAF допускает собственные справочники; единого обязательного каталога владельцев для всех метамоделей нет. Редактор нашей поставки читает `enum`, `$ref: '#/$rels/<section>.<object>'`, объявленный `dictionary` и `catalogs`/`dictionaries`. Пример из Hello:

```yaml
catalogs:
  teams:
    items:
      - { id: Frontend, title: Команда интерфейса }
      - { id: Backend, title: Команда API }
# В properties схемы отдельного components-объекта:
# owner: { type: string, dictionary: teams }
# status: { type: string, enum: [Draft, Approved] }
```

Смотрите полный рабочий `Hello/architecture.yaml`: `entities.components.schema.patternProperties.<pattern>.properties`. Наличие `dictionary` настраивает наш dropdown; бизнес-контроль допустимости значения требует schema enum или собственного валидатора. `technologies.sections/items` ShopFlow — отдельный каталог технологий, не автоматический синоним catalogs. Существующие значения без справочника показываются как подсказки.

Источник: базовые `entities/components/base.yaml`, `entities/aspects/base.yaml`, `seaf-core/entities/app/integrations/base.yaml`; реализация dropdown — `seaf-mcp/workbench/editor-fields.mjs`.
