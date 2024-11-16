import api from "./index"

export default class AuthService {

    static googleRegister(code) {
        return api.post('/auth/google/', {
            code
        })
    }

    static facebookRegister(code) {
        return api.post('/auth/facebook/', {
            code
        })
    }

    static googleLogin(code) {
        return api.post('/auth/google/login/', {
            code
        })
    }

    static facebookLogin(code) {
        return api.post('/auth/facebook/login/', {
            code
        })
    }
}