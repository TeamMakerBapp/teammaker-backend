import { MyApplication } from "../MyApplication";
import { Controller, KuzzleRequest, Backend, BadRequestError, InternalError, ForbiddenError} from 'kuzzle';
import fs from 'fs';

const jwt = require('jsonwebtoken');

const token = (username : String) => {
    let t = jwt.sign({username: username, expiration: Date.now() + 3600*1000}, "shhhhh");
    return t;
};

export class CustomUser extends Controller {
  constructor (app: Backend) {
    super(app);
    this.name = "custom-user";
    // type ControllerDefinition
    this.definition = {
      actions: {
        validateUser: {
          handler: this.validateUser,
          http:[
            { verb: 'get', path: 'custom-user/validate' },
          ]
        },
        sendValidationMail: {
          handler: this.sendValidationMail,
          http:[
            { verb: 'get', path: 'custom-user/send-validation-mail' },
          ]
        },
        authCode: {
          handler: this.authCode,
          http:[
            { verb: 'get', path: 'custom-user/auth-code' }
          ]
        }
      }
    };
  }
 
  async authCode(request: KuzzleRequest){
     const {code} =  request.input.args;
     request.response.configure({
      headers: {
        'Content-Type': 'text/html'
      },
      format: 'raw',
      status: 200
    });
    let myApp = this.app as MyApplication;
    let url = myApp.configuration.deeplink+"/--/login?code="+code;
    let html = fs.readFileSync('html/validated-user.html', 'utf-8');
    html = html.replace("{{link}}", url);
    return html;
 
  }

  async sendValidationMail(request: KuzzleRequest){
    const {email} = request.input.args;
    if (!email){
      throw new BadRequestError("Invalid user email.");
    }
    const response = await this.app.sdk.query( {
       "controller": "security",
       "action": "searchUsersByCredentials",
       "strategy": "local",
       "body": {
         "query": {
           "bool": {
             "must": [
               {
                 "term": {
                   "username": email
                 }
               }
             ]
           }
        }
      }
    });

    const result = response.result;
    if (result && result.total > 0)
    {
      var id = result.hits[0].kuid;


      const user = await this.app.sdk.security.getUser(id);
      if (user._source.profileIds.includes("profile-non-validated-users")){
        let t = token(id);
        this.app.sdk.security.updateUser(id, {
            "ValidationToken": t 
        });
        let myApp = this.app as MyApplication;
        let url = `${myApp.configuration.hostAddress}/_/custom-user/validate?code=${t}`;
        const user = await this.app.sdk.security.getUser(id);
        let html = fs.readFileSync('html/validation-mail.html', 'utf-8');
        html = html.replace("{{link}}", url);
        html = html.replace("{{date}}", (new Date()).toString());
        if (global.env.smtpConfig.enable) {
          this.app.sdk.query( {
            "controller": "hermes/smtp",
            "action": "sendEmail",
            "account": "contact",
            "body": {
              "to": [
                email
              ],
              "subject": "Validate your TeamMake user!",
              "html": html
            }
          });
        } else {
          console.log("\x1b[37;46;1mSMTP not configured. To validate the user visit: "+url+"\x1b[0m");
        }
      }

    } else {
      throw new BadRequestError("Not registered user mail.")
    }

  }


  async validateUser(request: KuzzleRequest){
    try {
        const {code} = request.input.args;
        if(!code){
          throw new BadRequestError("Invalid request.");
        }
        // Get user data from user_kuid
        const decoded = jwt.verify(code, "shhhhh");
        if (Date.now() > decoded.expiration){
          throw new BadRequestError("Validation code expired.");
        }
        const username = decoded.username;
        const user_data = await this.app.sdk.security.getUser(username);
        if (user_data._source.ValidationToken === code){
          // If token is correct and the user has not yet been validated, then update profileIds of the corresponding user
          if(user_data._source.profileIds.includes("profile-non-validated-users")){
            let body = {
              profileIds: ['profile-validated-users']
            }
            this.app.sdk.security.updateUser(username, body)
          } 
          if ( !this.app.sdk.query({
            "index": "chat",
            "collection": user_data._id,
            "controller": "collection",
            "action": "exists"})["result"]) {
              const chat_mapping = JSON.parse(fs.readFileSync("./mappings/chat_collection_mapping.json", "utf-8"));
              await this.app.sdk.query({
                  "index": "chat",
                  "collection": user_data._id,
                  "controller": "collection",
                  "action": "create",
                  "body": {
                    "mappings": chat_mapping
                  }
              });
              await this.app.sdk.as(user_data).document.create(
                  "social",
                  "connections",
                  {
                    friends: [],
                    requested: [],
                    requests: [],
                    blocked: []
                  },
                  user_data._id
              );
              await this.app.sdk.as(user_data).document.create(
                  "social",
                  "profiles",
                  {
                  },
                  user_data._id
              );
            }
        } else {
          throw new BadRequestError("Invalid token")
        }
    } catch (e) {
      throw new BadRequestError("Invalid request")
    }
    request.response.configure({
      headers: {
        'Content-Type': 'text/html'
      },
      format: 'raw',
      status: 200
    });
    let myApp = this.app as MyApplication;
    let url = myApp.configuration.deeplink+"/--/login?mailVerified=true";
    let html = fs.readFileSync('html/validated-user.html', 'utf-8');
    html = html.replace("{{link}}", url);
    return html;
  }

}
