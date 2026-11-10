# Мастер (wizard)

Документ показывает вложенные документы по шагам. На экране — текущий шаг, индикатор прогресса и кнопки **Назад** / **Далее**. Переход только кнопками: клик по индикатору ничего не делает. Одновременно рендерится только текущий шаг.

## Профиль

```yaml
docs:
  archtool.example.wizard:
    type: wizard
    title: Пример мастера              # Заголовок. По умолчанию Wizard
    wizardConfig:
      showProgress: true               # Индикатор шагов. По умолчанию true
      navigationRules:
        restricted: true               # См. ниже. По умолчанию true
    source:                            # Массив шагов (как у таблиц — inline, файл или JSONata)
      - id: table                      # Идентификатор шага
        title: Таблица                 # Подпись на индикаторе
        src: "@document/archtool.table.preset"
      - id: mermaid
        title: Mermaid
        src: "@document/archtool.example.mermaid"
      - id: plantuml
        title: PlantUML
        src: "@document/archtool.example.pml"
```

`src` — ссылка на объект (`@document/...`, `@entity/...`) или обычный URL (откроется в iframe). Параметры вложенного документа, если нужны, указываются в самой ссылке: `@document/foo?bar=1`.

`restricted: true` — **Далее** можно заблокировать из вложенного документа. Например, редактируемая таблица не пускает дальше, пока есть несохранённые изменения. `false` — кнопка смотрит только на то, не последний ли это шаг.

## Пример

![Пример мастера](@document/archtool.example.wizard)
