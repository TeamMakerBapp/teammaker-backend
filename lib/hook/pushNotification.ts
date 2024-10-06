export async function sendPushNotification(notification) {
  if (notification.type == "chat") {
    const urlExpoPushNotif = "https://exp.host/--/api/v2/push/send";
    const target = notification.target
    const profile = await this.app.sdk.document.get("social", "profiles", target);
    const device_token = profile?._source?.device_token;
    if (device_token == null || device_token == "") return;
    try {
      const response = await fetch(urlExpoPushNotif,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "to": device_token,
            "title": `New message from ${notification.content.user}`,
            "body": `${notification.content.text}`
          })
        });
      if (!response.ok) {
        console.error("Failed to send notification to user")
      }
      const json = await response.json();
      console.log(json);
    } catch (error) {
      console.error(error.message);
    }
  }
}
