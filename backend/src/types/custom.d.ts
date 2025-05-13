declare module 'xss-clean' {
  import { RequestHandler } from 'express';
  const xss: RequestHandler;
  export default xss;
}

declare module 'hpp' {
  import { RequestHandler } from 'express';
  const hpp: RequestHandler;
  export default hpp;
}

declare module 'express-fileupload' {
  import { RequestHandler } from 'express';
  const fileupload: RequestHandler;
  export default fileupload;
} 