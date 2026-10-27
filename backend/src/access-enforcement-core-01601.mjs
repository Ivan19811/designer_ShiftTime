// ShiftTime 01601 · additional explicitly classified, authenticated merchant operations.
// Public buyer checkout, SSO callbacks, and external provider webhooks are NOT covered here.
const M=v=>String(v||'').toUpperCase();
const action=(permission,legacy='write')=>({permission,siteId:'',legacy});
export function classifyExtendedAction01601(method,parts){
  const m=M(method),p=parts;
  if(!Array.isArray(p)||p[0]!=='api'||p[1]!=='v1')return null;
  if(p[2]==='media'){
    if(p[3]==='storage'&&p[4]==='status'&&m==='GET')return action('builder.media.view','read');
    if(p[3]==='assets'){
      if(m==='GET'&&p.length===4)return action('builder.media.view','read');
      if(m==='DELETE'&&p.length===5)return action('builder.media.delete');
    }
    if(p[3]==='remote-image'&&p[4]==='fetch'&&m==='POST'&&p.length===5)return action('builder.media.upload');
    if(p[3]==='uploads'){
      if(m==='POST'&&p.length===4)return action('builder.media.upload');
      if(m==='POST'&&p[4]==='proxy'&&p.length===5)return action('builder.media.upload');
      if(m==='POST'&&p[4]&&p[5]==='complete'&&p.length===6)return action('builder.media.upload');
    }
    return null;
  }
  if(p[2]==='tables'){
    if(m==='GET'&&(p.length===3||p.length===4))return action('builder.tables.view','read');
    if(m==='POST'&&p.length===3)return action('builder.tables.edit');
    if(['PATCH','POST'].includes(m)&&p.length>=4)return action('builder.tables.edit');
    if(m==='DELETE'&&p.length>=4)return action('builder.tables.delete');
    return null;
  }
  if(p[2]==='network'){
    if(p[3]==='inventory'){
      if(m==='GET')return action('shop.inventory.view','read');
      if(m==='POST'&&p[4]==='expire')return action('shop.inventory.manage');
      if(m==='PATCH'&&p[4]==='reservations'&&p[5])return action('shop.inventory.manage');
    }
    if(p[3]==='shipping'){
      if(m==='GET')return action('shop.shipping.view','read');
      if(m==='PATCH'&&p[4])return action('shop.shipping.edit','order-write');
      if(m==='POST'&&p[4]&&p[5]==='simulate')return action('shop.shipping.simulate','order-write');
    }
    if(p[3]==='payments'){
      if(m==='GET')return action('shop.payments.view','read');
      if(m==='POST'&&p[4]==='order'&&p[5])return action('shop.payments.create');
      if(m==='PATCH'&&p[4])return action('shop.payments.edit');
    }
    if(p[3]==='payouts'){
      if(m==='GET')return action('shop.payouts.view','read');
      if(m==='PATCH'&&p[4])return action('shop.payouts.edit');
    }
    if(m==='POST'&&p[3]==='join')return action('shop.settings.manage');
    if(m==='PATCH'&&['seller','policy'].includes(p[3]))return action('shop.settings.manage');
    return null;
  }
  if(p[2]==='integrations'&&p[3]==='google-sheets'){
    if(m==='GET'&&p[4]==='oauth'&&p[5]==='status')return action('builder.integrations.view','read');
    if(m==='POST'&&p[4]==='read')return action('builder.integrations.view','write'); // legacy read endpoint required write
    if(m==='POST'&&p[4]==='oauth'&&['start','disconnect'].includes(p[5]))return action('builder.integrations.manage');
    return null;
  }
  if(p[2]==='ai-assistant'&&((p[3]==='settings'&&m==='PUT')||(p[3]==='action-run'&&m==='POST')))return action('builder.ai.configure');
  if(p[2]==='ai-consultant'){
    if(p[3]==='settings'&&m==='PUT')return action('builder.ai.configure');
    if(p[3]==='sales-rules'&&['POST','PUT','DELETE'].includes(m))return action('builder.ai.configure');
  }
  if(p[2]==='marketplace'){
    if(p[3]==='seo'){
      if(m==='GET')return action('builder.seo.view','read');
      if(m==='PATCH')return action('builder.seo.edit');
    }
    if(p[3]==='supplier-sync-schedules'){
      if(m==='GET')return action('shop.suppliersync.view','read');
      if(['PUT','DELETE'].includes(m)&&p[4])return action('shop.suppliersync.manage');
      if(m==='POST'&&p[4]&&p[5]==='run')return action('shop.suppliersync.manage');
    }
    if(p[3]==='supplier-sync-alerts'){
      if(m==='GET')return action('shop.suppliersync.view','read');
      if(m==='POST'&&p[4]&&['read','dismiss'].includes(p[5]))return action('shop.suppliersync.manage');
    }
    if(p[3]==='supplier-sync-alert-rules'){
      if(m==='GET')return action('shop.suppliersync.view','read');
      if(['PUT','DELETE'].includes(m))return action('shop.suppliersync.manage');
    }
    if(p[3]==='supplier-sync-approvals'){
      if(m==='GET')return action('shop.suppliersync.view','read');
      if(m==='POST'&&p[4]&&['approve','reject'].includes(p[5]))return action('shop.suppliersync.approve');
    }
    if(p[3]==='import-rollbacks'){
      if(m==='GET')return action('shop.products.import','read');
      if(m==='POST'&&p[4]&&p[5]==='restore')return action('shop.products.import');
    }
    return null;
  }
  return null;
}
