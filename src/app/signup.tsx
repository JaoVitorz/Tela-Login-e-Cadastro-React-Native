import {View, StyleSheet, Image, Text, ScrollView, KeyboardAvoidingView, Platform, Alert} from "react-native";
import {useState} from "react";
import { Link } from "expo-router";
import { Input } from "@/components/input";
import { Button } from "@/components/Buttom";


export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

function handleSignUp(){
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
        return Alert.alert("Erro", "Preencha todos os campos")
    } 
    if (password !== confirmPassword) {
        return Alert.alert("Erro", "As senhas não coincidem")
    }
   
    Alert.alert("Sucesso", "Cadastro realizado com sucesso")
}

return (
<KeyboardAvoidingView style={{flex: 1}} behavior={Platform.select({ios: "padding" , android: "height" })}>
    <ScrollView contentContainerStyle={{flexGrow: 1}}
     keyboardShouldPersistTaps="handled"
     showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
            <Image source={require("@/assets/princesa.png")} style={styles.illustration} />


            <Text style={styles.title}>Cadastrar</Text>
            <Text style={styles.subtitle}>Crie sua conta para acessar</Text>

            <View style={styles.form}>
 
             <Input placeholder="Nome" onChangeText={setName} />
                <Input placeholder="Digite seu E-mail" keyboardType="email-address" onChangeText={setEmail} />
                <Input placeholder="Digite sua senha" secureTextEntry onChangeText={setPassword} />
                <Input placeholder="Confirmar Senha" secureTextEntry onChangeText={setConfirmPassword} />
                <Button label="Cadastrar" onPress={handleSignUp} />
            </View>

            <Text style={styles.footerText}>
                Já tem uma conta? {" "}
                <Link href="/" style={styles.footerLink}>
                Faça login aqui.
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