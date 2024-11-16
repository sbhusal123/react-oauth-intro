# React Social Sign In With DRF

This repo is an experiment to understand how social sign in works.

- [Facebook Login](./Facebook%20Login.md)
- [Google Login](./Google%20Login.md)

**Client side Libraries:**

- [react-oauth/google](https://www.npmjs.com/package/@react-oauth/google)

- [react-facebook-login](https://www.npmjs.com/package/react-facebook-login)

Basically the idea is to:

1. Get the code (authorization code) after user verifies identity in consent screen.
2. Code thus obtained is passed to the rest api.
3. Rest api does following steps:
    3.1. Exchanges the authorization code for access and refresh token by hitting providers token exchange endpoint.
    3.2. Get the user details from provider's user details endpoint passing access token.
    3.3. Create / authenticate user.


## 1. Facebook

- [Facebook GraphAPI Explorer](https://developers.facebook.com/tools/explorer/)
- [Getting Started with GraphAPI](https://developers.facebook.com/docs/graph-api/get-started/)


### i. Oauth Consent Screen:
In this phase, client (frontend) is presented with provider's concent screen. On a callback response, it receives an authorization code which is decoded, note that the authorization code needs to decoded.

```js
// Response
{
    "name": "",
    "id": "",
    "userID": "",
    "expiresIn": 5888,
    "accessToken": "",
    "signedRequest": "",
    "graphDomain": "facebook",
    "data_access_expiration_time": 213123
}

// JWT decoded signedRequest: jwt_decode(signedRequest)
{
    "user_id": "",
    "code": "",
    "algorithm": "",
    "issued_at": 1731763312
}

// Code thus obtained is the authorization code, which we'll use further.
```

### ii. Token Endpoint
- This endpoint is used to exchange the authorization code for an access token.


```python
FACEBOOK_TOKEN_URL = "https://graph.facebook.com/v12.0/oauth/access_token"
token_payload = {
    "client_id": settings.FACEBOOK_APP_ID,
    "client_secret": settings.FACEBOOK_APP_SECRET,
    "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
    "code": code,
}
token_response = requests.get(FACEBOOK_TOKEN_URL, params=token_payload)
```

```sh
GET: https://graph.facebook.com/v12.0/oauth/access_token?client_id=<client_id>&client_secret=<client_secret>&redirect_uri=<redirect_uri>&code=<authorization_code>

Response:
{
	'access_token': '', 
	'token_type': 'bearer', 
	'expires_in': 4164
}
```


### iii. User Detail Endpoint:

```python
        fields = "id,first_name,middle_name,last_name,email,picture"
        userinfo_response = requests.get(
            FACEBOOK_USERINFO_URL,
            params={"access_token": access_token, "fields": fields}
        )
```

With the access token, we can now obtain the user details:

```js
https://graph.facebook.com/me?access_token=<access_token>&fields=id%2Cfirst_name%2Cmiddle_name%2Clast_name%2Cemail%2Cpicture

{
	'id': '',
	'first_name': '',
	'last_name': '',
	'email': '',
	'picture': {
		'data': {
			'height': 50,
			'is_silhouette': False,
			'url': '',
			'width': 50
		}
	}
}
```

> Same response can be further used to validate the user login or create a user.

## 2. Google

- [Google Oauth Playground](https://developers.google.com/oauthplayground/)

- [Using Oauth2.0](https://developers.google.com/identity/protocols/oauth2)

### i. Oauth Consent Screen:

In this phase, client (frontend) is presented with provider's consent screen. On a callback response, it receives an authorization code which is decoded, note that the authorization code needs to decoded.

> Response

```js
{
    "code": "",
    "scope": "email profile openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
    "authuser": "0",
    "prompt": "consent"
}
```

### ii. Token Endpoint:

We can use the code, from the step 1 and construct the payload on the backend and send a post request to token url as follows:

```python
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
token_payload = {
    "client_id": settings.GOOGLE_CLIENT_ID,
    "client_secret": settings.GOOGLE_CLIENT_SECRET,
    "code": code,
    "grant_type": "authorization_code",
    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
}
token_response = requests.post(GOOGLE_TOKEN_URL, data=token_payload)
```

> Response
```json
{
    'access_token': '', 
    'expires_in': 3599,
    'refresh_token': '',
    'scope': 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
    'token_type': 'Bearer',
    'id_token': ''
}
```

This step yields us with, `access_token` and `id_token`, which we can use to fetch the user details.

### iii. Userinfo Endpoint:

```python
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

userinfo_response = requests.get(
    GOOGLE_USERINFO_URL,
    headers={"Authorization": f"Bearer {access_token}"}
)

```

> Response

```js
{
    'sub': '',
    'name': '',
    'given_name': '',
    'family_name': '',
    'picture': '',
    'email': '',
    'email_verified': True
}
```

The way oauth works with a client side and server side is:

- Client requests, authorization token from the Oauth server.

- Oauth server responds with authorization token/code. Note that, authorization token is like a key to enter the main gate of a building (Oauth server).

- Client passes the authorization code to server side.

- Server side generates JWT access, refresh token to further access the resources. (JWT tokens are like a key to a particular room.)

- A same jwt token is used to access other protected resources in Oauth Server.

Here, **client** refers to frontend, or mobile application, and **server** refers to backend** and **Oauth Server** refers to providers like Google, Facebook etc.
