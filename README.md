# yango-ds-sync

Скилл для Claude Code и Codex. Переводит мобильные макеты Yango, Allplay и суперапп Яндекс Плюс на актуальную дизайн-систему (🧩 Mobile · Library,
🦄 Графика, 🦄 Органайзер, 🌈 Стили) через Figma MCP, ничего не ломая. Перед работой сам проверяет, что всё готово,
и просит недостающее.

## Что делает скилл

- Находит устаревшие компоненты библиотек, ❌-компоненты, отвязанные копии и заменяет их на компоненты актуальных
  дизайн-систем, учитывая бренды Yango Play, Allplay или ЯПС.
- Привязывает тексты к стилям типографики, а цвета — к переменным.
- Наводит порядок в слоях: убирает пустые обёртки и даёт слоям понятные семантические имена.
- По желанию приводит экраны к размеру 375 × 812 и оформляет разделы по Органайзеру.

## Что нужно один раз

- Claude Code или Codex.
- Figma MCP с правом записи:
  - Claude Code: официальный плагин Figma, в нём сразу MCP и скилл `figma-use`. В терминале
    `claude plugin install figma@claude-plugins-official`, перезапустить Claude Code, затем подключить аккаунт Figma:
    `/plugin` → Installed → figma → Allow access.
  - Codex: `codex mcp add figma --url https://mcp.figma.com/mcp`; в приложении Codex — плагин Figma.
- Full seat в Figma и право редактировать файл, который переводим.
- Шрифты бренда, доступные в Figma: Yango Play и Allplay — Yango Text и Yango Group Headline; ЯПС — YS Text и YS Display.
  Если Figma их не видит, загрузить: Settings → Your uploaded fonts. Скилл сам проверит и подскажет.
- python3 (на macOS ставится вместе с Xcode Command Line Tools).

## Установка

Claude Code:

```bash
git clone https://github.com/dimazhuravlev/yango-ds-sync.git ~/.claude/skills/yango-ds-sync
```

Codex:

```bash
git clone https://github.com/dimazhuravlev/yango-ds-sync.git ~/.agents/skills/yango-ds-sync
```

Обновить до свежей версии (для Codex путь `~/.agents/skills/yango-ds-sync`):

```bash
git -C ~/.claude/skills/yango-ds-sync pull
```

## Как работать

1. Открыть файл в Figma и сохранить версию: Cmd+Opt+S. Название любое, лишь бы потом найти, например «до ДС».
2. Запустить скилл и вставить ссылку на проект в Figma. Обновления библиотек пока не принимать.
   - Claude Code: `/yango-ds-sync https://www.figma.com/design/…`
   - Codex: `$yango-ds-sync https://www.figma.com/design/…`
3. Делать то, что попросит скилл: подтвердить версию словом «сохранил»; после слепка «до» принять обновления
   библиотек (Assets → Libraries → Updates → Update all) и написать «готово»; иногда — загрузить шрифты или подключить
   к файлу библиотеки ДС (🧩 Mobile · Library, 🦄 Графика, 🦄 Органайзер, 🌈 Стили).
4. Ответить на вопросы — скилл присылает их одним списком со ссылками.
5. Проверить отчёт: что переведено, что не тронуто и почему, что осталось решить.

Пока скилл работает, файл лучше не править.
