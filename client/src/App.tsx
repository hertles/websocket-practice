import ChatClient from "./shared/components/ChatClient/ChatClient.tsx";
import { SnackbarProvider } from "notistack";
import { Grid } from "@mui/material";

function App() {
  return (
    <Grid
      container
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
      p={2}
    >
      <SnackbarProvider autoHideDuration={5000}>
        <ChatClient />
      </SnackbarProvider>
    </Grid>
  );
}

export default App;
