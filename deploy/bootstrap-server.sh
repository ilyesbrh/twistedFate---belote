#!/usr/bin/env bash
# One-shot bootstrap to be run *on the server* as root before the first
# CI/CD deploy. Idempotent — safe to re-run.
#
# Usage:  curl -fsSL <raw url> | sudo bash
# or:     scp this file to the server, then `sudo bash bootstrap-server.sh`

set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
APP_DIR="/opt/belote"
SITE_NAME="belote.3btechsolutions.com"

echo "── installing prerequisites ────────────────────────────────────"
apt-get update
apt-get install -y curl ca-certificates gnupg lsb-release nginx certbot python3-certbot-nginx

echo "── installing docker (skip if already present) ─────────────────"
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

echo "── creating non-root deploy user ───────────────────────────────"
if ! id -u "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash --groups docker "$DEPLOY_USER"
else
  usermod -aG docker "$DEPLOY_USER" || true
fi
mkdir -p "/home/$DEPLOY_USER/.ssh"
chmod 700 "/home/$DEPLOY_USER/.ssh"
touch "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"

echo
echo "  >>> Now paste your CI deploy public key into:"
echo "      /home/$DEPLOY_USER/.ssh/authorized_keys"
echo "      (one line per key — the matching private key goes into the"
echo "      DEPLOY_SSH_KEY GitHub secret)"
echo

echo "── creating /opt/belote dir owned by deploy user ───────────────"
mkdir -p "$APP_DIR"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

echo "── installing nginx site for $SITE_NAME ────────────────────────"
SITE_SRC="$(dirname "$(readlink -f "$0")")/nginx.belote.conf"
if [[ -f "$SITE_SRC" ]]; then
  install -m 0644 "$SITE_SRC" "/etc/nginx/sites-available/$SITE_NAME"
  ln -sf "../sites-available/$SITE_NAME" "/etc/nginx/sites-enabled/$SITE_NAME"
  nginx -t && systemctl reload nginx
else
  echo "  >>> nginx.belote.conf not found next to this script. Copy it"
  echo "      manually to /etc/nginx/sites-available/$SITE_NAME and"
  echo "      enable it with the symlink above."
fi

cat <<MSG

── done ────────────────────────────────────────────────────────
Next steps (manual):
  1. Add the deploy public key to:
       /home/$DEPLOY_USER/.ssh/authorized_keys
  2. Lock down SSH:
       sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
       sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
       systemctl restart sshd
  3. Enable HTTPS (after DNS for $SITE_NAME points here):
       certbot --nginx -d $SITE_NAME
  4. From your laptop, capture the host key for GitHub secrets:
       ssh-keyscan -t ed25519,rsa,ecdsa $SITE_NAME
  5. Trigger a deploy by pushing to main, or run the workflow manually.

GitHub repo secrets to set (Settings → Secrets and variables → Actions):
  DEPLOY_HOST          $SITE_NAME (or the raw IP)
  DEPLOY_USER          $DEPLOY_USER
  DEPLOY_SSH_KEY       <full contents of the private key file>
  DEPLOY_KNOWN_HOSTS   <output of ssh-keyscan from step 4>

The GitHub Actions workflow uses the built-in GITHUB_TOKEN to log into
GHCR — no separate registry credential needed.
MSG
