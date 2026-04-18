<?php
return [
	'routes' => [
		// Маршрут для главной страницы
		['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
		// Маршрут для сохранения бронирования
		['name' => 'page#reserve', 'url' => '/reserve', 'verb' => 'POST'],
		['name' => 'page#cancel', 'url' => '/cancel/{id}', 'verb' => 'POST'],
	    ['name' => 'page#saveLimit', 'url' => '/saveLimit', 'verb' => 'POST'],
	    ['name' => 'page#confirm', 'url' => '/confirm/{id}', 'verb' => 'POST'],
    ]
];
