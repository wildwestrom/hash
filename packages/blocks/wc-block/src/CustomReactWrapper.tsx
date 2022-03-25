import React, {
  DOMAttributes,
  MutableRefObject,
  useEffect,
  useRef,
} from "react";
import { BlockComponent } from "blockprotocol/react";

// import ComponentClass from "./testComponent";
import { WrappingElementClass as ComponentClass } from "./testReactComponent";
import { BpEventData, bpEventName } from "./blockElement";

type CustomElement<T> = Partial<T & DOMAttributes<T> & { children: any }>;

const blockTagName = "my-block";

declare global {
  interface HTMLElementTagNameMap {
    [blockTagName]: typeof ComponentClass;
  }

  namespace JSX {
    interface IntrinsicElements {
      [blockTagName]: CustomElement<typeof ComponentClass> & {
        ref: MutableRefObject<typeof ComponentClass>;
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
  const wcRef = useRef<typeof ComponentClass>(null);

  useEffect(() => {
    const handleEvent = ({ detail }: CustomEvent<BpEventData>) => {
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
    };

    const element = wcRef.current;

    element.addEventListener(bpEventName, handleEvent);

    return () => element.removeEventListener(bpEventName, handleEvent);
  }, [otherProps]);

  return <my-block entityId={entityId} name={name} ref={wcRef} />;
};
