# صورة الإنتاج: نبني الواجهة ثم ننسخ كل شيء لصورة PHP-FPM خفيفة (بدون dev dependencies).
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist --optimize-autoloader --ignore-platform-reqs

FROM node:22-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY resources ./resources
COPY public ./public
COPY vite.config.js tsconfig.json components.json ./
COPY --from=vendor /app/vendor ./vendor
# متغيرات VITE_* تُدمج وقت البناء (عنوان Reverb العام الذي يتصل به المتصفح)
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST
ARG VITE_REVERB_PORT=443
ARG VITE_REVERB_SCHEME=https
ARG VITE_APP_NAME
RUN npm run build

FROM php:8.4-fpm-alpine
RUN apk add --no-cache nginx supervisor libzip-dev icu-dev libpng-dev libjpeg-turbo-dev freetype-dev oniguruma-dev bash \
 && docker-php-ext-configure gd --with-jpeg --with-freetype \
 && docker-php-ext-install pdo_mysql zip intl gd bcmath pcntl mbstring opcache \
 && apk add --no-cache --virtual .build $PHPIZE_DEPS && pecl install redis && docker-php-ext-enable redis && apk del .build
COPY deploy/php.ini /usr/local/etc/php/conf.d/zz-prod.ini
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY deploy/supervisord.conf /etc/supervisord.conf
WORKDIR /var/www/html
COPY . .
COPY --from=vendor /app/vendor ./vendor
COPY --from=assets /app/public/build ./public/build
RUN rm -rf docker tests tools pendev node_modules .git storage/ui-* \
 && mkdir -p storage/framework/{cache,sessions,views} storage/logs storage/app/private storage/app/mpdf bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/up >/dev/null || exit 1
COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
