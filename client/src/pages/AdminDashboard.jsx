import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const sections = ["CSE-11", "CSE-14", "CSE-18", "CSE-22"];

function AdminDashboard() {
    const navigate = useNavigate();

    // Shared State
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("error");

    // Data State
    const [students, setStudents] = useState([]);
    const [analyticsData, setAnalyticsData] = useState(null);

    // Filters
    const [platform, setPlatform] = useState("leetcode"); // "leetcode" or "codechef"
    const [section, setSection] = useState("");
    const [search, setSearch] = useState("");
    const [monthYear, setMonthYear] = useState(""); // "YYYY-MM" or "" for all-time

    // Actions
    const [editingStudent, setEditingStudent] = useState(null);
    const [syncing, setSyncing] = useState(false);

    const authHeaders = useCallback(() => {
        const token = localStorage.getItem("token");
        if (!token) return null;
        return { Authorization: `Bearer ${token}` };
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        navigate("/login");
    }, [navigate]);

    // Fetch Base Students
    const fetchStudents = useCallback(async () => {
        const headers = authHeaders();
        if (!headers) return logout();

        try {
            setLoading(true);
            const response = await api.get("/admin/students", { headers });
            setStudents(response.data.students || []);
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) return logout();
            setMessageType("error");
            setMessage("The spirits whisper of a failed connection to the students.");
        } finally {
            setLoading(false);
        }
    }, [authHeaders, logout]);

    // Fetch Analytics for specific month if needed
    const fetchAnalytics = useCallback(async (selectedMonthYear) => {
        if (!selectedMonthYear) {
            setAnalyticsData(null);
            return;
        }

        const headers = authHeaders();
        if (!headers) return logout();

        try {
            setLoading(true);
            const [year, month] = selectedMonthYear.split("-");
            const startDate = `${year}-${month}-01`;
            
            const date = new Date(year, parseInt(month), 0);
            const endDate = `${year}-${month}-${date.getDate()}`;

            const response = await api.get("/admin/contest-analytics", {
                params: { period: "custom", startDate, endDate },
                headers
            });
            setAnalyticsData(response.data.analytics || response.data);
        } catch (error) {
            setMessageType("error");
            setMessage("The analytics vanished into the shadows.");
        } finally {
            setLoading(false);
        }
    }, [authHeaders, logout]);

    // Initial Load
    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // Trigger Analytics on Month/Year Change
    useEffect(() => {
        fetchAnalytics(monthYear);
    }, [monthYear, fetchAnalytics]);

    // Merging logic & Filtering
    const processedStudents = useMemo(() => {
        let filtered = students.filter((student) => {
            const searchText = search.toLowerCase();
            const matchesSearch =
                student.name?.toLowerCase().includes(searchText) ||
                student.rollNo?.toLowerCase().includes(searchText) ||
                student.collegeEmail?.toLowerCase().includes(searchText);
            const matchesSection = !section || student.section === section;
            return matchesSearch && matchesSection;
        });

        return filtered.map((student) => {
            const stats = platform === "leetcode" ? student.leetcode : student.codechef;
            const username = platform === "leetcode" ? student.leetcodeUsername : student.codechefUsername;
            
            let contestCount = stats?.contestsParticipated || 0;

            if (monthYear && analyticsData?.studentDetails) {
                const analyticsRecord = analyticsData.studentDetails.find(s => s.id === student._id);
                if (analyticsRecord) {
                    contestCount = platform === "leetcode" ? analyticsRecord.leetcode : analyticsRecord.codechef;
                } else {
                    contestCount = 0; 
                }
            }

            return {
                ...student,
                displayUsername: username || "Lost Soul",
                displayRating: stats?.contestRating || 0,
                displayProblemsSolved: stats?.problemsSolved || 0,
                displayContests: contestCount
            };
        });
    }, [students, search, section, platform, monthYear, analyticsData]);

    const deleteStudent = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to drag this soul to the abyss?");
        if (!confirmDelete) return;

        const headers = authHeaders();
        try {
            await api.delete(`/admin/students/${id}`, { headers });
            await fetchStudents();
        } catch (error) {
            setMessageType("error");
            setMessage(error.response?.data?.message || "Failed to condemn student.");
        }
    };

    const updateStudent = async () => {
        const headers = authHeaders();
        try {
            await api.put(`/admin/students/${editingStudent._id}`, {
                name: editingStudent.name,
                rollNo: editingStudent.rollNo,
                section: editingStudent.section,
                collegeEmail: editingStudent.collegeEmail,
                leetcodeUsername: editingStudent.leetcodeUsername,
                codechefUsername: editingStudent.codechefUsername
            }, { headers });

            setEditingStudent(null);
            setMessageType("success");
            setMessage("The ritual of modification is complete.");
            await fetchStudents();
        } catch (error) {
            setMessageType("error");
            setMessage(error.response?.data?.message || "The curse remains unlifted.");
        }
    };

    const startSync = async () => {
        const headers = authHeaders();
        try {
            setSyncing(true);
            await api.post("/admin/students/sync", {}, { headers });
            setMessageType("success");
            setMessage("The dark summoning has begun.");
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) return logout();
            setMessageType("error");
            setMessage(error.response?.data?.message || "The summoning failed.");
        } finally {
            setSyncing(false);
        }
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
        <main style={{ minHeight: '100vh', background: horrorTheme.bg, color: horrorTheme.text, display: 'flex', flexDirection: 'column', fontFamily: "'Cinzel', 'Times New Roman', serif" }}>
            {/* Full-page dark overlay to ensure readability and eerie vibe */}
            <div style={{ flex: 1, backgroundColor: horrorTheme.overlay, display: 'flex', flexDirection: 'column' }}>
                
                {/* Eerie Artistic Header */}
                <header style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(20,0,0,0.4) 100%)', padding: '1.5rem 3rem', borderBottom: `2px solid ${horrorTheme.accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(200, 0, 0, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <span style={{ display: 'inline-flex', width: '50px', height: '50px', background: horrorTheme.accent, color: 'black', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.8rem', textShadow: '0 0 10px rgba(255,255,255,0.5)', boxShadow: `0 0 15px ${horrorTheme.accent}` }}>✞</span>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', textShadow: `2px 2px 5px ${horrorTheme.accent}` }}>TrackUrCodeLife</h2>
                            <span style={{ fontSize: '1rem', color: horrorTheme.accent, fontStyle: 'italic', letterSpacing: '1px' }}>The Admin Sanctum</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <button 
                            onClick={startSync} 
                            disabled={syncing}
                            style={{ padding: '0.8rem 1.5rem', background: 'transparent', border: `1px solid ${horrorTheme.accent}`, color: horrorTheme.accent, cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', transition: '0.3s', textShadow: `0 0 5px ${horrorTheme.accent}`, opacity: syncing ? 0.5 : 1 }}
                            onMouseOver={(e) => { e.currentTarget.style.background = horrorTheme.accent; e.currentTarget.style.color = 'black'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = horrorTheme.accent; }}
                        >
                            {syncing ? "Summoning..." : "Perform Ritual Sync"}
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

                <div style={{ flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {message && (
                        <div style={{ marginBottom: '2rem', padding: '1.5rem', borderLeft: `5px solid ${messageType === 'error' ? horrorTheme.accent : '#006400'}`, background: horrorTheme.surfaceSoft, color: messageType === 'error' ? horrorTheme.accent : '#00fa9a', fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '1px', boxShadow: '0 0 20px rgba(0,0,0,0.8)' }}>
                            {message}
                        </div>
                    )}

                    {/* Ritual Filters Panel */}
                    <div style={{ background: horrorTheme.surface, padding: '2rem', border: `1px solid ${horrorTheme.border}`, marginBottom: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8)' }}>
                        
                        {/* Platform Toggle */}
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', padding: '0.5rem', border: `1px solid ${horrorTheme.border}` }}>
                            <button 
                                style={{ padding: '0.75rem 2rem', border: 'none', background: platform === 'leetcode' ? horrorTheme.accent : 'transparent', color: platform === 'leetcode' ? 'white' : horrorTheme.textMuted, fontWeight: platform === 'leetcode' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.3s', textTransform: 'uppercase', letterSpacing: '1px' }}
                                onClick={() => setPlatform('leetcode')}
                            >
                                LeetCode
                            </button>
                            <button 
                                style={{ padding: '0.75rem 2rem', border: 'none', background: platform === 'codechef' ? horrorTheme.accent : 'transparent', color: platform === 'codechef' ? 'white' : horrorTheme.textMuted, fontWeight: platform === 'codechef' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.3s', textTransform: 'uppercase', letterSpacing: '1px' }}
                                onClick={() => setPlatform('codechef')}
                            >
                                CodeChef
                            </button>
                        </div>

                        {/* Search & Inputs */}
                        <input
                            type="text"
                            placeholder="Seek a name or scroll..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ flex: 1, minWidth: '250px', padding: '1rem', border: `1px solid ${horrorTheme.border}`, background: 'rgba(0,0,0,0.5)', color: horrorTheme.text, fontSize: '1.1rem', outline: 'none' }}
                        />

                        <select value={section} onChange={(e) => setSection(e.target.value)} style={{ padding: '1rem', border: `1px solid ${horrorTheme.border}`, background: 'rgba(0,0,0,0.8)', color: horrorTheme.text, fontSize: '1.1rem', outline: 'none', cursor: 'pointer' }}>
                            <option value="">All Cursed Sections</option>
                            {sections.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', border: `1px solid ${horrorTheme.border}` }}>
                            <span style={{ fontSize: '1.1rem', color: horrorTheme.accent, fontWeight: 'bold' }}>Eclipse Cycle:</span>
                            <input 
                                type="month" 
                                value={monthYear} 
                                onChange={(e) => setMonthYear(e.target.value)} 
                                style={{ padding: '0.5rem', background: 'transparent', color: horrorTheme.text, border: 'none', fontSize: '1.1rem', outline: 'none', colorScheme: 'dark' }}
                            />
                            {monthYear && (
                                <button onClick={() => setMonthYear("")} style={{ background: 'none', border: 'none', color: horrorTheme.textMuted, cursor: 'pointer', fontSize: '1.5rem', padding: '0 0.5rem' }} title="Reset to Eternity">
                                    &times;
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Dark Grimoire Table */}
                    <div style={{ background: horrorTheme.surface, border: `1px solid ${horrorTheme.border}`, overflowY: 'auto', flex: 1, boxShadow: `0 0 30px rgba(100, 0, 0, 0.1)` }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '5rem', color: horrorTheme.accent, fontSize: '2rem', fontStyle: 'italic', letterSpacing: '3px', animation: 'pulse 2s infinite' }}>Gazing into the abyss...</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '1.1rem' }}>
                                <thead style={{ position: 'sticky', top: 0, background: 'rgba(10, 0, 0, 0.95)', zIndex: 10, borderBottom: `2px solid ${horrorTheme.accent}` }}>
                                    <tr>
                                        <th style={{ padding: '1.5rem', color: horrorTheme.accent, textTransform: 'uppercase', letterSpacing: '1px' }}>Soul Name</th>
                                        <th style={{ padding: '1.5rem', color: horrorTheme.accent, textTransform: 'uppercase', letterSpacing: '1px' }}>Mark</th>
                                        <th style={{ padding: '1.5rem', color: horrorTheme.accent, textTransform: 'uppercase', letterSpacing: '1px' }}>Chamber</th>
                                        <th style={{ padding: '1.5rem', color: horrorTheme.accent, textTransform: 'uppercase', letterSpacing: '1px' }}>{platform === 'leetcode' ? 'LeetCode' : 'CodeChef'} Alias</th>
                                        <th style={{ padding: '1.5rem', color: horrorTheme.accent, textTransform: 'uppercase', letterSpacing: '1px' }}>Power Level</th>
                                        <th style={{ padding: '1.5rem', color: horrorTheme.accent, textTransform: 'uppercase', letterSpacing: '1px' }}>Entities Vanquished</th>
                                        <th style={{ padding: '1.5rem', color: horrorTheme.text, textTransform: 'uppercase', letterSpacing: '1px', textShadow: monthYear ? `0 0 8px ${horrorTheme.accent}` : 'none' }}>
                                            {monthYear ? `Trials (${monthYear})` : 'Trials (Eternity)'}
                                        </th>
                                        <th style={{ padding: '1.5rem', textAlign: 'right', color: horrorTheme.accent, textTransform: 'uppercase', letterSpacing: '1px' }}>Fate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedStudents.map((student, idx) => (
                                        <tr key={student._id} style={{ borderBottom: `1px solid ${horrorTheme.border}`, background: idx % 2 === 0 ? 'rgba(0,0,0,0.3)' : 'transparent', transition: 'background 0.3s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(50, 0, 0, 0.5)'} onMouseOut={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(0,0,0,0.3)' : 'transparent'}>
                                            <td style={{ padding: '1.5rem' }}>
                                                <strong style={{ fontSize: '1.2rem', color: 'white' }}>{student.name}</strong><br/>
                                                <small style={{ color: horrorTheme.textMuted, fontStyle: 'italic' }}>{student.collegeEmail}</small>
                                            </td>
                                            <td style={{ padding: '1.5rem', color: horrorTheme.textMuted }}>{student.rollNo}</td>
                                            <td style={{ padding: '1.5rem' }}>
                                                <span style={{ padding: '0.3rem 0.6rem', border: `1px solid ${horrorTheme.border}`, color: horrorTheme.accent, background: 'rgba(0,0,0,0.5)' }}>{student.section}</span>
                                            </td>
                                            
                                            <td style={{ padding: '1.5rem', color: student.displayUsername !== "Lost Soul" ? 'white' : horrorTheme.textMuted, fontStyle: student.displayUsername === "Lost Soul" ? 'italic' : 'normal' }}>
                                                {student.displayUsername}
                                            </td>
                                            <td style={{ padding: '1.5rem', fontWeight: 'bold', color: student.displayRating > 1500 ? horrorTheme.accent : 'white' }}>{student.displayRating}</td>
                                            <td style={{ padding: '1.5rem', color: 'white' }}>{student.displayProblemsSolved}</td>
                                            
                                            <td style={{ padding: '1.5rem', fontWeight: monthYear ? 'bold' : 'normal', color: monthYear ? horrorTheme.accent : 'white', fontSize: monthYear ? '1.2rem' : '1.1rem' }}>
                                                {student.displayContests}
                                            </td>
                                            
                                            <td style={{ padding: '1.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                <button 
                                                    onClick={() => setEditingStudent({...student})} 
                                                    style={{ background: 'transparent', border: `1px solid ${horrorTheme.textMuted}`, color: horrorTheme.textMuted, padding: '0.5rem 1rem', cursor: 'pointer', marginRight: '0.5rem', transition: '0.2s', textTransform: 'uppercase', fontSize: '0.9rem' }}
                                                    onMouseOver={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'white'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.color = horrorTheme.textMuted; e.currentTarget.style.borderColor = horrorTheme.textMuted; }}
                                                >
                                                    Alter
                                                </button>
                                                <button 
                                                    onClick={() => deleteStudent(student._id)} 
                                                    style={{ background: 'transparent', border: `1px solid ${horrorTheme.accent}`, color: horrorTheme.accent, padding: '0.5rem 1rem', cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase', fontSize: '0.9rem' }}
                                                    onMouseOver={(e) => { e.currentTarget.style.background = horrorTheme.accent; e.currentTarget.style.color = 'black'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = horrorTheme.accent; }}
                                                >
                                                    Condemn
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {processedStudents.length === 0 && (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '5rem', color: horrorTheme.accent, fontSize: '1.5rem', fontStyle: 'italic' }}>The graveyard is empty... no souls match your search.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Dark Ritual Edit Modal */}
            {editingStudent && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem', backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(20,0,0,1) 0%, rgba(10,10,10,1) 100%)', width: '100%', maxWidth: '600px', border: `2px solid ${horrorTheme.accent}`, boxShadow: `0 0 50px rgba(200, 0, 0, 0.3)` }}>
                        <div style={{ padding: '2rem', borderBottom: `1px solid ${horrorTheme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.8rem', color: horrorTheme.accent, textTransform: 'uppercase', letterSpacing: '2px', textShadow: `0 0 10px ${horrorTheme.accent}` }}>Alter the Soul</h2>
                            <button onClick={() => setEditingStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '2.5rem', color: horrorTheme.accent, lineHeight: 1 }}>&times;</button>
                        </div>
                        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>True Name</span>
                                <input value={editingStudent.name || ""} onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                    <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Mark (Roll No)</span>
                                    <input value={editingStudent.rollNo || ""} onChange={(e) => setEditingStudent({...editingStudent, rollNo: e.target.value})} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                    <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Chamber</span>
                                    <select value={editingStudent.section || "CSE-11"} onChange={(e) => setEditingStudent({...editingStudent, section: e.target.value})} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none', cursor: 'pointer' }}>
                                        {sections.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Astral Tether (Email)</span>
                                <input value={editingStudent.collegeEmail || ""} onChange={(e) => setEditingStudent({...editingStudent, collegeEmail: e.target.value})} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                    <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>LeetCode Alias</span>
                                    <input value={editingStudent.leetcodeUsername || ""} onChange={(e) => setEditingStudent({...editingStudent, leetcodeUsername: e.target.value})} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                    <span style={{ color: horrorTheme.textMuted, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>CodeChef Alias</span>
                                    <input value={editingStudent.codechefUsername || ""} onChange={(e) => setEditingStudent({...editingStudent, codechefUsername: e.target.value})} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.5)', border: `1px solid ${horrorTheme.border}`, color: 'white', fontSize: '1.1rem', outline: 'none' }} />
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '2rem', borderTop: `1px solid ${horrorTheme.border}`, display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', background: 'rgba(0,0,0,0.3)' }}>
                            <button 
                                onClick={() => setEditingStudent(null)}
                                style={{ background: 'transparent', border: `1px solid ${horrorTheme.textMuted}`, color: horrorTheme.textMuted, padding: '0.8rem 2rem', cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '1px' }}
                                onMouseOver={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'white'; }}
                                onMouseOut={(e) => { e.currentTarget.style.color = horrorTheme.textMuted; e.currentTarget.style.borderColor = horrorTheme.textMuted; }}
                            >
                                Retreat
                            </button>
                            <button 
                                onClick={updateStudent}
                                style={{ background: horrorTheme.accent, border: `1px solid ${horrorTheme.accent}`, color: 'black', padding: '0.8rem 2rem', cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase', fontSize: '1rem', fontWeight: 'bold', letterSpacing: '1px', boxShadow: `0 0 15px ${horrorTheme.accent}` }}
                                onMouseOver={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 20px white'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = horrorTheme.accent; e.currentTarget.style.boxShadow = `0 0 15px ${horrorTheme.accent}`; }}
                            >
                                Seal the Pact
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default AdminDashboard;

