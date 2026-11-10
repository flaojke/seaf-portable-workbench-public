# Portable workspace: наблюдённая приёмка

Материалы ниже — промежуточные или целевые проверяемые receipts, а не утверждение, что окончательный ZIP уже выпущен.

- `projects-editor-2026-11-07.json`: свежие восемь стадий браузера и focused34; реальный native SEAF на временных Git/не-Git проектах. Ограничение интерактивного Windows dialog указано явно.
- `provider-tested-scope.json`: focused31, existing89/7 Docker skips, четыре native lifecycle стадии и tested-source hashes до завершающего picker fix. Поздние изменения не считаются проверенными этим receipt.
- `native-initial.tap`, `offline-initial.tap`, `launcher-initial.json`: исходные 4/6/6 проверки; launcher относится к прежнему development bundle. Они не заменяют final ZIP64/extraction/relocation gates.
- `hello-c4-l2.json`: настоящий локальный C4 Container SVG. `documentation-initial-review.json`: проверка 21 страницы и typed examples перед публикацией reverse guide.
- `documentation-publication.json`: реальные validation/apply результаты MCP для ShopFlow и portable example после обновления MCP 2.1/release notes. Git commit, directory revision и reload status разделены.
- `source-publication.json`: текущий pre-export audit без полного локального inventory. High-confidence token/key matches отсутствуют; прежние local config blobs обнаружены в старой root history. Планируется clean source export с новой историей, исходный Git не переписывается.
- `master-baseline.json`, `master-sync.json`: official pinned merger sync без archive, baseline/scenario preservation и повторное применение без изменений.
- `openspec-pre-release.txt`: pinned strict validation после sync, 17 passed / 0 failed. Это проверка спецификаций, не runtime ZIP.
- `clean-source-regression-2026-11-07.json`: отрицательный initial run, ограниченная диагностика EPERM без выдуманной причины, bridge fixture fix, утверждённый history hardening, focused42 и full109 (101 PASS / 0 FAIL / 8 declared skips).
- `integrity-dotnet-2026-11-07.tap`: 7/7 real integrity/Windows extraction checks, включая Unicode/nonempty/ZipSlip; не финальная распаковка release ZIP.
- `history-documentation-publication.json`: initial reload failure и retry того же Git commit до updated, отдельно portable directory revision.

Полные машинные журналы, worker settings/control tokens, скачанные runtime и synthetic state остаются в игнорируемых state/cache. Здесь сохраняются scope и ограничения. Финальная упаковка, чистый source Git/build и закрывающий archive требуют отдельных новых доказательств.
