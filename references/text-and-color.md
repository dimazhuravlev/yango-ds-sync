# Тексты, цвета, режимы бренда

## Текстовые стили

В макетах — только 28 стилей 🫟 Library (`keys/library-text-styles.txt`): YaPS Headline 56…24, Yango Play & Allplay
Headline En / Ar 56…24, Yango Text 24 / 18 / 15 / 13 / 11 Semibold и Medium.

Файлы шрифтов за стилями (их и загружать в Figma, и называть человеку): начертание **Semibold** в стилях — это файл
**Bold**; Medium — Medium.

| Стиль | Yango Play и Allplay | ЯПС |
|---|---|---|
| Text …/Medium | Yango Text Medium | YS Text Medium |
| Text …/Semibold, Title …/Semibold | Yango Text Bold | YS Text Bold |
| Headline | Yango Group Headline ExtraBold (Ar — Yango Group Headline AR) | YS Display Bold |

Основа — страница Library «Base / Typography» (`b8maDlvYFFs2vagJxwxc4A`, node `7529:2161`): у Yango Text / YS Text пять
кеглей — 11, 13, 15, 18, 24 (крупнее 24 — Headline). Semibold — 18 и 24, текст кнопок и заголовок навбара (15); Medium —
11, 13, 15. **Regular и Bold не используются нигде**: Regular в макете — баг, даже внутри чужого кита или устаревшего
компонента. YS Text Bold, который рисует Semibold-стиль Library в режиме ЯПС, — норма. Regular переводится в стиль Library
ближайшего кегля шкалы (ничья → меньший: 14 → 13, 12 → 11), начертание — по кеглю.

| Класс текста | Что делать |
|---|---|
| стиль Library своего бренда | ничего |
| чужой стиль (Платформа, Regular, Loose, Caps, 10 px, Lead, Кинопоиск…), стиль Library другого бренда | ближайший стиль Library |
| без стиля (в том числе часть текста) | точный двойник по семейству, целому кеглю и начертанию; нет двойника — в отчёт |

Ближайший: семейство → кегль (ничья → меньший) → начертание (Bold / Semi / Heavy / Black / Extra → Semibold, иначе
Medium). Заголовочные шрифты (Yango Group Headline, YS Display, Yango Headline) и любой кегль ≥ 28 → Headline своего
бренда ближайшего кегля; для Yango Play Yango Text ≥ 28 → `Title S・24`. Видимые последствия, которые считаются нормой:
Loose → обычный межстрочный (бейджи на 2 px ниже), бейдж таббара 10 → 11, Graphik → Yango Text, длинная лента может
стать на несколько десятков px длиннее из-за межстрочных.

Не трогать: системные шрифты и киты (SF Pro, Roboto, iOS/Android), тексты внутри компонентов не из Library (меняются
в своих мастерах) — кроме Regular Yango Text / YS Text: его 06 переводит переопределением и там, дробные кегли (масштабированные копии), экспериментальные шрифты (Yango Headline ML 2 Black, Yango
Group Headline Var Heavy, YS Market VF), подписи прямо на холсте, тексты кита оформления Органайзера. Внутри инстанса
Library чужой стиль меняется переопределением (06 делает); если чужой стиль в самом мастере — это хвост Library.

Скрипт: `scripts/pipeline/06-text-styles.js` — `BRAND`, `ONLY` (экраны пачками по ~10), сначала `DRY = true`.

## Бренд и режимы

- Бренд определяется по каждому экрану, в одном файле бывают разные:

  | Бренд | Как узнать | `Product` | `Typography` | `BRAND` в 06 | Варианты компонентов |
  |---|---|---|---|---|---|
  | ЯПС | YS Text / YS Display, `App=YaPS`, `product=YaPS` | `YaPS` | `YS Text` | `'YaPS'` | `YaPS` |
  | Yango Play | Yango Text / Yango Group Headline, `App=Yango Play` | `Yango Play` | `Yango` | `'Yango'` | `Yango Play` / `Yango` |
  | Allplay | явный режим `Product=Allplay` на экране или предке, «Allplay» в имени файла, страницы или секции | `Allplay` | `Yango` | `'Yango'` | своих нет — спросить |

  По шрифтам Allplay не отличить от Yango Play: у обоих Yango Text и Yango Group Headline. Нет ни одного признака
  Allplay, а файл может быть Allplay, — спросить один раз на файл. У компонентов Library (кнопка `accent`, `Tabbar`,
  `Top Navigation`, чипсы, бейджи) вариантов Allplay нет: брать ли для Allplay варианты Yango Play — один вопрос
  пользователю на файл, до замен.
- Стили Text / Title Library берут семейство из переменных: `Typography` (Yango / Graphik / YS Text) и `Product`
  (Yango Play / YaPS / Allplay). **До привязки стилей** ЯПС-экранам ставится `Product=YaPS` и `Typography=YS Text`
  (`scripts/recipes/set-brand-modes.js`, или на фрейм страницы в `08-layout-page.js`), иначе YS Text превратится в
  Yango Text. Режим меняет и шрифты внутри компонентов Library на экране — это ожидаемо: они становятся шрифтом бренда.
- `BRAND` в 06: `'YaPS'` — YaPS Headline + Text; `'Yango'` — Headline En / Ar + Text, для Yango Play и Allplay.
- Режимы ставить всем экранам не своего режима по умолчанию: ЯПС — `Product=YaPS`, `Typography=YS Text`; Allplay —
  `Product=Allplay`, `Typography=Yango`. Yango Play — режим по умолчанию.
- Явный режим `Theme=Light` внутри экранов (например подложка под шторкой) — намеренный, не трогать.

## Переменные

- На своих узлах макета (не внутри инстансов) — только коллекции из `sources.md`. Чужая переменная → двойник с тем
  же значением в рабочем режиме (обычно `Theme`); значение в другом режиме расходится — сказать в отчёте. Скрипт —
  `07-variables.js` (сначала без `REBIND`).
- Сырой цвет → переменная `Theme` / `Product` только при полном совпадении hex и альфы в режиме экрана. Шаг по
  умолчанию, после `07`: `scripts/pipeline/07b-colors-to-variables.js`. Цвет без переменной не трогать, картинки и
  градиенты тоже. Внутри инстанса Library — только если цвет отличается от мастера; одинаковый с мастером — хвост ДС,
  в отчёт. Фон секций и подписи прямо на холсте не трогать: это не макет.
- Объекты на холсте без своего режима берут режим коллекции по умолчанию (у `Theme` — Dark). Если в файле дефолт
  другой, привязка на холсте поменяет вид: проверить `resolvedVariableModes` до записи.
- Переменная чужой или отключённой библиотеки на инстансе Library может быть намеренной раскраской — не чинить.

| Переменная Theme | Роль |
|---|---|
| `Fill/One` | белый: подписи кнопок, активный таб Music |
| `Fill/Five` | белый 60 %: неактивный таб, серый текст |
| `Fill/Subtitle` | белый 50 %: описание и значение в ячейках |
| `Accent colors/Primary` | активный таб Yango Play |
| `Surface/One`, `Surface/Two` | чёрный фон, фон секций оформления (#141414) |
| `Buttons/Primary`, `Buttons/Secondary`, `Buttons/Inverted`, `Buttons/Extra One` | фоны кнопок |

## Эффекты

Чужие эффект-стили на своих узлах — отвязать со значениями (своих эффект-стилей в Library нет). Тень кита оформления
`x/shadow/frame` — оставить.
