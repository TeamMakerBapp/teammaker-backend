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
            // target_room can be an user or a match
            const { target_room, message } = request.getBody();
            // TODO: check if room exists
            try {
              const response = await app.sdk.document.create(
                "chat",
                target_room,
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


export function sendMsgNotification(app: Backend) {
  app.pipe.register('chat:afterSendMessage', async (request: KuzzleRequest) => {
    const urlExpoPushNotif = "https://exp.host/--/api/v2/push/send";
    const { target_room } = request.getBody();
    if (await app.sdk.document.exists("social", "profiles", target_room)) {
      const profile = await app.sdk.document.get("social", "profiles", target_room);
      const device_token = profile?._source?.device_token;
      if (device_token == null || device_token == "") return;
      try {
        const response = await fetch(urlExpoPushNotif,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
             "to": device_token,
             "title":"TEAMAKE",
             "body": "You have a new message"
            })
          });
        if (!response.ok) {
          console.error("Failed to send notification to user: ", target_room)
        }
        const json = await response.json();
        console.log(json);
      } catch (error) {
        console.error(error.message);
      }
      //TODO: catch error if notification fails

    } else {
      console.log(target_room, "doesn't exists");
      // TODO: implement match notifications
      //
    }
  });
}
