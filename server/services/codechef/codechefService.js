const axios = require("axios");
const cheerio = require("cheerio");

const getCodeChefData = async (username) => {
    try {
        if (!username) {
            throw new Error("CodeChef username is required");
        }

        const url = `https://www.codechef.com/users/${username}`;

        const response = await axios.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36",
                "Accept":
                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);

        // -----------------------------
        // Contest Rating
        // -----------------------------

        let rating = 0;

        const ratingText = $(".rating-number")
            .first()
            .text()
            .trim();

        const parsedRating = Number(
            ratingText.replace(/[^\d.-]/g, "")
        );

        if (Number.isFinite(parsedRating)) {
            rating = Math.round(parsedRating);
        }

        // -----------------------------
        // Problems Solved
        // -----------------------------

        let problemsSolved = 0;

        const solvedText = $(
            ".rating-data-section.problems-solved h3"
        )
            .first()
            .text()
            .trim();

        const solvedMatch =
            solvedText.match(/\d+/);

        if (solvedMatch) {
            const parsedSolved =
                Number(solvedMatch[0]);

            if (Number.isFinite(parsedSolved)) {
                problemsSolved = parsedSolved;
            }
        }

        // -----------------------------
        // Contest participation
        // -----------------------------

        let contestsParticipated = 0;
        let lastParticipatedContestDate = null;

        /*
         * Contest participation/date is intentionally
         * kept as a safe default for now.
         *
         * We can implement robust contest-history
         * extraction later without breaking sync.
         */

        // -----------------------------
        // Final validation
        // -----------------------------

        if (!Number.isFinite(rating)) {
            rating = 0;
        }

        if (!Number.isFinite(problemsSolved)) {
            problemsSolved = 0;
        }

        if (!Number.isFinite(contestsParticipated)) {
            contestsParticipated = 0;
        }

        if (
            lastParticipatedContestDate &&
            isNaN(
                new Date(
                    lastParticipatedContestDate
                ).getTime()
            )
        ) {
            lastParticipatedContestDate = null;
        }

        return {
            problemsSolved,
            contestRating: rating,
            contestsParticipated,
            lastParticipatedContestDate
        };

    } catch (error) {

        if (error.response?.status === 429) {
            throw new Error(
                "CodeChef rate limit reached (429)"
            );
        }

        if (error.response?.status === 404) {
            throw new Error(
                "CodeChef user not found"
            );
        }

        throw new Error(
            `CodeChef request failed: ${
                error.message
            }`
        );
    }
};

module.exports = getCodeChefData;