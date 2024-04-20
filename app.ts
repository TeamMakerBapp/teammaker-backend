import { MyApplication } from "./lib/MyApplication";

const app = new MyApplication();

app.start();

app.config.content.plugins['passport-oauth'] = {
  // List of the providers you want to use with passport
  "strategies": {
    "google": {
      // Strategy name for passport (eg. google-oauth20 while the name of the provider is google)
      "passportStrategy": "google-oauth20",
      // Credentials provided by the provider  
      "credentials": {
        "clientID": "248704848225-abvib4t5sh7jpolqurk39vcioklfdgo2.apps.googleusercontent.com",
        "clientSecret": "",
      //  "callbackURL": "http://149.50.128.59:7512/_login/google",
        "callbackURL": "http://localhost:1593/_login/app",
        "profileFields": ["id", "name", "picture", "email", "gender"]
      },
      // Attributes you want to persist in the user credentials object if the user doesn't exist
      "persist": [
        "last_name",
        "first_name",
        "email"
      ],
      // List of fields in the OAUTH 2.0 scope of access
      "scope": [
        "email",
      ],
      //Mapping of attributes to persist in the user persisted in Kuzzle
      "kuzzleAttributesMapping": {
        // will store the attribute "email" from oauth provider as "userEmail" into the user credentials object
        "userMail": "email" 
      },
      // Attribute from the profile of the provider to use as unique identifier if you want to persist the user in Kuzzle
      "identifierAttribute": "email"
    }
  },
  // Profiles of the new persisted user
  "defaultProfiles": [
    "default"
  ]
}
