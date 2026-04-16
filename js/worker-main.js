/**
 * Данные графиков бригад
 */
const schedules = {
	1: { start: '2024-12-30', pattern: ['Д', 'Д', '', 'Н', 'Н', '', '', ''] },
	2: { start: '2025-01-01', pattern: ['Д', 'Д', '', 'Н', 'Н', '', '', ''] },
	3: { start: '2025-01-03', pattern: ['Д', 'Д', '', 'Н', 'Н', '', '', ''] },
	4: { start: '2024-12-28', pattern: ['Д', 'Д', '', 'Н', 'Н', '', '', ''] }
};

// Получаем брони из Nextcloud
//const savedBookings = OC.getInitialState('worker', 'bookings') || [];

// Читаем данные из скрытого дива
const dataEl = document.getElementById('server-data');
const savedBookings = dataEl ? JSON.parse(dataEl.getAttribute('data-bookings')) : [];
const currentUserId = dataEl.getAttribute('data-current-user');

const bookingId = target.dataset.id; // Предположим, ты хранишь ID записи в DOM

const workerData = OC.generateInitialState('worker', 'bookings_data');
console.log(workerData.bookings); // Проверь в консоли, данные теперь тут!

console.log("Загруженные бронирования:", savedBookings);
//=============================================================================
/**
 * Основная функция отрисовки
 */
function render() {
	const monthInput = document.getElementById('month');
	const yearInput = document.getElementById('year');
	const monthsCountInput = document.getElementById('monthsCount');
	const daysFilterInput = document.getElementById('daysFilter');

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
}
//=============================================================================
function createTable(month, year, daysFilter) {
	const table = document.createElement('table');
	const daysInMonth = new Date(year, month, 0).getDate();
	const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

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
	//		const res = getBrigadeForDay(bId, d, month, year);
			let res = getBrigadeForDay(bId, d, month, year);
			if (res === 'Д') dayCount++;
			if (res === 'Н') nightCount++;

			if (filteredDays.length === 0 || filteredDays.includes(d)) {
				let cellClass = '';
				if (res === 'Д') cellClass = 'day';
				if (res === 'Н') cellClass = 'night';
				
				if (res === 'Д' || res === 'Н') {
					cellClass += ' clickable';
				}

				const dStr = String(d).padStart(2, '0');
				const mStr = String(month).padStart(2, '0');
				const dateStr = `${year}-${mStr}-${dStr}`;

				// Ищем, есть ли бронь на эту дату и бригаду
				const booking = savedBookings.find(b => b.shift_date === dateStr && b.brigade_id == bId);

				if (booking) {
					cellClass += ' reserved'; // Добавь этот класс в CSS (например, красный фон)
					res = 'X'; // Или оставь Д/Н, но с пометкой
				}

				html += `<td class="${cellClass}" data-date="${dateStr}" data-brigade="${bId}" data-type="${res}">${res}</td>`;
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
    // 0. Получаем данные от бэкенда (те самые, что передали через InitialState)
    const workerData = OC.generateInitialState('worker', 'bookings_data') || { bookings: [] };

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

    // 3. Слушаем клики по таблице (Делегирование)
    document.addEventListener('click', function(e) {
        const target = e.target.closest('.clickable'); // Используем closest для точности
        if (!target) return;

        const bookingId = target.getAttribute('data-id'); // Проверяем, есть ли уже бронь

        if (bookingId) {
            // Если ID есть — это УДАЛЕНИЕ
            if (confirm('Удалить вашу запись?')) {
                cancelShift(bookingId, target);
            }
        } else {
            // Если ID нет — это ЗАПИСЬ (твой старый метод)
            const date = target.getAttribute('data-date');
            const brigade = target.getAttribute('data-brigade');
            const type = target.getAttribute('data-type');
            reserveShift(date, brigade, type, target);
        }
    });

    render();
}
//==========================================================================================
function cancelShift(id, element) {
    fetch(OC.generateUrl('/apps/worker/cancel/' + id), {
        method: 'POST',
        headers: {
            'requesttoken': OC.requestToken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            element.classList.remove('booked');
            element.removeAttribute('data-id');
            element.innerHTML = element.getAttribute('data-day'); // Возвращаем только число
        }
    });
}
//=============================================================================
// Поехали!
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initApp);
} else {
	initApp();
}

window.render = render;
