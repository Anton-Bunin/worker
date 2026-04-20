/**
 * Данные графиков бригад
 */
const schedules = {
	1: { start: '2024-12-30', pattern: ['Д', 'Д', '', 'Н', 'Н', '', '', ''] },
	2: { start: '2025-01-01', pattern: ['Д', 'Д', '', 'Н', 'Н', '', '', ''] },
	3: { start: '2025-01-03', pattern: ['Д', 'Д', '', 'Н', 'Н', '', '', ''] },
	4: { start: '2024-12-28', pattern: ['Д', 'Д', '', 'Н', 'Н', '', '', ''] }
};

let workerData = { bookings: [], currentUserId: '', isAdmin: false };
//=============================================================================
function formatDateShort(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr; // Защита от кривых дат
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2); 
    return `${day}.${month}.${year}`;
}
//=============================================================================
/**
 * Основная функция отрисовки
 */
function render() {
	const monthInput = document.getElementById('month');
	const yearInput = document.getElementById('year');
	const monthsCountInput = document.getElementById('monthsCount');
	const daysFilterInput = document.getElementById('daysFilter');
	const savedBookings = workerData.bookings || [];

	if (!monthInput || !yearInput) return;

	const month = parseInt(monthInput.value);
	const year = parseInt(yearInput.value);
	const monthsCount = parseInt(monthsCountInput.value) || 1;
	const daysFilter = daysFilterInput.value || "";

	const container = document.getElementById('tables-container');
	container.innerHTML = ''; 

	for (let i = 0; i < monthsCount; i++) {
		const currentMonth = ((month + i - 1) % 12) + 1;
		const currentYear = year + Math.floor((month + i - 1) / 12);
		container.appendChild(createTable(currentMonth, currentYear, daysFilter));
	}
	  renderBookingsList();
}
//=============================================================================
function createTable(month, year, daysFilter) {
	const table = document.createElement('table');
	const daysInMonth = new Date(year, month, 0).getDate();
	const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

	 // Если workerData не загрузился, используем пустой массив, чтобы не падать
    const savedBookings = (window.workerData && window.workerData.bookings) ? window.workerData.bookings : [];
	const limitsData = OCP.InitialState.loadState('worker', 'limits_data') || [];

	let filteredDays = [];
	if (daysFilter.trim() !== "") {
		filteredDays = daysFilter.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
	}

	let html = `<thead><tr><th colspan="${(filteredDays.length > 0 ? filteredDays.length : daysInMonth) + 2}" class="month-title">${monthNames[month - 1]} ${year} Г.</th></tr>`;
	html += `<tr><th class="brigade-col">Бригада</th>`;

	for (let d = 1; d <= daysInMonth; d++) {
		if (filteredDays.length === 0 || filteredDays.includes(d)) {
			const date = new Date(year, month - 1, d);
			const dayOfWeek = date.getDay();
			const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
			html += `<th class="${isWeekend ? 'weekend' : ''}">${d}</th>`;
		}
	}
	html += `<th>Итого</th></tr></thead><tbody>`;

	for (let bId in schedules) {
		html += `<tr><td class="brigade-col">Бриг. № ${bId}</td>`;
		let dayCount = 0;
		let nightCount = 0;

		for (let d = 1; d <= daysInMonth; d++) {
		    let res = getBrigadeForDay(bId, d, month, year); 
		    if (res === 'Д') dayCount++;
		    if (res === 'Н') nightCount++;
		
		    if (filteredDays.length === 0 || filteredDays.includes(d)) {
		        const dStr = String(d).padStart(2, '0');
		        const mStr = String(month).padStart(2, '0');
		        const dateStr = `${year}-${mStr}-${dStr}`;
		
		        // ТУТ МЫ УЖЕ ПРОСТО ИСПОЛЬЗУЕМ ПЕРЕМЕННУЮ limitsData	       
		        const limit = limitsData.find(l => l.shiftDate === dateStr && parseInt(l.brigadeId) === parseInt(bId));
		        
		        // Считаем все брони в этой ячейке
		        const cellBookings = savedBookings.filter(b => b.shift_date === dateStr && b.brigade_id == bId);
		        // Проверяем, записан ли текущий пользователь лично
		        const myBooking = cellBookings.find(b => b.user_id === window.workerData.currentUserId);
		
		        let cellClass = '';
		        let cellContent = ''; 
		        let dataIdAttr = '';
				
				// 2. ЛОГИКА ОТОБРАЖЕНИЯ
		        if (limit) {
					    const count = cellBookings.length;
					    const max = limit.maxSlots;
					    const myBooking = cellBookings.find(b => b.user_id === window.workerData.currentUserId);

					    cellClass = (res === 'Д') ? 'day clickable' : 'night clickable';
					    // Цветовая индикация
					    if (count === 0) {
					        cellClass += ' status-empty'; // Совсем пусто (опционально)
					    } else if (count >= max) {
					        cellClass += ' status-full';   // Мест нет - Красный
					    } else {
					        cellClass += ' status-available'; // Места есть - Зеленый
					    }		
					   
					// Если админ - добавляем ему в ячейку спец. атрибут со всеми ID записей
					    if (window.workerData.isAdmin) {
					        const ids = cellBookings.map(b => b.id).join(',');
					        dataIdAttr = `data-ids="${ids}"`; // Сохраняем все ID через запятую
					    } else if (myBooking) {
					        dataIdAttr = `data-id="${myBooking.id}"`; // Обычный юзер видит только свой ID
					    }
					
					    // Содержимое ячейки
					    let icon = res; // По умолчанию Д или Н
					    if (myBooking) icon = '<b>!</b>';
					    if (count >= max && !myBooking) icon = '<small>FULL</small>';
					
					    cellContent = `<div class="slot-info">${icon} <small>(${count}/${max})</small></div>`;
					    
					    // Добавляем класс, если ячейка не пустая (для админа)
					    if (count > 0) cellClass += ' has-records';
		        } else {
		            // Лимита нет - ячейка "выключена"
				    cellClass = 'no-limit'; 
				    cellContent =  `<div class="slot-info">${res}</div>`; // было "-"
		        }		
		        html += `<td class="${cellClass}" 
		                     ${dataIdAttr} 
		                     data-day="${d}" 
		                     data-date="${dateStr}" 
		                     data-brigade="${bId}" 
		                     data-type="${res}">
		                     ${cellContent}
		                 </td>`;
		    }
		}	
		
		html += `<td class="total">У:${dayCount} Н:${nightCount}</td></tr>`;
	}
	html += `</tbody>`;
	table.innerHTML = html;
	return table;
}
//=============================================================================
function getBrigadeForDay(bId, day, month, year) {
	const config = schedules[bId];
	if (!config) return '';
	const startDate = new Date(config.start);
	const currentDate = new Date(year, month - 1, day);
	const diffTime = currentDate - startDate;
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays < 0) return '';
	return config.pattern[diffDays % config.pattern.length];
}
//=============================================================================
/**
 * Логика бронирования
 */
function reserveShift(date, brigade, type, element) {
	const typeName = (type === 'Д') ? "ДНЕВНУЮ" : "НОЧНУЮ";
	
	if (confirm(`Забронировать ${typeName} смену на ${date}?`)) {
		console.log("Попытка отправки запроса...");

		// Формируем URL. Убедись, что 'worker' — это твой ID приложения!
		const url = OC.generateUrl('/apps/worker/reserve');
		console.log("URL запроса:", url);

		fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'requesttoken': OC.requestToken
			},
			body: JSON.stringify({
				date: date,
				brigade: parseInt(brigade),
				type: type
			})
		})
		.then(response => response.json())
		.then(data => {
			if (data.status === 'success') {
				element.style.backgroundColor = "#d4edda";
				alert("Запись сохранена.");
				location.reload();
			} else {
			        // Если сервер вернул ошибку (например, "Лимит превышен"), 
			        // она придет в data.message и покажется здесь:
			       alert(data.message); 
			}
		})
		.catch(err => {
			console.error(err);
			alert("Произошла ошибка при выполнении запроса");
		});
	}
}
//=============================================================================
/**
 * Инициализация
 */
function initApp() {		
	const stateElement = document.getElementById('initial-state-worker-bookings_data');
    if (stateElement) {
        try {
            let rawData = stateElement.value;
            if (rawData.charAt(0) !== '{') rawData = atob(rawData);
            window.workerData = JSON.parse(rawData); 
        } catch (e) {
            console.error("Ошибка парсинга данных:", e);
        }
    }
	
    const mInput = document.getElementById('month');
    const yInput = document.getElementById('year');
    if (mInput && !mInput.value)
	{
        const now = new Date();
        mInput.value = now.getMonth() + 1;
        yInput.value = now.getFullYear();
    }

    ['month', 'year', 'monthsCount', 'daysFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', render);
    });    
		
	document.addEventListener('click', function(e) {
	    // Проверка клика по кнопке "Удалить" в таблице
		 const deleteBtn = e.target.closest('.admin-delete-btn');
		    if (deleteBtn) {
		        const id = deleteBtn.dataset.id;
		        cancelShift(id, deleteBtn);
		        return; // Выходим, чтобы не сработали другие обработчики
		    }	

        // --- НОВЫЙ БЛОК: Проверка клика по кнопке "Одобрить" ---
        const confirmBtn = e.target.closest('.admin-confirm-btn');
        if (confirmBtn) {
            const id = confirmBtn.dataset.id;
            confirmShiftOnServer(id); // Вызываем функцию подтверждения
            return; 
        }
		
		const target = e.target.closest('.clickable') || e.target.closest('.no-limit'); 
        if (!target) return;

        const isAdmin = window.workerData.isAdmin === true || window.workerData.isAdmin === 'true';
        const date = target.getAttribute('data-date');
        const brigade = target.getAttribute('data-brigade');

		// Если админ кликнул по "выключенной" ячейке
		if (isAdmin && target && target.classList.contains('no-limit')) {
		    const date = target.getAttribute('data-date');
		    const brigade = target.getAttribute('data-brigade');
		    
		    const slots = prompt(`Активировать дату ${date}?\nВведите кол-во вакансий:`, "5");
		    if (slots !== null) {
		        saveLimitOnServer(date, brigade, parseInt(slots));
		    }
		    return; // Прерываем, чтобы не сработала логика обычной записи
		}    

		// Если админ кликнул по ячейке (неважно, активной или нет)
		if (isAdmin && target) 
		{
			// Используем Alt+Клик или клик по "выключенной", чтобы вызвать управление лимитом
			if (target.classList.contains('no-limit') || (e.altKey && target.classList.contains('clickable'))) {
				const date = target.getAttribute('data-date');
				const brigade = target.getAttribute('data-brigade');				
				const slots = prompt(`Управление вакансиями (${date}):\nВведите количество мест (0 — чтобы полностью отключить дату):`, "5");
				if (slots !== null) {
					saveLimitOnServer(date, brigade, parseInt(slots));
				}
				return;
			}
		}
		
		// ЗАЩИТА: Если это не админ и ячейка "выключена" — ничего не делаем
		if (!isAdmin && target.classList.contains('no-limit')) 
		{
		    console.log("Доступ закрыт: лимит на эту дату не установлен");
		    return; // Просто выходим из функции
		}		
		
        // Ищем всех записанных в эту ячейку в глобальном массиве
        const cellBookings = window.workerData.bookings.filter(b => 
            b.shift_date === date && String(b.brigade_id) === String(brigade)
        );

        // ЛОГИКА УДАЛЕНИЯ (Для админа)
        if (isAdmin && cellBookings.length > 0) 
		{
            let msg = `Записи на ${date}:\n`;
            cellBookings.forEach((b, i) => {
                msg += `${i + 1}. ${b.displayname || b.user_id}\n`;
            });

            if (confirm(msg + '\nУдалить последнюю запись из списка?')) {
                const idToDelete = cellBookings[cellBookings.length - 1].id;
                cancelShift(idToDelete, target);
            }
            return; 
        }

        // ЛОГИКА ЗАПИСИ (Если записей нет или лимит позволяет)
        const myBookingId = target.dataset.id; 
        if (myBookingId) 
		{
            alert('Вы уже записаны. Для отмены обратитесь к администратору.');
        } else if (target.classList.contains('full-cell')) {
            alert('Мест больше нет!');
        } else {
            const type = target.getAttribute('data-type');
            reserveShift(date, brigade, type, target);
        }
    });

			// Находим новые элементы
		const lMonth = document.getElementById('list-filter-month');
		const lYear = document.getElementById('list-filter-year');

		if (lMonth && lYear) {
			// Заполняем месяцы
			const mNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
			mNames.forEach((name, i) => {
				let opt = document.createElement('option');
				opt.value = i + 1;
				opt.textContent = name;
				lMonth.appendChild(opt);
			});

			// Устанавливаем начальные значения как в основном календаре
			lMonth.value = document.getElementById('month').value;
			lYear.value = document.getElementById('year').value;

			// Слушаем изменения
			lMonth.addEventListener('change', renderBookingsList);
			lYear.addEventListener('input', renderBookingsList);

			// Кнопка синхронизации
			document.getElementById('sync-list-filter').onclick = () => {
				lMonth.value = document.getElementById('month').value;
				lYear.value = document.getElementById('year').value;
				renderBookingsList();
			};	
		}
	
    // Вот он, на своем месте!
    render();  
}
//==========================================================================================
function cancelShift(id, element) {
    fetch(OC.generateUrl('/apps/worker/cancel/' + id), {
        method: 'POST',
        headers: {
            'requesttoken': OC.requestToken,
			'X-Requested-With': 'XMLHttpRequest' 
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Server error');
        return response.json();
    })
	.then(data => {
	    if (data.status === 'success') {
	        if (window.workerData && window.workerData.bookings) {
	            window.workerData.bookings = window.workerData.bookings.filter(b => b.id != id);
	        }	

			render();
	        console.log("Запись удалена локально и на сервере");			
	    }
	});
}
//=============================================================================
function renderBookingsList() {
     const content = document.getElementById('bookings-list-content');
    const fM = document.getElementById('list-filter-month');
    const fY = document.getElementById('list-filter-year');
    if (!content || !fM || !fY) return;
    const selM = parseInt(fM.value);
    const selY = parseInt(fY.value);
    const bookings = window.workerData.bookings || [];
    const isAdmin = window.workerData.isAdmin === true || window.workerData.isAdmin === 'true';
    const filtered = bookings.filter(b => {
        const d = new Date(b.shift_date);
        return (d.getMonth() + 1) === selM && d.getFullYear() === selY;
    });
    if (filtered.length === 0) {
        content.innerHTML = '<div style="padding:10px; font-size:12px; color:#999;">Нет записей</div>';
        return;
    }
    const sorted = [...filtered].sort((a, b) => new Date(a.shift_date) - new Date(b.shift_date));
    // СИЛОВОЙ МЕТОД: width: 100% + table-layout: fixed
    let html = '<table style="width: 100% !important; min-width: 100% !important; border-collapse: collapse; font-size: 13px; table-layout: fixed !important; margin: 0 !important;">';    
    // Заголовок с жесткими размерами (ширина Сотрудника НЕ указана, он заберет остаток)
    html += `<tr style="background:#f1f1f1; border-bottom:1px solid #ddd; height: 26px;">
                <th style="width: 80px !important; padding: 2px 8px; text-align: left;">Дата</th>
                <th style="width: 80px !important; padding: 2px 8px; text-align: left;">Бригада</th>
                <th style="width: auto !important; padding: 2px 8px; text-align: left;">Сотрудник</th>
                ${isAdmin ? '<th style="width: 170px !important; padding: 2px 8px; text-align: right;">Действие</th>' : ''}
            </tr>`;
    sorted.forEach(b => {
        const isP = b.status === 'pending';
        const shortDate = formatDateShort(b.shift_date);
        const dObj = new Date(b.shift_date);
        const isWeekend = (dObj.getDay() === 0 || dObj.getDay() === 6);
        const dateStyle = isWeekend ? 'color: red; font-weight: bold;' : '';

        // Начинаем строку. Важно: сбрасываем высоту
        html += `<tr style="border-bottom: 1px solid #eee; height: 15px !important; ${isP ? 'background:#fffcf5;' : ''}">
                    <td style="width: 80px !important; padding: 2px 8px; white-space: nowrap; ${dateStyle}">${shortDate}</td>
                    <td style="width: 70px !important; padding: 2px 8px; text-align: center;">${b.brigade_id}</td>
                    <td style="width: auto !important; padding: 2px 8px; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <strong title="${b.displayname || b.user_id}">${b.displayname || b.user_id}</strong>
                        ${isP ? ' <small style="color:orange; font-size:15px;"> (ожидаем подтверждение) </small>' : ''}
                    </td>`;
        
        if (isAdmin) {
            html += `<td style="width: 120px !important; padding: 2px 8px; text-align: right; white-space: nowrap;">
                        ${isP ? `<button class="admin-confirm-btn" data-id="${b.id}" style="font-size:9px; padding:0 4px; height: 14px; min-width: 50px; background:#2ecc71; color:#fff; border:none; border-radius:2px; cursor:pointer;">ОК</button>` : ''}
                        <button class="admin-delete-btn" data-id="${b.id}" style="font-size:13px; padding:0 4px; background:none; border:none; color:#e74c3c; text-decoration:underline; cursor:pointer;">Удалить</button>
                    </td>`;
        }
        html += '</tr>';
    });
    html += '</table>';    
    // Подвал с итогом
    html += `<div style="background:#f9f9f9; padding:4px 10px; font-size:11px; border:1px solid #ddd; border-top:none; text-align:right;">
                Всего подтвержденных: <strong>${filtered.filter(x => x.status === 'confirmed').length}</strong>
             </div>`;             
    content.innerHTML = html;
}
//=============================================================================
	function saveLimitOnServer(date, brigade, slots) {
	    const formData = new FormData();
	    formData.append('date', date);
	    formData.append('brigade', brigade);
	    formData.append('slots', slots);
	
	    fetch(OC.generateUrl('/apps/worker/saveLimit'), {
	        method: 'POST',
	        headers: {
	            'requesttoken': OC.requestToken,
	            'X-Requested-With': 'XMLHttpRequest'
	        },
	        body: formData
	    })
	    .then(response => {
	        if (!response.ok) throw new Error('Ошибка ' + response.status);
	        return response.json();
	    })
	    .then(data => {
	        if (data.status === 'success') {
	            location.reload(); 
	        } else {
	            alert('Ошибка: ' + (data.message || 'неизвестно'));
	        }
	    })
	    .catch(err => {
	        console.error('Ошибка сохранения:', err);
	        alert('Не удалось сохранить лимит. Проверьте логи.');
	    });
	}
//=============================================================================
	function confirmShiftOnServer(id) {
	    fetch(OC.generateUrl('/apps/worker/confirm/' + id), {
	        method: 'POST',
	        headers: {
	            'requesttoken': OC.requestToken,
	            'X-Requested-With': 'XMLHttpRequest'
	        }
	    })
	    .then(response => {
	        if (!response.ok) throw new Error('Ошибка сервера');
	        return response.json();
	    })
	    .then(data => {
	        if (data.status === 'success') {
	            // Обновляем статус локально в памяти, чтобы не перегружать страницу
	            const booking = window.workerData.bookings.find(b => b.id == id);
	            if (booking) booking.status = 'confirmed';
	            
	            render(); // Перерисовываем всё
	            console.log("Запись подтверждена");
	        }
	    })
	    .catch(err => alert('Ошибка при подтверждении: ' + err));
	}
//=============================================================================

// Поехали!
$(document).ready(function() {
    // Ждем, пока Nextcloud проинициализирует свои объекты
    OC.Plugins.register('core', {
        init: function() {
            initApp();
        }
    });
 initApp(); 
});	
window.render = render;
