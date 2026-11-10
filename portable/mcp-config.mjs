import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath}from'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(process.argv[2]||path.join(here,'..'));
const node=path.join(root,'runtime/node/node.exe'),server=path.join(root,'portable/mcp.mjs');
await fs.access(node);await fs.access(server);
const config={mcpServers:{seaf:{command:node,args:[server],env:{SEAF_PORTABLE_ROOT:root,SEAF_PROJECTS_CONFIG:path.join(root,'data/projects.json'),SEAF_MCP_STATE:path.join(root,'data/state'),SEAF_SPEC_ROOT:path.join(root,'openspec'),SEAF_GIT:path.join(root,'runtime/git/cmd/git.exe')}}}};
const target=path.join(root,'data/mcp.config.json');await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,JSON.stringify(config,null,2)+'\n');console.log(target);
