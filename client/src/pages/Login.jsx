import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import heroImage from "../assets/hero.png";

function Login() {
    const navigate = useNavigate();

    const [collegeEmail, setCollegeEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage("");

            const response = await api.post("/students/login", {
                collegeEmail,
                password
            });

            localStorage.setItem(
                "token",
                response.data.token
            );

            navigate("/dashboard");

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Login failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-visual">
                <nav className="auth-brand">
                    <span className="brand-mark">T</span>
                    <span>TrackUrCodeLife</span>
                </nav>

                <div className="auth-hero-copy">
                    <span className="eyebrow">ABES CODING TRACKER</span>
                    <h1>Know where your coding momentum stands.</h1>
                    <p>
                        Compare contest ratings, solved problems, and recent activity
                        across LeetCode and CodeChef in one clean student dashboard.
                    </p>
                </div>

                <div className="auth-art">
                    <img src={heroImage} alt="Layered coding dashboard visual" />
                </div>
            </section>

            <section className="auth-panel" aria-labelledby="login-title">
                <div className="auth-card">
                    <div className="auth-card-header">
                        <span className="eyebrow">STUDENT LOGIN</span>
                        <h2 id="login-title">Welcome back</h2>
                        <p>Use your registered college email to open the leaderboard.</p>
                    </div>

                    <form className="form-stack" onSubmit={handleLogin}>
                        <label className="field">
                            <span>College Email</span>
                            <input
                                type="email"
                                placeholder="name@abes.ac.in"
                                value={collegeEmail}
                                onChange={(e) => setCollegeEmail(e.target.value)}
                                required
                            />
                        </label>

                        <label className="field">
                            <span>Password</span>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </label>

                        <button className="primary-button" type="submit" disabled={loading}>
                            {loading ? "Logging in..." : "Open Dashboard"}
                        </button>
                    </form>

                    {message && <p className="status-message error">{message}</p>}

                    <div className="auth-links">
                        <Link to="/signup">Create student account</Link>
                        <Link to="/admin-login">Admin login</Link>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Login;
