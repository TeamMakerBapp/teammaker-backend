const {
  Kuzzle,
  WebSocket,
  User
} = require('kuzzle-sdk');
const kuzzle = new Kuzzle( new WebSocket('localhost'));
const u = new User('asdf');
  console.log(u)
const run = async () => {
  const credentials = { username: 'b@b.com', password: 'b@b.com' };
  try {
    await kuzzle.connect();
    const jwt = await kuzzle.auth.login('local', credentials);
    const filter = {
    }
    const callback = (notification) => {
      if (notification.type === 'document' && notification.action === 'create'){
        console.log(notification.result);
        kuzzle.disconnect();
      }
    };
//    const userId = "kuid-nifty-shadowfax-85870";
//
//    await kuzzle.realtime.subscribe('chat', userId, filter, callback);
//    console.log('Successfully subscribed to document notifications!');
    const { result } = await kuzzle.query({
      controller: "chat",
      action: "getMessages",
    });

    console.log(result.channel);
    kuzzle.protocol.on(result.channel, (notification) => {
// result: {
//    _id: '1b3B2ZEBJmMxBc4_4aQ1',
//    _source: { message: [Object], _kuzzle_info: [Object] },
//    _version: 1
//  },
      console.log(notification.result._source.message);
    });
  } catch (error) {
    console.log(error.message);
  }
};

run();
