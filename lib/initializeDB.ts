import { Controller, KuzzleRequest, Backend, BadRequestError, InternalError, ForbiddenError} from 'kuzzle';
import fs from "fs";

export async function initializeDatabases(app : Backend){
	// Create indices if they don´t exist
	if (! (await indexExists(app, "chat"))){
		await indexCreate(app, "chat");
		
	}
	if (! (await indexExists(app, "matches"))){
		await indexCreate(app, "matches");
		const mappings = JSON.parse(fs.readFileSync("./mappings/match_collection_mappings.json", "utf-8"));
	//	await collectionCreate(app, "matches", "matches_collection", mappings);
	}
}

async function collectionExists(app: Backend, index: String, collection: String){
	let response = await app.sdk.squery({
		"index": index,
		"collection": collection,
		"controller": "collection",
		"action": "exists"
	});

	return response["result"];
}

async function collectionCreate(app: Backend, index: String, collection: String, mappings){
	let response = await app.sdk.squery({
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

async function indexExists(app : Backend, index: String){
	let response = await app.sdk.query({
		"index": index,
		"controller": "index",
		"action": "exists"
        });
	console.log("Response:___________"+JSON.stringify(response));
	return response["result"];
}

async function indexCreate(app: Backend, index: String){
	let response = await app.sdk.query({
		"index": index,
		"controller": "index",
		"action": "create"
	});
	console.log("Response:___________"+JSON.stringify(response));
	return response["result"];
}
