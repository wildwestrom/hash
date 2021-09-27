import type { BlockVariant } from "@hashintel/block-protocol";
import type { ReplacePortals } from "@hashintel/hash-shared/sharedWithBackend";
import { ResolvedPos } from "prosemirror-model";
import { EditorState, Plugin, PluginKey } from "prosemirror-state";
import React, { CSSProperties } from "react";
import { ensureMounted } from "../../lib/dom";
import { BlockSuggester } from "./BlockSuggester";

interface Trigger {
  /** matched search string including its leading slash */
  search: string;
  /** starting prosemirror document position */
  from: number;
  /** ending prosemirror document position */
  to: number;
}

/**
 * used to find a string triggering the suggester plugin
 */
const findTrigger = (state: EditorState): Trigger | null => {
  // @ts-expect-error: only empty TextSelection has a $cursor
  const cursor: ResolvedPos = state.selection.$cursor;
  if (!cursor) return null;

  // the cursor's parent is the node that contains it
  const text = cursor.parent.textContent;

  // the cursor's position inside its parent
  const cursorPos = cursor.parentOffset;

  // the parent's position relative to the document root
  const parentPos = cursor.pos - cursorPos;

  // see if we can find a slash looking backwards
  const from = text.lastIndexOf("/", cursorPos - 1);
  if (from < 0) return null;

  // assert that there's no whitespace between the slash and the cursor
  const fromSlashToCursor = text.substring(from, cursorPos);
  if (/\s/.test(fromSlashToCursor)) return null;

  // match upto the first whitespace character or the end of the node
  const to = cursorPos + text.substring(cursorPos).search(/\s|$/g);

  return {
    search: text.substring(from, to),
    from: parentPos + from,
    to: parentPos + to,
  };
};

type SuggesterAction = { type: "escape" };

interface SuggesterState {
  /** whether or not the suggester is disabled */
  disabled: boolean;
  /** the suggester's current trigger */
  trigger: Trigger | null;
  /** whether or not the suggester is currently open */
  isOpen(): boolean;
}

/**
 * used to tag the suggester plugin/make it a singleton
 * @see https://prosemirror.net/docs/ref/#state.PluginKey
 */
const key = new PluginKey<SuggesterState>("suggester");

/**
 * Suggester plugin factory
 *
 * Behaviour:
 * Typing a slash followed by any number of non-whitespace characters will activate the plugin and
 * open a popup right under the "textual trigger". Moving the cursor outside the trigger will close
 * the popup. Pressing the Escape-key while inside the trigger will disable the plugin until a
 * trigger is newly encountered (e.g. by leaving/deleting and reentering/retyping a trigger).
 */
export const createBlockSuggester = (replacePortal: ReplacePortals) =>
  new Plugin<SuggesterState>({
    key,
    state: {
      init() {
        return {
          trigger: null,
          disabled: false,
          isOpen() {
            return this.trigger !== null && !this.disabled;
          },
        };
      },
      /** produces a new state from the old state and incoming transactions (cf. reducer) */
      apply(tr, state, _prevEitorState, nextEditorState) {
        const action: SuggesterAction | undefined = tr.getMeta(key);

        switch (action?.type) {
          case "escape":
            return { ...state, disabled: true };
        }

        const trigger = findTrigger(nextEditorState);
        const disabled = state.disabled && trigger !== null;

        return { ...state, trigger, disabled };
      },
    },
    props: {
      /** cannot use EditorProps.handleKeyDown because it doesn't capture all keys (notably Enter) */
      handleDOMEvents: {
        keydown(view, event) {
          switch (event.key) {
            // stop prosemirror from handling these keyboard events while the suggester handles them
            case "Enter":
            case "ArrowUp":
            case "ArrowDown":
              return this.getState(view.state).isOpen();
            case "Escape":
              view.dispatch(view.state.tr.setMeta(key, { type: "escape" }));
              return false;
            default:
              return false;
          }
        },
      },
    },
    view() {
      const mountNode = document.createElement("div");

      return {
        update(view) {
          const state = key.getState(view.state)!;

          if (!state.isOpen()) return this.destroy!();

          const { from, to, search } = state.trigger!;
          const coords = view.coordsAtPos(from);

          const style: CSSProperties = {
            position: "absolute",
            top: coords.bottom + document.documentElement.scrollTop,
            left: coords.left + document.documentElement.scrollLeft,
          };

          /**
           * @todo actually create and insert an instance of the selected block type variant
           */
          const onChange = (variant: BlockVariant) => {
            const replacement = view.state.schema.text(`[${variant.name}]`);
            view.dispatch(view.state.tr.replaceWith(from, to, replacement));
          };

          const jsx = (
            <div style={style}>
              <BlockSuggester search={search.substring(1)} onChange={onChange} />
            </div>
          );

          ensureMounted(mountNode, document.body);
          replacePortal(mountNode, mountNode, jsx);
        },
        destroy() {
          replacePortal(mountNode, null, null);
          mountNode.remove();
        },
      };
    },
  });
