import React, {
  DOMAttributes,
  MutableRefObject,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { BlockComponent } from "blockprotocol/react";
import { createComponent } from "@lit-labs/react";

import ComponentClass, {
  BpEventData,
  bpEventName,
} from "./customElementDefinition";

type CustomElement<T> = Partial<T & DOMAttributes<T> & { children: any }>;

const blockTagName = "my-block";

declare global {
  interface HTMLElementTagNameMap {
    [blockTagName]: ComponentClass;
  }

  namespace JSX {
    interface IntrinsicElements {
      [blockTagName]: CustomElement<ComponentClass> & {
        ref: MutableRefObject<ComponentClass>;
      };
    }
  }
}

customElements.define(blockTagName, ComponentClass);

type AppProps = {
  name: string;
};

export const App: BlockComponent<AppProps> = ({
  entityId,
  name,
  ...otherProps
}) => {
  const handleBpEvent = useMemo(
    () =>
      ({ detail }: CustomEvent<BpEventData>) => {
        const { type, data } = detail;
        const fn = otherProps[detail.type];
        if (!fn) {
          throw new Error(
            `${type} operation not implemented by embedding application.`,
          );
        }
        fn(data as any) // @todo fix this
          .then((resp) => `Successful call to ${type}: ${resp}`)
          .catch((err) => `Call to ${type} errored: ${err.message}`);
      },
    [otherProps],
  );

  const CustomElement = createComponent(React, "my-element", ComponentClass, {
    handleBpEvent: bpEventName,
  });

  return (
    <CustomElement
      entityId={entityId}
      handleBpEvent={handleBpEvent}
      name={name}
    />
  );
};
