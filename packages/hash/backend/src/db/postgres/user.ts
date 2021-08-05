import { Connection } from "./types";
import { selectEntities, mapPGRowToEntity } from "./entity";
import { DbUser } from "../../types/dbTypes";
import { Visibility } from "../../graphql/apiTypes.gen";

import { sql } from "slonik";

// @todo: don't import DbUser from outside the db library. Create a new type like
// `Entity`
/** maps a postgres row to its corresponding User object */
export const mapPGRowToDbUser = (row: any): DbUser => ({
  ...mapPGRowToEntity(row),
  id: row["entity_id"],
  visibility: Visibility.Public, // TODO
  type: "User",
});

// @todo: this function should take accountId as a parameter.
export const getUserById = async (conn: Connection, params: { id: string }) => {
  const row = await conn.one(sql`
    ${selectEntities}
    where
      t.name = 'User' and e.entity_id = ${params.id}
  `);
  return mapPGRowToDbUser(row);
};

// @todo: this function is not optimized to take DB indexes or sharding into account. It
// might be better to have a separate "users" table.
export const getUserByEmail = async (
  conn: Connection,
  params: { email: string }
) => {
  const row = await conn.one(sql`
    ${selectEntities}
    where
      t.name = 'User' and e.properties ->> 'email' = ${params.email}
  `);
  return mapPGRowToDbUser(row);
};

// @todo: this function is not optimized to take DB indexes or sharding into account. It
// might be better to have a separate "users" table.
export const getUserByShortname = async (
  conn: Connection,
  params: { shortname: string }
) => {
  const row = await conn.one(sql`
    ${selectEntities}
    where
      t.name = 'User' and e.properties ->> 'shortname' = ${params.shortname}
  `);
  return mapPGRowToDbUser(row);
};
