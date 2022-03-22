import { LitElement, css, html } from "lit";

import {
  BlockProtocolFunctions,
  BlockProtocolProps,
  BlockProtocolUpdateEntitiesAction,
} from "blockprotocol";

type EventData<Operation extends keyof BlockProtocolFunctions> = {
  type: Operation;
  data: Parameters<BlockProtocolFunctions[Operation]>[0];
};

class BlockComponent extends LitElement implements BlockProtocolProps {
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
  }: EventData<T>) {
    const bpEvent = new CustomEvent("bpAction", {
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
      "entityId" | "entityTypeId" | "entityTypeVersionId"
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

class TestComponent extends BlockComponent {
  static styles = css`
    p {
      color: blue;
    }
  `;

  static properties = {
    ...BlockComponent.properties,
    name: { type: String },
  };

  name: string;

  changeHandler(event: Event & { target: HTMLInputElement }) {
    this.updateSelf({ data: { name: event.target.value } });
  }

  render() {
    return html`
      <h1>Hello, ${this.name}</h1>
      <p>
        The entityId of this block is ${this.entityId}. Use it to update its
        data when calling updateEntities.
      </p>
      <input @change=${this.changeHandler} value=${this.name} />
    `;
  }
}

export default TestComponent;
