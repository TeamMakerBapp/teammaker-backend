#!/bin/bash

# Function to get the private IP address of the host machine
get_private_ip() {
 ip -o -4 addr show scope global | awk '{split($4, a, "/"); print a[1]; exit}'
}

# Path to your JSON file
json_file="config.json"

# Get the private IP address
private_ip=$(get_private_ip)
json_file=".env.json"
# Check if the JSON file exists
if [ -f "$json_file" ]; then
	new_json=$(jq --arg private_ip $private_ip '.config.hostAddress = $private_ip | .config.deeplink = "exp://" + $private_ip + ":8081"' $json_file)
	echo "$new_json" > "$json_file"
else
    echo "JSON file $json_file not found."
fi

