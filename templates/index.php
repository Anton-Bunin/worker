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
	<!-- 	<button id="refresh-btn">Обновить!</button> -->	
	</div>

   <div id="tables-container"></div>

	<table id="tabel">
		<thead><tr id="header-days"></tr></thead>
		<tbody id="tabel-body"></tbody>
	</table>
 
		<div class="bookings-list-header" style="display: flex; align-items: center; gap: 10px; background: #f1f1f1; padding: 5px 10px; border-radius: 5px 5px 0 0; border: 1px solid #ddd; border-bottom: none; margin-top: 20px;">
		    <span style="font-weight: bold; font-size: 12px; color: #555;">Список записей:</span>
		    <select id="list-filter-month" style="font-size: 12px; padding: 1px;"></select>
		    <input type="number" id="list-filter-year" style="width: 55px; font-size: 12px; padding: 1px;">
		    <button id="sync-list-filter" title="Синхронизировать с календарем" style="padding: 1px 5px; font-size: 11px; cursor: pointer;">🔄</button>
		</div>
		<div id="bookings-list-content" style="border: 1px solid #ddd; border-radius: 0 0 5px 5px;"></div>

   <!-- Место для списка бронирований -->
	<div id="bookings-list-container" style="margin-top: 30px; padding: 20px; background: #fdfdfd; border: 1px solid #ddd; border-radius: 8px; max-width: 600px;">
	    <h3 style="margin-top: 0;">Работа в выходной:</h3>
	    <div id="bookings-list-content"></div>
	</div>
	
</div>

<div id="server-data" 
	data-bookings='<?php p(json_encode($_['bookings'])); ?>' 
	style="display:none;">
</div>
<div id="shift-counter" style="margin-bottom: 10px; font-weight: bold; color: #007bff;"></div>

</div>


