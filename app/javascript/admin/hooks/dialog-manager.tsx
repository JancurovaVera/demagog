import React, { createContext, ReactNode, useState, useContext } from 'react';
import { noop } from 'lodash';
import { Overlay } from '@blueprintjs/core';

interface DialogContextType {
  openDialog: (dialog: JSX.Element) => void;

  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextType>({
  openDialog: noop,
  closeDialog: noop,
});

export function useDialogs() {
  return useContext(DialogContext);
}

interface DialogManagerProps {
  children: ReactNode;
}

/**
 * Contains the dialog stack state, and provides methods to nested components
 * so that they can open/close dialogs from inside the app hierarchy easily.
 *
 * All dialogs will be rendered underneath the provided children.
 */

export function DialogManager(props: DialogManagerProps) {
  const [dialogStack, setState] = useState<ReactNode[]>([]);

  return (
    <DialogContext.Provider
      value={{
        openDialog(dialog) {
          setState((dialogs) => [...dialogs, dialog]);
        },
        closeDialog() {
          setState((dialogs) => {
            const newDialogs = dialogs.slice();
            newDialogs.pop();

            return newDialogs;
          });
        },
      }}
    >
      {props.children}

      {dialogStack.length > 0 && (
        <>
          {dialogStack.map((dialog, i) => (
            <Overlay isOpen key={i} canEscapeKeyClose canOutsideClickClose>
              {dialog}
            </Overlay>
          ))}
        </>
      )}
    </DialogContext.Provider>
  );
}
