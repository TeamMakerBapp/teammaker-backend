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
            if( userId == null ) throw new BadRequestError("Undefined user")
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

