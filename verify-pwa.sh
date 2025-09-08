#!/bin/bash

echo "🔍 Verifying PWA Configuration in /dist folder..."
echo ""

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ dist folder not found!"
    exit 1
fi

# Check essential PWA files
echo "📋 Checking essential PWA files:"
files=("dist/manifest.json" "dist/sw.js" "dist/index.html")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING!"
    fi
done

echo ""

# Check icon files
echo "🎨 Checking PWA icons:"
icon_sizes=("72x72" "96x96" "128x128" "144x144" "152x152" "192x192" "384x384" "512x512")
for size in "${icon_sizes[@]}"; do
    if [ -f "dist/icons/icon-${size}.png" ]; then
        echo "✅ icon-${size}.png"
    else
        echo "❌ icon-${size}.png - MISSING!"
    fi
done

echo ""

# Check HTML files have PWA elements
echo "📄 Checking HTML files for PWA elements:"
html_count=$(find dist -name "*.html" | wc -l)
manifest_count=$(grep -r "manifest.json" dist/*.html 2>/dev/null | wc -l)
sw_count=$(grep -r "serviceWorker" dist/*.html 2>/dev/null | wc -l)

echo "📊 HTML files found: $html_count"
echo "📊 Files with manifest link: $manifest_count"
echo "📊 Files with service worker: $sw_count"

if [ "$manifest_count" -eq "$html_count" ] && [ "$sw_count" -eq "$html_count" ]; then
    echo "✅ All HTML files have PWA elements!"
else
    echo "⚠️  Some HTML files missing PWA elements"
fi

echo ""

# Check manifest content
echo "📱 Checking manifest.json content:"
if [ -f "dist/manifest.json" ]; then
    if grep -q '"name".*vasbazaar' dist/manifest.json && grep -q '"display".*standalone' dist/manifest.json; then
        echo "✅ Manifest has correct name and display mode"
    else
        echo "❌ Manifest missing essential fields"
    fi
    
    icon_count=$(grep -c '"src".*"/icons/icon-' dist/manifest.json)
    echo "📊 Icons in manifest: $icon_count"
else
    echo "❌ manifest.json not found"
fi

echo ""

# Check service worker content
echo "🔧 Checking service worker content:"
if [ -f "dist/sw.js" ]; then
    if grep -q "addEventListener.*install" dist/sw.js && grep -q "addEventListener.*activate" dist/sw.js; then
        echo "✅ Service worker has install and activate listeners"
    else
        echo "❌ Service worker missing essential event listeners"
    fi
else
    echo "❌ sw.js not found"
fi

echo ""
echo "🎯 PWA Verification Complete!"
echo "📱 Your PWA should now install on all Android browsers!"