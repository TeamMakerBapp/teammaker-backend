import {KuzzleRequest, Backend, BadRequestError} from 'kuzzle';
// import { checkPassword, checkStringContent, generateRandomString } from './module';
import { request } from 'http';
/*
const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[]\.,;:\s@"]+(.[^<>()[]\.,;:\s@"]+)*)|.(".+"))@(([[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}])|(([a-zA-Z-0-9]+.)+[a-zA-Z]{2,}))$/
    );
};
*/

const jwt = require('jsonwebtoken');

const rand = () => {
    return Math.random().toString(36).substr(2);
};
  
export function addPipeBeforeCreateRestrictedUser(app: Backend) {
    app.pipe.register('security:beforeCreateRestrictedUser', async (request: KuzzleRequest) => {
        return request
    });
}

export function addPipeAfterCreateRestrictedUser(app: Backend) {
    app.pipe.register('security:afterCreateRestrictedUser', async (request: KuzzleRequest) => {
        let user = request.input.body.credentials.local.username;
        app.sdk.query({
          "controller": "custom-user",
          "action": "sendValidationMail",
          "email": user 
        });
        return request;
    });
}
