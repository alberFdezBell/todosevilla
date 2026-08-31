#!/bin/sh
# =============================================================================
# Entrypoint del proxy Nginx de Todo Sevilla.
# Genera un certificado SSL autofirmado si no existe y arranca nginx.
# Variables opcionales:
#   PROXY_CERT_CN  -> CN y SAN principal del certificado (por defecto 192.168.0.60)
#   CERT_DAYS      -> días de validez (por defecto 365)
# =============================================================================
set -e

CERT_DIR="${CERT_DIR:-/etc/nginx/certs}"
CERT_CN="${PROXY_CERT_CN:-192.168.0.60}"
DAYS="${CERT_DAYS:-365}"

CERT_FILE="$CERT_DIR/server.crt"
KEY_FILE="$CERT_DIR/server.key"

# Construir el subjectAltName según si el CN es una IP o un hostname
case "$CERT_CN" in
  *[0-9].[0-9]*)
    if echo "$CERT_CN" | grep -qE '^[0-9.]+$'; then
      SAN="IP:$CERT_CN,IP:127.0.0.1,DNS:localhost"
    else
      SAN="DNS:$CERT_CN,DNS:localhost,IP:127.0.0.1"
    fi
    ;;
  *)
    SAN="DNS:$CERT_CN.local,DNS:localhost,IP:127.0.0.1"
    ;;
esac

if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
  echo "Certificados existentes en $CERT_DIR. No se regeneran."
else
  mkdir -p "$CERT_DIR"
  echo "Generando certificado autofirmado para $CERT_CN (SAN: $SAN)..."
  openssl req -x509 -nodes -days "$DAYS" -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/CN=$CERT_CN" \
    -addext "subjectAltName = $SAN"
  echo "Certificado generado en $CERT_DIR."
fi

echo "Arrancando nginx..."
exec nginx -g 'daemon off;'