import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const sections = ["CSE-11", "CSE-14", "CSE-18", "CSE-22"];

function EditProfile() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        rollNo: "",
        section: "",
        leetcodeUsername: "",
        codechefUsername: ""
    });
    const [message, setMessage] = useState("");
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
            navigate("/");
            return;
        }

        api.get("/students/dashboard", { headers: authHeaders })
            .then((response) => {
                const student = response.data.student;

                setForm({
                    name: student.name || "",
                    rollNo: student.rollNo || "",
                    section: student.section || "",
                    leetcodeUsername: student.leetcodeUsername || "",
                    codechefUsername: student.codechefUsername || ""
                });
            })
            .catch(() => {
                localStorage.removeItem("token");
                navigate("/");
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
            navigate("/");
            return;
        }

        try {
            setSaving(true);
            setMessage("");

            await api.put("/students/profile", form, {
                headers: authHeaders
            });

            setMessage("Profile updated successfully.");
        } catch (error) {
            setMessage(error.response?.data?.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <main className="app-page">
                <section className="state-card full-page-state">
                    <span className="loader" aria-hidden="true"></span>
                    <p>Loading profile...</p>
                </section>
            </main>
        );
    }

    return (
        <main className="app-page">
            <section className="page-header">
                <div>
                    <span className="eyebrow">STUDENT PROFILE</span>
                    <h1>Edit Profile</h1>
                    <p>Keep roll details and coding platform handles ready for sync.</p>
                </div>
                <button className="ghost-button" onClick={() => navigate("/dashboard")} type="button">
                    Back to Dashboard
                </button>
            </section>

            <section className="content-panel profile-panel">
                <form className="form-stack" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <label className="field">
                            <span>Name</span>
                            <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
                        </label>

                        <label className="field">
                            <span>Roll No</span>
                            <input
                                name="rollNo"
                                placeholder="Roll No"
                                value={form.rollNo}
                                onChange={handleChange}
                                required
                            />
                        </label>
                    </div>

                    <label className="field">
                        <span>Section</span>
                        <select name="section" value={form.section} onChange={handleChange} required>
                            <option value="">Select Section</option>
                            {sections.map((section) => (
                                <option key={section} value={section}>
                                    {section}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="form-grid">
                        <label className="field">
                            <span>LeetCode Username</span>
                            <input
                                name="leetcodeUsername"
                                placeholder="LeetCode Username"
                                value={form.leetcodeUsername}
                                onChange={handleChange}
                            />
                        </label>

                        <label className="field">
                            <span>CodeChef Username</span>
                            <input
                                name="codechefUsername"
                                placeholder="CodeChef Username"
                                value={form.codechefUsername}
                                onChange={handleChange}
                            />
                        </label>
                    </div>

                    <button className="primary-button" type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </form>

                {message && <p className="status-message success">{message}</p>}
            </section>
        </main>
    );
}

export default EditProfile;
