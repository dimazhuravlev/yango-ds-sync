#!/bin/sh
# Скриншот Figma → картинка прямо в чате. Ссылку asset Figma приложение Claude прячет за «Show Image», относительный
# путь считается от корня сессии — работает только локальный PNG по абсолютному пути.
# Использование: sh scripts/shot.sh "<image_url из get_screenshot>" <имя> [папка, по умолчанию ./figma-shots]
# Печатает готовую строку markdown для ответа.
set -e
URL="$1"; NAME="$2"; DIR="${3:-$PWD/figma-shots}"
[ -n "$URL" ] && [ -n "$NAME" ] || { echo "usage: shot.sh <image_url> <name> [dir]" >&2; exit 1; }
mkdir -p "$DIR"; DIR="$(cd "$DIR" && pwd)"
curl -fsL -o "$DIR/$NAME.png" "$URL"
echo "![]($DIR/$NAME.png)"
