const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY
});

const sendEmail = async (to, subject, text) => {
    try {
        const result = await brevo.transactionalEmails.sendTransacEmail({
            sender: {
                name: "TrackUrCodeLife",
                email: process.env.EMAIL_USER
            },

            to: [
                {
                    email: to
                }
            ],

            subject: subject,

            textContent: text
        });

        return result;

    } catch (error) {
        console.error(
            "Brevo email error:",
            error.body || error.message
        );

        throw error;
    }
};

module.exports = sendEmail;