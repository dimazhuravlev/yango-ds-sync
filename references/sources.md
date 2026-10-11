# Источники: что считается актуальной ДС

Классификация — только по ключу компонента, стиля или коллекции; имя не в счёт (тёзок много, Library бывает подключена
дважды, форк хранит ключи оригинала).

## Актуально для мобильных макетов

| Файл | fileKey | Что брать | Allowlist |
|---|---|---|---|
| 🧩 Mobile · Library | `b8maDlvYFFs2vagJxwxc4A` | все продуктовые и системные компоненты, 28 текстовых стилей | `keys/library-sets.txt` (8 симв.), `keys/library-components.txt` (опись с полными ключами), `keys/library-text-styles.txt` |
| 🦄 Графика | `xuoAmPzk6ks12Gj3jN2N1a` | иконки `icon / *`, нейплейты, логотипы, картинки (`image`) | `keys/grafika-sets.txt` (10 симв.) |
| 🦄 Органайзер | `LwCkvPL0UrSDoCQRcgy8Kf` | оформление страниц (`design-system`, `header`, `paragraph`) | `keys/organizer-sets.txt` (8 симв.) |
| 🌈 Стили | `lsTLftjJkiuftLZkNqlO7k` | переменные `Theme`, `Product`, `Typography` | коллекции ниже |

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

Актуальные коллекции (первые 10 символов ключа): Стили — `.Color constants` `498cff0363`, `Theme` `7d07641e1f`,
`Typography constants` `e8bd5f0ef3`, `.Typography` `51357d01b2`, `Product` `17df014a0d`; Library — `.Accents`
`0f269755c0`, `Typography constants` `6924cc6910`, `Typography Headline` `b935c76824`. Коллекции с точкой не
публикуются: их переменные по ключу не импортируются — двойник берётся из `Theme` с тем же значением в рабочем режиме.

## Как обновить allowlist

Library, Графика и Органайзер пополняются. Признак устаревшего allowlist: перепись назвала неактуальным компонент,
который импортируется из Library. Тогда в файле-источнике прогнать `scripts/pipeline/00-refresh-keys.js` (`PREFIX` 8 /
10 / 8) и заменить строки `keys/*.txt`; в Library ещё `00b-library-inventory.js` → `keys/library-components.txt`.
Текстовые стили Library: `getLocalTextStylesAsync()` в Library → ключ, семейство (YaPS | HEn | HAr | YT), кегль,
начертание (S — Semibold/Bold, M — Medium).
