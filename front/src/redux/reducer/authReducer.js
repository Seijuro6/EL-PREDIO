import { LOGIN_USER, LOGOUT_USER, SET_USER  } from "../actions/authActions";

const initialState = {
    token: localStorage.getItem('token'),
    error: null,
}

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_USER:
      return {
        ...state,
        token: action.payload.token,
        error: null,
        isLoggedIn: true
      };
    case LOGOUT_USER:
      return {
        ...state,
        isLoggedIn: false,
        user: action.payload,
      };
    case SET_USER:
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

export default authReducer;
