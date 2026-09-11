#!/bin/bash
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -not -path "./node_modules/*" -not -path "./dist/*" | while read -r file; do
  # Remove rounded corners
  sed -i -E 's/rounded-[a-zA-Z0-9-]+//g' "$file"
  sed -i -E 's/ rounded([ "])/ \1/g' "$file"
  sed -i -E 's/"rounded /"/g' "$file"
  
  # Progress Insights border radius for recharts
  sed -i -E 's/radius=\{\[4, 4, 0, 0\]\}/radius=\{[0, 0, 0, 0]\}/g' "$file"
  
  # Change indigo to blue
  sed -i 's/indigo-50\b/slate-50/g' "$file"
  sed -i 's/indigo-100\b/slate-200/g' "$file"
  sed -i 's/indigo-200\b/slate-300/g' "$file"
  sed -i 's/indigo-300\b/slate-400/g' "$file"
  sed -i 's/indigo-400\b/blue-500/g' "$file"
  sed -i 's/indigo-500\b/blue-700/g' "$file"
  sed -i 's/indigo-600\b/blue-800/g' "$file"
  sed -i 's/indigo-700\b/blue-900/g' "$file"
  sed -i 's/indigo-800\b/blue-950/g' "$file"
  sed -i 's/indigo-900\b/slate-900/g' "$file"
done
