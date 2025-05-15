import ChatClient from "./shared/components/ChatClient/ChatClient.tsx";
import { SnackbarProvider } from "notistack";

function App() {
  return (
    // @ts-ignore
    <SnackbarProvider autoHideDuration={5000}>
      <ChatClient />
    </SnackbarProvider>
  );
}

export default App;
