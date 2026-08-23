import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import heroImage from "../assets/hero.png";

function Signup() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        collegeEmail: "",
        password: "",
        rollNo: "",
        section: "CSE-11",
        leetcodeUsername: "",
        codechefUsername: ""
    });

    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const sendOTP = async () => {
        try {
            setLoading(true);
            setMessage("");

            await api.post("/students/send-otp", {
                collegeEmail: formData.collegeEmail
            });

            setOtpSent(true);
            setMessage("OTP sent to your college email.");
        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async () => {
        try {
            setLoading(true);
            setMessage("");

            await api.post("/students/verify-otp", {
                collegeEmail: formData.collegeEmail,
                otp
            });

            setVerified(true);
            setMessage("Email verified successfully.");
        } catch (error) {
            setMessage(error.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const registerStudent = async (e) => {
        e.preventDefault();

        if (!verified) {
            setMessage("Please verify your college email first.");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            await api.post("/students/register", formData);

            setMessage("Registration successful. Redirecting to login...");

            setTimeout(() => {
                navigate("/");
            }, 900);
        } catch (error) {
            setMessage(error.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page signup-page">
            <section className="auth-visual">
                <nav className="auth-brand">
                    <span className="brand-mark">T</span>
                    <span>TrackUrCodeLife</span>
                </nav>

                <div className="auth-hero-copy">
                    <span className="eyebrow">STUDENT ONBOARDING</span>
                    <h1>Build a verified coding profile for your batch.</h1>
                    <p>
                        Register with your ABES email, connect platform handles, and let
                        the dashboard keep contest progress visible.
                    </p>
                </div>

                <div className="auth-art">
                    <img src={heroImage} alt="Layered coding dashboard visual" />
                </div>
            </section>

            <section className="auth-panel" aria-labelledby="signup-title">
                <div className="auth-card auth-card-wide">
                    <div className="auth-card-header">
                        <span className="eyebrow">CREATE ACCOUNT</span>
                        <h2 id="signup-title">Student signup</h2>
                        <p>Verify your college email before submitting the profile.</p>
                    </div>

                    <form className="form-stack" onSubmit={registerStudent}>
                        <div className="form-grid">
                            <label className="field">
                                <span>Full Name</span>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>Roll Number</span>
                                <input
                                    type="text"
                                    name="rollNo"
                                    placeholder="University roll number"
                                    value={formData.rollNo}
                                    onChange={handleChange}
                                    required
                                />
                            </label>
                        </div>

                        <label className="field">
                            <span>College Email</span>
                            <input
                                type="email"
                                name="collegeEmail"
                                placeholder="name@abes.ac.in"
                                value={formData.collegeEmail}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        <div className="inline-actions">
                            {!otpSent && (
                                <button
                                    className="secondary-button"
                                    type="button"
                                    onClick={sendOTP}
                                    disabled={loading || !formData.collegeEmail}
                                >
                                    {loading ? "Sending..." : "Send OTP"}
                                </button>
                            )}

                            {otpSent && !verified && (
                                <>
                                    <label className="field otp-field">
                                        <span>OTP</span>
                                        <input
                                            type="text"
                                            placeholder="6 digit code"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            maxLength="6"
                                        />
                                    </label>

                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={verifyOTP}
                                        disabled={loading || otp.length < 6}
                                    >
                                        {loading ? "Verifying..." : "Verify OTP"}
                                    </button>
                                </>
                            )}
                        </div>

                        {verified && <p className="status-message success">Email verified</p>}

                        <label className="field">
                            <span>Password</span>
                            <input
                                type="password"
                                name="password"
                                placeholder="Minimum 6 characters"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength="6"
                            />
                        </label>

                        <label className="field">
                            <span>Section</span>
                            <select name="section" value={formData.section} onChange={handleChange}>
                                <option value="CSE-11">CSE-11</option>
                                <option value="CSE-14">CSE-14</option>
                                <option value="CSE-18">CSE-18</option>
                                <option value="CSE-22">CSE-22</option>
                            </select>
                        </label>

                        <div className="form-grid">
                            <label className="field">
                                <span>LeetCode Username</span>
                                <input
                                    type="text"
                                    name="leetcodeUsername"
                                    placeholder="Optional"
                                    value={formData.leetcodeUsername}
                                    onChange={handleChange}
                                />
                            </label>

                            <label className="field">
                                <span>CodeChef Username</span>
                                <input
                                    type="text"
                                    name="codechefUsername"
                                    placeholder="Optional"
                                    value={formData.codechefUsername}
                                    onChange={handleChange}
                                />
                            </label>
                        </div>

                        <button className="primary-button" type="submit" disabled={loading || !verified}>
                            Create Account
                        </button>
                    </form>

                    {message && (
                        <p className={`status-message ${verified ? "success" : "error"}`}>
                            {message}
                        </p>
                    )}

                    <div className="auth-links">
                        <Link to="/">Already have an account?</Link>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Signup;
