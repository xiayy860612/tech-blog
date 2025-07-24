---
title: OIDC Design
date: 2025-07-13 14:00:19
categories:
- system
tags:
- oidc
- oauth2
---

## Endpoints

- discovery endpoint(`/.well-known/openid-configuration`), show all endpoints for client
- auth endpoint(`/auth`), trigger authorize workflow
- token endpoint(`/token`), exchange/refresh token info
- JWKS endpoint(`/.well-known/jwks.json`), is used to verify jwt token, such like id token
- user endpoint(`/me`), get lateset user info
- end session endpoint(`/session/end`), is used to logout

<!--more-->

## Token

### ID Token

It's a `JWT token`, represents a user credentials for successful login user,
and includes basic user profile which defined by scope and claim.

It's always passed to client and is used show user info.

most important fields in ID Token:

- sub(Subject), subject contains user unique id
- iss(Issuer), IDP host which signed ID Token
- exp(Expiration time), expiration timestamp for ID Token
- iat(Issued at), sign timestamp for ID Token
- aud(Audience), mostly is client id
- user claims, show basic user info

```json
{
   "iss": "https://idp-doamin",
   "sub": "24400320",
   "aud": "client-id",
   "exp": 1311281970,
   "iat": 1311280970,
   ...
   <user claims>
}
```

Client uses HTTP Header `Authorization: "Bearer <ID Token>"` to send request to server,
then server could use `JWKS endpoint` to get public key to verify ID Token.

### Access Token

It mostly is an `Opaque token` which is a random string
and used to access IDP resources, such like below cases:

- invoke user endpoint to get more user details.

Access token is mostly `saved in backend`. If client required IDP resources, backend service could be proxy to get related resources and return to client.

### Refresh Token

It's used to get a new Access Token and ID Token when Access Token / ID Token is expired by invoking `token endpoint`.

It should be `saved in backend` for security.

It requires scope `offline_access` and `prompt=consent` in querystring when trigger auth workflow,
and use grant type `refresh_token` when refresh token with `token endpoint`

More details for reference:

- [刷新 Access Token](https://docs.authing.cn/v2/guides/federation/oidc.html#%E5%88%B7%E6%96%B0-access-token)

### Expiration Time for Tokens

`Refresh Token > ID Token >= Access Token`

When ID Token/Access Token is expired, client can trigger refresh token action in server to get new one,
that's why expiration time for ID Token/Access Token could be short.

When Refresh Token is expired, user must re-login again to obtain new token info include refresh token,
to avoid requiring users to login frequently, refresh tokens are given a long expiration time.

## authorize Workflow with authorization_code

```plantuml

actor User as U
actor Client as C
control "Resource Service" as S
control "OIDC IDP" as IDP

U --> C: trigger login
C --> S: apply login url
S --> C: return generated one-time url for auth endpoint

group login phase
C --> IDP: redirect to generated auth endpoint and show login page
U --> IDP: fill user credentials
IDP --> IDP: verify user credentials
end

group consent phase
IDP --> C: show consent page
U --> IDP: confirm in consent page
IDP --> IDP: create session for login user
IDP --> C: redirect login callback
end

group get token phase
C --> S: send received code
S --> IDP: get token info by code with token endpoint
IDP --> S: return token info include id token, access token, refresh token and profile.
S --> S: decode Id Token to get user info
S --> S: save user info and token info with session
S --> C: return user info and access token
C --> C: save access token and show user info from id token
C --> C: redirect to root page
end

group get resource phase

U --> C: access resources
C --> S: send request to apply resource with access token
S --> IDP: verify access token
S --> S: get user info from session and check permissions
S --> C: return user related resources

end

group refresh token in slient

C --> S: trigger refresh access token when it will be expired
S --> IDP: get new access token with original access token and refresh token
S --> S: decode Id Token to get user info
S --> C: return user info and access token
C --> C: save user info and access token

end

group logout phase

U --> C: trigger logout
C --> S: apply logout url
S --> C: return generated one-time logout url for end session endpoint
C --> IDP: redirect to end session endpoint with logout url
IDP --> IDP: destroy user session
IDP --> C: rediret to logout callback page
C --> C: clear local session info include user info and access token, then redirect to root page

end

```

good resources for reference:

- demo show in [使用 OIDC 授权码模式](https://docs.authing.cn/v2/federation/oidc/authorization-code/?step=0)

## Client Integration

Preparation:

- client id/client secret, presents client is trusted source
- login callback
- logout callback
- scope
- grand type

### Login and get Id Token

1. Client backend generates IDP login url for client frontend
2. Frontend redirects to IDP `auth endpoint` by generated login url
3. When login success, IDP will redirect frontend to `login callback` page with code
4. Frontend will transfer code to backend, then backend will exchange token by code with IDP `token endpoint`
5. Backend return id token to frontend after token exchange.
6. Show user info from id token

### Logout

1. Client backend generate IDP logout url for frontend
2. Frontend redirects to IDP `end session endpoint` by generated logout url
3. When logout success, IDP will redirect frontend to `logout callback` page
4. Clear token in frontend/backend session
5. Frontend redirects to root page

### Verify Id Token

1. Client frontend uses HTTP Header `Authorization: "Bearer <ID Token>"` to send request to backend,
2. Backend will use `JWKS endpoint` to get public key to verify ID Token
3. If invalid, request will be denied with http status 401 Unauthorized frontend should re-login.

### Refresh Expired Id Token

1. Check if Id Token is expired periodly or when sending request with id token
2. If expired, client frontend apply to refresh Id Token with backend
3. Backend will invoke `token endpoint` to get new Token info, include access token and id token.
4. Backend update token in session, then return new id token to frontend
5. Frontend save id token and update user info

### SPA Integration

It recommends use `authorization_code + PKCE` flow for SPA, because it has no backend.

More details please refer:

- [授权码 + PKCE 模式](https://docs.authing.cn/v2/guides/federation/oidc.html#%E6%8E%88%E6%9D%83%E7%A0%81-pkce-%E6%A8%A1%E5%BC%8F)
- [使用 OIDC 授权码 + PKCE 模式](https://docs.authing.cn/v2/federation/oidc/pkce/?step=0)

#### Refresg Id Token in SPA

#### Refresh with refresh token

It requires store refresh token in frontend, and it's a security risk.

Mostly it requires OIDC IDP to support `refresh token with rotation and expiring old refresh token`,
then there will no security risk.

It's recommended by using `refresh token with rotation`.

#### Silent Authentication

It uses a **hidden** `<iframe>` that sends a new authorization request to OIDC IDP with `prompt=none`.

It requires:

- user session should be alive in OIDC IDP
- `prompt=none` is supported by OIDC IDP for this client
- `silent callback` url in redirect_uri of registered client in OIDC IDP

Mostly use 3rd part library, such as `oidc-client-ts`, instead of implement by youself.

## OIDC IDP Model Design

TODO

## Reference

- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0-final.html)
- [JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519)
