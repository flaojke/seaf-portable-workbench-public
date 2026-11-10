import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
const here=path.dirname(fileURLToPath(import.meta.url));
const client=new Client({name:'seaf-demo',version:'1.0.0'});
async function call(name,args){const r=await client.callTool({name,arguments:args});if(r.isError)throw Error(r.content[0].text);return JSON.parse(r.content[0].text);}
try{
 await client.connect(new StdioClientTransport({command:process.execPath,args:[path.join(here,'server.mjs')],stderr:'inherit'}));
 const doc=await call('read_artifact',{project:'shopflow',path:'docs.yaml'});
 const content=`# Работа с ShopFlow через MCP\n\nВнешний агент подключается к серверу seaf. Проект: shopflow.\n\nПримеры запросов:\n\n- Какие сервисы участвуют в оформлении заказа? Приведи файлы-источники.\n- Найди зависимости Order Service.\n- Добавь сервис доставки и покажи diff перед применением.\n\nПорядок работы: прочитать модель и исходные файлы, подготовить propose_change или propose_entity, изучить diff, выполнить validate_change, затем apply_change.\n\nИзменения проверяются отдельным экземпляром SEAF, сохраняются локальным Git-коммитом и загружаются в портал. Git push не выполняется. После изменения обновите страницу.\n\nНовые файлы необходимо включать в imports. SmartAnts строится из YAML; Mermaid-сценарии обновляются отдельными изменениями в том же предложении.\n\nНастройки проектов: ./seaf-mcp/projects.json. Инструкция: ./seaf-mcp/README.md.\n`;
 const proposal=await call('propose_change',{project:'shopflow',message:'Document MCP architecture workflow',changes:[{path:'docs/agent-workflow.md',content},{path:'docs.yaml',content:doc.content+'\n  demo.shop.agent:\n    title: Работа через MCP\n    location: ShopFlow/06. Работа через MCP\n    type: markdown\n    source: docs/agent-workflow.md\n'}]});
 const validation=await call('validate_change',{proposal_id:proposal.proposalId});if(!validation.ok)throw Error(JSON.stringify(validation));
 const applied=await call('apply_change',{proposal_id:proposal.proposalId});
 await fs.writeFile(path.join(here,'demo-result.json'),JSON.stringify({proposal:proposal.proposalId,validation,applied},null,2));console.log(JSON.stringify(applied));
}finally{await client.close();}
