const axios = require("axios");

const LEETCODE_URL = "https://leetcode.com/graphql";

const REQUEST_TIMEOUT_MS = 20000;

/**
 * Fetches a LeetCode user's aggregate stats plus their contest history.
 *
 * Aggregate counters alone cannot answer date-range questions, so the
 * participated contests are returned as a normalised array. Each entry keeps
 * the contest title, which is stable per contest and therefore usable as a
 * deduplication key.
 */
const getLeetCodeData = async (username) => {
    if (!username) {
        throw new Error("LeetCode username is required");
    }

    const query = `
        query getLeetCodeData($username: String!) {
            matchedUser(username: $username) {
                submitStatsGlobal {
                    acSubmissionNum {
                        difficulty
                        count
                    }
                }
            }

            userContestRanking(username: $username) {
                rating
                attendedContestsCount
            }

            userContestRankingHistory(username: $username) {
                attended
                rating
                ranking
                problemsSolved
                contest {
                    title
                    startTime
                }
            }
        }
    `;

    let response;

    try {
        response = await axios.post(
            LEETCODE_URL,
            {
                query,
                variables: { username }
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Origin: "https://leetcode.com",
                    Referer: "https://leetcode.com/",
                    "User-Agent": "Mozilla/5.0"
                },
                timeout: REQUEST_TIMEOUT_MS
            }
        );
    } catch (error) {
        // Network failure, timeout, or a non-2xx response.
        throw new Error(
            `LeetCode request failed: ${
                error.response?.status
                    ? `HTTP ${error.response.status}`
                    : error.message
            }`
        );
    }

    if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
    }

    const data = response.data.data;

    if (!data?.matchedUser) {
        throw new Error("LeetCode user not found");
    }

    const allProblems = data.matchedUser.submitStatsGlobal?.acSubmissionNum?.find(
        (item) => item.difficulty === "All"
    );

    /*
     * `null` means "the API did not report this", which the sync layer skips
     * so a partial response cannot overwrite a previously valid count with 0.
     * A real 0 from the API is still stored as 0.
     */
    const problemsSolved = Number.isFinite(Number(allProblems?.count))
        ? Number(allProblems.count)
        : null;

    const contest = data.userContestRanking;
    const history = data.userContestRankingHistory || [];

    /*
     * `userContestRankingHistory` includes contests the user registered for
     * but did not actually participate in, so only `attended` entries count.
     */
    const participated = history.filter((entry) => entry.attended);

    const contests = participated
        .map((entry) => {
            const startTime = Number(entry.contest?.startTime);

            if (!Number.isFinite(startTime) || startTime <= 0) {
                return null;
            }

            const title = String(entry.contest?.title || "").trim();

            if (!title) {
                return null;
            }

            return {
                contestKey: title,
                title,
                participatedAt: new Date(startTime * 1000),
                rating: Number.isFinite(Number(entry.rating))
                    ? Math.round(Number(entry.rating))
                    : null,
                rank: Number.isFinite(Number(entry.ranking))
                    ? Number(entry.ranking)
                    : null,
                problemsSolved: Number.isFinite(Number(entry.problemsSolved))
                    ? Number(entry.problemsSolved)
                    : null
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

    return {
        problemsSolved,
        /*
         * A user who has never entered a contest has no `userContestRanking`
         * at all. Storing null keeps them visually "unrated" rather than
         * showing a misleading 0 rating, while an actual rating is rounded.
         */
        contestRating: Number.isFinite(Number(contest?.rating))
            ? Math.round(Number(contest.rating))
            : null,
        contestsParticipated: Number.isFinite(Number(contest?.attendedContestsCount))
            ? Number(contest.attendedContestsCount)
            : null,
        lastParticipatedContestDate,
        contests
    };
};

module.exports = getLeetCodeData;
