import sql from 'mssql';

let pool: sql.ConnectionPool | null = null;
let poolPromise: Promise<sql.ConnectionPool | null> | null = null;

export function getSQLServerConfig(): sql.config | null {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.MSSQL_URL ||
    process.env.SQLSERVER_URL ||
    process.env.MSSQL_CONNECTION_STRING;

  if (connectionString) {
    return connectionString as unknown as sql.config;
  }

  const server =
    process.env.MSSQL_HOST ||
    process.env.SQLSERVER_HOST ||
    process.env.DB_HOST ||
    process.env.DB_SERVER;

  if (!server) return null;

  const port = parseInt(
    process.env.MSSQL_PORT ||
      process.env.SQLSERVER_PORT ||
      process.env.DB_PORT ||
      '1433',
    10
  );
  const user =
    process.env.MSSQL_USER ||
    process.env.SQLSERVER_USER ||
    process.env.DB_USER ||
    'sa';
  const password =
    process.env.MSSQL_PASSWORD ||
    process.env.SQLSERVER_PASSWORD ||
    process.env.DB_PASSWORD ||
    '';
  const database =
    process.env.MSSQL_DATABASE ||
    process.env.SQLSERVER_DATABASE ||
    process.env.DB_NAME ||
    'Ultimatum';

  const encrypt =
    process.env.MSSQL_ENCRYPT === 'true' ||
    process.env.SQLSERVER_ENCRYPT === 'true';
  const trustServerCertificate =
    process.env.MSSQL_TRUST_SERVER_CERTIFICATE !== 'false';

  return {
    server,
    port,
    user,
    password,
    database,
    options: {
      encrypt,
      trustServerCertificate,
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

export async function getSQLServerPool(): Promise<sql.ConnectionPool | null> {
  if (pool && pool.connected) return pool;

  if (poolPromise) return poolPromise;

  const config = getSQLServerConfig();
  if (!config) return null;

  poolPromise = (async () => {
    try {
      if (typeof config === 'string') {
        pool = await new sql.ConnectionPool(config).connect();
      } else {
        pool = await new sql.ConnectionPool(config).connect();
      }
      return pool;
    } catch (err) {
      console.warn('[SQL Server] Connection skipped / unavailable:', err);
      pool = null;
      return null;
    } finally {
      poolPromise = null;
    }
  })();

  return poolPromise;
}

/**
 * Execute a parameterized query on Microsoft SQL Server.
 * Supports standard '?' positional placeholders (auto-converted to @p0, @p1...)
 * or named '@param' placeholders, and normalizes MySQL-style backticks into T-SQL brackets [column].
 */
export async function querySQLServer(queryText: string, params: any[] = []): Promise<any[] | null> {
  const p = await getSQLServerPool();
  if (!p || !p.connected) return null;

  try {
    const request = p.request();
    let transformedQuery = queryText;

    // Convert backticks `table` -> [table]
    transformedQuery = transformedQuery.replace(/`([^`]+)`/g, '[$1]');

    // Convert positional ? placeholders to @p0, @p1, ...
    if (params && params.length > 0) {
      let paramIdx = 0;
      transformedQuery = transformedQuery.replace(/\?/g, () => {
        const paramName = `p${paramIdx}`;
        const val = params[paramIdx];
        if (val === null || val === undefined) {
          request.input(paramName, val ?? null);
        } else if (typeof val === 'number') {
          if (Number.isInteger(val)) {
            request.input(paramName, sql.Int, val);
          } else {
            request.input(paramName, sql.Float, val);
          }
        } else if (typeof val === 'boolean') {
          request.input(paramName, sql.Bit, val ? 1 : 0);
        } else if (val instanceof Date) {
          request.input(paramName, sql.DateTime2, val);
        } else {
          request.input(paramName, sql.NVarChar, String(val));
        }
        paramIdx++;
        return `@${paramName}`;
      });
    }

    const result = await request.query(transformedQuery);
    // Return recordset rows array (with affectedRows / rowsAffected attached for DML statements)
    const rows = (result.recordset || []) as any;
    if (result.rowsAffected && result.rowsAffected.length > 0) {
      rows.affectedRows = result.rowsAffected.reduce((a, b) => a + b, 0);
    }
    return rows;
  } catch (err) {
    console.error('[SQL Server Query Error]:', err);
    throw err;
  }
}

// Aliases
export const queryDatabase = querySQLServer;
export const queryMySQL = querySQLServer;
