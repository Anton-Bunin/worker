<?php
declare(strict_types=1);

namespace OCA\WORKER\Controller;

use OCA\WORKER\AppInfo\Application;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Attribute\FrontpageRoute;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\Attribute\OpenAPI;
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

		// Конструктор, который "просит" у Nextcloud базу данных и юзера
		public function __construct(string $appName, 
									IRequest $request, 
									IDBConnection $db, 
									IUserSession $userSession,
									IInitialStateService $initialStateService) {
			parent::__construct($appName, $request);
			$this->db = $db;
			$this->userSession = $userSession;
			$this->initialStateService = $initialStateService;
	}
//=====================================================================================================
     /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
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
	 
		// Получаем бронирования вместе с именами пользователей
	    $qb = $this->db->getQueryBuilder();
	    $qb->select('b.*', 'u.displayname')
	       ->from('worker_bookings', 'b')
	       ->leftJoin('b', 'users', 'u', 'b.user_id = u.uid');
	    
	    $bookings = $qb->executeQuery()->fetchAll();
	
	    // Возвращаем ОДИН ответ с данными
	    return new TemplateResponse(Application::APP_ID, 'index', [
	        'bookings' => $bookings,
	        'currentUserId' => $this->userId
	    ]);	

	}
//=====================================================================================================
	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function cancel(string $date, int $brigade): JSONResponse 
	{
		 $userId = $this->userId;
	
	    // Проверяем, существует ли бронь и принадлежит ли она пользователю
	    $query = $this->db->getQueryBuilder();
	    $query->delete('worker_bookings')
	          ->where($query->expr()->eq('id', $query->createNamedParameter($id)))
	          ->andWhere($query->expr()->eq('user_id', $query->createNamedParameter($userId)));
	
	    $result = $query->execute();
	
	    return new DataResponse(['status' => 'success', 'deleted' => $result > 0]);
	}
//=====================================================================================================
}

