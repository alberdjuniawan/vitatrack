FROM node:22-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build || true

RUN mkdir -p public/build

FROM php:8.4-fpm AS builder
ENV COMPOSER_ALLOW_SUPERUSER=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl zip unzip \
    libpq-dev libzip-dev \
    libpng-dev libjpeg-dev libfreetype6-dev libwebp-dev \
    libonig-dev postgresql-client \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) \
        pdo pdo_pgsql pgsql \
        mbstring zip gd bcmath opcache pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis opcache

RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.memory_consumption=256'; \
    echo 'opcache.interned_strings_buffer=16'; \
    echo 'opcache.max_accelerated_files=20000'; \
    echo 'opcache.validate_timestamps=0'; \
    echo 'opcache.revalidate_freq=0'; \
    echo 'opcache.save_comments=1'; \
} > /usr/local/etc/php/conf.d/opcache.ini

RUN sed -i 's/;clear_env = no/clear_env = no/' /usr/local/etc/php-fpm.d/www.conf

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

COPY --from=frontend /app/public/build ./public/build

RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

FROM builder AS app
COPY init.sh /usr/local/bin/init.sh
RUN chmod +x /usr/local/bin/init.sh
EXPOSE 9000
CMD ["/usr/local/bin/init.sh"]

FROM nginx:alpine AS web
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /var/www/html/public /var/www/html/public
EXPOSE 80
