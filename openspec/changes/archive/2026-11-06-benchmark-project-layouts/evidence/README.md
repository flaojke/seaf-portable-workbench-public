# Доказательства исследования структуры репозитория

Сводка завершённых synthetic native Windows измерений. Измерения при curation не повторяются.

- file-samples.json: все 42 process samples (7 layouts × 2 размера × 3 повтора), 84 reload, 126 browser phases с timing/navigation/marker/network/error метриками. Сетевые запросы сведены к count/status/type/bytes без адресов.
- http-samples.json: все 21 process samples (7 × 1000 систем × 3), 42 reload; искусственная задержка источника 10 мс, browser не запускался.
- source-reads.json: все 14 случаев и 70 отдельных чтений defining YAML, bytes/characters, HTTP status, exactSourceMatch и SHA-256.
- fixtures.json: counts, file/import statistics, SHA-256 секций и semantic proof; различие областей Engine и runtime model hash указано явно.
- profile.json и profile-findings.md: один отдельный CPU profile reload baseline3000; top self-time functions и осторожный вывод о горячем валидаторе. В сравнительные медианы не входит.
- smartants-negative.json: сохранённый провал отдельного smoke100/фокус50; он не выдан за успешное измерение SmartAnts. Основная серия использует PlantUML/Graphviz.
- input-hashes.json: SHA-256 сырых reports/profile и runtime/source identity. Сырые state-файлы остаются локальными и игнорируются Git.
- checks.json: выполненные проверки 42/21/14, 70 ответов, counts/hash identity, browser readiness/errors, завершение profile worker и отсутствие приватных полей.

Подготовить отчёт из корня репозитория: node benchmarks/repository-layout/curate.mjs. Можно передать --file, --http, --source, --suite, --semantic, --profile, --negative и --out. Скрипт читает уже готовые receipts, проверяет зафиксированные исходники/текущий pinned runtime и не запускает сервер/браузер. checks.json вычисляет hashes публикуемых JSON, а input-hashes.json — исходных receipts; замена входа/исходника с несовместимыми данными завершится ошибкой.

Ограничение runtime identity: каждый source-read runtime записал hash исполняемого Node и пяти core файлов. File/HTTP серии записали одинаковый Node/core путь, версию Node и общий набор source hashes; текущие pinned файлы совпадают с записанным source identity. Per-process executable hash для 63 process samples не записывался задним числом.

Browser cold означает новый BrowserContext; browser process и кеш ОС не cold. Warm — reload той же context с HTTP cache. Focus50 открывается полной навигацией с тёплыми HTTP assets, но renderer cache новый для каждого process sample. Проба измеряет readFileSync/YAML.parse, не всю стоимость merge/provenance/validation. Три повтора дают разброс, но не доказательство небольших процентных различий.

Дополнительные проверки: final-unit.tap сохранён без изменения (9/9 PASS), process-cleanup.json фиксирует 0 benchmark workers; publication-browser.json подтверждает видимый опубликованный отчёт, восемь таблиц, два размера/значения, 15 валидаторов и отсутствие browser/resource/HTTP errors. Адрес и абсолютные пути скриншотов исключены. publication-mcp.json содержит proposal IDs, проверки и Git/directory revisions; reload локального example не настроен и не выдан за выполненный. Push не выполнялся.

Без --out скрипт безопасно пишет только benchmarks/repository-layout/state/curated-evidence; он не создаёт активный OpenSpec change после архивации. Для публикации явно задайте reviewed directory: `node benchmarks/repository-layout/curate.mjs --out <reviewed-evidence-directory>`.
