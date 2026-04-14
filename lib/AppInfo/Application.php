<?php

declare(strict_types=1);

namespace OCA\WORKER\AppInfo;

use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;

class Application extends App implements IBootstrap {
	public const APP_ID = 'worker';

	/** @psalm-suppress PossiblyUnusedMethod */
	public function __construct() {
		parent::__construct(self::APP_ID);
	}

	public function register(IRegistrationContext $context): void {
	  $context->registerService(PageController::class, function($c) {
            return new PageController(
                $c->getAppName(),
                $c->query(\OCP\IRequest::class),
                $c->query(\OCP\IDBConnection::class),
                $c->query(\OCP\IUserSession::class),
				$c->getServer()->getInitialStateService()
            );
        });	
	}
	
	public function boot(IBootContext $context): void {
	}
}
