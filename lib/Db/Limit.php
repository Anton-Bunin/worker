<?php
namespace OCA\WORKER\Db;

use OCP\AppFramework\Db\Entity;

class Limit extends Entity {
    // Эти переменные должны называться так же, как колонки в базе,
    // но в формате camelCase (shift_date -> shiftDate)
    protected $shiftDate;
    protected $brigadeId;
    protected $maxSlots;

    public function __construct() {
        // Указываем типы данных для Nextcloud
        $this->addType('shift_date', 'string');
        $this->addType('brigade_id', 'integer');
        $this->addType('max_slots', 'integer');
    }
}
