import { html } from "lit";
import {
  createElement,
  ComponentProps,
  ReactElement,
  ComponentType,
} from "react";
import ReactDOM from "react-dom";
import { BlockElement } from "./blockElement";

const mountPointId = "reactRoot";

class ReactWrappingElement extends BlockElement {
  static element: ComponentType;

  static properties = {
    ...BlockElement.properties,
    props: { type: Object },
  };

  mountPoint: HTMLElement;
  props: ComponentProps<any>;
  reactElement: ReactElement;

  constructor() {
    super();
    this.props = {};
  }

  render() {
    return html`<div id=${mountPointId}></div>`;
  }

  createElement() {
    this.reactElement = createElement(
      (this.constructor as typeof ReactWrappingElement).element,
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
    if (
      changedProperties &&
      JSON.stringify(changedProperties.props) !== JSON.stringify(this.props)
    ) {
      console.log(this);
      this.renderElement();
    }
  }
}

export const createComponentWrappingElementClass = (
  element: ComponentType,
  name?: string,
) => {
  const generatedClassName = `Wrapped${name ?? "Component"}`;
  const generatedClass = class extends ReactWrappingElement {
    static element = element;
  };
  Object.defineProperty(generatedClass, "name", { value: generatedClassName });
  return generatedClass;
};
