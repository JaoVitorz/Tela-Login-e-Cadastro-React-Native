import React from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { AccountPage, accountStyles as s } from '@/components/AccountPage';

const sections = [
  [
    'Respeito à comunidade',
    'Trate pessoas e organizações com respeito. Não publique ameaças, assédio, discriminação, golpes ou conteúdo que exponha dados pessoais de terceiros sem autorização.',
  ],
  [
    'Bem-estar animal',
    'Publique informações verdadeiras sobre animais, adoções e eventos. Não incentive maus-tratos, abandono ou práticas que coloquem animais e pessoas em risco.',
  ],
  [
    'Informações e publicações',
    'Mantenha os dados do seu perfil e dos seus eventos atualizados. Use apenas fotos e conteúdos que você tem autorização para compartilhar. Não divulgue documentos pessoais, senhas ou códigos de segurança.',
  ],
  [
    'Segurança da conta',
    'Use uma senha exclusiva e ative a verificação em duas etapas. Não compartilhe sua conta, a chave do autenticador ou os códigos de recuperação. Encerre a sessão em dispositivos compartilhados.',
  ],
  [
    'Responsabilidade nos contatos',
    'Confira as informações de pessoas e organizações antes de combinar adoções ou participar de eventos. A descrição de um perfil não comprova a identidade ou a habilitação profissional de seu responsável.',
  ],
] as const;

export default function Policies() {
  return (
    <AccountPage
      title="Políticas e normas"
      subtitle="Orientações de convivência para uma comunidade que cuida de pessoas e animais."
    >
      {sections.map(([title, text]) => (
        <View style={s.card} key={title}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.text}>{text}</Text>
        </View>
      ))}
      <Link href="/privacidade" style={s.secondary}>
        Privacidade e direitos do usuário
      </Link>
    </AccountPage>
  );
}
