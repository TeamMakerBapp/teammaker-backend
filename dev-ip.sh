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
    # Extract the hostAddress value from the JSON file
    host_address=$(jq -r '.config.hostAddress' "$json_file")

    # Replace the hostAddress value with the private IP address
    new_json=$(jq --arg new_ip "$private_ip" '.config.hostAddress = $new_ip' "$json_file")

    # Write the updated JSON back to the file
    echo "$new_json" > "$json_file"
    echo "Updated hostAddress to $private_ip in $json_file"
else
    echo "JSON file $json_file not found."
fi

