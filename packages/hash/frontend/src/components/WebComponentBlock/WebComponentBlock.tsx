import React, { useCallback, VFC } from "react";

import { createComponent } from "@lit-labs/react";
import { BlockProtocolFunctions, BlockProtocolProps } from "blockprotocol";

/**
 * @see https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
 */
const bannedCustomElementNames = [
  "annotation-xml",
  "color-profile",
  "font-face",
  "font-face-src",
  "font-face-uri",
  "font-face-format",
  "font-face-name",
  "missing-glyph",
];

/**
 * Generates a valid custom element name from a block name.
 * @see https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
 * @param blockName a block name including namespace, e.g. '@hash/my-block'
 */
const generateCustomElementName = (blockName: BlockNameWithNamespace) => {
  if (!blockName.includes("/")) {
    throw new Error(
      "You must pass a block name including namespace, separated by a forward slash, e.g. '@hash/my-block'",
    );
  }
  const customElementName = blockName
    .replace(/\//g, "-")
    .replace(/[^\w-]+/g, "")
    .toLowerCase();
  if (bannedCustomElementNames.includes(customElementName)) {
    return `${customElementName}-block`;
  }
  return customElementName;
};

type BpEventData<
  Operation extends keyof BlockProtocolFunctions = keyof BlockProtocolFunctions,
> = {
  type: Operation;
  data: Parameters<Required<BlockProtocolFunctions>[Operation]>[0];
};

type BlockNameWithNamespace = `@${string}/${string}`;

type WebComponentBlockProps = {
  blockName: BlockNameWithNamespace;
  elementClass: typeof HTMLElement;
  functions: BlockProtocolFunctions;
} & Omit<BlockProtocolProps, keyof BlockProtocolFunctions>;

/**
 * Registers (if necessary) and loads a custom element.
 */
export const WebComponentBlock: VFC<WebComponentBlockProps> = ({
  blockName,
  elementClass,
  functions,
  ...props
}) => {
  const handleBpEvent = useCallback(
    ({ detail }: CustomEvent<BpEventData>) => {
      const { type, data } = detail;
      const fn = functions[detail.type];
      if (!fn) {
        throw new Error(
          `${type} operation not implemented by embedding application.`,
        );
      }
      fn(data as any) // @todo fix this: the compiler doesn't know that the args data will necessarily match the type
        .then((resp) => `Successful call to ${type}: ${resp}`)
        .catch((err) => `Call to ${type} errored: ${err.message}`);
    },
    [functions],
  );

  const tagName = generateCustomElementName(blockName);

  let existingCustomElement = customElements.get(tagName);
  if (!existingCustomElement) {
    customElements.define(tagName, elementClass);
  } else if (existingCustomElement !== elementClass) {
    let i = 0;
    do {
      existingCustomElement = customElements.get(tagName);
      i++;
    } while (existingCustomElement);
    customElements.define(`${tagName}${i}`, elementClass);
  }

  const CustomElement = createComponent(React, tagName, elementClass, {
    handleBpEvent: "blockProtocolAction",
  });

  console.log({ props });

  return <CustomElement handleBpEvent={handleBpEvent} {...props} />;
};
