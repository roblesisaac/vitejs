import { params } from "@serverless/cloud";
import fs from "fs";

import notify from "../utils/notify";
import { encrypt, generateToken } from "../utils/helpers";
import { proper } from "../../src/utils";

const { 
    APP_NAME,
    CLOUD_URL,
} = params;

const appName = proper(APP_NAME);
const png = fs.readFileSync("./logo.png", "binary");
const base64 = Buffer.from(png, "binary").toString("base64");
const logoImage = `data:image/png;base64,${base64}`;

const welcomeTemplate = `
<html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${appName}</title>
    </head>
    <body style="background-color: #F8F8F8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; line-height: 1.5;">
      <div style="max-width: 600px; margin: 20px auto;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
          <tr>
            <td style="padding: 20px; background-color: #FFFFFF; text-align: center;">
            <img src="${logoImage}" alt="${appName}_LOGO" style="display: block; max-width: 50%; height: auto; margin: 0 auto 20px auto;" />
              <h1 style="font-size: 24px; margin-bottom: 10px;">Welcome to ${appName}!</h1>
              <p style="font-size: 16px; margin-bottom: 20px;">Thank you for joining our community. We are thrilled to have you with us.</p>

              <p v-if="specificMessage" v-html="specificMessage"></p>

              <p>Please click the button below to verify your account.</p>
              <a style="display: inline-block; padding: 10px 20px; background-color: #0078FF; color: #FFFFFF; text-decoration: none; border-radius: 5px; font-size: 16px;" :href="verifyLink">Verify My Account »</a>
            </td>
          </tr>
        </table>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
          <tr>
            <td style="padding: 20px; background-color: #FFFFFF; text-align: center;">
              <p style="font-size: 12px; margin-bottom: 10px;">To unsubscribe, please click <a href="${CLOUD_URL}/unsubscribe" style="color: #0078FF;">here</a>.</p>
              <p style="font-size: 12px; margin-bottom: 10px;">For more information, visit our website <a href="${CLOUD_URL}" style="color: #0078FF;">here</a>.</p>
              <p style="font-size: 12px;">${appName} © ${new Date().getFullYear()}</p>
            </td>
          </tr>
        </table>
      </div>
    </body>
</html>`;

export default async function(data, events) {
    events.on("user.joined", async ({ body }) => {
        const { email, status } = body;
        const token = generateToken({ email, status });
        const encrypted = encrypt(token);
    
        await notify.email(email, {
            subject: "Thanks for signing up!",
            data: {
                specificMessage: false,
                verifyLink: `${CLOUD_URL}/signup/verify/${encrypted}`
            },
            template: welcomeTemplate
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
                data: {
                    specificMessage: "<b>Your Account is about to be removed.</b>",
                    verifyLink: `${CLOUD_URL}/signup/verify/${encrypted}`
                },
                template: welcomeTemplate
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
            subject: `Your ${appName} Account Has Been Removed`,
            template: `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Farewell from ${appName}</title>
            </head>
            <body>
                <p>Thank you for signing up to ${appName}!</p>
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