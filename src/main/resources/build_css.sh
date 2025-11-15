#!/bin/bash
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2025 Benjamin Saff and contributors

set -e  # Exit on error

echo "Building Tailwind CSS..."
npm init -y;
npm i -D tailwindcss @tailwindcss/cli;
npx @tailwindcss/cli -i ./tailwind.css -o ./styles.css --minify

if [ ! -f ./styles.css ]; then
    echo "Error: styles.css was not generated"
    exit 1
fi

echo "Removing CSS comments..."
# Remove comment lines (lines starting with /* or containing only */)
sed -i.bak '/^\/\*/d; /^\*\//d; /^\/\//d' ./styles.css
rm -f ./styles.css.bak

echo "Reading CSS content..."
CSS_CONTENT=$(cat ./styles.css)

if [ -z "$CSS_CONTENT" ]; then
    echo "Error: styles.css is empty"
    exit 1
fi

echo "Injecting CSS into HTML template..."
TEMPLATE_FILE="./metrics-report-template.html"

if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "Error: Template file not found at $TEMPLATE_FILE"
    exit 1
fi

# Create a temporary file with the CSS replacement
# Replace content inside <style></style> tag with the actual CSS content
# Reading CSS directly in awk to avoid shell variable expansion issues
awk '
BEGIN {
    # Read the entire CSS file
    while ((getline line < "./styles.css") > 0) {
        if (css != "") css = css "\n"
        css = css line
    }
    close("./styles.css")
    in_style = 0
}
{
    # Handle style tags that might be on the same line or span multiple lines
    if (/<style>/ && /<\/style>/) {
        # Both tags on same line - replace everything between them
        sub(/<style>.*<\/style>/, "<style>" css "</style>")
        print
        next
    }
    if (/<style>/) {
        # Opening tag found
        sub(/<style>.*$/, "<style>")
        print
        print css
        in_style = 1
        next
    }
    if (/<\/style>/) {
        # Closing tag found
        sub(/^.*<\/style>/, "</style>")
        print
        in_style = 0
        next
    }
    # Skip content inside style tags, print everything else
    if (!in_style) {
        print
    }
}
' "$TEMPLATE_FILE" > "$TEMPLATE_FILE.tmp"

# Replace the original file
mv "$TEMPLATE_FILE.tmp" "$TEMPLATE_FILE"

CSS_SIZE=$(wc -c < ./styles.css)

echo "✓ Success! CSS has been injected into $TEMPLATE_FILE"
echo "✓ Generated CSS size: $CSS_SIZE bytes"

# Clean up the styles.css file
rm -f ./styles.css
echo "✓ Cleaned up styles.css"
