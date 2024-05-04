import { Controller, KuzzleRequest , Backend } from 'kuzzle';

export class Foo extends Controller {
  constructor (app: Backend) {
    super(app);
    this.name = "foo";
    // type ControllerDefinition
    this.definition = {
      actions: {
        bar: {
          handler: async request => {
            return `Hello ${request.getString('name')}!`
          },
          http:[
            { verb: 'get', path: '/foo/bar' },
          ]
        },
      }
    };
  }
}
