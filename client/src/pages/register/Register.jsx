import axios from "axios";
import { useRef, useState } from "react";
import "./register.css";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../apiCalls";

export default function Register() {
  const username = useRef();
  const email = useRef();
  const password = useRef();
  const passwordAgain = useRef();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleClick = async (e) => {
    e.preventDefault();
    setError("");
    if (passwordAgain.current.value !== password.current.value) {
      setError("Passwords don't match");
      return;
    }
    const user = {
      username: username.current.value,
      email: email.current.value,
      password: password.current.value,
    };
    try {
      await axios.post("/api/auth/register", user);
      navigate("/login");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="login">
      <div className="loginWrapper">
        <div className="loginLeft">
          <h3 className="loginLogo">Socials</h3>
          <span className="loginDesc">
            Connect with friends and the world around you on Socials.
          </span>
        </div>
        <div className="loginRight">
          <form className="loginBox" onSubmit={handleClick}>
            <input
              placeholder="Username"
              required
              ref={username}
              className="loginInput"
            />
            <input
              placeholder="Email"
              required
              ref={email}
              className="loginInput"
              type="email"
            />
            <input
              placeholder="Password"
              required
              ref={password}
              className="loginInput"
              type="password"
              minLength="8"
            />
            <input
              placeholder="Password Again"
              required
              ref={passwordAgain}
              className="loginInput"
              type="password"
            />
            {error && (
              <span role="alert" style={{ color: "#d32f2f", fontSize: 14 }}>
                {error}
              </span>
            )}
            <button className="loginButton" type="submit">
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="loginRegisterButton"
            >
              Log into Account
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}