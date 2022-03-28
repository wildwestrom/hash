import React, { useMemo } from "react";
import { BlockComponent } from "blockprotocol/react";
import { createComponent } from "@lit-labs/react";

import ComponentClass from "./basicLitElement";
import { BpEventData, bpEventName } from "./blockElement";

type AppProps = {
  name: string;
};

const CustomElement = createComponent(React, "CustomElement", ComponentClass);

export const App: BlockComponent<AppProps> = ({
  entityId,
  name,
  ...otherProps
}) => {
  // const handleBpEvent = useMemo(
  //   () =>
  //     ({ detail }: CustomEvent<BpEventData>) => {
  //       const { type, data } = detail;
  //       const fn = otherProps[detail.type];
  //       if (!fn) {
  //         throw new Error(
  //           `${type} operation not implemented by embedding application.`,
  //         );
  //       }
  //       fn(data as any) // @todo fix this
  //         .then((resp) => `Successful call to ${type}: ${resp}`)
  //         .catch((err) => `Call to ${type} errored: ${err.message}`);
  //     },
  //   [otherProps],
  // );

  console.log({ CustomElement });

  return (
    <CustomElement
    // entityId={entityId}
    // handleBpEvent={handleBpEvent}
    // name={name}
    />
  );
};
