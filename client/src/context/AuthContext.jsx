import { createContext, useEffect, useReducer } from "react";
import axios from "axios";
import AuthReducer from "./AuthReducers";

const INITIAL_STATE = {
  user: null,
  isCheckingSession: true,
  isFetching: false,
  error: null,
};

export const AuthContext = createContext(INITIAL_STATE);

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

  useEffect(() => {
    // The session now lives in an httpOnly cookie. Older versions kept the user here, password hash included.
    localStorage.removeItem("user");

    const interceptor = axios.interceptors.response.use(undefined, (error) => {
      const isAuthRoute = error.config?.url?.startsWith("/api/auth/");
      if (error.response?.status === 401 && !isAuthRoute) {
        dispatch({ type: "LOGOUT" });
      }
      return Promise.reject(error);
    });

    axios
      .get("/api/auth/me")
      .then((res) => dispatch({ type: "SESSION_CHECKED", payload: res.data }))
      .catch(() => dispatch({ type: "SESSION_CHECKED", payload: null }));

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        isCheckingSession: state.isCheckingSession,
        isFetching: state.isFetching,
        error: state.error,
        dispatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
