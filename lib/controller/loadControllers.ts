import { Foo } from "./foo/bar";

export function loadControllers(app) {
  const foo = new Foo(app);
  app.controller.use(foo);
  console.log('oli');
}
