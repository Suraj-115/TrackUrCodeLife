import { Link } from "react-router-dom";
import heroImage from "../assets/hero.png";

function Developer() {
    return (
        <main className="app-page developer-page">
            <section className="developer-hero">
                <div>
                    <span className="eyebrow">ABOUT THE PROJECT</span>
                    <h1>TrackUrCodeLife</h1>
                    <p>
                        A college coding performance tracker for ABES students, built to
                        compare progress across competitive programming platforms.
                    </p>
                    <div className="developer-actions">
                        <Link className="primary-link" to="/dashboard">
                            Open Dashboard
                        </Link>
                        <Link className="secondary-link" to="/">
                            Student Login
                        </Link>
                    </div>
                </div>

                <img src={heroImage} alt="TrackUrCodeLife dashboard visual" />
            </section>

            <section className="content-panel developer-card">
                <span className="eyebrow">DEVELOPER</span>
                <h2>Suraj</h2>
                <p>
                    Designed for students who want a clear view of ratings, solved
                    problems, contest participation, and section-level ranking.
                </p>
            </section>
        </main>
    );
}

export default Developer;
