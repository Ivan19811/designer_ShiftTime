// 01092 · Storage-neutral contract used by Tables Studio and TableStore.
export const TABLE_REPOSITORY_METHODS_01092=Object.freeze([
  'listTables','getTable','createTable','updateTable','deleteTable',
  'createField','updateField','deleteField','createRecord','updateRecord','deleteRecord','updateView'
]);

export function assertTableRepository01092(repository){
  if(!repository||typeof repository!=='object')throw new Error('TableRepository is required');
  const missing=TABLE_REPOSITORY_METHODS_01092.filter(name=>typeof repository[name]!=='function');
  if(missing.length)throw new Error(`TableRepository contract is incomplete: ${missing.join(', ')}`);
  return repository;
}

