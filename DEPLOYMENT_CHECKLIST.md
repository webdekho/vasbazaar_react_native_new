# VasBazaar Web Production Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Verify PayU production credentials are correct
  - Merchant Key: `t88vPU`
  - Base URL: `https://secure.payu.in/_payment`
  - Callback domain: `https://vasbazaar.webdekho.in`
- [ ] Verify API base URL is correct: `https://apis.vasbazaar.com`
- [ ] Ensure all console.log statements are removed (handled by build)

### 2. Build Verification
- [ ] Run production build: `NODE_ENV=production npx expo export --platform web --output-dir dist-production --clear`
- [ ] Check bundle size (should be ~3MB)
- [ ] Verify all routes are exported (48 routes)
- [ ] Test locally before deployment

### 3. Server Requirements
- [ ] Apache 2.4+ or Nginx
- [ ] PHP 7.0+ (if needed for server-side operations)
- [ ] SSL certificate installed (HTTPS required for payments)
- [ ] mod_rewrite enabled (for Apache)
- [ ] mod_deflate enabled (for gzip compression)
- [ ] mod_expires enabled (for caching)
- [ ] mod_headers enabled (for security headers)

## Deployment Steps

### 1. Upload Files
```bash
# Upload the entire dist-production folder contents to your server
# Example using rsync:
rsync -avz --delete dist-production/ user@server:/var/www/vasbazaar.webdekho.in/

# Or using FTP/SFTP:
# Upload all files from dist-production to the document root
```

### 2. Set Permissions
```bash
# Set proper file permissions
find /var/www/vasbazaar.webdekho.in -type f -exec chmod 644 {} \;
find /var/www/vasbazaar.webdekho.in -type d -exec chmod 755 {} \;
```

### 3. Configure Web Server

#### For Apache:
- Ensure `.htaccess` file is in place and AllowOverride is set to All
- Enable required modules:
```bash
a2enmod rewrite deflate expires headers
service apache2 restart
```

#### For Nginx:
Add to your server block:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}

# Gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Security headers
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

### 4. Enable HTTPS
- [ ] Install SSL certificate
- [ ] Update .htaccess to force HTTPS (uncomment the HTTPS redirect lines)
- [ ] Enable HSTS header (uncomment in .htaccess)

### 5. Test Production Deployment

#### Basic Tests:
- [ ] Homepage loads correctly: `https://vasbazaar.webdekho.in`
- [ ] Navigation between pages works
- [ ] Login flow works
- [ ] Static assets load (images, fonts)
- [ ] API calls work (check network tab)

#### Payment Tests:
- [ ] Test PayU integration with small amount
- [ ] Verify callback URLs work correctly
- [ ] Check transaction status updates

#### Performance Tests:
- [ ] Run Google PageSpeed Insights
- [ ] Check load time < 3 seconds
- [ ] Verify gzip compression is working
- [ ] Check browser caching headers

## Post-Deployment

### 1. Monitoring
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure error logging
- [ ] Set up Google Analytics (if needed)

### 2. Backup
- [ ] Create initial backup of deployed files
- [ ] Set up automated daily backups

### 3. Security
- [ ] Run security scan
- [ ] Check for exposed sensitive files
- [ ] Verify all API endpoints use HTTPS

## Rollback Plan
Keep previous version backup:
```bash
# Before deployment
cp -r /var/www/vasbazaar.webdekho.in /var/www/vasbazaar.webdekho.in.backup

# To rollback
rm -rf /var/www/vasbazaar.webdekho.in
mv /var/www/vasbazaar.webdekho.in.backup /var/www/vasbazaar.webdekho.in
```

## Common Issues & Solutions

1. **404 errors on routes**: Check .htaccess mod_rewrite configuration
2. **Assets not loading**: Verify file permissions and paths
3. **PayU callback fails**: Ensure domain matches configured callback URLs
4. **Slow loading**: Enable gzip compression and browser caching
5. **CORS errors**: Check API server CORS configuration