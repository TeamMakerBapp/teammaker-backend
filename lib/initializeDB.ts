import { Backend } from 'kuzzle';
import fs from "fs";

export async function initializeDatabases(app : Backend){
	// Create indices if they don´t exist
	if (! (await indexExists(app, "chat"))){
		await indexCreate(app, "chat");
		
	}
	if (! (await indexExists(app, "matches"))){
		await indexCreate(app, "matches");
	}
	if (! (await collectionExists(app, "matches", "matches_collection"))){
		const mappings = JSON.parse(fs.readFileSync("./mappings/match_collection_mappings.json", "utf-8"));
		await collectionCreate(app, "matches", "matches_collection", mappings);
	}
	if (! (await indexExists(app, "social"))){
		await indexCreate(app, "social");
	}
	if (! (await collectionExists(app, "social", "profiles"))){
		const mappings = JSON.parse(fs.readFileSync("./mappings/profile_collection_mappings.json", "utf-8"));
		await collectionCreate(app, "social", "profiles", mappings);
	}
	if (! (await collectionExists(app, "social", "connections"))){
		const mappings = JSON.parse(fs.readFileSync("./mappings/connections_mapping.json", "utf-8"));
		await collectionCreate(app, "social", "connections", mappings);
	}
}

async function collectionExists(app: Backend, index: String, collection: String){
	let response = await app.sdk.query({
		"index": index,
		"collection": collection,
		"controller": "collection",
		"action": "exists"
	});

	return response["result"];
}

async function collectionCreate(app: Backend, index: String, collection: String, mappings){
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

async function indexExists(app : Backend, index: String){
	let response = await app.sdk.query({
		"index": index,
		"controller": "index",
		"action": "exists"
        });
	return response["result"];
}

async function indexCreate(app: Backend, index: String){
	let response = await app.sdk.query({
		"index": index,
		"controller": "index",
		"action": "create"
	});
	return response["result"];
}
