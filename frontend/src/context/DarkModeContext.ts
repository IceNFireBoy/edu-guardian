import { createContext } from 'react';

// App.tsx owns the dark-mode state and provides it here so deep components
// (e.g. the PDF viewer's theme prop) can react without prop drilling.
export const DarkModeContext = createContext(false);
