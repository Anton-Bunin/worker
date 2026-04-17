<?php
namespace OCA\WORKER\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class LimitMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        // Указываем таблицу, с которой работаем (без префикса oc_)
        parent::__construct($db, 'worker_limits', Limit::class);
    }

    /**
     * Получаем лимит для конкретной даты и бригады
     */
    public function findLimit(string $date, int $brigadeId): ?Limit {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')
           ->from($this->tableName)
           ->where($qb->expr()->eq('shift_date', $qb->createNamedParameter($date)))
           ->andWhere($qb->expr()->eq('brigade_id', $qb->createNamedParameter($brigadeId)));

        return $this->findEntity($qb);
    }

    /**
     * Получаем ВСЕ лимиты (чтобы передать их на фронтенд для отрисовки сетки)
     */
    public function findAllLimits(): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->tableName);
        return $this->findEntities($qb);
    }
}
