import { baseKeymap, toggleMark } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { keymap } from "prosemirror-keymap";
import { ProsemirrorNode, Schema } from "prosemirror-model";
import { EditorState, Plugin } from "prosemirror-state";
import { createEntityStorePlugin } from "./entityStorePlugin";
import { createSchema } from "./schema";
import { wrapEntitiesPlugin } from "./wrapEntitiesPlugin";

const createInitialDoc = (schema: Schema = createSchema()) =>
  schema.node("doc", {}, [schema.node("blank")]);

const defaultPlugins: Plugin<any, Schema>[] = [
  ...wrapEntitiesPlugin(baseKeymap),
  // This enables an indicator to appear when drag and dropping blocks
  dropCursor(),
];

export const createProseMirrorState = ({
  accountId,
  doc = createInitialDoc(),
  plugins = [],
}: {
  accountId: string;
  doc?: ProsemirrorNode<Schema>;
  plugins?: Plugin<any, Schema>[];
}) => {
  const formatKeymap = keymap<Schema>({
    // Mod- stands for Cmd- o macOS and Ctrl- elsewhere
    "Mod-b": toggleMark(doc.type.schema.marks.strong!),
    "Mod-i": toggleMark(doc.type.schema.marks.em!),
    "Mod-u": toggleMark(doc.type.schema.marks.underlined!),
    // We add an extra shortcut on macOS to mimic raw Chrome’s contentEditable.
    // ProseMirror normalizes keys, so we don’t get two self-cancelling handlers.
    "Ctrl-u": toggleMark(doc.type.schema.marks.underlined!),

    "Shift-Enter": (state, dispatch) => {
      dispatch?.(
        state.tr
          .replaceSelectionWith(doc.type.schema.nodes.hardBreak!.create())
          .scrollIntoView(),
      );
      return true;
    },
    // execCommand is flagged as depecrated but it seems that there isn't a viable alternative
    // to call the undo and redo default browser actions (https://stackoverflow.com/a/70831583)
    // After the collab rework this should be replaced with a proper implementation
    "Mod-z": () => document.execCommand("undo"),
    "Mod-y": () => document.execCommand("redo"),
    "Mod-Shift-z": () => document.execCommand("redo"),
  });

  return EditorState.create<Schema>({
    doc,
    plugins: [
      ...defaultPlugins,
      createEntityStorePlugin({ accountId }),
      formatKeymap,
      ...plugins,
    ],
  });
};
