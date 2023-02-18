import { params } from "@serverless/cloud";

import notify from "../utils/notify";
import { encrypt, generateToken } from "../utils/helpers";
import { proper } from "../../src/utils";

const { 
    APP_NAME,
    CLOUD_URL,
  } = params;


export default async function(data, events) {
    events.on("user.joined", async ({ body }) => {
        const { email, status } = body;
        const token = generateToken({ email, status });
        const encrypted = encrypt(token);
    
        await notify.email(email, {
            subject: "Thanks for signing up!",
            template: `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Welcome to ${proper(APP_NAME)}</title>
            </head>
            <body>
                <p>Thank you for signing up to ${proper(APP_NAME)}!</p>
                <p>Please click the button below to verify your account:</p>
                <p><a href="${CLOUD_URL}/signup/verify/${encrypted}" style="display:inline-block;background-color:#007bff;color:#fff;font-weight:bold;font-size:16px;padding:12px 24px;border-radius:4px;text-decoration:none;">Verify Account »</a></p>
            </body>
            </html>
            `
        });
    });

    events.on("user.checkForVerificationWarning", async ({ body }) => {
        const { email, status } = body;
        const token = generateToken({ email, status });
        const encrypted = encrypt(token);
 
        const user = await data.get(`users:${email}`);

        if(!user) {
            console.log(`${user} not found while running checkForVerificationWarning.`);
            return;
        }
 
        if(user.status != "verified") {
            await notify.email(email, {
                subject: "Verification Still Needed",
                template: `<!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Welcome to ${proper(APP_NAME)}</title>
                </head>
                <body>
                    <p>Thank you for signing up to ${proper(APP_NAME)}!</p>
                    <p>Your Account is about to be removed.</p>
                    <p>Please click the button below to verify your account:</p>
                    <p><a href="${CLOUD_URL}/signup/verify/${encrypted}" style="display:inline-block;background-color:#007bff;color:#fff;font-weight:bold;font-size:16px;padding:12px 24px;border-radius:4px;text-decoration:none;">Verify Account »</a></p>
                </body>
                </html>
                `
            });
        }
     });

    events.on("user.checkForVerification", async ({ body }) => {
       const { email } = body;

       const user = await data.get(`users:${email}`);

       if(!user) {
           console.log(`${user} not found while running checkForVerification.`);
           return;
       }

       if(user.status != "verified") {
        await data.remove(`users:${email}`);
        await notify.email(email, {
            subject: `Your ${proper(APP_NAME)} Account Has Been Removed`,
            template: `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Farewell from ${proper(APP_NAME)}</title>
            </head>
            <body>
                <p>Thank you for signing up to ${proper(APP_NAME)}!</p>
                <p>Your Account has been removed.</p>
                <p>If this was a mistake, please click the button below to signup again:</p>
                <p><a href="${CLOUD_URL}/login" style="display:inline-block;background-color:#007bff;color:#fff;font-weight:bold;font-size:16px;padding:12px 24px;border-radius:4px;text-decoration:none;">Signup »</a></p>
            </body>
            </html>
            `
        });
        console.log(`${ email } was never verified`);
       }
    });
}