import { LitElement, html } from "lit";

class TestComponent extends LitElement {

  @property({ type: String });
  
  render() {
    return html`
      <h1>Hello, {name}!</h1>
      <p>
        The entityId of this block is {entityId}. Use it to update its data when
        calling updateEntities.
      </p>
    `;
  }
}

export default TestComponent;