#!/bin/bash

DIST_DIR="./build"

# Find all index files with any extension
find "$DIST_DIR" -type f -name 'index.*' | while read -r index_file; do
  parent_dir=$(dirname "$index_file")
  folder_name=$(basename "$parent_dir")
  grandparent_dir=$(dirname "$parent_dir")

  # Extract the original file extension
  ext="${index_file##*.}"

  target_file="$grandparent_dir/$folder_name.$ext"

  mv "$index_file" "$target_file"
  echo "✅ Moved: $index_file → $target_file"
done
