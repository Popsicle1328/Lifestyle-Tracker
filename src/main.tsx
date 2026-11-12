import React from 'react';
import ReactDOM from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
 <React.StrictMode><App/></React.StrictMode>
);

/**
 * A newer PWA should never forcibly reload an unsaved sleep or set entry.
 * The user confirms application of the new, already downloaded version.
 */
function showNewVersion(onAccept:()=>void){
 if(document.getElementById('daymark-update-notice'))return;
 const notice=document.createElement('div');notice.id='daymark-update-notice';notice.setAttribute('role','status');
 notice.style.cssText='position:fixed;left:14px;right:14px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:99999;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px;border:1px solid #8bcaba;border-radius:15px;background:#142e3b;color:#fff;box-shadow:0 12px 30px rgba(0,0,0,.25);font:500 13px system-ui,sans-serif';
 const text=document.createElement('span');text.textContent='A Daymark update is ready. Save your current entries before updating.';
 const action=document.createElement('button');action.textContent='Update now';action.style.cssText='flex-shrink:0;border:0;border-radius:10px;padding:11px;background:#42c7a2;color:#0a2830;font:700 12px system-ui,sans-serif';
 action.addEventListener('click',onAccept);notice.append(text,action);document.body.appendChild(notice);
}
if('serviceWorker' in navigator){
 let registration:ServiceWorkerRegistration|undefined;
 const updateSW=registerSW({
  immediate:true,
  onNeedRefresh(){showNewVersion(()=>{void updateSW(true)});},
  onRegisteredSW(_url,r){registration=r;},
  onRegisterError(error){console.warn('Daymark service worker registration failed:',error)}
 });
 const check=()=>{if(navigator.onLine&&registration)void registration.update().catch(()=>{});};
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
 window.addEventListener('focus',check);
}
