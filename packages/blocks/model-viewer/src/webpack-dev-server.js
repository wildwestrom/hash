/**
 * This is the entry point for developing and debugging.
 * This file is not bundled with the block during the build process.
 */
import React from "react";
import ReactDOM from "react-dom";

import { createComponent } from "@lit-labs/react";

// eslint-disable-next-line import/no-extraneous-dependencies -- TODO update config properly
import { MockBlockDock } from "mock-block-dock";

import ElementClass from "./index";

const node = document.getElementById("app");

const tagName = "model-viewer";

try {
  customElements.define("model-viewer", ElementClass);
} catch (err) {
  console.warn(`Error defining custom element: ${err.message}`);
}

const App = () => {
  const CustomElement = createComponent(React, tagName, ElementClass, {
    handleBpEvent: "blockProtocolEvent",
  });

  const modelViewerProps = {
    alt: "Neil Armstrong's Spacesuit from the Smithsonian Digitization Programs Office and National Air and Space Museum",
    src: "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb",
    ar: "true",
    "ar-modes": "webxr scene-viewer quick-look",
    "environment-image":
      "https://modelviewer.dev/shared-assets/environments/moon_1k.hdr",
    poster: "https://modelviewer.dev/shared-assets/models/NeilArmstrong.webp",
    "seamless-poster": "true",
    "shadow-intensity": "1",
    "camera-controls": "true",
    "enable-pan": "true",
  };

  return (
    <MockBlockDock>
      <CustomElement entityId="123" {...modelViewerProps} />
    </MockBlockDock>
  );
};

ReactDOM.render(<App />, node);
