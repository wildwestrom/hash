import { html, LitElement } from "lit";

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

export class BlockElement extends LitElement implements BlockProtocolProps {
  static properties = {
    accountId: { type: String },
    entityId: { type: String },
    entityTypeId: { type: String },
    entityTypeVersionId: { type: String },
  };

  accountId?: string | null;
  entityId: string;
  entityTypeId?: string | null;
  entityTypeVersionId?: string | null;

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

  render() {
    return html`<div>Hello</div>`;
  }
}
