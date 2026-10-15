// Set both variables on the Convex deployment. With neither set, authenticated
// functions remain inaccessible; no anonymous owner or browser secret is used.
export default { providers: process.env.AUTH_ISSUER && process.env.AUTH_APPLICATION_ID ? [{domain:process.env.AUTH_ISSUER,applicationID:process.env.AUTH_APPLICATION_ID}] : [] };
