import { LitElement } from "lit";

import {
  BlockProtocolFunctions,
  BlockProtocolProps,
  BlockProtocolUpdateEntitiesAction,
} from "blockprotocol";

export type BpEventData<
  Operation extends keyof BlockProtocolFunctions = keyof BlockProtocolFunctions,
> = {
  type: Operation;
  data: Parameters<BlockProtocolFunctions[Operation]>[0];
};

export const bpEventName = "blockProtocolAction";

export interface BlockElement extends LitElement, BlockProtocolProps {}
export class BlockElement extends LitElement {
  static properties = {
    accountId: { type: String },
    entityId: { type: String },
    entityTypeId: { type: String },
    entityTypeVersionId: { type: String },
    entityTypes: { type: Array },
    linkedAggregations: { type: Array },
    linkedEntities: { type: Array },
    linkGroups: { type: Array },
  };

  protected dispatch<T extends keyof BlockProtocolFunctions>({
    type,
    data,
  }: BpEventData<T>) {
    const bpEvent = new CustomEvent(bpEventName, {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: {
        type,
        data,
      },
    });

    this.dispatchEvent(bpEvent);
  }

  protected updateSelf(
    data: Omit<
      BlockProtocolUpdateEntitiesAction,
      "accountId" | "entityId" | "entityTypeId" | "entityTypeVersionId"
    >,
  ) {
    this.dispatch({
      type: "updateEntities",
      data: [
        {
          ...data,
          accountId: this.accountId,
          entityId: this.entityId,
          entityTypeId: this.entityTypeId,
          entityTypeVersionId: this.entityTypeVersionId,
        },
      ],
    });
  }
}
