import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Developer from "./pages/Developer";
import AdminDashboard from "./pages/AdminDashboard";
import EditProfile from "./pages/EditProfile";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/profile" element={<EditProfile />} />
                <Route path="/developer" element={<Developer />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<Login />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
