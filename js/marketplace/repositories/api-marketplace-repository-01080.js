// 01080 · Production PostgreSQL deployment-aware API adapter.
import {ApiMarketplaceRepository01071} from './api-marketplace-repository-01071.js?v=01082';
export class ApiMarketplaceRepository01080 extends ApiMarketplaceRepository01071{
  constructor(options={}){super(options);this.type='api-postgresql';this.name='ApiMarketplaceRepository01080';}
  async replaceSnapshot(snapshot,{sourceKind='studio-local-migration-01080'}={}){return this._request('/marketplace/snapshot',{method:'PUT',headers:{'x-st-import-source':String(sourceKind||'studio-local-migration-01080').slice(0,80)},body:JSON.stringify(snapshot)});}
  async getDeploymentStatus(){return this._request('/deployment/status');}
  async importLocalOperational(bundle){return this._request('/deployment/import-local-operational',{method:'POST',body:JSON.stringify(bundle||{})});}
}
