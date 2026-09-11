const axios = require("axios");
const cheerio = require("cheerio");

const REQUEST_TIMEOUT_MS = 15000;

/**
 * CodeChef embeds the full rated-contest history of a user in a `all_rating`
 * JavaScript variable on their profile page.
 */
const parseAllRating = (html) => {
    const match = html.match(/var\s+all_rating\s*=\s*(\[[\s\S]*?\]);/);

    if (!match) {
        return null;
    }

    try {
        const parsed = JSON.parse(match[1]);
        return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
        return null;
    }
};

const parseNumber = (value) => {
    /*
     * Guard the empty case explicitly: Number("") is 0, not NaN, so a missing
     * element would otherwise be reported as a real zero and wipe good data.
     */
    const text = String(value ?? "").trim();

    if (!text) {
        return null;
    }

    const parsed = Number(text.replace(/[^\d.-]/g, ""));

    return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Fetches a CodeChef user's aggregate stats plus their contest history.
 *
 * Each `all_rating` entry carries the contest `code` (e.g. "START224D") and
 * an `end_date`, which together make contest participation storable with
 * dates and deduplicatable across syncs.
 */
const getCodeChefData = async (username) => {
    if (!username) {
        throw new Error("CodeChef username is required");
    }

    const url = `https://www.codechef.com/users/${encodeURIComponent(username)}`;

    let response;

    try {
        response = await axios.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36",
                Accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            },
            timeout: REQUEST_TIMEOUT_MS,
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 400
        });
    } catch (error) {
        if (error.response?.status === 429) {
            throw new Error("CodeChef rate limit reached (429)");
        }

        if (error.response?.status === 404) {
            throw new Error("CodeChef user not found");
        }

        throw new Error(`CodeChef request failed: ${error.message}`);
    }

    const html = String(response.data);
    const $ = cheerio.load(html);
    const pageText = $("body").text();

    if (
        pageText.includes("The user you are looking for does not exist") ||
        pageText.includes("The username you entered does not exist")
    ) {
        throw new Error("CodeChef user not found");
    }

    const rating = parseNumber($(".rating-number").first().text());

    /*
     * The problems-solved block contains several headings — "Learning Paths
     * (0)", "Practice Paths (10)", "Contests (5)" — and only the last one,
     * "Total Problems Solved: 388", is the real figure. Taking the first
     * heading (as an earlier version did) silently recorded 0 for every
     * student, so match on the label instead of the position.
     */
    let problemsSolved = null;

    $(".rating-data-section.problems-solved h3").each((index, element) => {
        const text = $(element).text();

        if (!/total\s+problems\s+solved/i.test(text)) {
            return;
        }

        const match = text.match(/(\d+)/);

        if (match) {
            problemsSolved = Number(match[1]);
        }
    });

    const rawContests = parseAllRating(html);

    /*
     * If none of the structures were found, the page almost certainly changed
     * shape or served an interstitial. Throwing here marks the sync as FAILED
     * and preserves the student's existing statistics, instead of overwriting
     * real data with zeros.
     */
    if (rating === null && problemsSolved === null && rawContests === null) {
        throw new Error(
            "CodeChef page structure not recognised (profile data not found)"
        );
    }

    const contests = (rawContests || [])
        .map((entry) => {
            const code = String(entry.code || "").trim();
            const endDateRaw = entry.end_date || entry.endDate;

            if (!code || !endDateRaw) {
                return null;
            }

            const participatedAt = new Date(endDateRaw);

            if (Number.isNaN(participatedAt.getTime())) {
                return null;
            }

            return {
                contestKey: code,
                title: String(entry.name || code).trim(),
                participatedAt,
                rating: parseNumber(entry.rating),
                rank: parseNumber(entry.rank),
                problemsSolved: null
            };
        })
        .filter(Boolean);

    const lastParticipatedContestDate = contests.length
        ? contests.reduce(
            (latest, current) =>
                current.participatedAt > latest.participatedAt
                    ? current
                    : latest
        ).participatedAt
        : null;

    /*
     * The stored history length is the authoritative count, since it is
     * exactly what the analytics query will sum. Fall back to scraping the
     * count element only when the history block was absent.
     */
    const contestsParticipated = rawContests
        ? contests.length
        : parseNumber($(".contest-participated-count").text());

    /*
     * `null` means "not found on the page" and is intentionally not coerced
     * to 0 here: the sync layer skips null fields so a partially rendered
     * page cannot overwrite a previously valid rating with zero.
     */
    return {
        problemsSolved,
        contestRating: rating,
        contestsParticipated,
        lastParticipatedContestDate,
        contests
    };
};

module.exports = getCodeChefData;
