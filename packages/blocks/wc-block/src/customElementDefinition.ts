import { LitElement, css, html } from "lit";
import { property } from "lit/decorators.js";

import {
  BlockProtocolProps,
  BlockProtocolUpdateEntitiesAction,
} from "blockprotocol";

class BlockComponent extends LitElement implements BlockProtocolProps {
  @property({ type: String })
  entityId: string;

  @property({ type: String })
  entityTypeId?: string | null;

  @property({ type: String })
  entityTypeVersionId?: string | null;

  dispatch(
    type: "updateEntities",
    payload: BlockProtocolUpdateEntitiesAction<{}>,
  ) {
    const bpEvent = new CustomEvent("bpAction", {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: {
        type,
        payload,
      },
    });

    this.dispatchEvent(bpEvent);
  }
}

class TestComponent extends BlockComponent {
  static styles = css`
    p {
      color: blue;
    }
  `;

  @property()
  name: string;

  render() {
    return html`
      <h1>Hello, ${this.name}</h1>
      <p>
        The entityId of this block is ${this.entityId}. Use it to update its
        data when calling updateEntities.
      </p>
    `;
  }
}

export default TestComponent;
