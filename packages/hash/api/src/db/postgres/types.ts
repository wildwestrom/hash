import {
  DatabasePoolConnectionType,
  DatabaseTransactionConnectionType,
} from "slonik";

export type PoolConnection = DatabasePoolConnectionType & {
  type: "Pool";
};

export type TransactionConnection = Omit<
  DatabaseTransactionConnectionType,
  "transaction"
> & { type: "Transaction" };

/**
 * Postgres connection types.
 * Note that {@link TransactionConnection} does not allow for nested transactions.
 * Construction of these types can be done through {@link poolConnection} or {@link transactionConnection}
 */
export type Connection = PoolConnection | TransactionConnection;

export type ConnectionType = Connection["type"];

export const tbdIsPoolConnection = (conn: Connection): conn is PoolConnection =>
  conn.type === "Pool";

/**
 * Construct {@link PoolConnection} variant tagged with {@link PoolConnectionKind}
 * @param database pool connection
 * @returns a {@link Connection}
 */
export const createPoolConnection = (
  connection: DatabasePoolConnectionType,
): PoolConnection => ({
  ...connection,
  type: "Pool",
});

/**
 * Construct {@link TransactionConnection} variant tagged with {@link TransactionConnectionKind}
 * @param database transaction connection
 * @returns a {@link Connection}
 */
export const createTransactionConnection = (
  connection: DatabaseTransactionConnectionType,
): TransactionConnection => ({
  ...connection,
  type: "Transaction",
});
