import React, { DOMAttributes } from "react";
import { BlockComponent } from "blockprotocol/react";

import WebComponentClass from "./customElementDefinition";

type CustomElement<T> = Partial<T & DOMAttributes<T> & { children: any }>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ["my-block"]: CustomElement<WebComponentClass>;
    }
  }
}

customElements.define("my-block", WebComponentClass);

type AppProps = {
  name: string;
};

export const App: BlockComponent<AppProps> = ({ entityId, name }) => {
  return <my-block />;
};
