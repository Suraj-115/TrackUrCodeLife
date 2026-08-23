const axios = require("axios");
const cheerio = require("cheerio");

const parseAllRating = (html) => {
    const match = html.match(/var\s+all_rating\s*=\s*(\[[\s\S]*?\]);/);

    if (!match) {
        return [];
    }

    try {
        const ratings = JSON.parse(match[1]);
        return Array.isArray(ratings) ? ratings : [];
    } catch (error) {
        return [];
    }
};

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
                Accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            },
            timeout: 15000,
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 400
        });

        const html = String(response.data);
        const $ = cheerio.load(html);
        const pageText = $("body").text();

        if (
            pageText.includes("The user you are looking for does not exist") ||
            pageText.includes("The username you entered does not exist")
        ) {
            throw new Error("CodeChef user not found");
        }

        let rating = 0;
        const ratingText = $(".rating-number").first().text().trim();
        const parsedRating = Number(ratingText.replace(/[^\d.-]/g, ""));

        if (Number.isFinite(parsedRating)) {
            rating = Math.round(parsedRating);
        }

        let problemsSolved = 0;
        const solvedText = $(".rating-data-section.problems-solved h3")
            .first()
            .text()
            .trim();
        const solvedMatch = solvedText.match(/\d+/);

        if (solvedMatch) {
            const parsedSolved = Number(solvedMatch[0]);

            if (Number.isFinite(parsedSolved)) {
                problemsSolved = parsedSolved;
            }
        }

        const contests = parseAllRating(html);
        let contestsParticipated = contests.length;
        let lastParticipatedContestDate = null;

        if (contests.length > 0) {
            const latestContest = contests.reduce((latest, current) => {
                const latestDate = new Date(latest.end_date || latest.endDate);
                const currentDate = new Date(current.end_date || current.endDate);

                return currentDate > latestDate ? current : latest;
            });

            const parsedDate = new Date(
                latestContest.end_date || latestContest.endDate
            );

            if (!isNaN(parsedDate.getTime())) {
                lastParticipatedContestDate = parsedDate;
            }
        }

        if (!Number.isFinite(rating)) {
            rating = 0;
        }

        if (!Number.isFinite(problemsSolved)) {
            problemsSolved = 0;
        }

        if (!Number.isFinite(contestsParticipated)) {
            contestsParticipated = 0;
        }

        return {
            problemsSolved,
            contestRating: rating,
            contestsParticipated,
            lastParticipatedContestDate
        };
    } catch (error) {
        if (error.response?.status === 429) {
            throw new Error("CodeChef rate limit reached (429)");
        }

        if (error.response?.status === 404) {
            throw new Error("CodeChef user not found");
        }

        if (
            error.message === "CodeChef user not found" ||
            error.message.includes("rate limit")
        ) {
            throw error;
        }

        throw new Error(`CodeChef request failed: ${error.message}`);
    }
};

module.exports = getCodeChefData;
