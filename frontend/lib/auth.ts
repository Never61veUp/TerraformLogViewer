const API_URL = "https://api.terraformlogviewer.ru";

export function getToken() {
    return localStorage.getItem("token");
}

export function clearToken() {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export async function signOut() {
    const token = getToken();
    if (!token) return;

    await fetch(`${API_URL}/api/User/signOut`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });

    clearToken();
}

export function setTokenCookie(token: string) {
    document.cookie = `token=${token}; path=/; Secure; SameSite=Lax`;
}

export function getTokenCookie(): string | null {
    const match = document.cookie.match(new RegExp("(^| )token=([^;]+)"));
    return match ? match[2] : null;
}

// сохранение
export function setUserEmail(email: string) {
    localStorage.setItem("userEmail", email);
}

export function getUserEmail() {
    return localStorage.getItem("userEmail");
}
