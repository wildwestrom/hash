import { sql } from "slonik";

import { Connection } from "../types";
import { DbAggregation } from "../../adapter";
import { mapColumnNamesToSQL } from "../util";

export type DbAggregationRow = {
  aggregation_id: string;
  source_account_id: string;
  source_entity_id: string;
  path: string;
  source_entity_version_ids: string[];
  operation: any;
  created_by_account_id: string;
  created_at: string;
};

export const mapRowToDbAggregation = (
  row: DbAggregationRow,
): DbAggregation => ({
  aggregationId: row.aggregation_id,
  sourceAccountId: row.source_account_id,
  sourceEntityId: row.source_entity_id,
  path: row.path,
  operation: row.operation,
  sourceEntityVersionIds: new Set(row.source_entity_version_ids),
  createdByAccountId: row.created_by_account_id,
  createdAt: new Date(row.created_at),
});

export const aggregationsColumnNames = [
  "aggregation_id",
  "source_account_id",
  "source_entity_id",
  "path",
  "source_entity_version_ids",
  "operation",
  "created_by_account_id",
  "created_at",
];

export const aggregationsColumnNamesSQL = mapColumnNamesToSQL(
  aggregationsColumnNames,
);

/**
 * Insert an aggregation into the aggregations table
 */
export const insertAggregation = async (
  conn: Connection,
  params: {
    aggregation: DbAggregation;
  },
): Promise<void> => {
  const { aggregation } = params;
  await conn.query(sql`
    insert into aggregations (${aggregationsColumnNamesSQL})
    values (${sql.join(
      [
        aggregation.aggregationId,
        aggregation.sourceAccountId,
        aggregation.sourceEntityId,
        aggregation.path,
        sql.array(Array.from(aggregation.sourceEntityVersionIds), "uuid"),
        JSON.stringify(aggregation.operation),
        aggregation.createdByAccountId,
        aggregation.createdAt.toISOString(),
      ],
      sql`, `,
    )})
`);
};

/**
 * Update the operation of an aggregation.
 *
 * Note: this shouldn't be called on an aggregation where the source entity
 * is versioned, as it updates the aggregation in-place.
 */
export const updateAggregationRowOperation = async (
  conn: Connection,
  params: {
    aggregationId: string;
    operation: object;
  },
): Promise<void> => {
  await conn.one(sql`
    update aggregations
    set operation = ${JSON.stringify(params.operation)}
    where
      aggregation_id = ${params.aggregationId}
    returning *;
  `);
};

/**
 * Delete an aggregation from the aggregations table
 */
export const deleteAggregationRow = async (
  conn: Connection,
  params: { aggregationId: string },
): Promise<void> => {
  await conn.one(sql`
    delete from aggregations
    where aggregation_id = ${params.aggregationId}
    returning *
  `);
};

export const addSourceEntityVersionIdToAggregation = async (
  conn: Connection,
  params: {
    aggregationId: string;
    newSourceEntityVersionId: string;
  },
) => {
  await conn.one(
    sql`
    with updated as (
      update aggregations
      set source_entity_version_ids = array_append(aggregations.source_entity_version_ids, ${params.newSourceEntityVersionId})
      where
        aggregation_id = ${params.aggregationId}
        and not ${params.newSourceEntityVersionId} = ANY(aggregations.source_entity_version_ids)
      returning *
    ) select * from updated order by created_at desc limit 1;
    `,
  );
};
