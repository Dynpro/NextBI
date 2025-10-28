/**
 * Type declarations for MUI libraries used in the project
 */
declare module '@mui/material/styles' {
  import { Theme as MuiTheme } from '@mui/material/styles';
  
  export interface Theme extends MuiTheme {}
  export function createTheme(options?: any): Theme;
  
  export interface ThemeProviderProps {
    children?: React.ReactNode;
    theme: Theme;
  }
  
  export const ThemeProvider: React.FC<ThemeProviderProps>;
}

declare module '@mui/material/CssBaseline' {
  import { FC } from 'react';
  
  interface CssBaselineProps {
    children?: React.ReactNode;
  }
  
  const CssBaseline: FC<CssBaselineProps>;
  export default CssBaseline;
}
