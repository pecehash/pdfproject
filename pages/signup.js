import { useForm } from "react-hook-form";
import { api } from "../lib/api";
import { useRouter } from "next/router";

export default function Signup() {
  const { register, handleSubmit } = useForm();
  const router = useRouter();

  const onSubmit = async (data) => {
    try {
      const res = await api.post("/auth/signup", data);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("api_key", res.data.user.api_key);
      router.push("/dashboard");
    } catch (err) {
      alert(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} placeholder="Email" required />
      <input {...register("password")} type="password" placeholder="Password" required />
      <button type="submit">Signup</button>
    </form>
  );
}
