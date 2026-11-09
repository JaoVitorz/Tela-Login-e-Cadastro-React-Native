import fs from 'node:fs/promises';
import path from 'node:path';
import { Presentation, PresentationFile } from 'file:///C:/Users/Alunos/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
import { finalizePresentation } from 'file:///C:/Users/Alunos/.codex/plugins/cache/openai-primary-runtime/presentations/26.1015.12040/skills/presentations/container_tools/artifact_tool_utils.mjs';

const root='C:/Users/Alunos/Desktop/PI';
const build=root+'/.presentation-build';
const skill='C:/Users/Alunos/.codex/plugins/cache/openai-primary-runtime/presentations/26.1015.12040/skills/presentations';
const p=Presentation.create({slideSize:{width:1280,height:720}});
const green='#14542F', ink='#20352B', muted='#53675C', paper='#F4F8F3';
const back='C:/Users/Alunos/Documents/GitHub/Pet-Joyful-Backend/';
const sources={
 baseline:'Backend histórico: commit 57448bc31b2c1da13364e8aed6e8649dc1fa7e66, anterior ao rate limiting. Mobile histórico: 2f86fa4134f4b66e50c916574aba5158e5b361a4, anterior à integração MFA. As duas bases têm datas diferentes e servem a comparações específicas.',
 current:'Mobile atual: commit adab43e e arquivos de C:/Users/Alunos/Desktop/PI. Backend atual: HEAD 6fac990 e árvore de trabalho local inspecionada em '+back+'. Não equivale a comprovação de publicação em produção.',
 plan:'Planejamento: C:/Users/Alunos/Downloads/PLANEJAMENTO_SEGURANCA_PetJoyful.xlsx, 29/09/2026. Resumo Executivo, Matriz de Riscos e Checklist. Percentuais 33%, 60% e 80% são valores do planejamento, sem medição independente.',
 shots:'Print real do frontend React Native/Expo na versão web em http://localhost:8081, viewport 390 × 844, capturado em 19/10/2026. Não é captura de emulador Android/iOS.'
};
function txt(s,text,x,y,w,h,size=26,color=ink,bold=false){const a=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=text;a.text.style={typeface:'Arial',fontSize:size,color,bold};return a;}
function slide(title,notes=''){let s=p.slides.add();s.background.fill=paper;txt(s,title,62,42,1156,100,43,green,true);txt(s,String(p.slides.items.length).padStart(2,'0'),1174,666,50,25,16,muted);s.speakerNotes.text=notes;return s;}
function para(s,heading,body,y,x=64,w=1110){txt(s,heading,x,y,w,38,29,green,true);txt(s,body,x,y+46,w,110,25,ink);}
function comparison(title,before,now,notes,foot=''){let s=slide(title,notes);txt(s,'ANTES',64,164,520,38,26,muted,true);txt(s,'AGORA',660,164,520,38,26,green,true);txt(s,before,64,226,510,350,28);txt(s,now,660,226,540,350,28);if(foot)txt(s,foot,64,605,1120,52,20,muted);return s;}
async function shot(s,file,x=896,y=138,h=522){let b=await fs.readFile(build+'/shots/'+file);s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/jpeg',alt:'Print real do frontend mobile PetJoyful: '+file,fit:'contain',position:{left:x,top:y,width:h*390/844,height:h}});}
async function screen(title,before,now,file,notes,extra=''){let s=slide(title,notes+'\n'+sources.shots);txt(s,'ANTES',64,156,720,35,24,muted,true);txt(s,before,64,203,720,128,27);txt(s,'AGORA',64,347,720,35,24,green,true);txt(s,now,64,394,720,170,27);if(extra)txt(s,extra,64,590,720,56,20,muted);await shot(s,file);return s;}
function tableSlide(title,rows,notes){let s=slide(title,notes);const t=s.tables.add({rows:rows.length,columns:3,left:64,top:160,width:1150,height:440,columnWidths:[255,390,505],values:rows});t.borders.assign({fill:'#D2DED3',width:1});for(let r=0;r<rows.length;r++){t.rows[r].height=r===0?55:77;for(let c=0;c<3;c++){let cell=t.getCell(r,c);cell.fill=r===0?green:(r%2?'#FFFFFF':'#EAF1E8');cell.text.style={typeface:'Arial',fontSize:r===0?23:22,color:r===0?'#FFFFFF':ink,bold:r===0};}}return s;}

let s=p.slides.add();s.background.fill=green;txt(s,'PetJoyful',64,66,720,70,48,'#FFFFFF',true);txt(s,'Segurança\nantes e agora',64,220,740,190,67,'#FFFFFF',true);txt(s,'Backend e frontend mobile',64,454,720,50,31,'#D8F0DC');txt(s,'Comparação técnica com prints atuais\n19 de outubro de 2026',64,575,730,70,23,'#D8F0DC');s.speakerNotes.text=sources.baseline+'\n'+sources.current+'\n'+sources.shots;await shot(s,'home-atual.jpg',921,72,576);

s=slide('O que o sistema já tinha',sources.baseline+'\nArquivos históricos: backend/src/models/userModel.ts, controllers/authController.ts, app.ts. Mobile: src/services/tokenStorage.ts e componentes de sessão.');
para(s,'Produto já funcional','Login e cadastro, perfil, publicações e eventos já faziam parte do aplicativo.',156);
para(s,'Proteções anteriores','O backend já usava bcrypt para senhas, JWT com expiração em 7 dias, CORS e logs de requisições.',322);
para(s,'Proteção no dispositivo','O mobile já usava SecureStore no nativo e localStorage na web. O guard anterior verificava a presença local do token.',488);

tableSlide('Comparação geral de segurança',[
 ['Área','Antes','Agora'],
 ['Acesso','E-mail e senha','Segundo fator opcional com TOTP e recuperação'],
 ['Sessão mobile','Presença do token local','Formato do token e consulta ao backend'],
 ['Tentativas','Sem limiter na base antiga','Limites de login e de API, com HTTP 429'],
 ['HTTP','CORS e Express','Helmet com política de conteúdo e proteção de frames'],
 ['Dados do titular','Exclusão simples da conta','Exportação e tratamento de dados vinculados']
],sources.baseline+'\n'+sources.current+'\nFontes: app.ts, authRoutes.ts, userRoutes.ts, rateLimiter.ts, userDataService.ts e SessionGuard.tsx.');

comparison('Limites contra tentativas em excesso','Na base anterior ao rate limiting, o login não tinha middleware para limitar requisições.\n\nA autenticação dependia de e-mail e senha corretos.','Login: 5 requisições por IP a cada 15 minutos.\n\nAPI: 30 requisições por IP por minuto nas rotas cobertas.\n\nExcesso recebe HTTP 429.',sources.baseline+'\n'+back+'backend/src/middlewares/rateLimiter.ts, routes/authRoutes.ts, app.ts. O limiter global é montado após /api/chat e rotas de demonstração, logo não cobre literalmente toda a API.','Os contadores usam memória da instância. A cobertura depende da ordem das rotas.');

comparison('Cabeçalhos de segurança com Helmet','O app Express já aplicava CORS, mas a versão histórica não incluía Helmet.\n\nCORS definia quais origens podiam acessar a API pelo navegador.','Helmet entra como middleware global.\n\nCSP restringe origens de conteúdo e bloqueia objetos.\n\nFrames ficam limitados à mesma origem.',sources.baseline+'\n'+back+'backend/src/app.ts e test/integration/securityHeaders.spec.ts. Commit e8c83d3.','CORS e Helmet cumprem funções diferentes. Nenhum deles substitui autenticação.');

await screen('MFA na tela de segurança','Não havia página para ativar ou gerenciar um autenticador no mobile.','O usuário pode configurar TOTP, confirmar a ativação e gerenciar a proteção da conta.\n\nO print mostra o MFA disponível, ainda desativado nesta conta.','mfa-atual.jpg',root+'/src/app/seguranca.tsx, src/services/api.ts. Histórico anterior: commit 2f86fa4.','A captura não alterou a senha nem ativou ou desativou o MFA.');

comparison('Login com uma segunda etapa','O mobile recebia { token, user }, salvava o token e abria a área autenticada.\n\nNão havia tratamento do desafio MFA.','Quando MFA está ativo, a senha correta gera um desafio de 5 minutos.\n\nO app pede código TOTP ou de recuperação.\n\nSó cria a sessão depois da confirmação.',sources.baseline+'\n'+root+'/src/app/index.tsx, services/api.ts. Backend: services/mfaService.ts e controllers/mfaController.ts.','Contas sem MFA mantêm o login por e-mail e senha. O desafio não serve como token de acesso.');

s=slide('MFA no backend',back+'backend/src/services/mfaService.ts, controllers/mfaController.ts, models/userModel.ts e docs/MFA_TOTP.md.');
para(s,'Segredo protegido','O servidor cifra o segredo TOTP com AES-256-GCM. A configuração depende da chave MFA_ENCRYPTION_KEY.',154);
para(s,'Recuperação sem reutilização','Gera 10 códigos aleatórios, armazena seus hashes e consome cada código em uma operação atômica.',320);
para(s,'Tentativas e revogação','Cinco falhas de segundo fator bloqueiam novas tentativas por 15 minutos. Mudanças no MFA incrementam authVersion e invalidam sessões anteriores.',486);

comparison('Validação de sessão no mobile','O guard verificava se existia um token no armazenamento.\n\nO armazenamento aceitava valores sem validar o formato.','O armazenamento recusa tokens malformados.\n\nO guard consulta GET /api/auth/session.\n\nUma resposta 401 antiga não apaga um token renovado pelo MFA.',sources.baseline+'\n'+root+'/src/components/SessionGuard.tsx, services/tokenStorage.ts e services/api.ts. A regex checa formato, não assinatura. A assinatura e o estado da conta são verificados pelo backend.','A consulta ao servidor valida a sessão. A checagem de formato local, sozinha, não valida um JWT.');

await screen('Cadastro alinhado ao backend','O formulário distinguia documentos por categoria, com campos que o backend não persistia como verificação profissional.','Agora solicita CPF válido, inclusive o CPF do responsável pela ONG.\n\nA tela informa que a conta não comprova habilitação profissional.','cadastro-ong-atual.jpg',root+'/src/app/signup.tsx, schema/registroschema.ts, services/api.ts. Backend: services/cpfService.ts e models/userModel.ts.','ONG e veterinário continuam mapeados para cliente no backend. CPF válido não comprova identidade.');

await screen('Novos acessos no menu da conta','O perfil já permitia editar dados, sair e excluir a conta. Não havia o conjunto atual de páginas de segurança e suporte.','O menu passa a reunir Segurança e MFA, FAQ, Políticas e normas e Privacidade e LGPD.\n\nA exclusão continua disponível.','menu-atual.jpg',sources.baseline+'\n'+root+'/src/app/(tabs)/perfil-profissional.tsx e app/_layout.tsx.');

await screen('Privacidade dentro do aplicativo','O mobile não oferecia esta página dedicada a explicar os dados utilizados e as opções da conta.','A página descreve cadastro, perfil, armazenamento de sessão e caminhos para consultar, corrigir e excluir dados.','privacidade-atual.jpg',root+'/src/app/privacidade.tsx e README.md.','Ainda faltam informações do controlador, canal de privacidade, bases legais e retenção para uma política definitiva.');

s=slide('FAQ e políticas na experiência mobile',root+'/src/app/faq.tsx e app/politicas.tsx.\n'+sources.shots);txt(s,'ANTES',64,157,530,38,24,muted,true);txt(s,'Não havia estas páginas de suporte no aplicativo.',64,206,530,104,28);txt(s,'AGORA',64,352,530,38,24,green,true);txt(s,'FAQ orienta sobre sessão, MFA e recuperação.\n\nAs políticas apresentam regras de convivência e cuidados com a conta.',64,399,530,220,28);await shot(s,'faq-atual.jpg',658,146,510);await shot(s,'politicas-atual.jpg',955,146,510);

comparison('Exportação e exclusão no backend','A exclusão histórica removia o documento da conta.\n\nA versão consultada não tinha o serviço atual de exportação e tratamento dos registros vinculados.','GET /api/users/:id/data-export reúne dados da própria conta.\n\nA exclusão trata comentários, denúncias, publicações e mídias vinculadas.\n\nBloqueia a conta durante o processo.',sources.baseline+'\n'+back+'backend/src/services/userDataService.ts, controllers/userController.ts, routes/userRoutes.ts.','O mobile tem exclusão de conta, mas ainda não oferece botão de exportação. Backups e registros antigos exigem tratamento adicional.');

tableSlide('Planejamento e implementação: acesso',[
 ['Item da planilha','Evidência atual','Situação'],
 ['Rate limiting','Login 5/15 min e API 30/min','Implementado nas rotas cobertas'],
 ['Validação backend','CPF e verificações em auth/MFA','Parcial. Sem validators em todas as rotas'],
 ['Helmet','Middleware global no app.ts','Implementado no código consultado'],
 ['RBAC','ensureAdminKey ainda aceita chave','Plano ainda não substituiu a chave por RBAC'],
 ['Auditoria','Logs HTTP, login e eventos MFA','Parcial. Sem coleção AuditLog identificada']
],sources.plan+'\n'+sources.current+'\nArquivos: middlewares/rateLimiter.ts, ensureAdminKey.ts, requestLogger.ts, app.ts, controllers/authController.ts e mfaController.ts.');

tableSlide('Planejamento e implementação: dados',[
 ['Item da planilha','Evidência atual','Situação'],
 ['LGPD','Exportação e exclusão ampliada','Backend implementa os fluxos. Política incompleta'],
 ['Refresh token','JWT de acesso expira em 7 dias','Sem fluxo de refresh identificado'],
 ['Confirmação de e-mail','Há commits históricos do tema','Não identificada no fluxo atual de cadastro'],
 ['Cifrar CPF/CNPJ','CPF é string com select:false','CPF não aparece cifrado no modelo consultado'],
 ['Versionamento de dados','timestamps e authVersion','Não equivale ao histórico completo planejado']
],sources.plan+'\n'+back+'backend/src/models/userModel.ts, controllers/authController.ts, services/mfaService.ts. select:false reduz exposição em consultas, mas não cifra dados em repouso. authVersion versiona autenticação.');

s=slide('Disponibilidade e limites do plano',sources.plan+'\n'+sources.current+'\nFontes: backend/src/app.ts e mobile src/services/api.ts.');
para(s,'Health check','Existe uma resposta na rota raiz da API. Não identifiquei um endpoint /health que verifique banco e dependências.',156);
para(s,'Cold start','O cliente aguarda até 45 segundos e mostra mensagens de timeout. Isso não comprova retry com espera exponencial.',322);
para(s,'Percentuais do planejamento','33%, 60% e 80% são valores da planilha. O checklist não registra conclusão e não sustenta um score atual de segurança.',488);

s=slide('O que a comparação comprova',sources.baseline+'\n'+sources.current+'\n'+sources.shots+'\nValidação local executada em 19/10/2026: npm run test:auth, 14 testes aprovados, e tsc --noEmit sem erros. Os testes isolam rede e armazenamento e não comprovam o fluxo de produção.');
para(s,'Evolução implementada','MFA integrado ao mobile e ao backend, sessão validada no servidor, limites de requisições, Helmet e fluxos de dados mais completos.',154);
para(s,'Evidências verificadas','Prints reais do mobile web, comparação de código histórico e 14 testes locais de autenticação aprovados.',320);
para(s,'Escopo da conclusão','Os estados antigos das telas foram descritos pelo histórico, sem prints antigos. A ativação real do MFA e a publicação de todos os serviços ainda precisam de validação ponta a ponta.',486);

await fs.mkdir(build+'/renders',{recursive:true});
await (await PresentationFile.exportPptx(p)).save(build+'/candidate.pptx');
for(let i=0;i<p.slides.items.length;i++){const b=await p.export({slide:p.slides.items[i],format:'png',scale:1});await fs.writeFile(build+'/renders/slide-'+String(i+1).padStart(2,'0')+'.png',new Uint8Array(await b.arrayBuffer()));}
console.log('Rendered '+p.slides.items.length+' slides');
const result=await finalizePresentation({workspaceDir:root,candidatePath:build+'/candidate.pptx',finalPath:root+'/outputs/apresentacao-petjoyful/PetJoyful_Antes_e_Agora.pptx',pythonExecutable:'C:/Users/Alunos/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:skill+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:skill+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit','--require-native-table-slide','3','--require-native-table-slide','15','--require-native-table-slide','16'],fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,requiredNativeTableOwnerSlides:[3,15,16],receiptPath:build+'/validation.json'});
console.log(JSON.stringify(result));


