import { createTheme } from "@mui/material/styles";

export function createAppTheme(mode = "light") {
  return createTheme({
    palette: {
      mode,
      primary: { main: "#4F46E5" },
      secondary: { main: "#8B5CF6" },
      background: {
        default: mode === "dark" ? "#0B1020" : "#F6F7FB",
        paper: mode === "dark" ? "#111833" : "#FFFFFF",
      },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: `"Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial`,
      h5: { fontWeight: 800 },
      h6: { fontWeight: 800 },
      button: { fontWeight: 800, textTransform: "none" },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
}

