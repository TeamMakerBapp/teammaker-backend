/* eslint-disable sort-keys */
import { MyApplication, MyApplicationConfig} from "./lib/MyApplication";
import { CustomUser } from "./lib/local-users-handling/validate-users";
import { addPipeBeforeCreateRestrictedUser } from "./lib/local-users-handling/pipeCreateRestrictedUser";
import { addPipeAfterCreateRestrictedUser } from "./lib/local-users-handling/pipeCreateRestrictedUser";

import fs from "fs";

const env = JSON.parse(fs.readFileSync("./.env.json", "utf-8"));
var hostAddress = "localhost";
if (env.config && env.config.hostAddress){
	hostAddress = env.config.hostAddress;	
}
const config: MyApplicationConfig = {
    hostAddress: hostAddress 
};
const app = new MyApplication(config);
addPipeBeforeCreateRestrictedUser(app);
//addPipeBeforeCreateUser(app);
addPipeAfterCreateRestrictedUser(app);

const customUser = new CustomUser(app);
app.controller.use(customUser);

if (env.oauth) {
  app.config.content.plugins["passport-oauth"] = {
    // List of the providers you want to use with passport
    strategies: {
      google: {
        // Strategy name for passport (eg. google-oauth20 while the name of the provider is google)
        passportStrategy: "google-oauth20",
        // Credentials provided by the provider
        credentials: {
          clientID:
            "248704848225-abvib4t5sh7jpolqurk39vcioklfdgo2.apps.googleusercontent.com",
          clientSecret: env.oauth.clientsecret,
          //  "callbackURL": "http://149.50.128.59:7512/_login/google",
          callbackURL: "http://localhost:7512/_/custom-user/auth-code",
          profileFields: ["id", "name", "picture", "email", "gender"],
        },
        // Attributes you want to persist in the user credentials object if the user doesn't exist
        persist: ["last_name", "first_name", "email"],
        // List of fields in the OAUTH 2.0 scope of access
        scope: ["email"],
        //Mapping of attributes to persist in the user persisted in Kuzzle
        kuzzleAttributesMapping: {
          // will store the attribute "email" from oauth provider as "userEmail" into the user credentials object
          userMail: "email",
        },
        // Attribute from the profile of the provider to use as unique identifier if you want to persist the user in Kuzzle
        identifierAttribute: "email",
      },
    },
    // Profiles of the new persisted user
    defaultProfiles: ["default"],
  };
} else {
  console.log("\x1b[37;46;1mOauth not configured\x1b[0m");
}

app.config.content.security.restrictedProfileIds = ["profile-non-validated-users"];

// Import roles and profiles from validated and non validated users (this should be implemented in an external .ts file)
const roleNonValidatedUsers = require("./lib/security-handling/non-validated-users-role.template.json");
const roleValidatedUsers = require("./lib/security-handling/validated-users-role.template.json");
const profileNonValidatedUsers = require("./lib/security-handling/non-validated-users-profile.template.json");
const profileValidatedUsers = require("./lib/security-handling/validated-users-profile.template.json");

app.start().then(async function (){
    await app.sdk.security.createOrReplaceRole("role-non-validated-users", roleNonValidatedUsers);
    await app.sdk.security.createOrReplaceRole("role-validated-users", roleValidatedUsers);
    await app.sdk.security.createOrReplaceProfile("profile-non-validated-users", profileNonValidatedUsers);
    await app.sdk.security.createOrReplaceProfile("profile-validated-users", profileValidatedUsers);
    if(env.smtpConfig){ 
      if (env.smtpConfig.enable){
        app.configureSmtp(env.smtpConfig);
      }
    } else {
      console.log("\x1b[37;46;1mSMTP not configured\x1b[0m");
    }
});
