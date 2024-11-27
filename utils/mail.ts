import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SG_API_KEY;

if (!apiKey) {
    throw new Error('Api key for SendGrid not set!');
}

const sendMail = async (to: string, subject: string, html: string) => {
    sgMail.setApiKey(apiKey)
    try {
        const message = {
            to,
            from: process.env.SENDER_EMAIL!,
            subject,
            html,
        };

        await sgMail.send(message);
        return true;
    } catch (error: any) {
        if (error.response) {
            console.error('SendGrid Error:', error.response.body.errors);
        } else {
            console.error('Unexpected Error:', error);
        }
        return false;
    }
};

export { sendMail };