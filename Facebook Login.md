# Facebook Login:

## 1. Frontend Setup

Head over to: [Facebook Developer Portal](https://developers.facebook.com/apps/) and create a app.

Get 3 things from your app:
- App ID
- App Secret
- Redirect URI


We'll be using ``react-facebook-login`` for facebook login. ``yarn add react-facebook-login``

```js
  const responseFacebook = async (response) => {
    if (response.status !== 'unknown') {
      try {
        // note that the code is signed, so its necessary to be decoded
        const decode = jwtDecode(response.signedRequest)
        // Handle login success
        console.log('Facebook login success::', response);
  
        // Send the ID token to the Django backend for validation and login
        const authResp = await AuthService.facebookAuth(decode.code);
        console.log('Login/Registration successful:', authResp.data);
  
        console.log("Decoded Signed Request::", decode)
      } catch (error) {
        console.log("Login error::", error)
        alert('Login failed. Please try again.');
      }

    } else {
      // Handle login failure
      console.error('Facebook login failed:', response);
    }
  };  
          // Params Description: https://www.npmjs.com/package/react-facebook-login#parameters
          <FacebookLogin
            appId={FACEBOOK_APP_ID} // Replace with your Facebook App ID
            autoLoad={false} // Whether to automatically load the login dialog
            fields=""
            callback={responseFacebook}
            icon="fa-facebook"
            size='small'
            scope=""
            // note that the response type should be code here
            responseType='code'
          />
```
Here, the response we get is:

```js
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

// To get the token, we'll have to decode the signedRequest which gives us with: jwt_decode(signedRequest)
{
    "user_id": "",
    "code": "",
    "algorithm": "",
    "issued_at": 1731763312
}

// Code thus obtained is the authorization code, which we'll use further.
```


Now, we need to pass the code to the backend. With the code, backend with proceed in following way:

- Step 1: Exchange authorization code for tokens

- Step 2: Validate and extract user info from the ID token

- Step 3: Create or Login User.

## 2. Backend Setup:

> Serializers

```python
from rest_framework import serializers

class OauthSerializer(serializers.Serializer):
    """Serializer for oauth view with token"""
    code = serializers.CharField()
```

> Viewset

```python
from rest_framework import status, generics
from rest_framework.response import Response

import requests
from knox.models import AuthToken

from django.contrib.auth import get_user_model

from django.conf import settings

User = get_user_model()

class FacebookAuthView(generics.GenericAPIView):
    """
    Handles Facebook OAuth 2.0 Login or Registration
    """
    serializer_class = OauthSerializer

    def post(self, request):
        """Return users details"""

        FACEBOOK_TOKEN_URL = "https://graph.facebook.com/v12.0/oauth/access_token"
        FACEBOOK_USERINFO_URL = "https://graph.facebook.com/me"

        # Step 1: Get the authorization code from the request
        code = request.data.get("code")
        if not code:
            return Response({"error": "Authorization code is missing."}, status=status.HTTP_400_BAD_REQUEST)

        # Step 2: Exchange authorization code for access token
        token_payload = {
            "client_id": settings.FACEBOOK_APP_ID,
            "client_secret": settings.FACEBOOK_APP_SECRET,
            "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
            "code": code,
        }
        token_response = requests.get(FACEBOOK_TOKEN_URL, params=token_payload)

        if token_response.status_code != 200:
            return Response(
                {"error": "Failed to exchange token.", "details": token_response.json()},
                status=token_response.status_code,
            )

        tokens = token_response.json()
        access_token = tokens.get("access_token")

        if not access_token:
            return Response({"error": "Access token is missing."}, status=status.HTTP_400_BAD_REQUEST)

        # Step 3: Fetch user info using access token
        fields = "id,first_name,middle_name,last_name,email,picture"
        userinfo_response = requests.get(
            FACEBOOK_USERINFO_URL,
            params={"access_token": access_token, "fields": fields}
        )

        if userinfo_response.status_code != 200:
            return Response(
                {"error": "Failed to fetch user info.", "details": userinfo_response.json()},
                status=userinfo_response.status_code,
            )

        userinfo = userinfo_response.json()
        email = userinfo.get("email")

        if not email:
            return Response({"error": "User info does not contain email."}, status=status.HTTP_400_BAD_REQUEST)

        # TODO: if user exists create a token for user, other wise register user, and signin

        return Response({
            "message": "Login successful.",
            "access_token": access_token,
            "user": userinfo
        }, status=status.HTTP_200_OK)
```

> URLS

```python
from django.urls import path
from . import views


urlpatterns = [
    path('facebook/', views.FacebookAuthView.as_view(), name="facebook_login"),
]
```
