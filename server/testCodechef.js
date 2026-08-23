const getCodeChefData =
    require("./services/codechef/codechefService");

const test = async () => {
    try {
        const data =
            await getCodeChefData("satyamkhandani");

    } catch (error) {
        console.error(error.message);
    }
};

test();