import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { AccountPage, accountStyles as s } from '@/components/AccountPage';

const questions = [
  [
    'Por que minha sessão terminou?',
    'A sessão pode expirar ou ser invalidada após mudanças de segurança. Entre novamente com seu e-mail e senha. Se a verificação em duas etapas estiver ativa, confirme também o código do autenticador.',
  ],
  [
    'Como ativo a verificação em duas etapas?',
    'No perfil, abra o menu, escolha Segurança e MFA e confirme sua senha. Adicione a chave ao seu autenticador e confirme com o código de 6 dígitos. Guarde os códigos de recuperação.',
  ],
  [
    'Perdi acesso ao autenticador. Como entro?',
    'Depois de informar e-mail e senha, escolha Usar código de recuperação. Cada código pode ser usado uma única vez. Após entrar, gere novos códigos ou reconfigure sua proteção em Segurança e MFA.',
  ],
  [
    'O código do autenticador foi recusado. O que faço?',
    'Use o código da conta Pet Joyful correta e confira o horário automático do celular. Aguarde um novo código se já utilizou o atual. Muitas tentativas podem bloquear temporariamente a verificação. Se o desafio expirar, volte e inicie outro login.',
  ],
  [
    'Como altero minhas informações?',
    'No perfil, escolha Editar perfil. Nome e e-mail são atualizados na conta principal; os dados profissionais são mantidos pelo serviço de perfil. Se houver uma falha parcial, confira o aviso antes de tentar novamente.',
  ],
  [
    'Como excluo minha conta?',
    'No menu do perfil, escolha Excluir conta permanentemente e leia a confirmação. A solicitação só é concluída quando o servidor confirma a exclusão; em caso de falha, o aplicativo exibe o erro.',
  ],
  [
    'Posso entrar usando Google ou Outlook?',
    'Essas opções ainda não estão disponíveis. Use seu e-mail e senha cadastrados.',
  ],
] as const;

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <AccountPage
      title="Perguntas frequentes"
      subtitle="Ajuda para acessar sua conta, cuidar do perfil e manter seus dados protegidos."
    >
      {questions.map(([question, answer], index) => (
        <View style={s.card} key={question}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open === index }}
            style={{ minHeight: 44, justifyContent: 'center' }}
            onPress={() => setOpen(open === index ? null : index)}
          >
            <Text style={s.title}>
              {open === index ? '−' : '+'} {question}
            </Text>
          </Pressable>
          {open === index && <Text style={s.text}>{answer}</Text>}
        </View>
      ))}
      <Link href="/seguranca" style={s.secondary}>
        Abrir segurança e MFA
      </Link>
      <Link href="/privacidade" style={s.secondary}>
        Conhecer meus direitos e dados
      </Link>
    </AccountPage>
  );
}
