import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";

const metricOptions = [
    { value: "contestRating", label: "Contest Rating" },
    { value: "problemsSolved", label: "Problems Solved" },
    { value: "contestsParticipated", label: "Contests" },
    { value: "lastParticipatedContestDate", label: "Last Contest" }
];

const sections = ["CSE-11", "CSE-14", "CSE-18", "CSE-22"];

function Dashboard() {
    const navigate = useNavigate();
    const [platform, setPlatform] = useState("leetcode");
    const [metric, setMetric] = useState("contestRating");
    const [section, setSection] = useState("");
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentStudent, setCurrentStudent] = useState(null);

    const authHeaders = useCallback(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            return null;
        }

        return {
            Authorization: `Bearer ${token}`
        };
    }, []);

    const handleAuthError = useCallback((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem("token");
            navigate("/");
            return true;
        }

        return false;
    }, [navigate]);

    const fetchCurrentStudent = useCallback(async () => {
        const headers = authHeaders();

        if (!headers) {
            navigate("/");
            return;
        }

        try {
            const response = await api.get("/students/dashboard", { headers });
            setCurrentStudent(response.data.student);
        } catch (err) {
            if (!handleAuthError(err)) {
                setCurrentStudent(null);
            }
        }
    }, [authHeaders, handleAuthError, navigate]);

    const fetchLeaderboard = useCallback(async () => {
        const headers = authHeaders();

        if (!headers) {
            navigate("/");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const params = {
                platform,
                metric
            };

            if (section) {
                params.section = section;
            }

            const response = await api.get("/students/leaderboard", {
                params,
                headers
            });

            setStudents(response.data.leaderboard || []);
        } catch (err) {
            if (handleAuthError(err)) {
                return;
            }

            setError(err.response?.data?.message || "Unable to load leaderboard.");
        } finally {
            setLoading(false);
        }
    }, [authHeaders, handleAuthError, metric, navigate, platform, section]);

    useEffect(() => {
        fetchCurrentStudent();
    }, [fetchCurrentStudent]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const platformName = platform === "leetcode" ? "LeetCode" : "CodeChef";
    const metricLabel = metricOptions.find((item) => item.value === metric)?.label || "Contest Rating";

    const getStats = useCallback((student) => student[`${platform}Stats`] || student, [platform]);

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const getMetricValue = (student) => {
        const stats = getStats(student);

        if (metric === "lastParticipatedContestDate") {
            return formatDate(stats.lastParticipatedContestDate);
        }

        return stats[metric] ?? 0;
    };

    const summary = useMemo(() => {
        const activeStudents = students.filter((student) => {
            const stats = getStats(student);
            return stats.problemsSolved > 0 || stats.contestRating > 0 || stats.contestsParticipated > 0;
        }).length;

        const topStudent = students[0];
        const synced = students.filter((student) => getStats(student).lastUpdated).length;

        return {
            activeStudents,
            topStudent,
            synced
        };
    }, [getStats, students]);

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <button className="brand-section" onClick={() => navigate("/dashboard")}>
                    <span className="brand-logo">T</span>
                    <span>
                        <strong>TrackUrCodeLife</strong>
                        <small>Competitive programming tracker</small>
                    </span>
                </button>

                <div className="header-actions">
                    {currentStudent && (
                        <div className="student-mini-profile">
                            <span className="mini-avatar">
                                {currentStudent.name?.charAt(0)?.toUpperCase() || "S"}
                            </span>
                            <span className="mini-profile-info">
                                <strong>{currentStudent.name}</strong>
                                <small>{currentStudent.section}</small>
                            </span>
                        </div>
                    )}

                    <button className="ghost-button" onClick={() => navigate("/edit-profile")}>
                        Profile
                    </button>
                    <button className="dark-button" onClick={logout}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-main">
                <section className="dashboard-hero">
                    <div>
                        <span className="eyebrow">STUDENT PERFORMANCE</span>
                        <h1>Coding Leaderboard</h1>
                        <p>
                            Track class progress across LeetCode and CodeChef with clean rankings,
                            current platform stats, and section filters.
                        </p>
                    </div>

                    {currentStudent && (
                        <aside className="hero-student-card">
                            <span>Logged in as</span>
                            <strong>{currentStudent.name}</strong>
                            <small>{currentStudent.rollNo}</small>
                        </aside>
                    )}
                </section>

                <section className="summary-grid" aria-label="Leaderboard summary">
                    <article>
                        <span>Total Students</span>
                        <strong>{students.length}</strong>
                        <small>{section || "All sections"}</small>
                    </article>
                    <article>
                        <span>Active Profiles</span>
                        <strong>{summary.activeStudents}</strong>
                        <small>{platformName} activity found</small>
                    </article>
                    <article>
                        <span>Top Rank</span>
                        <strong>{summary.topStudent?.name || "-"}</strong>
                        <small>{summary.topStudent ? `${metricLabel}: ${getMetricValue(summary.topStudent)}` : "No data yet"}</small>
                    </article>
                    <article>
                        <span>Synced Profiles</span>
                        <strong>{summary.synced}</strong>
                        <small>Last update recorded</small>
                    </article>
                </section>

                <section className="control-panel">
                    <div className="platform-switch" aria-label="Platform switch">
                        <button
                            className={platform === "leetcode" ? "platform-card active" : "platform-card"}
                            onClick={() => setPlatform("leetcode")}
                            type="button"
                        >
                            <span className="platform-icon">LC</span>
                            <span>
                                <strong>LeetCode</strong>
                                <small>Problem solving and contests</small>
                            </span>
                        </button>

                        <button
                            className={platform === "codechef" ? "platform-card active" : "platform-card"}
                            onClick={() => setPlatform("codechef")}
                            type="button"
                        >
                            <span className="platform-icon">CC</span>
                            <span>
                                <strong>CodeChef</strong>
                                <small>Ratings and contest history</small>
                            </span>
                        </button>
                    </div>

                    <div className="filters-section">
                        <label className="filter-group">
                            <span>Rank By</span>
                            <select value={metric} onChange={(e) => setMetric(e.target.value)}>
                                {metricOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="filter-group">
                            <span>Section</span>
                            <select value={section} onChange={(e) => setSection(e.target.value)}>
                                <option value="">All Sections</option>
                                {sections.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </section>

                <section className="leaderboard-section">
                    <div className="leaderboard-header">
                        <div>
                            <span className="eyebrow">{platformName.toUpperCase()}</span>
                            <h2>{metricLabel} Rankings</h2>
                        </div>
                        <button className="ghost-button" onClick={fetchLeaderboard} type="button">
                            Refresh
                        </button>
                    </div>

                    {loading && (
                        <div className="state-card">
                            <span className="loader" aria-hidden="true"></span>
                            <p>Loading leaderboard...</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="state-card error-state">
                            <h3>Unable to load data</h3>
                            <p>{error}</p>
                            <button className="dark-button" onClick={fetchLeaderboard} type="button">
                                Try Again
                            </button>
                        </div>
                    )}

                    {!loading && !error && students.length === 0 && (
                        <div className="state-card">
                            <h3>No students found</h3>
                            <p>Try changing the section, platform, or metric.</p>
                        </div>
                    )}

                    {!loading && !error && students.length > 0 && (
                        <div className="table-wrapper">
                            <table className="leaderboard-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Student</th>
                                        <th>Section</th>
                                        <th>{metricLabel}</th>
                                        <th>Problems</th>
                                        <th>Contests</th>
                                        <th>Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => {
                                        const stats = getStats(student);

                                        return (
                                            <tr key={student._id || `${student.rollNo}-${index}`}>
                                                <td>
                                                    <span className={`rank rank-${index + 1}`}>
                                                        {student.rank || index + 1}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="student-cell">
                                                        <span className="student-avatar">
                                                            {student.name?.charAt(0)?.toUpperCase() || "S"}
                                                        </span>
                                                        <span>
                                                            <strong>{student.name}</strong>
                                                            <small>{student.rollNo}</small>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="section-badge">{student.section}</span>
                                                </td>
                                                <td>
                                                    <strong className="metric-value">{getMetricValue(student)}</strong>
                                                </td>
                                                <td>{stats.problemsSolved ?? 0}</td>
                                                <td>{stats.contestsParticipated ?? 0}</td>
                                                <td>
                                                    <span className="updated-date">
                                                        {formatDate(stats.lastUpdated)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <footer className="dashboard-footer">
                    <span>TrackUrCodeLife</span>
                    <button className="link-button" onClick={() => navigate("/developer")} type="button">
                        Developer
                    </button>
                </footer>
            </main>
        </div>
    );
}

export default Dashboard;
