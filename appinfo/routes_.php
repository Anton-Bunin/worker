<?php
return [
    'routes' => [
        // Маршрут для главной страницы
        ['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
        // Маршрут для сохранения бронирования
        ['name' => 'page#reserve', 'url' => '/reserve', 'verb' => 'POST'],
    ]
];