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
	#[NoCSRFRequired]
	#[NoAdminRequired]
	public function reserve(string $date, int $brigade, string $type): JSONResponse 
	{
		try {
		$user = $this->userSession->getUser();
		$userId = $user->getUID();
			


		   if ($user === null) {
				return new JSONResponse(['status' => 'error', 'message' => 'User not logged in'], 403);
			}
			$userId = $user->getUID();

			$qb = $this->db->getQueryBuilder();
			$qb->insert('worker_bookings')
				->values([
					'user_id' => $qb->createNamedParameter($userId),
					'shift_date' => $qb->createNamedParameter($date),
					'brigade_id' => $qb->createNamedParameter($brigade),
					'shift_type' => $qb->createNamedParameter($type),
				]);

			// ИСПРАВЛЕНИЕ: Используем executeStatement() вместо execute()
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
		
		 // Получаем все бронирования
		$qb = $this->db->getQueryBuilder();
		$qb->select('*')->from('worker_bookings');
		$result = $qb->executeQuery();
		$bookings = $result->fetchAll();
		
		// Передаем их во фронтенд
		//$this->initialStateService->provideInitialState('worker', 'bookings', $bookings);

		// Передаем массив напрямую в шаблон
		return new TemplateResponse(Application::APP_ID, 'index', [
			'bookings' => $bookings
		]);

		return new TemplateResponse(
			Application::APP_ID,
			'index',
		);
	}
//=====================================================================================================
	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function cancel(string $date, int $brigade): JSONResponse 
	{
		try {
			$userId = $this->userSession->getUser()->getUID();

			$qb = $this->db->getQueryBuilder();
			$qb->delete('worker_bookings')
				->where($qb->expr()->eq('user_id', $qb->createNamedParameter($userId)))
				->andWhere($qb->expr()->eq('shift_date', $qb->createNamedParameter($date)))
				->andWhere($qb->expr()->eq('brigade_id', $qb->createNamedParameter($brigade)));
			
			$qb->executeStatement();

			return new JSONResponse(['status' => 'success']);
		} catch (\Exception $e) {
			return new JSONResponse(['status' => 'error', 'message' => $e->getMessage()], 500);
		}
	}
//=====================================================================================================
}

