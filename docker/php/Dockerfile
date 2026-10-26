FROM php:8.3-fpm-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends git unzip libzip-dev libicu-dev libonig-dev libpng-dev libxml2-dev \
 && docker-php-ext-install pdo_mysql mbstring zip intl bcmath opcache \
 && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
