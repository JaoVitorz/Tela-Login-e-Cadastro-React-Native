import { TextInput, StyleSheet, TextInputProps } from "react-native" //TextInputProps é um tipo que define as propriedades que o TextInput pode receber, 
// como placeholder, value, onChangeText, etc.    


    
//...rest é um operador de espalhamento que permite passar todas as propriedades recebidas pelo componente Input para o TextInput,
// ou seja, se o componente Input receber uma propriedade placeholder, ela será passada para o TextInput, e assim por diante.
export function Input ({ ...rest}:/*props:*/ TextInputProps) { //props são as propriedades que o componente pode receber, nesse caso, as propriedades do TextInput
  return (
    <TextInput style={styles.input} {...rest} />
  )
}

const styles = StyleSheet.create({
    input: {
width: "100%",
height: 48,
borderWidth: 1,
borderBlockColor: "#DCDCDC",
borderRadius: 8,
fontSize: 16,
paddingLeft: 12,
    },
})