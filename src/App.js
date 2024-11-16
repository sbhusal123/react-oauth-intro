import { useGoogleLogin } from '@react-oauth/google';

import FacebookLogin from 'react-facebook-login';

import {jwtDecode} from 'jwt-decode'

import { FACEBOOK_APP_ID } from './config'

import AuthService from './services/auth';

function App() {
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      console.log("credentialResponse:: ", credentialResponse);

      // Send the ID token to the Django backend for validation and login:
      // Note that, the token obtained is only useful for single request
      const response = await AuthService.googleAuth(credentialResponse.code);
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

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: handleGoogleLoginError,
    flow: 'auth-code'
  })

  const responseFacebook = async (response) => {
    if (response.status !== 'unknown') {
      try {
        console.log("Facebook Oauth Consent response:", response)

        const decode = jwtDecode(response.signedRequest)
        console.log("Decoded Signed :", decode)
        // Handle login success
  
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

  return (
    <div className="App">
      {}
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
          <br/>
          <br/>
          {/* params description: https://www.npmjs.com/package/@react-oauth/google#usegooglelogin-both-implicit--authorization-code-flow */}
          <FacebookLogin
            appId={FACEBOOK_APP_ID} // Replace with your Facebook App ID
            autoLoad={false} // Whether to automatically load the login dialog
            callback={responseFacebook}
            icon="fa-facebook"
            scope=''
            size='small'
            responseType='code'
          />
        </a>
      </header>
    </div>
  );
}

export default App;
