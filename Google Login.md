# Google Oauth Login:

- **Package Used:** ``@react-oauth/google``

## Frontend Setup:

- Create a Google Client Key and Client ID following a google developer console. [Google Developer Console](https://console.developers.google.com/)

- Add the client id to your project's environment variables.

**Initializing Provider**

```js
    // index.js
    <GoogleOAuthProvider clientId={CLIENT_ID}>
        <App />
    </GoogleOAuthProvider>;
```

This allows clientId to be accessed anywhere in the context of application within ``react-oauth/google``.


**Login View:**

```js
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function App() {
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      console.log("credentialResponse:: ", credentialResponse);

      // Send the ID token to the Django backend for validation and login
      const response = await axios.post('http://localhost:8000/auth/google/login', {
        code: credentialResponse.code,
      });

      console.log('Login/Registration successful:', response.data);
      // You can now use the response to store the token or update the UI

    } catch (error) {
      console.error('Login Failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleGoogleLoginError = () => {
    console.log('Login Failed');
    alert('Login failed. Please try again.');
  };

  // Params Description: https://www.npmjs.com/package/@react-oauth/google#usegooglelogin-both-implicit--authorization-code-flow
  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: handleGoogleLoginError,
    flow: 'auth-code'
  })

  return (
    <div className="App">
      <header className="App-header">
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button onClick={googleLogin}>
            Login In Google
          </button>
        </a>
      </header>
    </div>
  );
}

export default App;
```

Note the following code:

```js
  // Param Description: https://www.npmjs.com/package/@react-oauth/google#usegooglelogin-both-implicit--authorization-code-flow
  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: handleGoogleLoginError,
    flow: 'auth-code'
  })
```

Here, the authentication flow is **auth-code** so, the response is:

```json
{
    "code": "",
    "scope": "",
    "authuser": "",
    "prompt": ""
}
```

Now, we need to pass the code to the backend. With the code, backend with proceed in following way:

- Step 1: Exchange authorization code for tokens

- Step 2: Validate and extract user info from the ID token

- Step 3: Create or Login User:

> **Note that the code obtained can only be used once.**


## Backend Django View:

> Serializers

```python
from rest_framework import serializers

class OauthSerializer(serializers.Serializer):
    """Serializer for oauth view with token"""
    code = serializers.CharField()
```


> View

```python

from rest_framework import status, generics
from rest_framework.response import Response

import requests
from knox.models import AuthToken

from django.contrib.auth import get_user_model

from django.conf import settings

User = get_user_model()


class GoogleAuthView(generics.GenericAPIView):
    """
    Handles Google OAuth 2.0 Login or Registration
    """

    serializer_class = OauthSerializer

    def post(self, request, *args, **kwargs):
        GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
        GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

        # Step 1: Get the authorization code from the request
        code = request.data.get("code")
        if not code:
            return Response({"error": "Authorization code is missing."}, status=status.HTTP_400_BAD_REQUEST)

        # Step 2: Exchange authorization code for tokens
        token_payload = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        }
        token_response = requests.post(GOOGLE_TOKEN_URL, data=token_payload)

        if token_response.status_code != 200:
            return Response(
                {"error": "Failed to exchange token.", "details": token_response.json()},
                status=token_response.status_code,
            )

        tokens = token_response.json()
        access_token = tokens.get("access_token")
        id_token = tokens.get("id_token")
        refresh_token = tokens.get("refresh_token")

        if not access_token or not id_token:
            return Response(
                {"error": "Access token or ID token is missing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Step 3: Validate and extract user info from the ID token
        userinfo_response = requests.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if userinfo_response.status_code != 200:
            return Response(
                {"error": "Failed to fetch user info.", "details": userinfo_response.json()},
                status=userinfo_response.status_code,
            )

        userinfo = userinfo_response.json()
        email = userinfo.get("email")

        if not email:
            return Response(
                {"error": "User info does not contain email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # TODO: if user exists create a token for user, other wise register user, and signin
        return Response({
            "message": "Login successful.",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": userinfo
        }, status=status.HTTP_200_OK)
```

> URLs

```python
from django.urls import path
from . import views


urlpatterns = [
    path('google/', views.GoogleAuthView.as_view(), name="google_login"),
]

```
