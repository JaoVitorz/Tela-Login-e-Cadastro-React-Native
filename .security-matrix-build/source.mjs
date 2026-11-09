import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile,FileBlob} from '@oai/artifact-tool';
const w=await SpreadsheetFile.importXlsx(await FileBlob.load('C:/Users/Alunos/Downloads/PLANEJAMENTO_SEGURANCA_PetJoyful.xlsx'));
console.log((await w.inspect({kind:'sheet',include:'id,name',maxChars:2500})).ndjson);
const b=await w.render({sheetName:'Matriz de Riscos',range:'A1:G6',scale:1,format:'png'});
await fs.writeFile('C:/Users/Alunos/Desktop/PI/.security-matrix-build/original.png',new Uint8Array(await b.arrayBuffer()));
