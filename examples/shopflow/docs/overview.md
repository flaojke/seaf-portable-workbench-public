# ShopFlow — микросервисный интернет-магазин

Учебная архитектурная модель: покупатель выбирает товары, собирает корзину, оформляет заказ и получает уведомление после оплаты и заявку на доставку.

**7 микросервисов · REST и события · отдельное владение данными · проверки архитектуры**

## Карта системы

Схема строится из `architecture/components.yaml`. Масштабируйте её и открывайте карточки компонентов, чтобы исследовать связи.

![](@entity/contexts/smartants?dh-context-id=demo.shop.services)

Доставку оформляет [Delivery Service](/entities/components/blank?dh-component-id=demo.shop.delivery), владелец — **Logistics**. Он получает `OrderConfirmed`, создаёт заявку в своей базе и публикует `ShipmentCreated`.

## Исследовать проект

- [Все компоненты и связи](/entities/contexts/smartants?dh-context-id=demo.shop) — включая базы данных и инфраструктуру.
- [Владение данными](/entities/contexts/smartants?dh-context-id=demo.shop.data) — у каждого сервиса собственное хранилище.
- [Каталог микросервисов](/entities/docs/blank?dh-doc-id=demo.shop.services) — назначение и команда каждого сервиса.
- [Оформление заказа](/entities/docs/blank?dh-doc-id=demo.shop.checkout) — последовательность вызовов, события и компенсация ошибок.
- [Архитектурные решения](/entities/docs/blank?dh-doc-id=demo.shop.decisions) — границы сервисов, безопасность и отказоустойчивость.
- [Практические задания](/entities/docs/blank?dh-doc-id=demo.shop.workshop) — измените модель и проверьте результат.
- [Архитектурные проверки](/problems) — владельцы сервисов, описания и корректность ссылок.

## С чего начать

Откройте [Order Service](/entities/components/blank?dh-component-id=demo.shop.orders). Найдите его владельца, назначение и зависимости. Затем проследите [сценарий покупки](/entities/docs/blank?dh-doc-id=demo.shop.checkout).

Файлы проекта находятся в `.\seaf-docker\workspace\microservices-demo`. Это описание архитектуры в SEAF; сервисы представлены компонентами модели.

[Ранее подключённый учебник по таблицам](/entities/docs/blank?dh-doc-id=archtool.plugins.editable-table.menu) также доступен.
