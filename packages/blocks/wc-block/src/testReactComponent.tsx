import { VoidFunctionComponent } from "react";
import { createComponentWrappingElementClass } from "./reactWrappingElement";

export const TestReactComponent: VoidFunctionComponent = () => (
  <div>I'm a react component</div>
);

export const WrappingElementClass = createComponentWrappingElementClass(
  TestReactComponent,
  "test",
);
