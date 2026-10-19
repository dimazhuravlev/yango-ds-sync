# Источники: что считается актуальной ДС

Классификация — только по ключу компонента, стиля или коллекции; имя не в счёт (тёзок много, Library бывает подключена
дважды, форк хранит ключи оригинала).

## Актуально для мобильных макетов

| Файл | fileKey | Что брать | Allowlist |
|---|---|---|---|
| 🫟 Mobile · Library (прежнее имя — 🧩 Mobile · Library) | `b8maDlvYFFs2vagJxwxc4A` | все продуктовые и системные компоненты, 16 текстовых стилей (общие для всех брендов) | `keys/library-sets.txt` (8 симв.), `keys/library-components.txt` (опись с полными ключами), `keys/library-text-styles.txt` |
| 🦄 Графика | `xuoAmPzk6ks12Gj3jN2N1a` | иконки `icon / *`, нейплейты, логотипы, картинки (`image`) | `keys/grafika-sets.txt` (10 симв.) |
| 🦄 Органайзер | `LwCkvPL0UrSDoCQRcgy8Kf` | оформление страниц (`design-system`, `header`, `paragraph`) | `keys/organizer-sets.txt` (8 симв.) |
| 🌈 Стили | `lsTLftjJkiuftLZkNqlO7k` | переменные `Theme`, `Product`, `Typography constants` | коллекции ниже |

Все четыре должны быть подключены к файлу проекта (Assets → Libraries). Проверка — инструмент Figma MCP
`get_libraries(fileKey)` → `libraries_added_to_file`, сверять по ключу библиотеки (имена бывают с двойным пробелом):

| Библиотека | libraryKey |
|---|---|
| 🫟 Mobile · Library | `lk-ab0cd7b4aabf2292acf7dc3188010de6447676a29519e733b6a6ebb271eda9a12f1d85ea010b83194de402cc62e9c89100a15868158ba64ca5a49d9fb86f0d88` |
| 🦄 Графика | `lk-11320e1b627eba66016522d89ebdc33011a83d58ed90f3b159e3a7dd8b759128f14a60ec054e3c529ccb58fb3e7fff190a3d3b5e27ff3c2ed90db708bb1e5dd2` |
| 🦄 Органайзер | `lk-9ddd496975679f85fa2d360b608868120e617d5e1e372c43d244db58d1bcf8c3b9a7777ccb54463caa532166bffdf19c9c070aee2fdb847f91ba1c938c06f688` |
| 🌈 Стили | `lk-0cf41ce58ba72b7f6fbfeb2656692dfc73178389181ca91925114d13195da7d6961ea3fadbc8a7c456ec208e1bb0a05f64ca5ab3a1dcf76edd1f5aefa68e60f0` |

Подключённые легаси-библиотеки (🦄❌ Платформа / Мобайл, ❌ Mobile · Library ЯПС, 🌈 Платформа / SuperApp Mob…)
не мешают: на них держатся старые компоненты до замены. Отключать их — решение пользователя, не скилла.

Двойник ищется в таком порядке: Library → Графика (иконки, картинки, логотипы) → Органайзер (оформление).
Логотипы PlusUI допустимы. `keys/component-names.txt` — имена компонентов ДС для поиска отвязанных копий.

## Только для своих платформ

🦄 Платформа / ТВ `64yRNnMhUu8mKCz0cEjR9Z`, 🦄 Платформа / Веб `Rmf10YaHTialELOMfHgGsU`: мобильные макеты на них не
переводятся, ТВ- и веб-страницы проекта не трогаются.

## Неактуально (кандидаты на замену)

Любой компонент с `❌` в имени (в том числе из Library); 🦄❌ Платформа / Мобайл `KxvSsQ93KevI7KnXOSDPgq` (архив, все
компоненты с ❌) и её удалённые детали; ❌ MiniApp Mob; 🌈 Платформа / Мобильные; 🌈 SuperApp *; 🦄 Ядро / Иконки; PlusUI
Core (кроме логотипов); форки Library; киты других команд; удалённые компоненты. Системные копии старых ДС
(`❌ status-bar / ios`, `home-indicator`, клавиатуры, алерты) тоже заменяются — «системное не трогаем» относится только
к китам Apple/Google и шрифтам SF Pro / Roboto.

## Переменные

Актуальные коллекции — только в 🌈 Стилях (первые 10 символов ключа): `.Color constants` `498cff0363`, `Theme`
`7d07641e1f` (Dark | Light), `Typography constants` `e8bd5f0ef3`, `Product` `17df014a0d` (YaPS & Allplay | Yango Play EN |
Yango Play AR). У Library своих коллекций нет. Удалены и считаются неактуальными: `Typography`, `.Typography`
`51357d01b2`, `Typography Theme`, `Typography Headline` `b935c76824`, `Constants` `87084f…`, `.Accents` и `Typography
constants` `6924cc6910` из Library, старые версии `Product` (режимы Yango Play / YaPS / Allplay; тот же ключ, другой id —
актуальная версия та, к которой привязан стиль Library `387a5108`). Коллекции с точкой не публикуются: их переменные
по ключу не импортируются — двойник берётся из `Theme` с тем же значением в рабочем режиме.

## Как обновить allowlist

Library, Графика и Органайзер пополняются. Признак устаревшего allowlist: перепись назвала неактуальным компонент,
который импортируется из Library. Тогда в файле-источнике прогнать `scripts/pipeline/00-refresh-keys.js` (`PREFIX` 8 /
10 / 8) и заменить строки `keys/*.txt`; в Library ещё `00b-library-inventory.js` → `keys/library-components.txt`.
Текстовые стили Library: `getLocalTextStylesAsync()` в Library → ключ, семейство (H — Headline | YT — Title / Text), кегль,
начертание (S — Semibold/Bold, M — Medium).
