const CRC_TABLE=(()=>{
  const table=new Uint32Array(256);
  for(let n=0;n<256;n+=1){let c=n;for(let k=0;k<8;k+=1)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);table[n]=c>>>0;}
  return table;
})();

function crc32(buffer){let c=0xffffffff;for(const byte of buffer)c=CRC_TABLE[(c^byte)&0xff]^(c>>>8);return (c^0xffffffff)>>>0;}
function cleanPath(value){return String(value||'').replace(/\\/g,'/').replace(/^\/+/, '').replace(/\/+/g,'/');}
function u16(value){const b=Buffer.allocUnsafe(2);b.writeUInt16LE(value&0xffff,0);return b;}
function u32(value){const b=Buffer.allocUnsafe(4);b.writeUInt32LE(value>>>0,0);return b;}
const DOS_TIME=0;
const DOS_DATE=33; // 1980-01-01

export function createZip01143(input){
  const entries=(input instanceof Map?[...input.entries()]:Object.entries(input||{}))
    .map(([name,value])=>[cleanPath(name),Buffer.isBuffer(value)?value:Buffer.from(String(value??''))])
    .filter(([name])=>!!name)
    .sort((a,b)=>a[0].localeCompare(b[0]));
  const locals=[];const centrals=[];let offset=0;
  for(const [name,data] of entries){
    const nameBuf=Buffer.from(name,'utf8'),crc=crc32(data),size=data.length;
    const local=Buffer.concat([
      u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(DOS_TIME),u16(DOS_DATE),u32(crc),u32(size),u32(size),u16(nameBuf.length),u16(0),nameBuf,data,
    ]);
    locals.push(local);
    const central=Buffer.concat([
      u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(DOS_TIME),u16(DOS_DATE),u32(crc),u32(size),u32(size),
      u16(nameBuf.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nameBuf,
    ]);
    centrals.push(central);offset+=local.length;
  }
  const centralDirectory=Buffer.concat(centrals),localData=Buffer.concat(locals);
  const eocd=Buffer.concat([
    u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(centralDirectory.length),u32(localData.length),u16(0),
  ]);
  return Buffer.concat([localData,centralDirectory,eocd]);
}

export function listZipEntries01143(buffer){
  const buf=Buffer.isBuffer(buffer)?buffer:Buffer.from(buffer||[]),out=[];
  let offset=0;
  while(offset+46<=buf.length){
    const sig=buf.readUInt32LE(offset);
    if(sig===0x02014b50){
      const nameLen=buf.readUInt16LE(offset+28),extraLen=buf.readUInt16LE(offset+30),commentLen=buf.readUInt16LE(offset+32);
      out.push(buf.subarray(offset+46,offset+46+nameLen).toString('utf8'));
      offset+=46+nameLen+extraLen+commentLen;continue;
    }
    offset+=1;
  }
  return out.sort((a,b)=>a.localeCompare(b));
}
