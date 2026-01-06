// scripts/apply-migration.ts
import postgres from 'postgres';
import { promises as fs } from 'fs';
import path from 'path';
import 'dotenv/config';

async function runMigration() {
  // 1. Validar que la URL de la base de datos está configurada
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      '❌ Error: La variable de entorno DATABASE_URL no está definida.'
    );
    console.log(
      'Asegúrate de tener un archivo .env en la raíz del proyecto con la URL de tu base de datos de Supabase.'
    );
    process.exit(1);
  }

  // 2. Leer el script de migración SQL
  const migrationFilePath = path.join(__dirname, '006_setup_multi_tenancy.sql');
  let sqlScript: string;
  try {
    sqlScript = await fs.readFile(migrationFilePath, 'utf-8');
    console.log('✅ Script de migración leído correctamente.');
  } catch (error) {
    console.error(
      `❌ Error al leer el archivo de migración: ${migrationFilePath}`,
      error
    );
    process.exit(1);
  }

  let sql;
  try {
    // 3. Conectar a la base de datos
    console.log('🔄 Conectando a la base de datos...');
    sql = postgres(databaseUrl, {
      max: 1, // Usar una única conexión para la migración
      onnotice: () => {
        // Ignorar notices de postgres para una salida más limpia
      },
    });
    console.log('✅ Conexión establecida.');

    // 4. Ejecutar la migración dentro de una transacción
    console.log('🔄 Ejecutando migración dentro de una transacción...');
    await sql.begin(async (transaction) => {
      await transaction.unsafe(sqlScript);
    });

    console.log(
      '🎉 ¡Éxito! La migración se ha completado y la transacción se ha confirmado.'
    );
  } catch (error) {
    console.error('❌ Error durante la migración. Se ha hecho rollback de la transacción.');
    console.error(error);
    process.exit(1);
  } finally {
    // 5. Cerrar la conexión
    if (sql) {
      await sql.end();
      console.log('🔌 Conexión a la base de datos cerrada.');
    }
  }
}

runMigration();
