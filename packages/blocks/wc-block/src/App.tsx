import React, { DOMAttributes, useEffect, useRef } from "react";
import { BlockComponent } from "blockprotocol/react";

import ComponentClass from "./customElementDefinition";

type CustomElement<T> = Partial<T & DOMAttributes<T> & { children: any }>;

const blockTagName = "my-block";

declare global {
  interface HTMLElementTagNameMap {
    [blockTagName]: ComponentClass;
  }

  namespace JSX {
    interface IntrinsicElements {
      [blockTagName]: CustomElement<ComponentClass>;
    }
  }
}

customElements.define(blockTagName, ComponentClass);

type AppProps = {
  name: string;
};

export const App: BlockComponent<AppProps> = ({ entityId, name }) => {
  const wcRef = useRef<ComponentClass>(null);

  useEffect(() => {
    const handleEvent = (args) => console.log(args);

    const element = wcRef.current;

    element.addEventListener("bpEvent", handleEvent);

    return () => element.removeEventListener("bpEvent", handleEvent);
  }, []);

  return <my-block entityId={entityId} name={name} ref={wcRef} />;
};
