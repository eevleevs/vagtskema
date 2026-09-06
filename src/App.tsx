import { BrowserRouter, Route, Routes } from "react-router";
import CalendarGenerator from "./pages/calendar";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<CalendarGenerator />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;