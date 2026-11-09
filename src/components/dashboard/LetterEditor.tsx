"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes } from "@lexical/html";
import {
  ListItemNode,
  ListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { $getRoot, FORMAT_TEXT_COMMAND } from "lexical";

import { Button } from "@/components/ui/button";

function LetterEditorToolbar() {
  const [editor] = useLexicalComposerContext();

  return (
    <div className='flex flex-wrap items-center gap-2 border-b border-rule bg-paper-2 px-3 py-2 text-sm text-ink-2'>
      <Button
        type='button'
        size='sm'
        variant='outline'
        className='h-11 sm:h-8'
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
      >
        Bold
      </Button>
      <Button
        type='button'
        size='sm'
        variant='outline'
        className='h-11 sm:h-8'
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
      >
        Italic
      </Button>
      <Button
        type='button'
        size='sm'
        variant='outline'
        className='h-11 sm:h-8'
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
      >
        Underline
      </Button>
      <div className='h-4 w-px bg-rule' />
      <Button
        type='button'
        size='sm'
        variant='outline'
        className='h-11 sm:h-8'
        onClick={() =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
      >
        Bullets
      </Button>
      <Button
        type='button'
        size='sm'
        variant='outline'
        className='h-11 sm:h-8'
        onClick={() =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
        }
      >
        Numbered
      </Button>
      <Button
        type='button'
        size='sm'
        variant='ghost'
        className='h-11 text-ink-2 sm:h-8'
        onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)}
      >
        Clear List
      </Button>
    </div>
  );
}

export function LetterEditor({
  initialState,
  onChange,
}: {
  initialState: string | null;
  onChange: (payload: {
    html: string;
    plainText: string;
    editorState: string;
  }) => void;
}) {
  const editorConfig = {
    namespace: "letter-editor",
    onError(error: Error) {
      throw error;
    },
    nodes: [ListNode, ListItemNode],
    editorState: initialState ?? undefined,
    theme: {
      paragraph: "mb-2",
      text: {
        bold: "font-semibold",
        italic: "italic",
        underline: "underline",
      },
      list: {
        ol: "list-decimal ml-6",
        ul: "list-disc ml-6",
        listitem: "mb-1",
      },
    },
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className='relative border border-input bg-white text-ink focus-within:border-forest focus-within:ring-2 focus-within:ring-gold'>
        <LetterEditorToolbar />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              id='letter-content'
              className='min-h-[180px] max-h-[360px] overflow-y-auto px-4 py-3 pr-3 text-sm leading-relaxed focus:outline-none'
            />
          }
          placeholder={
            <div className='pointer-events-none absolute inset-x-0 mt-3 px-4 text-sm text-ink-2/80'>
              Begin writing the recommendation...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <OnChangePlugin
          onChange={(editorState, editor) => {
            editorState.read(() => {
              const html = $generateHtmlFromNodes(editor);
              const plainText = $getRoot().getTextContent();
              const serializedState = JSON.stringify(editorState.toJSON());
              onChange({ html, plainText, editorState: serializedState });
            });
          }}
        />
      </div>
    </LexicalComposer>
  );
}
