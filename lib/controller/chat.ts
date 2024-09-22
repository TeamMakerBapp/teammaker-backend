import { Controller, KuzzleRequest, BadRequestError, Backend } from 'kuzzle';
import { IMessage } from '../types/chat'

export class Chat extends Controller {
  constructor(app: Backend) {
    super(app);
    this.name = "chat";
    this.definition = {
      actions: {
        sendMessage: {
          handler: async (request: KuzzleRequest) => {
            const userId = request.getKuid();
            // TODO: check if users are friends
            const message = request.getBody();
            try {
              const response = await app.sdk.document.create(
                "chat",
                userId,
                message
              );
              return response;
            }
            catch (error) {
              throw error;
            }
          },
          http: [
            { verb: 'post', path: '/chat/sendMessage' },
          ]
        },
        getMessages: {
          handler: async (request) => {
            try {
              const userId = request.getUser()?._id;
              if (userId == null) throw new BadRequestError("Undefined user")
              const { roomId, channel } = await this.app.subscription.add(
                request.context.connection,
                "chat",
                userId,
                {
                },
                {
                  users: "all",
                  scope: "all",
                }
              );
              return { roomId, channel };
            } catch (e) {
              throw new BadRequestError("Invalid request")
            }
          }
        }
      }
    };
  }
}


export function addPipeAfterSendMessage(app: Backend) {
  app.pipe.register('chat:afterSendMessage', async (request: KuzzleRequest) => {
    const urlExpoPushNotif = "https://exp.host/--/api/v2/push/send";
    const token = "ExponentPushToken[Ba2yWxM4Oj2vzdoEi0p8Zj]"
    try {
      const response = await fetch(urlExpoPushNotif,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
           "to": token,
           "title":"New message",
           "body": "Global?"
          })
        });
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const json = await response.json();
      console.log(json);
    } catch (error) {
      console.error(error.message);
    }
  });
}
