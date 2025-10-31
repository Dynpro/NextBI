import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleThemeMode: () => void;
  primaryColor: string;
  secondaryColor: string;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }: ThemeProviderProps) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as ThemeMode) || 'light';
  });

  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    return localStorage.getItem('primaryColor') || '#40c0a0';
  });

  const [secondaryColor, setSecondaryColor] = useState<string>(() => {
    return localStorage.getItem('secondaryColor') || '#2060e0';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('primaryColor', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    localStorage.setItem('secondaryColor', secondaryColor);
  }, [secondaryColor]);

  const toggleThemeMode = () => {
    setMode((prevMode: ThemeMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: primaryColor,
          },
          secondary: {
            main: secondaryColor,
          },
          background: {
            default: mode === 'light' ? '#ffffff' : '#121212',
            paper: mode === 'light' ? '#f5f5f5' : '#1e1e1e',
          },
        },
        typography: {
          fontFamily: [
            'Roboto',
            '"Segoe UI"',
            'Arial',
            'sans-serif'
          ].join(','),
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: mode === 'light' ? '#f1f1f1' : '#2c2c2c',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: mode === 'light' ? '#c1c1c1' : '#555555',
                  borderRadius: '4px',
                },
              },
            },
          },
        },
      }),
    [mode, primaryColor, secondaryColor]
  );

  const value = {
    mode,
    toggleThemeMode,
    primaryColor,
    secondaryColor,
    setPrimaryColor,
    setSecondaryColor,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
