import type {AuthConfig} from 'convex/server';
// Pin the same public signing key as Pages. Avoid external OIDC discovery reads.
const key=process.env.AUTH_PUBLIC_JWK?JSON.parse(process.env.AUTH_PUBLIC_JWK):null;
const configured=process.env.AUTH_ISSUER&&process.env.AUTH_APPLICATION_ID&&key?.kty==='RSA'&&key.n&&key.e;
export default {providers:configured?[{type:'customJwt',issuer:process.env.AUTH_ISSUER!,applicationID:process.env.AUTH_APPLICATION_ID!,algorithm:'RS256',jwks:'data:text/plain;charset=utf-8;base64,'+btoa(JSON.stringify({keys:[{kty:'RSA',n:key.n,e:key.e,kid:key.kid||'omiebot-1',use:'sig',alg:'RS256'}]}))}]:[]} satisfies AuthConfig;
