import React, { DOMAttributes } from "react";
import { BlockComponent } from "blockprotocol/react";

import WebComponentClass from "./customElementDefinition";

type CustomElement<T> = Partial<T & DOMAttributes<T> & { children: any }>;

const blockTagName = "my-block";

declare global {
  interface HTMLElementTagNameMap {
    [blockTagName]: WebComponentClass;
  }
  namespace JSX {
    interface IntrinsicElements {
      [blockTagName]: CustomElement<WebComponentClass>;
    }
  }
}

customElements.define(blockTagName, WebComponentClass);

type AppProps = {
  name: string;
};

export const App: BlockComponent<AppProps> = ({ entityId, name }) => {
  return <my-block />;
};
