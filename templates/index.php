<?php
declare(strict_types=1);
use OCP\Util;

Util::addScript('worker', 'worker-main'); 
Util::addStyle('worker', 'worker-main');
?>

<div id="worker">
    <div class="container">
        <h2>График работы бригад</h2>
        
        <div class="controls">
            <label>Месяц: <input type="number" id="month" min="1" max="12"></label>
            <label>Год: <input type="number" id="year"></label>
            <label>Месяцев: <input type="number" id="monthsCount" min="1" max="12" value="3"></label>
            <label>Дни: <input type="text" id="daysFilter" placeholder="1,5,24" style="width: 100px;"></label>
        </div>

        <!-- Контейнер для календарей -->
        <div id="tables-container"></div>

        <!-- Единый контейнер для списка (ТЕПЕРЬ ВНУТРИ .container) -->
        <div id="bookings-list-container" style="margin-top: 20px; background: #fff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; width: 100%;"> 
            <!-- Шапка со встроенным заголовком и фильтрами -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 15px; background: #f8f9fa; border-bottom: 1px solid #ddd;">
                <h3 style="margin: 0; font-size: 16px; color: #333;">Работа в выходной</h3>
                
                <div style="display: flex; gap: 8px; align-items: center;">
                    <select id="list-filter-month" style="font-size: 12px; padding: 2px; border-radius: 3px; border: 1px solid #ccc;"></select>
                    <input type="number" id="list-filter-year" style="width: 60px; font-size: 12px; padding: 2px; border-radius: 3px; border: 1px solid #ccc;">
                    <button id="sync-list-filter" title="Синхронизировать" style="cursor: pointer; border: 1px solid #ccc; background: #fff; border-radius: 3px; padding: 1px 5px;">🔄</button>
                </div>
            </div>

            <!-- Место для самой таблицы -->
            <div id="bookings-list-content"></div>
        </div>

        <div id="shift-counter" style="margin-top: 15px; font-weight: bold; color: #007bff;"></div>
    
    </div> <!-- Конец .container -->
</div> <!-- Конец #worker -->

<div id="server-data" 
    data-bookings='<?php p(json_encode($_['bookings'] ?? [])); ?>' 
    style="display:none;">
</div>
