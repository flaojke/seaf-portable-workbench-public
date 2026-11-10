"""Create the brief and charts from observed medians; never rerun SEAF."""
import argparse
import csv
import hashlib
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
LOCAL_LIBS = HERE / "state" / "plot-libs"
if LOCAL_LIBS.exists():
    sys.path.insert(0, str(LOCAL_LIBS))
os.environ.setdefault("MPLCONFIGDIR", str(HERE / "state" / "matplotlib-cache"))

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument("--summary", type=Path, default=HERE / "../../docs/performance/repository-layout/summary.json")
parser.add_argument("--out", type=Path, default=HERE / "../../docs/performance/repository-layout")
parser.add_argument("--portal", action="store_true", help="Update the reviewed documentation template only")
args = parser.parse_args()
raw = args.summary.read_bytes()
data = json.loads(raw)
out = args.out.resolve()
out.mkdir(parents=True, exist_ok=True)

labels = {
    "baseline": "Общие файлы",
    "v1": "1 · Файлы → systems.yaml",
    "v2": "2 · Файлы → root.yaml",
    "v3": "3 · Папки → root.yaml",
    "v4": "4 · Папки → индексы типов",
    "v5": "root.yaml каждой системы",
    "v6": "Пакеты по 20 систем",
}
metrics = {"startupMs": "Запуск", "reloadMs": "Перезагрузка модели", "uiColdMs": "Открытие реестра"}
groups = []
for size in (1000, 3000):
    rows = [r for r in data["local"] if r["N"] == size]
    assert {r["layout"] for r in rows} == set(labels)
    for metric in metrics:
        best = min(r[metric]["median"] for r in rows)
        winners = [r["layout"] for r in rows if r[metric]["median"] == best]
        groups.append({"systems": size, "metric": metric, "winnerLayouts": winners,
                       "bestMedianMs": best,
                       "rows": [{"layout": r["layout"], "medianMs": r[metric]["median"],
                                 "slowerPercent": (r[metric]["median"] / best - 1) * 100,
                                 "sampleMinMs": r[metric]["min"], "sampleMaxMs": r[metric]["max"]}
                                for r in rows]})

result = {"format": "seaf-layout-relative-comparison-v1", "summarySha256": hashlib.sha256(raw).hexdigest(),
          "formula": "100 * (layout median / minimum median of same size and metric - 1)",
          "metamodel": "DocHub components with synthetic custom integrations; KADZO v2023 was not tested",
          "scope": "Observed medians, not statistical significance or a universal winner", "groups": groups}
(out / "relative-comparison.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
with (out / "slowdown.csv").open("w", encoding="utf-8", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["systems", "metric", "layout", "median_ms", "slower_percent", "winner"])
    for group in groups:
        for row in group["rows"]:
            writer.writerow([group["systems"], group["metric"], row["layout"], row["medianMs"],
                             round(row["slowerPercent"], 6), row["layout"] in group["winnerLayouts"]])

def group_for(size, metric):
    return next(g for g in groups if g["systems"] == size and g["metric"] == metric)

plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 11, "svg.fonttype": "path"})
bg, text, muted, winner, other = "#f6f9fb", "#1e2e3d", "#536573", "#087e72", "#6685a1"
fig, axes = plt.subplots(2, 2, figsize=(16, 12.8), facecolor=bg)
fig.subplots_adjust(left=.19, right=.96, bottom=.16, top=.865, hspace=.42, wspace=.62)
fig.text(.055, .966, "SEAF: насколько структура замедляет загрузку", fontsize=23, weight="bold", color=text)
fig.text(.055, .932, "Отставание от минимальной медианы в каждой группе · меньше — быстрее", fontsize=13, color=muted)
for row_index, size in enumerate((1000, 3000)):
    for col_index, metric in enumerate(("startupMs", "reloadMs")):
        ax = axes[row_index, col_index]
        group = group_for(size, metric)
        ordered = [next(r for r in group["rows"] if r["layout"] == layout) for layout in labels]
        percents = [r["slowerPercent"] for r in ordered]
        colors = [winner if r["layout"] in group["winnerLayouts"] else other for r in ordered]
        y = np.arange(len(ordered))
        ax.set_facecolor(bg)
        ax.barh(y, percents, color=colors, height=.55, zorder=3)
        for i, item in enumerate(ordered):
            if item["layout"] in group["winnerLayouts"]:
                ax.scatter(0, i, color=winner, s=45, clip_on=False, zorder=5)
            ax.text(item["slowerPercent"] + 1, i,
                    f'+{item["slowerPercent"]:.1f}%  ·  {item["medianMs"]/1000:.2f} с',
                    ha="left", va="center", color=text, fontsize=10.5)
        ax.set_yticks(y, list(labels.values()), color=text)
        ax.invert_yaxis()
        ax.set_xlim(0, 73)
        ax.set_xticks([0, 10, 20, 30, 40, 50], ["0%", "+10%", "+20%", "+30%", "+40%", "+50%"], color=muted)
        ax.grid(axis="x", color="#dbe4ea", linewidth=.7, zorder=0)
        ax.set_axisbelow(True)
        ax.tick_params(axis="both", length=0, pad=8)
        for spine in ax.spines.values():
            spine.set_visible(False)
        ax.set_title(f'{size:,} систем · {metrics[metric]}'.replace(",", " "), loc="left", pad=20,
                     fontsize=15, weight="bold", color=text)
fig.text(.055, .105, "Интерфейс почти не зависит от раскладки файлов", fontsize=14, weight="bold", color=text)
fig.text(.055, .078, "Реестр: 1 000 систем — 1,30–1,32 с; 3 000 — 1,34–1,40 с. Отдельно от времени запуска сервера.", fontsize=12, color=muted)
fig.text(.055, .046, "DocHub components + custom integrations · Windows x64 · Node 22.23.4 · 3 запуска / 6 reload · данные 06.11.2026", fontsize=10.5, color=muted)
fig.text(.055, .024, "Медианы синтетического стенда; КАДЗО v2023 отдельно не тестировалась. Малые различия не доказывают устойчивой победы.", fontsize=10.5, color=muted)
for extension in ("png", "svg"):
    fig.savefig(out / f"infographic.{extension}", dpi=170, facecolor=bg)
plt.close(fig)

brief = ["# SEAF: краткий результат нагрузочного исследования", "",
         "Сравнены семь структур с одинаковой синтетической моделью DocHub components + custom integrations: 1000/3000 систем и 3000/9000 интеграций. Windows native, Node 22.23.4, три process-повтора и шесть reload на вариант. КАДЗО v2023 и корпоративные правила отдельно не тестировались; приведённые проценты не являются измерением КАДЗО.", "",
         "**Единого победителя нет.** На 1000 систем минимальные медианы старта и reload у пакетов по 20 систем. На 3000 — у общих файлов; старт пакетов отличается лишь на 0,07%, reload — на 3,46%. Эти небольшие различия не доказывают устойчивого преимущества.", "",
         "**Рекомендация по хранению:** простые системы группировать по области ответственности; для сложной LTI — своя папка с root.yaml, системами, функциями, исходящими интеграциями и представлениями. Общие справочники подключать один раз. Номер 20 — проверенный размер пакета, не универсальный оптимум.", "",
         "## Насколько медленнее минимальной медианы", "",
         "| Структура | 1000: старт | 1000: reload | 3000: старт | 3000: reload |",
         "|---|---:|---:|---:|---:|"]
for layout, label in labels.items():
    cells = []
    for size, metric in ((1000, "startupMs"), (1000, "reloadMs"), (3000, "startupMs"), (3000, "reloadMs")):
        row = next(r for r in group_for(size, metric)["rows"] if r["layout"] == layout)
        cells.append("Минимум" if layout in group_for(size, metric)["winnerLayouts"] else f'+{row["slowerPercent"]:.1f}%')
    brief.append(f'| {label} | ' + " | ".join(cells) + " |")
brief += ["", "Формула: `(время варианта / минимальное время той же операции и размера − 1) × 100%`. Значение «+46,9%» означает в 1,469 раза дольше, а не снижение пропускной способности на 46,9%.", "",
          "## Что влияет на работу пользователя", "",
          "- Открытие реестра: 1,30–1,32 с на 1000 систем и 1,34–1,40 с на 3000. Дробление файлов не дало заметного выигрыша в этом сценарии.",
          "- При HTTP-импортах цена тысяч файлов выше: в отдельном тесте 1000 систем / 10 мс на запрос reload с manifest каждой системы занял 4,807 с против 1,607 с у общих файлов — примерно в 3 раза дольше. Это не измерение реального GitLab; локальный Git-клон относится к файловому профилю.",
          "- CPU profile выявил горячий wildcard-валидатор: wcard занял 22,14% sampled time. Структура выражения предполагает N² сравнений явных ID; перестановка файлов эту стоимость не устраняет. Оптимизация не внедрялась в рамках исследования.",
          "- Полная схема 3000 узлов, concurrent users/RPS, cold disk и корпоративные validators не тестировались. Фокусная схема — PlantUML 50 узлов; SmartAnts smoke завершился ошибкой и сохранён отдельно.", "",
          "![Сравнение структуры репозитория](infographic.png)", "",
          "[Полный отчёт](REPORT.md) · [Медианы CSV](measurements.csv) · [Отставание CSV](slowdown.csv)", ""]
(out / "BRIEF.md").write_text("\n".join(brief), encoding="utf-8", newline="\n")
if args.portal:
    template = HERE / "../../seaf-mcp/workbench/documentation/repository-layout.md"
    original = template.read_text(encoding="utf-8")
    start, end = "<!-- relative-comparison:start -->", "<!-- relative-comparison:end -->"
    section = "\n".join(brief[:brief.index("## Что влияет на работу пользователя")])
    section = section.replace("# SEAF: краткий результат нагрузочного исследования", "## Краткий результат и отставание от победителя")
    block = start + "\n" + section + "\n" + end + "\n\n"
    if start in original:
        prefix, remaining = original.split(start, 1)
        _, suffix = remaining.split(end, 1)
        updated = prefix + block + suffix.lstrip("\n")
    else:
        updated = original.replace("## Вывод\n", block + "## Вывод\n", 1)
    template.write_text(updated, encoding="utf-8", newline="\n")
print(json.dumps({"out": str(out), "summarySha256": result["summarySha256"], "groups": len(groups),
                  "files": ["infographic.png", "infographic.svg", "BRIEF.md", "slowdown.csv", "relative-comparison.json"]}))
