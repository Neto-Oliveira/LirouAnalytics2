FROM nginx:stable-alpine

LABEL maintainer="no-reply@example.com"

# Remove conteúdo padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia arquivos da aplicação
COPY index.html /usr/share/nginx/html/
COPY advanced-mode.html /usr/share/nginx/html/
COPY simple-mode.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js

# Se você tiver um nginx.conf customizado na pasta, copie-o para o nginx
# (substitui o /etc/nginx/nginx.conf do container)
# Se preferir usar apenas confs em /etc/nginx/conf.d, ajuste conforme preciso.
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]