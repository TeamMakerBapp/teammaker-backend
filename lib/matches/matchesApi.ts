import { MyApplication } from "../MyApplication";
import { Controller, KuzzleRequest, Backend, BadRequestError, InternalError, ForbiddenError} from 'kuzzle';

export class MatchesApi extends Controller {
	constructor (app : Backend) {
		super(app);
		this.name = "matches-api";

		this.definition = {
			actions: {
				getMatches: {
					handler: this.getMatches,
					http: [
						{ verb: 'get', path: 'matches-api/matches' }
					]
				},
				createMatch: {
					handler: this.createMatch,
					http: [
						{ verb: 'post', path: 'matches-api/create-match'}
					]
				}
			}
		};
	}
	
	async createMatch(request: KuzzleRequest){
		const {match_data} = request.input.body;
		console.log(request.input);
		const response = this.app.sdk.query({
			  "index": "matches",
			  "collection": "matches_collection",
			  "controller": "document",
			  "action": "create",
			  "body": match_data 
		});
		return response;
	}

	async getMatches(request: KuzzleRequest){
		const {match_id} = request.input.args;

		if (match_id){
			const response = this.app.sdk.query({
			  "index": "matches",
			  "collection": "matches_collection",
			  "controller": "document",
			  "action": "get",
			  "_id": match_id 
			});
			return response;
		} else {
			const response = this.app.sdk.query({
				"index": "matches",
				"collection": "matches_collection",
				"controller": "document",
				"action": "search",
				"size": 100,
				"body":{
					"sort": [{ "date" : {"order" : "asc"}}]
				}
			});

			return response;
		}
	}
}

