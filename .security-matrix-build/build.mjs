import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const dir='C:/Users/Alunos/Desktop/PI/.security-matrix-build';
const out='C:/Users/Alunos/Desktop/PI/outputs/matriz-seguranca';
const wb=Workbook.create();
const resumo=wb.worksheets.add('Resumo');
const matrix=wb.worksheets.add('Matriz de Riscos');
const checks=wb.worksheets.add('Checklist');
const green='#14542F', light='#EAF4EB', ink='#24382C', amber='#FFF2CC';
const statuses=['Implementado','Parcial','Não identificado'];
const rows=[
 [1,'Brute force no login','MUITO PROVÁVEL','MUITO ALTO','Base antiga sem limitador de requisições.','Login: 5/IP em 15 min. API: 30/IP por minuto nas rotas cobertas. HTTP 429.','Implementado','Contadores em memória. Algumas rotas ficam antes do limiter global.','Revisar cobertura e armazenamento compartilhado ao escalar.','','','Não validado','Alta','backend/src/middlewares/rateLimiter.ts; routes/authRoutes.ts; app.ts','Código atual do backend e histórico 57448bc'],
 [2,'Direitos e transparência LGPD','MUITO PROVÁVEL','MUITO ALTO','Exclusão simples da conta, sem o serviço atual de exportação e tratamento vinculado.','Exporta dados da própria conta. Exclusão trata comentários, denúncias, posts e mídias. Mobile tem página de privacidade.','Parcial','Mobile sem exportação. Política, backups e registros antigos exigem complementação.','Completar política, oferecer exportação no mobile e validar exclusão entre serviços.','','','Não validado','Alta','backend/src/services/userDataService.ts; routes/userRoutes.ts; mobile/src/app/privacidade.tsx','Código backend/mobile; planilha original, risco 2'],
 [3,'Validação insuficiente no backend','PROVÁVEL','MUITO ALTO','Validações pontuais de presença de campos. Não havia a proteção atual de CPF e MFA.','Valida CPF por dígitos verificadores e entradas de login/MFA.','Parcial','Não identifiquei validação abrangente de todas as rotas. CPF válido não comprova identidade.','Padronizar schemas de entrada, tipos, limites e testes de payloads inesperados.','','','Não validado','Alta','backend/src/services/cpfService.ts; controllers/authController.ts; controllers/mfaController.ts','Código atual do backend; planilha original, risco 3'],
 [4,'Chave administrativa e autorização','PROVÁVEL','MUITO ALTO','Administração apoiada em chave estática.','ensureAdminKey continua aceitando x-admin-key ou admin_key na query.','Não identificado','A substituição da chave por RBAC não foi identificada.','Implementar autorização por papel e remover chave em query string.','','','Não validado','Alta','backend/src/middlewares/ensureAdminKey.ts; routes/userRoutes.ts','Código atual do backend; planilha original, risco 4'],
 [5,'Rastreabilidade e auditoria','MUITO PROVÁVEL','ALTO','Já existiam logs HTTP e de login. A descrição original de ausência total de logs não se confirma.','Logs de requisições, respostas e eventos MFA.','Parcial','Não identifiquei coleção AuditLog, política de retenção ou trilha completa de alterações.','Definir eventos, acesso e retenção dos logs e implementar trilha de auditoria.','','','Não validado','Alta','backend/src/middlewares/requestLogger.ts; controllers/authController.ts; controllers/mfaController.ts','Código atual e histórico do backend; planilha original, risco 5'],
 [6,'Ausência de refresh token','PROVÁVEL','ALTO','JWT já expirava em 7 dias. A afirmação original de token sem expiração não se confirma.','JWT de acesso continua com validade de 7 dias. MFA acrescenta authVersion para revogar sessões.','Não identificado','Não identifiquei refresh token com rotação e revogação.','Projetar access token curto e refresh token com rotação, revogação e armazenamento adequado.','','','Não validado','Alta','backend/src/services/mfaService.ts; histórico controllers/authController.ts','Código atual e histórico do backend; planilha original, risco 6'],
 [7,'Confirmação de e-mail','PROVÁVEL','ALTO','Planejamento previa confirmação do endereço no cadastro.','Há commits históricos sobre confirmação, mas o fluxo atual consultado não a demonstra.','Não identificado','Titularidade do endereço não comprovada pelo fluxo atual.','Reconciliar a implementação histórica e testar cadastro, expiração e reenvio do link.','','','Não validado','Média','backend/src/controllers/authController.ts; routes/authRoutes.ts; git log','Código atual do backend e histórico de commits; risco 7'],
 [8,'Proteção do CPF em repouso','POSSÍVEL','ALTO','Planejamento previa cifrar CPF/CNPJ/CRMV.','CPF usa select:false e exclusão no toJSON. Segredo TOTP, separadamente, usa AES-256-GCM.','Não identificado','CPF permanece string no modelo. Ocultar em consultas não equivale a cifrar.','Definir necessidade de retenção e proteção do CPF, busca segura e gestão de chaves.','','','Não validado','Alta','backend/src/models/userModel.ts; services/mfaService.ts','Código atual do backend; planilha original, risco 8'],
 [9,'Cabeçalhos de segurança HTTP','POSSÍVEL','ALTO','A base antiga tinha CORS, mas não incluía Helmet.','Helmet global, CSP, object-src none e proteção de frames sameorigin.','Implementado','Cabeçalhos dependem de publicação e compatibilidade com Swagger e demais consumidores.','Validar headers no ambiente publicado e revisar exceções da CSP.','','','Não validado','Média','backend/src/app.ts; test/integration/securityHeaders.spec.ts','Código atual do backend; commit e8c83d3; risco 9'],
 [10,'Histórico de alterações dos dados','POSSÍVEL','MÉDIO','Sem o histórico completo proposto na planilha.','Schemas têm timestamps. authVersion controla a versão de autenticação.','Parcial','timestamps e authVersion não equivalem a version/modifiedBy nem ao histórico das alterações.','Definir registros que precisam de versionamento e autoria da mudança.','','','Não validado','Média','backend/src/models/userModel.ts; services/mfaService.ts','Código atual do backend; planilha original, risco 10'],
 [11,'Monitoramento de disponibilidade','IMPROVÁVEL','MÉDIO','A base já tinha resposta de funcionamento na rota raiz.','GET / retorna mensagem de API em funcionamento.','Parcial','Não identifiquei /health que avalie banco e dependências.','Implementar liveness/readiness e monitorar falhas de banco e serviços.','','','Não validado','Média','backend/src/app.ts','Código atual e histórico do backend; planilha original, risco 11'],
 [12,'Falha no primeiro acesso / cold start','POSSÍVEL','MÉDIO','Planejamento previa retry com espera exponencial.','Cliente tem timeout de 45 s e mensagens de rede/cold start.','Parcial','Timeout maior não implementa retry com backoff.','Aplicar retry limitado em operações seguras e impedir duplicação de escritas.','','','Não validado','Média','mobile/src/services/api.ts','Código atual do mobile; planilha original, risco 12'],
 [13,'Comprometimento por senha e recuperação MFA','Não avaliada','Não avaliado','Login mobile tratava somente token e usuário, sem etapa MFA.','TOTP opcional, desafio de 5 min, segredo cifrado, recuperação por hash e bloqueio de falhas.','Implementado','A conta capturada estava com MFA desativado. Implantação e chave precisam de validação.','Validar ativação, login, recuperação, bloqueio e revogação ponta a ponta.','','','Não validado','Alta','backend/src/services/mfaService.ts; controllers/mfaController.ts; mobile/src/app/seguranca.tsx; app/index.tsx','Código atual backend/mobile; novo risco incluído na revisão'],
 [14,'Sessão inválida aceita no mobile','Não avaliada','Não avaliado','Guard verificava presença do token no armazenamento local.','Checa formato do JWT, consulta /auth/session e trata respostas antigas sem apagar token renovado.','Implementado','Regex não valida assinatura. Sessão e serviços precisam permanecer coerentes.','Validar conta excluída, token expirado, sessão revogada e falha de rede entre serviços.','','','Não validado','Alta','mobile/src/services/tokenStorage.ts; components/SessionGuard.tsx; services/api.ts; backend/src/middlewares/verifyToken.ts','Código atual backend/mobile e testes locais; novo risco da revisão']
];
function base(s,range){s.showGridLines=false;s.getRange(range).format.font={name:'Arial',size:11,color:ink};s.getRange(range).format.verticalAlignment='center';}
function title(s,text){s.getRange('A2').values=[[text]];s.getRange('A2').format.font={name:'Arial',size:17,bold:true,color:green};s.getRange('A2:M2').format.rowHeight=28;}
function head(s,r){s.getRange(r).format={fill:green,font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},wrapText:true,horizontalAlignment:'center',verticalAlignment:'center',rowHeight:34};}
base(matrix,'A1:P19');title(matrix,'PETJOYFUL — MATRIZ DE SEGURANÇA');
matrix.getRange('A3').values=[['Revisão de 19/10/2026. Status do código separado de validação em produção. Responsável e prazo em amarelo para preencher.']];
const headers=['ID','Risco','Probabilidade inicial¹','Impacto inicial¹','Antes','Controle atual','Status no código','Risco remanescente','Próxima ação','Responsável','Prazo acordado','Produção','Prioridade sugerida'];
matrix.getRange('A5:M5').values=[headers];
matrix.getRange('A6:M19').values=rows.map(r=>r.slice(0,13));
matrix.getRange('O5:P5').values=[['Evidência no repositório²','Origem da comparação']];
matrix.getRange('O6:P19').values=rows.map(r=>r.slice(13));
matrix.tables.add('A5:M19',true,'MatrizSeguranca').style='TableStyleLight1';head(matrix,'A5:M5');head(matrix,'O5:P5');
const widths={A:6,B:29,C:20,D:17,E:48,F:60,G:22,H:56,I:58,J:21,K:18,L:19,M:20,N:3,O:82,P:55};
for(const [c,w]of Object.entries(widths))matrix.getRange(c+'1:'+c+'19').format.columnWidth=w;
matrix.getRange('A6:M19').format.wrapText=true;matrix.getRange('A6:M19').format.rowHeight=76;matrix.getRange('O6:P19').format.wrapText=true;
matrix.getRange('J6:K19').format.fill=amber;matrix.getRange('K6:K205').setNumberFormat('dd/mm/yyyy');
matrix.getRange('G6:G205').dataValidation={rule:{type:'list',values:statuses}};
matrix.getRange('L6:L205').dataValidation={rule:{type:'list',values:['Não validado','Aprovado','Reprovado']}};
matrix.getRange('M6:M205').dataValidation={rule:{type:'list',values:['Alta','Média','Baixa']}};
for(const [text,fill,color] of [['Implementado','#E2F0D9',green],['Parcial','#FFF2CC','#7F6000'],['Não identificado','#FCE4D6','#9C2E17']])matrix.getRange('G6:G205').conditionalFormats.add('containsText',{text,format:{fill,font:{color,bold:true}}});
matrix.getRange('L6:L205').conditionalFormats.add('containsText',{text:'Reprovado',format:{fill:'#FFC7CE',font:{color:'#9C0006',bold:true}}});
matrix.freezePanes.freezeRows(5);matrix.freezePanes.freezeColumns(2);matrix.tabColor=green;

base(resumo,'A1:H34');title(resumo,'PETJOYFUL — REVISÃO DA SEGURANÇA');
resumo.getRange('A4:B4').values=[['Data da revisão',new Date('2026-10-19T12:00:00Z')]];resumo.getRange('B4').setNumberFormat('dd/mm/yyyy');
resumo.getRange('A6:B6').values=[['Situação do código','Quantidade']];head(resumo,'A6:B6');
resumo.getRange('A7:A11').values=[['Implementado'],['Parcial'],['Não identificado'],['Sem status / revisar'],['Total de riscos']];
for(let r=7;r<=9;r++)resumo.getRange('B'+r).formulas=[[`=COUNTIF('Matriz de Riscos'!$G$6:$G$205,A${r})`]];
resumo.getRange('B10').formulas=[['=B11-SUM(B7:B9)']];resumo.getRange('B11').formulas=[["=COUNT('Matriz de Riscos'!$A$6:$A$205)"]];
resumo.getRange('D6:E6').values=[['Validação em produção','Quantidade']];head(resumo,'D6:E6');
resumo.getRange('D7:D10').values=[['Aprovado'],['Reprovado'],['Não validado'],['Sem resultado / revisar']];
for(let r=7;r<=9;r++)resumo.getRange('E'+r).formulas=[[`=COUNTIF('Matriz de Riscos'!$L$6:$L$205,D${r})`]];
resumo.getRange('E10').formulas=[['=B11-SUM(E7:E9)']];
resumo.getRange('A14:B14').values=[['Acompanhamento das ações','Quantidade']];head(resumo,'A14:B14');
resumo.getRange('A15:A17').values=[['Riscos com prioridade alta'],['Sem responsável'],['Sem prazo acordado']];
resumo.getRange('B15').formulas=[["=COUNTIF('Matriz de Riscos'!$M$6:$M$205,\"Alta\")"]];
resumo.getRange('B16').formulas=[["=COUNTBLANK('Matriz de Riscos'!$J$6:$J$205)-COUNTBLANK('Matriz de Riscos'!$A$6:$A$205)"]];
resumo.getRange('B17').formulas=[["=COUNTBLANK('Matriz de Riscos'!$K$6:$K$205)-COUNTBLANK('Matriz de Riscos'!$A$6:$A$205)"]];
resumo.getRange('A20').values=[['Como interpretar e atualizar']];resumo.getRange('A20').format.font={bold:true,color:green,size:13};
const guidance=[
 'Implementado: controle encontrado no código consultado. Não significa risco eliminado nem deploy aprovado.',
 'Parcial: há controle relacionado, mas faltam partes relevantes do objetivo do planejamento.',
 'Não identificado: o controle previsto não foi localizado no fluxo/modelo atual consultado. Requer confirmação do responsável.',
 '¹ Probabilidade e impacto iniciais preservam rótulos da planilha de 29/09/2026. Não são avaliação residual atual.',
 'Prioridades são sugestões desta revisão técnica. Confirmar com a equipe. Datas e responsáveis permanecem em branco.',
 'Não há score atual de segurança: 33%, 60% e 80% eram valores do planejamento, sem método ou medição validada.',
 'Atualize os registros na Matriz e os testes no Checklist. Os totais acompanham até a linha 205. Use um ID numérico único por risco.',
 '² Caminhos backend relativos a C:/Users/Alunos/Documents/GitHub/Pet-Joyful-Backend. Caminhos mobile relativos a C:/Users/Alunos/Desktop/PI, sem o prefixo mobile/.',
 'Fonte original: C:/Users/Alunos/Downloads/PLANEJAMENTO_SEGURANCA_PetJoyful.xlsx — Matriz de Riscos e Checklist.',
 'Base antiga backend: 57448bc. Base antiga mobile: 2f86fa4. Atual: backend HEAD 6fac990 + árvore local; mobile adab43e.',
 'Evidência visual: frontend mobile web em localhost:8081, 390 × 844. A conta capturada estava com MFA desativado.'
];
let noteRow=21;
for(const note of guidance){let line='';for(const word of note.split(' ')){if((line+' '+word).length>115){resumo.getRange('A'+noteRow++).values=[[line]];line=word;}else line+=(line?' ':'')+word;}if(line)resumo.getRange('A'+noteRow++).values=[[line]];noteRow++;}
resumo.getRange('A21:H'+noteRow).format.rowHeight=21;
resumo.getRange('A21:H'+noteRow).format.font={name:'Arial',size:11,color:ink};
resumo.getRange('A1:A34').format.columnWidth=43;resumo.getRange('B1:B34').format.columnWidth=13;resumo.getRange('C1:C34').format.columnWidth=4;resumo.getRange('D1:D34').format.columnWidth=30;resumo.getRange('E1:E34').format.columnWidth=13;resumo.getRange('F1:H34').format.columnWidth=15;
resumo.getRange('B7:B17').setNumberFormat('0');resumo.getRange('E7:E10').setNumberFormat('0');resumo.getRange('A11:B11').format.font.bold=true;
for(const c of ['B10','E8','E10'])resumo.getRange(c).conditionalFormats.add('cellIs',{operator:'greaterThan',formula:0,format:{fill:'#FFC7CE',font:{color:'#9C0006',bold:true}}});
resumo.tabColor=green;

base(checks,'A1:H19');title(checks,'CHECKLIST DE VALIDAÇÃO');checks.getRange('A3').values=[['Resultados locais existentes não comprovam implantação. Testes de produção devem usar contas de demonstração e plano de testes autorizado.']];
checks.getRange('A5:H5').values=[['ID risco','Teste / aceite','Resultado','Evidência / limite','Responsável','Data do teste','Ambiente','Próximo passo']];
const testRows=[
 [1,'Confirmar limite de login, HTTP 429 e recuperação após a janela.','Não executado','Código define 5/IP em 15 min e 30/IP/min.','','','A definir','Testar também múltiplas instâncias e rotas fora do limiter.'],
 [2,'Exportar somente dados próprios e excluir dados vinculados.','Não executado','Rotas e serviço LGPD encontrados. Não executado nesta revisão.','','','A definir','Validar posts, mídias, perfis, falhas parciais e retenção.'],
 [3,'Recusar CPF inválido no cadastro ONG.','Aprovado local','Teste existente executado no mobile: valida CPF do responsável.','','','Local isolado','Ampliar para payloads inesperados no backend.'],
 [4,'Negar rotas administrativas a usuários sem permissão.','Não executado','Middleware atual usa chave administrativa.','','','A definir','Definir RBAC e testar leitura/escrita por papel.'],
 [5,'Rastrear ações críticas sem registrar senhas ou códigos.','Não executado','Logs encontrados. Trilha completa não identificada.','','','A definir','Definir retenção, campos e proteção de acesso.'],
 [6,'Renovar sessão com rotação e rejeitar refresh reutilizado.','Não executado','Fluxo de refresh não identificado.','','','A definir','Implementar fluxo antes de executar este aceite.'],
 [7,'Exigir confirmação e tratar link expirado/reutilizado.','Não executado','Commits históricos não comprovam fluxo atual.','','','A definir','Reconciliar código e configuração de envio.'],
 [8,'Comprovar proteção em repouso e ocultação de CPF no perfil.','Não executado','Modelo usa select:false. Cifragem de CPF não identificada.','','','A definir','Definir solução e validar busca, rotação e minimização.'],
 [9,'Conferir CSP, proteção de frames e demais headers publicados.','Não executado','Há teste de headers no repositório, não executado nesta revisão.','','','A definir','Executar no backend e conferir serviço publicado.'],
 [10,'Identificar versão, autor e horário de uma alteração de dados.','Não executado','timestamps e authVersion são controles distintos.','','','A definir','Implementar histórico conforme necessidade.'],
 [11,'Detectar indisponibilidade do banco e dos serviços dependentes.','Não executado','Rota raiz de funcionamento não valida dependências.','','','A definir','Definir readiness/liveness e alertas.'],
 [12,'Recuperar cold start sem duplicar operações de escrita.','Não executado','Timeout de 45 s. Retry exponencial não identificado.','','','A definir','Testar backoff, limite e idempotência.'],
 [13,'Só criar sessão depois da confirmação do desafio MFA.','Aprovado local','Teste de tela e contrato com rede isolada. 14 testes auth passaram no conjunto.','','','Local isolado','Testar TOTP real, recuperação, bloqueio e revogação em homologação.'],
 [14,'Bloquear ausência de token e preservar sessão renovada.','Aprovado local','Testes existentes de armazenamento, interceptor e SessionGuard.','','','Local isolado','Validar expiração e revogação reais entre microsserviços.']
];
checks.getRange('A6:H19').values=testRows;checks.tables.add('A5:H19',true,'ChecklistSeguranca').style='TableStyleLight1';head(checks,'A5:H5');
checks.getRange('A6:H19').format.wrapText=true;checks.getRange('A6:H19').format.rowHeight=64;
for(const row of [8,18,19])checks.getRange('F'+row).values=[[new Date('2026-10-19T12:00:00Z')]];
for(const[c,w]of Object.entries({A:10,B:60,C:24,D:66,E:22,F:18,G:22,H:66}))checks.getRange(c+'1:'+c+'19').format.columnWidth=w;
checks.getRange('E6:F19').format.fill=amber;checks.getRange('F6:F205').setNumberFormat('dd/mm/yyyy');
checks.getRange('C6:C205').dataValidation={rule:{type:'list',values:['Não executado','Aprovado local','Aprovado homologação','Aprovado produção','Reprovado']}};
checks.getRange('C6:C205').conditionalFormats.add('containsText',{text:'Reprovado',format:{fill:'#FFC7CE',font:{color:'#9C0006',bold:true}}});
checks.freezePanes.freezeRows(5);checks.freezePanes.freezeColumns(1);

wb.recalculate();
console.log((await wb.inspect({kind:'table',range:'Resumo!A6:E17',include:'values,formulas',tableMaxRows:12,tableMaxCols:5,maxChars:5000})).ndjson);
console.log('Initial summary',JSON.stringify(resumo.getRange('B7:B11').values),JSON.stringify(resumo.getRange('B15:B17').values));
// Prova de dependência: alterar um status e um responsável deve atualizar os respectivos totais.
const originalStatus=matrix.getRange('G6').values[0][0];matrix.getRange('G6').values=[['Parcial']];
if(Number(resumo.getRange('B7').values[0][0])!==3||Number(resumo.getRange('B8').values[0][0])!==7)throw new Error('Resumo de status não reagiu');
matrix.getRange('G6').values=[[originalStatus]];matrix.getRange('J6').values=[['Responsável de teste']];
if(Number(resumo.getRange('B16').values[0][0])!==13)throw new Error('Contagem de responsáveis não reagiu');
matrix.getRange('J6').values=[['']];wb.recalculate();
if(Number(resumo.getRange('B11').values[0][0])!==14)throw new Error('Total de riscos incorreto');
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},summary:'Verificação de fórmulas'});console.log(errors.ndjson);
await fs.mkdir(out,{recursive:true});
for(const[name,range,file]of [['Resumo','A1:H18','resumo'],['Resumo','A20:H'+noteRow,'criterios'],['Matriz de Riscos','A5:G10','matriz'],['Matriz de Riscos','H5:P10','acoes'],['Matriz de Riscos','A15:G19','matriz-final'],['Checklist','A5:D11','checklist'],['Checklist','E15:H19','checklist-final']]){const img=await wb.render({sheetName:name,range,scale:1,format:'png'});await fs.writeFile(dir+'/'+file+'.png',new Uint8Array(await img.arrayBuffer()));}
await(await SpreadsheetFile.exportXlsx(wb)).save(out+'/Matriz_Seguranca_PetJoyful_Atualizada.xlsx');
console.log('Exportado: '+out+'/Matriz_Seguranca_PetJoyful_Atualizada.xlsx');

