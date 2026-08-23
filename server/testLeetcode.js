const getLeetCodeData = require("./services/leetcode/leetcodeService");

const test = async () => {
    try {
        const data = await getLeetCodeData("SatyamKhandani");
    } catch (error) {
        console.error(error.message);
    }
};

test();