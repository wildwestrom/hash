import { html, LitElement } from "lit";
import {
  createElement,
  ComponentProps,
  ReactElement,
  ComponentType,
} from "react";
import ReactDOM from "react-dom";

const mountPointId = "reactRoot";

class LitReactWrapper extends LitElement {
  static properties = {
    props: { type: Object },
    element: { type: Object },
  };

  element: ComponentType;
  mountPoint: HTMLElement;
  props: ComponentProps<any>;
  reactElement: ReactElement;

  constructor() {
    super();
    this.props = {};
  }

  render() {
    return html`<div id=${mountPointId} /> `;
  }

  createElement() {
    this.reactElement = createElement(
      this.element,
      this.props,
      createElement("slot"),
    );
    return this.reactElement;
  }

  renderElement() {
    ReactDOM.render(this.createElement(), this.mountPoint);
  }

  firstUpdated() {
    this.mountPoint = this.shadowRoot.getElementById(mountPointId);
    this.renderElement();
  }

  updated(changedProperties) {
    if (changedProperties) {
      this.renderElement();
    }
  }
}

export default LitReactWrapper;
