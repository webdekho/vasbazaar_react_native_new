#!/bin/bash

# VasBazaar Web Production Deployment Script
# This script builds and prepares the web app for production deployment

echo "🚀 Starting VasBazaar Web Production Build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "app" ]; then
    print_error "Please run this script from the VasBazaar root directory"
    exit 1
fi

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist/
rm -rf .expo/

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Build the production version
print_status "Building production web version..."
npx expo export --platform web

if [ $? -ne 0 ]; then
    print_error "Build failed! Please check the errors above."
    exit 1
fi

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build directory not found! Build may have failed."
    exit 1
fi

# Create production optimizations
print_status "Applying production optimizations..."

# Create .htaccess file for Apache servers
cat > dist/.htaccess << 'EOF'
# VasBazaar Production Configuration

# Enable GZIP compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/atom+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/x-shockwave-flash
</IfModule>

# Set cache headers
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/ico "access plus 1 year"
    ExpiresByType image/icon "access plus 1 year"
    ExpiresByType text/plain "access plus 1 month"
    ExpiresByType application/json "access plus 1 month"
    ExpiresByType text/html "access plus 10 minutes"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>

# Spa routing - redirect all requests to index.html for client-side routing
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Handle specific files and directories
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !\.(js|css|png|jpg|jpeg|gif|ico|svg|json|txt|xml|pdf|html)$ [NC]
    RewriteRule . /index.html [L]
</IfModule>

# Prevent access to sensitive files
<Files ~ "\.env$">
    Order allow,deny
    Deny from all
</Files>
EOF

# Create robots.txt for SEO
cat > dist/robots.txt << 'EOF'
User-agent: *
Allow: /

# Sitemap
Sitemap: https://vasbazaar.webdekho.in/sitemap.xml
EOF

# Create a simple sitemap.xml
cat > dist/sitemap.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://vasbazaar.webdekho.in/</loc>
        <lastmod>2024-08-30</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://vasbazaar.webdekho.in/home</loc>
        <lastmod>2024-08-30</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>https://vasbazaar.webdekho.in/wallet</loc>
        <lastmod>2024-08-30</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://vasbazaar.webdekho.in/history</loc>
        <lastmod>2024-08-30</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://vasbazaar.webdekho.in/profile</loc>
        <lastmod>2024-08-30</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>
</urlset>
EOF

# Create deployment info file
BUILD_DATE=$(date '+%Y-%m-%d %H:%M:%S')
BUILD_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
cat > dist/build-info.json << EOF
{
    "buildDate": "$BUILD_DATE",
    "commit": "$BUILD_COMMIT",
    "version": "1.0.0",
    "platform": "web",
    "environment": "production"
}
EOF

# Calculate build size
BUILD_SIZE=$(du -sh dist/ | cut -f1)

# Print deployment information
print_success "Production build completed successfully!"
echo
echo "📊 Build Information:"
echo "   Size: $BUILD_SIZE"
echo "   Date: $BUILD_DATE"
echo "   Commit: $BUILD_COMMIT"
echo
echo "📁 Build location: ./dist/"
echo
print_status "Files ready for deployment:"
echo "   • Static HTML files for all routes"
echo "   • Optimized JavaScript bundles"
echo "   • Compressed assets"
echo "   • Apache .htaccess configuration"
echo "   • SEO files (robots.txt, sitemap.xml)"
echo
print_warning "Deployment Instructions:"
echo "1. Upload the contents of 'dist/' directory to your web server"
echo "2. Ensure your server supports:"
echo "   • Apache mod_rewrite (for SPA routing)"
echo "   • GZIP compression (optional but recommended)"
echo "3. Point your domain to the uploaded directory"
echo "4. Test the deployment with: curl -I https://yourdomain.com"
echo
echo "🌐 For vasbazaar.webdekho.in deployment:"
echo "   rsync -avz --delete dist/ user@server:/path/to/vasbazaar.webdekho.in/"
echo
print_success "Ready for production deployment! 🚀"