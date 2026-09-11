import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
    const navigate = useNavigate();

    // Login state
    const [collegeEmail, setCollegeEmail] = useState("");
    const [password, setPassword] = useState("");
    
    // Forgot Password state
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [resetStep, setResetStep] = useState(0); // 0: enter email, 1: enter otp, 2: enter new password
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("error");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setMessage("");
            setMessageType("error");

            const response = await api.post("/auth/login", {
                collegeEmail,
                password
            });

            localStorage.setItem("token", response.data.token);

            if (response.data.role === "admin") {
                navigate("/admin");
            } else {
                navigate("/dashboard");
            }

        } catch (error) {
            setMessage(error.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSendResetOTP = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setMessage("");
            setMessageType("error");

            const response = await api.post("/auth/forgot-password", { email: collegeEmail });
            setMessageType("success");
            setMessage(response.data.message || "OTP sent successfully.");
            setResetStep(1);
        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to send OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyResetOTP = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setMessage("");
            setMessageType("error");

            const response = await api.post("/auth/verify-reset-otp", { email: collegeEmail, otp });
            setMessageType("success");
            setMessage(response.data.message || "OTP verified.");
            setResetStep(2);
        } catch (error) {
            setMessage(error.response?.data?.message || "OTP verification failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setMessage("");
            setMessageType("error");

            const response = await api.post("/auth/reset-password", { 
                email: collegeEmail, 
                otp, 
                password: newPassword, 
                confirmPassword 
            });
            setMessageType("success");
            setMessage(response.data.message || "Password updated successfully. Please log in.");
            
            // Go back to login
            setTimeout(() => {
                setIsForgotPassword(false);
                setResetStep(0);
                setPassword("");
                setOtp("");
                setNewPassword("");
                setConfirmPassword("");
                setMessage("");
            }, 2000);
            
        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    // HORROR THEME STYLES
    const horrorTheme = {
        bg: "url('/nun.jpg') center/cover no-repeat fixed",
        overlay: "rgba(5, 5, 5, 0.85)", // Darker translucent layer
        surface: "rgba(15, 5, 5, 0.85)", // Deep blood-tinted black
        surfaceSoft: "rgba(30, 10, 10, 0.9)",
        border: "#5c0a0a", // Deep blood red
        text: "#e5e5e5", // Pale bone white
        textMuted: "#a39999",
        accent: "#cc0000", // Crimson red
        accentHover: "#ff1a1a"
    };

    return (
        <main style={{ minHeight: '100vh', background: horrorTheme.bg, color: horrorTheme.text, display: 'flex', fontFamily: "'Cinzel', 'Times New Roman', serif" }}>
            <div style={{ flex: 1, backgroundColor: horrorTheme.overlay, display: 'flex', width: '100%' }}>
                
                <section style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4rem', background: 'linear-gradient(90deg, rgba(10,0,0,0.95) 0%, rgba(20,0,0,0.7) 100%)', borderRight: `2px solid ${horrorTheme.border}` }}>
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: 'auto' }}>
                        <span style={{ display: 'inline-flex', width: '50px', height: '50px', background: horrorTheme.accent, color: 'black', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.8rem', textShadow: '0 0 10px rgba(255,255,255,0.5)', boxShadow: `0 0 15px ${horrorTheme.accent}` }}>✞</span>
                        <span style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', textShadow: `2px 2px 5px ${horrorTheme.accent}` }}>TrackUrCodeLife</span>
                    </nav>

                    <div style={{ margin: 'auto 0' }}>
                        <span style={{ fontSize: '1.2rem', color: horrorTheme.accent, letterSpacing: '4px', textTransform: 'uppercase' }}>THE ABYSS BECKONS</span>
                        <h1 style={{ fontSize: '4rem', fontWeight: 800, margin: '1rem 0', textShadow: `0 0 20px ${horrorTheme.accent}`, letterSpacing: '2px', lineHeight: 1.1 }}>Know where your soul stands.</h1>
                        <p style={{ color: horrorTheme.textMuted, fontSize: '1.4rem', fontStyle: 'italic', maxWidth: '600px', lineHeight: 1.5 }}>
                            Witness your trials and tribulations across LeetCode and CodeChef.
                            Only the strong survive the judgement.
                        </p>
                    </div>

                    <div style={{ marginTop: 'auto', padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '12px', border: `1px solid ${horrorTheme.border}`, boxShadow: `inset 0 0 30px rgba(100,0,0,0.3)` }}>
                        <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 600, color: horrorTheme.accent }}>Embrace the Darkness</h3>
                        <p style={{ marginTop: '0.5rem', color: horrorTheme.textMuted, fontSize: '1.1rem' }}>Enter your pact to access the sanctuary.</p>
                    </div>
                </section>

                <section style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backdropFilter: 'blur(5px)' }}>
                    <div style={{ width: '100%', maxWidth: '480px', background: 'linear-gradient(135deg, rgba(20,0,0,0.9) 0%, rgba(10,10,10,0.95) 100%)', borderRadius: '12px', border: `2px solid ${horrorTheme.border}`, padding: '3rem', boxShadow: `0 0 50px rgba(200, 0, 0, 0.2)` }}>
                        
                        {!isForgotPassword ? (
                            <>
                                <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                                    <span style={{ color: horrorTheme.accent, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1rem' }}>ENTER THE GATES</span>
                                    <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: 'white', textShadow: `0 0 10px ${horrorTheme.accent}` }}>Welcome Back</h2>
                                    <p style={{ color: horrorTheme.textMuted, fontStyle: 'italic' }}>Offer your credentials to proceed.</p>
                                </div>

                                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Astral Tether (Email)</span>
                                        <input
                                            type="email"
                                            placeholder="name@abes.ac.in"
                                            value={collegeEmail}
                                            onChange={(e) => setCollegeEmail(e.target.value)}
                                            required
                                            style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none', transition: 'border 0.3s' }}
                                            onFocus={(e) => e.target.style.borderColor = horrorTheme.accent}
                                            onBlur={(e) => e.target.style.borderColor = horrorTheme.border}
                                        />
                                    </label>

                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Secret Phrase</span>
                                            <button 
                                                type="button" 
                                                onClick={() => { setIsForgotPassword(true); setMessage(""); }}
                                                style={{ background: 'none', border: 'none', color: horrorTheme.accent, cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline', fontStyle: 'italic' }}
                                            >
                                                Lost your memory?
                                            </button>
                                        </div>
                                        <input
                                            type="password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none', transition: 'border 0.3s' }}
                                            onFocus={(e) => e.target.style.borderColor = horrorTheme.accent}
                                            onBlur={(e) => e.target.style.borderColor = horrorTheme.border}
                                        />
                                    </label>

                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        style={{ marginTop: '1rem', padding: '1.2rem', background: horrorTheme.accent, border: `1px solid ${horrorTheme.accent}`, color: 'black', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', transition: 'all 0.3s', boxShadow: `0 0 15px ${horrorTheme.accent}`, opacity: loading ? 0.7 : 1 }}
                                        onMouseOver={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 20px white'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.background = horrorTheme.accent; e.currentTarget.style.boxShadow = `0 0 15px ${horrorTheme.accent}`; }}
                                    >
                                        {loading ? "Crossing Over..." : "Step Inside"}
                                    </button>
                                </form>
                                
                                {message && (
                                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.8)', borderLeft: `4px solid ${messageType === 'success' ? '#00fa9a' : horrorTheme.accent}`, color: messageType === 'success' ? '#00fa9a' : horrorTheme.accent, textAlign: 'center', fontStyle: 'italic' }}>
                                        {message}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem', gap: '0.5rem', fontSize: '1.1rem' }}>
                                    <span style={{ color: horrorTheme.textMuted }}>A wandering soul?</span>
                                    <Link to="/signup" style={{ color: horrorTheme.accent, textDecoration: 'none', fontWeight: 'bold', textShadow: `0 0 5px ${horrorTheme.accent}` }}>Form a Pact</Link>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                                    <span style={{ color: horrorTheme.accent, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1rem' }}>RECOVER THE PAST</span>
                                    <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: 'white', textShadow: `0 0 10px ${horrorTheme.accent}` }}>Lost Memories</h2>
                                    <p style={{ color: horrorTheme.textMuted, fontStyle: 'italic' }}>The abyss requires verification.</p>
                                </div>

                                {resetStep === 0 && (
                                    <form onSubmit={handleSendResetOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>True Identity (Email)</span>
                                            <input
                                                type="email"
                                                placeholder="name@abes.ac.in"
                                                value={collegeEmail}
                                                onChange={(e) => setCollegeEmail(e.target.value)}
                                                required
                                                style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none' }}
                                                onFocus={(e) => e.target.style.borderColor = horrorTheme.accent}
                                                onBlur={(e) => e.target.style.borderColor = horrorTheme.border}
                                            />
                                        </label>
                                        <button 
                                            type="submit" 
                                            disabled={loading}
                                            style={{ marginTop: '1rem', padding: '1.2rem', background: horrorTheme.accent, border: `1px solid ${horrorTheme.accent}`, color: 'black', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', transition: 'all 0.3s', boxShadow: `0 0 15px ${horrorTheme.accent}` }}
                                        >
                                            {loading ? "Invoking..." : "Send the Code"}
                                        </button>
                                    </form>
                                )}

                                {resetStep === 1 && (
                                    <form onSubmit={handleVerifyResetOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>The Mark (OTP)</span>
                                            <input
                                                type="text"
                                                placeholder="Enter the 6-digit seal"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                required
                                                style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none', textAlign: 'center', letterSpacing: '5px' }}
                                                onFocus={(e) => e.target.style.borderColor = horrorTheme.accent}
                                                onBlur={(e) => e.target.style.borderColor = horrorTheme.border}
                                            />
                                        </label>
                                        <button 
                                            type="submit" 
                                            disabled={loading}
                                            style={{ marginTop: '1rem', padding: '1.2rem', background: horrorTheme.accent, border: `1px solid ${horrorTheme.accent}`, color: 'black', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', transition: 'all 0.3s', boxShadow: `0 0 15px ${horrorTheme.accent}` }}
                                        >
                                            {loading ? "Judging..." : "Verify the Seal"}
                                        </button>
                                    </form>
                                )}

                                {resetStep === 2 && (
                                    <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>A New Secret Phrase</span>
                                            <input
                                                type="password"
                                                placeholder="Enter new password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none' }}
                                                onFocus={(e) => e.target.style.borderColor = horrorTheme.accent}
                                                onBlur={(e) => e.target.style.borderColor = horrorTheme.border}
                                            />
                                        </label>
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Echo the Phrase</span>
                                            <input
                                                type="password"
                                                placeholder="Confirm new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none' }}
                                                onFocus={(e) => e.target.style.borderColor = horrorTheme.accent}
                                                onBlur={(e) => e.target.style.borderColor = horrorTheme.border}
                                            />
                                        </label>
                                        <button 
                                            type="submit" 
                                            disabled={loading}
                                            style={{ marginTop: '1rem', padding: '1.2rem', background: horrorTheme.accent, border: `1px solid ${horrorTheme.accent}`, color: 'black', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', transition: 'all 0.3s', boxShadow: `0 0 15px ${horrorTheme.accent}` }}
                                        >
                                            {loading ? "Forging..." : "Bind the Secret"}
                                        </button>
                                    </form>
                                )}

                                {message && (
                                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.8)', borderLeft: `4px solid ${messageType === 'success' ? '#00fa9a' : horrorTheme.accent}`, color: messageType === 'success' ? '#00fa9a' : horrorTheme.accent, textAlign: 'center', fontStyle: 'italic' }}>
                                        {message}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
                                    <button 
                                        onClick={() => {
                                            setIsForgotPassword(false);
                                            setResetStep(0);
                                            setMessage("");
                                        }}
                                        style={{ background: 'transparent', border: 'none', color: horrorTheme.textMuted, cursor: 'pointer', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'underline' }}
                                    >
                                        Retreat to the Gates
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

export default Login;
