import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const sections = ["CSE-11", "CSE-14", "CSE-18", "CSE-22"];

function AdminDashboard() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState("");
    const [section, setSection] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [editingStudent, setEditingStudent] = useState(null);

    const authHeaders = useCallback(() => {
        const token = localStorage.getItem("adminToken");

        if (!token) {
            return null;
        }

        return {
            Authorization: `Bearer ${token}`
        };
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("adminToken");
        navigate("/admin-login");
    }, [navigate]);

    const fetchStudents = useCallback(async () => {
        const headers = authHeaders();

        if (!headers) {
            navigate("/admin-login");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            const response = await api.get("/students/admin/students", {
                headers
            });

            setStudents(response.data.students || []);
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                logout();
                return;
            }

            setMessage(error.response?.data?.message || "Failed to fetch students.");
        } finally {
            setLoading(false);
        }
    }, [authHeaders, logout, navigate]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const filteredStudents = useMemo(() => {
        return students.filter((student) => {
            const searchText = search.toLowerCase();
            const matchesSearch =
                student.name?.toLowerCase().includes(searchText) ||
                student.rollNo?.toLowerCase().includes(searchText) ||
                student.collegeEmail?.toLowerCase().includes(searchText);
            const matchesSection = !section || student.section === section;

            return matchesSearch && matchesSection;
        });
    }, [search, section, students]);

    const deleteStudent = async (id) => {
        const confirmDelete = window.confirm("Delete this student permanently?");

        if (!confirmDelete) {
            return;
        }

        const headers = authHeaders();

        if (!headers) {
            logout();
            return;
        }

        try {
            await api.delete(`/students/admin/students/${id}`, { headers });
            await fetchStudents();
        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to delete student.");
        }
    };

    const updateStudent = async () => {
        const headers = authHeaders();

        if (!headers) {
            logout();
            return;
        }

        try {
            await api.put(
                `/students/admin/students/${editingStudent._id}`,
                {
                    name: editingStudent.name,
                    rollNo: editingStudent.rollNo,
                    section: editingStudent.section,
                    collegeEmail: editingStudent.collegeEmail,
                    leetcodeUsername: editingStudent.leetcodeUsername,
                    codechefUsername: editingStudent.codechefUsername
                },
                { headers }
            );

            setEditingStudent(null);
            await fetchStudents();
        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to update student.");
        }
    };

    return (
        <main className="app-page admin-page">
            <header className="admin-header">
                <button className="brand-section" onClick={() => navigate("/admin")} type="button">
                    <span className="brand-logo">T</span>
                    <span>
                        <strong>TrackUrCodeLife Admin</strong>
                        <small>Student data management</small>
                    </span>
                </button>
                <button className="dark-button" onClick={logout} type="button">
                    Logout
                </button>
            </header>

            <section className="page-header">
                <div>
                    <span className="eyebrow">ADMIN DASHBOARD</span>
                    <h1>Students</h1>
                    <p>Review and maintain registered coding profiles.</p>
                </div>
                <div className="admin-count">
                    <strong>{filteredStudents.length}</strong>
                    <span>visible</span>
                </div>
            </section>

            <section className="content-panel">
                <div className="admin-toolbar">
                    <label className="field">
                        <span>Search</span>
                        <input
                            type="text"
                            placeholder="Name, roll no, or email"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </label>

                    <label className="field">
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

                {message && <p className="status-message error">{message}</p>}

                {loading && (
                    <div className="state-card">
                        <span className="loader" aria-hidden="true"></span>
                        <p>Loading students...</p>
                    </div>
                )}

                {!loading && filteredStudents.length === 0 && (
                    <div className="state-card">
                        <h3>No matching students</h3>
                        <p>Adjust the search or section filter.</p>
                    </div>
                )}

                {!loading && filteredStudents.length > 0 && (
                    <div className="table-wrapper">
                        <table className="leaderboard-table admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Roll No</th>
                                    <th>Email</th>
                                    <th>Section</th>
                                    <th>LeetCode</th>
                                    <th>CodeChef</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => (
                                    <tr key={student._id}>
                                        <td>
                                            <strong>{student.name}</strong>
                                        </td>
                                        <td>{student.rollNo}</td>
                                        <td>{student.collegeEmail}</td>
                                        <td>
                                            <span className="section-badge">{student.section}</span>
                                        </td>
                                        <td>{student.leetcodeUsername || "-"}</td>
                                        <td>{student.codechefUsername || "-"}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="ghost-button"
                                                    onClick={() => setEditingStudent({ ...student })}
                                                    type="button"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="danger-button"
                                                    onClick={() => deleteStudent(student._id)}
                                                    type="button"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {editingStudent && (
                <div className="modal-backdrop" role="presentation">
                    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-student-title">
                        <div className="modal-header">
                            <div>
                                <span className="eyebrow">EDIT STUDENT</span>
                                <h2 id="edit-student-title">{editingStudent.name}</h2>
                            </div>
                            <button className="icon-button" onClick={() => setEditingStudent(null)} type="button">
                                X
                            </button>
                        </div>

                        <div className="form-stack">
                            <div className="form-grid">
                                <label className="field">
                                    <span>Name</span>
                                    <input
                                        value={editingStudent.name || ""}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                                        placeholder="Name"
                                    />
                                </label>

                                <label className="field">
                                    <span>Roll No</span>
                                    <input
                                        value={editingStudent.rollNo || ""}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, rollNo: e.target.value })}
                                        placeholder="Roll No"
                                    />
                                </label>
                            </div>

                            <label className="field">
                                <span>Email</span>
                                <input
                                    value={editingStudent.collegeEmail || ""}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, collegeEmail: e.target.value })}
                                    placeholder="Email"
                                />
                            </label>

                            <label className="field">
                                <span>Section</span>
                                <select
                                    value={editingStudent.section || "CSE-11"}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, section: e.target.value })}
                                >
                                    {sections.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div className="form-grid">
                                <label className="field">
                                    <span>LeetCode</span>
                                    <input
                                        value={editingStudent.leetcodeUsername || ""}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, leetcodeUsername: e.target.value })}
                                        placeholder="LeetCode username"
                                    />
                                </label>

                                <label className="field">
                                    <span>CodeChef</span>
                                    <input
                                        value={editingStudent.codechefUsername || ""}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, codechefUsername: e.target.value })}
                                        placeholder="CodeChef username"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="ghost-button" onClick={() => setEditingStudent(null)} type="button">
                                Cancel
                            </button>
                            <button className="primary-button" onClick={updateStudent} type="button">
                                Save Changes
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}

export default AdminDashboard;
