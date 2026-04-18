<?php
declare(strict_types=1);

namespace OCA\WORKER\Controller;

use OCA\WORKER\AppInfo\Application;
use OCA\WORKER\Db\LimitMapper;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Attribute\FrontpageRoute;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\Attribute\OpenAPI;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IDBConnection;
use OCP\IUserSession;
use OCP\IRequest;
use OCP\IInitialStateService;

class PageController extends Controller 
{
	private IDBConnection $db;
	private IUserSession $userSession;
	private IInitialStateService $initialStateService;
	private $limitMapper;

	// Конструктор, который "просит" у Nextcloud базу данных и юзера
	public function __construct(
		string $appName, 
		IRequest $request, 
		IDBConnection $db, 
		IUserSession $userSession,
		IInitialStateService $initialStateService,
		LimitMapper $limitMapper // Добавляем сюда
	) {
		parent::__construct($appName, $request);
		$this->db = $db;
		$this->userSession = $userSession;
		$this->initialStateService = $initialStateService;
		$this->limitMapper = $limitMapper;
	}

	//=====================================================================================================
	#[NoAdminRequired]
	#[NoCSRFRequired]
	public function reserve(string $date, int $brigade, string $type): JSONResponse {
		try {
			$user = $this->userSession->getUser();
			if ($user === null) {
				return new JSONResponse(['status' => 'error', 'message' => 'User not logged in'], 403);
			}
			$userId = $user->getUID();

			// --- НАСТРОЙКА ЛИМИТА ---
			$maxShifts = 5; // Поменяй на нужное тебе число
			// ------------------------

			// Считаем, сколько смен уже занял этот юзер в месяце выбранной даты
			$month = date('m', strtotime($date));
			$year = date('Y', strtotime($date));
			$monthPattern = $year . '-' . $month . '-%';

			$qb = $this->db->getQueryBuilder();
			$qb->select($qb->func()->count('*', 'cnt'))
				->from('worker_bookings')
				->where($qb->expr()->eq('user_id', $qb->createNamedParameter($userId)))
				->andWhere($qb->expr()->like('shift_date', $qb->createNamedParameter($monthPattern)));
			
			$count = $qb->executeQuery()->fetchOne();

			if ($count >= $maxShifts) {
				return new JSONResponse([
					'status' => 'error', 
					'message' => 'Превышен лимит! Можно занять не более ' . $maxShifts . ' смен в месяц.'
				], 403);
			}

			// Если лимит не превышен, записываем
			$qb = $this->db->getQueryBuilder();
			$qb->insert('worker_bookings')
				->values([
					'user_id' => $qb->createNamedParameter($userId),
					'shift_date' => $qb->createNamedParameter($date),
					'brigade_id' => $qb->createNamedParameter($brigade),
					'shift_type' => $qb->createNamedParameter($type),
				]);
			
			$qb->executeStatement();

			return new JSONResponse(['status' => 'success']);
		} catch (\Exception $e) {
			return new JSONResponse(['status' => 'error', 'message' => $e->getMessage()], 500);
		}
	}
	//=====================================================================================================
	
	#[NoCSRFRequired]
	#[NoAdminRequired]
	#[OpenAPI(OpenAPI::SCOPE_IGNORE)]
	#[FrontpageRoute(verb: 'GET', url: '/')]
	public function index(): TemplateResponse 
	{
		\OCP\Util::addStyle('worker', 'worker-main');
		\OCP\Util::addScript('worker', 'worker-main');
		
		// Получаем текущего пользователя
		$user = $this->userSession->getUser();
		$userId = $user ? $user->getUID() : null;

		 $limits = $this->limitMapper->findAllLimits();
		 $this->initialStateService->provideInitialState('worker', 'limits_data', $limits);
		
		$qb = $this->db->getQueryBuilder();
		$qb->select('b.*', 'u.displayname')
		   ->from('worker_bookings', 'b')
		   ->leftJoin('b', 'users', 'u', 'b.user_id = u.uid');
		$bookings = $qb->executeQuery()->fetchAll();

		$this->initialStateService->provideInitialState('worker', 'bookings_data', [
			'bookings' => $bookings,
			'currentUserId' => $userId,
			'isAdmin' => ($userId === 'admin')
		]);
		
		return new TemplateResponse('worker', 'index');
	}
	//=====================================================================================================
	
	#[NoAdminRequired]
	#[NoCSRFRequired]
	public function cancel(int $id): DataResponse 
	{
		// Получаем текущего пользователя
		$user = $this->userSession->getUser();
		$userId = $user ? $user->getUID() : null;
		
		// Проверяем, авторизован ли пользователь
		if ($userId === null) {
			return new DataResponse(['status' => 'error'], 401);
		}
		
		// Самая безопасная проверка:
		$isAdmin = (strtolower($userId) === 'admin');
		
		if (!$isAdmin) {
			return new DataResponse(['status' => 'error'], 403);
		}   

		$query = $this->db->getQueryBuilder();
		$query->delete('worker_bookings')
			  ->where($query->expr()->eq('id', $query->createNamedParameter($id)));

		$result = $query->executeStatement();
		return new DataResponse([
			'status' => 'success',
			'deleted' => $result > 0
		]);
	}
	//=====================================================================================================
	
	#[NoAdminRequired] 
	#[NoCSRFRequired]
	public function saveLimit(): JSONResponse { // Убрали аргументы из скобок
	    // Проверка на админа
	    $user = $this->userSession->getUser();
	    if (!$user || strtolower($user->getUID()) !== 'admin') {
	        return new JSONResponse(['status' => 'error', 'message' => 'Forbidden'], 403);
	    }
	
	    // Получаем данные из запроса вручную
	    $date = $this->request->getParam('date');
	    $brigade = (int)$this->request->getParam('brigade');
	    $slots = (int)$this->request->getParam('slots');
	
	    if (!$date || !$brigade) {
	        return new JSONResponse(['status' => 'error', 'message' => 'Missing params'], 400);
	    }
	
	    $qb = $this->db->getQueryBuilder();
	    
	    // 1. Сначала удаляем старый лимит (чтобы не было конфликта UNIQUE)
	    $qb->delete('worker_limits')
	       ->where($qb->expr()->eq('shift_date', $qb->createNamedParameter($date)))
	       ->andWhere($qb->expr()->eq('brigade_id', $qb->createNamedParameter($brigade)));
	    $qb->executeStatement();
	
	    // 2. Если слоты > 0, вставляем новую запись
	    if ($slots > 0) {
	        $qb->insert('worker_limits')
	           ->values([
	               'shift_date' => $qb->createNamedParameter($date),
	               'brigade_id' => $qb->createNamedParameter($brigade),
	               'max_slots' => $qb->createNamedParameter($slots),
	           ]);
	        $qb->executeStatement();
	    }
	
	    return new JSONResponse(['status' => 'success']);
	}	
}
