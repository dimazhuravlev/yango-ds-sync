# Двойники: чем заменять неактуальное и каким рецептом

Двойник — актуальный компонент 🫟 Mobile · Library, 🦄 Графики или 🦄 Органайзера того же назначения, что и легаси-,
❌-, удалённый или чужой компонент в макете. Он не обязан совпадать по слоям: подписи, картинки и геометрия переносятся
рецептом, при расхождении замена откатывается.

Ключи ниже — первые 8 символов (для переписи достаточно); полный ключ любого компонента Library —
`keys/library-components.txt`. Скрипты: `scripts/pipeline/` (основной путь) и `scripts/recipes/` (частные случаи).

## Как выбрать рецепт

| Ситуация | Рецепт |
|---|---|
| Двойник — копия старого (та же схема слоёв), один ключ → один ключ | `04d-swap-by-key.js` (пачкой по странице, откат поштучно) |
| То же, но слои переименованы (сняли `❌`, в т.ч. в середине имени) | `04-swap-namepath.js` |
| Приватный `. /` Library стоит на экране и устарел (перепись: `stalePrivate`) | `04-swap-namepath.js` с `via:<публичный родитель>:<приватный>` |
| Постер `. / card / poster` с картинкой и бейджами | `05-refresh-card.js` |
| Структура разная (пресет → мастер, ряд кнопок → ряд чипсов, форк-таббар) | `recipes/swap-with-geometry.js` или частный рецепт ниже |
| Мастер удалён (мёртвый), двойник есть | создать инстанс двойника на месте по ролям (`recipes/replace-dead-button.js` — образец) |
| Мастер удалён, двойника нет | не менять, в отчёт |
| Призрак (локальный мастер удалён) с двойником того же имени | `recipes/swap-ghosts-by-name.js` |
| Отвязанная копия (фрейм с именем компонента) | `recipes/replace-detached-generic.js` (именной повтор), `recipes/replace-detached-roles.js` (по ролям), `04c-replace-detached-group.js` / `recipes/detached-carousel-to-library.js` (карусели) |
| Неактуальное внутри инстанса Library | хвост мастера ДС: в проекте не чинить, в отчёт |

Перед любой заменой: подписи, картинки, видимость и размеры снять **до** свапа — после него старые узлы мертвы.
Проверка в том же вызове (`throw` откатывает весь вызов), затем скриншоты до/после 1–2 штук, потом остальные.

## Системные элементы (старая Платформа и копии → Library)

| Было | Стало | Особенности |
|---|---|---|
| `❌ status-bar / ios` `50094d41`, status bar китов | `status-bar / ios` `79c6f520` | вложенный `right` несёт вариант online/type — переносить; время не сверять |
| `❌ home-indicator / ios` `fb1859a6`, `home-indicator / ios` других китов | `home-indicator / ios` `e471214d` | |
| `❌ keyboard / iOS` `21080408`, android `60628b58` | `keyboard / iOS` `4ad1547b`, `keyboard / android` `fcf8b0f0` | тот же вариант; отвязанная клавиатура из рядов `_Key` — `recipes/replace-detached-keyboard.js` |
| navigation-bar / android, Android Statusbar + Quick Settings / Cellular / Wifi / Battery | `604bdb58`, `35accda9`, `21c0e1ef`, `0c96025f`, `b2ff67af`, `7f1d75ca` | |
| action-sheet / iOS, alerts / iOS (+ master) | `ce882661`, `baa580e6`, `a645cd4d`, `5fca4981`, `6e86ee45` | SF Pro у MCP может не быть |
| input `832169f9` | `37574dac` | |
| `❌ navbar` `fcd19e7c` | `navbar` `c90308b6` | 04: простой свап теряет заголовок и поиск; `Type=large` в Library нет |
| topnavbar `b49cf330`, `. / navbar / searchbar` `e4b2b1d0` | `topnavbar` `e7da8559`, `. / navbar / searchbar` `a74e185f` (приватный, изнутри `navbar`) | |
| spinner `bd4deb2e` / `3eec4ec6`, `. / spinner` | `spinner` `bbe582b4` (`orange` → `brand`, прочие → `default`) | |
| divider `d5c94411`, toggle `c4ba5913`, pager `0f5986c2` | `divider` `755af8e8`, `toggle` `416a58a9`, `pager` `5ad158cc` | pager: `Overflow=true` → `Page Count=8+`, `Step` тот же |
| seasons `afa87086`, `.segmented-controls / season` | `seasons` `9b526ca8`, `.segmented-controls / season` `ee16c213` | |
| hint (+ text / action / corner) | `f4cf27af`, `80360607`, `3af6500c`, `6b46276b` | |
| text-label `1aae7f7e` (+ title / description / caption / note) | `text-label` `3f786cb0` (+ `ef1de233`, `a4e53cd2`, `2d413511`, `99653826`) | старая версия с `Size=small/medium/large` — не двойник, переносить по ролям |
| `. / text-label / note` (удалённый) | `text-label / note` `99653826` | вариант + `, RTL=off` |
| `❌ Fade` `7dfd1cca`, `Fade` форка `f1b6b517` | `Fade` `f494f9f9` | тот же вариант; абсолютная позиция, констрейнты, размер вернуть |
| `❌ modal-sheet / header` `18319d19` | `modal-sheet / header` `933411c8` | |
| modal-sheet `5ae25873` (+ placeholder / close) | `Bottom Sheet` `d196f493` `Platform=iOS, Type=Halfscreen` (+ `acef1351` placeholder, `ac2d7d33` close) | размер и видимость заглушки вернуть; `primaryAxisAlignItems = SPACE_BETWEEN`; контент — локальный мастер в слот placeholder |
| avatars `173c5995` (+ aura / progress / no-ava), avatar `23d69bcc` | `avatars` `84b7cfbd` (+ `89221aa3`, `ef5ba360`, `6cb2cf43`) | `100px → 112`, `Plus → Subscription`, картинку перенести; размеры старых S/M могут не совпасть — спросить |
| error `23ae2de0` | `error` `6ac1cb2e` | |
| Communication / Fullscreen `e9b21036`, / Tour Update `317ecefc` | `8195d6fe`, `98c8ae93` | те же оси |
| My Yango Subscription Widget, Family Widget старых версий | `My Yango Subscription Widget` `5e410880`, `Family Widget` `9fae06ee` | тот же вариант; если тексты варианта в Library другие — вернуть свои по порядку видимых текстов |
| `cell / description` `7377c6db` отдельно, подписью под полем (не в ячейке) | `text-label / note` `99653826` (ошибка — `Type=alert`, красный) или `text-label / description` `a4e53cd2` | текст через свойство `Text`, ширина FILL, выравнивание текста вернуть (шрифт грузить после вставки: в ЯПС он YS Text) |
| toast (+ text / action / helper), dialogue, informer, segmented-controls | `toast` `d582cd43` для фрейма «иконка + текст»; остальным двойника нет | |

## Кнопки → `button` `2781fb17`

Оси: `Size` = `S • 32px` | `M • 40px` | `L • 48px` | `XL • 52px` (символ `•` дословно, размера 44 нет); `Type` =
`accent Yango Play` | `accent YaPS` | `secondary` | `white` | `dark` | `plain`; `Icon` = `false` | `leading` |
`trailing` | `only`; `State` = `default` | `preloader` | `preloader + text` | `disabled`; подпись — `Text#5391:0`.

| Старый `Type` | `❌ button` `4a588e2a`, тёмная `d8b30834` | предок `5f513748` (светлая тема) |
|---|---|---|
| `primary` | `secondary` | `secondary` |
| `secondary`, `extra-2` | `secondary` | `secondary` / `white` (`extra-2` у предка белая) |
| `inverted` | `white` | `dark` |
| `extra-1` | `dark` | `white` |
| `primary-strict` | — | `dark` |
| `plain` | `plain` | `plain` |
| `accent` (без продукта), `accent Yango Play`, `accent YaPS` | акцент бренда экрана | `accent` бренда экрана |

Акцента Allplay у `button` нет: на Allplay-экране акцентную кнопку не автозаменять — один вопрос на файл, брать ли
`accent Yango Play`.

Размеры: `sm • 32px` → `S`, `md • 40px` → `M`, `lg • 44px` → `M`, `xl • 48px` → `L`, `2xl • 52px` → `XL`. `Icon` и
`State` — как были. Рецепт: `recipes/replace-dead-button.js` (вариант из имени мастера, подпись, глиф, геометрия;
акцент — по бренду экрана, `BRAND_ACCENT='auto'`). Любая другая кнопка — по цвету фона и подписи мастера к типу
таблицы; не подходит ни один — спросить. Контейнер 40×40 с круглыми кнопками-иконками (`❌ Buttons` `8728d5ec`) →
`button` `M • 40px, Icon=only` + глиф (`recipes/replace-tabs-with-chips.js`).

## Таббар → `Tabbar` `d20586ba`

Оси: `App` = `Yango Play` | `Yango Music` | `YaPS` × `Active tab` × `Platform` = `iOS/Android` | `iPad` × `RTL` =
`False` | `True`. Табы: Yango Play — Watch · Search · Music · My Yango; Yango Music — Discover · Search · Collection;
YaPS — Home · Kinopoisk · Music · Books · Profile (подписи на языке макета, значения оси английские).

| Было | Стало |
|---|---|
| `❌ Tabbar Mini App` `f748202c`, `App=Movies` | `Yango Play / Watch`; активная «My Collection» → `My Yango` |
| `❌ Tabbar Mini App`, `App=Main` (только логотип) | `Yango Play / Watch`, `iPad` |
| `❌ Tabbar Mini App`, `App=Music` | `Yango Music / Discover`; «My Collection» → `Collection` |
| `Tabbar YaPS` `f9c1d940`, форк `Tabbar` `93ac8e5d` (`App=YPS`) | `YaPS`, активный таб из имени варианта |
| SuperApp `tabbar` `c190b3d4` с табами | `Yango Music` / `Discover` или `Collection` |
| SuperApp `tabbar` — голая полоска 34 px | `home-indicator / ios` |
| `Tablet view=on` / `RTL=on` | `Platform=iPad` / `RTL=True` |

Рецепт: `recipes/swap-tabbar.js` (swap + `resetOverrides` + геометрия). После — `recipes/fix-tabbar-overrides.js`
(«невидимые» оверрайды: 6-й таб, высота 102) и `recipes/tabbar-tint-audit.js` (цвет подписей и глифов: неактивный
`Fill/Five`, активный `Accent colors/Primary` у Yango Play, `Fill/One` у Yango Music). Мини-плеер рядом —
`recipes/bottom-bar.js`.

## Верхняя навигация → `Top Navigation` `7b401b38`

Оси: `App` = `Yango Play` | `YaPS`; `Type` — Yango Play: `Watch`, `Music`, `My Yango`, `Profile`, `Second level`;
YaPS: `Watch`, `Music`, `Books`, `Header`, `Profile`, `Second level`, `Multishowcase`, `Multishowcase central`;
`Platform` = `mobile` (375) | `tablet` (1024) по ширине экрана (граница 400); `RTL`; булево `Controls#458:0`.

| Было | Стало |
|---|---|
| `Top Navigation Yango Master` (тот же ключ `7b401b38`) | `App=Yango Play, Type=<тот же>` (`Main` → `Watch`) |
| `Top Navigation * Miniapps Compilation` (`759929d7`, `f7b6f8e6`, форк `dc845bc7`, `❌` `798fab40`) | `Type=<Miniapp>` (`Multishowcase Central` → `Multishowcase central`, `My Yango New` → `Profile`); `Size=Small` → `mobile`, `Normal` → `tablet`; `Controls` по виду старого (у пресетов кнопок часто не было) |
| `Top Navigation YaPS Master` `27e3b984`, `❌ Top Navigation Master` форка | `App=YaPS`: `Main Header Only` → `Header`, `second level` → `Second level` |
| `header-menu` `1768dbb4` `Type=Movies` (Watch + табы) | `App=Yango Play, Type=Watch`; контент поднимается на 36 px |
| `header-menu` `Type=Music, Tabs=off` (логотип + кнопки) | `App=Yango Play, Type=Music` |
| `header-menu` `Type=Music, Tabs=on` — только ряд табов | `chips-row` (ниже) |

Рецепт: swap → `resetOverrides()` → ширина экрана (`FILL` в auto-layout, иначе x/y + resize) → `Controls` явно →
подписи табов сверить (при смене `Platform` могут сброситься на «Супер Таб»). Шапка поверх прокручиваемого
контента без своего градиента → добавить `Fade` `Platform=iOS, Gradient=Scroll Contrast, Tab level=off`: ширина
экрана × 210, перевёрнут по вертикали (`relativeTransform = [[1,0,0],[0,-1,210]]`), у верхнего края, под
статус-баром и шапкой, констрейнты CENTER / MIN; у `status-bar / ios` выключить сплошную заливку.

## Чипсы

- `chips-row` `552e8650` (`RTL=False|True`, 5 чипсов `chip 1…5`, 375, clip) — ряды табов-кнопок (`❌ Tabs`
  `7d2c36a6`, `Navigation Tabs` `e58a0307`, ряд табов `header-menu`): подписи видимых кнопок → `chip N` по порядку,
  лишние скрыть, первый `Active=on <бренд>` (`recipes/replace-tabs-with-chips.js`). Больше 5 — оставить рядом
  отдельных `chips-rounded`.
- `chips-rounded` / `chips` `3ee666c7`: `Type=default|navigation`, `Active=off|on Yango Play|on YaPS`. Мёртвые
  чипсы чужих китов (`d36e1806`) — `recipes/replace-dead-chips.js`.

## Шапки

| Было | Стало |
|---|---|
| `❌ header / static` `dda77164`, `header` `a0ad828e` (шапки секций) | `header / static-old` `77b566d2`: `large → Large` (56 → 54), `medium/small` как есть, `xSmall → XSmall`; корень вернуть в hug (`recipes/replace-header-static.js`) |
| `. / header / right` `e0a7af5f` | `. / header / right` `6316fcc0` через `via:77b566d2…:6316fcc0`, `Type=action` |
| фрейм `header / static` (шапка карусели: title + стрелка + description) | `header` `409e75f2` `RTL=off, type=static` (или `top10`): видимость description и action по старому; 48 → 52 px (`recipes/replace-detached-roles.js` JOB `header`) |
| брендированная шапка с картинкой-фоном | двойника нет |

## Ячейки → `cell / master` `2fe06e4e`, `cell / action` `b80f60a4`

Легаси: `cell / master` Платформы `4d1e64cf` и форков (`0b6f6c34`), вложенные `cell / title` / `cell / description`,
`cell / action` `f9650030` / `fe2a44df`, `cell / counter`, таблицы `grouped-simple` `5d529a96` / `-island` `ce505682`.
В Library заголовок и описание встроены (фрейм `title`, текст `description`), `cell / action` без `value weak`
(`value`/`text`/`value weak` → `value strong`, станет тусклее), счётчик встроен в `Type=counter`. Таблицы →
`grouped-simple` `236fb2bb` / `grouped-island` `219c9c7d` по слотам `01…10`. Рецепт: `recipes/swap-cell-master.js`
(роли: булевы, тексты, тип и глиф helper/action, текст значения, шеврон, разделители). Слоты таблиц переименованы
в `01…10`, поэтому считать ячейки по вложенным текстам, а не по имени слоя.

## Карточки и карусели

- `. / card / poster` устаревший (`d2146131`) → свежий через `card / poster / default` `28f153dd` — `05-refresh-card.js`
  (картинка, заголовок, булевы, бейджи; второй подписи нет — включить слот description). «Замок» в слоте рейтинга →
  `Show upsale`.
- `card / poster / originals` `56cdd039`: ось называется `State`, не `Type`.
- Отвязанная карусель «Library `header` + ряд `card / poster / *`» → `carousel / Movies` `4d1844b6` целиком:
  `recipes/detached-carousel-to-library.js` (слоты 01…06 свапаются на мастер старой карточки, лишние скрыты). `Type=top
  10` есть только в `Size=medium` — карусель топ-10 на small-карточках не менять.
- Карусели и карточки Music (легаси MiniApp Mob) → `carousel / Music / small|medium|large` (`d7a3396c` / `ad174d02` /
  `652eb5fb`), `card / music / *`: свап носителя сбрасывает содержимое — снять заголовок, вид, вариант, `imageHash` и
  подписи каждой карточки, после свапа вернуть вид отдельным свапом слота. Картинку брать строго с ноды `image`
  (у artist-карточки плейсхолдер на `card`).
- `card / music / open playlist` `5858c3ae`, `Promo Block` `1b90a4bb` (`Content=title, Platform=phone`): отвязанные
  копии — `recipes/replace-detached-generic.js`; промоблок со своим порядком слоёв — JOB `promo` в
  `recipes/replace-detached-roles.js` (описание в `meta/stack`, бейдж по видимости старого top-10).
- `title / phone` `6a55e9f3` (удалён) → `title` `8f6df4d2` `type=movie, platform=mobile` — `recipes/title-phone-to-title.js`;
  описание режется до 3 строк — дизайн компонента.
- `image` чужой `044d8118` → Графика `image` `72de5ae1` по имени варианта (`type` = 1:1 … 9:16).
- `. / card / collections` не удалять: картинки карточек держатся оверрайдом по полному пути узлов.

## Иконки → 🦄 Графика

Свап на глиф Графики того же размера (`Size` = ширина фрейма) и перенос тинта (смена глифа не перекрашивает
вектор). Ключи: play `05871833`, pause `2cb76178`, more `13f02368`, cross `3f93ae8c`, bookmark `8db71239`, share
`36147b6c`, love `b5bc6de3`, love-no `63a72114`, dropright `d36dc815`, dropleft `cdef2f36`, lock `dd271798`, rating
`ed7cef4b`, download `51642e90`, repeat `f7636ea8`, shuffle `648e836e`, play-prev `2dcd87f0`, play-next `bc786f1c`,
fullscreen `9968589e`, sound-max `84c162d3`, update `0bfeeeda`, playlist `e23aa6aa`, artist `15351fc7`, album
`5b32a68b`, timer `4a5e51a7`, time `6f7ed27a`, tv-music `a1aabea5` (полные — `keys/grafika-sets.txt` и опись).
Значки качества: `ff9c0c98` → `a67d588e`, `37021fee` → `f3a8657e`, `f8a1cd30` → `e7e90652`. Нативные иконки
старых китов внутри `cell / action` (`icons / size16 / dropright`, `icons / size24 / done`…) → Графика того же
размера. Иконка-точка 3×3 в мета-строке — не трогать.

## Без двойника (оставлять, в отчёт)

Компоненты книжной читалки, кита чужого сервиса (карточка тайтла, навбары), экранов авторизации; удалённые мастера
без двойника (`Subscription Header`, `.header-logo`, фоны пейвола, наборы концепт-витрин); локальные мастера-концепты
(свой таббар с другими табами, кнопка 60 px, карточка с отражением) — замена меняет вид, только с согласия;
двухподписные кнопки «Читать | Слушать»; `prompt-card` и прочие концепт-компоненты.
