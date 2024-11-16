import { useGoogleLogin } from '@react-oauth/google';

import FacebookLogin from 'react-facebook-login';

import {jwtDecode} from 'jwt-decode'

import { FACEBOOK_APP_ID } from './config'

import AuthService from './services/auth';

function App() {
  const handleGoogleRegister = async (credentialResponse) => {
    try {
      console.log("credentialResponse:: ", credentialResponse);

      // Send the ID token to the Django backend for validation and login:
      // Note that, the token obtained is only useful for single request
      const response = await AuthService.googleRegister(credentialResponse.code);
      console.log('Login/Registration successful:', response.data);
      // You can now use the response to store the token or update the UI

    } catch (error) {
      console.error('Login Failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      console.log("credentialResponse:: ", credentialResponse);

      // Send the ID token to the Django backend for validation and login:
      // Note that, the token obtained is only useful for single request
      const response = await AuthService.googleLogin(credentialResponse.code);
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

  const googleRegister = useGoogleLogin({
    onSuccess: handleGoogleRegister,
    onError: handleGoogleLoginError,
    flow: 'auth-code'
  })

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleLogin,
    onError: handleGoogleLoginError,
    flow: 'auth-code'
  })  

  const handleFacebookRegister = async (response) => {
    if (response.status !== 'unknown') {
      try {
        console.log("Facebook Oauth Consent response:", response)

        const decode = jwtDecode(response.signedRequest)
        console.log("Decoded Signed :", decode)
        // Handle login success
  
        // Send the ID token to the Django backend for validation and login
        const authResp = await AuthService.facebookRegister(decode.code);
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

  const handleFacebookLogin = async (response) => {
    if (response.status !== 'unknown') {
      try {
        console.log("Facebook Oauth Consent response:", response)

        const decode = jwtDecode(response.signedRequest)
        console.log("Decoded Signed :", decode)
        // Handle login success
  
        // Send the ID token to the Django backend for validation and login
        const authResp = await AuthService.facebookLogin(decode.code);
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
          <button onClick={googleRegister}>
            Register With Google
          </button>
          <br/>
          <br/>
          {/* params description: https://www.npmjs.com/package/@react-oauth/google#usegooglelogin-both-implicit--authorization-code-flow */}
          <FacebookLogin
            appId={FACEBOOK_APP_ID} // Replace with your Facebook App ID
            autoLoad={false} // Whether to automatically load the login dialog
            callback={handleFacebookRegister}
            icon="fa-facebook"
            textButton='Register With Facebook'
            scope=''
            size='small'
            responseType='code'
          />
          <br/>
          <br/>
          <br/>
          <button onClick={googleLogin}>
            Login With Google
          </button>
          <br/>
          <br/>
          <FacebookLogin
            appId={FACEBOOK_APP_ID} // Replace with your Facebook App ID
            autoLoad={false} // Whether to automatically load the login dialog
            callback={handleFacebookLogin}
            icon="fa-facebook"
            textButton='Login With Facebook'
            scope=''
            size='small'
            responseType='code'
          />
      </header>
    </div>
  );
}

export default App;
