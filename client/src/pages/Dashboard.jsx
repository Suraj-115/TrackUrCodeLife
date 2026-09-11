import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";

const sections = ["CSE-11", "CSE-14", "CSE-18", "CSE-22"];

function Dashboard() {
    const navigate = useNavigate();
    
    // Filters
    const [search, setSearch] = useState("");
    const [section, setSection] = useState("");
    const [sort, setSort] = useState("totalProblems");
    
    // Data
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentStudent, setCurrentStudent] = useState(null);

    const authHeaders = useCallback(() => {
        const token = localStorage.getItem("token");
        if (!token) return null;
        return { Authorization: `Bearer ${token}` };
    }, []);

    const handleAuthError = useCallback((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem("token");
            navigate("/login");
            return true;
        }
        return false;
    }, [navigate]);

    const fetchCurrentStudent = useCallback(async () => {
        const headers = authHeaders();
        if (!headers) {
            navigate("/login");
            return;
        }
        try {
            const response = await api.get("/students/me", { headers });
            setCurrentStudent(response.data.user);
        } catch (err) {
            if (!handleAuthError(err)) {
                setCurrentStudent(null);
            }
        }
    }, [authHeaders, handleAuthError, navigate]);

    const fetchLeaderboard = useCallback(async () => {
        const headers = authHeaders();
        if (!headers) {
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const params = { sort };
            if (section) params.section = section;
            if (search) params.search = search;

            const response = await api.get("/students", { params, headers });
            setStudents(response.data.students || []);
        } catch (err) {
            if (handleAuthError(err)) return;
            setError(err.response?.data?.message || "Unable to load leaderboard.");
        } finally {
            setLoading(false);
        }
    }, [authHeaders, handleAuthError, navigate, search, section, sort]);

    useEffect(() => {
        fetchCurrentStudent();
    }, [fetchCurrentStudent]);

    // Use debounced search internally if needed, but since data is relatively small, we can trigger fetch directly on a search button click or blur, or just debounce it.
    // For simplicity, we'll fetch on button click or 'Enter'.
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchLeaderboard();
    };

    useEffect(() => {
        // Trigger fetch when section or sort changes
        fetchLeaderboard();
    }, [section, sort]); // Intentionally not including search so we don't spam API on every keystroke, unless we debounce. We will rely on explicit search or enter key.

    const summary = useMemo(() => {
        const activeStudents = students.filter(s => s.totalProblems > 0 || s.totalRating > 0).length;
        return { activeStudents };
    }, [students]);

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    // HORROR THEME STYLES
    const horrorTheme = {
        bg: "url('/nun.jpg') center/cover no-repeat fixed",
        overlay: "rgba(5, 5, 5, 0.85)", // Darker translucent layer
        surface: "rgba(15, 5, 5, 0.75)", // Deep blood-tinted black
        surfaceSoft: "rgba(30, 10, 10, 0.8)",
        border: "#5c0a0a", // Deep blood red
        text: "#e5e5e5", // Pale bone white
        textMuted: "#a39999",
        accent: "#cc0000", // Crimson red
        accentHover: "#ff1a1a"
    };

    return (
        <div style={{ minHeight: '100vh', background: horrorTheme.bg, color: horrorTheme.text, display: 'flex', flexDirection: 'column', fontFamily: "'Cinzel', 'Times New Roman', serif" }}>
            <div style={{ flex: 1, backgroundColor: horrorTheme.overlay, display: 'flex', flexDirection: 'column' }}>
                <header style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(20,0,0,0.4) 100%)', padding: '1.5rem 3rem', borderBottom: `2px solid ${horrorTheme.accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(200, 0, 0, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', cursor: 'pointer' }} onClick={() => navigate("/dashboard")}>
                        <span style={{ display: 'inline-flex', width: '50px', height: '50px', background: horrorTheme.accent, color: 'black', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.8rem', textShadow: '0 0 10px rgba(255,255,255,0.5)', boxShadow: `0 0 15px ${horrorTheme.accent}` }}>✞</span>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', textShadow: `2px 2px 5px ${horrorTheme.accent}` }}>TrackUrCodeLife</h2>
                            <span style={{ fontSize: '1rem', color: horrorTheme.accent, fontStyle: 'italic', letterSpacing: '1px' }}>The Initiate's Path</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        {currentStudent && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginRight: '1rem' }}>
                                <span style={{ background: horrorTheme.accent, color: 'black', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: `0 0 10px ${horrorTheme.accent}` }}>
                                    {currentStudent.name?.charAt(0)?.toUpperCase() || "S"}
                                </span>
                                <span style={{ display: 'flex', flexDirection: 'column' }}>
                                    <strong style={{ fontSize: '1rem', color: 'white', letterSpacing: '1px' }}>{currentStudent.name}</strong>
                                </span>
                            </div>
                        )}
                        <button 
                            onClick={() => navigate("/profile")}
                            style={{ padding: '0.8rem 1.5rem', background: 'transparent', border: `1px solid ${horrorTheme.accent}`, color: horrorTheme.accent, cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', transition: '0.3s', textShadow: `0 0 5px ${horrorTheme.accent}` }}
                            onMouseOver={(e) => { e.currentTarget.style.background = horrorTheme.accent; e.currentTarget.style.color = 'black'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = horrorTheme.accent; }}
                        >
                            Reflect
                        </button>
                        <button 
                            onClick={logout}
                            style={{ padding: '0.8rem 1.5rem', background: horrorTheme.surface, border: `1px solid ${horrorTheme.border}`, color: horrorTheme.textMuted, cursor: 'pointer', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', transition: '0.3s' }}
                            onMouseOver={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'white'; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = horrorTheme.textMuted; e.currentTarget.style.borderColor = horrorTheme.border; }}
                        >
                            Flee
                        </button>
                    </div>
                </header>

                <main style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '3rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <section style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <span style={{ fontSize: '1.2rem', color: horrorTheme.accent, letterSpacing: '4px', textTransform: 'uppercase' }}>The Final Judgement</span>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, margin: '0.5rem 0', textShadow: `0 0 20px ${horrorTheme.accent}`, letterSpacing: '2px' }}>Coding Leaderboard</h1>
                        <p style={{ color: horrorTheme.textMuted, fontSize: '1.2rem', fontStyle: 'italic' }}>
                            Witness the ranking of souls across the abyss.
                        </p>
                    </section>

                    <section style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'flex-end', background: horrorTheme.surface, padding: '2rem', borderRadius: '12px', border: `1px solid ${horrorTheme.border}`, boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8)' }}>
                        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '250px', alignItems: 'flex-end' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Seek a Soul</span>
                                <input
                                    type="text"
                                    placeholder="Enter a name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ padding: '1rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none' }}
                                />
                            </div>
                            <button type="submit" style={{ padding: '1rem 2rem', background: horrorTheme.accent, border: `1px solid ${horrorTheme.accent}`, color: 'black', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', transition: '0.3s' }}>Seek</button>
                        </form>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
                            <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Chamber</span>
                            <select value={section} onChange={(e) => setSection(e.target.value)} style={{ padding: '1rem', background: 'rgba(0,0,0,0.8)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none', cursor: 'pointer' }}>
                                <option value="">All Chambers</option>
                                {sections.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
                            <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Measure By</span>
                            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: '1rem', background: 'rgba(0,0,0,0.8)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none', cursor: 'pointer' }}>
                                <option value="totalProblems">Total Torment (Problems)</option>
                                <option value="totalRating">Total Power (Rating)</option>
                                <option value="leetcodeProblems">LeetCode Torment</option>
                                <option value="codechefProblems">CodeChef Torment</option>
                            </select>
                        </div>
                    </section>

                    <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {loading && (
                            <div style={{ textAlign: 'center', padding: '5rem', color: horrorTheme.accent, fontSize: '2rem', fontStyle: 'italic', letterSpacing: '3px', animation: 'pulse 2s infinite' }}>
                                Summoning the ranks...
                            </div>
                        )}

                        {!loading && error && (
                            <div style={{ textAlign: 'center', padding: '3rem', border: `2px solid ${horrorTheme.accent}`, background: horrorTheme.surfaceSoft, color: horrorTheme.accent }}>
                                <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem', textTransform: 'uppercase' }}>The Ritual Failed</h3>
                                <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>{error}</p>
                                <button onClick={fetchLeaderboard} style={{ padding: '1rem 2rem', background: 'transparent', border: `1px solid ${horrorTheme.accent}`, color: horrorTheme.accent, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', transition: '0.3s' }}>Attempt Again</button>
                            </div>
                        )}

                        {!loading && !error && students.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '5rem', color: horrorTheme.textMuted, fontSize: '1.5rem', fontStyle: 'italic', background: horrorTheme.surface, border: `1px solid ${horrorTheme.border}` }}>
                                No souls match your query. They have evaded judgement.
                            </div>
                        )}

                        {!loading && !error && students.length > 0 && (
                            <div style={{ background: horrorTheme.surface, border: `1px solid ${horrorTheme.border}`, overflowY: 'auto', flex: 1, boxShadow: `0 0 30px rgba(100, 0, 0, 0.1)` }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '1.1rem' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: 'rgba(10, 0, 0, 0.95)', zIndex: 10, borderBottom: `2px solid ${horrorTheme.accent}` }}>
                                        <tr>
                                            <th style={{ padding: '1.5rem', color: horrorTheme.accent, textTransform: 'uppercase', letterSpacing: '1px' }}>Rank</th>
                                            <th style={{ padding: '1.5rem', color: horrorTheme.accent, textTransform: 'uppercase', letterSpacing: '1px' }}>Soul Name</th>
                                            <th style={{ padding: '1.5rem', color: horrorTheme.accent, textTransform: 'uppercase', letterSpacing: '1px' }}>Chamber</th>
                                            <th style={{ padding: '1.5rem', color: horrorTheme.accent, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>LeetCode (Torment / Power)</th>
                                            <th style={{ padding: '1.5rem', color: horrorTheme.accent, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>CodeChef (Torment / Power)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student, index) => (
                                            <tr key={student._id} style={{ borderBottom: `1px solid ${horrorTheme.border}`, background: index % 2 === 0 ? 'rgba(0,0,0,0.3)' : 'transparent', transition: 'background 0.3s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(50, 0, 0, 0.5)'} onMouseOut={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'rgba(0,0,0,0.3)' : 'transparent'}>
                                                <td style={{ padding: '1.5rem', fontWeight: 'bold', color: horrorTheme.accent, fontSize: '1.5rem', textShadow: `0 0 5px ${horrorTheme.accent}` }}>#{student.rank}</td>
                                                <td style={{ padding: '1.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <span style={{ background: 'rgba(0,0,0,0.8)', border: `1px solid ${horrorTheme.accent}`, color: horrorTheme.accent, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: `0 0 10px ${horrorTheme.accent}` }}>
                                                            {student.name.charAt(0).toUpperCase()}
                                                        </span>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <strong style={{ color: 'white', fontSize: '1.2rem', letterSpacing: '1px' }}>{student.name}</strong>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.5rem' }}>
                                                    <span style={{ padding: '0.4rem 0.8rem', border: `1px solid ${horrorTheme.border}`, color: horrorTheme.accent, background: 'rgba(0,0,0,0.5)', letterSpacing: '1px' }}>
                                                        {student.section}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1.5rem', textAlign: 'center' }}>
                                                    {student.leetcodeUsername ? (
                                                        <div style={{ fontSize: '1.2rem' }}>
                                                            <strong style={{ color: 'white' }}>{student.leetcode.problemsSolved}</strong> <span style={{ color: horrorTheme.border }}>/</span> <span style={{ color: horrorTheme.textMuted }}>{student.leetcode.contestRating}</span>
                                                        </div>
                                                    ) : <span style={{ color: horrorTheme.border, fontStyle: 'italic' }}>Lost Soul</span>}
                                                </td>
                                                <td style={{ padding: '1.5rem', textAlign: 'center' }}>
                                                    {student.codechefUsername ? (
                                                        <div style={{ fontSize: '1.2rem' }}>
                                                            <strong style={{ color: 'white' }}>{student.codechef.problemsSolved}</strong> <span style={{ color: horrorTheme.border }}>/</span> <span style={{ color: horrorTheme.textMuted }}>{student.codechef.contestRating}</span>
                                                        </div>
                                                    ) : <span style={{ color: horrorTheme.border, fontStyle: 'italic' }}>Lost Soul</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}

export default Dashboard;

