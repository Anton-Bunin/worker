<?php

declare(strict_types=1);

use OCP\Util;

Util::addScript('worker', 'worker-main'); 
Util::addStyle('worker', 'worker-main');

?>

<div id="worker">

    <title>Табель</title>
<div class="container">
    <h2>График работы бригад</h2>
    
	<div class="controls">
		<label>Месяц: <input type="number" id="month" min="1" max="12"></label>
		<label>Год: <input type="number" id="year"></label>
		<label>Месяцев: <input type="number" id="monthsCount" min="1" max="12" value="3"></label>
		<label>Дни: <input type="text" id="daysFilter" placeholder="1,5,24" style="width: 100px;"></label>
		<button id="refresh-btn">Обновить!</button>
	</div>

   <div id="tables-container"></div>

	<table id="tabel">
		<thead><tr id="header-days"></tr></thead>
		<tbody id="tabel-body"></tbody>
	</table>
	
   <!-- Место для списка бронирований -->
	<div id="bookings-list-container" style="margin-top: 30px; padding: 20px; background: #fdfdfd; border: 1px solid #ddd; border-radius: 8px; max-width: 600px;">
	    <h3 style="margin-top: 0;">Текущие бронирования:</h3>
	    <div id="bookings-list-content"></div>
	</div>
	
</div>

<div id="server-data" 
	data-bookings='<?php p(json_encode($_['bookings'])); ?>' 
	style="display:none;">
</div>
<div id="shift-counter" style="margin-bottom: 10px; font-weight: bold; color: #007bff;"></div>

</div>


