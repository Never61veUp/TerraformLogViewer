export function setTokenCookie(token: string) {
    document.cookie = `token=${token}; path=/; Secure; SameSite=Lax`;
}

export function getTokenCookie(): string | null {
    const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
    return match ? match[2] : null;
}
