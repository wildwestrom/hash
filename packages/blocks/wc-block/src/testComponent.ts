import { css, html } from "lit";

import { BlockElement } from "./blockElement";

class TestComponent extends BlockElement {
  static styles = css`
    p {
      color: blue;
    }
  `;

  static properties = {
    ...BlockElement.properties,
    name: { type: String },
  };

  name: string;

  changeHandler(event: Event & { target: HTMLInputElement }) {
    this.updateSelf({ data: { name: event.target.value } });
  }

  render() {
    console.log("RENDERING");
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
