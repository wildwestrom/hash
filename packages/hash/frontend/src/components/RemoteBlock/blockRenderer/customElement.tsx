import { createComponent } from "@lit-labs/react";
import React from "react";
import { CustomElementDefinition } from "../util";

type CustomElementLoaderProps = {
  properties: Record<string, unknown>;
} & CustomElementDefinition;

/**
 * Registers (if not already registered) and loads a custom element.
 */
export const CustomElementLoader: React.VFC<CustomElementLoaderProps> = ({
  elementClass,
  properties,
  tagName,
}) => {
  const [CustomElement, setCustomElement] = React.useState<React.VFC | null>(
    null,
  );
  const existingDefinitionRef = React.useRef<CustomElementDefinition | null>(
    null,
  );

  React.useLayoutEffect(() => {
    if (
      existingDefinitionRef.current?.elementClass === elementClass &&
      existingDefinitionRef.current?.tagName === tagName
    ) {
      return;
    }
    let existingCustomElement = customElements.get(tagName);
    if (!existingCustomElement) {
      try {
        customElements.define(tagName, elementClass);
      } catch (err) {
        // eslint-disable-next-line no-console -- TODO: consider using logger
        console.error(
          `Error defining custom element: ${(err as Error).message}`,
        );
        throw err;
      }
    } else if (existingCustomElement !== elementClass) {
      /**
       * If an element with a different constructor is already registered with this name,
       * give this element a different name.
       * This may break elements that rely on being defined with a specific name.
       */
      let i = 0;
      do {
        existingCustomElement = customElements.get(`${tagName}${i}`);
        i++;
      } while (existingCustomElement);
      try {
        customElements.define(`${tagName}${i}`, elementClass);
      } catch (err) {
        // eslint-disable-next-line no-console -- TODO: consider using logger
        console.error(
          `Error defining custom element: ${(err as Error).message}`,
        );
        throw err;
      }
    }

    existingDefinitionRef.current = { tagName, elementClass };
    setCustomElement(createComponent(React, tagName, elementClass) as any); // @todo fix this
  }, [elementClass, tagName]);

  return CustomElement ? <CustomElement {...properties} /> : null;
};
