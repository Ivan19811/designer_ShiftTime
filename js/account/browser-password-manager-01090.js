// 01090 · Browser password-manager bridge. Never persists passwords in ShiftTime storage.
function clean(v){return String(v??'').trim();}
export async function offerBrowserPasswordSave01090({email='',password='',name=''}={},env=globalThis){
  const id=clean(email).toLowerCase(),secret=String(password||'');
  if(!id||!secret)return false;
  const PasswordCredentialCtor=env?.PasswordCredential;
  const store=env?.navigator?.credentials?.store;
  if(typeof PasswordCredentialCtor!=='function'||typeof store!=='function')return false;
  try{
    const credential=new PasswordCredentialCtor({id,password:secret,name:clean(name)||id});
    await store.call(env.navigator.credentials,credential);
    return true;
  }catch{return false;}
}
