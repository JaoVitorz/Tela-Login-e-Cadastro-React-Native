import React from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { AccountPage, accountStyles as s } from '@/components/AccountPage';

export default function Privacy() {
  return (
    <AccountPage
      title="Privacidade e LGPD"
      subtitle="Entenda os dados usados no aplicativo e as opções disponíveis para sua conta."
    >
      <View style={s.card}>
        <Text style={s.title}>Dados da conta e do perfil</Text>
        <Text style={s.text}>
          O cadastro utiliza nome, e-mail, CPF e senha. O perfil pode incluir foto, biografia,
          telefone, endereço e data de nascimento, conforme o que você preencher. Eventos e outras
          publicações podem conter dados adicionados por você.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.title}>Como o aplicativo usa esses dados</Text>
        <Text style={s.text}>
          Os dados permitem autenticar seu acesso, apresentar e atualizar seu perfil e associar suas
          publicações à sua conta. O aplicativo se comunica com serviços de autenticação, perfil e
          eventos. Evite inserir documentos ou informações privadas em campos de apresentação
          pública.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.title}>Sessão e armazenamento no dispositivo</Text>
        <Text style={s.text}>
          O token de sessão é armazenado no navegador ou no armazenamento seguro do dispositivo. O
          aplicativo também pode manter fotos e capas localmente para exibir seu perfil. Sair da
          conta encerra a sessão neste dispositivo; não exclui sua conta no servidor.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.title}>Seus direitos</Text>
        <Text style={s.text}>
          A LGPD prevê direitos como confirmação e acesso ao tratamento, correção de dados,
          informações sobre compartilhamento e, nas hipóteses legais, eliminação, portabilidade e
          revogação de consentimento. O exercício de cada direito depende das condições e exceções
          da lei.
        </Text>
        <Link
          accessibilityRole="link"
          href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm"
          style={s.secondaryText}
        >
          Consultar a LGPD no site do Planalto
        </Link>
      </View>
      <View style={s.card}>
        <Text style={s.title}>Consultar, corrigir e excluir</Text>
        <Text style={s.text}>
          Consulte e edite suas informações no perfil. Para solicitar a exclusão da conta, abra o
          menu do perfil e escolha Excluir conta permanentemente. Aguarde a confirmação do servidor.
          Esta tela não oferece solicitação automática de portabilidade ou de outros direitos.
        </Text>
        <Link href="/(tabs)/perfil-profissional" style={s.secondary}>
          Ir para meu perfil
        </Link>
      </View>
      <View style={s.card}>
        <Text style={s.title}>Informações complementares</Text>
        <Text style={s.text}>
          Este resumo descreve funções verificadas no aplicativo. O responsável pelo projeto ainda
          deve publicar a identificação do controlador, o canal de atendimento de privacidade, as
          bases legais, os prazos de retenção e os detalhes de compartilhamento. Essas informações
          não foram fornecidas nesta versão.
        </Text>
      </View>
    </AccountPage>
  );
}
