import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

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
    const [messageType, setMessageType] = useState("");

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
            setMessageType("");

            const response = await api.post("/auth/send-otp", {
                collegeEmail: formData.collegeEmail
            });

            setOtpSent(true);
            setMessageType("success");
            setMessage("OTP sent to your college email.");
        } catch (error) {
            setMessageType("error");
            setMessage(error.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async () => {
        try {
            setLoading(true);
            setMessage("");
            setMessageType("");

            const response = await api.post("/auth/verify-otp", {
                collegeEmail: formData.collegeEmail,
                otp
            });

            setVerified(true);
            setMessageType("success");
            setMessage("Email verified successfully.");
        } catch (error) {
            setMessageType("error");
            setMessage(error.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const registerStudent = async (e) => {
        e.preventDefault();

        if (!verified) {
            setMessageType("error");
            setMessage("Please verify your college email first.");
            return;
        }

        try {
            setLoading(true);
            setMessage("");
            setMessageType("");

            await api.post("/auth/register", formData);

            setMessageType("success");
            setMessage("Registration successful. Redirecting to login...");

            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (error) {
            setMessageType("error");
            setMessage(error.response?.data?.message || "Registration failed");
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
                
                <section style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4rem', background: 'linear-gradient(90deg, rgba(10,0,0,0.95) 0%, rgba(20,0,0,0.7) 100%)', borderRight: `2px solid ${horrorTheme.border}`, '@media (maxWidth: 1000px)': { display: 'none' } }}>
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: 'auto' }}>
                        <span style={{ display: 'inline-flex', width: '50px', height: '50px', background: horrorTheme.accent, color: 'black', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.8rem', textShadow: '0 0 10px rgba(255,255,255,0.5)', boxShadow: `0 0 15px ${horrorTheme.accent}` }}>✞</span>
                        <span style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', textShadow: `2px 2px 5px ${horrorTheme.accent}` }}>TrackUrCodeLife</span>
                    </nav>

                    <div style={{ margin: 'auto 0' }}>
                        <span style={{ fontSize: '1.2rem', color: horrorTheme.accent, letterSpacing: '4px', textTransform: 'uppercase' }}>STUDENT ONBOARDING</span>
                        <h1 style={{ fontSize: '4rem', fontWeight: 800, margin: '1rem 0', textShadow: `0 0 20px ${horrorTheme.accent}`, letterSpacing: '2px', lineHeight: 1.1 }}>Offer your soul to the registry.</h1>
                        <p style={{ color: horrorTheme.textMuted, fontSize: '1.4rem', fontStyle: 'italic', maxWidth: '600px', lineHeight: 1.5 }}>
                            Bind your ABES essence, connect your coding vessels, and prepare for eternal judgement on the leaderboard.
                        </p>
                    </div>

                    <div style={{ marginTop: 'auto', padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '12px', border: `1px solid ${horrorTheme.border}`, boxShadow: `inset 0 0 30px rgba(100,0,0,0.3)` }}>
                        <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 600, color: horrorTheme.accent }}>The Blood Pact</h3>
                        <p style={{ marginTop: '0.5rem', color: horrorTheme.textMuted, fontSize: '1.1rem' }}>Verification requires a sacred seal (OTP) delivered to your tethered email.</p>
                    </div>
                </section>

                <section style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backdropFilter: 'blur(5px)', overflowY: 'auto' }}>
                    <div style={{ width: '100%', maxWidth: '600px', background: 'linear-gradient(135deg, rgba(20,0,0,0.9) 0%, rgba(10,10,10,0.95) 100%)', borderRadius: '12px', border: `2px solid ${horrorTheme.border}`, padding: '3rem', boxShadow: `0 0 50px rgba(200, 0, 0, 0.2)` }}>
                        
                        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                            <span style={{ color: horrorTheme.accent, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1rem' }}>FORM THE PACT</span>
                            <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: 'white', textShadow: `0 0 10px ${horrorTheme.accent}` }}>Initiate Signup</h2>
                            <p style={{ color: horrorTheme.textMuted, fontStyle: 'italic' }}>Prove your worth before submitting.</p>
                        </div>

                        <form onSubmit={registerStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                    <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>True Name</span>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Your full name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none', transition: 'border 0.3s' }}
                                        onFocus={(e) => e.target.style.borderColor = horrorTheme.accent}
                                        onBlur={(e) => e.target.style.borderColor = horrorTheme.border}
                                    />
                                </label>

                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                    <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>The Mark (Roll No)</span>
                                    <input
                                        type="text"
                                        name="rollNo"
                                        placeholder="University roll number"
                                        value={formData.rollNo}
                                        onChange={handleChange}
                                        required
                                        style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none', transition: 'border 0.3s' }}
                                        onFocus={(e) => e.target.style.borderColor = horrorTheme.accent}
                                        onBlur={(e) => e.target.style.borderColor = horrorTheme.border}
                                    />
                                </label>
                            </div>

                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Astral Tether (College Email)</span>
                                <input
                                    type="email"
                                    name="collegeEmail"
                                    placeholder="name@abes.ac.in"
                                    value={formData.collegeEmail}
                                    onChange={handleChange}
                                    required
                                    style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none', transition: 'border 0.3s' }}
                                    onFocus={(e) => e.target.style.borderColor = horrorTheme.accent}
                                    onBlur={(e) => e.target.style.borderColor = horrorTheme.border}
                                />
                            </label>

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                {!otpSent && (
                                    <button
                                        type="button"
                                        onClick={sendOTP}
                                        disabled={loading || !formData.collegeEmail}
                                        style={{ flex: 1, padding: '1.2rem', background: 'transparent', border: `1px solid ${horrorTheme.accent}`, color: horrorTheme.accent, cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', transition: '0.3s', opacity: (loading || !formData.collegeEmail) ? 0.5 : 1 }}
                                        onMouseOver={(e) => { if (!loading && formData.collegeEmail) { e.currentTarget.style.background = horrorTheme.accent; e.currentTarget.style.color = 'black'; } }}
                                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = horrorTheme.accent; }}
                                    >
                                        {loading ? "Invoking..." : "Request Seal (OTP)"}
                                    </button>
                                )}

                                {otpSent && !verified && (
                                    <>
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                            <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>The Seal (OTP)</span>
                                            <input
                                                type="text"
                                                placeholder="6-digit code"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                maxLength="6"
                                                style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none', textAlign: 'center', letterSpacing: '3px' }}
                                                onFocus={(e) => e.target.style.borderColor = horrorTheme.accent}
                                                onBlur={(e) => e.target.style.borderColor = horrorTheme.border}
                                            />
                                        </label>

                                        <button
                                            type="button"
                                            onClick={verifyOTP}
                                            disabled={loading || otp.length < 6}
                                            style={{ padding: '1.2rem 2rem', background: horrorTheme.accent, border: `1px solid ${horrorTheme.accent}`, color: 'black', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', transition: '0.3s', opacity: (loading || otp.length < 6) ? 0.5 : 1 }}
                                            onMouseOver={(e) => { if (!loading && otp.length === 6) { e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 15px white'; } }}
                                            onMouseOut={(e) => { e.currentTarget.style.background = horrorTheme.accent; e.currentTarget.style.boxShadow = 'none'; }}
                                        >
                                            {loading ? "Judging..." : "Verify"}
                                        </button>
                                    </>
                                )}
                            </div>

                            {verified && <div style={{ padding: '1rem', background: 'rgba(0, 250, 154, 0.1)', border: '1px solid #00fa9a', color: '#00fa9a', textAlign: 'center', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '1px' }}>Soul Verified</div>}

                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Secret Phrase (Password)</span>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Minimum 6 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength="6"
                                    style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none', transition: 'border 0.3s' }}
                                    onFocus={(e) => e.target.style.borderColor = horrorTheme.accent}
                                    onBlur={(e) => e.target.style.borderColor = horrorTheme.border}
                                />
                            </label>

                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Chamber (Section)</span>
                                <select 
                                    name="section" 
                                    value={formData.section} 
                                    onChange={handleChange}
                                    style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.8)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none', cursor: 'pointer' }}
                                >
                                    <option value="CSE-11">CSE-11</option>
                                    <option value="CSE-14">CSE-14</option>
                                    <option value="CSE-18">CSE-18</option>
                                    <option value="CSE-22">CSE-22</option>
                                </select>
                            </label>

                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                    <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>LeetCode Alias</span>
                                    <input
                                        type="text"
                                        name="leetcodeUsername"
                                        placeholder="Optional"
                                        value={formData.leetcodeUsername}
                                        onChange={handleChange}
                                        style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none', transition: 'border 0.3s' }}
                                        onFocus={(e) => e.target.style.borderColor = horrorTheme.accent}
                                        onBlur={(e) => e.target.style.borderColor = horrorTheme.border}
                                    />
                                </label>

                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                    <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>CodeChef Alias</span>
                                    <input
                                        type="text"
                                        name="codechefUsername"
                                        placeholder="Optional"
                                        value={formData.codechefUsername}
                                        onChange={handleChange}
                                        style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none', transition: 'border 0.3s' }}
                                        onFocus={(e) => e.target.style.borderColor = horrorTheme.accent}
                                        onBlur={(e) => e.target.style.borderColor = horrorTheme.border}
                                    />
                                </label>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading || !verified}
                                style={{ marginTop: '1rem', padding: '1.2rem', background: horrorTheme.accent, border: `1px solid ${horrorTheme.accent}`, color: 'black', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', transition: 'all 0.3s', boxShadow: `0 0 15px ${horrorTheme.accent}`, opacity: (loading || !verified) ? 0.5 : 1 }}
                                onMouseOver={(e) => { if (!loading && verified) { e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 20px white'; } }}
                                onMouseOut={(e) => { e.currentTarget.style.background = horrorTheme.accent; e.currentTarget.style.boxShadow = `0 0 15px ${horrorTheme.accent}`; }}
                            >
                                {loading ? "Binding..." : "Seal the Pact"}
                            </button>
                        </form>

                        {message && messageType !== "success" && (
                            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.8)', borderLeft: `4px solid ${horrorTheme.accent}`, color: horrorTheme.accent, textAlign: 'center', fontStyle: 'italic' }}>
                                {message}
                            </div>
                        )}

                        {message && messageType === "success" && !verified && (
                            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.8)', borderLeft: `4px solid #00fa9a`, color: '#00fa9a', textAlign: 'center', fontStyle: 'italic' }}>
                                {message}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem', gap: '0.5rem', fontSize: '1.1rem' }}>
                            <span style={{ color: horrorTheme.textMuted }}>Already bound by the pact?</span>
                            <Link to="/login" style={{ color: horrorTheme.accent, textDecoration: 'none', fontWeight: 'bold', textShadow: `0 0 5px ${horrorTheme.accent}` }}>Return to the Gates</Link>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default Signup;
