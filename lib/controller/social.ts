import { Controller, KuzzleRequest , Backend, NameGenerator, BadRequestError } from 'kuzzle';
import { Db } from "lib/utils/db";

export class Social extends Controller {
  constructor (app: Backend) {
    super(app);
    this.name = "social";
    // type ControllerDefinition
    this.definition = {
      actions: {
        bar: {
          handler: async request => {
            return `Hello ${request.getString('name')}!`
          },
          http:[
            { verb: 'get', path: '/social/bar' },
          ] },
        addFriend: {
          handler: async request => {
            try {
              const author_id = request.getKuid();
              const target_id = request.getBodyString('id');
              if(author_id == target_id){
                return "Error: Target id is your user id";
              }
              const target_connections = await app.sdk.document.get("social", "connections", target_id);
              const author_connections = await app.sdk.document.get("social", "connections", author_id);
              if(target_connections._source.blocked.includes(author_id)){
                return "Error: The target user has blocked you.";
              }
              if(target_connections._source.friends.includes(author_id)){
                return "You are already friends with this user.";
              }
              if(target_connections._source.requests.includes(author_id)){
                return "You already have sent an a request to this user.";
              }
              if(target_connections._source.requested.includes(author_id)){
                return "You already have a request from this user.";
              }
              target_connections._source.requests.push(author_id);
              author_connections._source.requested.push(target_id);
              app.sdk.as({_id: author_id}).document.update("social", "connections", author_id, author_connections._source);
              app.sdk.as({_id: target_id}).document.update("social", "connections", target_id, target_connections._source);
            } catch(error) {
              console.log(error);
              throw new BadRequestError("Invalid request")
            }
          },
          http:[
            { verb: 'post', path: '/social/addFriend' },
          ]
        },
        deleteFriend: {
          handler: async request => {
            try {
              const author_id = request.getKuid();
              const target_id = request.getBodyString('id');
              if(author_id == target_id){
                return "Error: Target id is your user id";
              }
              const target_connections = await app.sdk.document.get("social", "connections", target_id);
              const author_connections = await app.sdk.document.get("social", "connections", author_id);
              if(!target_connections._source.friends.includes(author_id)){
                return "Error: Target is not your friend";
              }
              let i = target_connections._source.friends.indexOf(author_id);
              target_connections._source.friends.splice(i, 1);
              i = author_connections._source.friends.indexOf(target_id);
              author_connections._source.friends.splice(i, 1);
              app.sdk.as({_id: author_id}).document.update("social", "connections", author_id, author_connections._source);
              app.sdk.as({_id: target_id}).document.update("social", "connections", target_id, target_connections._source);
            } catch(error) {
              console.log(error);
              throw new BadRequestError("Invalid request")
            }
          },
          http:[
            { verb: 'post', path: '/social/deleteFriend' },
          ]
        },
        acceptFriend: {
          handler: async request => {
            try {
              const author_id = request.getKuid();
              const target_id = request.getBodyString('id');
              if(author_id == target_id){
                return "Error: Target id is your user id";
              }
              const target_connections = await app.sdk.document.get("social", "connections", target_id);
              const author_connections = await app.sdk.document.get("social", "connections", author_id);
              if(!target_connections._source.requested.includes(author_id)){
                return "Error: Forbidden. You cannot accept a non-existent request.";
              }
              let i = target_connections._source.requested.indexOf(author_id);
              target_connections._source.requested.splice(i, 1);
              target_connections._source.friends.push(author_id);
              i = author_connections._source.requests.indexOf(target_id);
              author_connections._source.requests.splice(i, 1);
              author_connections._source.friends.push(target_id);
              app.sdk.as({_id: author_id}).document.update("social", "connections", author_id, author_connections._source);
              app.sdk.as({_id: target_id}).document.update("social", "connections", target_id, target_connections._source);
            } catch(error) {
              console.log(error);
              throw new BadRequestError("Invalid request")
            }
          },
          http:[
            { verb: 'post', path: '/social/acceptFriend' },
          ]
        },
        declineFriend: {
          handler: async request => {
            try {
              const author_id = request.getKuid();
              const target_id = request.getBodyString('id');
              if(author_id == target_id){
                return "Error: Target id is your user id";
              }
              const target_connections = await app.sdk.document.get("social", "connections", target_id);
              const author_connections = await app.sdk.document.get("social", "connections", author_id);
              if(!target_connections._source.requested.includes(author_id)){
                return "Error: Forbidden. You cannot decline a non-existent request.";
              }
              let i = target_connections._source.requested.indexOf(author_id);
              target_connections._source.requested.splice(i, 1);
              i = author_connections._source.requests.indexOf(target_id);
              author_connections._source.requests.splice(i, 1);
              app.sdk.as({_id: author_id}).document.update("social", "connections", author_id, author_connections._source);
              app.sdk.as({_id: target_id}).document.update("social", "connections", target_id, target_connections._source);
            } catch(error) {
              throw new BadRequestError("Invalid request")
            }
          },
          http:[
            { verb: 'post', path: '/social/declineFriend' },
          ]
        },
        blockUser: {
          handler: async request => {
            try {
              const author_id = request.getKuid();
              const target_id = request.getBodyString('id');
              if(author_id == target_id){
                return "Error: Target id is your user id";
              }
              const target_connections = await app.sdk.document.get("social", "connections", target_id);
              const author_connections = await app.sdk.document.get("social", "connections", author_id);
              if(author_connections._source.blocked.includes(target_id)){
                return "You have already blocked this user"
              }
              let i = target_connections._source.requested.indexOf(author_id);
              target_connections._source.requested.splice(i, 1);
              i = target_connections._source.requests.indexOf(author_id);
              target_connections._source.requests.splice(i, 1);
              i = target_connections._source.friends.indexOf(author_id);
              target_connections._source.friends.splice(i, 1);
              i = author_connections._source.requests.indexOf(target_id);
              author_connections._source.requests.splice(i, 1);
              i = author_connections._source.requested.indexOf(target_id);
              author_connections._source.requested.splice(i, 1);
              i = author_connections._source.friends.indexOf(target_id);
              author_connections._source.friends.splice(i, 1);

              author_connections._source.blocked.push(target_id);
              app.sdk.as({_id: author_id}).document.update("social", "connections", author_id, author_connections._source);
              app.sdk.as({_id: target_id}).document.update("social", "connections", target_id, target_connections._source);
            } catch(error) {
              throw new BadRequestError("Invalid request")
            }
          },
          http:[
            { verb: 'post', path: '/social/blockUser' },
          ]
        },
        unblockUser: {
          handler: async request => {
            try {
              const author_id = request.getKuid();
              const target_id = request.getBodyString('id');
              if(author_id == target_id) {
                return "Error: Target id is your user id";
              }
              const author_connections = await app.sdk.document.get("social", "connections", author_id);
              if(!author_connections._source.blocked.includes(target_id)){
                return "User is not bocked.";
              }
              const i = author_connections._source.blocked.indexOf(target_id);
              author_connections._source.blocked.splice(i, 1);
              app.sdk.as({_id: author_id}).document.update("social", "connections", author_id, author_connections._source);
            } catch(error) {
              throw new BadRequestError("Invalid request")
            }
          },
          http:[
            { verb: 'post', path: '/social/unblockUser' },
          ]
        },
      }
    };
  }
  async isBlocked(){
  }
  async isFriend(){
  }
  async isRequested(){
  }
}

