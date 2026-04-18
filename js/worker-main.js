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
					    cellClass = 'clickable';
					
					    // Если админ - добавляем ему в ячейку спец. атрибут со всеми ID записей
					    if (window.workerData.isAdmin) {
					        const ids = cellBookings.map(b => b.id).join(',');
					        dataIdAttr = `data-ids="${ids}"`; // Сохраняем все ID через запятую
					    } else if (myBooking) {
					        dataIdAttr = `data-id="${myBooking.id}"`; // Обычный юзер видит только свой ID
					    }
					
					    // Содержимое ячейки
					    let icon = res; // По умолчанию Д или Н
					    if (myBooking) icon = '<b>X</b>';
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
	//		console.log("Данные от сервера:", data);
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
    if (mInput && !mInput.value) {
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
		
        // Ищем всех записанных в эту ячейку в глобальном массиве
        const cellBookings = window.workerData.bookings.filter(b => 
            b.shift_date === date && String(b.brigade_id) === String(brigade)
        );

        // ЛОГИКА УДАЛЕНИЯ (Для админа)
        if (isAdmin && cellBookings.length > 0) {
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
        if (myBookingId) {
            alert('Вы уже записаны. Для отмены обратитесь к администратору.');
        } else if (target.classList.contains('full-cell')) {
            alert('Мест больше нет!');
        } else {
            const type = target.getAttribute('data-type');
            reserveShift(date, brigade, type, target);
        }
    });

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
    if (!content) return;

    const bookings = (window.workerData && window.workerData.bookings) ? window.workerData.bookings : [];
    const isAdmin = window.workerData.isAdmin === true || window.workerData.isAdmin === 'true';

    if (bookings.length === 0) {
        content.innerHTML = '<p style="color: #666;">Список пуст</p>';
        return;
    }

    const sorted = [...bookings].sort((a, b) => new Date(a.shift_date) - new Date(b.shift_date));

    let html = '<table class="bookings-table" style="width: auto; min-width: 500px; border-collapse: collapse; font-size: 14px;">';
    html += '<tr style="border-bottom: 2px solid #007bff; text-align: left; color: #555;">' +
            '<th style="padding: 8px 20px 8px 0;">Дата</th>' +
            '<th style="padding: 8px 20px;">Бригада</th>' +
            '<th style="padding: 8px 20px;">Сотрудник</th>';
    
    if (isAdmin) {
        html += '<th style="padding: 8px 0;">Действие</th>';
    }
    html += '</tr>';
    
    sorted.forEach(b => {
        html += `<tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 8px 20px 8px 0; white-space: nowrap;">${b.shift_date}</td>
                    <td style="padding: 8px 20px;">Бригада №${b.brigade_id}</td>
                    <td style="padding: 8px 20px;"><strong>${b.displayname || b.user_id}</strong></td>`;
        
        if (isAdmin) {
  			 html += `<td style="padding: 8px 0;">
                <button class="admin-delete-btn" 
                        data-id="${b.id}"
                        style="background: none; border: none; color: #d11d1d; cursor: pointer; text-decoration: underline; padding: 0; font-size: 13px;">
                    Удалить
                </button>
             </td>`;
        }
        html += '</tr>';
    });

    html += '</table>';
    content.innerHTML = html;	
}
//=============================================================================
function saveLimitOnServer(date, brigade, slots) {
    fetch(OC.generateUrl('/apps/worker/saveLimit'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'requesttoken': OC.requestToken,
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ date, brigade, slots })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            location.reload(); // Перезагружаем для обновления сетки
        } else {
            alert('Ошибка при сохранении лимита');
        }
    });
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
