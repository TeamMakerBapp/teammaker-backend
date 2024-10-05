import { Controller, KuzzleRequest, BadRequestError, Backend } from 'kuzzle';
export class Chat extends Controller {
  constructor(app: Backend) {
    super(app);
    this.name = "chat";
    this.definition = {
      actions: {
        sendMessage: {
          handler: this.sendMessage,
          http: [
            { verb: 'post', path: '/chat/sendMessage' },
          ]
        },
        getMessages: {
          handler: this.getMessages,
        }
      }
    };
  }

  async getMessages(request: KuzzleRequest) {
    try {
      const userId = request.getUser()._id;
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

  async sendMessage(request: KuzzleRequest) {
    const author_id = request.getKuid();
    // target_room can be an user or a match
    let msg_target = []
    const { target_room, message } = request.getBody();
    if (await this.sdk.document.exists("social", "profiles", target_room)) {
      const target_connections = await this.sdk.document.get("social", "connections", target_room);
      if (target_connections._source.friends.includes(author_id)) {
        msg_target.push(author_id)
      }
    }
    if (await this.sdk.document.exists("matches", "matches_collection", target_room)) {
      // check if author is in the match
      const match = await this.sdk.document.get("matches", "matches_collection", target_room);
      if (match._source?.players != null) {
        const players = match._source.players
        if (players.includes(author_id)) {
          msg_target = players.filter((player) => player != author_id)
        }
      }
    }
    if (msg_target.length > 0) {
      msg_target.forEach(async (target) => {
        try {
          const response = await this.sdk.as({ "_id": author_id }).document.create(
            "chat",
            target,
            message
          );
          console.log("Message sent: ", response)
        }
        catch (error) {
          throw error;
        }
      })
      return "Message sent succesfully";
    } else {
      throw new BadRequestError("Undefined user")
    }
  }

}


//export function sendMsgNotification(app: Backend) {
//  app.pipe.register('chat:afterSendMessage', async (request: KuzzleRequest) => {
//    const { target_room } = request.getBody();
//    if (await app.sdk.document.exists("social", "profiles", target_room)) {
//      const profile = await app.sdk.document.get("social", "profiles", target_room);
//      const device_token = profile?._source?.device_token;
//      if (device_token == null || device_token == "") return;
//      //TODO: catch error if notification fails
//      await sendNotification(device_token);
//    } else {
//      // TODO: implement match notifications
//      if (await app.sdk.document.exists("matches", "matches_collection", target_room)) {
//        const { players }= await app.sdk.document.get("matches", "matches_collection", target_room);
//        
//        
//
//
//      }
//    });
//}
//
//async function sendNotification(device_token: String) {
//  const urlExpoPushNotif = "https://exp.host/--/api/v2/push/send";
//  try {
//    const response = await fetch(urlExpoPushNotif,
//      {
//        method: "POST",
//        headers: {
//          "Content-Type": "application/json",
//        },
//        body: JSON.stringify({
//          "to": device_token,
//          "title": "TEAMAKE",
//          "body": "You have a new message"
//        })
//      });
//    if (!response.ok) {
//      console.error("Failed to send notification to user")
//    }
//    const json = await response.json();
//    console.log(json);
//  } catch (error) {
//    console.error(error.message);
//  }
//}
