const API_URL = "https://cjyajo-5-166-53-171.ru.tuna.am/swagger/index.html";

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/api/User/signIn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) throw new Error(data?.detail || "Ошибка авторизации");
    return data;
}

export async function register(email: string, password: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/User/signUp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) throw new Error(data?.detail || "Ошибка регистрации");
}
