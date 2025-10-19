export async function signOut() {
  await fetch(`${import.meta.env.VITE_API_URL}/authentication/sign-out`, {
    method: "POST",
    credentials: "include",
  });
}
