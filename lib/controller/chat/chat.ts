import { Controller, KuzzleRequest, BadRequestError, Backend, NameGenerator } from 'kuzzle';

export class Chat extends Controller {
  constructor (app: Backend) {
    super(app);
    this.name = "chat";
    // type ControllerDefinition
    this.definition = {
      actions: {
        bar: {
          handler: async request => {
            return `Hello ${request.getString('name')}!`
          },
          http:[
            { verb: 'get', path: '/chat/bar' },
          ]
        },
        sendMessage: {
          handler: async request => {
            try {
              const user = request.getUser();
              // check if users are friends
              // TODO: how to check type?
              const userId = request.getBodyString('userId');
              const group = request.getBodyString('group');
              const message = request.getBodyObject('message');
              console.log(user, userId, message);
              const response = await app.sdk.document.create(
                "chat",
                userId,
                message
              );
              
             // await Db.documentCreate("chat", userId, message, null);
              return response; 
           }
           catch (e) {
             console.log('somethign wtohrds');
             throw new BadRequestError("Invalid request")
           }
          },
          http:[
            { verb: 'post', path: '/chat/sendMessage' },
          ]
        },
      }
    };
  }
  async isBlocked(){
  }
  async isFriend(){
  }
}

