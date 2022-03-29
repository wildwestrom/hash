import React, { useMemo, VFC } from "react";
import { BlockComponent } from "blockprotocol/react";
import { createComponent } from "@lit-labs/react";
import { BlockProtocolFunctions } from "blockprotocol";

type BpEventData<
  Operation extends keyof BlockProtocolFunctions = keyof BlockProtocolFunctions,
> = {
  type: Operation;
  data: Parameters<BlockProtocolFunctions[Operation]>[0];
};

type WebComponentBlockProps = {
  elementClass: String;
};

export const WebComponentBlock: VFC<WebComponentBlockProps> = ({
  elementClass,
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

  const CustomElement = createComponent(React, "custom-element", elementClass, {
    handleBpEvent,
  });

  console.log({ CustomElement });

  return (
    <CustomElement
    // entityId={entityId}
    // handleBpEvent={handleBpEvent}
    // name={name}
    />
  );
};
