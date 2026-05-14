// react-router v7 NavigateFunction returns void | Promise<void> because
// RouterProvider/Framework mode resolves navigations as Promises. We use
// <BrowserRouter> which always returns void, so we narrow the overloads here
// to silence no-floating-promises / no-misused-promises across the app.
// See the react-router docs note on NavigateFunction.
export {};

declare module "react-router" {
  interface NavigateFunction {
    (to: To, options?: NavigateOptions): void;
    (delta: number): void;
  }
}
