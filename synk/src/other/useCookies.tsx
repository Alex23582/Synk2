export default function useCookies() {
    function setCookie(name: string, value: string, days: number) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }
    function getCookie(name: string) {
        var pairs = document.cookie.split('; ');
        var cookies: any = {};
        for (let i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            cookies[pair[0]] = pair[1];
        }
        return cookies[name]
    }
    function getAuthObject(){
        return{
            session: getCookie("session"),
            sessionsecret: getCookie("sessionsecret")
        }
    }
    return { setCookie, getCookie, getAuthObject }
}