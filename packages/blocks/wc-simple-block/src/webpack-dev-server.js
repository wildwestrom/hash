/**
 * This is the entry point for developing and debugging.
 * This file is not bundled with the block during the build process.
 */
import { SimpleBlock } from "./App";

const node = document.getElementById("app");

customElements.define("simple-block", SimpleBlock);

const simpleBlockEl = document.createElement("simple-block");
simpleBlockEl.entityId = "entity123";

node.appendChild(simpleBlockEl);
