import { MyApplication } from "../MyApplication";
import { Controller, KuzzleRequest, Backend, BadRequestError, InternalError, ForbiddenError} from 'kuzzle';
const JWT = require('jsonwebtoken');

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
				},
				addPlayer: {
					handler: this.addPlayer,
					http: [{ verb: 'post', path: 'matches-api/add-player'}]
				}
			}
		};
	}

	
	/*
	 {
	  "controller": "matches-api",
	  "action": "addPlayer",
	  "body": {
	    "match_id": "S1rDrJAB1gR4eFQO8BNY",
	    "new_player": "testplayer2"
	  }
	}
	*/
	async addPlayer(request: KuzzleRequest){
		const {body} = request.input;
		const user = request.getUser()._id;
		const new_player = body.new_player;
		const match = await this.app.sdk.document.get("matches", "matches_collection", body.match_id);
		console.log(match);
		if (match._source.public == "true" || user === match._source.owner)
		{
			let players =  match._source.players;
			if (players.indexOf(new_player) === -1){
				players.push(new_player);
			}
			return this.app.sdk.document.update("matches", "matches_collection", body.match_id, {"players": players});

		} else {
			throw new BadRequestError("Only the owner of the match can add players");
		}
	}
	

	/*
	 {
	  "controller": "matches-api",
	  "action": "createMatch",
	  "body": {
	    "match_data": {
	      "public": "false",
	      "date": 1714944934,
	      "team_size": 11,
	      "price": 0,
	      "club": {
		"Address": "san Test 012",
		"location": {
		  "lon": -38,
		  "lat": -46
		}
	      }
	    }
	  }
	}
	*/
	async createMatch(request: KuzzleRequest){
		const {match_data} = request.input.body;
		//TODO: validate that user can create matches
		const {jwt} = request.input;
		if (!match_data["public"])
			match_data["public"] = "true";
		match_data["owner"] = request.getUser()._id;
		match_data["players"] = [];
		match_data["team_a_players"] = [];
		match_data["team_b_players"] = [];
		const response = this.app.sdk.query({
			  "index": "matches",
			  "collection": "matches_collection",
			  "controller": "document",
			  "action": "create",
			  "body": match_data
		});
		return response;
	}

	/*
	 USE THIS FOR GETTING ALL MATCHES
	 {
	  "controller": "matches-api",
	  "action": "getMatches"
	}
	USE THIS FOR GETTING SPECIFIC MATCH
	{
	  "controller": "matches-api",
	  "action": "getMatches",
	  "match_id": "S1rDrJAB1gR4eFQO8BNY"
	}
	*/
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

