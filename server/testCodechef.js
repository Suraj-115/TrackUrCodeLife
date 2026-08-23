const getCodeChefData =
    require("./services/codechef/codechefService");

const test = async () => {
    try {
        const data =
            await getCodeChefData("satyamkhandani");

        console.log("CodeChef Data:");
        console.log(data);

    } catch (error) {
        console.error(error.message);
    }
};

test();