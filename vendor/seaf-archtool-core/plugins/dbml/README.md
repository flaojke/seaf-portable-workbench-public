# DBML plugin

### Идея
Совместить seaf archtool core с плагином для визуализации dbml моделей db-schema-visualizer (https://github.com/BOCOVO/db-schema-visualizer)

#### Наш подход включает:
1) Скачать db-schema-visualizer 
2) Изменить его под нужды seaf archtool
3) Вынести нужные js и css db-schema-visualizer в components/libCode
4) Подключить react приложение к vue раскладке

#### Изменения db-schema-visualizer
1) Пеервели с yarn на npm
2) Пакет db-schema-visualizer-main/packages/dbml-vs-code-extension экспортит нужные нам части репозитория, а именно функцию для парсинга parseDBMLToJSON и само приложение визуализации
3) Конфиг db-schema-visualizer-main/packages/dbml-vs-code-extension/vite.config.js был переделан из конфига для сборки приложения в конфиг для сборки либы, отдающий наружу компоненты из пункта 1
4) В пакете db-schema-visualizer-main/packages/json-table-schema-visualizer ширина и высота canvas была переделана на ширину и высоту контейнера в котором он будет рендериться
5) Была удалена возможность изменнеия темы со светлой на темную, дефолтной темой стала светлая
6) Сборка новых js/css файлов осуществляется командой npm i && npm run build --workspace=dbml-erd-visualizer --if-present из папки db-schema-visualizer-main
7) Add dbml-to-json-table-schema
   // @ts-ignore
   import { parse } from "@dbml/core/lib/parse/dbmlParser";

to minimize build size