php
<?php
namespace OCA\Worker\Migration;

use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version000002Date20240101 extends SimpleMigrationStep {
    /**
     * Этот метод описывает, какую таблицу мы добавляем
     */
    public function changeSchema(IOutput $output, \Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // Если таблицы еще нет, создаем её
        if (!$schema->hasTable('worker_limits')) {
            $table = $schema->createTable('worker_limits');
            
            $table->addColumn('id', 'integer', [
                'autoincrement' => true,
                'notnull' => true,
            ]);
            $table->addColumn('shift_date', 'date', [
                'notnull' => true,
            ]);
            $table->addColumn('brigade_id', 'integer', [
                'notnull' => true,
            ]);
            $table->addColumn('max_slots', 'integer', [
                'notnull' => true,
                'default' => 0,
            ]);

            $table->setPrimaryKey(['id']);
            // Уникальный индекс, чтобы нельзя было создать два лимита на одну дату и бригаду
            $table->addUniqueIndex(['shift_date', 'brigade_id'], 'worker_limit_idx');
        }

        return $schema;
    }
}
