#!/bin/bash

# VasBazaar Build Verification Script
# Verifies that the production build is ready for deployment

echo "🔍 Verifying VasBazaar production build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_TOTAL=0

# Function to check and report
check_item() {
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Function to check file exists and report size
check_file() {
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    if [ -f "$1" ]; then
        SIZE=$(ls -lh "$1" | awk '{print $5}')
        echo -e "${GREEN}✓${NC} $2 (${SIZE})"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $2 - File not found"
    fi
}

echo "📁 Checking build directory structure..."

# Check main build directory
check_item "[ -d 'dist' ]" "Build directory exists"

# Check essential files
check_file "dist/index.html" "Main entry point"
check_file "dist/home.html" "Home page"
check_file "dist/wallet.html" "Wallet page"
check_file "dist/history.html" "History page"
check_file "dist/profile.html" "Profile page"

# Check JavaScript bundles
echo
echo "📦 Checking JavaScript bundles..."
JS_DIR="dist/_expo/static/js/web"
if [ -d "$JS_DIR" ]; then
    JS_COUNT=$(find "$JS_DIR" -name "*.js" | wc -l)
    if [ $JS_COUNT -gt 0 ]; then
        echo -e "${GREEN}✓${NC} JavaScript bundles found ($JS_COUNT files)"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        
        # Check bundle sizes
        for js_file in "$JS_DIR"/*.js; do
            if [ -f "$js_file" ]; then
                filename=$(basename "$js_file")
                size=$(ls -lh "$js_file" | awk '{print $5}')
                echo "  • $filename (${size})"
            fi
        done
    else
        echo -e "${RED}✗${NC} No JavaScript bundles found"
    fi
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
else
    echo -e "${RED}✗${NC} JavaScript directory not found"
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
fi

# Check assets
echo
echo "🖼️  Checking assets..."
if [ -d "dist/assets" ]; then
    ASSET_COUNT=$(find "dist/assets" -type f | wc -l)
    echo -e "${GREEN}✓${NC} Assets directory found ($ASSET_COUNT files)"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗${NC} Assets directory not found"
fi
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

# Check configuration files
echo
echo "⚙️  Checking configuration files..."
check_file "dist/.htaccess" "Apache configuration"
check_file "dist/robots.txt" "SEO robots file"
check_file "dist/sitemap.xml" "SEO sitemap"
check_file "dist/build-info.json" "Build information"
check_file "dist/favicon.ico" "Favicon"

# Check PayU callback files
echo
echo "💳 Checking PayU integration files..."
check_file "dist/payu-callback.html" "PayU callback handler"
check_file "dist/test-payu.html" "PayU testing interface"

# Check route files
echo
echo "🛣️  Checking route files..."
ROUTE_FILES=(
    "dist/(tabs)/home.html"
    "dist/(tabs)/wallet.html"
    "dist/(tabs)/history.html"
    "dist/(tabs)/profile.html"
    "dist/auth/LoginScreen.html"
    "dist/auth/OtpScreen.html"
    "dist/main/AllServicesScreen.html"
    "dist/main/QrPrintScreen.html"
    "dist/main/common/PaymentScreen.html"
    "dist/main/common/SuccessScreen.html"
    "dist/main/common/PendingScreen.html"
    "dist/main/common/FailedScreen.html"
)

ROUTE_COUNT=0
for route in "${ROUTE_FILES[@]}"; do
    if [ -f "$route" ]; then
        ROUTE_COUNT=$((ROUTE_COUNT + 1))
    fi
done

check_item "[ $ROUTE_COUNT -gt 10 ]" "Essential route files ($ROUTE_COUNT found)"

# Check for common issues
echo
echo "🔧 Checking for common issues..."

# Check HTML file sizes (they should be substantial, not empty)
HTML_SIZE_ISSUES=0
for html_file in dist/*.html; do
    if [ -f "$html_file" ]; then
        SIZE=$(stat -f%z "$html_file" 2>/dev/null || stat -c%s "$html_file" 2>/dev/null || echo "0")
        if [ "$SIZE" -lt 1000 ]; then
            echo -e "${YELLOW}⚠${NC}  $(basename "$html_file") seems unusually small (${SIZE} bytes)"
            HTML_SIZE_ISSUES=$((HTML_SIZE_ISSUES + 1))
        fi
    fi
done

if [ $HTML_SIZE_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All HTML files have reasonable sizes"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${YELLOW}⚠${NC}  Found $HTML_SIZE_ISSUES potentially problematic HTML files"
fi
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

# Check for missing critical features
CRITICAL_FEATURES=("_expo" "assets" "auth" "main")
MISSING_FEATURES=0
for feature in "${CRITICAL_FEATURES[@]}"; do
    if [ ! -d "dist/$feature" ]; then
        echo -e "${RED}✗${NC} Missing critical directory: $feature"
        MISSING_FEATURES=$((MISSING_FEATURES + 1))
    fi
done

if [ $MISSING_FEATURES -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All critical directories present"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗${NC} Missing $MISSING_FEATURES critical directories"
fi
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

# Calculate build size and report
echo
echo "📊 Build Statistics:"
TOTAL_SIZE=$(du -sh dist/ | cut -f1)
FILE_COUNT=$(find dist/ -type f | wc -l)
echo "   • Total size: $TOTAL_SIZE"
echo "   • Total files: $FILE_COUNT"
echo "   • Build date: $(date)"

# Final report
echo
echo "📋 Verification Summary:"
echo "   • Checks passed: $CHECKS_PASSED/$CHECKS_TOTAL"

PASS_PERCENTAGE=$((CHECKS_PASSED * 100 / CHECKS_TOTAL))

if [ $PASS_PERCENTAGE -ge 90 ]; then
    echo -e "${GREEN}🎉 Build verification PASSED${NC} (${PASS_PERCENTAGE}% success rate)"
    echo -e "${GREEN}✅ Ready for production deployment!${NC}"
    exit 0
elif [ $PASS_PERCENTAGE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  Build verification PASSED with warnings${NC} (${PASS_PERCENTAGE}% success rate)"
    echo -e "${YELLOW}🔧 Some issues detected but deployment may proceed${NC}"
    exit 0
else
    echo -e "${RED}❌ Build verification FAILED${NC} (${PASS_PERCENTAGE}% success rate)"
    echo -e "${RED}🚫 Please fix issues before deployment${NC}"
    exit 1
fi