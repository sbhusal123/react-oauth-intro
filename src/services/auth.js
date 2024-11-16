import api from "./index"

export default class AuthService {

    static googleAuth(code) {
        return api.post('/auth/google/', {
            code
        })
    }

    static facebookAuth(code) {
        return api.post('/auth/facebook/', {
            code
        })
    }    
}
