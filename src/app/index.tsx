import {View, StyleSheet, Image, Text, ScrollView, KeyboardAvoidingView, Platform, Alert} from "react-native";
import {useState} from "react";
import { Link } from "expo-router";
import { Input } from "@/components/input";
import { Button } from "@/components/Buttom";


export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

function handleSignIn(){
if (!email.trim() || !password.trim()) {
  return Alert.alert("Erro", "Preencha todos os campos")
}
Alert.alert("Sucesso", "Login realizado com sucesso")
}
return (
<KeyboardAvoidingView style={{flex: 1}} behavior={Platform.select({ios: "padding" , android: "height" })}>
  <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}>
    <View style={styles.container}>
      <Image source={require("@/assets/duke2.png")} style={styles.illustration} />


      <Text style={styles.title}>Entrar </Text>
      <Text style={styles.subtitle}>Acesse sua conta com e-mail e senha.</Text>

      <View style={styles.form}>

        { <Input placeholder="Digite seu E-mail" keyboardType="email-address" onChangeText={setEmail}  /> /*keyboardType é uma propriedade do
        TextInput que define o tipo de teclado que será exibido para o usuário, nesse caso, um teclado específico para
        digitar e-mails, com o símbolo "@" e ".com"
        facilitando a digitação do endereço de e-mail. */ }
        <Input placeholder="Digite sua senha" secureTextEntry onChangeText={setPassword} />
        <Button label="Entrar" onPress={handleSignIn} />
      </View>

      <Text style={styles.footerText}>
        Não tem uma conta? {" "}
        <Link href="/signup" style={styles.footerLink}>
        Cadastra-se aqui.
        </Link>
      </Text>
    </View>
  </ScrollView>
</KeyboardAvoidingView>

)
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: "#f5f4eb",
padding: 32,
},
illustration:{
width: "100%",
height: 330,
marginTop: 62,

},
title: {
fontSize: 32,
fontWeight: 900,
},
subtitle: {
fontSize: 16,

},
form: {
marginTop: 24,
gap: 12,
},
footerText: {
textAlign: "center",
marginTop: 24,
color: "#585860"
},
footerLink: {
color: "#628b68",
fontWeight: 700,
}
})