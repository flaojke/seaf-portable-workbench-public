import path from'node:path';import{fileURLToPath}from'node:url';
import{Client}from'../../seaf-mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import{StdioClientTransport}from'../../seaf-mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),client=new Client({name:'repository-layout-inventory',version:'1.0.0'});
try{await client.connect(new StdioClientTransport({command:process.execPath,args:[path.join(root,'seaf-mcp/server.mjs')],stderr:'pipe'}));const result=await client.callTool({name:'list_projects',arguments:{}});if(result.isError)throw Error(result.content[0].text);const projects=JSON.parse(result.content[0].text);console.log(JSON.stringify(projects.map(({id,title,writable,manifest})=>({id,title,writable,manifest})),null,2));}finally{await client.close();}
