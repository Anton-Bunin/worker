<?php
namespace OCA\Worker\Migration;

use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version010000Date20240101 extends SimpleMigrationStep {

    /**
     * Создает таблицу при установке/обновлении приложения
     */
    public function changeSchema(IOutput $output, \Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        if (!$schema->hasTable('worker_bookings')) {
            $table = $schema->createTable('worker_bookings');
            $table->addColumn('id', 'integer', [
                'autoincrement' => true,
                'notnull' => true,
            ]);
            $table->addColumn('user_id', 'string', [
                'notnull' => true,
                'length' => 64,
            ]);
            $table->addColumn('shift_date', 'date', [
                'notnull' => true,
            ]);
            $table->addColumn('brigade_id', 'integer', [
                'notnull' => true,
            ]);
            $table->addColumn('shift_type', 'string', [
                'notnull' => true,
                'length' => 10,
            ]);

            $table->setPrimaryKey(['id']);
            $table->addIndex(['shift_date'], 'worker_date_index');
        }

        return $schema;
    }
}
