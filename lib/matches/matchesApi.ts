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
				},
				updateTeams: {
					handler: this.updateTeams,
					http: [{ verb: 'post', path: 'matches-api/update-teams'}]
				},
				removePlayer: {
					handler: this.removePlayer,
					http: [{ verb: 'post', path: 'matches-api/remove-player'}]
				}
			}
		}
		
	}

	/*
	{
	  "controller": "matches-api",
	  "action": "updateTeams",
	  "body": {
	    "match_id": "S1rDrJAB1gR4eFQO8BNY",
	    "team_a": ["testplayer", "pablo"],
	    "team_b": ["testplayer2"]
	  }
	}
	*/
	async updateTeams( request: KuzzleRequest) {
		const body = request.input.body;
		const user = request.getUser()._id;
		const match = await this.app.sdk.document.get("matches", "matches_collection", body.match_id);
		if (user === match._source.owner)
		{
			// Verify that the players are in the match
			for (let i = body.team_a.length - 1; i >=0; i--)
			{
				if (match._source.players.indexOf(body.team_a[i]) === -1)
					body.team_a.splice(i,1);
			}
			for (let i = body.team_b.length - 1; i >=0; i--)
			{
				if (match._source.players.indexOf(body.team_b[i]) === -1)
					body.team_b.splice(i,1);
			}
			return this.app.sdk.document.update("matches", "matches_collection", body.match_id, {		
	"team_a_players" : body.team_a, "team_b_players": body.team_b});

		}
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
	  "action": "removePlayer",
	  "body": {
	    "match_id": "S1rDrJAB1gR4eFQO8BNY",
	    "player": "testplayer"
	  }
	}
	*/
	async removePlayer(request: KuzzleRequest){
		const body = request.input.body;
		const user = request.getUser()._id;
		const player = body.player;
		const match = await this.app.sdk.document.get("matches", "matches_collection", body.match_id);

		if (player === user || user === match._source.owner)
		{
			let players =  match._source.players;
			let team_a_players = match._source.team_a_players;
			let team_b_players = match._source.team_b_players;
			let i = players.indexOf(player);
			if (i >= 0){
				players.splice(i,1);
			}
			i = team_a_players.indexOf(player);
			if (i >= 0)
				team_a_players.splice(i,1);
			i = team_b_players.indexOf(player);
			if (i >= 0)
				team_b_players.splice(i,1);

			return this.app.sdk.document.update("matches", "matches_collection", body.match_id, {"players": players, "team_a_players": team_a_players, "team_b_players": team_b_players});

		} else {
			throw new BadRequestError("Can´t remove other player if you are not the owner.");
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

