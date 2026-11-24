const home = import.meta.env.VITE_HOME_URL || (() => { const u=new URL(location.origin); u.port='8081'; return u.href; })();
const workspace = import.meta.env.VITE_WORKSPACE_URL || (() => { const u=new URL(location.origin); u.port='8082'; return u.href; })();
document.querySelectorAll('[data-home]').forEach(a=>a.href=home);
document.querySelectorAll('[data-workspace]').forEach(a=>a.href=workspace);
const apk=import.meta.env.VITE_APK_URL;
if(apk) document.querySelectorAll('[data-apk]').forEach(a=>{a.href=apk;a.removeAttribute('aria-disabled');a.textContent='下载 Android APK';});
