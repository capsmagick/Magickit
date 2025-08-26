import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface MediaBrowserOptions {
  onOpenMediaBrowser: () => void;
}

export const MediaBrowserExtension = Extension.create<MediaBrowserOptions>({
  name: 'mediaBrowser',

  addOptions() {
    return {
      onOpenMediaBrowser: () => {},
    };
  },

  addCommands() {
    return {
      openMediaBrowser: () => ({ commands }) => {
        this.options.onOpenMediaBrowser();
        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-m': () => this.editor.commands.openMediaBrowser(),
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mediaBrowser'),
        props: {
          decorations: (state) => {
            // Add visual indicators or decorations if needed
            return DecorationSet.empty;
          },
        },
      }),
    ];
  },
});