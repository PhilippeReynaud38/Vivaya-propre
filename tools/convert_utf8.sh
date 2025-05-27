#!/usr/bin/env bash
set -euo pipefail
echo "🔍 Recherche des fichiers non UTF-8…"

git ls-files | while read -r f; do
  mime=$(file -bi "$f")
  case "$mime" in
    *charset=utf-8*|*charset=binary*) : ;;      # déjà bon
    *)
      enc=$(echo "$mime" | sed 's/.*charset=//')
      echo "⚙️  Convertit $f ($enc → utf-8)"
      tmp=$(mktemp)

      if iconv -f "$enc" -t utf-8 "$f" > "$tmp" 2>/dev/null; then
        mv "$tmp" "$f"
      else
        echo "❌ échec conversion $f"
        rm "$tmp"
      fi
    ;;
  esac
done

echo "✅ Conversion terminée. Commit…"
git add $(git ls-files)
git commit -m "chore/encodage: convert all text files to UTF-8"
echo "👍 tout est maintenant en UTF-8 (commit isolé)."
