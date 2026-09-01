// 01092 · Tables Studio state authority. UI never talks to storage directly.
import {assertTableRepository01092} from '../repositories/table-repository-contract-01092.js?v=01092';

const clone=v=>{try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}};
export class TableStore01092{
  constructor(repository){this.repository=assertTableRepository01092(repository);this.state={tables:[],activeTableId:'',bundle:null,loading:false,error:'',revision:0};this.listeners=new Set();this._write=Promise.resolve();}
  getState(){return clone(this.state);}
  getRepositoryInfo(){return {type:this.repository.type||'unknown',name:this.repository.name||this.repository.constructor?.name||'TableRepository'};}
  subscribe(listener){if(typeof listener!=='function')return()=>{};this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  _emit(reason){this.state.revision+=1;const detail={reason,state:this.getState(),repository:this.getRepositoryInfo()};for(const listener of this.listeners)try{listener(detail);}catch{};try{window.dispatchEvent(new CustomEvent('st:tables-store-changed',{detail}));}catch{}}
  _busy(value,error=''){this.state.loading=value;this.state.error=error;this._emit(value?'loading':'settled');}
  _queue(task){const run=this._write.then(task);this._write=run.then(()=>undefined,()=>undefined);return run;}
  async setRepository(repository,{refresh=true}={}){this.repository=assertTableRepository01092(repository);this.state.bundle=null;this.state.activeTableId='';this._emit('repository');if(refresh)await this.refresh();return this.getRepositoryInfo();}
  async refresh(){this._busy(true);try{this.state.tables=await this.repository.listTables();if(this.state.activeTableId&&!this.state.tables.some(x=>x.id===this.state.activeTableId)){this.state.activeTableId='';this.state.bundle=null;}if(!this.state.activeTableId&&this.state.tables.length)this.state.activeTableId=this.state.tables[0].id;if(this.state.activeTableId)this.state.bundle=await this.repository.getTable(this.state.activeTableId);this._busy(false);this._emit('refresh');return this.getState();}catch(error){this._busy(false,error.message||String(error));throw error;}}
  async openTable(id){this._busy(true);try{const bundle=await this.repository.getTable(id);if(!bundle)throw new Error('Таблицю не знайдено');this.state.activeTableId=id;this.state.bundle=bundle;this._busy(false);this._emit('open-table');return clone(bundle);}catch(error){this._busy(false,error.message||String(error));throw error;}}
  async createTable(definition){return this._queue(async()=>{this._busy(true);try{const bundle=await this.repository.createTable(definition);const normalized=bundle?.table?bundle:await this.repository.getTable(bundle?.id||definition.id);this.state.activeTableId=normalized.table.id;this.state.bundle=normalized;this.state.tables=await this.repository.listTables();this._busy(false);this._emit('create-table');return clone(normalized);}catch(error){this._busy(false,error.message||String(error));throw error;}});}
  async updateTable(patch){return this._mutate('update-table',()=>this.repository.updateTable(this.state.activeTableId,patch));}
  async deleteTable(){return this._queue(async()=>{if(!this.state.activeTableId)return false;await this.repository.deleteTable(this.state.activeTableId);this.state.activeTableId='';this.state.bundle=null;await this.refresh();this._emit('delete-table');return true;});}
  async createField(input){return this._mutate('create-field',()=>this.repository.createField(this.state.activeTableId,input));}
  async updateField(id,patch){return this._mutate('update-field',()=>this.repository.updateField(this.state.activeTableId,id,patch));}
  async deleteField(id){return this._mutate('delete-field',()=>this.repository.deleteField(this.state.activeTableId,id));}
  async createRecord(values={}){return this._mutate('create-record',()=>this.repository.createRecord(this.state.activeTableId,{values}));}
  async updateRecord(id,patch){return this._mutate('update-record',()=>this.repository.updateRecord(this.state.activeTableId,id,patch));}
  async deleteRecord(id){return this._mutate('delete-record',()=>this.repository.deleteRecord(this.state.activeTableId,id));}
  async updateView(id,patch){return this._mutate('update-view',()=>this.repository.updateView(this.state.activeTableId,id,patch));}
  async _mutate(reason,task){return this._queue(async()=>{if(!this.state.activeTableId)throw new Error('Спочатку відкрийте таблицю');this._busy(true);try{const value=await task();this.state.bundle=await this.repository.getTable(this.state.activeTableId);this.state.tables=await this.repository.listTables();this._busy(false);this._emit(reason);return clone(value);}catch(error){this._busy(false,error.message||String(error));throw error;}});}
}
