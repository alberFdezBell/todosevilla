# =============================================================================
# Imagen del Proxy Inverso Nginx para Todo Sevilla
# - Incluye el nginx.conf personalizado (resolver dinámico de Swarm)
# - Genera sus propios certificados SSL autofirmados en el arranque
# - No depende de ningún archivo del host (/opt/todosevilla/nginx)
# =============================================================================
FROM nginx:alpine

# OpenSSL para generar los certificados autofirmados en el arranque
RUN apk add --no-cache openssl

# Configuración personalizada del proxy (reemplaza a la de nginx:alpine)
COPY nginx.conf /etc/nginx/nginx.conf

# Entrypoint: genera certs si faltan y arranca nginx en primer plano
COPY proxy-entrypoint.sh /usr/local/bin/proxy-entrypoint.sh
RUN chmod +x /usr/local/bin/proxy-entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/usr/local/bin/proxy-entrypoint.sh"]