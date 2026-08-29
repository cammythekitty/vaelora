#!/bin/bash
set -e

REPO_DIR="/srv/vaelora"
NGINX_CONF="/etc/nginx/sites-available/vaelora.dev"

echo "==> Setting up vaelora.dev..."

# Symlink nginx config if repo has one
if [ -f "$REPO_DIR/nginx.conf" ]; then
    echo "==> Linking nginx config..."
    ln -sf "$REPO_DIR/nginx.conf" "$NGINX_CONF"
    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/vaelora.dev
else
    echo "==> Writing nginx config..."
    cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name vaelora.dev www.vaelora.dev;

    root $REPO_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF
    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/vaelora.dev
fi

echo "==> vaelora.dev done."