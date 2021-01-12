declare module '*.less' {
  const less: any;
  export default less;
}

declare module 'less/dist/less.min.js' {
  interface lessTool {
    modifyVars: any;
    [propsName: string]: any;
  }
  const lessJS: {
    default: lessTool;
  };
  export default lessJS.default;
}