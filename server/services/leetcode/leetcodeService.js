const axios = require("axios");

const LEETCODE_URL = "https://leetcode.com/graphql";

const getLeetCodeData = async (username) => {
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
                contest {
                    startTime
                }
            }
        }
    `;

    try {
        const response = await axios.post(
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
                timeout: 20000
            }
        );

        if (response.data.errors) {
            throw new Error(response.data.errors[0].message);
        }

        const data = response.data.data;

        if (!data?.matchedUser) {
            throw new Error("LeetCode user not found");
        }

        // Problems solved
        const allProblems =
            data.matchedUser.submitStatsGlobal.acSubmissionNum.find(
                item => item.difficulty === "All"
            );

        const problemsSolved = allProblems?.count || 0;

        // Contest information
        const contest = data.userContestRanking;

        const history = data.userContestRankingHistory || [];

        const participatedContests = history.filter(
            contest => contest.attended
        );

        // Most recent participated contest
        const lastContest =
            participatedContests.length > 0
                ? participatedContests.reduce((latest, current) => {
                    return current.contest.startTime > latest.contest.startTime
                        ? current
                        : latest;
                })
        : null;

        const lastParticipatedContestDate = lastContest
    ? new Date(lastContest.contest.startTime * 1000)
    : null;

        return {
            problemsSolved,
            contestRating: contest?.rating ? Math.round(contest.rating) : 0,
            contestsParticipated: contest?.attendedContestsCount || 0,
            lastParticipatedContestDate
        };

    } catch (error) {
        console.error(
            "LeetCode Error:",
            error.response?.data || error.message
        );

        throw new Error("Unable to fetch LeetCode data");
    }
};

module.exports = getLeetCodeData;