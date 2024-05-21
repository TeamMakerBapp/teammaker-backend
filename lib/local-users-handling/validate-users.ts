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
     console.log(request.input.args);
     const {code} =  request.input.args;
     request.response.configure({
      headers: {
        'Content-Type': 'text/html'
      },
      format: 'raw',
      status: 200
    });
    let myApp = this.app as MyApplication;
    let url = "exp://"+myApp.configuration.hostAddress+":8081/--/Test?code="+code;
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
        let url = "http://"+myApp.configuration.hostAddress+":7512/_/custom-user/validate?code="+t;
        const user = await this.app.sdk.security.getUser(id);
        let html = fs.readFileSync('html/validation-mail.html', 'utf-8');
        html = html.replace("{{link}}", url);
	html = html.replace("{{date}}", (new Date()).toString());
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
            this.app.sdk.security.updateUser(username, body);
          } 
        } else{
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
    let url = "exp://"+myApp.configuration.hostAddress+":8081/--/Test";
    let html = fs.readFileSync('html/validated-user.html', 'utf-8');
    html = html.replace("{{link}}", url);
    return html;
  }

}
