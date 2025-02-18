import { DbLink } from "../../adapter";

import { Connection } from "../types";
import { selectLatestVersionOfLink, mapDbRowsToDbLink } from "./sql/links.util";

export const getLink = async (
  conn: Connection,
  params: { sourceAccountId: string; linkId: string },
): Promise<DbLink | null> => {
  const row = await conn.maybeOne(selectLatestVersionOfLink(params));

  return row ? mapDbRowsToDbLink(row) : null;
};
