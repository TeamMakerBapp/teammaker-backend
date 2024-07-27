import { Controller, KuzzleRequest, Backend, BadRequestError, InternalError, ForbiddenError, NameGenerator } from 'kuzzle';

export class Db {
  public static async function collectionCreate(app: Backend, index: String, collection?: String, mappings){
    if (typeof collection === undefined) {
      const collection = NameGenerator.getRandomName();
    }
    let response = await app.sdk.query({
      "index": index,
      "collection": collection,
      "controller": "collection",
      "action": "create",
      "body": {
        "mappings": mappings
      }
    });
    return response["result"];
  }

  public static async function indexExists(app : Backend, index: String){
    let response = await app.sdk.query({
      "index": index,
      "controller": "index",
      "action": "exists"
          });
    return response["result"];
  }

  public static async function indexCreate(app: Backend, index: String){
    let response = await app.sdk.query({
      "index": index,
      "controller": "index",
      "action": "create"
    });
    return response["result"];
  }

}
