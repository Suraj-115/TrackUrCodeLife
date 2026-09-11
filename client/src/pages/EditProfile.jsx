import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function EditProfile() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        rollNo: "",
        section: "",
        collegeEmail: "",
        leetcodeUsername: "",
        codechefUsername: ""
    });
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const headers = useCallback(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            return null;
        }

        return {
            Authorization: `Bearer ${token}`
        };
    }, []);

    useEffect(() => {
        const authHeaders = headers();

        if (!authHeaders) {
            navigate("/login");
            return;
        }

        api.get("/students/me", { headers: authHeaders })
            .then((response) => {
                const student = response.data.user;

                setForm({
                    name: student.name || "",
                    rollNo: student.rollNo || "",
                    section: student.section || "",
                    collegeEmail: student.collegeEmail || "",
                    leetcodeUsername: student.leetcodeUsername || "",
                    codechefUsername: student.codechefUsername || ""
                });
            })
            .catch(() => {
                localStorage.removeItem("token");
                navigate("/login");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [headers, navigate]);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const authHeaders = headers();

        if (!authHeaders) {
            navigate("/login");
            return;
        }

        try {
            setSaving(true);
            setMessage("");
            setIsError(false);

            await api.put("/students/profile", {
                leetcodeUsername: form.leetcodeUsername,
                codechefUsername: form.codechefUsername
            }, {
                headers: authHeaders
            });

            setMessage("Profile updated successfully. Platform stats will refresh shortly.");
        } catch (error) {
            setIsError(true);
            setMessage(error.response?.data?.message || "Update failed");
        } finally {
            setSaving(false);
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

    if (loading) {
        return (
            <main style={{ minHeight: '100vh', background: horrorTheme.bg, color: horrorTheme.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cinzel', 'Times New Roman', serif" }}>
                <div style={{ padding: '3rem', background: horrorTheme.surface, border: `1px solid ${horrorTheme.border}`, borderRadius: '12px', textAlign: 'center', boxShadow: `0 0 50px rgba(200, 0, 0, 0.2)` }}>
                    <p style={{ fontSize: '1.5rem', color: horrorTheme.accent, letterSpacing: '2px', textTransform: 'uppercase', fontStyle: 'italic' }}>Reading the grimoire...</p>
                </div>
            </main>
        );
    }

    return (
        <main style={{ minHeight: '100vh', background: horrorTheme.bg, color: horrorTheme.text, fontFamily: "'Cinzel', 'Times New Roman', serif" }}>
            <div style={{ minHeight: '100vh', backgroundColor: horrorTheme.overlay, padding: '2rem' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: `1px solid ${horrorTheme.border}` }}>
                        <div>
                            <span style={{ color: horrorTheme.accent, letterSpacing: '3px', textTransform: 'uppercase', fontSize: '1rem' }}>SOUL MANIFEST</span>
                            <h1 style={{ margin: '0.5rem 0', fontSize: '2.5rem', fontWeight: 800, textShadow: `0 0 15px ${horrorTheme.accent}` }}>Alter Your Essence</h1>
                            <p style={{ color: horrorTheme.textMuted, fontStyle: 'italic' }}>Manage your vessels for the trial.</p>
                        </div>
                        <button 
                            onClick={() => navigate("/dashboard")} 
                            type="button"
                            style={{ background: 'transparent', border: `1px solid ${horrorTheme.textMuted}`, color: horrorTheme.textMuted, padding: '0.8rem 1.5rem', cursor: 'pointer', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', transition: 'all 0.3s' }}
                            onMouseOver={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'white'; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = horrorTheme.textMuted; e.currentTarget.style.borderColor = horrorTheme.textMuted; }}
                        >
                            Flee to Dashboard
                        </button>
                    </section>

                    <section style={{ background: 'linear-gradient(135deg, rgba(20,0,0,0.9) 0%, rgba(10,10,10,0.95) 100%)', padding: '3rem', borderRadius: '12px', border: `2px solid ${horrorTheme.border}`, boxShadow: `0 0 50px rgba(200, 0, 0, 0.2)` }}>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            
                            <div style={{ paddingBottom: '2.5rem', borderBottom: `1px solid ${horrorTheme.border}` }}>
                                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', color: 'white', textShadow: `0 0 10px ${horrorTheme.accent}` }}>Mortal Identity</h3>
                                <p style={{ color: horrorTheme.textMuted, fontSize: '1rem', marginBottom: '1.5rem', fontStyle: 'italic' }}>These marks are etched in stone and cannot be altered by your hand.</p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>True Name</span>
                                        <input value={form.name} disabled style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.8)', border: `1px solid #333`, color: '#666', fontSize: '1.1rem', cursor: 'not-allowed' }} />
                                    </label>

                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Astral Tether (Email)</span>
                                        <input value={form.collegeEmail} disabled style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.8)', border: `1px solid #333`, color: '#666', fontSize: '1.1rem', cursor: 'not-allowed' }} />
                                    </label>

                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>The Mark (Roll No)</span>
                                        <input value={form.rollNo} disabled style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.8)', border: `1px solid #333`, color: '#666', fontSize: '1.1rem', cursor: 'not-allowed' }} />
                                    </label>

                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Chamber (Section)</span>
                                        <input value={form.section} disabled style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.8)', border: `1px solid #333`, color: '#666', fontSize: '1.1rem', cursor: 'not-allowed' }} />
                                    </label>
                                </div>
                            </div>

                            <div>
                                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', color: 'white', textShadow: `0 0 10px ${horrorTheme.accent}` }}>Vessels of Trial</h3>
                                <p style={{ color: horrorTheme.textMuted, fontSize: '1rem', marginBottom: '1.5rem', fontStyle: 'italic' }}>Connect your aliases so the registry may judge your deeds.</p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>LeetCode Alias</span>
                                        <input
                                            name="leetcodeUsername"
                                            placeholder="Enter your handle"
                                            value={form.leetcodeUsername}
                                            onChange={handleChange}
                                            style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none', transition: 'border 0.3s' }}
                                            onFocus={(e) => e.target.style.borderColor = horrorTheme.accent}
                                            onBlur={(e) => e.target.style.borderColor = horrorTheme.border}
                                        />
                                    </label>

                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>CodeChef Alias</span>
                                        <input
                                            name="codechefUsername"
                                            placeholder="Enter your handle"
                                            value={form.codechefUsername}
                                            onChange={handleChange}
                                            style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none', transition: 'border 0.3s' }}
                                            onFocus={(e) => e.target.style.borderColor = horrorTheme.accent}
                                            onBlur={(e) => e.target.style.borderColor = horrorTheme.border}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    style={{ padding: '1.2rem 2.5rem', background: horrorTheme.accent, border: `1px solid ${horrorTheme.accent}`, color: 'black', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', transition: 'all 0.3s', boxShadow: `0 0 15px ${horrorTheme.accent}`, opacity: saving ? 0.7 : 1 }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 20px white'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = horrorTheme.accent; e.currentTarget.style.boxShadow = `0 0 15px ${horrorTheme.accent}`; }}
                                >
                                    {saving ? "Binding..." : "Carve Changes"}
                                </button>
                                
                                {message && (
                                    <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.8)', borderLeft: `4px solid ${isError ? horrorTheme.accent : '#00fa9a'}`, color: isError ? horrorTheme.accent : '#00fa9a', fontStyle: 'italic', flex: 1 }}>
                                        {message}
                                    </div>
                                )}
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </main>
    );
}

export default EditProfile;

