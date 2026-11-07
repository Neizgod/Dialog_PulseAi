import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  registerUser,
  userSliceSelector,
} from "../../services/slices/userSlice";
import { useAppDispatch, useAppSelector } from "../../services/store";
import { RegisterPageUI } from "../ui/RegisterUI/RegisterPageUI";

export const Register = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loginUserError, loginUserRequest } = useAppSelector(userSliceSelector);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    const result = await dispatch(
      registerUser({ full_name: fullName, email, password })
    );
    if (registerUser.fulfilled.match(result)) {
      navigate("/login");
    }
  };

  return (
    <RegisterPageUI
      fullName={fullName}
      setFullName={setFullName}
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
