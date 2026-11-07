import { useState, type SyntheticEvent } from "react";
import { loginUser, userSliceSelector } from "../../services/slices/userSlice";
import { useAppDispatch, useAppSelector } from "../../services/store";
import { LoginPageUI } from "../ui/loginPageUI/loginPageUI";

export const Login = () => {
  const dispatch = useAppDispatch();
  const { loginUserError, loginUserRequest } = useAppSelector(userSliceSelector);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <LoginPageUI
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      handleSubmit={handleSubmit}
      error={loginUserError?.message ?? null}
      loading={loginUserRequest}
    />
  );
};
