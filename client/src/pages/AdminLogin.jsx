import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function AdminLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage("");

            const response = await api.post("/students/admin/login", {
                email,
                password
            });

            localStorage.setItem("adminToken", response.data.token);
            navigate("/admin");
        } catch (error) {
            setMessage(error.response?.data?.message || "Admin login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page admin-login-page">
            <section className="auth-visual admin-visual">
                <nav className="auth-brand">
                    <span className="brand-mark">T</span>
                    <span>TrackUrCodeLife</span>
                </nav>

                <div className="auth-hero-copy">
                    <span className="eyebrow">ADMIN ACCESS</span>
                    <h1>Manage student profiles with a focused control panel.</h1>
                    <p>
                        Search, filter, edit, and remove student records before publishing
                        clean leaderboard data to the batch.
                    </p>
                </div>
            </section>

            <section className="auth-panel" aria-labelledby="admin-login-title">
                <div className="auth-card">
                    <div className="auth-card-header">
                        <span className="eyebrow">ADMIN LOGIN</span>
                        <h2 id="admin-login-title">Control panel</h2>
                        <p>Use administrator credentials configured on the server.</p>
                    </div>

                    <form className="form-stack" onSubmit={handleLogin}>
                        <label className="field">
                            <span>Admin Email</span>
                            <input
                                type="email"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </label>

                        <label className="field">
                            <span>Password</span>
                            <input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </label>

                        <button className="primary-button" type="submit" disabled={loading}>
                            {loading ? "Logging in..." : "Open Admin"}
                        </button>
                    </form>

                    {message && <p className="status-message error">{message}</p>}

                    <div className="auth-links">
                        <Link to="/">Student login</Link>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default AdminLogin;
